# Reviewing the translations

Vědomé utrácení (Mindful Spending) speaks five languages. Czech is the source and English the default; **Polish, Ukrainian and Spanish were machine-assisted, and no native speaker has checked them yet.** If you speak one of them natively, your review makes the app usable for real people in workshops. It takes one to two hours per language.

## What you need

- The app in your language: <https://vedome-utraceni.vercel.app/?lang=pl> (or `uk`, `es`). Nothing you type leaves your browser.
- Your file: [`pl.csv`](pl.csv), [`uk.csv`](uk.csv) or [`es.csv`](es.csv) for a spreadsheet, or the same rows to read on GitHub in [`pl.md`](pl.md), [`uk.md`](uk.md), [`es.md`](es.md).

## How to review

1. Open your `.csv` in a spreadsheet (LibreOffice, Excel or Google Sheets; UTF-8, comma-separated).
2. The columns:
   - `cs` – the Czech source. Do not change it: it identifies the row.
   - `en` – the English text, for reference.
   - `pl` / `uk` / `es` – the translation to check. **This is the column you edit.**
   - `where` – the file and line where the text appears in the code. Empty means it is used through a list or not shown at the moment.
   - `note` – your comment, if a change needs explaining.
3. Change a translation when it is wrong, sounds unnatural or is too formal. Leave it as it is when it is fine; an empty cell also means "no change".
4. Keep everything in braces exactly as it is (`{v}`, `{n}`, `{name}` …): the app fills in numbers and names there. Amounts stay in Czech crowns (`Kč`).
5. The tone is calm, warm and informal: the app speaks to one person as a friend would (Czech *ty*, Polish *ty*, Ukrainian *ти*, Spanish *tú*). It never shames or pushes.
6. Save as CSV (UTF-8) and attach it to the GitHub issue for your language, or open a pull request with the changed file.

Thank you! Your name goes into the changelog of the release that carries your review, if you want it there.

## For maintainers

```sh
npm run translations:import -- pl reviewed-pl.csv   # applies changed cells and prints each change
npm run compile && npm test && npm run test:e2e
npm run translations:export                         # refreshes these files after text changes
```

The import changes only the reviewed language's strings in `fa-i18n.jsx`; rows whose Czech source no longer exists are skipped and reported. Commit through a pull request as usual.
