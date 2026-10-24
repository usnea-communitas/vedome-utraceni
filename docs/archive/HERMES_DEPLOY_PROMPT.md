# ⛓️ PROMPT PRO HERMESE — deploy na GitHub + Vercel

> Zkopíruj vše pod čarou a vlož Hermesovi spolu s obsahem této složky.

---

Jsi Hermes, můj implementační agent. Tvým úkolem je nasadit hotovou statickou
webovou aplikaci **„Vědomé utrácení"** na Vercel přes GitHub. NIC v souborech
neměň — nasazuje se 1:1 tak, jak jsou.

## Co je v balíčku
Statická aplikace (žádný build step — React + Babel se načítají v prohlížeči):

```
index.html              ← vstupní bod (celý design systém, obě témata)
fa-*.jsx                ← moduly aplikace (načítané přes <script type="text/babel">)
ios-frame.jsx           ← rámeček telefonu (na mobilu se skryje, app je fullscreen)
tweaks-panel.jsx        ← vývojářský panel (Tweaks)
assets/forest-ambient.mp4   ← video pozadí — Lesní téma
assets/castle-ambient.mp4   ← video pozadí — Kouzelnické téma
manifest.webmanifest    ← PWA manifest (fullscreen na telefonu)
icon.png                ← ikona aplikace
```

## Postup

1. **GitHub repo** `vedome-utraceni`:
   - Smaž v repu VŠECHNY staré soubory (je to kompletní náhrada).
   - Nahraj celý obsah této složky do KOŘENE repa (index.html v rootu,
     složka `assets/` vedle něj). Zachovej přesné názvy souborů včetně
     diakritiky a velikosti písmen — jsou na ně odkazy v index.html.

2. **Vercel**:
   - Import GitHub repa → Framework Preset: **Other** (žádný framework).
   - Build Command: **prázdné** · Output Directory: **prázdné** (root) ·
     Install Command: **prázdné**. Nic se nekompiluje.
   - Deploy.

3. **Ověření po nasazení** (otevři produkční URL):
   - [ ] Stránka se načte bez chyb v konzoli (může trvat ~2 s — Babel překládá v prohlížeči).
   - [ ] Při prvním spuštění se zobrazí **onboarding** (Vítej ve vědomém utrácení).
   - [ ] Po dokončení onboardingu funguje všech 6 záložek: Přehled · Plán · Cíle · Tipy · Reflexe · Více.
   - [ ] Videa na pozadí běží a opakují se plynule (síťový panel: `assets/*.mp4` = 200).
   - [ ] Více → Vzhled: přepnutí Lesní ↔ Kouzelnický funguje.
   - [ ] Více → jazyky: CZ/EN/PL/UK/ES se přepínají.
   - [ ] Více → Zabezpečení: nastavení PIN (2× zadání) / Face ID; po obnovení
         stránky se zobrazí zamykací obrazovka a jde odemknout.
   - [ ] Více → Jemné připomínky: přepínač + frekvence + čas se ukládají.
   - [ ] Více → Měsíční příjem: jde upravit a propisuje se do celé appky.
   - [ ] Na telefonu: „Přidat na plochu" → otevírá se přes celou obrazovku (PWA).

4. Pokud cokoliv z checklistu selže, NEOPRAVUJ kód aplikace — zkontroluj,
   že soubory jsou nahrané kompletně, ve správné struktuře a že Vercel
   nasadil root bez build stepu. Pak mi nahlas, co přesně selhalo.
