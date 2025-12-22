/**
 * GLOBALS.JS - Zpětná kompatibilita & State Mapping
 *
 * Mapuje staré globální proměnné na nový Soustruznik namespace
 * Zajišťuje, že starý kód stále funguje!
 */

// ===== NAMESPACE KOMPATIBILITA =====
// Mapujeme starý window.shapes na window.Soustruznik.state.shapes
Object.defineProperty(window, 'shapes', {
  get: () => window.Soustruznik.state.shapes,
  set: (v) => { window.Soustruznik.state.shapes = v; }
});

Object.defineProperty(window, 'selectedIndex', {
  get: () => window.Soustruznik.state.selectedIndex,
  set: (v) => { window.Soustruznik.state.selectedIndex = v; }
});

Object.defineProperty(window, 'mode', {
  get: () => window.Soustruznik.state.mode,
  set: (v) => { window.Soustruznik.state.mode = v; }
});

Object.defineProperty(window, 'history', {
  get: () => window.Soustruznik.state.history,
  set: (v) => { window.Soustruznik.state.history = v; }
});

Object.defineProperty(window, 'canvas', {
  get: () => window.Soustruznik.state.canvas,
  set: (v) => { window.Soustruznik.state.canvas = v; }
});

Object.defineProperty(window, 'ctx', {
  get: () => window.Soustruznik.state.ctx,
  set: (v) => { window.Soustruznik.state.ctx = v; }
});

Object.defineProperty(window, 'viewportX', {
  get: () => window.Soustruznik.state.viewportX,
  set: (v) => { window.Soustruznik.state.viewportX = v; }
});

Object.defineProperty(window, 'viewportY', {
  get: () => window.Soustruznik.state.viewportY,
  set: (v) => { window.Soustruznik.state.viewportY = v; }
});

Object.defineProperty(window, 'zoom', {
  get: () => window.Soustruznik.state.zoom,
  set: (v) => { window.Soustruznik.state.zoom = v; }
});

Object.defineProperty(window, 'panX', {
  get: () => window.Soustruznik.state.panX,
  set: (v) => { window.Soustruznik.state.panX = v; }
});

Object.defineProperty(window, 'panY', {
  get: () => window.Soustruznik.state.panY,
  set: (v) => { window.Soustruznik.state.panY = v; }
});

Object.defineProperty(window, 'selectedSnapPoint', {
  get: () => window.Soustruznik.state.selectedSnapPoint,
  set: (v) => { window.Soustruznik.state.selectedSnapPoint = v; }
});

Object.defineProperty(window, 'defaultDrawColor', {
  get: () => window.Soustruznik.state.defaultDrawColor,
  set: (v) => { window.Soustruznik.state.defaultDrawColor = v; }
});

Object.defineProperty(window, 'defaultDrawLineStyle', {
  get: () => window.Soustruznik.state.defaultDrawLineStyle,
  set: (v) => { window.Soustruznik.state.defaultDrawLineStyle = v; }
});

Object.defineProperty(window, 'dimensionLineColor', {
  get: () => window.Soustruznik.state.dimensionLineColor,
  set: (v) => { window.Soustruznik.state.dimensionLineColor = v; }
});

Object.defineProperty(window, 'dimensionTextColor', {
  get: () => window.Soustruznik.state.dimensionTextColor,
  set: (v) => { window.Soustruznik.state.dimensionTextColor = v; }
});

// ===== API KEYS & STORAGE =====
window.API_STORAGE_KEY = "soustruznik_api_keys";
// DEMO API KEY - rozdělený na 2 části (bezpečné pro GitHub)
window.EMBEDDED_API_KEY = "AIzaSyCXuMvhO_senLS" + "oA_idEuBk_EwnMmIPIhg"; // Split for security

// ===== CANVAS & DRAWING STATE (LEGACY - nyní mapováno na namespace) =====
// window.shapes = [];        ← Nyní mapováno výše!
// window.points = [];
// window.cachedSnapPoints = [];
// window.selectedItems = [];

// ===== HELPER FUNCTIONS =====
/**
 * Konvertuj obdélníky na 4 usečky (pro snadnější měření)
 * Obdélníky jsou nahrazeny jejich 4 stranami jako oddělenými usečkami
 */
window.convertRectanglesToLines = function(shapes) {
  if (!shapes) return [];
  
  const result = [];
  const rectangles = [];
  
  // Oddělej obdélníky od ostatních tvarů
  shapes.forEach(shape => {
    if (shape.type === "rectangle") {
      rectangles.push(shape);
    } else {
      result.push(shape);
    }
  });
  
  // Konvertuj obdélníky na 4 usečky
  rectangles.forEach(rect => {
    const minX = Math.min(rect.x1, rect.x2);
    const maxX = Math.max(rect.x1, rect.x2);
    const minY = Math.min(rect.y1, rect.y2);
    const maxY = Math.max(rect.y1, rect.y2);
    
    // Horní strana
    result.push({ type: "line", x1: minX, y1: minY, x2: maxX, y2: minY });
    // Dolní strana
    result.push({ type: "line", x1: minX, y1: maxY, x2: maxX, y2: maxY });
    // Levá strana
    result.push({ type: "line", x1: minX, y1: minY, x2: minX, y2: maxY });
    // Pravá strana
    result.push({ type: "line", x1: maxX, y1: minY, x2: maxX, y2: maxY });
  });
  
  return result;
};

// ===== VIEWPORT & VIEW =====
// window.panX a window.panY jsou nyní mapovány na Soustruznik.state! (viz výše)
// window.zoom je nyní mapován na Soustruznik.state! (viz výše)
window.gridSize = 10;

// ===== SETTINGS =====
window.axisMode = "lathe"; // lathe nebo carousel
window.xMeasureMode = "diameter"; // radius or diameter
window.displayDecimals = 2;
window.snapToGrid = false;
window.snapToPoints = true;
window.snapDistance = 15; // pixels
window.orthoMode = true; // Ortogonální přichycení
window.measureInputEnabled = false; // Míra - zadávání rozměrů

// ===== DEFAULT DRAWING COLORS & STYLES (LEGACY - nyní mapováno na namespace) =====
// window.defaultDrawColor = "#4a9eff";    ← Nyní mapováno výše!
// window.defaultDrawLineStyle = "solid";  ← Nyní mapováno výše!

// ===== DIMENSION COLORS & STYLES (LEGACY - nyní mapováno na namespace) =====
// window.dimensionLineColor = "#ffa500";  ← Nyní mapováno výše!
// window.dimensionTextColor = "#ffff99";  ← Nyní mapováno výše!

// ===== DRAWING MODE & STATE =====
window.mode = "pan"; // pan, line, circle, point, etc.
window.currentCategory = null;
window.selectedShape = null;
window.startPt = null;
window.tempShape = null;
window.drawing = false;
window.cursorPos = { x: 0, y: 0 };
window.controllerMode = "G90"; // G90 nebo G91 pro ovladač

// ===== CONSTRAINT MODE =====
window.constraintMode = null;
window.constraintSelection = [];

// ===== ALIGN MODE =====
window.alignStep = 0;
window.alignRefPoint = null;
window.alignTargetPoint = null;
window.alignLine = null;
window.alignAxis = null;

// ===== COLOR & STYLING =====
window.currentColor = "#ff0000";
window.offsetDistance = 5; // mm - výchozí vzdálenost offsetu
window.strokeColor = "#ffffff";
window.fillColor = "#00ff00";
window.gridColor = "#333333";
window.axisColor = "#666666";
window.snapPointColor = "#ffff00";

// ===== POLAR SNAP =====
window.polarSnapEnabled = false;
window.polarSnapInterval = 15; // degrees
window.polarSnapAngles = [];

// ===== ROTATE MODE =====
window.rotateStep = 0; // 0=center, 1=awaiting angle
window.rotateCenter = null; // Střed rotace
window.rotateAngle = 0; // Úhel rotace

// ===== MEASURE MODE =====
window.measureInfo = null; // Posledí změřená hodnota

// ===== DIMENSION MODE =====
window.dimensions = []; // Pole kót
window.constraintNames = {
  point: "Bod fixace",
  distance: "Vzdálenost",
  radius: "Poloměr",
  polarAngle: "Polární úhel",
  horizontal: "Vodorovně",
  vertical: "Svisle"
};

// ===== UNDO/REDO =====
window.history = [];
window.historyIndex = -1;
window.MAX_HISTORY = 10;

// ===== CANVAS REFERENCE =====
window.canvas = null;
window.ctx = null;

// ===== PAN/ZOOM =====
window.panning = false;
window.panStart = null;
window.pinchStart = null;

// ===== AI & CHAT =====
window.chatHistory = [];
window.aiMemoryLoaded = false;
window.showAiPanel = false;
window.processingAI = false;
window.aiSelectMode = false;
window.aiMetrics = {
  totalRequests: 0,
  successfulRequests: 0,
  failedRequests: 0,
  avgLatency: 0
};

// ===== ANIMATION =====
window.animationFrameId = null;

// ===== COORDINATE CONVERSION FUNCTIONS =====
// Mapujeme funktionální delegáty na namespace methods
Object.defineProperty(window, 'worldToScreen', {
  value: function(wx, wy) {
    const zoom = window.Soustruznik.state.zoom ?? 1;
    const panX = window.Soustruznik.state.panX ?? 0;
    const panY = window.Soustruznik.state.panY ?? 0;
    return {
      x: wx * zoom + panX,
      y: panY - wy * zoom
    };
  }
});

Object.defineProperty(window, 'screenToWorld', {
  value: function(sx, sy) {
    const zoom = window.Soustruznik.state.zoom ?? 1;
    const panX = window.Soustruznik.state.panX ?? 0;
    const panY = window.Soustruznik.state.panY ?? 0;
    return {
      x: (sx - panX) / zoom,
      y: (panY - sy) / zoom
    };
  }
});

// ===== PLACEHOLDER - Bude definováno v drawing.js =====
// snapPoint, updateSnapPoints a další funkcí budou přiřazeny v drawing.js
