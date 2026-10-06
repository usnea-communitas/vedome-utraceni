# Product

<!-- impeccable:product-schema 1 -->

> Návrh připravený z toho, co Martin o projektu řekl, a z `index.html` a `HERMES_DEPLOY_PROMPT.md`. Zkontroluj a oprav, co nesedí.

## Platform

web

## Users

Lidé, kteří si chtějí v klidu srovnat osobní peníze: samostatně, nebo na workshopech finanční gramotnosti.

## Product Purpose

Aplikace pro finanční gramotnost: klidný plán peněz podle pravidla 50/30/20 (co je potřeba, co tě těší a co posíláš svému budoucímu já), cíle, tipy a reflexe.

## Positioning

Klidný plán peněz v jednom srozumitelném rámci (50/30/20) a data, která zůstávají v prohlížeči uživatele.

## Operating Context

- Instalovatelná webová aplikace (PWA), na telefonu přes celou obrazovku, na výšku.
- Záložky: Přehled, Plán, Cíle, Tipy, Reflexe, Více; při prvním spuštění onboarding.
- Jazyky: čeština (výchozí), angličtina, polština, ukrajinština, španělština.
- Vzhledy: Lesní a Kouzelnický.

## Capabilities and Constraints

- Bez serveru a bez účtu; data zůstávají v prohlížeči. Zabezpečení PIN / Face ID, jemné připomínky, zálohy.
- Statický web: zdrojem jsou moduly `fa-*.jsx`, `app.js` se z nich generuje (`npm run compile`), needitovat ho ručně.
- Nasazení: Vercel projekt `vedome-utraceni`, statický kořen bez build kroku.

## Brand Commitments

- Název „Vědomé utrácení“; texty v češtině oslovují uživatele „ty“.

## Evidence on Hand

- Žádné reference, citace uživatelů ani výsledky z workshopů neexistují; nevymýšlet je.

## Product Principles

1. Klid: plán peněz má uklidňovat, ne stresovat.
2. Soukromí: osobní finance zůstávají u uživatele.
