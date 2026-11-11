"""Cut the self-hosted fonts down to what the app uses.

The fonts in fonts/ came from Google Fonts as variable fonts covering every
weight (Newsreader also every optical size) and, in the latin-ext files, every
Latin script. index.html asks for fewer: each face declares the weights it
uses, and the interface languages need only Latin Extended-A (Czech, Slovak,
Polish) beyond Latin-1. This script keeps exactly that:

- every variable font is limited to the weights its @font-face rules declare
  (the outlines inside that range are unchanged);
- every latin-ext file keeps only U+0100-017F, and index.html says so in its
  unicode-range, so a letter outside it falls back to the next font.

It writes each file as <name>-v2.woff2 next to the original (a file at an
address never changes: fonts are served immutable for a year). Run it on the
original files (git history before November 2026) with fontTools installed:

    pip install fonttools brotli
    python3 scripts/cut-fonts.py

The onboarding headings (.fa-onb-h: 25 px, weight 500) are the only Newsreader
text on the first screen, so they get one static instance of the font, the
variable font at opsz 25 and wght 500: the same letters at a quarter of the
size. `python3 scripts/cut-fonts.py --heading` writes it from the -v2 files as
newsreader-heading-<subset>.woff2; index.html calls it 'Newsreader Heading'.
"""
import re
import sys
from pathlib import Path

from fontTools import subset
from fontTools.ttLib import TTFont
from fontTools.varLib import instancer

ROOT = Path(__file__).resolve().parent.parent
LATIN_EXT_A = range(0x0100, 0x0180)


def declared_weights(css):
    """file name -> (lightest, boldest) weight that index.html asks of it"""
    weights = {}
    for weight, name in re.findall(r"font-weight: ([\d ]+); font-display: swap; src: url\(fonts/([^)]+)\)", css):
        values = [int(w) for w in weight.split()]
        lo, hi = weights.get(name, (min(values), max(values)))
        weights[name] = (min(lo, *values), max(hi, *values))
    return weights


def cut(name, weights):
    font = TTFont(ROOT / 'fonts' / name)
    if '-latin-ext' in name:
        options = subset.Options()
        options.layout_features = ['*']
        options.name_IDs = ['*']
        options.notdef_outline = True
        options.glyph_names = False
        subsetter = subset.Subsetter(options)
        subsetter.populate(unicodes=LATIN_EXT_A)
        subsetter.subset(font)
    if 'fvar' in font:
        axis = next(a for a in font['fvar'].axes if a.axisTag == 'wght')
        lo, hi = max(weights[0], axis.minValue), min(weights[1], axis.maxValue)
        font = instancer.instantiateVariableFont(font, {'wght': (lo, hi) if lo < hi else lo})
    font.flavor = 'woff2'
    target = ROOT / 'fonts' / name.replace('.woff2', '-v2.woff2')
    font.save(target)
    before, after = (ROOT / 'fonts' / name).stat().st_size, target.stat().st_size
    print(f'{target.name}: {before / 1024:.1f} -> {after / 1024:.1f} kB')


# where .fa-onb-h draws Newsreader: 25 px (optical size follows the font size) at weight 500
HEADING = {'opsz': 25, 'wght': 500}


def cut_heading():
    for part in ('latin', 'latin-ext'):
        source = ROOT / 'fonts' / f'newsreader-normal-{part}-v2.woff2'
        font = instancer.instantiateVariableFont(TTFont(source), HEADING)
        font.flavor = 'woff2'
        target = ROOT / 'fonts' / f'newsreader-heading-{part}.woff2'
        font.save(target)
        print(f'{target.name}: {source.stat().st_size / 1024:.1f} -> {target.stat().st_size / 1024:.1f} kB')


def main():
    if sys.argv[1:] == ['--heading']:
        cut_heading()
        return
    css = (ROOT / 'index.html').read_text(encoding='utf-8')
    weights = declared_weights(css)
    names = sys.argv[1:] or sorted(n for n in weights if not n.endswith('-v2.woff2'))
    for name in names:
        cut(name, weights[name])


if __name__ == '__main__':
    main()
