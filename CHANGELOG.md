# Changelog

Notable changes to Vědomé utrácení (Mindful Spending). The version lives in `package.json` and in `FA_VERSION` (`fa-core.jsx`), is shown under More, and a test keeps the two in step. Each version is also a [GitHub release](https://github.com/usnea-communitas/vedome-utraceni/releases).

## Unreleased

- **A Czech address** (V-13). The app is Czech at heart, yet its only address said `lang="en"` with an English description and share picture, so a Czech search or a shared link showed an English card. <https://vedome-utraceni.vercel.app/cs/> is the same app with a Czech title, description and share picture (`og-cs.jpg`, the original with its text in Czech), a canonical address, `hreflang` both ways, the app's structured data on both pages and a second entry in the sitemap. Opened there, the app speaks Czech and remembers it; ?lang= and workshop links work as before, the service worker serves each address its own page offline, and English stays the default at /. `npm run compile` writes `cs/index.html` from `index.html` (the host still has no build step).
- **Accessibility checked on every screen** (V-10). The axe check (WCAG 2.1 A and AA) ran only on the workshop screens. `tests/e2e/a11y.test.mjs` now runs it on every onboarding step, the six tabs and every sheet (adding an expense, income, security, reminders, the home-screen guide, how we protect your data, a backup with a password and restoring one), in both themes, in English and Czech, in CI. It found nothing to fix; a list of exceptions with reasons is ready in the test and empty.
- **A demo without filling anything in** (V-12). A facilitator who sees the app for the first time no longer has to go through the onboarding with their own numbers or know the workshop link: *Explore a demo*, a quiet link under *Start* on the welcome screen, opens the first workshop story on the Overview, in the language chosen there, with made-up data kept apart from the visitor's own (the workshop's storage); one more tap puts the story's income into a 50 / 30 / 20 plan. A bar on every screen says it is a demo and ends it; ending deletes the demo and returns to the welcome screen or to the visitor's own app, whose data stays byte for byte the same (tested in English and Czech at 360 px, with axe).
- **Data that does not disappear** (V-09). Once there is something to keep, the app asks the browser to keep the data for good: Safari and Chromium browsers decide without a prompt, Firefox asks after a tap on the privacy page, which now also says whether the browser has promised it and how Safari's seven-day clean-up works. A quiet line on the Overview reminds of a backup two days after the start and 30 days after each backup, saves one in a tap and, in Safari on an iPhone, points to the home screen; it can be hidden for 14 days or turned off under More → Data. A change the browser refuses to store is reported at once with a backup offered, two open tabs keep each other's changes, and damaged data open a calm page that can now restore a backup, with its password if it has one.
- **Only what the app can back up** (V-11). Eight sentences no longer state facts no source supports: the onboarding, the category notes on Tips and two reflection tips now describe what the app does or suggest a step without promising the result.
- **A backup with a password:** under More → Data, *Back up with a password* encrypts the backup right in the browser (AES-256-GCM with a key from PBKDF2-SHA-256, 600,000 rounds), so it can go by email or onto a shared drive. *Restore from backup* recognises such a file and asks for the password; a wrong password or a changed file changes nothing. The plain backup stays as it was.
- **Expenses as a spreadsheet:** a CSV table of every expense (date, name, category, amount in Kč), oldest first, that Excel, Numbers and LibreOffice open with Czech letters intact: it starts with a byte-order mark, separates columns with a semicolon in Czech, Polish, Ukrainian and Spanish and with a comma in English, and keeps a name that starts like a formula as text.
- **How we protect your data:** a new *Privacy* section in More, also in a workshop, shows where the numbers live (this browser, the files you save, nothing on a server) and what is good to know about the PIN, both kinds of backup, another device, deleting and the workshop.
- **Add to home screen:** a short guide under *Mindful Spending* in More, for iPhone (iOS 26 included) and Android, with the phone's own buttons drawn in. It says that a home-screen app on an iPhone keeps its own storage, apart from Safari, and how a backup carries the data over.
- Settings sheets close with Escape, take the focus when they open and give it back to the row that opened them.
- **Tips with sources:** each of the four tips has a fact from a named source, linked under the card with the day it was checked: three come from the Czech Ministry of Finance's 2020 measurement of financial literacy (half of Czechs consider whether they can afford something before buying; 70 % of households use standing orders; 41 % set financial goals), one from Cornell University's research on experiences and things. Facts without a source are gone, and the tip texts claim only what the sources say.
- **The simulator in today's money:** a switch shows the result at 2 % inflation a year, the Czech National Bank's target, with a note that inflation varies (15.1 % in 2022, Czech Statistical Office). The note under the simulator now names its source: the S&P 500 returned about 10 % a year from 1928 to 2025 before inflation (A. Damodaran, NYU Stern).
- **A learning aid, not financial advice:** the Tips screen and the reflection's tip say so.
- `npm run sources:check` opens every source; a monthly workflow writes the result into one issue labelled `source-check`.

## 2.0.0 — 2026-11-12

The third round, live since 10–11 November 2026: the plan belongs to a month, a first plan takes one tap, and the app comes with a workshop mode and a kit for facilitators. It is a major version because the data model changed: plans are kept per month and backups use format 2 (older backups still restore).

- **Plan vs. actual:** the plan belongs to a month and carries over to the next months until it is changed; an item that does not repeat counts only in its month. Expenses no longer raise the plan: the new *Plan vs. actual* card on the Overview and the Reflection shows how much of each category's plan the month has used, and goal deposits count as put aside for *Future me*.
- The old single plan becomes the plan of the current month on the first start, and a copy of it is kept; backups now carry the monthly plans (format 2), and older backups still restore.
- **A plan in one tap:** right after onboarding, the empty plan offers the split chosen there (*Put 50 / 30 / 20 into the plan*, on the Overview and in Plan). Each part becomes one repeating item, *Not split yet*, to break down later, and Undo takes it back. From opening the app to a plan takes eight actions. The parts of the income are rounded so they add up to it exactly (the remainder goes to *Need*), and the empty Overview's English next-step hint names *Need* as the category is called.
- **Workshop mode:** a link or QR code (`?workshop=1&lang=cs`) opens the app for a financial-literacy workshop. A participant picks one of three made-up stories of young people (Ema, a student with a part-time job; Tomáš and his first paycheck; Lucie, moving in with her boyfriend) and works through five tasks in the ordinary app: split the income, find the leak, set a goal, an unexpected expense (it comes filled in), looking back. Ticked tasks and the story's data are kept under `fa.workshop.*`, so a participant's own plan, language, theme and PIN in the same browser are never read or changed; *End and delete* removes the workshop and opens the participant's own app. It works offline after the first load. *For the facilitator* has the link, a QR code per language, a 45-minute timing and questions for each task. Stories and tasks are in all five languages; the Polish, Ukrainian and Spanish texts await a native speaker's review like the rest.
- **A kit for facilitators** in [`docs/workshop/`](docs/workshop/README.md), in Czech and English: a 90-minute lesson plan and a 45-minute version that follows the timing in the app, four printable worksheets, slides, questions to discuss, common problems, an anonymous paper questionnaire and a table of the points of the Czech Financial Literacy Standard (Ministry of Finance, 2017) that the lesson covers, each one quoted and marked as covered, partly covered or not. The Markdown files are the source; `node scripts/workshop-pdf.mjs` makes three PDFs per language, and *For the facilitator* in the app links to them (Polish, Ukrainian and Spanish get the English kit). A test keeps the numbers in the lesson plans and slides in step with the stories the app seeds. The materials are CC BY-NC-SA 4.0.
- **A faster first screen on phones:** the stored fonts are cut to the weights and letters the app uses (1.2 MB → 0.8 MB in all), and the welcome heading has a font of its own (23 kB instead of 90); the backdrop's blurred light and grain fade in once the page has loaded instead of holding back the first screen; a phone no longer draws the device frame first; the service worker registers three seconds after the load; the home-screen icons are small files of their own. The first screen now needs about half the data it did.
- Back buttons are called *Back* again in English (the facilitator's page and onboarding said *Undo*); the Undo button after deleting an expense is *Vrátit zpět* in Czech.
- The link under the version line in More is gone, and the preview image shows only the app's names.
- Every read and write of the browser's storage now goes through one place (`faStorage` in `fa-storage.jsx`).

## 1.3.0 — 2026-11-10

The second improvement round, live since 8 November 2026.

- **Undo:** a deleted expense comes back with the Undo button.
- **Onboarding:** Skip really skips the first goal, and the PIN can be typed on a physical keyboard.
- **Clearer screens:** every screen has one h1 and a proper heading outline (the smoke test checks it); a row shows an arrow only when it opens something, and the tip category cards no longer look like buttons.
- **One name per language:** the app is called *Mindful Spending* in English and goes by one name in every language.
- **Reflection and themes:** the "Tense" band has its own clay colour, darkened in the Wizardly theme so warnings stay readable on parchment; the Wizardly theme keeps its night sky, with still stars, in the calm scene.
- **Live-site check:** after every production deployment a workflow checks that the site serves the deployed build, that every file the service worker caches exists and that onboarding reaches the overview without errors.
- Accessibility check (axe): 43 screens in both themes and two languages, no findings.

## 1.2.0 — 2026-10-25

The first improvement round and the open-source release.

- **Open source (24 October):** MIT for the code, CC BY-NC-SA 4.0 for the media; README with screenshots, contributing guide, code of conduct, security policy and templates; GitHub Actions CI.
- **Languages:** English by default, with the language chosen on the welcome screen or under More → Language; Polish, Ukrainian and Spanish completed (machine-assisted, not yet checked by native speakers); dates and numbers follow the interface language, amounts stay in Kč.
- **Plan and money:** plan amounts are edited in place; typed amounts accept thousands separators and a decimal comma; the year goals on the Overview became real goals, and old ones are migrated; the Overview legend fits narrow phones.
- **Safety:** backups are checked before they are restored; a forgotten PIN has an honest way out; deleting a goal asks first; the app is inert behind the PIN lock; a render error shows a recovery page instead of a blank screen; conservative security headers on Vercel.
- **Accessibility:** tip cards work from the keyboard, controls are labelled, text contrast is at least 4.5:1, the page has landmarks and inactive buttons are really disabled; reduced motion and Save-Data switch to the calm scene, and the forest video loads only after onboarding.
- **Reliability:** a hash-stamped `app.js` and a network-first service worker never mix two versions of the app; the app icon went from 256 kB to 96 kB; unit, translation, build and browser smoke tests run in CI.
- **Desktop:** the phone frame scales to fit laptop screens, and the label above it stays readable.
- **Design tooling:** the Impeccable design skill and review hooks for Claude Code and Codex.

## 1.1.0 — 2026-09-23

- The Overview follows the real current month, with month and year switching; expenses carry a date and are filtered by month; clearer labels and a next step for an empty plan.
- The categories run Need, Fun, Future me; Forest Calm is the default theme, with a new forest video without a watermark.
- Security: a PIN only, stored as a SHA-256 hash; the simulated Face ID is gone.
- Reminders as a calendar file (.ics) instead of notifications that did not work.
- More → Data: back up to a file and restore from a backup.
- Gender-neutral texts in the reflection, tips and simulation; cards and settings rows work from the keyboard with a visible focus.
- The JSX is precompiled into `app.js` with production React from `vendor/` (no Babel in the browser); a service worker for offline use; a meta description and Open Graph tags.

Earlier history is in the git log.
