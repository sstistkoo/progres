/**
 * CANVAS.JS - Canvas event handlers a kreslicí logika
 * - Mouse events (draw, pan, select)
 * - Touch events
 * - Keyboard shortcuts
 * - Drawing operations
 */

// ============================================================
// NAMESPACE MIGRATION - Event handler setup
// ============================================================
// Canvas event handlers nyní integrují Soustruznik.state
// ke čtení a zápisu stavové informace

function getCanvasState() {
  // Helper pro získání stavu - preferuje namespace pokud existuje
  if (window.Soustruznik && window.Soustruznik.state) {
    return window.Soustruznik.state;
  }
  // Fallback na globální proměnné
  return window;
}

// ===== CANVAS SETUP =====

function setupCanvasEvents() {
  const canvas = document.getElementById("canvas");
  if (!canvas) return;

  // Store reference v namespace když je dostupný
  if (window.Soustruznik && window.Soustruznik.state) {
    window.Soustruznik.state.canvas = canvas;
    window.Soustruznik.state.ctx = canvas.getContext("2d");
  }

  // Mouse events
  canvas.addEventListener("mousedown", onCanvasMouseDown);
  canvas.addEventListener("mousemove", onCanvasMouseMove);
  canvas.addEventListener("mouseup", onCanvasMouseUp);
  canvas.addEventListener("wheel", onCanvasWheel, { passive: false });

  // Touch events
  canvas.addEventListener("touchstart", onCanvasTouchStart, { passive: false });
  canvas.addEventListener("touchmove", onCanvasTouchMove, { passive: false });
  canvas.addEventListener("touchend", onCanvasTouchEnd, { passive: false });

  // Context menu
  canvas.addEventListener("contextmenu", (e) => e.preventDefault());

  // ✅ Keyboard nyní spravuje unified keyboard.js
  // document.addEventListener("keydown", onKeyDown); - REMOVED
  // document.addEventListener("keyup", onKeyUp); - REMOVED
}

// ===== MOUSE HANDLERS =====

function onCanvasMouseDown(e) {
  // Pokud mode není nastaven, nastav "pan"
  if (!window.mode) {
    window.mode = "pan";
  }

  // DEBUG: Commented out to reduce console spam
  // console.log("[onCanvasMouseDown] mode =", window.mode, "colorPickerMode =", window.colorPickerMode);

  const canvas = e.target;
  const rect = canvas.getBoundingClientRect();
  const screenX = e.clientX - rect.left;
  const screenY = e.clientY - rect.top;

  const worldPt = window.screenToWorld(screenX, screenY);
  if (!worldPt) return;  // Guard: screenToWorld vracela undefined
  const snapped = window.snapPoint ? window.snapPoint(worldPt.x, worldPt.y) : worldPt;

  // ===== VÝBĚR SNAP POINTU =====
  // Pokud kliknutí je blízko snap pointu, označ ho jako "vybraný"
  if (window.lastMouseX !== undefined && window.lastMouseY !== undefined) {
    const snapResult = snapPointInternal(worldPt);
    if (snapResult && snapResult.snapInfo) {
      // Pokud je zapnutý režim "select", přidej bod do selectedItems s písmenem
      if (window.mode === "select") {
        // Vytvoř point objekt
        const pointToSelect = {
          category: "point",
          x: snapResult.point.x,
          y: snapResult.point.y,
          label: snapResult.snapInfo.label // TODO: Bude přepsáno níže
        };

        // Zavolej handleSelectMode místo abychom dělali vlastní logiku
        handleSelectMode(snapResult.point.x, snapResult.point.y, e.shiftKey);
        return; // Nepokračuj dál
      } else {
        // Jinak jen označ bod jako vybraný (pro ostatní režimy)
        window.selectedSnapPoint = { x: snapResult.point.x, y: snapResult.point.y, type: snapResult.snapInfo.type };
        console.log("[onCanvasMouseDown] Vybrán snap point:", window.selectedSnapPoint);
        if (window.draw) window.draw();
        return; // Nepokračuj dál - nebyl to běžný klik
      }
    }
  }

  if (e.button === 2) {
    // Pravé tlačítko = zrušit
    window.clearMode();
    return;
  }

  if (e.button === 1) {
    // Prostřední tlačítko = pan
    window.panStart = { x: screenX, y: screenY };
    window.panning = true;
    return;
  }

  switch (window.mode) {
    case "pan":
      window.panStart = { x: screenX, y: screenY };
      window.panning = true;
      break;

    case "point":
      handlePointMode(snapped.x, snapped.y);
      break;

    case "line":
      handleLineMode(snapped.x, snapped.y);
      break;

    case "circle":
      handleCircleMode(snapped.x, snapped.y);
      break;

    case "rectangle":
      handleRectangleMode(snapped.x, snapped.y);
      break;

    case "circumcircle":
      handleCircumcircleMode(snapped.x, snapped.y);
      break;

    case "select":
      handleSelectMode(snapped.x, snapped.y, e.shiftKey);
      break;

    case "tangent":
      handleTangentMode(snapped.x, snapped.y);
      break;

    case "perpendicular":
      handlePerpendicularMode(snapped.x, snapped.y);
      break;

    case "parallel":
      handleParallelMode(snapped.x, snapped.y);
      break;

    case "trim":
      handleTrimMode(snapped.x, snapped.y);
      break;

    case "extend":
      handleExtendMode(snapped.x, snapped.y);
      break;

    case "offset":
      handleOffsetMode(snapped.x, snapped.y);
      break;

    case "mirror":
      handleMirrorMode(snapped.x, snapped.y);
      break;

    case "erase":
      handleEraseMode(snapped.x, snapped.y);
      break;

    case "measure":
      handleMeasureMode(snapped.x, snapped.y);
      break;

    case "arc":
      handleArcMode(snapped.x, snapped.y);
      break;

    case "dimension":
      handleDimensionMode(snapped.x, snapped.y);
      break;

    case "colorPicker":
      handleColorPickerMode(snapped.x, snapped.y);
      break;
  }

  if (window.draw) window.draw();
}

function onCanvasMouseMove(e) {
  const canvas = e.target;
  const rect = canvas.getBoundingClientRect();
  const screenX = e.clientX - rect.left;
  const screenY = e.clientY - rect.top;

  if (window.panning) {
    if (window.panStart) {
      const dx = screenX - window.panStart.x;
      const dy = screenY - window.panStart.y;
      if (window.panX !== undefined) window.panX += dx;
      if (window.panY !== undefined) window.panY += dy;
      window.panStart = { x: screenX, y: screenY };
      if (window.draw) window.draw();
    }
    return;
  }

  window.cursorPos = { x: screenX, y: screenY };
  window.lastMouseX = screenX;
  window.lastMouseY = screenY;

  const worldPt = window.screenToWorld ? window.screenToWorld(screenX, screenY) : { x: 0, y: 0 };
  const snapped = (window.snapPoint && worldPt) ? window.snapPoint(worldPt.x, worldPt.y) : worldPt;

  // Update touch cursor
  const touchCursor = document.getElementById("touchCursor");
  if (touchCursor) {
    touchCursor.style.left = screenX + "px";
    touchCursor.style.top = screenY + "px";
  }

  if (window.mode === "line" && window.startPt) {
    window.tempShape = {
      type: "line",
      x1: window.startPt.x,
      y1: window.startPt.y,
      x2: snapped.x,
      y2: snapped.y,
    };
    if (window.draw) window.draw();
  } else if (window.mode === "circle" && window.startPt) {
    const r = Math.sqrt(
      (snapped.x - window.startPt.x) ** 2 + (snapped.y - window.startPt.y) ** 2
    );
    window.tempShape = {
      type: "circle",
      cx: window.startPt.x,
      cy: window.startPt.y,
      r: r,
    };
    if (window.draw) window.draw();
  } else if (window.mode === "rectangle" && window.startPt) {
    window.tempShape = {
      type: "rectangle",
      x1: window.startPt.x,
      y1: window.startPt.y,
      x2: snapped.x,
      y2: snapped.y,
    };
    if (window.draw) window.draw();
  } else if (window.mode === "circumcircle" && window.circumcirclePoints && window.circumcirclePoints.length > 0) {
    // Zobrazení dočasné linky a bodů pro circumcircle
    if (!window.tempCircumcirclePoints) {
      window.tempCircumcirclePoints = [];
    }
    window.tempCircumcirclePoints = [...window.circumcirclePoints];
    if (window.draw) window.draw();
  }
}

function onCanvasMouseUp(e) {
  // Dokončení obdélníku (tažení)
  if (window.mode === "rectangle" && window.drawing && window.startPt) {
    const canvas = e.target;
    const rect = canvas.getBoundingClientRect();
    const screenX = e.clientX - rect.left;
    const screenY = e.clientY - rect.top;

    const worldPt = window.screenToWorld ? window.screenToWorld(screenX, screenY) : { x: 0, y: 0 };
    const snapped = window.snapPoint ? window.snapPoint(worldPt.x, worldPt.y) : worldPt;

    if (!window.shapes) return;

    // Vytvoř obdélník pouze pokud má nenulovou velikost
    if (snapped.x !== window.startPt.x && snapped.y !== window.startPt.y) {
      let x2 = snapped.x;
      let y2 = snapped.y;

      // Pokud je "Míra" zapnuta, zeptej se na rozměry
      if (window.measureInputEnabled) {
        const measureData = window.showMeasureInputDialog("rectangle");
        if (measureData !== null) {
          const processedData = window.processMeasureInput(measureData);
          if (processedData && processedData.width && processedData.height) {
            // Nastav x2 a y2 podle zadaných rozměrů
            x2 = window.startPt.x + processedData.width;
            y2 = window.startPt.y + processedData.height;
          }
        }
      }

      // Konvertuj obdélník na 4 úseček hned od vytvoření
      const minX = Math.min(window.startPt.x, x2);
      const maxX = Math.max(window.startPt.x, x2);
      const minY = Math.min(window.startPt.y, y2);
      const maxY = Math.max(window.startPt.y, y2);

      const color = window.defaultDrawColor || "#4a9eff";
      const lineStyle = window.defaultDrawLineStyle || "solid";

      // Čtyři strany obdélníku jako samostatné úseky
      window.shapes.push({ type: "line", x1: minX, y1: minY, x2: maxX, y2: minY, color: color, lineStyle: lineStyle }); // horní
      window.shapes.push({ type: "line", x1: minX, y1: maxY, x2: maxX, y2: maxY, color: color, lineStyle: lineStyle }); // dolní
      window.shapes.push({ type: "line", x1: minX, y1: minY, x2: minX, y2: maxY, color: color, lineStyle: lineStyle }); // levá
      window.shapes.push({ type: "line", x1: maxX, y1: minY, x2: maxX, y2: maxY, color: color, lineStyle: lineStyle }); // pravá

      if (window.updateSnapPoints) window.updateSnapPoints();
      if (window.saveState) window.saveState();
    }

    window.startPt = null;
    window.tempShape = null;
    window.drawing = false;
    if (window.draw) window.draw();
    return;
  }

  window.panning = false;
  window.panStart = null;
}

function onCanvasWheel(e) {
  e.preventDefault();

  const canvas = document.getElementById("canvas");
  if (!canvas) return;
  const rect = canvas.getBoundingClientRect();
  const screenX = e.clientX - rect.left;
  const screenY = e.clientY - rect.top;

  // Získat světové souřadnice PŘED změnou zoom
  const worldPoint = window.screenToWorld ? window.screenToWorld(screenX, screenY) : { x: 0, y: 0 };
  if (!worldPoint) return;  // Guard: screenToWorld vracela undefined

  // Změnit zoom
  const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
  if (window.zoom !== undefined) {
    window.zoom *= zoomFactor;
    window.zoom = Math.max(0.1, Math.min(window.zoom, 100));
  }

  // Vypočítat kde by měl být screen bod, aby zůstal na stejném světovém bodě
  // screenX = worldPoint.x * newZoom + newPanX
  // worldPoint.y = (newPanY - screenY) / newZoom
  // Z toho plyne:
  // newPanX = screenX - worldPoint.x * newZoom
  // newPanY = worldPoint.y * newZoom + screenY

  if (window.panX !== undefined) {
    window.panX = screenX - worldPoint.x * window.zoom;
  }
  if (window.panY !== undefined) {
    window.panY = worldPoint.y * window.zoom + screenY;
  }

  if (window.draw) window.draw();
}

// ===== TOUCH HANDLERS =====

let touchStart = null;

function onCanvasTouchStart(e) {
  e.preventDefault();
  if (e.touches.length === 1) {
    const touch = e.touches[0];
    const canvas = e.target;
    const rect = canvas.getBoundingClientRect();
    const screenX = touch.clientX - rect.left;
    const screenY = touch.clientY - rect.top;

    touchStart = { x: screenX, y: screenY, time: Date.now() };

    const worldPt = window.screenToWorld ? window.screenToWorld(screenX, screenY) : { x: 0, y: 0 };
    const snapped = window.snapPoint ? window.snapPoint(worldPt.x, worldPt.y) : worldPt;

    if (window.mode === "point") {
      handlePointMode(snapped.x, snapped.y);
    } else if (window.mode === "line") {
      handleLineMode(snapped.x, snapped.y);
    } else if (window.mode === "circle") {
      handleCircleMode(snapped.x, snapped.y);
    } else if (window.mode === "select") {
      handleSelectMode(snapped.x, snapped.y, false);
    }

    if (window.draw) window.draw();
  } else if (e.touches.length === 2) {
    // Pinch zoom
    const t1 = e.touches[0];
    const t2 = e.touches[1];
    const dist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
    window.pinchStart = { dist: dist, zoom: window.zoom };
  }
}

function onCanvasTouchMove(e) {
  e.preventDefault();
  if (e.touches.length === 1 && touchStart) {
    const touch = e.touches[0];
    const canvas = e.target;
    const rect = canvas.getBoundingClientRect();
    const screenX = touch.clientX - rect.left;
    const screenY = touch.clientY - rect.top;

    if (Date.now() - touchStart.time < 100 && Math.abs(screenX - touchStart.x) < 20 && Math.abs(screenY - touchStart.y) < 20) {
      // Pan
      const dx = screenX - touchStart.x;
      const dy = screenY - touchStart.y;
      if (window.panX !== undefined) window.panX += dx;
      if (window.panY !== undefined) window.panY += dy;
      touchStart.x = screenX;
      touchStart.y = screenY;
    }

    const worldPt = window.screenToWorld ? window.screenToWorld(screenX, screenY) : { x: 0, y: 0 };
    const snapped = window.snapPoint ? window.snapPoint(worldPt.x, worldPt.y) : worldPt;

    if (window.mode === "line" && window.startPt) {
      window.tempShape = {
        type: "line",
        x1: window.startPt.x,
        y1: window.startPt.y,
        x2: snapped.x,
        y2: snapped.y,
      };
    } else if (window.mode === "circle" && window.startPt) {
      const r = Math.sqrt(
        (snapped.x - window.startPt.x) ** 2 + (snapped.y - window.startPt.y) ** 2
      );
      window.tempShape = {
        type: "circle",
        cx: window.startPt.x,
        cy: window.startPt.y,
        r: r,
      };
    }

    if (window.draw) window.draw();
  } else if (e.touches.length === 2) {
    const t1 = e.touches[0];
    const t2 = e.touches[1];
    const dist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
    if (window.pinchStart) {
      const ratio = dist / window.pinchStart.dist;
      if (window.zoom !== undefined) {
        window.zoom = window.pinchStart.zoom * ratio;
        window.zoom = Math.max(0.1, Math.min(window.zoom, 100));
      }
      if (window.draw) window.draw();
    }
  }
}

function onCanvasTouchEnd(e) {
  e.preventDefault();
  touchStart = null;
  window.pinchStart = null;
}

// ===== MODE HANDLERS =====

function handlePointMode(x, y) {
  if (!window.points) {
    console.error("[handlePointMode] ❌ window.points neexistuje!");
    return;
  }
  window.points.push({ x, y, temp: false });
  if (window.updateSnapPoints) {
    window.updateSnapPoints();
  }
}

function handleLineMode(x, y) {
  if (!window.startPt) {
    // Pokud je vybraný snap point, použij ho jako iniciální bod
    if (window.selectedSnapPoint) {
      window.startPt = { x: window.selectedSnapPoint.x, y: window.selectedSnapPoint.y };
      console.log("[handleLineMode] Počáteční bod z vybraného snap pointu:", window.startPt);
    } else {
      window.startPt = { x, y };
    }
  } else {
    if (!window.shapes) return;

    // Pokud je "Míra" zapnuta, zeptej se na délku
    let finalX = x;
    let finalY = y;

    if (window.measureInputEnabled) {
      const measureData = window.showMeasureInputDialog("line");
      if (measureData === null) {
        window.startPt = null;
        return; // User cancelled
      }

      const processedData = window.processMeasureInput(measureData);
      if (processedData && processedData.distance) {
        // Vypočítej směr od startPt k aktuální pozici
        const dx = x - window.startPt.x;
        const dy = y - window.startPt.y;
        const currentAngle = Math.atan2(dy, dx);

        // Nastav nový endpoint podle zadané vzdálenosti
        finalX = window.startPt.x + processedData.distance * Math.cos(currentAngle);
        finalY = window.startPt.y + processedData.distance * Math.sin(currentAngle);
      }
    }

    window.shapes.push({
      type: "line",
      x1: window.startPt.x,
      y1: window.startPt.y,
      x2: finalX,
      y2: finalY,
      color: window.defaultDrawColor || "#4a9eff",
      lineStyle: window.defaultDrawLineStyle || "solid",
    });
    window.startPt = null;
    window.tempShape = null;
    if (window.updateSnapPoints) window.updateSnapPoints();
    if (window.saveState) window.saveState();
  }
}

function handleCircleMode(x, y) {
  if (!window.startPt) {
    // Pokud je vybraný snap point, použij ho jako střed
    if (window.selectedSnapPoint) {
      window.startPt = { x: window.selectedSnapPoint.x, y: window.selectedSnapPoint.y };
      console.log("[handleCircleMode] Střed z vybraného snap pointu:", window.startPt);
    } else {
      window.startPt = { x, y };
    }
  } else {
    if (!window.shapes) return;

    // Pokud je "Míra" zapnuta, zeptej se na poloměr
    let radius = Math.sqrt((x - window.startPt.x) ** 2 + (y - window.startPt.y) ** 2);

    if (window.measureInputEnabled) {
      const measureData = window.showMeasureInputDialog("circle");
      if (measureData === null) {
        window.startPt = null;
        return; // User cancelled
      }

      const processedData = window.processMeasureInput(measureData);
      if (processedData && processedData.radius) {
        radius = processedData.radius;
      }
    }

    window.shapes.push({
      type: "circle",
      cx: window.startPt.x,
      cy: window.startPt.y,
      r: radius,
      color: window.defaultDrawColor || "#4a9eff",
      lineStyle: window.defaultDrawLineStyle || "solid",
    });
    window.startPt = null;
    window.tempShape = null;
    if (window.updateSnapPoints) window.updateSnapPoints();
    if (window.saveState) window.saveState();
  }
}

function handleRectangleMode(x, y) {
  // Při kliknutí se začne kreslení tažením
  // Pokud je vybraný snap point, použij ho jako počáteční bod
  if (window.selectedSnapPoint && !window.startPt) {
    window.startPt = { x: window.selectedSnapPoint.x, y: window.selectedSnapPoint.y };
    console.log("[handleRectangleMode] Počáteční bod z vybraného snap pointu:", window.startPt);
  } else {
    window.startPt = { x, y };
  }
  window.drawing = true;
}

function handleCircumcircleMode(x, y) {
  // Nejdříve zkontroluj, zda jsou vybrané 3 body (A, B, C)
  if (window.selectedItems && window.selectedItems.length === 3) {
    const itemA = window.selectedItems[0];
    const itemB = window.selectedItems[1];
    const itemC = window.selectedItems[2];

    // Všechny tři musejí být body
    if (itemA.category === "point" && itemB.category === "point" && itemC.category === "point") {
      const p1 = { x: itemA.x, y: itemA.y };
      const p2 = { x: itemB.x, y: itemB.y };
      const p3 = { x: itemC.x, y: itemC.y };

      // Výpočet circumcircle (kružnice procházející 3 body)
      const ax = p1.x;
      const ay = p1.y;
      const bx = p2.x;
      const by = p2.y;
      const cx = p3.x;
      const cy = p3.y;

      const d = 2 * (ax * (by - cy) + bx * (cy - ay) + cx * (ay - by));

      if (Math.abs(d) < 0.0001) {
        // Body jsou kolineární - nemohu udělat kružnici
        alert("⚠️ Body A, B, C jsou na jedné přímce - kružnice nelze vytvořit!");
        window.selectedItems = [];
        if (window.draw) window.draw();
        return;
      }

      const ux = ((ax * ax + ay * ay) * (by - cy) + (bx * bx + by * by) * (cy - ay) + (cx * cx + cy * cy) * (ay - by)) / d;
      const uy = ((ax * ax + ay * ay) * (cx - bx) + (bx * bx + by * by) * (ax - cx) + (cx * cx + cy * cy) * (bx - ax)) / d;
      const r = Math.sqrt((ax - ux) ** 2 + (ay - uy) ** 2);

      if (!window.shapes) window.shapes = [];
      window.shapes.push({
        type: "circle",
        cx: ux,
        cy: uy,
        r: r,
        color: window.defaultDrawColor || "#4a9eff",
        lineStyle: window.defaultDrawLineStyle || "solid",
      });

      window.selectedItems = []; // Vymaž výběr
      if (window.updateSnapPoints) window.updateSnapPoints();
      if (window.saveState) window.saveState();
      if (window.draw) window.draw();
      return;
    }
  }

  // Normální režim - sbírání 3 bodů klikáním
  if (!window.circumcirclePoints) {
    window.circumcirclePoints = [];
  }

  window.circumcirclePoints.push({ x, y });

  if (window.circumcirclePoints.length === 3) {
    // Máme 3 body - spočítej kružnici
    const p1 = window.circumcirclePoints[0];
    const p2 = window.circumcirclePoints[1];
    const p3 = window.circumcirclePoints[2];

    // Výpočet circumcircle (kružnice procházející 3 body)
    const ax = p1.x;
    const ay = p1.y;
    const bx = p2.x;
    const by = p2.y;
    const cx = p3.x;
    const cy = p3.y;

    const d = 2 * (ax * (by - cy) + bx * (cy - ay) + cx * (ay - by));

    if (Math.abs(d) < 0.0001) {
      // Body jsou kolineární - nemohu udělat kružnici
      alert("⚠️ Body jsou na jedné přímce - kružnice nelze vytvořit!");
      window.circumcirclePoints = [];
      if (window.draw) window.draw();
      return;
    }

    const ux = ((ax * ax + ay * ay) * (by - cy) + (bx * bx + by * by) * (cy - ay) + (cx * cx + cy * cy) * (ay - by)) / d;
    const uy = ((ax * ax + ay * ay) * (cx - bx) + (bx * bx + by * by) * (ax - cx) + (cx * cx + cy * cy) * (bx - ax)) / d;
    const r = Math.sqrt((ax - ux) ** 2 + (ay - uy) ** 2);

    if (!window.shapes) window.shapes = [];
    window.shapes.push({
      type: "circle",
      cx: ux,
      cy: uy,
      r: r,
      color: window.defaultDrawColor || "#4a9eff",
      lineStyle: window.defaultDrawLineStyle || "solid",
    });

    window.circumcirclePoints = [];
    if (window.updateSnapPoints) window.updateSnapPoints();
    if (window.saveState) window.saveState();
  }
}

// Pomocná funkce pro vytvoření circumcircle ze 3 vybraných bodů
window.createCircumcircleFromSelectedPoints = function() {
  if (!window.selectedItems || window.selectedItems.length !== 3) return;

  const itemA = window.selectedItems[0];
  const itemB = window.selectedItems[1];
  const itemC = window.selectedItems[2];

  // Všechny tři musejí být body
  if (itemA.category !== "point" || itemB.category !== "point" || itemC.category !== "point") {
    alert("⚠️ Všechny 3 prvky musejí být body!");
    return;
  }

  const p1 = { x: itemA.x, y: itemA.y };
  const p2 = { x: itemB.x, y: itemB.y };
  const p3 = { x: itemC.x, y: itemC.y };

  // Výpočet circumcircle (kružnice procházející 3 body)
  const ax = p1.x;
  const ay = p1.y;
  const bx = p2.x;
  const by = p2.y;
  const cx = p3.x;
  const cy = p3.y;

  const d = 2 * (ax * (by - cy) + bx * (cy - ay) + cx * (ay - by));

  if (Math.abs(d) < 0.0001) {
    // Body jsou kolineární - nemohu udělat kružnici
    alert("⚠️ Body A, B, C jsou na jedné přímce - kružnice nelze vytvořit!");
    window.selectedItems = [];
    if (window.draw) window.draw();
    return;
  }

  const ux = ((ax * ax + ay * ay) * (by - cy) + (bx * bx + by * by) * (cy - ay) + (cx * cx + cy * cy) * (ay - by)) / d;
  const uy = ((ax * ax + ay * ay) * (cx - bx) + (bx * bx + by * by) * (ax - cx) + (cx * cx + cy * cy) * (bx - ax)) / d;
  const r = Math.sqrt((ax - ux) ** 2 + (ay - uy) ** 2);

  if (!window.shapes) window.shapes = [];
  window.shapes.push({
    type: "circle",
    cx: ux,
    cy: uy,
    r: r,
    color: window.defaultDrawColor || "#4a9eff",
    lineStyle: window.defaultDrawLineStyle || "solid",
  });

  window.selectedItems = []; // Vymaž výběr
  if (window.updateSnapPoints) window.updateSnapPoints();
  if (window.saveState) window.saveState();
  if (window.draw) window.draw();
};

function handleSelectMode(x, y, shiftKey) {
  if (!window.selectedItems) window.selectedItems = [];

  let found = null;

  const tolerance = 5 / (window.zoom || 2);
  const endpointTolerance = 7 / (window.zoom || 2); // Větší tolerance pro koncové body

  // PRIORITA 1: Zkontrolovat koncové body usečky (endpoint má přednost před tělem usečky)
  if (window.shapes) {
    for (let s of window.shapes) {
      if (s.type === "line") {
        // Kontrola koncového bodu 1
        const dist1 = Math.hypot(x - s.x1, y - s.y1);
        if (dist1 < endpointTolerance) {
          found = {
            category: "point",
            x: s.x1,
            y: s.y1,
            ref: null,
            label: null
          };
          break;
        }
        
        // Kontrola koncového bodu 2
        const dist2 = Math.hypot(x - s.x2, y - s.y2);
        if (dist2 < endpointTolerance) {
          found = {
            category: "point",
            x: s.x2,
            y: s.y2,
            ref: null,
            label: null
          };
          break;
        }
      }
    }
  }

  // PRIORITA 2: Zkontrolovat průsečíky (intersection points)
  if (!found && window.intersectionPoints && window.intersectionPoints.length > 0) {
    const foundIntersection = window.intersectionPoints.find((p) => {
      return Math.hypot(p.x - x, p.y - y) < endpointTolerance;
    });
    
    if (foundIntersection) {
      found = {
        category: "intersection",
        x: foundIntersection.x,
        y: foundIntersection.y,
        ref: foundIntersection,
        label: null
      };
    }
  }

  // PRIORITA 3: Zkontrolovat manuálně vytvořené body (window.points)
  if (!found) {
    const found_point = window.points && window.points.find((p) => {
      return Math.hypot(p.x - x, p.y - y) < tolerance;
    });

    if (found_point) {
      found = {
        category: "point",
        x: found_point.x,
        y: found_point.y,
        ref: found_point,
        label: null
      };
    }
  }

  // PRIORITA 4: Zkontrolovat tvary (shapes) - usečky, kružnice
  if (!found) {
    const found_shape = window.shapes && window.shapes.find((s) => {
      if (s.type === "dimension") return false; // Přeskočit kóty
      if (s.type === "line") {
        const d = pointToLineDistance(x, y, s.x1, s.y1, s.x2, s.y2);
        return d < tolerance;
      } else if (s.type === "circle") {
        return Math.abs(Math.hypot(x - s.cx, y - s.cy) - s.r) < tolerance;
      }
      return false;
    });

    if (found_shape) {
      found = {
        category: "shape",
        type: found_shape.type,
        ref: found_shape,
        label: null
      };
    }
  }

  // POKUD НИЧЕГО NENAJDE - NETVOŘIT BOD, prostě nedelat nic

  // V režimu select se vždycky přidávají položky, ne aby se čistily
  // (jen pokud není explicitně smazáno)

  if (found) {
    // Hledat, zda je už vybraný
    const index = window.selectedItems.findIndex((i) => {
      if ((found.category === "point" || found.category === "intersection") && 
          (i.category === "point" || i.category === "intersection")) {
        return Math.abs(i.x - found.x) < 0.0001 && Math.abs(i.y - found.y) < 0.0001;
      } else if (found.category === "shape" && i.category === "shape") {
        return i.ref === found.ref;
      }
      return false;
    });

    if (index > -1) {
      // Už je vybraný - odeber ho když se klikne znovu
      window.selectedItems.splice(index, 1);
    } else {
      // Přidej label
      const labels = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
      const label = labels[window.selectedItems.length % labels.length];
      found.label = label;

      window.selectedItems.push(found);

      // Zruš selectedSnapPoint, aby se nepřekrývaly renderování
      window.selectedSnapPoint = null;
    }
  }

  if (window.draw) window.draw();
}

/**
 * Automaticky přichytí bod ke všem geometrickým prvkům
 * Hledá nejbližší prvek a přichytí bod na něj
 */
function snapPointToGeometry(x, y) {
  const tolerance = 10 / (window.zoom || 1); // Tolerance pro přichycení
  let snappedTo = null;
  let snappedX = x;
  let snappedY = y;
  let minDist = tolerance;

  // Prohledej všechny tvary
  if (window.shapes && window.shapes.length > 0) {
    window.shapes.forEach((shape) => {
      if (shape.type === "line") {
        // Přichyť na nejbližší bod na čáře
        const closest = pointToLineClosestPoint(x, y, shape.x1, shape.y1, shape.x2, shape.y2);
        const dist = Math.hypot(closest.x - x, closest.y - y);
        if (dist < minDist) {
          snappedX = closest.x;
          snappedY = closest.y;
          snappedTo = `čára (${shape.x1.toFixed(0)},${shape.y1.toFixed(0)})`;
          minDist = dist;
        }
      } else if (shape.type === "circle") {
        // Přichyť na kružnici (bod na kružnici nejbližší ke vybranému bodu)
        const dx = x - shape.cx;
        const dy = y - shape.cy;
        const dist = Math.hypot(dx, dy);
        if (Math.abs(dist - shape.r) < minDist) {
          const angle = Math.atan2(dy, dx);
          const px = shape.cx + Math.cos(angle) * shape.r;
          const py = shape.cy + Math.sin(angle) * shape.r;
          snappedX = px;
          snappedY = py;
          snappedTo = `kružnice (${shape.cx.toFixed(0)},${shape.cy.toFixed(0)})`;
          minDist = Math.abs(dist - shape.r);
        }
      } else if (shape.type === "arc") {
        // Přichyť na oblouk
        const dx = x - shape.cx;
        const dy = y - shape.cy;
        const dist = Math.hypot(dx, dy);
        const angle = Math.atan2(dy, dx);

        // Kontrola zda je úhel v rozsahu oblouku
        const startAngle = shape.startAngle || 0;
        const endAngle = shape.endAngle || Math.PI * 2;

        if (Math.abs(dist - shape.r) < minDist && angle >= startAngle && angle <= endAngle) {
          const px = shape.cx + Math.cos(angle) * shape.r;
          const py = shape.cy + Math.sin(angle) * shape.r;
          snappedX = px;
          snappedY = py;
          snappedTo = "oblouk";
          minDist = Math.abs(dist - shape.r);
        }
      }
    });
  }

  if (snappedTo) {
    return { x: snappedX, y: snappedY, snappedTo };
  }
  return null;
}

/**
 * Vrátí nejbližší bod na čáře k danému bodu
 */
function pointToLineClosestPoint(px, py, x1, y1, x2, y2) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = Math.hypot(dx, dy);
  if (len === 0) return { x: x1, y: y1 };

  const t = Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / (len * len)));
  return {
    x: x1 + t * dx,
    y: y1 + t * dy
  };
}

function handleTangentMode(x, y) {
  // Nejdříve zkontroluj, zda jsou vybrané prvky (A, B)
  if (window.selectedItems && window.selectedItems.length >= 2) {
    const itemA = window.selectedItems[0];
    const itemB = window.selectedItems[1];

    // Tečna: bod (A) a kružnice (B) NEBO kružnice (A) a bod (B)
    let point = null;
    let circle = null;

    if (itemA.category === "point" && itemB.category === "shape" && itemB.type === "circle") {
      point = itemA;
      circle = itemB.ref;
    } else if (itemB.category === "point" && itemA.category === "shape" && itemA.type === "circle") {
      point = itemB;
      circle = itemA.ref;
    }

    if (point && circle && window.tangentFromPoint) {
      const tangents = window.tangentFromPoint(
        point.x,
        point.y,
        circle.cx,
        circle.cy,
        circle.r
      );

      tangents.forEach((t) => {
        window.shapes.push({
          type: "line",
          x1: point.x,
          y1: point.y,
          x2: t.x,
          y2: t.y,
          color: window.currentColor || "#ff00ff",
        });
      });

      if (window.updateSnapPoints) window.updateSnapPoints();
      if (window.saveState) window.saveState();
      window.selectedItems = []; // Vymaž výběr
      if (window.draw) window.draw();
      return;
    }
  }

  // Normální režim - bez vybraných prvků
  if (!window.startPt) {
    window.startPt = { x, y };
  } else {
    // Hledat kružnici pro tečnu
    if (!window.shapes) return;
    const circle = window.shapes.find(
      (s) =>
        s.type === "circle" &&
        Math.hypot(x - s.cx, y - s.cy) <
          Math.max(s.r * 0.2, 5 / (window.zoom || 2))
    );

    if (circle && window.tangentFromPoint) {
      const tangents = window.tangentFromPoint(
        window.startPt.x,
        window.startPt.y,
        circle.cx,
        circle.cy,
        circle.r
      );

      tangents.forEach((t) => {
        window.shapes.push({
          type: "line",
          x1: window.startPt.x,
          y1: window.startPt.y,
          x2: t.x,
          y2: t.y,
          color: window.currentColor || "#ff00ff",
        });
      });

      if (window.updateSnapPoints) window.updateSnapPoints();
      if (window.saveState) window.saveState();
    }

    window.startPt = null;
  }
}

function handlePerpendicularMode(x, y) {
  // Nejdříve zkontroluj, zda jsou vybrané prvky (A, B)
  if (window.selectedItems && window.selectedItems.length >= 2) {
    const itemA = window.selectedItems[0];
    const itemB = window.selectedItems[1];

    // Kolmice: bod (A) a čára (B) NEBO čára (A) a bod (B)
    let point = null;
    let line = null;

    if (itemA.category === "point" && itemB.category === "shape" && itemB.type === "line") {
      point = itemA;
      line = itemB.ref;
    } else if (itemB.category === "point" && itemA.category === "shape" && itemA.type === "line") {
      point = itemB;
      line = itemA.ref;
    }

    if (point && line && window.perpendicular) {
      const perpLine = window.perpendicular(
        point.x,
        point.y,
        line.x1,
        line.y1,
        line.x2,
        line.y2
      );

      if (perpLine) {
        window.shapes.push({
          type: "line",
          x1: perpLine.x1,
          y1: perpLine.y1,
          x2: perpLine.x2,
          y2: perpLine.y2,
          color: window.currentColor || "#00ffff",
        });
        if (window.updateSnapPoints) window.updateSnapPoints();
        if (window.saveState) window.saveState();
        window.selectedItems = []; // Vymaž výběr
        if (window.draw) window.draw();
        return;
      }
    }
  }

  // Normální režim - bez vybraných prvků
  if (!window.startPt) {
    window.startPt = { x, y };
  } else {
    if (!window.shapes) return;
    const line = window.shapes.find((s) => {
      if (s.type !== "line") return false;
      const d = pointToLineDistance(x, y, s.x1, s.y1, s.x2, s.y2);
      return d < 10 / (window.zoom || 2);
    });

    if (line && window.perpendicular) {
      const perpLine = window.perpendicular(
        window.startPt.x,
        window.startPt.y,
        line.x1,
        line.y1,
        line.x2,
        line.y2
      );

      if (perpLine) {
        window.shapes.push({
          type: "line",
          x1: perpLine.x1,
          y1: perpLine.y1,
          x2: perpLine.x2,
          y2: perpLine.y2,
          color: window.currentColor || "#00ffff",
        });
        if (window.updateSnapPoints) window.updateSnapPoints();
        if (window.saveState) window.saveState();
      }
    }

    window.startPt = null;
  }
}

function handleParallelMode(x, y) {
  // Nejdříve zkontroluj, zda jsou vybrané prvky (A, B)
  if (window.selectedItems && window.selectedItems.length >= 2) {
    const itemA = window.selectedItems[0];
    const itemB = window.selectedItems[1];

    // Rovnoběžka: bod (A) a čára (B) NEBO čára (A) a bod (B)
    let point = null;
    let line = null;

    if (itemA.category === "point" && itemB.category === "shape" && itemB.type === "line") {
      point = itemA;
      line = itemB.ref;
    } else if (itemB.category === "point" && itemA.category === "shape" && itemA.type === "line") {
      point = itemB;
      line = itemA.ref;
    }

    if (point && line && window.parallel) {
      // Vzdálenost = vzdálenost bodu od čáry
      const offsetDist = Math.abs(pointToLineDistance(point.x, point.y, line.x1, line.y1, line.x2, line.y2));
      const parLine = window.parallel(line, offsetDist);

      if (parLine) {
        window.shapes.push({
          type: "line",
          x1: parLine.x1,
          y1: parLine.y1,
          x2: parLine.x2,
          y2: parLine.y2,
          color: window.currentColor || "#ffff00",
        });
        if (window.updateSnapPoints) window.updateSnapPoints();
        if (window.saveState) window.saveState();
        window.selectedItems = []; // Vymaž výběr
        if (window.draw) window.draw();
        return;
      }
    }
  }

  // Normální režim - bez vybraných prvků
  if (!window.startPt) {
    window.startPt = { x, y };
  } else {
    if (!window.shapes) return;
    const line = window.shapes.find((s) => {
      if (s.type !== "line") return false;
      const d = pointToLineDistance(x, y, s.x1, s.y1, s.x2, s.y2);
      return d < 10 / (window.zoom || 2);
    });

    if (line && window.parallel) {
      const offsetDist = 10; // Default distance
      const parLine = window.parallel(line, offsetDist);

      if (parLine) {
        window.shapes.push({
          type: "line",
          x1: parLine.x1,
          y1: parLine.y1,
          x2: parLine.x2,
          y2: parLine.y2,
          color: window.currentColor || "#ffff00",
        });
        if (window.updateSnapPoints) window.updateSnapPoints();
        if (window.saveState) window.saveState();
      }
    }

    window.startPt = null;
  }
}

function handleExtendMode(x, y) {
  if (!window.shapes) return;

  // Najdi čáru kterou prodlužujeme
  const line = window.shapes.find((s) => {
    if (s.type !== "line") return false;
    const d = pointToLineDistance(x, y, s.x1, s.y1, s.x2, s.y2);
    return d < 10 / (window.zoom || 2);
  });

  if (!line) return;

  // Rozhodnej, kterým koncem prodlužujeme (podle blízkosti ke kurzoru)
  const dist1 = Math.hypot(x - line.x1, y - line.y1);
  const dist2 = Math.hypot(x - line.x2, y - line.y2);
  const extendFromStart = dist1 < dist2;

  // Hledej nejbližší průsečík
  let closestIntersect = null;
  let minDist = Infinity;

  for (let i = 0; i < window.shapes.length; i++) {
    const other = window.shapes[i];
    if (other === line) continue;

    let intersects = [];

    if (other.type === "line") {
      const pt = window.lineLineIntersect ? window.lineLineIntersect(line, other) : null;
      if (pt) intersects.push(pt);
    } else if (other.type === "circle") {
      if (window.lineCircleIntersect) {
        intersects = window.lineCircleIntersect(line, other) || [];
      }
    }

    intersects.forEach((pt) => {
      const d = extendFromStart
        ? Math.hypot(pt.x - line.x1, pt.y - line.y1)
        : Math.hypot(pt.x - line.x2, pt.y - line.y2);
      if (d < minDist) {
        minDist = d;
        closestIntersect = pt;
      }
    });
  }

  if (closestIntersect) {
    if (extendFromStart) {
      line.x1 = closestIntersect.x;
      line.y1 = closestIntersect.y;
    } else {
      line.x2 = closestIntersect.x;
      line.y2 = closestIntersect.y;
    }
    if (window.updateSnapPoints) window.updateSnapPoints();
    if (window.saveState) window.saveState();
  }
}

function handleTrimMode(x, y) {
  // Nejdříve zkontroluj, zda jsou vybrané prvky (A, B...)
  if (window.selectedItems && window.selectedItems.length >= 1) {
    // Pokud jsou vybrané čáry, ořízni je k bodu/průsečíku
    const linesToTrim = window.selectedItems.filter(item =>
      item.category === "shape" && item.type === "line"
    );

    if (linesToTrim.length > 0) {
      // Pokud je vybrán bod, ořízni všechny čáry k tomuto bodu
      const pointItems = window.selectedItems.filter(item => item.category === "point");

      linesToTrim.forEach(lineItem => {
        const line = lineItem.ref;

        if (pointItems.length > 0) {
          // Ořízni k prvnímu vybranému bodu
          const point = pointItems[0];
          const trimmedLine = window.trimLine(line, { x: point.x, y: point.y });
          const idx = window.shapes.indexOf(line);
          if (idx >= 0) window.shapes[idx] = trimmedLine;
        } else if (linesToTrim.length > 1) {
          // Pokud máš více čar vybraných, ořízni k prvnímu průsečíku
          const otherLines = linesToTrim.filter(l => l !== lineItem).map(l => l.ref);

          for (let otherLine of otherLines) {
            const intersection = window.lineLineIntersect ? window.lineLineIntersect(line, otherLine) : null;
            if (intersection) {
              const trimmedLine = window.trimLine(line, intersection);
              const idx = window.shapes.indexOf(line);
              if (idx >= 0) window.shapes[idx] = trimmedLine;
              break;
            }
          }
        }
      });

      window.selectedItems = []; // Vymaž výběr
      if (window.updateSnapPoints) window.updateSnapPoints();
      if (window.saveState) window.saveState();
      if (window.draw) window.draw();
      return;
    }
  }

  // Normální režim - bez vybraných prvků
  if (!window.shapes) return;
  const line = window.shapes.find((s) => {
    if (s.type !== "line") return false;
    const d = pointToLineDistance(x, y, s.x1, s.y1, s.x2, s.y2);
    return d < 10 / (window.zoom || 2);
  });

  if (line && window.trimLine) {
    // Ořezat linku v místě kliknutí
    const trimmedLine = window.trimLine(line, { x, y });
    const idx = window.shapes.indexOf(line);
    window.shapes[idx] = trimmedLine;
    if (window.updateSnapPoints) window.updateSnapPoints();
    if (window.saveState) window.saveState();
  }
}

function handleOffsetMode(x, y) {
  if (!window.shapes) return;
  const tolerance = 10 / (window.zoom || 2);

  const line = window.shapes.find((s) => {
    if (s.type !== "line") return false;
    const d = pointToLineDistance(x, y, s.x1, s.y1, s.x2, s.y2);
    return d < tolerance;
  });

  if (line) {
    // Zeptat se uživatele na vzdálenost offsetu
    const userInput = prompt(
      "Zadej vzdálenost odsazení (mm):",
      window.offsetDistance || 10
    );

    if (userInput !== null) {
      const newDist = parseFloat(userInput);
      if (!isNaN(newDist) && newDist > 0) {
        if (!window.offsetDistance) window.offsetDistance = newDist;

        // Použít parallel funkci pro vytvoření rovnoběžky
        if (window.parallel) {
          const newLine = window.parallel(line, newDist);
          window.shapes.push(newLine);
        } else {
          // Fallback na ruční výpočet
          const dx = line.x2 - line.x1;
          const dy = line.y2 - line.y1;
          const len = Math.hypot(dx, dy);
          const offsetX = (-dy / len) * newDist;
          const offsetY = (dx / len) * newDist;

          window.shapes.push({
            type: "line",
            x1: line.x1 + offsetX,
            y1: line.y1 + offsetY,
            x2: line.x2 + offsetX,
            y2: line.y2 + offsetY,
          });
        }

        if (window.updateSnapPoints) window.updateSnapPoints();
        if (window.saveState) window.saveState();
      } else {
        alert("Neplatná hodnota! Zadej kladné číslo.");
      }
    }
  }
}

function handleMirrorMode(x, y) {
  if (!window.shapes) return;

  // KROK 1: Vybrat objekt k zrcadlení (Line nebo Circle)
  if (!window.selectedShape) {
    const found = window.shapes.find((s) => {
      if (s.type === "line") {
        const d = pointToLineDistance(x, y, s.x1, s.y1, s.x2, s.y2);
        return d < 10 / (window.zoom || 2);
      } else if (s.type === "circle") {
        return (
          Math.abs(Math.hypot(x - s.cx, y - s.cy) - s.r) < 10 / (window.zoom || 2)
        );
      }
      return false;
    });

    if (found) {
      window.selectedShape = found;
      // TODO: Zvýraznit vybraný objekt vizuálně
    }
  }
  // KROK 2: Vybrat osu zrcadlení (musí to být Line)
  else {
    const axisLine = window.shapes.find((s) => {
      if (s.type !== "line") return false;
      const d = pointToLineDistance(x, y, s.x1, s.y1, s.x2, s.y2);
      return d < 10 / (window.zoom || 2);
    });

    if (axisLine && window.getMirrorPoint) {
      // Provést zrcadlení
      if (window.selectedShape.type === "line") {
        const p1 = window.getMirrorPoint(
          window.selectedShape.x1,
          window.selectedShape.y1,
          axisLine.x1,
          axisLine.y1,
          axisLine.x2,
          axisLine.y2
        );
        const p2 = window.getMirrorPoint(
          window.selectedShape.x2,
          window.selectedShape.y2,
          axisLine.x1,
          axisLine.y1,
          axisLine.x2,
          axisLine.y2
        );

        if (p1 && p2) {
          window.shapes.push({
            type: "line",
            x1: p1.x,
            y1: p1.y,
            x2: p2.x,
            y2: p2.y,
          });
        }
      } else if (window.selectedShape.type === "circle") {
        const c = window.getMirrorPoint(
          window.selectedShape.cx,
          window.selectedShape.cy,
          axisLine.x1,
          axisLine.y1,
          axisLine.x2,
          axisLine.y2
        );

        if (c) {
          window.shapes.push({
            type: "circle",
            cx: c.x,
            cy: c.y,
            r: window.selectedShape.r,
          });
        }
      }

      // Reset
      window.selectedShape = null;
      if (window.updateSnapPoints) window.updateSnapPoints();
      if (window.saveState) window.saveState();
    }
  }
}

function handleEraseMode(x, y) {
  if (!window.shapes) return;
  const tolerance = 10 / (window.zoom || 2);

  // Najít v shapes
  const shapeIdx = window.shapes.findIndex((s) => {
    if (s.type === "line") {
      const d = pointToLineDistance(x, y, s.x1, s.y1, s.x2, s.y2);
      return d < tolerance;
    } else if (s.type === "circle") {
      return Math.abs(Math.hypot(x - s.cx, y - s.cy) - s.r) < tolerance;
    }
    return false;
  });

  if (shapeIdx >= 0) {
    window.shapes.splice(shapeIdx, 1);
    if (window.updateSnapPoints) window.updateSnapPoints();
    if (window.saveState) window.saveState();
    return;
  }

  // Najít v points
  if (window.points) {
    for (let i = 0; i < window.points.length; i++) {
      const p = window.points[i];
      const dist = Math.hypot(x - p.x, y - p.y);
      if (dist < tolerance) {
        window.points.splice(i, 1);
        if (window.updateSnapPoints) window.updateSnapPoints();
        if (window.saveState) window.saveState();
        return;
      }
    }
  }
}

function handleMeasureMode(x, y) {
  const tolerance = 10 / (window.zoom || 2);
  const shape = window.shapes && window.shapes.find((s) => {
    if (s.type === "line") {
      const d = pointToLineDistance(x, y, s.x1, s.y1, s.x2, s.y2);
      return d < tolerance;
    } else if (s.type === "circle") {
      return Math.abs(Math.hypot(x - s.cx, y - s.cy) - s.r) < tolerance;
    }
    return false;
  });

  if (shape) {
    let msg = "";
    if (shape.type === "line") {
      const len = Math.hypot(
        shape.x2 - shape.x1,
        shape.y2 - shape.y1
      ).toFixed(2);
      msg = `Čára: ${len}`;
    } else if (shape.type === "circle") {
      const d = (shape.r * 2).toFixed(2);
      msg = `Kružnice: Ø${d} (r=${shape.r.toFixed(2)})`;
    }

    const infoPanel = document.getElementById("measureInfo");
    if (infoPanel) {
      infoPanel.textContent = msg;
      infoPanel.style.display = "block";
    }
  }
}

function handleDimensionMode(x, y) {
  const tolerance = 10 / (window.zoom || 2);

  // 1. Hledej existující kóty pro úpravu
  const existingDim = window.shapes && window.shapes.find((s) => {
    if (s.type !== "dimension") return false;

    if (s.dimType === "linear") {
      const d = pointToLineDistance(x, y, s.x1, s.y1, s.x2, s.y2);
      return d < tolerance;
    } else if (s.dimType === "radius") {
      const dToCenter = Math.hypot(x - s.cx, y - s.cy);
      return Math.abs(dToCenter - s.r * window.zoom) < tolerance;
    } else if (s.dimType === "center") {
      return Math.hypot(x - s.cx, y - s.cy) < tolerance;
    }
    return false;
  });

  if (existingDim) {
    // Úprava existující kóty - BEZ PROMPTU, pouze se přidá nová kóta
    return;
  }

  // 2. Vytváří nové kóty - hledej objekty k okótování
  const shape = window.shapes && window.shapes.find((s) => {
    if (s.type === "line") {
      const d = pointToLineDistance(x, y, s.x1, s.y1, s.x2, s.y2);
      return d < tolerance;
    } else if (s.type === "circle") {
      const dToCenter = Math.hypot(x - s.cx, y - s.cy);
      return Math.abs(dToCenter - s.r) < tolerance;
    }
    // POZN: Obdélníky již nejsou - jsou konvertovány na 4 linie hned od vytvoření
    return false;
  });

  if (!shape) {
    return;
  }

  if (shape.type === "line") {
    // Lineární kóta
    const len = Math.hypot(
      shape.x2 - shape.x1,
      shape.y2 - shape.y1
    );

    window.shapes.push({
      type: "dimension",
      dimType: "linear",
      target: shape,
      value: len,
      x1: shape.x1,
      y1: shape.y1,
      x2: shape.x2,
      y2: shape.y2,
      color: "#ffa500",
    });
  } else if (shape.type === "circle") {
    // Radius kóta + center
    const displayR = window.xMeasureMode === "diameter" ? shape.r * 2 : shape.r;
    const label = window.xMeasureMode === "diameter" ? "⌀" : "R";

    window.shapes.push({
      type: "dimension",
      dimType: "radius",
      target: shape,
      value: displayR,
      label: label,
      cx: shape.cx,
      cy: shape.cy,
      r: shape.r,
      color: "#ffa500",
    });

    window.shapes.push({
      type: "dimension",
      dimType: "center",
      cx: shape.cx,
      cy: shape.cy,
      color: "#ffa500",
    });
  }
  // POZN: Detekce obdélníků odebrana - obdélníky jsou nyní 4 linie

  if (window.saveState) window.saveState();
  if (window.draw) window.draw();
}

function handleArcMode(x, y) {
  if (!window.startPt) {
    window.startPt = { x, y };
  } else {
    window.tempShape = {
      type: "arc",
      x1: window.startPt.x,
      y1: window.startPt.y,
      x2: x,
      y2: y,
      angle: 45,
    };
    showArcInputModal();
  }
}

function showArcInputModal() {
  const modal = document.getElementById("quickInputModal");
  if (!modal) return;

  const input = modal.querySelector("input");
  if (input) {
    input.value = "45";
    input.onchange = function () {
      if (window.tempShape) {
        window.tempShape.angle = parseFloat(this.value) || 45;
      }
    };
  }

  modal.style.display = "flex";

  const btn = modal.querySelector("button");
  if (btn) {
    btn.onclick = function () {
      if (!window.shapes || !window.tempShape) return;
      window.shapes.push({
        type: "arc",
        x1: window.tempShape.x1,
        y1: window.tempShape.y1,
        x2: window.tempShape.x2,
        y2: window.tempShape.y2,
        angle: window.tempShape.angle,
        color: window.currentColor || "#ffff00",
      });
      window.startPt = null;
      window.tempShape = null;
      modal.style.display = "none";
      if (window.updateSnapPoints) window.updateSnapPoints();
      if (window.saveState) window.saveState();
      if (window.draw) window.draw();
    };
  }
}

// ===== KEYBOARD HANDLERS =====
// ✅ Keyboard events nyní spravuje unified keyboard.js
// Jednotlivé handlers (undo, redo, delete, atd.) se volají odtud

// ===== HELPER FUNCTIONS =====

function pointToLineDistance(px, py, x1, y1, x2, y2) {
  const A = px - x1;
  const B = py - y1;
  const C = x2 - x1;
  const D = y2 - y1;

  const dot = A * C + B * D;
  const lenSq = C * C + D * D;
  let param = -1;

  if (lenSq !== 0) param = dot / lenSq;

  let xx, yy;

  if (param < 0) {
    xx = x1;
    yy = y1;
  } else if (param > 1) {
    xx = x2;
    yy = y2;
  } else {
    xx = x1 + param * C;
    yy = y1 + param * D;
  }

  return Math.hypot(px - xx, py - yy);
}

// ===== HELPER FUNKCE PRO GEOMETRII =====

function tangentFromPoint(circle, point) {
  const dx = point.x - circle.cx;
  const dy = point.y - circle.cy;
  const dist = Math.sqrt(dx * dx + dy * dy);

  if (dist < circle.r) return null; // Bod uvnitř kružnice

  const angle = Math.atan2(dy, dx);
  const tangentAngle = Math.asin(circle.r / dist);

  const tangents = [];
  for (let sign of [-1, 1]) {
    const a = angle + sign * tangentAngle;
    const touchX =
      circle.cx + circle.r * Math.cos(a + (sign * Math.PI) / 2);
    const touchY =
      circle.cy + circle.r * Math.sin(a + (sign * Math.PI) / 2);
    tangents.push({
      x1: point.x,
      y1: point.y,
      x2: touchX,
      y2: touchY,
    });
  }
  return tangents;
}

function perpendicular(px, py, x1, y1, x2, y2) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = Math.sqrt(dx * dx + dy * dy);

  // Směrový vektor kolmice
  const perpX = (-dy / len) * 50; // Délka kolmice 50mm
  const perpY = (dx / len) * 50;

  return {
    x1: px - perpX,
    y1: py - perpY,
    x2: px + perpX,
    y2: py + perpY,
  };
}

function parallel(line, distance) {
  const dx = line.x2 - line.x1;
  const dy = line.y2 - line.y1;
  const len = Math.sqrt(dx * dx + dy * dy);

  const offsetX = (-dy / len) * distance;
  const offsetY = (dx / len) * distance;

  return {
    x1: line.x1 + offsetX,
    y1: line.y1 + offsetY,
    x2: line.x2 + offsetX,
    y2: line.y2 + offsetY,
  };
}

function trimLine(x1, y1, x2, y2, cutX, cutY) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = Math.sqrt(dx * dx + dy * dy);

  const t = ((cutX - x1) * dx + (cutY - y1) * dy) / (len * len);

  if (t < 0.5) {
    return {
      x1: cutX,
      y1: cutY,
      x2: x2,
      y2: y2,
    };
  } else {
    return {
      x1: x1,
      y1: y1,
      x2: cutX,
      y2: cutY,
    };
  }
}

function getMirrorPoint(px, py, lx1, ly1, lx2, ly2) {
  // Line: A*x + B*y + C = 0
  const A = ly1 - ly2;
  const B = lx2 - lx1;
  const C = -A * lx1 - B * ly1;

  // Vzdálenost bodu od přímky
  const dist = (A * px + B * py + C) / Math.sqrt(A * A + B * B);

  // Zrcadlový bod
  const k = -2 * dist / Math.sqrt(A * A + B * B);

  return {
    x: px + k * A,
    y: py + k * B,
  };
}

// ===== COLOR PICKER MODE =====

function handleColorPickerMode(x, y) {
  console.log("[handleColorPickerMode] START - colorPickerMode =", window.colorPickerMode);

  // Kontrola colorPickerMode
  if (!window.colorPickerMode) {
    console.log("[handleColorPickerMode] colorPickerMode je false, vracím se");
    return;
  }

  // Najít objekt pod kurzorem
  const clickPoint = { x, y };
  let foundItem = null;

  console.log("[handleColorPickerMode] hledám tvary, máme", window.shapes ? window.shapes.length : 0, "tvarů");

  // Hledat v tvary
  for (let s of window.shapes) {
    if (isPointNearShape(clickPoint, s)) {
      console.log("[handleColorPickerMode] Našel jsem tvar:", s.type);
      foundItem = { ref: s, category: "shape", label: null };
      break;
    }
  }

  if (foundItem) {
    console.log("[handleColorPickerMode] Aplikuji barvu a styl");

    // Aplikovat vybranou barvu a styl na objekt
    if (window.colorStyleSelected && window.colorStyleSelected.color) {
      console.log("[handleColorPickerMode] Nastavuji barvu na", window.colorStyleSelected.color);
      foundItem.ref.color = window.colorStyleSelected.color;
    }
    if (window.colorStyleSelected && window.colorStyleSelected.lineStyle) {
      console.log("[handleColorPickerMode] Nastavuji styl na", window.colorStyleSelected.lineStyle);
      foundItem.ref.lineStyle = window.colorStyleSelected.lineStyle;
    }

    // Ukončit colorPicker režim
    window.colorPickerMode = false;
    window.mode = "pan";

    if (window.saveState) window.saveState();
    window.showInfoNotification("✅ Změna aplikována!", 1000);
  } else {
    console.log("[handleColorPickerMode] Nic nenalezeno pod kurzorem");
    window.showInfoNotification("Klikli jste mimo objekt. Zkuste znovu.", 1000);
  }

  if (window.draw) window.draw();
}

function distancePointToLine(point, line) {
  // Vzdálenost bodu od úsečky (line.x1, line.y1) - (line.x2, line.y2)
  const x1 = line.x1;
  const y1 = line.y1;
  const x2 = line.x2;
  const y2 = line.y2;
  const px = point.x;
  const py = point.y;

  const num = Math.abs((y2 - y1) * px - (x2 - x1) * py + x2 * y1 - y2 * x1);
  const den = Math.sqrt((y2 - y1) ** 2 + (x2 - x1) ** 2);

  return den === 0 ? 0 : num / den;
}

function isPointNearShape(point, shape) {
  const tolerance = 10 / window.zoom; // 10 pixelů

  if (shape.type === "line") {
    const dist = distancePointToLine(point, shape);
    return dist < tolerance;
  } else if (shape.type === "circle") {
    const dist = Math.sqrt(
      (point.x - shape.cx) ** 2 + (point.y - shape.cy) ** 2
    );
    return Math.abs(dist - shape.r) < tolerance;
  } else if (shape.type === "rectangle") {
    const minX = Math.min(shape.x1, shape.x2);
    const maxX = Math.max(shape.x1, shape.x2);
    const minY = Math.min(shape.y1, shape.y2);
    const maxY = Math.max(shape.y1, shape.y2);

    const onLine =
      (point.x >= minX - tolerance &&
        point.x <= maxX + tolerance &&
        Math.abs(point.y - minY) < tolerance) ||
      (point.x >= minX - tolerance &&
        point.x <= maxX + tolerance &&
        Math.abs(point.y - maxY) < tolerance) ||
      (point.y >= minY - tolerance &&
        point.y <= maxY + tolerance &&
        Math.abs(point.x - minX) < tolerance) ||
      (point.y >= minY - tolerance &&
        point.y <= maxY + tolerance &&
        Math.abs(point.x - maxX) < tolerance);

    return onLine;
  } else if (shape.type === "arc") {
    const dist = Math.sqrt(
      (point.x - shape.cx) ** 2 + (point.y - shape.cy) ** 2
    );
    return Math.abs(dist - shape.r) < tolerance;
  }

  return false;
}

// ===== INITIALIZATION =====

// ✅ setupCanvasEvents je nyní volaná z init.js
// Aby se předešlo dvojitému volání a zajistilo se, že jsou globální funkce připraveny

// ===== EXPORT HELPER FUNCTIONS =====
window.perpendicular = perpendicular;
window.parallel = parallel;
window.trimLine = trimLine;
window.getMirrorPoint = getMirrorPoint;
window.tangentFromPoint = tangentFromPoint;
// ===== FÁZA 6 PARTIAL COMPLETION - Canvas event handlers =====
// Event handlery nyní integrují Soustruznik.state
// getCanvasState() helper umožňuje fallback k globálním proměnným

// ===== REŽIM MĚŘENÍ =====
window.measurementMode = false;
window.measurementItems = [];

window.toggleMeasurementMode = function() {
  window.measurementMode = !window.measurementMode;
  window.measurementItems = [];

  if (window.measurementMode) {
    window.mode = "select";  // Použij select mode pro výběr
    const btn = document.getElementById("btnMeasurement");
    if (btn) btn.classList.add("active");
    const info = document.getElementById("modeInfo");
    if (info) {
      info.innerHTML = `📏 <strong>MĚŘENÍ</strong>: Klikni na 2 objekty pro měření vzdálenosti<br/><small>(Bod-Bod, Bod-Čára, apod.)</small>`;
    }
  } else {
    window.measurementItems = [];
    const btn = document.getElementById("btnMeasurement");
    if (btn) btn.classList.remove("active");
  }

  if (window.draw) window.draw();
};

// Přepsaní handleSelectMode když je měření aktivní
const originalHandleSelectMode = window.handleSelectMode || handleSelectMode;

window.handleSelectMode = function(x, y, shiftKey) {
  if (window.measurementMode) {
    // V režimu měření sbíraj maximálně 2 objekty
    const tolerance = 5 / (window.zoom || 2);
    let found = null;

    // Hledat bod
    const found_point = window.points && window.points.find((p) => {
      return Math.hypot(p.x - x, p.y - y) < tolerance;
    });

    if (found_point) {
      found = {
        category: "point",
        x: found_point.x,
        y: found_point.y,
        ref: found_point,
      };
    } else {
      // Hledat tvar
      const found_shape = window.shapes && window.shapes.find((s) => {
        if (s.type === "dimension") return false;
        if (s.type === "line") {
          const d = pointToLineDistance(x, y, s.x1, s.y1, s.x2, s.y2);
          return d < tolerance;
        } else if (s.type === "circle") {
          return Math.abs(Math.hypot(x - s.cx, y - s.cy) - s.r) < tolerance;
        }
        return false;
      });

      if (found_shape) {
        // Pokud je to usečka, spočítej nejbližší bod na usečce (kde uživatel klikl)
        let clickPoint = { x: x, y: y };
        if (found_shape.type === "line") {
          clickPoint = pointToLineClosestPoint(x, y, found_shape.x1, found_shape.y1, found_shape.x2, found_shape.y2);
        }

        found = {
          category: "shape",
          type: found_shape.type,
          ref: found_shape,
          clickX: clickPoint.x, // Bod kde uživatel klikl
          clickY: clickPoint.y,
        };
      } else {
      }
      // Pokud nic není najito, nic se nepřidá (ne vytvářet nové body!)
    }

    if (found) {
      // Zjisti jestli je už vybraný
      const index = window.measurementItems.findIndex((i) => {
        if (found.category === "point" && i.category === "point") {
          return Math.abs(i.x - found.x) < 0.0001 && Math.abs(i.y - found.y) < 0.0001;
        } else if (found.category === "shape" && i.category === "shape") {
          return i.ref === found.ref;
        }
        return false;
      });

      if (index > -1) {
        // Odebrat
        window.measurementItems.splice(index, 1);
      } else if (window.measurementItems.length < 2) {
        // Type-aware: První objekt určuje typ měření
        let canAdd = true;

        if (window.measurementItems.length === 1) {
          const firstItem = window.measurementItems[0];
          const isFirstLine = firstItem.category === "shape" && firstItem.ref.type === "line";
          const isFirstPoint = firstItem.category === "point";
          const isFoundLine = found.category === "shape" && found.ref.type === "line";
          const isFoundPoint = found.category === "point";

          // Měření usečky: druhý musí být usečka
          if (isFirstLine && !isFoundLine) {
            canAdd = false; // Ignoruj - čekáme na druhou usečku
          }
          // Měření bodů: druhý musí být bod
          else if (isFirstPoint && !isFoundPoint) {
            canAdd = false; // Ignoruj - čekáme na druhý bod
          }
        }

        if (canAdd) {
          window.measurementItems.push(found);
        }
      }
    }

    if (window.draw) window.draw();
  } else {
    // Normální select mode
    originalHandleSelectMode.call(window, x, y, shiftKey);
  }
};


// ===== EXPORT =====
if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    setupCanvasEvents,
  };
}
