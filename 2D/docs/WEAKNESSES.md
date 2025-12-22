# 🔍 Analýza Slabinek - Soustružník 2D

> Identifikované slabiny a jejich řešení

---

## 📊 Přehled Slabinek

| # | Oblast | Slabina | Dopad | Priorita |
|---|--------|---------|-------|----------|
| 1 | **State Management** | Global namespace pollution | Kolize jmen, debugging | 🔴 Vysoká |
| 2 | **Type Safety** | Bez TypeScript/JSDoc | Runtime errors | 🟠 Střední |
| 3 | **Testing** | Minimální code coverage | Regrese, bugs | 🔴 Vysoká |
| 4 | **Error Handling** | Chybí validace vstupů | Crashy, UX | 🟠 Střední |
| 5 | **Documentation** | Bez API documentation | Těžké onboarding | 🟡 Nízká |
| 6 | **Performance** | Bez shape culling | Lag s velkým počtem | 🟠 Střední |
| 7 | **Accessibility** | Bez ARIA labels | Screenreader broken | 🟡 Nízká |
| 8 | **Mobile** | Omezená podpora gesta | Pomalá na mobilech | 🟡 Nízká |
| 9 | **Build** | Bez minifikace/bundlingu | Velké soubory | 🟡 Nízká |
| 10 | **Version Control** | Bez git workflow docs | Chaos v týmu | 🟡 Nízká |

---

## 🔴 KRITICKÉ SLABINY

### 1. Global State Management

**Popis:**
```javascript
window.shapes = [];        // Globální
window.selectedIndex = -1; // Bez namespace
window.mode = "line";      // Konflikty
window.history = [];       // Pollutace
```

**Problém:**
- Možnost kolize jmen s třetí strana knihovnami
- Těžký debugging - neví se, kde se co změní
- Nelze mít více instancí aplikace
- Náchylné na chyby

**Dopad:**
- ⚠️ Integrace s jinými JS knihovnami
- ⚠️ Rozšíření aplikace
- ⚠️ Unit testing

**Řešení:**
```javascript
// ❌ AKTUÁLNĚ
window.shapes = [];

// ✅ ŘEŠENÍ
window.Soustruznik = {
  state: {
    shapes: [],
    selectedIndex: -1,
    mode: "line",
    history: []
  },
  methods: {
    addShape: () => {},
    deleteSelected: () => {}
  }
};
```

**Náročnost:** 🔴 VYSOKÁ (refactor všech modulů)
**Přínos:** 🟢 KRITICKÝ (professionální design)

---

### 2. Bez Type Safety (TypeScript/JSDoc)

**Popis:**
```javascript
// Bez typů - neví se co vrací
function addShape(shape) {  // Co je shape?
  // undefined?
  // {}?
  // {type, color, points}?
}
```

**Problém:**
- Runtime errors místo compile-time
- IDE automplete nefunguje
- Refactoring je nebezpečný
- Dokumentace je jen nápad

**Příklady bugů:**
```javascript
// Toto nefunguje - kdybychom věděli typ
addShape({ type: 'line' });     // Chybí p1, p2
addShape({ p1: {x: 0, y: 0} });  // Chybí p2

// IDE by varovala, že chybí properties
```

**Řešení:**
```javascript
/**
 * @typedef {Object} Point
 * @property {number} x
 * @property {number} y
 */

/**
 * @typedef {Object} Line
 * @property {string} type - 'line'
 * @property {Point} p1 - Počátek
 * @property {Point} p2 - Konec
 * @property {string} color - Hex barva
 * @property {number} lineWidth
 */

/**
 * Přidej nový tvar
 * @param {Line|Circle|Arc} shape - Tvar k přidání
 * @returns {void}
 */
function addShape(shape) { ... }
```

**Náročnost:** 🟠 STŘEDNÍ (přidat JSDoc)
**Přínos:** 🟢 VELKÝ (IDE support, validation)

---

### 3. Minimální Test Coverage

**Popis:**
```bash
# Existují testy, ale...
tests/
├── test-core.cjs       # ❓ Kolik procent?
├── test-drawing.cjs    # ❓ Projdou?
├── test-edits.cjs      # ❓ Jsou aktuální?
└── test-utils.cjs      # ❓ Coverage?
```

**Problém:**
- Neví se, které funkce mají testy
- Nové změny mohou rozbít staré věci
- Refactoring není bezpečný
- QA je ruční (slow)

**Chybějící testy:**
```javascript
// ❌ Bez testů
window.distance()        // Správně počítá?
window.intersection()    // Vždy najde bod?
window.tangentToCircle() // Edge cases?
drawing.drawDimension()  // Správné umístění?
```

**Řešení:**
```javascript
// ✅ Jest testy
describe('Utils', () => {
  test('distance(0,0 to 3,4) = 5', () => {
    expect(window.distance({x:0,y:0}, {x:3,y:4}))
      .toBe(5);
  });

  test('intersection() vrací správný bod', () => {
    const inter = window.intersection(...);
    expect(inter.x).toBe(5);
    expect(inter.y).toBe(5);
  });
});
```

**Náročnost:** 🟠 STŘEDNÍ (psaní testů)
**Přínos:** 🟢 VELKÝ (confidence, regression prevention)

---

## 🟠 VYSOKÉ PRIORITY

### 4. Chybí Input Validation

**Popis:**
```javascript
// Bez validace - cokoliv jde
window.addShape({
  type: 'invalid',      // ✅ Dole se to snaží kreslit?
  color: '12345',       // ✅ Není to CSS barva!
  p1: 'nejednojedna',  // ✅ Není to bod!
  lineWidth: -5         // ✅ Záporná tloušťka?
});
```

**Problém:**
- Aplikace selhává bez chybové zprávy
- Uživatel neví co dělá špatně
- DevTools si musí otevřít
- Crashy v produkci

**Řešení:**
```javascript
function addShape(shape) {
  // Validace typu
  const validTypes = ['line', 'circle', 'arc', 'dimension'];
  if (!validTypes.includes(shape.type)) {
    console.error(`❌ Invalid shape type: ${shape.type}`);
    return;
  }

  // Validace barvy
  if (!/^#[0-9A-F]{6}$/i.test(shape.color)) {
    console.error(`❌ Invalid color: ${shape.color}`);
    return;
  }

  // Validace bodů
  if (!shape.p1 || typeof shape.p1.x !== 'number') {
    console.error(`❌ Missing or invalid p1`);
    return;
  }

  // ... pokud vše OK, přidej
  window.shapes.push(shape);
}
```

**Náročnost:** 🟠 STŘEDNÍ (psaní validací)
**Přínos:** 🟢 VELKÝ (stabilita, UX)

---

### 5. Bez Shape Culling

**Popis:**
```javascript
function draw() {
  // Kreslí se VŠECHNY tvary
  // I když nejsou vidět!
  for (let shape of window.shapes) {
    drawShape(shape);  // ❌ I mimo viewport
  }
}
```

**Problém:**
- S 1000+ tvary = lag
- Canvas engine vykresla i mimo viewport
- CPU hiba 100%

**Řešení:**
```javascript
function draw() {
  // ✅ Kreslí jen viditelné
  for (let shape of window.shapes) {
    if (isInViewport(shape)) {
      drawShape(shape);
    }
  }
}

function isInViewport(shape) {
  // Ověří, zda je tvar v aktuálním viewport
  const bounds = getShapeBounds(shape);
  return !(
    bounds.right < 0 ||
    bounds.left > canvas.width ||
    bounds.bottom < 0 ||
    bounds.top > canvas.height
  );
}
```

**Náročnost:** 🟠 STŘEDNÍ (geometric calculations)
**Přínos:** 🟢 VELKÝ (performance, big projects)

---

## 🟡 NIŽŠÍ PRIORITY

### 6. Bez TypeScript/JSDoc

*(Viz výše - kritická)*

---

### 7. Minimální Accessibility

**Popis:**
```html
<!-- ❌ Bez ARIA labels -->
<button onclick="window.togglePan()">
  <span>✋</span> <!-- Screenreader neví co je to -->
</button>

<!-- ❌ Bez alt text -->
<canvas id="canvas"></canvas>

<!-- ❌ Bez keyboard hints -->
<input type="text" placeholder="Enter API Key">
```

**Řešení:**
```html
<!-- ✅ S ARIA -->
<button
  onclick="window.togglePan()"
  aria-label="Zapnout/vypnout režim posunu"
  title="Posun - Shift pro ruční chyt"
>
  <span aria-hidden="true">✋</span>
  <span class="sr-only">Posun</span>
</button>

<canvas
  id="canvas"
  role="img"
  aria-label="Kreslicí plátno 2D CAD"
></canvas>
```

**Náročnost:** 🟡 NÍZKÁ
**Přínos:** 🟢 STŘEDNÍ (accessibility)

---

### 8. Build Pipeline

**Popis:**
```
📦 Aktuálně
├── index.html (2,175 řádků)
├── styles.css (1,600 řádků)
├── src/*.js (~2,000 řádků)
└── Celkem: ~5,800 řádků

❌ Bez minifikace
❌ Bez bundlingu
❌ Bez tree-shaking
```

**Řešení:**
```bash
# Přidat npm scripts
npm install -D webpack webpack-cli
npm install -D terser-webpack-plugin
npm install -D mini-css-extract-plugin

# webpack.config.js
module.exports = {
  mode: 'production',
  entry: './src/index.js',
  output: {
    filename: 'bundle.min.js',
    path: './dist'
  },
  optimization: {
    minimize: true
  }
};
```

**Náročnost:** 🟡 NÍZKÁ (jednoduché setup)
**Přínos:** 🟢 STŘEDNÍ (performance, production)

---

### 9. Bez Error Boundaries

**Popis:**
```javascript
// Pokud se tady něco rozbije...
try {
  drawShape(shape);  // ❌ Není try-catch
  ctx.stroke();      // ❌ Aplikace selhává
} catch(e) {
  // Nic se neprotokoluje
}
```

**Řešení:**
```javascript
function safeDrawShape(shape) {
  try {
    if (!shape) {
      console.warn('Shape is null/undefined');
      return;
    }

    const bounds = getShapeBounds(shape);
    if (bounds.width < 0.1 || bounds.height < 0.1) {
      console.warn('Shape too small to draw');
      return;
    }

    drawShape(shape);
  } catch(err) {
    console.error(`Error drawing shape:`, err, shape);
    // Logger.report(err);
  }
}
```

**Náročnost:** 🟡 NÍZKÁ
**Přínos:** 🟢 STŘEDNÍ (robustness)

---

## 📋 Akční Plán

### Fáze 1: KRITICKÉ (2-3 týdny)
1. ✅ Type Safety - Přidat JSDoc (všechny moduly)
2. ✅ Test Coverage - Napsat unit testy (~30 testů)
3. ✅ Input Validation - Přidat validace funkcí
4. ✅ Global State - Refactor na namespace

### Fáze 2: VYSOKÉ (1-2 týdny)
5. Shape Culling - Implementovat viewport optimization
6. Error Boundaries - Přidat error handling
7. Accessibility - ARIA labels + keyboard hints

### Fáze 3: NIŽŠÍ (1 týden)
8. Build Pipeline - Webpack/Rollup setup
9. Performance Monitoring - Analytics integrace
10. CI/CD - GitHub Actions workflows

---

## 📊 Metriky Úspěchu

| Metrika | Baseline | Target | Selhání |
|---------|----------|--------|---------|
| Test Coverage | ? | 80%+ | < 60% |
| Type Checking | 0% | 100% JSDoc | < 50% |
| Build Size | 5.8 KB | 2.5 KB minified | > 6 KB |
| Performance | OK | 60 FPS + | < 30 FPS |
| Accessibility | ⚠️ | WCAG AA | WCAG A failure |

---

## 🛠️ Nástroje & Knihovny

```json
{
  "devDependencies": {
    "jest": "^29.0.0",
    "webpack": "^5.0.0",
    "terser-webpack-plugin": "^5.0.0",
    "eslint": "^8.0.0",
    "prettier": "^3.0.0"
  }
}
```

---

## 📚 Reference

- [Global State Management](https://redux.js.org/)
- [Type Safety in JavaScript](https://www.typescriptlang.org/docs/handbook/jsdoc-supported-types.html)
- [Jest Documentation](https://jestjs.io/)
- [Web Accessibility (WCAG)](https://www.w3.org/WAI/WCAG21/quickref/)
- [Performance Best Practices](https://web.dev/performance/)

---

*Analýza: 22. prosince 2025*
*Aktualizace: Při další review*
