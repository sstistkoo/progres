/**
 * CANVAS.JS - Canvas event handlers a kreslicí logika
 * - Mouse events (draw, pan, select)
 * - Touch events
 * - Keyboard shortcuts
 * - Drawing operations
 */

// ===== CANVAS SETUP =====

function setupCanvasEvents() {
  const canvas = document.getElementById("canvas");
  if (!canvas) return;

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

  // Keyboard
  document.addEventListener("keydown", onKeyDown);
  document.addEventListener("keyup", onKeyUp);
}

// ===== MOUSE HANDLERS =====

function onCanvasMouseDown(e) {
  if (!window.mode || !window.snapPoint) return;

  const canvas = e.target;
  const rect = canvas.getBoundingClientRect();
  const screenX = e.clientX - rect.left;
  const screenY = e.clientY - rect.top;

  const worldPt = window.screenToWorld(screenX, screenY);
  const snapped = window.snapPoint(worldPt.x, worldPt.y);

  if (e.button === 2) {
    // Pravé tlačítko = zrušit
    window.clearMode();
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

  const worldPt = window.screenToWorld ? window.screenToWorld(screenX, screenY) : { x: 0, y: 0 };
  const snapped = window.snapPoint ? window.snapPoint(worldPt.x, worldPt.y) : worldPt;

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
  }
}

function onCanvasMouseUp(e) {
  window.panning = false;
  window.panStart = null;
}

function onCanvasWheel(e) {
  e.preventDefault();

  const canvas = document.getElementById("canvas");
  const rect = canvas.getBoundingClientRect();
  const screenX = e.clientX - rect.left;
  const screenY = e.clientY - rect.top;

  const worldBefore = window.screenToWorld ? window.screenToWorld(screenX, screenY) : { x: 0, y: 0 };

  const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
  if (window.zoom !== undefined) {
    window.zoom *= zoomFactor;
    window.zoom = Math.max(0.1, Math.min(window.zoom, 100));
  }

  const worldAfter = window.screenToWorld ? window.screenToWorld(screenX, screenY) : { x: 0, y: 0 };

  if (window.panX !== undefined) window.panX += (worldBefore.x - worldAfter.x) * (window.zoom || 2);
  if (window.panY !== undefined) window.panY += (worldBefore.y - worldAfter.y) * (window.zoom || 2);

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
  if (!window.points) return;
  window.points.push({ x, y, temp: false });
  if (window.updateSnapPoints) window.updateSnapPoints();
}

function handleLineMode(x, y) {
  if (!window.startPt) {
    window.startPt = { x, y };
  } else {
    if (!window.shapes) return;
    window.shapes.push({
      type: "line",
      x1: window.startPt.x,
      y1: window.startPt.y,
      x2: x,
      y2: y,
      color: window.currentColor || "#ff0000",
    });
    window.startPt = null;
    window.tempShape = null;
    if (window.updateSnapPoints) window.updateSnapPoints();
    if (window.saveState) window.saveState();
  }
}

function handleCircleMode(x, y) {
  if (!window.startPt) {
    window.startPt = { x, y };
  } else {
    if (!window.shapes) return;
    const r = Math.sqrt((x - window.startPt.x) ** 2 + (y - window.startPt.y) ** 2);
    window.shapes.push({
      type: "circle",
      cx: window.startPt.x,
      cy: window.startPt.y,
      r: r,
      color: window.currentColor || "#00ff00",
    });
    window.startPt = null;
    window.tempShape = null;
    if (window.updateSnapPoints) window.updateSnapPoints();
    if (window.saveState) window.saveState();
  }
}

function handleSelectMode(x, y, shiftKey) {
  if (!window.selectedItems) window.selectedItems = [];

  let found = null;

  // Hledat blízký bod (tolerance 5px)
  const tolerance = 5 / (window.zoom || 2);
  const found_point = window.points && window.points.find((p) => {
    return Math.hypot(p.x - x, p.y - y) < tolerance;
  });

  if (found_point) {
    found = found_point;
  } else {
    // Hledat blízký tvar
    const found_shape = window.shapes && window.shapes.find((s) => {
      if (s.type === "line") {
        const d = pointToLineDistance(x, y, s.x1, s.y1, s.x2, s.y2);
        return d < tolerance;
      } else if (s.type === "circle") {
        return Math.abs(Math.hypot(x - s.cx, y - s.cy) - s.r) < tolerance;
      }
      return false;
    });
    if (found_shape) found = found_shape;
  }

  if (!shiftKey) {
    window.selectedItems.length = 0;
  }

  if (found && !window.selectedItems.includes(found)) {
    window.selectedItems.push(found);
  }

  if (window.updateSelectionUI) window.updateSelectionUI();
}

function handleTangentMode(x, y) {
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
      const parLine = window.parallel(
        window.startPt.x,
        window.startPt.y,
        line.x1,
        line.y1,
        line.x2,
        line.y2
      );

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

function onKeyDown(e) {
  if (e.key === "Escape") {
    window.clearMode();
  } else if ((e.ctrlKey || e.metaKey) && e.key === "z") {
    e.preventDefault();
    if (window.undo) window.undo();
  } else if ((e.ctrlKey || e.metaKey) && (e.key === "y" || (e.shiftKey && e.key === "Z"))) {
    e.preventDefault();
    if (window.redo) window.redo();
  } else if ((e.ctrlKey || e.metaKey) && e.key === "s") {
    e.preventDefault();
    if (window.saveProject) window.saveProject();
  } else if (e.key === "Delete" || e.key === "Backspace") {
    if (window.selectedItems && window.selectedItems.length > 0) {
      window.selectedItems.forEach((item) => {
        const idx = window.shapes.indexOf(item);
        if (idx >= 0) {
          window.shapes.splice(idx, 1);
        }
        const pidx = window.points.indexOf(item);
        if (pidx >= 0) {
          window.points.splice(pidx, 1);
        }
      });
      window.selectedItems.length = 0;
      if (window.updateSnapPoints) window.updateSnapPoints();
      if (window.saveState) window.saveState();
      if (window.draw) window.draw();
    }
  }
}

function onKeyUp(e) {
  // Keyboard events peuvent être přidány zde
}

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

// ===== INITIALIZATION =====

document.addEventListener("DOMContentLoaded", setupCanvasEvents);

// ===== EXPORT =====
if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    setupCanvasEvents,
  };
}
