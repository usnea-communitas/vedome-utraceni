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

## Capabilities and Constraints

- No server and no account; data stay in the browser. Optional PIN lock (a convenience lock, not encryption), gentle reminders as a calendar file, backups.
- Static site: the `fa-*.jsx` modules are the source, `app.js` is generated from them (`npm run compile`) and must not be edited by hand.
- Deployment: Vercel project `vedome-utraceni`, static root with no build step.

## Brand Commitments

- Name "Vědomé utrácení" (English rendering "Mindful Spending" in metadata); the Czech texts address the user informally ("ty").

## Evidence on Hand

- No references, user quotes or workshop results exist; do not invent them.

## Product Principles

1. Calm: a money plan should soothe, not stress.
2. Privacy: personal finances stay with the user.
