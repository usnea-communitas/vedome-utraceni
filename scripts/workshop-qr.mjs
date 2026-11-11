// scripts/workshop-qr.mjs — the QR codes the facilitator shows at a workshop:
// one per interface language, each the workshop link in that language. They
// live in assets/ as plain SVG, so the page needs no QR library. Run after the
// address or a language changes:
//
//   node scripts/workshop-qr.mjs
//
// The link must match faWorkshopLink() in fa-workshop.jsx (a unit test checks it).
import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import QRCode from 'qrcode-svg';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const SITE = 'https://vedome-utraceni.vercel.app';

for (const lang of ['cs', 'en', 'pl', 'uk', 'es']) {
  const link = `${SITE}/?workshop=1&lang=${lang}`;
  // whole pixels per module keep the path short; a quiet zone of four modules
  const options = { content: link, ecl: 'M', padding: 4, color: '#1F2A1B', background: '#FFFFFF', join: true, container: 'svg-viewbox' };
  const size = (new QRCode(options).qrcode.getModuleCount() + 8) * 4;
  const svg = new QRCode({ ...options, width: size, height: size }).svg()
    .replace(/^<\?xml[^>]*>\s*/, '')
    .replace(/ style="fill:(#[0-9A-F]+);shape-rendering:crispEdges;"/g, ' fill="$1" shape-rendering="crispEdges"')
    .replace(/ x="0" y="0"(?= fill)/g, '')
    // the link inside the file, for people and for the test
    .replace(/(<svg[^>]*>)/, `$1<desc>${link.replace(/&/g, '&amp;')}</desc>`);
  writeFileSync(join(root, 'assets', `workshop-qr-${lang}.svg`), svg + '\n');
  console.log(`assets/workshop-qr-${lang}.svg: ${link}`);
}
