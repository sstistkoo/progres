# AI Dual-Prompt Systém

## Přehled

Aplikace nyní obsahuje **dva různé AI prompty** podle kontextu:

### 1. 🆕 PROMPT PRO NOVÝ PROJEKT
**Kdy se použije:** Prázdný editor NEBO žádná historie změn

**Co dělá:**
- AI vrací **celý HTML soubor** od `<!DOCTYPE>` až po `</html>`
- Obsahuje kompletní strukturu: `<head>`, `<style>`, `<body>`, `<script>`
- Vše musí být funkční a ready-to-use

**Použití:**
- Tvorba nových single-page aplikací
- První verze projektu
- Když chcete celý kód od začátku

---

### 2. ⚠️ PROMPT PRO EDITACI EXISTUJÍCÍHO KÓDU
**Kdy se použije:** Editor obsahuje kód A existuje historie změn

**Co dělá:**
- AI vrací změny v **EDIT:LINES formátu**
- System automaticky aplikuje změny do kódu
- Funguje undo/redo (Ctrl+Z / Ctrl+Y)

**Formát EDIT:LINES:**
```
\`\`\`EDIT:LINES:5-5
OLD:
<title>Původní název</title>
NEW:
<title>Nový název</title>
\`\`\`

\`\`\`EDIT:LINES:35-37
OLD:
<h2>Původní nadpis</h2>
<p>Původní text</p>
NEW:
<h2>Nový nadpis</h2>
<p>Nový text s více detaily</p>
\`\`\`
```

---

## Technické detaily

### Podmínka přepínání promptu

```javascript
${hasCode && hasHistory ? EDIT_MODE_PROMPT : NEW_PROJECT_PROMPT}
```

**Proměnné:**
- `hasCode` = `currentCode && currentCode.trim().length > 0`
- `hasHistory` = `editor.history.past.length > 0`

### Kdy se použije který prompt?

| Stav editoru | hasCode | hasHistory | Použitý prompt |
|--------------|---------|------------|----------------|
| Prázdný editor | false | false | 🆕 NOVÝ PROJEKT |
| Kód bez historie | true | false | 🆕 NOVÝ PROJEKT |
| Kód s historií | true | true | ⚠️ EDIT MODE |

---

## Příklady použití

### ✅ Scénář 1: Nová aplikace
```
1. Otevři prázdný editor
2. Klikni na AI asistenta
3. Napiš: "Vytvoř kalkulačku"
4. AI vrátí CELÝ HTML soubor
5. Kód se automaticky načte do editoru
```

### ✅ Scénář 2: Úprava existujícího kódu
```
1. Editor obsahuje kód z předchozího kroku
2. Klikni na AI asistenta
3. Napiš: "Změň barvu tlačítek na modrou"
4. AI vrátí EDIT:LINES bloky
5. System automaticky aplikuje změny
6. Funguje Ctrl+Z pro vrácení zpět
```

---

## Výhody tohoto systému

### Pro nové projekty:
✅ Kompletní kód najednou
✅ Vše připraveno k použití
✅ Rychlý start

### Pro editaci:
✅ Žádné zkrácené soubory "...zkráceno"
✅ Jen konkrétní změny
✅ Rychlejší odezva AI
✅ Funguje undo/redo
✅ Historie změn zachována

---

## Řešení problémů

### ❌ AI stále zkracuje kód při editaci
**Příčina:** Prompt se nepřepnul na EDIT mode
**Řešení:** Zkontroluj že `editor.history.past.length > 0`

### ❌ AI vrací EDIT:LINES místo celého souboru
**Příčina:** Editor obsahuje historii z předchozích změn
**Řešení:** Smaž kód nebo restart aplikace

### ❌ Automatické aplikování nefunguje
**Příčina:** AI nepoužilo správný formát
**Řešení:** Zkontroluj že AI vrací přesně `\`\`\`EDIT:LINES:X-Y`

---

## Implementace

### Soubory
- **AIPanel.js** (řádek ~1254): Dual-prompt ternární operátor
- **AIPanel.js** (řádek ~1719): `parseEditInstructions()` parser
- **AIPanel.js** (řádek ~1747): `applyLineEdits()` aplikace změn
- **Editor.js** (řádek ~190): `saveToHistory()` pro undo/redo

### Klíčové funkce

#### parseEditInstructions(text)
```javascript
const regex = /```EDIT:LINES:(\d+)-(\d+)\s+OLD:\s*([\s\S]*?)\s*NEW:\s*([\s\S]*?)\s*```/g;
```
Parsuje EDIT:LINES bloky z AI odpovědi.

#### applyLineEdits(editInstructions)
```javascript
// Uloží současný stav do undo historie
const currentEditorCode = editor.getCode();
editor.history.past.push(currentEditorCode);

// Aplikuje změny
// ...

// Aktualizuje editor
state.set('editor.code', newCode);
```

---

## Changelog

### v2.0 - Dual Prompt System
- ✨ Rozdělení na dva prompty podle kontextu
- 🔧 Automatické přepínání podle `hasCode && hasHistory`
- 📝 Čistší a stručnější prompty
- 🧹 Odstranění redundantních instrukcí

### v1.0 - EDIT:LINES System
- ✨ Parser a aplikace EDIT:LINES formátu
- 🔧 Undo/redo podpora
- 📝 Automatické aplikování změn

---

## Další možnosti

### Volitelné: prompts.js modul
Můžeš vytvořit samostatný soubor s prompty:

```javascript
// src/modules/ai/prompts.js
export const EDIT_MODE_PROMPT = (currentCode) => `...`;
export const NEW_PROJECT_PROMPT = `...`;
export const COMMON_RULES = `...`;
```

A importovat v AIPanel.js:
```javascript
import { EDIT_MODE_PROMPT, NEW_PROJECT_PROMPT } from './prompts.js';
```

**Výhoda:** Lepší organizace kódu
**Nevýhoda:** Další soubor k udržování
