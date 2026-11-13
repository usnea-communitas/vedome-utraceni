# Security policy

Vědomé utrácení is a static, local-first web app: there is no backend, no database and no account. All user data — plan, expenses, goals, reflections, the optional PIN hash and the language choice — live in the browser's `localStorage`. A workshop (`?workshop=1`) keeps its made-up data under its own `fa.workshop.*` keys and deletes them when it ends; it never reads or changes the participant's own keys. The attack surface is therefore small, but not zero: the app parses backup files the user imports (plain or encrypted with a password), exports `.ics` calendar events and CSV tables, registers a service worker and ships third-party code (React).

## Backups with a password

A backup can be encrypted in the browser before it is saved, with the Web Crypto API and nothing else. The key comes from the password through PBKDF2-SHA-256 with 600,000 rounds and a random 16-byte salt for every backup; the backup is encrypted with AES-256-GCM and a random 12-byte IV. The file holds only the salt, the IV, the number of rounds and the ciphertext; the password is normalised to Unicode NFC (so the same letters typed on another keyboard still match) and is never stored. Nobody can open the backup without it, and a forgotten password cannot be recovered.

- A wrong password, or a file changed after it was made, fails the GCM check before anything is written; the stored data stays as it was. A file that opens is then checked like a plain backup before it replaces anything.
- On import the number of rounds has to lie between 100,000 and 5,000,000, so a crafted file cannot keep a phone busy for minutes.
- The plain backup and the CSV table of expenses are readable files, as the app's privacy page says. In the table, a text that starts like a formula (`=`, `+`, `-`, `@`) gets an apostrophe in front, so a spreadsheet shows it as text.
- Neither format contains the PIN.

## Data that does not disappear

The data live only in the browser's storage, so the app works against losing them quietly:

- Once there is something to keep, it asks the browser for persistent storage (`navigator.storage.persist()`). Safari and Chromium browsers decide by themselves, without a prompt; Firefox shows a prompt, so there the app asks only after a tap on *More → How we protect your data*, which also says whether the browser has promised to keep the data. A workshop on a shared device never asks.
- Safari with its default tracking prevention deletes the data a script stored for a site that has not been used for seven days of using Safari; a web app added to the home screen counts its days separately. The privacy page says so, and in Safari on an iPhone the backup reminder also points to the home screen.
- A quiet line on the Overview reminds of a backup two days after the first data and 30 days after the last backup; it can be hidden for 14 days or turned off under *More → Data*. The date of the last backup is not part of a backup; a restored backup counts from its own date.
- When the browser refuses to store a change (storage full, or site data blocked in its settings), the app says so and offers a backup instead of losing the change without a word.
- Another open tab of the app sees a change at once (the `storage` event), so neither tab writes over the other.
- If damaged data stop the app from rendering, a calm page offers to save the raw data to a file, restore a backup (with its password, if it has one) or start over.

## Reporting a vulnerability

Please do **not** open a public issue for a security problem.

Write to **<martin@usnea.ngo>** with:

- a description of the issue and the affected file,
- steps to reproduce or a proof of concept,
- the impact as you see it.

You will get an acknowledgement within a few days. This is a small volunteer nonprofit project, so there is no bug bounty, but reports are taken seriously, fixed as quickly as possible and credited in the release notes if you wish.

## Scope

In scope:

- the application code in this repository (the `.jsx` sources, `index.html`, `sw.js`),
- the production deployment at <https://vedome-utraceni.vercel.app/>,
- backup import/export, including backups with a password, the CSV export and the PIN lock (note: the PIN is a convenience lock against casual access on a shared device, not encryption of the stored data),
- the service worker's caching behaviour.

Out of scope:

- the hosting platform itself,
- vulnerabilities in dependencies that have no effect on this application (report those upstream; dependency updates are still welcome as pull requests).

## Supported versions

Only the `main` branch and the current production deployment are supported.
