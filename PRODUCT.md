# Product

<!-- impeccable:product-schema 1 -->

> Prepared from what Martin said about the project and from `index.html` and the archived deployment notes. Review and correct anything that does not fit.

## Platform

web

## Users

People who want to sort out their personal money calmly — on their own or in financial-literacy workshops.

## Product Purpose

A financial-literacy app: a calm money plan based on the 50/30/20 rule (what you need, what brings you joy, what you send to your future self), goals, tips and reflections.

## Positioning

A calm money plan in one understandable frame (50/30/20), with data that stays in the user's browser.

## Operating Context

- Installable web app (PWA), full-screen on the phone, portrait.
- Tabs: Overview, Plan, Goals, Tips, Reflection, More; onboarding on first launch.
- Languages: English (default), Czech (original), Polish, Ukrainian, Spanish; chosen on the welcome screen or under More → Language and stored on the device.
- Themes: Forest Calm and Wizard.
- Workshop mode: a link or QR code (`?workshop=1&lang=cs`) opens three made-up stories and five tasks on data kept apart from the participant's own; *End and delete* removes it. The facilitator's page has the link, the QR code, the timing and questions, and links to the facilitator kit (`docs/workshop/`: lesson plans for 90 and 45 minutes, worksheets, slides, a questionnaire and the table against the Czech Financial Literacy Standard; Czech and English, PDF).

## Capabilities and Constraints

- No server and no account; data stay in the browser. Optional PIN lock (a convenience lock, not encryption), gentle reminders as a calendar file, backups (optionally encrypted with a password in the browser), expenses as a CSV table, a page on how the data is protected and a guide to adding the app to the home screen.
- Static site: the `fa-*.jsx` modules are the source, `app.js` is generated from them (`npm run compile`) and must not be edited by hand.
- Deployment: Vercel project `vedome-utraceni`, static root with no build step.

## Brand Commitments

- Name "Vědomé utrácení" (English rendering "Mindful Spending" in metadata); the Czech texts address the user informally ("ty").

## Evidence on Hand

- No references, user quotes or workshop results exist; do not invent them.

## Product Principles

1. Calm: a money plan should soothe, not stress.
2. Privacy: personal finances stay with the user.
3. Honest: every tip names its source and the day it was checked; the app is a learning aid, not financial advice, and says so.
