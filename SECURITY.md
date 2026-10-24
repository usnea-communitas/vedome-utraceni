# Security policy

Vědomé utrácení is a static, local-first web app: there is no backend, no database and no account. All user data — plan, expenses, goals, reflections, the optional PIN hash and the language choice — live in the browser's `localStorage`. The attack surface is therefore small, but not zero: the app parses backup files the user imports, exports `.ics` calendar events, registers a service worker and ships third-party code (React).

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
- backup import/export and the PIN lock (note: the PIN is a convenience lock against casual access on a shared device, not encryption of the stored data),
- the service worker's caching behaviour.

Out of scope:

- the hosting platform itself,
- vulnerabilities in dependencies that have no effect on this application (report those upstream; dependency updates are still welcome as pull requests).

## Supported versions

Only the `main` branch and the current production deployment are supported.
