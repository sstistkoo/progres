# ⚠️ Hlavní Slabiny - Vizuální Přehled

> Souhrn kritických problémů Soustružníka 2D

---

## 🔴 KRITICKÉ SLABINY (MUSÍ SE ŘEŠIT)

### #1: Global State Pollution
```
AKTUÁLNĚ:                          IDEÁLNĚ:
───────────────────────────────    ──────────────────────────
window = {                         window = {
  shapes: [],                        Soustruznik: {
  selectedIndex: -1,                   state: {
  mode: 'line',                          shapes: [],
  history: [],                           selectedIndex: -1,
  viewportX: 0,                          mode: 'line',
  zoom: 1.0,                             ...
  canvas: ctx,                         },
  ctx: ctx,                            methods: {
  defaultDrawColor: '#...',              draw: fn,
  dimensionLineColor: '#...',            addShape: fn,
  ... (20+ více)                       ...
}                                    }
                                   }
```

**🔴 Problem:**
- Polluje globální namespace
- Kolize jmen s třetí stranou
- Těžký debugging
- Nelze mít více instancí

**✅ Řešení:** [ACTION_PLAN_1.md](ACTION_PLAN_1.md)

---

### #2: Bez Type Safety
```javascript
// AKTUÁLNĚ - Runtime errors
function distance(p1, p2) {
  return Math.sqrt((p1.x - p2.x) ** 2 + (p1.y - p2.y) ** 2);
}

distance(null, {x:1, y:1});  // ❌ TypeError na runtime!
distance({x:'a'}, {x:1});    // ❌ NaN výsledek, co teď?


// IDEÁLNĚ - Compile-time checking
/**
 * @param {Point} p1
 * @param {Point} p2
 * @returns {number}
 */
function distance(p1, p2) { ... }

distance(null, {x:1, y:1});  // ⚠️ IDE upozorní hned!
```

**🔴 Problem:**
- Runtime errors místo compile-time
- IDE nic neví o typech
- Refactoring je nebezpečný

**✅ Řešení:** Přidat JSDoc - [WEAKNESSES_DETAILED.md](WEAKNESSES_DETAILED.md#-slabina-2-bez-type-safety)

---

### #3: Minimální Test Coverage
```
tests/ měl by zahrnovat:
────────────────────────────────────
❌ distance() - správnost?
❌ intersection() - všechny případy?
❌ tangentToCircle() - edge cases?
❌ addShape() - State consistency?
❌ deleteSelected() - History works?
❌ undo/redo() - Order correct?
❌ drawDimension() - Correct colors?
❌ ... a dalších 20+


CÍLE:
✅ 80%+ code coverage
✅ ~30 unit testů
✅ Regression prevention
✅ Dokumentace přes testy
```

**🔴 Problem:**
- Neznáme co je testováno
- Refactoring je nebezpečný
- Nové bugs se snadno vlezou

**✅ Řešení:** Jest setup - [WEAKNESSES_DETAILED.md](WEAKNESSES_DETAILED.md#-slabina-3-bez-test-coverage)

---

## 🟠 VYSOKÉ PRIORITY

### #4: Bez Input Validation
```javascript
// Bez validace - crash bez warningů
addShape({
  type: 'INVALID_TYPE',       // ✅ Co stane?
  color: 'not-a-hex',         // ✅ Kreslí špatně?
  p1: 'not-a-point',          // ✅ Crash!
  lineWidth: -10              // ✅ Negativ?
});

// TypeError: Cannot read property 'x' of string
// Aplikace padne bez context
```

**🟠 Problem:**
- Aplikace crashuje bez warningů
- Uživatel neví co dělá špatně
- Těžké debugování

**✅ Řešení:** Validation layer - [WEAKNESSES_DETAILED.md](WEAKNESSES_DETAILED.md#-slabina-4-input-validation)

---

### #5: Shape Culling Missing
```
AKTUÁLNĚ:                     CÍLEM:
─────────────────────────────  ──────────────────────
draw() {                       draw() {
  for(let s of shapes) {         for(let s of shapes) {
    drawShape(s);  ❌ VŠE       if(isInViewport(s)) {
  }                              drawShape(s);  ✅ VIDITELNÉ
}                              }
                               }

S 1000 tvary:                S 1000 tvary:
❌ Kreslí 1000 (OFF-SCREEN!)  ✅ Kreslí jen ~50 (VIDITELNÉ)
❌ CPU: 100%, Lag             ✅ CPU: 10%, Smooth 60 FPS
```

**🟠 Problem:**
- S velkým počtem tvarů (1000+) = lag
- CPU hiba 100%
- Renderuje i mimo viewport

**✅ Řešení:** Viewport optimization - [WEAKNESSES_DETAILED.md](WEAKNESSES_DETAILED.md#-slabina-5-shape-culling-optimization)

---

### #6: Error Handling Missing
```javascript
// Bez error boundaries - crash
try {
  drawShape(shape);    // ❌ Neexistuje try-catch
  ctx.stroke();        // ❌ Aplikace selhává
} catch(e) {
  // nic
}

// TypeError: Cannot read property...
// Aplikace padne, ostatní tvary se nerendrují


// Řešení:
try {
  safeDrawShape(shape);  // ✅ Vnitřní try-catch
} catch(err) {
  ErrorBoundary.log(err);
  // Pokračuj se zbytkem
}
```

**🟠 Problem:**
- Jeden bad shape = kolaps celého rendringu
- Ostatní tvary se nekreslí

**✅ Řešení:** Error boundaries - [WEAKNESSES_DETAILED.md](WEAKNESSES_DETAILED.md#-slabina-6-error-handling--boundaries)

---

## 🟡 NIŽŠÍ PRIORITY

### #7: Build Pipeline
```
AKTUÁLNĚ:                    CÍLEM (Webpack):
─────────────────────────    ──────────────────────
index.html     2,175 řádků   app.min.js     45 KB
styles.css     1,600 řádků   app.min.css    12 KB
src/*.js       2,000 řádků   ──────────────────────
────────────────────────     = 57 KB (vs 5,800 řádků)
= 5,800 řádků               = 73% redukce!
(unminified!)
```

**🟡 Problem:**
- Velké soubory = slow load
- Bez optimizace

**✅ Řešení:** Build pipeline - [WEAKNESSES_DETAILED.md](WEAKNESSES_DETAILED.md#-slabina-7-build--minification)

---

### #8: Accessibility
```
AKTUÁLNĚ:                      CÍLEM:
────────────────────────────   ──────────────────────────
<button onclick="...">         <button aria-label="...">
  <span>✋</span>                <span aria-hidden="true">✋</span>
</button>                      </button>

❌ Screenreader neví co je     ✅ Screenreader čte text
❌ WCAG A failure              ✅ WCAG AA compliant
```

**🟡 Problem:**
- Bez ARIA labels
- Screenreadery nefungují

**✅ Řešení:** ARIA labels - [WEAKNESSES.md](WEAKNESSES.md#7-bez-aria-labels)

---

## 📊 Porovnání Priority

```
             Importance  Difficulty  Time     Priority
             ───────────────────────────────────────────
#1 Global    🔴🔴🔴     🔴🔴🔴      🕒🕒🕒  1️⃣  FIRST
#2 Types     🔴🔴🔴     🟠🟠       🕐🕐   2️⃣  SECOND
#3 Tests     🔴🔴🔴     🟠🟠       🕒🕒🕒  3️⃣  THIRD
#4 Validate  🟠🟠       🟠🟠       🕐    4️⃣  NEXT
#5 Culling   🟠🟠       🟠🟠       🕑    5️⃣
#6 Errors    🟠🟠       🟡        🕑    6️⃣
#7 Build     🟡        🟡        🕑    7️⃣
#8 A11y      🟡        🟡        🕑    8️⃣
```

---

## 🎯 Implementační Plán

### TÝDEN 1: KRITICKÉ
```
MON: Přečíst + Plánovat (4h)
     ✅ WEAKNESSES.md
     ✅ ACTION_PLAN_1.md
     ✅ Nastavit environment

TUE-WED: Global State (16h)
     ✅ Refactor globals.js
     ✅ Refactor drawing.js
     ✅ Refactor controller.js
     ✅ Refactor ui.js + canvas.js

THU: Type Safety (8h)
     ✅ Přidat JSDoc na 80% kódu
     ✅ ESLint integrace

FRI: Testing (8h)
     ✅ Jest setup
     ✅ Napsat prvních ~15 testů
     ✅ Coverage check
```

### TÝDEN 2: VYSOKÉ
```
MON-TUE: Validation (6h)
     ✅ Input validators
     ✅ Shape validation

WED: Shape Culling (4h)
     ✅ Viewport optimization

THU: Error Handling (3h)
     ✅ Error boundaries

FRI: Testing & QA (8h)
     ✅ Dalších 15 testů
     ✅ Full regression test
     ✅ Integration test
```

### TÝDEN 3: NIŽŠÍ
```
MON: Build Pipeline (2h)
     ✅ Webpack setup
     ✅ Minification

TUE: CI/CD (3h)
     ✅ GitHub Actions

WED-FRI: Documentation (6h)
     ✅ API docs
     ✅ Migration guide
     ✅ Update README
```

---

## 💡 Klíčové Poučení

### Slabina #1: Global State
```javascript
// Root cause: Monolithic design
window.shapes     ← Pollutace namespace
window.mode       ← Kolize jmen
window.history    ← Hard to trace

// Řešení: Namespaced OOP
window.Soustruznik.state.shapes   ✅
window.Soustruznik.state.mode     ✅
window.Soustruznik.state.history  ✅
```

### Slabina #2: No Types
```javascript
// Root cause: Vanilla JS bez type hints
function addShape(shape) {  // Co je shape?

// Řešení: JSDoc comentáře
/**
 * @param {Line|Circle|Arc} shape
 */
function addShape(shape) {
```

### Slabina #3: No Tests
```javascript
// Root cause: Startup mentality
// "Funguje, tak ať je to"

// Řešení: Confidence confidence
// 80%+ coverage → refactor bez strachu
```

---

## 📚 Dokumentace

```
docs/
├── WEAKNESSES.md              ← ZAČNI TADY (10 min)
├── WEAKNESSES_DETAILED.md     ← Detaily (20 min)
├── ACTION_PLAN_1.md           ← Řešení #1 (30 min)
└── INDEX_WEAKNESSES.md        ← Navigace
```

---

## ✅ Checklist: Co Dělat Teď

- [ ] Přečti [WEAKNESSES.md](WEAKNESSES.md)
- [ ] Prostuduj [ACTION_PLAN_1.md](ACTION_PLAN_1.md)
- [ ] Podívej se na [WEAKNESSES_DETAILED.md](WEAKNESSES_DETAILED.md) (výběr)
- [ ] Rozhodneš se o pořadí priorit
- [ ] Zahej Global State refactor
- [ ] Vytvoř task board v GitHub/Jira
- [ ] Naplánuj týdenní sprinty

---

## 🚀 Motivace na Závěr

Tyto slabiny jsou **reálné, ale řešitelné**. Nejdůležitější je:

1. ✅ **Začít** (tím nejhorším - Global State)
2. ✅ **Jít postupně** (fáze po fázi)
3. ✅ **Testovat** (validace após každé změny)
4. ✅ **Dokumentovat** (co se změnilo a proč)

**Výsledek za 3 týdny:**
- 🟢 Profesionální architektura
- 🟢 Type safety
- 🟢 Test coverage
- 🟢 Scalability

Stojí to za to! 💪

---

*Přehled: 22. prosince 2025*
*Status: AKČNÍ PLÁN JE PŘIPRAVEN*
