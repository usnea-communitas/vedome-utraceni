# Changelog

Notable changes to Vědomé utrácení (Mindful Spending). The version lives in `package.json` and in `FA_VERSION` (`fa-core.jsx`), is shown under More, and a test keeps the two in step. Each version is also a [GitHub release](https://github.com/usnea-communitas/vedome-utraceni/releases).

## Unreleased

- **Workshop mode:** a link or QR code (`?workshop=1&lang=cs`) opens the app for a financial-literacy workshop. A participant picks one of three made-up stories of young people (Ema, a student with a part-time job; Tomáš and his first paycheck; Lucie, moving in with her boyfriend) and works through five tasks in the ordinary app: split the income, find the leak, set a goal, an unexpected expense (it comes filled in), looking back. Ticked tasks and the story's data are kept under `fa.workshop.*`, so a participant's own plan, language, theme and PIN in the same browser are never read or changed; *End and delete* removes the workshop and opens the participant's own app. It works offline after the first load. *For the facilitator* has the link, a QR code per language, a 45-minute timing and questions for each task. Stories and tasks are in all five languages; the Polish, Ukrainian and Spanish texts await a native speaker's review like the rest.
- Every read and write of the browser's storage now goes through one place (`faStorage` in `fa-storage.jsx`).
- **Plan vs. actual:** the plan belongs to a month and carries over to the next months until it is changed; an item that does not repeat counts only in its month. Expenses no longer raise the plan: the new *Plan vs. actual* card on the Overview and the Reflection shows how much of each category's plan the month has used, and goal deposits count as put aside for *Future me*.
- The old single plan becomes the plan of the current month on the first start, and a copy of it is kept; backups now carry the monthly plans (format 2), and older backups still restore.
- The link under the version line in More is gone, and the preview image shows only the app's names.
- **A plan in one tap:** right after onboarding, the empty plan offers the split chosen there (*Put 50 / 30 / 20 into the plan*, on the Overview and in Plan). Each part becomes one repeating item, *Not split yet*, to break down later, and Undo takes it back. From opening the app to a plan takes eight actions. The parts of the income are rounded so they add up to it exactly (the remainder goes to *Need*), and the empty Overview's English next-step hint names *Need* as the category is called.

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
