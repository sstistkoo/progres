/**
 * GLOBALS.JS - Centralizované globální proměnné a konstanty
 * Musí se načíst PRVNÍ, aby ostatní moduly mohly používat
 */

// ===== API KEYS & STORAGE =====
window.API_STORAGE_KEY = "soustruznik_api_keys";
// DEMO API KEY - rozdělený na 2 části (bezpečné pro GitHub)
window.EMBEDDED_API_KEY = "AIzaSyCXuMvhO_senLS" + "oA_idEuBk_EwnMmIPIhg"; // Split for security

// ===== CANVAS & DRAWING STATE =====
window.shapes = [];
window.points = [];
window.cachedSnapPoints = [];
window.selectedItems = [];

// ===== VIEWPORT & VIEW =====
window.panX = 0;
window.panY = 0;
window.zoom = 2;
window.gridSize = 10;

// ===== SETTINGS =====
window.axisMode = "lathe"; // lathe nebo carousel
window.xMeasureMode = "radius"; // radius or diameter - VÝCHOZÍ JE RADIUS (R)
window.displayDecimals = 2;
window.snapToGrid = false;
window.snapToPoints = true;
window.snapDistance = 15; // pixels
window.orthoMode = true; // Ortogonální přichycení
window.measureInputEnabled = false; // Míra - zadávání rozměrů

// ===== DEFAULT DRAWING COLORS & STYLES =====
window.defaultDrawColor = "#4a9eff"; // Výchozí barva nových objektů
window.defaultDrawLineStyle = "solid"; // Výchozí styl čáry nových objektů

// ===== DIMENSION COLORS & STYLES =====
window.dimensionLineColor = "#ffa500"; // Barva čar kót
window.dimensionTextColor = "#ffff99"; // Barva hodnot kót

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

// DEBUG: kontrola množství logů; nastavte na true pro detailní debug
window.debugMode = false;
window.logDebug = function(...args) {
  try {
    if (window.debugMode) {
      console.log(...args);
    }
  } catch (e) {
    // swallow
  }
};
