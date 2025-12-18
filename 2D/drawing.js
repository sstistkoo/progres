/**
 * DRAWING.JS - Kreslicí engine a geometrické operace
 * - Canvas rendering
 * - Shape management
 * - Intersection calculations
 * - Snap points
 */

// Globální proměnné jsou inicializovány v globals.js
// Pouze se zde odkažují!

// ===== COORDINATE CONVERSION =====

function worldToScreen(wx, wy) {
  const canvas = document.getElementById("canvas");
  return {
    x: wx * window.zoom + window.panX,
    y: canvas ? canvas.height / 2 - wy * window.zoom + window.panY : -wy * window.zoom + window.panY,
  };
}

function screenToWorld(sx, sy) {
  const canvas = document.getElementById("canvas");
  return {
    x: (sx - window.panX) / window.zoom,
    y: canvas
      ? (canvas.height / 2 - sy + window.panY) / window.zoom
      : (-sy + panY) / zoom,
  };
}

// ===== SNAP POINTS & GEOMETRY =====

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
  for (let i = 0; i < window.shapes.length; i++) {
    for (let j = i + 1; j < window.shapes.length; j++) {
      const s1 = window.shapes[i];
      const s2 = window.shapes[j];
      let intersects = [];

      if (s1.type === "line" && s2.type === "line") {
        const pt = lineIntersection(s1, s2);
        if (pt) intersects.push(pt);
      } else if (s1.type === "line" && s2.type === "circle") {
        intersects = intersectLineCircle(s1, s2);
      } else if (s1.type === "circle" && s2.type === "line") {
        intersects = intersectLineCircle(s2, s1);
      } else if (s1.type === "circle" && s2.type === "circle") {
        intersects = intersectCircleCircle(s1, s2);
      }

      intersects.forEach((pt) => {
        window.cachedSnapPoints.push({ x: pt.x, y: pt.y, type: "intersection" });
      });
    }
  }
}

function snapPoint(pt) {
  let snapped = { ...pt };
  let snapInfo = null;

  let bestDist = window.snapThreshold || 10;  // Use global snapThreshold from globals.js

  for (let p of window.cachedSnapPoints) {
    const screenP = worldToScreen(p.x, p.y);
    const screenPt = worldToScreen(pt.x, pt.y);
    const dist = Math.sqrt(
      (screenP.x - screenPt.x) ** 2 + (screenP.y - screenPt.y) ** 2
    );

    if (dist < bestDist) {
      bestDist = dist;
      snapped = { x: p.x, y: p.y };
      snapInfo = { type: p.type, x: p.x, y: p.y };
    }
  }

  if (!snapInfo && window.snapEnabled) {
    const gx = Math.round(pt.x / window.gridSize) * window.gridSize;
    const gy = Math.round(pt.y / window.gridSize) * window.gridSize;
    const screenG = worldToScreen(gx, gy);
    const screenPt = worldToScreen(pt.x, pt.y);
    const dist = Math.sqrt(
      (screenG.x - screenPt.x) ** 2 + (screenG.y - screenPt.y) ** 2
    );

    if (dist < bestDist) {
      snapped.x = gx;
      snapped.y = gy;
      snapInfo = { type: "grid", x: gx, y: gy };
    }
  }

  return { point: snapped, snapInfo };
}

// ===== RENDERING =====

function draw() {
  const canvas = document.getElementById("canvas");
  const ctx = canvas.getContext("2d");

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (document.getElementById("showGrid")?.checked) {
    drawGrid(ctx, canvas);
  }

  if (document.getElementById("showAxes")?.checked) {
    drawAxes(ctx, canvas);
  }

  // Nakreslit tvary
  window.shapes.forEach((s) => drawShape(ctx, s, canvas));

  // Nakreslit body
  if (document.getElementById("showPoints")?.checked) {
    window.cachedSnapPoints.forEach((p) => {
      const sp = worldToScreen(p.x, p.y);
      ctx.beginPath;

      if (p.type === "point") {
        ctx.fillStyle = "#ff4444";
        ctx.arc(sp.x, sp.y, 4, 0, Math.PI * 2);
      } else if (p.type === "intersection") {
        ctx.fillStyle = "#ffffff";
        ctx.arc(sp.x, sp.y, 3, 0, Math.PI * 2);
      } else {
        ctx.fillStyle = "#a0a0a0";
        ctx.arc(sp.x, sp.y, 3, 0, Math.PI * 2);
      }
      ctx.fill();
    });
  }
}

function drawGrid(ctx, canvas) {
  const tl = screenToWorld(0, 0);
  const br = screenToWorld(canvas.width, canvas.height);

  const gridPixels = gridSize * zoom;

  let displayGrid = gridSize;
  let skipFactor = 1;

  if (gridPixels < 3) {
    skipFactor = Math.ceil(3 / gridPixels);
    displayGrid = gridSize * skipFactor;
  }

  // Sekundární mřížka
  if (skipFactor > 1 && gridPixels * 5 >= 3) {
    ctx.strokeStyle = "#141414";
    const fineGrid = gridSize * Math.min(5, skipFactor);
    const sx = Math.floor(Math.min(tl.x, br.x) / fineGrid) * fineGrid;
    const ex = Math.ceil(Math.max(tl.x, br.x) / fineGrid) * fineGrid;
    const sy = Math.floor(Math.min(tl.y, br.y) / fineGrid) * fineGrid;
    const ey = Math.ceil(Math.max(tl.y, br.y) / fineGrid) * fineGrid;

    for (let x = sx; x <= ex; x += fineGrid) {
      const p = worldToScreen(x, 0);
      ctx.beginPath();
      ctx.moveTo(p.x, 0);
      ctx.lineTo(p.x, canvas.height);
      ctx.stroke();
    }

    for (let y = sy; y <= ey; y += fineGrid) {
      const p = worldToScreen(0, y);
      ctx.beginPath();
      ctx.moveTo(0, p.y);
      ctx.lineTo(canvas.width, p.y);
      ctx.stroke();
    }
  }

  // Hlavní mřížka
  ctx.strokeStyle = "#1a1a1a";
  ctx.lineWidth = 1;

  const sx = Math.floor(Math.min(tl.x, br.x) / displayGrid) * displayGrid;
  const ex = Math.ceil(Math.max(tl.x, br.x) / displayGrid) * displayGrid;
  const sy = Math.floor(Math.min(tl.y, br.y) / displayGrid) * displayGrid;
  const ey = Math.ceil(Math.max(tl.y, br.y) / displayGrid) * displayGrid;

  for (let x = sx; x <= ex; x += displayGrid) {
    const p = worldToScreen(x, 0);
    ctx.beginPath();
    ctx.moveTo(p.x, 0);
    ctx.lineTo(p.x, canvas.height);
    ctx.stroke();
  }

  for (let y = sy; y <= ey; y += displayGrid) {
    const p = worldToScreen(0, y);
    ctx.beginPath();
    ctx.moveTo(0, p.y);
    ctx.lineTo(canvas.width, p.y);
    ctx.stroke();
  }

  ctx.fillStyle = "#4a4a4a";
  ctx.font = "11px Arial";
  const gridLabel = gridSize >= 1 ? `${gridSize}mm` : `${gridSize.toFixed(2)}mm`;
  const displayLabel =
    skipFactor > 1
      ? `Mřížka: ${gridLabel} (zobrazeno každý ${skipFactor}.)`
      : `Mřížka: ${gridLabel}`;
  ctx.fillText(displayLabel, 10, canvas.height - 40);
  ctx.fillText(`Zoom: ${((zoom / 2) * 100).toFixed(0)}%`, 10, canvas.height - 25);
}

function drawAxes(ctx, canvas) {
  ctx.strokeStyle = "#3a3a3a";
  ctx.lineWidth = 2;

  const ox = worldToScreen(0, 0);

  if (ox.y >= 0 && ox.y <= canvas.height) {
    ctx.setLineDash([15, 5, 3, 5]);
    ctx.beginPath();
    ctx.moveTo(0, ox.y);
    ctx.lineTo(canvas.width, ox.y);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.beginPath();
    ctx.moveTo(canvas.width - 15, ox.y - 5);
    ctx.lineTo(canvas.width - 5, ox.y);
    ctx.lineTo(canvas.width - 15, ox.y + 5);
    ctx.stroke();
  }

  if (ox.x >= 0 && ox.x <= canvas.width) {
    ctx.beginPath();
    ctx.moveTo(ox.x, 0);
    ctx.lineTo(ox.x, canvas.height);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(ox.x - 5, 15);
    ctx.lineTo(ox.x, 5);
    ctx.lineTo(ox.x + 5, 15);
    ctx.stroke();
  }

  if (document.getElementById("showAxisLabels")?.checked) {
    ctx.fillStyle = "#6ab0ff";
    ctx.font = "bold 14px Arial";

    if (axisMode === "lathe") {
      if (ox.y >= 0 && ox.y <= canvas.height) {
        ctx.fillText("Z", canvas.width - 25, ox.y - 10);
        ctx.fillStyle = "#888";
        ctx.font = "11px Arial";
        ctx.fillText("(délka)", canvas.width - 60, ox.y - 10);
      }
      if (ox.x >= 0 && ox.x <= canvas.width) {
        ctx.fillStyle = "#6ab0ff";
        ctx.font = "bold 14px Arial";
        ctx.fillText("X", ox.x + 10, 20);
        ctx.fillStyle = "#888";
        ctx.font = "11px Arial";
        const label =
          xMeasureMode === "diameter" ? "(průměr ⌀)" : "(poloměr R)";
        ctx.fillText(label, ox.x + 10, 35);
      }
    } else {
      if (ox.y >= 0 && ox.y <= canvas.height) {
        ctx.fillText("X", canvas.width - 25, ox.y - 10);
      }
      if (ox.x >= 0 && ox.x <= canvas.width) {
        ctx.fillText("Y", ox.x + 10, 20);
      }
    }

    if (
      ox.x >= 0 &&
      ox.x <= canvas.width &&
      ox.y >= 0 &&
      ox.y <= canvas.height
    ) {
      ctx.strokeStyle = "#6ab0ff";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(ox.x, ox.y, 5, 0, Math.PI * 2);
      ctx.stroke();

      ctx.fillStyle = "#6ab0ff";
      ctx.font = "12px Arial";
      ctx.fillText("0", ox.x + 10, ox.y + 15);
    }
  }
}

function drawShape(ctx, s, canvas) {
  let strokeColor = "#4a9eff";

  ctx.strokeStyle = strokeColor;
  ctx.lineWidth = 2;

  if (s.type === "line") {
    const p1 = worldToScreen(s.x1, s.y1);
    const p2 = worldToScreen(s.x2, s.y2);
    ctx.beginPath();
    ctx.moveTo(p1.x, p1.y);
    ctx.lineTo(p2.x, p2.y);
    ctx.stroke();
  }

  if (s.type === "circle") {
    const c = worldToScreen(s.cx, s.cy);
    ctx.beginPath();
    ctx.arc(c.x, c.y, s.r * zoom, 0, Math.PI * 2);
    ctx.stroke();

    if (document.getElementById("showDims")?.checked) {
      ctx.fillStyle = strokeColor;
      ctx.font = "12px Arial";
      if (xMeasureMode === "diameter") {
        ctx.fillText(`⌀${(s.r * 2).toFixed(1)}`, c.x + s.r * zoom + 5, c.y);
      } else {
        ctx.fillText(`R${s.r.toFixed(1)}`, c.x + s.r * zoom + 5, c.y);
      }
    }
  }

  if (s.type === "arc") {
    const c = worldToScreen(s.cx, s.cy);
    const p1 = worldToScreen(s.x1, s.y1);
    const p2 = worldToScreen(s.x2, s.y2);

    const angle1 = Math.atan2(p1.y - c.y, p1.x - c.x);
    const angle2 = Math.atan2(p2.y - c.y, p2.x - c.x);

    ctx.save();
    ctx.strokeStyle = s.color || strokeColor;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(
      c.x,
      c.y,
      s.r * zoom,
      angle1,
      angle2,
      s.angle > 180 ? true : false
    );
    ctx.stroke();
    ctx.restore();

    ctx.fillStyle = s.color || strokeColor;
    ctx.beginPath();
    ctx.arc(p1.x, p1.y, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(p2.x, p2.y, 3, 0, Math.PI * 2);
    ctx.fill();
  }
}

// ===== UNDO/REDO =====

// Initialize undo/redo stacks if not already done
if (!window.undoStack) window.undoStack = [];
if (!window.redoStack) window.redoStack = [];
const MAX_HISTORY = 10;

function saveState() {
  const state = {
    shapes: JSON.parse(JSON.stringify(window.shapes)),
    points: JSON.parse(JSON.stringify(window.points)),
  };

  window.undoStack.push(state);

  if (window.undoStack.length > MAX_HISTORY) {
    window.undoStack.shift();
  }

  window.redoStack = [];
}

function undo() {
  if (window.undoStack.length === 0) {
    const info = document.getElementById("snapInfo");
    if (info) {
      info.textContent = "⚠️ Není co vrátit zpět";
      info.style.display = "block";
      setTimeout(() => (info.style.display = "none"), 1000);
    }
    return;
  }

  const currentState = {
    shapes: JSON.parse(JSON.stringify(window.shapes)),
    points: JSON.parse(JSON.stringify(window.points)),
  };
  window.redoStack.push(currentState);

  if (window.redoStack.length > MAX_HISTORY) {
    window.redoStack.shift();
  }

  const prevState = window.undoStack.pop();
  window.shapes.length = 0;
  window.shapes.push(...JSON.parse(JSON.stringify(prevState.shapes)));
  window.points.length = 0;
  window.points.push(...JSON.parse(JSON.stringify(prevState.points)));

  updateSnapPoints();
  draw();

  const info = document.getElementById("snapInfo");
  if (info) {
    info.textContent = `↶ Zpět (zbývá ${window.undoStack.length})`;
    info.style.display = "block";
    setTimeout(() => (info.style.display = "none"), 1000);
  }
}

function redo() {
  if (window.redoStack.length === 0) {
    const info = document.getElementById("snapInfo");
    if (info) {
      info.textContent = "⚠️ Není co vrátit vpřed";
      info.style.display = "block";
      setTimeout(() => (info.style.display = "none"), 1000);
    }
    return;
  }

  const currentState = {
    shapes: JSON.parse(JSON.stringify(window.shapes)),
    points: JSON.parse(JSON.stringify(window.points)),
  };
  window.undoStack.push(currentState);

  if (window.undoStack.length > MAX_HISTORY) {
    window.undoStack.shift();
  }

  const nextState = window.redoStack.pop();
  window.shapes.length = 0;
  window.shapes.push(...JSON.parse(JSON.stringify(nextState.shapes)));
  window.points.length = 0;
  window.points.push(...JSON.parse(JSON.stringify(nextState.points)));

  updateSnapPoints();
  draw();

  const info = document.getElementById("snapInfo");
  if (info) {
    info.textContent = `↷ Vpřed (zbývá ${window.redoStack.length})`;
    info.style.display = "block";
    setTimeout(() => (info.style.display = "none"), 1000);
  }
}

// Export functions to window global
window.draw = draw;
window.undo = undo;
window.redo = redo;
window.aiUndo = undo;  // Alias for aiUndo
window.aiRedo = redo;  // Alias for aiRedo
window.saveState = saveState;

// ===== UTILITY FUNCTIONS =====

window.calculateIntersections = function () {
  console.log("[calculateIntersections] Hledám průsečíky mezi tvary");
  const intersections = [];

  // Najdi průsečíky mezi všemi tvary
  for (let i = 0; i < window.shapes.length; i++) {
    for (let j = i + 1; j < window.shapes.length; j++) {
      const s1 = window.shapes[i];
      const s2 = window.shapes[j];

      if (s1.type === "line" && s2.type === "line") {
        // Průsečík dvou čar
        const denom = (s1.x1 - s1.x2) * (s2.y1 - s2.y2) - (s1.y1 - s1.y2) * (s2.x1 - s2.x2);
        if (Math.abs(denom) > 1e-10) {
          const t = ((s1.x1 - s2.x1) * (s2.y1 - s2.y2) - (s1.y1 - s2.y1) * (s2.x1 - s2.x2)) / denom;
          const u = -((s1.x1 - s1.x2) * (s1.y1 - s2.y1) - (s1.y1 - s1.y2) * (s1.x1 - s2.x1)) / denom;

          if (t >= 0 && t <= 1 && u >= 0 && u <= 1) {
            intersections.push({
              x: s1.x1 + t * (s1.x2 - s1.x1),
              y: s1.y1 + t * (s1.y2 - s1.y1)
            });
          }
        }
      }
    }
  }

  console.log("[calculateIntersections] Nalezeno průsečíků:", intersections.length);

  // Přidej průsečíky jako body
  intersections.forEach(pt => {
    if (!window.points.some(p => Math.abs(p.x - pt.x) < 1 && Math.abs(p.y - pt.y) < 1)) {
      window.points.push(pt);
    }
  });

  if (window.draw) window.draw();
};

window.showColorPicker = function () {
  console.log("[showColorPicker] Otevírám výběr barvy");
  // TODO: Implementovat color picker modal
  alert("🎨 Výběr barvy: Bude implementován v příští verzi");
};

window.clearAll = function () {
  console.log("[clearAll] Odstraňuji všechny tvary");
  if (confirm("Opravdu chceš vymazat všechny tvary?")) {
    window.shapes = [];
    window.points = [];
    window.selectedItems = [];
    if (window.saveState) window.saveState();
    if (window.draw) window.draw();
  }
};

window.exportPNG = function () {
  console.log("[exportPNG] Exportuji plátno jako PNG");
  const canvas = document.getElementById("canvas");
  if (!canvas) return;

  const link = document.createElement("a");
  link.href = canvas.toDataURL("image/png");
  link.download = "drawing_" + new Date().getTime() + ".png";
  link.click();
};

// ===== SELECTION & STATE =====
window.clearSelection = function () {
  console.log("[clearSelection] Čistím výběr");
  if (!window.selectedItems) window.selectedItems = [];
  window.selectedItems = [];
  window.selectedShape = null;
  if (window.draw) window.draw();
};

// ===== BOOLEAN OPERATIONS =====
window.booleanUnion = function () {
  console.log("[booleanUnion] Provádím sjednocení tvaru");
  if (window.selectedItems.length < 2) {
    alert("Vyber alespoň 2 tvary!");
    return;
  }
  // TODO: Implementovat boolean union
  alert("🔗 Sjednocení: Bude implementováno v příští verzi");
};

window.booleanIntersect = function () {
  console.log("[booleanIntersect] Provádím průnik tvaru");
  if (window.selectedItems.length < 2) {
    alert("Vyber alespoň 2 tvary!");
    return;
  }
  // TODO: Implementovat boolean intersect
  alert("∩ Průnik: Bude implementován v příští verzi");
};

window.booleanDifference = function () {
  console.log("[booleanDifference] Provádím rozdíl tvaru");
  if (window.selectedItems.length < 2) {
    alert("Vyber alespoň 2 tvary!");
    return;
  }
  // TODO: Implementovat boolean difference
  alert("- Rozdíl: Bude implementován v příští verzi");
};

// ===== DIMENSION OPERATIONS =====
window.deleteAllDimensions = function () {
  console.log("[deleteAllDimensions] Mažu všechny kóty");
  if (!window.dimensions) window.dimensions = [];
  window.dimensions = [];
  window.saveState();
  window.draw();
};

window.dimensionAll = function () {
  console.log("[dimensionAll] Okótuji všechny čáry a kružnice");
  if (!window.shapes) window.shapes = [];
  if (!window.dimensions) window.dimensions = [];

  window.shapes.forEach((shape, idx) => {
    if (shape.type === "line") {
      const len = Math.hypot(shape.x2 - shape.x1, shape.y2 - shape.y1);
      window.dimensions.push({
        type: "length",
        id: "dim_" + idx,
        x: (shape.x1 + shape.x2) / 2,
        y: (shape.y1 + shape.y2) / 2,
        value: len.toFixed(2),
        shapeId: idx
      });
    } else if (shape.type === "circle") {
      window.dimensions.push({
        type: "radius",
        id: "dim_" + idx,
        x: shape.cx,
        y: shape.cy,
        value: shape.r.toFixed(2),
        shapeId: idx
      });
    }
  });

  window.saveState();
  window.draw();
};

// ===== POLAR SNAP =====
window.togglePolarSnapLegacy = function () {
  window.polarSnapEnabled = !window.polarSnapEnabled;
  console.log("[togglePolarSnapLegacy] Polární snap:", window.polarSnapEnabled);
  const checkbox = document.getElementById("polarSnapCheckboxLegacy");
  if (checkbox) {
    checkbox.checked = window.polarSnapEnabled;
  }
};

// ===== GRID SPACING =====
window.setGridSpacing = function (spacing) {
  window.gridSpacing = spacing;
  document.getElementById("gridSpacing").value = spacing;
  window.draw();
};

window.updateGridSpacing = function () {
  window.gridSpacing = parseFloat(document.getElementById("gridSpacing").value);
  window.draw();
};

// ===== SIMDXF IMPORT =====
window.importSimDxfProject = function (input) {
  const file = input.files[0];
  if (!file) return;

  // Zkontrolovat příponu
  if (!file.name.endsWith(".json")) {
    alert("❌ Chyba: Můžeš načíst pouze .json soubory!");
    input.value = "";
    return;
  }

  const reader = new FileReader();

  reader.onload = function (e) {
    try {
      const simDxfData = JSON.parse(e.target.result);

      // Validace struktury SimDxf JSON
      if (!simDxfData.points || !Array.isArray(simDxfData.points)) {
        throw new Error("Neplatný formát SimDxf - chybí pole points");
      }

      // Potvrdit import (pokud už něco nakresleného)
      if (window.shapes.length > 0 || window.points.length > 0) {
        const confirm = window.confirm(
          "⚠️ Importem z SimDxf přepíšeš aktuální kreslení.\n\n" +
          "Chceš pokračovat?"
        );
        if (!confirm) {
          input.value = "";
          return;
        }
      }

      // Konvertovat SimDxf na 2D_AI formát
      const converted = window.convertSimDxfToShapes(simDxfData);

      // Vyčistit stávající kreslení
      window.shapes.length = 0;
      window.points.length = 0;

      // Načíst konvertovaná data
      window.shapes.push(...converted.shapes);
      window.points.push(...converted.points);

      // Nastavit počátek (Auto-Zero)
      if (simDxfData.machineType) {
        const modeInfo = document.getElementById("modeInfo");
        if (modeInfo) {
          modeInfo.textContent = `📥 Import z SimDxf: ${simDxfData.machineType || "Import"}`;
          modeInfo.classList.add("show");
          setTimeout(() => {
            modeInfo.classList.remove("show");
          }, 3000);
        }
      }

      // Vykreslení
      window.fitCanvasToShapes();
      window.draw();

      // Resetovat file input
      input.value = "";
    } catch (error) {
      alert(`❌ Chyba při importu: ${error.message}`);
      input.value = "";
    }
  };

  reader.readAsText(file);
};

window.convertSimDxfToShapes = function (simDxfData) {
  const newShapes = [];
  const newPoints = [];

  const pointsList = simDxfData.points || [];

  for (let i = 0; i < pointsList.length; i++) {
    const current = pointsList[i];
    const next = pointsList[i + 1];

    // Konverze souřadnic: SimDxf (x=Z, z=X) → 2D_AI (x=X, y=Y/Z)
    const x1 = window.convertCoordinate(current.x, "z");
    const y1 = window.convertCoordinate(current.z, "x");

    // Pokud existuje přestup (break flag), přidáme bod
    if (current.break) {
      newPoints.push({ type: "point", x: x1, y: y1, id: `simDxf_${current.id}` });
    }

    if (!next) continue; // Poslední bod

    const x2 = window.convertCoordinate(next.x, "z");
    const y2 = window.convertCoordinate(next.z, "x");

    // Zpracování podle typu
    if (current.type === "arc" && current.r !== undefined) {
      const cx = window.convertCoordinate(current.cx, "z");
      const cy = window.convertCoordinate(current.cz, "x");
      const r = Math.abs(current.r);

      newShapes.push({
        type: "circle",
        cx: cx,
        cy: cy,
        r: r,
        id: `simDxf_arc_${current.id}`,
      });
    } else {
      newShapes.push({
        type: "line",
        x1: x1,
        y1: y1,
        x2: x2,
        y2: y2,
        id: `simDxf_line_${current.id}`,
      });
    }
  }

  return { shapes: newShapes, points: newPoints };
};

window.convertCoordinate = function (value, axis) {
  // SimDxf souřadnice jsou v mm (typicky 0-100+)
  // Vraťíme jako je (bez změny měřítka)
  return parseFloat(value) || 0;
};

window.fitCanvasToShapes = function () {
  // Pokud máme nějaké tvary, přizpůsobíme canvas na jejich velikost
  if (window.shapes.length === 0) {
    window.zoom = 1;
    window.panX = window.canvas.width / 2;
    window.panY = -window.canvas.height / 2;
    return;
  }

  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;

  // Najít hranice všech tvarů
  for (const shape of window.shapes) {
    if (shape.type === "line") {
      minX = Math.min(minX, shape.x1, shape.x2);
      maxX = Math.max(maxX, shape.x1, shape.x2);
      minY = Math.min(minY, shape.y1, shape.y2);
      maxY = Math.max(maxY, shape.y1, shape.y2);
    } else if (shape.type === "circle") {
      minX = Math.min(minX, shape.cx - shape.r);
      maxX = Math.max(maxX, shape.cx + shape.r);
      minY = Math.min(minY, shape.cy - shape.r);
      maxY = Math.max(maxY, shape.cy + shape.r);
    } else if (shape.type === "point") {
      minX = Math.min(minX, shape.x);
      maxX = Math.max(maxX, shape.x);
      minY = Math.min(minY, shape.y);
      maxY = Math.max(maxY, shape.y);
    }
  }

  // Přidat margini
  const width = maxX - minX || 100;
  const height = maxY - minY || 100;
  const margin = 50;

  // Vypočítat zoom aby se vešlo
  const zoomX = (window.canvas.width - 2 * margin) / width;
  const zoomY = (window.canvas.height - 2 * margin) / height;
  window.zoom = Math.min(zoomX, zoomY, 5);

  // Vykreslit na střed
  const centerX = (minX + maxX) / 2;
  const centerY = (minY + maxY) / 2;
  window.panX = window.canvas.width / 2 - centerX * window.zoom;
  window.panY = window.canvas.height / 2 - centerY * window.zoom;
};

// ===== POLÁRNÍ SOUŘADNICE =====
window.addLinePolar = function() {
  const z0 = parseFloat(document.getElementById("polarStartZ").value);
  let x0 = parseFloat(document.getElementById("polarStartX").value);
  if (window.xMeasureMode === "diameter") x0 /= 2;
  const dist = parseFloat(document.getElementById("polarDist").value);
  const angle = (parseFloat(document.getElementById("polarAngle").value) * Math.PI) / 180;
  const z1 = z0 + dist * Math.cos(angle);
  const x1 = x0 + dist * Math.sin(angle);
  window.shapes.push({ type: "line", x1: z0, y1: x0, x2: z1, y2: x1 });
  let displayX1 = x1;
  if (window.xMeasureMode === "diameter") displayX1 *= 2;
  document.getElementById("polarStartZ").value = z1.toFixed(2);
  document.getElementById("polarStartX").value = displayX1.toFixed(2);
  window.updateSnapPoints();
  window.draw();
};

window.addPointPolar = function() {
  const z0 = parseFloat(document.getElementById("polarStartZ").value);
  let x0 = parseFloat(document.getElementById("polarStartX").value);
  if (window.xMeasureMode === "diameter") x0 /= 2;
  const dist = parseFloat(document.getElementById("polarDist").value);
  const angle = (parseFloat(document.getElementById("polarAngle").value) * Math.PI) / 180;
  const z1 = z0 + dist * Math.cos(angle);
  const x1 = x0 + dist * Math.sin(angle);
  window.points.push({ x: z1, y: x1 });
  let displayX1 = x1;
  if (window.xMeasureMode === "diameter") displayX1 *= 2;
  document.getElementById("polarStartZ").value = z1.toFixed(2);
  document.getElementById("polarStartX").value = displayX1.toFixed(2);
  window.updateSnapPoints();
  window.draw();
};

// ===== LINE COORDINATES =====
window.setLineStart = function() {
  let yVal = window.cursorPos.y;
  if (window.xMeasureMode === "diameter") yVal *= 2;
  document.getElementById("lineZ1").value = window.cursorPos.x.toFixed(2);
  document.getElementById("lineX1").value = yVal.toFixed(2);
};

window.setLineEnd = function() {
  let yVal = window.cursorPos.y;
  if (window.xMeasureMode === "diameter") yVal *= 2;
  document.getElementById("lineZ2").value = window.cursorPos.x.toFixed(2);
  document.getElementById("lineX2").value = yVal.toFixed(2);
};

window.addLineByCoords = function() {
  const z1 = parseFloat(document.getElementById("lineZ1").value);
  let x1 = parseFloat(document.getElementById("lineX1").value);
  const z2 = parseFloat(document.getElementById("lineZ2").value);
  let x2 = parseFloat(document.getElementById("lineX2").value);
  if (window.xMeasureMode === "diameter") { x1 /= 2; x2 /= 2; }
  window.shapes.push({ type: "line", x1: z1, y1: x1, x2: z2, y2: x2 });
  window.updateSnapPoints();
  window.draw();
};

// ===== CIRCLE COORDINATES =====
window.setCircleCenter = function() {
  let yVal = window.cursorPos.y;
  if (window.xMeasureMode === "diameter") yVal *= 2;
  document.getElementById("quickCircleZ").value = window.cursorPos.x.toFixed(2);
  document.getElementById("quickCircleX").value = yVal.toFixed(2);
};

// ===== CIRCLE MODAL =====
window.closeCircleModal = function() {
  document.getElementById("circleModal").style.display = "none";
  window.pendingCircleCenter = null;
  window.tempShape = null;
  window.draw();
};

window.confirmCircle = function() {
  const r = parseFloat(document.getElementById("circleInputR").value);
  if (window.pendingCircleCenter && !isNaN(r) && r > 0) {
    window.shapes.push({
      type: "circle",
      cx: window.pendingCircleCenter.x,
      cy: window.pendingCircleCenter.y,
      r: r
    });
    window.saveState();
    window.updateSnapPoints();
  }
  window.closeCircleModal();
};

window.updateCircleInputs = function(source) {
  const inputR = document.getElementById("circleInputR");
  const inputD = document.getElementById("circleInputD");
  if (source === "R") {
    const r = parseFloat(inputR.value);
    if (!isNaN(r)) inputD.value = (r * 2).toFixed(2);
  } else {
    const d = parseFloat(inputD.value);
    if (!isNaN(d)) inputR.value = (d / 2).toFixed(2);
  }
};

// ===== CONSTRAINT MODAL =====
window.closeConstraintModal = function() {
  document.getElementById("constraintModal").style.display = "none";
};

window.applyConstraint = function(constraintType) {
  window.closeConstraintModal();
  window.constraintMode = constraintType;
  window.constraintSelection = [];
  const info = document.getElementById("modeInfo");
  const constraintNames = {
    point: "📍 Bod",
    distance: "📏 Vzdálenost",
    radius: "⭕ Radius",
    polarAngle: "⟲ Polární úhel",
    horizontal: "➡️ Vodorovně",
    vertical: "⬆️ Svisle"
  };
  if (info) {
    info.innerHTML = `🔒 <strong>${constraintNames[constraintType]}</strong>: Klikej na objekty na plátně<br/><small>(ESC = zrušit)`;
  }
  if (window.canvas) window.canvas.style.cursor = "crosshair";
};

window.cancelConstraintValue = function() {
  document.getElementById("constraintPointModal").style.display = "none";
  document.getElementById("constraintDistanceModal").style.display = "none";
  document.getElementById("constraintRadiusModal").style.display = "none";
  document.getElementById("constraintPolarAngleModal").style.display = "none";
  window.constraintMode = null;
  window.constraintSelection = [];
  if (window.canvas) window.canvas.style.cursor = "default";
};

window.confirmConstraintPoint = function() {
  let constraintX = parseFloat(document.getElementById("constraintPointX").value) || 0;
  const constraintZ = parseFloat(document.getElementById("constraintPointZ").value) || 0;
  if (window.xMeasureMode === "diameter") constraintX /= 2;
  window.applyConstraintToSelection("point", { x: constraintZ, y: constraintX });
  window.cancelConstraintValue();
};

window.confirmConstraintDistance = function() {
  const distance = parseFloat(document.getElementById("constraintDistanceValue").value) || 0;
  window.applyConstraintToSelection("distance", distance);
  window.cancelConstraintValue();
};

window.confirmConstraintRadius = function() {
  const radius = parseFloat(document.getElementById("constraintRadiusValue").value) || 0;
  window.applyConstraintToSelection("radius", radius);
  window.cancelConstraintValue();
};

window.confirmConstraintPolarAngle = function() {
  const angle = parseFloat(document.getElementById("constraintPolarAngleValue").value) || 0;
  window.applyConstraintToSelection("polarAngle", angle);
  window.cancelConstraintValue();
};

window.removeConstraint = function(type) {
  document.getElementById("constraintPointModal").style.display = "none";
  document.getElementById("constraintDistanceModal").style.display = "none";
  document.getElementById("constraintRadiusModal").style.display = "none";
  document.getElementById("constraintPolarAngleModal").style.display = "none";
  window.constraintSelection = [];
  if (window.canvas) window.canvas.style.cursor = "crosshair";
  const info = document.getElementById("modeInfo");
  if (info) {
    info.innerHTML = `❌ <strong>ODSTRANĚNÍ FIXACE</strong>: Klikni na objekt(y) k smazání fixace<br/><small>(Klikáš-li na kótu s fixací, fixace se smaže)</small>`;
  }
};

// ===== HELPER FUNCTIONS =====
window.applyConstraintToSelection = function(constraintType, value) {
  const targetItems = window.constraintSelection.length > 0 ? window.constraintSelection : window.selectedItems;
  if (targetItems.length === 0) {
    alert("❌ Žádné objekty nejsou vybrány!");
    return;
  }
  const info = document.getElementById("modeInfo");
  if (info) {
    info.textContent = `✅ Fixace aplikována`;
    info.classList.add("show");
    setTimeout(() => info.classList.remove("show"), 2000);
  }
  window.constraintMode = null;
  window.constraintSelection = [];
  if (window.canvas) window.canvas.style.cursor = "default";
  window.draw();
};
