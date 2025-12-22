# 📚 Index Slabinek - Přehled Dokumentace

> Navigace ke všem materiálům o slabinách a jejich řešení

---

## 🗂️ Struktura Dokumentace

```
docs/
├── 📋 WEAKNESSES.md                ← Přehled všech slabink
├── 📋 WEAKNESSES_DETAILED.md       ← Detaily + příklady kódu
├── 🚀 ACTION_PLAN_1.md             ← Konkrétní plán #1: Global State
│
├── 🏗️ ARCHITECTURE.md              ← Design & Structure
├── 📖 API.md                       ← API Reference
└── ... ostatní dokumentace
```

---

## 🎯 Rychlá Navigace

### Chci se dozvědět o slabinách
👉 **[WEAKNESSES.md](WEAKNESSES.md)** (10 min)
- Tabulka všech slabinek
- Priorita a dopad
- Přehled řešení

### Chci detaily a příklady
👉 **[WEAKNESSES_DETAILED.md](WEAKNESSES_DETAILED.md)** (20 min)
- Problém v praxi
- Konkrétní kóvé příklady
- Before/After srovnání
- Performance gain

### Chci konkrétní řešení
👉 **[ACTION_PLAN_1.md](ACTION_PLAN_1.md)** (podrobný plán)
- Global State refactor
- Fáze implementace
- Checklist
- Testing strategie

---

## 📊 Přehled Slabinek

| # | Slabina | Dopad | Plán | Detaily |
|---|---------|-------|------|---------|
| 1 | Global State | 🔴 KRITICKÉ | [Plan #1](ACTION_PLAN_1.md) | [Details](WEAKNESSES_DETAILED.md#-slabina-2-bez-type-safety) |
| 2 | Type Safety | 🔴 KRITICKÉ | TBD | [Details](WEAKNESSES_DETAILED.md#-slabina-2-bez-type-safety) |
| 3 | Test Coverage | 🔴 KRITICKÉ | TBD | [Details](WEAKNESSES_DETAILED.md#-slabina-3-bez-test-coverage) |
| 4 | Input Validation | 🟠 VYSOKÁ | TBD | [Details](WEAKNESSES_DETAILED.md#-slabina-4-input-validation) |
| 5 | Shape Culling | 🟠 VYSOKÁ | TBD | [Details](WEAKNESSES_DETAILED.md#-slabina-5-shape-culling-optimization) |
| 6 | Error Handling | 🟠 VYSOKÁ | TBD | [Details](WEAKNESSES_DETAILED.md#-slabina-6-error-handling--boundaries) |
| 7 | Build Pipeline | 🟡 NÍZKÁ | TBD | [Details](WEAKNESSES_DETAILED.md#-slabina-7-build--minification) |
| 8 | Accessibility | 🟡 NÍZKÁ | TBD | [WEAKNESSES.md](WEAKNESSES.md#7-bez-aria-labels) |

---

## 📈 Implementační Roadmap

### Fáze 1: KRITICKÉ (2-3 týdny)
```
WEEK 1:
├─ [x] Identifikovat slabiny
├─ [x] Psát dokumentaci
├─ [ ] START: Global State Refactor (Plan #1)
└─ [ ] Začít Type Safety (JSDoc)

WEEK 2:
├─ [ ] Ukončit Global State
├─ [ ] Ukončit Type Safety (80%+ JSDoc)
├─ [ ] START: Test Coverage (Jest setup)
└─ [ ] Začít Input Validation

WEEK 3:
├─ [ ] Vytvořit testy (~30 testů)
├─ [ ] Přidvat validace
├─ [ ] Code Review & Testing
└─ [ ] Merge + Deploy
```

### Fáze 2: VYSOKÉ (1-2 týdny)
```
├─ Shape Culling optimization
├─ Error Boundaries
└─ Accessibility improvements
```

### Fáze 3: NIŽŠÍ (1 týden)
```
├─ Build Pipeline (Webpack)
├─ Performance Monitoring
└─ CI/CD Setup (GitHub Actions)
```

---

## 💡 Jak Zaměřit Úsilí?

### Pokud máš 2 hodiny
👉 Přečti si [WEAKNESSES.md](WEAKNESSES.md) (10 min)
👉 Zkus [ACTION_PLAN_1.md](ACTION_PLAN_1.md) (50 min)

### Pokud máš 4 hodiny
👉 Vše z 2 hodin
👉 Přečti si [WEAKNESSES_DETAILED.md](WEAKNESSES_DETAILED.md) (90 min)
👉 Zkus implementovat jednu sekcí z ACTION_PLAN_1

### Pokud máš den
👉 Vše z 4 hodin
👉 Začni s Plan #1 Implementation
👉 Pracuj na Global State refactoru (FÁZE 1-3)

### Pokud máš 2 dny
👉 Začni Plan #1 z 0
👉 Ukončit Global State refactor (VŠECHNY FÁZE)
👉 Začít Type Safety (JSDoc na vybraných souborech)

---

## 🔑 Key Insights

### Slabina #1: Global State ⭐ MOST IMPORTANT
```javascript
// Aktuálně: Pollution
window.shapes = [];
window.selectedIndex = -1;

// Cíl: Namespace
window.Soustruznik.state.shapes
window.Soustruznik.state.selectedIndex
```

✅ **Benefity:**
- Bez kolizí jmen
- Lepší debugování
- Professionální design
- Snadnější testování

📍 **Kde začít:** [ACTION_PLAN_1.md](ACTION_PLAN_1.md)

---

### Slabina #2: Type Safety
```javascript
// Aktuálně: Runtime errors
function distance(p1, p2) { ... }

// Cíl: Compile-time validation
/** @param {Point} p1 */
function distance(p1, p2) { ... }
```

✅ **Benefity:**
- IDE autocomplete
- Přesné chyby
- Dokumentace v kódu
- Snadnější refactoring

📍 **Kde začít:** [WEAKNESSES_DETAILED.md#slabina-2](WEAKNESSES_DETAILED.md#-slabina-2-bez-type-safety)

---

### Slabina #3: Test Coverage
```javascript
// Aktuálně: Bez testů (nebo neznámé)
// Cíl: 80%+ coverage s Jest
```

✅ **Benefity:**
- Detekce regressions
- Confidence v refactoringu
- Dokumentace přes testy
- Kvalitější kód

📍 **Kde začít:** [WEAKNESSES_DETAILED.md#slabina-3](WEAKNESSES_DETAILED.md#-slabina-3-bez-test-coverage)

---

## 📋 Checklist: Co Dělat Dnes?

- [ ] Přečti [WEAKNESSES.md](WEAKNESSES.md)
- [ ] Podívej se na [ACTION_PLAN_1.md](ACTION_PLAN_1.md)
- [ ] Rozhodneš se o priorities
- [ ] Plánuj implementaci
- [ ] Začni s Plan #1 (nebo jiným dle preference)

---

## 🎓 Reference & Zdroje

### Global State Management
- [Redux Pattern](https://redux.js.org/)
- [Flux Architecture](https://facebook.github.io/flux/)
- [Zustand](https://github.com/pmndrs/zustand)

### Type Safety
- [JSDoc Guide](https://jsdoc.app/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [JSDoc Types](https://www.typescriptlang.org/docs/handbook/jsdoc-supported-types.html)

### Testing
- [Jest Documentation](https://jestjs.io/)
- [Testing Library](https://testing-library.com/)
- [Test Pyramid](https://martinfowler.com/bliki/TestPyramid.html)

### Performance
- [Web Vitals](https://web.dev/vitals/)
- [Canvas Performance](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Tutorial/Optimizing_canvas)
- [Shape Culling](https://en.wikipedia.org/wiki/Culling_(computer_graphics))

### Accessibility
- [WCAG 2.1](https://www.w3.org/WAI/WCAG21/quickref/)
- [ARIA](https://www.w3.org/WAI/ARIA/apg/)
- [A11y Project](https://www.a11yproject.com/)

---

## 🚀 Motivace

Tato slabiny jsou **identifikovány, ale řešitelné**.

Refactoring postupem je lépe než nepotvrzovat. Každá fáze bude:
- ✅ Testovaná
- ✅ Dokumentovaná
- ✅ Zpětně kompatibilní
- ✅ Bezpečná

**Začni s Plan #1 - Global State refactor!** 🎯

---

*Index: 22. prosince 2025*
*Status: AKČNÍ PLÁN PŘIPRAVEN*
