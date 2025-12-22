# 🚀 Akční Plán #1 - Refactor Global State

> Řešení kritické slabiny: Global namespace pollution

---

## 📋 Přehled

**Aktuální stav:** Global pollution
```javascript
window.shapes = [];
window.selectedIndex = -1;
window.mode = "line";
window.draw = () => {};
// ... 20+ dalších
```

**Cílový stav:** Namespaced architecture
```javascript
window.Soustruznik = {
  state: { shapes, selectedIndex, mode, ... },
  methods: { draw, addShape, ... }
}
```

**Benefity:**
- ✅ Bez kolizí jmen s třetí stranou
- ✅ Centralizovaný state
- ✅ Snadnější debugging
- ✅ Možnost více instancí

**Náročnost:** 🔴 VYSOKÁ
**Čas:** ~8-10 hodin
**Risk:** STŘEDNÍ (refactor všech modulů)

---

## 🎯 Fáze Implementace

### FÁZE 1: Vytvořit Nový Namespace (2h)

#### Krok 1a: Vytvořit soustruznik.js
```javascript
// src/soustruznik.js - NOVÝ SOUBOR

window.Soustruznik = {
  // ========== STATE ==========
  state: {
    shapes: [],           // Pole všech objektů
    selectedIndex: -1,    // Vybraný tvar (-1 = nic)
    mode: 'line',         // Aktuální režim kreslení
    history: [],          // Undo/Redo stack
    historyIndex: 0,      // Pozice v history

    // Viewport
    viewportX: 0,
    viewportY: 0,
    zoom: 1.0,

    // Canvas
    canvas: null,
    ctx: null,
    width: 0,
    height: 0,

    // Settings
    defaultDrawColor: '#4a9eff',
    defaultDrawLineStyle: 'solid',
    dimensionLineColor: '#ffa500',
    dimensionTextColor: '#ffff99',

    // UI
    panMode: false,
    lastMouseX: 0,
    lastMouseY: 0
  },

  // ========== GETTERS ==========
  get shapes() { return this.state.shapes; },
  get selectedIndex() { return this.state.selectedIndex; },
  get mode() { return this.state.mode; },
  get history() { return this.state.history; },

  // ========== METHODS ==========
  methods: {
    // Drawing
    draw: () => {},
    drawShape: () => {},

    // State Management
    addShape: () => {},
    selectShape: () => {},
    deleteSelected: () => {},
    setMode: () => {},

    // History
    undo: () => {},
    redo: () => {},
    pushHistory: () => {},

    // Canvas
    resetView: () => {},
    togglePan: () => {},

    // Export
    exportPNG: () => {},
    saveToJSON: () => {},
    loadFromJSON: () => {}
  }
};
```

**Výsledek:** Nový soubor s plnou strukturou

---

### FÁZE 2: Migrovat globals.js (2h)

#### Krok 2a: Mapovat globals na Soustruznik
```javascript
// src/globals.js - NOVÝ OBSAH

// Inicializuj namespace
if (!window.Soustruznik) {
  window.Soustruznik = {
    state: {},
    methods: {}
  };
}

// Mapuj staré globální na nový namespace
Object.defineProperty(window, 'shapes', {
  get: () => window.Soustruznik.state.shapes,
  set: (v) => { window.Soustruznik.state.shapes = v; }
});

Object.defineProperty(window, 'selectedIndex', {
  get: () => window.Soustruznik.state.selectedIndex,
  set: (v) => { window.Soustruznik.state.selectedIndex = v; }
});

// ... ostatní properties
```

**Výsledek:** Zpětná kompatibilita - starý kód stále funguje

---

### FÁZE 3: Aktualizovat drawing.js (3h)

#### Krok 3a: Refactor drawing funcí

**Před:**
```javascript
// src/drawing.js - STARÉ
function draw() {
  ctx.clearRect(0, 0, width, height);
  for (let shape of shapes) {
    drawShape(shape);
  }
}

function drawShape(shape) {
  switch(shape.type) {
    case 'line': drawLine(shape); break;
    // ...
  }
}
```

**Po:**
```javascript
// src/drawing.js - NOVÉ
window.Soustruznik.methods.draw = function() {
  const { state } = window.Soustruznik;
  const { ctx, width, height, shapes } = state;

  ctx.clearRect(0, 0, width, height);
  for (let shape of shapes) {
    this.drawShape(shape);
  }
};

window.Soustruznik.methods.drawShape = function(shape) {
  switch(shape.type) {
    case 'line': this.drawLine(shape); break;
    // ...
  }
};
```

**Výsledek:** Všechny drawing funkce v namespace

---

### FÁZE 4: Aktualizovat controller.js (2h)

#### Krok 4a: Shape management funkce

**Před:**
```javascript
function addShape(shape) {
  window.shapes.push(shape);
  window.draw();
}

function deleteSelected() {
  if (window.selectedIndex >= 0) {
    window.shapes.splice(window.selectedIndex, 1);
    window.selectedIndex = -1;
    window.draw();
  }
}
```

**Po:**
```javascript
window.Soustruznik.methods.addShape = function(shape) {
  this.state.shapes.push(shape);
  this.methods.draw.call(this);
};

window.Soustruznik.methods.deleteSelected = function() {
  if (this.state.selectedIndex >= 0) {
    this.state.shapes.splice(this.state.selectedIndex, 1);
    this.state.selectedIndex = -1;
    this.methods.draw.call(this);
  }
};
```

**Výsledek:** Shape management v namespace

---

### FÁZE 5: Aktualizovat ui.js (2h)

#### Krok 5a: UI funcí

**Před:**
```javascript
function setDimensionLineColor(color) {
  window.dimensionLineColor = color;
  localStorage.setItem('dimensionLineColor', color);
  window.draw();
}
```

**Po:**
```javascript
window.Soustruznik.methods.setDimensionLineColor = function(color) {
  this.state.dimensionLineColor = color;
  localStorage.setItem('dimensionLineColor', color);
  this.methods.draw.call(this);
};
```

---

### FÁZE 6: Aktualizovat event handlery (2h)

#### Krok 6a: canvas.js handlery

**Před:**
```javascript
canvas.addEventListener('mousedown', (e) => {
  const worldPos = screenToWorld({x: e.offsetX, y: e.offsetY});
  // ... používá globální window.mode
});
```

**Po:**
```javascript
const app = window.Soustruznik;
canvas.addEventListener('mousedown', (e) => {
  const worldPos = app.methods.screenToWorld({x: e.offsetX, y: e.offsetY});
  // ... používá app.state.mode
});
```

---

### FÁZE 7: Aktualizovat keyboard.js (1h)

#### Krok 7a: Klávesové handlery

**Před:**
```javascript
document.addEventListener('keydown', (e) => {
  if (key === 'ctrl+z') {
    window.undo();
  }
});
```

**Po:**
```javascript
document.addEventListener('keydown', (e) => {
  if (key === 'ctrl+z') {
    window.Soustruznik.methods.undo.call(window.Soustruznik);
  }
});
```

---

## 📝 Migrační Checklist

### Soubor: globals.js
- [ ] Inicializuj window.Soustruznik
- [ ] Mapuj shapes na state.shapes
- [ ] Mapuj selectedIndex na state.selectedIndex
- [ ] Mapuj mode na state.mode
- [ ] Mapuj canvas/ctx na state
- [ ] Mapuj colors na state
- [ ] Mapuj viewport na state

### Soubor: drawing.js (1,665 řádků)
- [ ] Prepiš draw() → methods.draw
- [ ] Prepiš drawShape() → methods.drawShape
- [ ] Prepiš drawLine() → methods.drawLine
- [ ] Prepiš drawCircle() → methods.drawCircle
- [ ] Prepiš drawArc() → methods.drawArc
- [ ] Prepiš drawDimension() → methods.drawDimension
- [ ] Prepiš drawTangent() → methods.drawTangent
- [ ] Prepiš drawPerpendicular() → methods.drawPerpendicular
- [ ] Update references na window.ctx → this.state.ctx
- [ ] Update references na window.shapes → this.state.shapes
- [ ] Update references na window.zoom → this.state.zoom

### Soubor: controller.js (420 řádků)
- [ ] Prepiš addShape() → methods.addShape
- [ ] Prepiš selectShape() → methods.selectShape
- [ ] Prepiš deleteSelected() → methods.deleteSelected
- [ ] Prepiš setMode() → methods.setMode
- [ ] Prepiš undo() → methods.undo
- [ ] Prepiš redo() → methods.redo
- [ ] Prepiš pushHistory() → methods.pushHistory
- [ ] Update všechny state references

### Soubor: ui.js (1,187 řádků)
- [ ] Prepiš setDimensionLineColor() → methods
- [ ] Prepiš setDimensionTextColor() → methods
- [ ] Prepiš initializeDefaultSettings() → methods
- [ ] Prepiš initializeDimensionSettings() → methods
- [ ] Prepiš showModal() → methods
- [ ] Prepiš hideModal() → methods
- [ ] Update referencias na window functions

### Soubor: canvas.js (512 řádků)
- [ ] Update addEventListener handlery
- [ ] Update references na window.mode
- [ ] Update references na window.shapes
- [ ] Update screenToWorld → methods.screenToWorld
- [ ] Update worldToScreen → methods.worldToScreen

### Soubor: keyboard.js (307 řádků)
- [ ] Update klávesové handlery
- [ ] Update calls na window.setMode()
- [ ] Update calls na window.undo()
- [ ] Update calls na window.deleteSelected()

### Soubor: ai.js (287 řádků)
- [ ] Update API initialization
- [ ] Update methods references
- [ ] Update state references

### Soubor: init.js (207 řádků)
- [ ] Update initializeApp() call na Soustruznik method
- [ ] Update všechny initializations

### Soubor: index.html
- [ ] Přidat script pro soustruznik.js (první!)
- [ ] Update všechny onclick handlers na window.Soustruznik

---

## 🧪 Testing Strategy

### Regression Testing
```javascript
// test-namespace-migration.js

describe('Namespace Migration', () => {
  test('window.Soustruznik exists', () => {
    expect(window.Soustruznik).toBeDefined();
  });

  test('State properties accessible', () => {
    expect(window.Soustruznik.state.shapes).toBeDefined();
    expect(Array.isArray(window.Soustruznik.state.shapes)).toBe(true);
  });

  test('Methods callable', () => {
    expect(typeof window.Soustruznik.methods.addShape).toBe('function');
    expect(typeof window.Soustruznik.methods.draw).toBe('function');
  });

  test('Backward compatibility (window.shapes)', () => {
    window.shapes = [{type: 'line'}];
    expect(window.Soustruznik.state.shapes[0].type).toBe('line');
  });

  test('Drawing works', () => {
    window.Soustruznik.state.shapes.push({
      type: 'line',
      p1: {x: 0, y: 0},
      p2: {x: 10, y: 10}
    });
    expect(() => {
      window.Soustruznik.methods.draw.call(window.Soustruznik);
    }).not.toThrow();
  });
});
```

---

## 📊 Risk Assessment

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|-----------|
| Feature break | 🟠 STŘEDNÍ | 🔴 VYSOKÝ | Backward compat |
| Performance | 🟢 NÍZKÁ | 🟡 STŘEDNÍ | Object access |
| Compatibility | 🟠 STŘEDNÍ | 🟠 STŘEDNÍ | Careful refactor |

---

## ⏱️ Timeline

```
FÁZE 1: Namespace Setup        [████] 2h
FÁZE 2: Migrate globals.js     [████] 2h
FÁZE 3: Refactor drawing.js    [██████] 3h
FÁZE 4: Refactor controller.js [████] 2h
FÁZE 5: Refactor ui.js         [████] 2h
FÁZE 6: Update event handlers  [████] 2h
FÁZE 7: Keyboard handlers      [██] 1h
Testing & Debugging            [████] 2h
─────────────────────────────────────
Celkem: ~16 hodin (2 pracovní dny)
```

---

## ✅ Acceptance Criteria

- [ ] Všechny funkce fungují přes namespace
- [ ] Zpětná kompatibilita zachována
- [ ] Všechny testy zelené
- [ ] DevTools console clean (bez warningů)
- [ ] Performance stejné nebo lepší
- [ ] Dokumentace aktualizována
- [ ] PR review a merge

---

*Plan: 22. prosince 2025*
*Status: READY FOR IMPLEMENTATION*
