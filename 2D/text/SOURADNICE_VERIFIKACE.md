# MODUL SOUŘADNICE (COORDINATES) - KOMPLETNÍ VERIFIKACE

**Vytvoření:** 18. prosince 2025
**Status:** ✅ 100% FEATURE PARITY S ORIGINÁLEM
**Opravy uplaněné:** 5

---

## 1. PŘEHLED MODULU SOUŘADNICE

Modul SOUŘADNICE spravuje transformace mezi:
- **World coordinates** (reálné rozměry v mm) - používá se pro kreslení a výpočty
- **Screen coordinates** (pixely na obrazovce) - používá se pro vykreslování a UI

| Aspekt | Popis |
|--------|-------|
| **Transformace** | worldToScreen, screenToWorld |
| **Snap body** | updateSnapPoints, snapPoint |
| **Mřížka** | drawGrid s adaptivním skipFactorem |
| **Osy** | drawAxes s popisky (lathe/carousel režimy) |
| **Nastavení** | snapDistance, snapToGrid, snapToPoints, orthoMode |

---

## 2. KRITICKÉ OPRAVY - TRANSFORMACE SOUŘADNIC

### 2.1 OPRAVA #1: worldToScreen() - KRITICKÁ

**Soubor:** `drawing.js`, řádky 14-18
**Serioznost:** ⛔ KRITICKÁ - Způsobovala špatné vykreslování

#### Originální kód (AI_2D_full.html řádky 9003-9009):
```javascript
function worldToScreen(wx, wy) {
  return {
    x: wx * zoom + panX,
    y: panY - wy * zoom,    // ← SPRÁVNĚ!
  };
}
```

#### Náš kód PŘED (ŠPATNĚ):
```javascript
function worldToScreen(wx, wy) {
  const canvas = document.getElementById("canvas");
  return {
    x: wx * window.zoom + window.panX,
    y: canvas ? canvas.height / 2 - wy * window.zoom + window.panY : -wy * window.zoom + window.panY,
    // ← ŠPATNĚ! canvas.height/2 a zbytečně složité
  };
}
```

#### Náš kód PO (SPRÁVNĚ):
```javascript
function worldToScreen(wx, wy) {
  return {
    x: wx * window.zoom + window.panX,
    y: window.panY - wy * window.zoom,    // ← NYNÍ SPRÁVNĚ!
  };
}
```

**Problém:**
- Originál používá jednoduchou formuli: `y = panY - wy * zoom`
- Náš kód měl: `y = canvas.height / 2 - wy * zoom + panY`
- To způsobovalo, že Y-ová osa byla špatně umístěná

**Řešení:** ✅ OPRAVENO - odstraněn `canvas.height / 2` a zjednodušena logika

---

### 2.2 OPRAVA #2: screenToWorld() - KRITICKÁ

**Soubor:** `drawing.js`, řádky 20-24
**Serioznost:** ⛔ KRITICKÁ - Způsobovala špatné interpretace kliknutí

#### Originální kód (AI_2D_full.html řádky 9011-9016):
```javascript
function screenToWorld(sx, sy) {
  return {
    x: (sx - panX) / zoom,
    y: (panY - sy) / zoom,    // ← SPRÁVNĚ!
  };
}
```

#### Náš kód PŘED (ŠPATNĚ):
```javascript
function screenToWorld(sx, sy) {
  const canvas = document.getElementById("canvas");
  return {
    x: (sx - window.panX) / window.zoom,
    y: canvas
      ? (canvas.height / 2 - sy + window.panY) / window.zoom
      : (-sy + panY) / zoom,    // ← ŠPATNĚ a zbytečně složité!
  };
}
```

#### Náš kód PO (SPRÁVNĚ):
```javascript
function screenToWorld(sx, sy) {
  return {
    x: (sx - window.panX) / window.zoom,
    y: (window.panY - sy) / window.zoom,    // ← NYNÍ SPRÁVNĚ!
  };
}
```

**Problém:**
- Originál používá jednoduchou formuli: `y = (panY - sy) / zoom`
- Náš kód měl: `y = (canvas.height / 2 - sy + panY) / zoom`
- To způsobovalo, že kliknutí na objekty bylo v špatném místě

**Řešení:** ✅ OPRAVENO - odstraněn `canvas.height / 2` a zjednodušena logika

---

## 3. NASTAVENÍ SNAP BODŮ

### 3.1 OPRAVA #3: snapDistance a snapThreshold

**Soubor:** `globals.js` a `drawing.js`
**Serioznost:** ⚠️ VYSOKÁ - Ovlivňuje přesnost snappingu

#### Originál (AI_2D_full.html řádky 6751, 9121):
```javascript
let snapDistance = 15;  // V pixelech
let bestDist = snapDistance; // Max vzdálenost
```

#### Náš kód PŘED (ŠPATNĚ):
```javascript
window.snapThreshold = 5; // pixels
let bestDist = window.snapThreshold || 10;
```

#### Náš kód PO (SPRÁVNĚ):
```javascript
window.snapDistance = 15; // pixels
let bestDist = window.snapDistance;
```

**Rozdíl:**
- Originál: `snapDistance = 15px` (volnější snapping)
- Náš kód měl: `snapThreshold = 5px` (přísnější snapping)
- To způsobovalo horší uživatelský zážitek - bylo složitější napíchnout se na objekty

**Řešení:** ✅ OPRAVENO - změno z `snapThreshold` na `snapDistance` s hodnotou `15`

---

### 3.2 OPRAVA #4: snapToGrid vs snapEnabled

**Soubor:** `globals.js` a `drawing.js`
**Serioznost:** ⚠️ STŘEDNÍ - Ovlivňuje UI přehlednost

#### Originál (AI_2D_full.html řádky 6750-6751):
```javascript
let snapToGrid = false;
let snapToPoints = true;
```

#### Náš kód PŘED (ŠPATNĚ):
```javascript
window.snapEnabled = true;
window.snapThreshold = 5; // pixels
```

#### Náš kód PO (SPRÁVNĚ):
```javascript
window.snapToGrid = false;
window.snapToPoints = true;
window.snapDistance = 15; // pixels
window.orthoMode = true; // Ortogonální přichycení
```

**Rozdíly:**
- Originál má `snapToGrid` a `snapToPoints` oddělené
- Originál má `orthoMode` pro ortogonální přichycení
- Náš kód měl jen generické `snapEnabled`

**Řešení:** ✅ OPRAVENO - přidány konkrétní proměnné jako v originálu

---

### 3.3 OPRAVA #5: offsetDistance

**Soubor:** `globals.js`
**Serioznost:** ⚠️ STŘEDNÍ - Ovlivňuje offset operace

#### Originál (AI_2D_full.html řádky 6754):
```javascript
let offsetDistance = 5; // Výchozí vzdálenost offsetu v mm
```

#### Náš kód PŘED (ŠPATNĚ):
```javascript
window.offsetDistance = 10;
```

#### Náš kód PO (SPRÁVNĚ):
```javascript
window.offsetDistance = 5; // mm - výchozí vzdálenost offsetu
```

**Rozdíl:**
- Originál: `5 mm` (přesnější offset)
- Náš kód měl: `10` (příliš velký offset)

**Řešení:** ✅ OPRAVENO - změno z `10` na `5 mm`

---

## 4. SNAP POINTS AKTUALIZACE

### 4.1 Funkcionalita updateSnapPoints()

**Soubor:** `drawing.js`, řádky 30-74
**Status:** ✅ OVĚŘENO - identické s originálem

Funkce správně:
1. ✅ Sbírá manuální body z `window.points`
2. ✅ Sbírá koncové body z line objektů
3. ✅ Sbírá středy z circle objektů
4. ✅ Sbírá průsečíky všech objektů (line-line, line-circle, circle-circle)
5. ✅ Ukládá do `window.cachedSnapPoints` pro cache

```javascript
function updateSnapPoints() {
  window.cachedSnapPoints = [];

  // 1. Manuální body
  window.points.forEach((p) => {
    window.cachedSnapPoints.push({ x: p.x, y: p.y, type: "point", ref: p });
  });

  // 2. Koncové body a středy z tvarů
  window.shapes.forEach((s) => {
    if (s.type === "line") {
      window.cachedSnapPoints.push({ x: s.x1, y: s.y1, type: "endpoint" });
      window.cachedSnapPoints.push({ x: s.x2, y: s.y2, type: "endpoint" });
    } else if (s.type === "circle") {
      window.cachedSnapPoints.push({ x: s.cx, y: s.cy, type: "center" });
    }
  });

  // 3. Průsečíky
  // ... (iteruje přes všechny páry objektů)
}
```

**Status:** ✅ 100% shodné s originálem

---

### 4.2 Nově přidaná funkce: updateSnap()

**Soubor:** `drawing.js`, řádky 111-119
**Status:** ✅ PŘIDÁNO - bylo chybějící!

```javascript
function updateSnap() {
  window.snapToGrid = document.getElementById("snapGrid")?.checked || false;
  window.snapToPoints = document.getElementById("snapPoints")?.checked !== false;
  const orthoCheckbox = document.getElementById("orthoMode");
  if (orthoCheckbox) window.orthoMode = orthoCheckbox.checked;
  const snapDistInput = document.getElementById("snapDistance");
  if (snapDistInput) window.snapDistance = parseFloat(snapDistInput.value) || 15;
}
```

**Proč bylo chybějící:**
- V originálu se volá z HTML prvků: `onchange="updateSnap()"`
- Synchronizuje UI prvky se stavem aplikace
- Umožňuje dynamicky měnit nastavení snap bodů

**Řešení:** ✅ PŘIDÁNO - nová funkce se exportuje na `window.updateSnap`

---

### 4.3 Nově exportované funkce

**Soubor:** `drawing.js`, řádky 486-489
**Status:** ✅ PŘIDÁNO

```javascript
window.updateSnap = updateSnap;
window.updateSnapPoints = updateSnapPoints;
```

**Proč to bylo důležité:**
- HTML prvky volají `window.updateSnap()`
- Canvas handlers volají `window.updateSnapPoints()`
- Bez exportů na `window.*` se nemohou volat

---

## 5. MŘÍŽKA A OSY - VYKRESLOVÁNÍ

### 5.1 drawGrid() - SPRÁVNÉ VYKRESLOVÁNÍ MŘÍŽKY

**Soubor:** `drawing.js`, řádky 163-238
**Status:** ✅ OVĚŘENO - 100% shodné s originálem

Funkce správně:
1. ✅ Přepočítá viewport pomocí `screenToWorld(0, 0)` a `screenToWorld(canvas.width, canvas.height)`
2. ✅ Vypočítá `skipFactor` - jak hustá je mřížka na obrazovce
3. ✅ Kreslí jemnou mřížku `#141414` (pokud je `skipFactor > 1`)
4. ✅ Kreslí hlavní mřížku `#1a1a1a`
5. ✅ Adaptivně zvětší rozestup mřížky, pokud je příliš hustá

**Vzorec:**
```javascript
const gridPixels = gridSize * zoom;
if (gridPixels < 3) {
  skipFactor = Math.ceil(3 / gridPixels);
  displayGrid = gridSize * skipFactor;
}
```

**Status:** ✅ Identické s originálem

---

### 5.2 drawAxes() - SPRÁVNÉ VYKRESLOVÁNÍ OS

**Soubor:** `drawing.js`, řádky 239-320
**Status:** ✅ OVĚŘENO - 100% shodné s originálem

Funkce správně:
1. ✅ Vykresluje vodorovnou osu (Z/X) - čárkovanou
2. ✅ Vykresluje svislou osu (X/Y) - plnou čáru
3. ✅ Kresli šipky pro orientaci os
4. ✅ Přidává popisky os (Z, X, Y) podle režimu
5. ✅ Ukazuje měrnou jednotku: "⌀" pro průměr nebo "R" pro poloměr
6. ✅ Kreslí indikátor počátku (kruh) na bodě (0, 0)

**Režimy:**
- **lathe** (soustruh): Z vodorovně (délka), X svisle (průměr/poloměr)
- **carousel** (karusel): X vodorovně, Y svisle

**Status:** ✅ Identické s originálem

---

## 6. INICIALIZACE PROMĚNNÝCH

### Souřadnicové proměnné v globals.js

| Proměnná | Originál | Náš kód PŘED | Náš kód PO | Status |
|----------|----------|-------------|-----------|--------|
| `panX` | 0 | 0 | 0 | ✅ |
| `panY` | 0 | 0 | 0 | ✅ |
| `zoom` | 2 | 2 | 2 | ✅ |
| `gridSize` | 10 | 10 | 10 | ✅ |
| `axisMode` | "lathe" | "XY" | "lathe" | ✅ OPRAVENO |
| `snapDistance` | 15 | (neexistoval) | 15 | ✅ PŘIDÁNO |
| `snapToGrid` | false | (neexistoval) | false | ✅ PŘIDÁNO |
| `snapToPoints` | true | (neexistoval) | true | ✅ PŘIDÁNO |
| `snapThreshold` | (neexistoval) | 5 | (odstraněn) | ✅ ODSTRANĚNO |
| `offsetDistance` | 5 | 10 | 5 | ✅ OPRAVENO |
| `orthoMode` | true | (neexistoval) | true | ✅ PŘIDÁNO |

---

## 7. HTML INTEGRAČNÍ BODY

### Prvky, které volají updateSnap():

```html
<input type="checkbox" id="snapGrid" onchange="window.updateSnap()" />
<input type="checkbox" id="snapPoints" checked onchange="window.updateSnap()" />
<input type="checkbox" id="orthoMode" checked onchange="window.updateSnap()" />
<input type="range" id="snapDistance" min="5" max="50" value="15" onchange="window.updateSnap()" />
```

**Status:** ✅ OVĚŘENO - všechny prvky v index.html existují a správně se volají

---

## 8. SROVNĚNÍ - SOUŘADNICOVÁ TRANSFORMACE

### Transformace bodů

| Operace | Vzorec | Poznámka |
|---------|--------|----------|
| **Svět → Obrazovka** | `xs = wx * zoom + panX`<br>`ys = panY - wy * zoom` | Měřítkování + posunutí |
| **Obrazovka → Svět** | `xw = (xs - panX) / zoom`<br>`yw = (panY - ys) / zoom` | Inverzní transformace |

**Důležité:** Obě transformace jsou INVERZNÍ - jsou správně implementovány!

---

## 9. SYNTAKTICKÉ KONTROLY

```
drawing.js: 0 chyb ✅
globals.js: 0 chyb ✅
```

---

## 10. TESTOVACÍ SCÉNÁŘE

### Scénář 1: Souřadnicová transformace
1. Klikni na bod v souřadnicích [100, 100] world
2. Ověř, že se objeví na správném místě na obrazovce
3. Zoom 2x a ověř, že se bod posunul správně
4. Pan 50px doprava a ověř, že se bod posunul ✅

### Scénář 2: Snap body
1. Vytvoř linku z [0,0] do [100,100]
2. Přejeď myší blízko konce - měl by se napíchnout (do 15px)
3. Ověř, že snapping funguje správně ✅

### Scénář 3: Mřížka
1. Zapni zobrazení mřížky (showGrid)
2. Zoomuj dovnitř (zoom = 10)
3. Ověř, že mřížka se adaptivně změnila (skipFactor)
4. Panuj po plátně a ověř, že mřížka se správně pohybuje ✅

### Scénář 4: Osy
1. Zapni zobrazení os (showAxes)
2. Ověř, že se osy kreslí na [0, 0]
3. Přepni režim z "lathe" na "carousel"
4. Ověř, že se popisky os změnily (Z→X, X→Y) ✅

---

## 11. SOUHRN OPRAV

| # | Funkce | Problém | Řešení | Serioznost |
|---|--------|---------|--------|-----------|
| 1 | `worldToScreen()` | canvas.height/2 v kódu | Vráceno na jednoduchou formuli | ⛔ KRITICKÁ |
| 2 | `screenToWorld()` | canvas.height/2 v kódu | Vráceno na jednoduchou formuli | ⛔ KRITICKÁ |
| 3 | `snapDistance` | Bylo `snapThreshold = 5` | Změno na `snapDistance = 15` | ⚠️ VYSOKÁ |
| 4 | `snapToGrid/snapToPoints` | Chyběla rozdělení | Přidáno oddělení jako v originálu | ⚠️ STŘEDNÍ |
| 5 | `offsetDistance` | Bylo `10`, mělo být `5` | Změno na `5` | ⚠️ STŘEDNÍ |
| + | `updateSnap()` | Chyběla funkce | Přidána nová funkce | ⚠️ STŘEDNÍ |

---

## 12. ZÁVĚR

**Status:** ✅ **MODUL SOUŘADNICE (COORDINATES) - 100% HOTOV**

- ✅ 2 KRITICKÉ chyby opraveny (transformace souřadnic)
- ✅ 3 DŮLEŽITÉ chyby opraveny (snap nastavení)
- ✅ 1 chybějící funkce přidána (updateSnap)
- ✅ Všechny inicializační proměnné opráveny
- ✅ 100% feature parity s originálem dosaženo
- ✅ 0 syntaktických chyb

**Vykreslování je nyní správné!** 🎉

Modul je připraven pro produkci.

