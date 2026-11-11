# Facilitator kit · Sada pro lektory

Everything needed to run a lesson on the 50 / 30 / 20 money plan with the app's workshop mode (`?workshop=1`): a 90-minute and a 45-minute lesson plan, printable worksheets, slides, questions to discuss, common problems, an anonymous paper questionnaire and a table of the points of the Czech Financial Literacy Standard (Ministry of Finance, 2017) that the lesson covers. In Czech and English.

Vše pro lekci o plánu peněz 50 / 30 / 20 s workshopovým režimem aplikace (`?workshop=1`): plán lekce na 90 a 45 minut, pracovní listy k tisku, snímky, otázky k diskusi, časté potíže, anonymní papírový dotazník a tabulka bodů Standardu finanční gramotnosti (Ministerstvo financí, 2017), které lekce pokrývá. Česky a anglicky.

## PDF

| | Česky | English |
|---|---|---|
| Lesson guide · průvodce lekcí (both plans, questions, problems, the Standard) | [vedome-utraceni-pro-lektory-cs.pdf](pdf/vedome-utraceni-pro-lektory-cs.pdf) | [mindful-spending-facilitator-guide-en.pdf](pdf/mindful-spending-facilitator-guide-en.pdf) |
| Worksheets and questionnaire · pracovní listy a dotazník (A4, to print) | [vedome-utraceni-pracovni-listy-cs.pdf](pdf/vedome-utraceni-pracovni-listy-cs.pdf) | [mindful-spending-worksheets-en.pdf](pdf/mindful-spending-worksheets-en.pdf) |
| Slides · snímky (16:9) | [vedome-utraceni-snimky-cs.pdf](pdf/vedome-utraceni-snimky-cs.pdf) | [mindful-spending-slides-en.pdf](pdf/mindful-spending-slides-en.pdf) |

The PDFs are also on the app's site, linked from Workshop → For the facilitator: `https://vedome-utraceni.vercel.app/docs/workshop/pdf/…`.

## Sources · zdroje

| | Česky | English |
|---|---|---|
| Lesson, 90 minutes | [lekce-90-minut.md](cs/lekce-90-minut.md) | [lesson-90-minutes.md](en/lesson-90-minutes.md) |
| Lesson, 45 minutes | [lekce-45-minut.md](cs/lekce-45-minut.md) | [lesson-45-minutes.md](en/lesson-45-minutes.md) |
| Worksheets | [pracovni-listy.md](cs/pracovni-listy.md) | [worksheets.md](en/worksheets.md) |
| Slides | [snimky.md](cs/snimky.md) | [slides.md](en/slides.md) |
| Questions to discuss | [otazky-k-diskusi.md](cs/otazky-k-diskusi.md) | [discussion-questions.md](en/discussion-questions.md) |
| Common problems | [caste-potize.md](cs/caste-potize.md) | [common-problems.md](en/common-problems.md) |
| Questionnaire | [dotaznik.md](cs/dotaznik.md) | [questionnaire.md](en/questionnaire.md) |
| The Financial Literacy Standard | [standard-financni-gramotnosti.md](cs/standard-financni-gramotnosti.md) | [financial-literacy-standard.md](en/financial-literacy-standard.md) |

The Markdown files are the source. After changing them, run `node scripts/workshop-pdf.mjs` (Chromium through Playwright, `npx playwright install chromium` once) and commit the PDFs with them. `npm test` checks that both languages have the same documents, that every PDF is there and fits its pages, and that the numbers in the plans and slides are the ones the app's stories seed (`fa-workshop.jsx`): change a story, and the test says what to update.

Nothing in the kit needs an account or collects data. The stories are made up and the amounts illustrative; the questionnaire is anonymous and stays with the facilitator. No results of workshops exist yet; the first pilot will show what to improve.

## Licence

The materials of the kit (the Markdown files and the PDFs) are licensed under [CC BY-NC-SA 4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/), © Martin Pazderník, like the app's media ([LICENSE-ASSETS.md](../../LICENSE-ASSETS.md)). Schools, community organisations and financial-literacy educators may use them free of charge; credit *Vědomé utrácení — Martin Pazderník*, indicate changes and share adaptations under the same licence.

Materiály sady (soubory Markdown i PDF) jsou pod licencí CC BY-NC-SA 4.0, © Martin Pazderník. Školy, komunitní organizace a lektoři finanční gramotnosti je smějí používat zdarma s uvedením autora, označením změn a sdílením úprav pod stejnou licencí.
