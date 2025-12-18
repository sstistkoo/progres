# 🔍 Kontrola Funkcí Tlačítek - Detailní Srovnání

## Problémy Nalezené

### ❌ CHYBÍ V MODULU - Grid Spacing Buttons

V originálním 2D_AI.html řádky 3051, 3066, 3081, 3096:
```html
<button onclick="setGridSpacing(0.1)">...</button>
<button onclick="setGridSpacing(1)">...</button>
<button onclick="setGridSpacing(5)">...</button>
<button onclick="setGridSpacing(10)">...</button>
```

**Status:** Funkce `window.setGridSpacing()` existuje v drawing.js, ale HTML tlačítka NEJSOU v index.html!

**Řešení:** Chybí tlačítka s grid spacing v sekci "Other" > "Display"

---

### ❌ CHYBÍ V MODULU - Import SimDxf Input

V originálním 2D_AI.html řádek 2757:
```html
<button onclick="document.getElementById('importSimDxfInput').click()">...</button>
...
<input type="file" id="importSimDxfInput" accept=".dxf" ... />
```

**Status:** V modulu nemáme `importSimDxfInput`

**Řešení:** Chybí tlačítko pro import SimDxf souboru

---

### ⚠️ CHYBÍ - Kategorie AI v Toolbaru

V originálním 2D_AI.html řádek 3343:
```html
<button onclick="window.showToolCategory('ai')">...</button>
```

**Status:** V modulu nemáme AI kategorii v toolbaru!

**Řešení:** Chybí tlačítko na zobrazení AI nástrojů

---

### ❌ NEKONZISTENCE - Funkce Bez `window.` Prefixu

V originálním souboru se funcí bez `window.` používají (ale fungují kvůli globálnímu scope):
- `toggleCoordSection()` - řádka 2114, 2208, 2345, 2457, 2786, 2974
- `setPointFromCursor()` - řádka 2172
- `quickAddPoint()` - řádka 2187
- `setLineStart()` - řádka 2265
- `setLineEnd()` - řádka 2311
- `addLineByCoords()` - řádka 2325
- `setCircleCenter()` - řádka 2404
- `quickAddCircle()` - řádka 2437
- `addLinePolar()` - řádka 2561
- `addPointPolar()` - řádka 2576
- `setGridSpacing()` - řádky 3051, 3066, 3081, 3096
- `undo()`, `clearAll()`, `exportPNG()`, `saveProject()` - řádky 2704, 2713, 2722, 2735

V modulu jsme konzistentně používáme `window.` prefix, což je OK a vlastně lepší.

---

## Status Po Kontrole

### ✅ Funkce, které jsou správně:
- [x] `window.togglePan()`, `window.resetView()`, `window.undo()`, `window.redo()`
- [x] `window.toggleAiSelect()`, `window.openQuickInput()`, `window.aiUndo()`, `window.aiRedo()`
- [x] `window.toggleVoice()`, `window.clearSelection()`, `window.clearImage()`
- [x] `window.setMode()` - všechny módy (line, circle, arc, point, tangent, perpendicular, parallel, trim, extend, offset, mirror, erase, measure, dimension, align, rotate)
- [x] `window.showConstraintModal()`, `window.deleteAllDimensions()`, `window.dimensionAll()`
- [x] `window.toggleCoordSection()` - s window. prefix
- [x] `window.setPointFromCursor()`, `window.quickAddPoint()`, `window.setLineStart()`, `window.setLineEnd()`, `window.addLineByCoords()`
- [x] `window.setCircleCenter()`, `window.quickAddCircle()`
- [x] `window.addLinePolar()`, `window.addPointPolar()`
- [x] `window.setMode('align')`, `window.setMode('rotate')`
- [x] `window.showColorPicker()`
- [x] `window.booleanUnion()`, `window.booleanIntersect()`, `window.booleanDifference()`
- [x] `window.clearAll()`, `window.exportPNG()`, `window.saveProject()`
- [x] `window.setGridSpacing()` - **FUNKCE EXISTUJE ale tlačítka chybí**
- [x] `window.showControllerModal()`, `window.setControllerMode()`, `window.insertControllerToken()`, `window.clearControllerInput()`, `window.confirmControllerInput()`

### ❌ CHYBÍ V HTML:
1. **Grid Spacing tlačítka** (0.1, 1, 5, 10)
2. **Import SimDxf button** (`importSimDxfInput`)
3. **AI kategorii tlačítko** v bottom toolbar

### ⚠️ VŠIMLI SI:
- V originálním: `setLineStart()`, `setLineEnd()`, `quickAddPoint()` atd. bez `window.`
- V modulu: `window.setLineStart()`, `window.setLineEnd()`, `window.quickAddPoint()` atd. s `window.`
- **Tohle je OK** - oba přístupy fungují, náš je lepší (explicitní).

---

## Zbývajících Chybějících Prvků:

```
V originálním 2D_AI.html existují:
- setGridSpacing() tlačítka (4x)
- importSimDxfInput
- showToolCategory('ai') button
- Polární souřadnice sekce (coordPolar)
```

```
V modulu 2D/index.html CHYBÍ:
- setGridSpacing() tlačítka (4x) ❌
- importSimDxfInput ❌
- showToolCategory('ai') button ❌
- Polární souřadnice sekce (coordPolar) ✓ (je tam toggleCoordSection('coordPolar'))
```

---

## Doporučení:

1. ✅ Přidat Grid Spacing tlačítka do sekce "Other" → "Display"
2. ✅ Přidat Import SimDxf button do sekce "Other" → "Display"
3. ✅ Přidat AI kategorii tlačítko do bottom toolbar
4. ✅ Implementovat `window.loadProject()` pokud ještě není
5. ✅ Implementovat `window.saveProject()` pokud ještě není

---

## Shrnutí:
**Hlavní chybějící prvky: 3 položky (Grid spacing buttons, Import button, AI toolbar button)**

Všechny funkce v JavaScript existují! Jen chybí HTML tlačítka pro některé z nich.
