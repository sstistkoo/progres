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

function handleTrimMode(x, y) {
  if (!window.shapes) return;
  const line = window.shapes.find((s) => {
    if (s.type !== "line") return false;
    const d = pointToLineDistance(x, y, s.x1, s.y1, s.x2, s.y2);
    return d < 10 / (window.zoom || 2);
  });

  if (line) {
    const idx = window.shapes.indexOf(line);
    window.shapes.splice(idx, 1);
    if (window.updateSnapPoints) window.updateSnapPoints();
    if (window.saveState) window.saveState();
  }
}

function handleOffsetMode(x, y) {
  const dist = window.offsetDistance || 10;
  if (!window.shapes) return;
  const line = window.shapes.find((s) => {
    if (s.type !== "line") return false;
    const d = pointToLineDistance(x, y, s.x1, s.y1, s.x2, s.y2);
    return d < 10 / (window.zoom || 2);
  });

  if (line) {
    const dx = line.x2 - line.x1;
    const dy = line.y2 - line.y1;
    const len = Math.hypot(dx, dy);
    const nx = -dy / len;
    const ny = dx / len;

    window.shapes.push({
      type: "line",
      x1: line.x1 + nx * dist,
      y1: line.y1 + ny * dist,
      x2: line.x2 + nx * dist,
      y2: line.y2 + ny * dist,
      color: window.currentColor || "#ffaaff",
    });
    if (window.updateSnapPoints) window.updateSnapPoints();
    if (window.saveState) window.saveState();
  }
}

function handleMirrorMode(x, y) {
  if (!window.startPt) {
    window.startPt = { x, y };
  } else {
    if (!window.shapes) return;
    const mirrorLine = window.shapes.find((s) => {
      if (s.type !== "line") return false;
      const d = pointToLineDistance(x, y, s.x1, s.y1, s.x2, s.y2);
      return d < 10 / (window.zoom || 2);
    });

    if (mirrorLine && window.getMirrorPoint) {
      const p1 = window.getMirrorPoint(
        window.startPt.x,
        window.startPt.y,
        mirrorLine.x1,
        mirrorLine.y1,
        mirrorLine.x2,
        mirrorLine.y2
      );

      if (p1) {
        window.shapes.push({
          type: "line",
          x1: window.startPt.x,
          y1: window.startPt.y,
          x2: p1.x,
          y2: p1.y,
          color: window.currentColor || "#aaffaa",
        });
        if (window.updateSnapPoints) window.updateSnapPoints();
        if (window.saveState) window.saveState();
      }
    }

    window.startPt = null;
  }
}

function handleEraseMode(x, y) {
  if (!window.shapes) return;
  const idx = window.shapes.findIndex((s) => {
    if (s.type === "line") {
      const d = pointToLineDistance(x, y, s.x1, s.y1, s.x2, s.y2);
      return d < 10 / (window.zoom || 2);
    } else if (s.type === "circle") {
      return Math.abs(Math.hypot(x - s.cx, y - s.cy) - s.r) < 10 / (window.zoom || 2);
    }
    return false;
  });

  if (idx >= 0) {
    window.shapes.splice(idx, 1);
    if (window.updateSnapPoints) window.updateSnapPoints();
    if (window.saveState) window.saveState();
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
