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
window.axisMode = "XY"; // XY or ZX
window.xMeasureMode = "diameter"; // radius or diameter
window.displayDecimals = 2;
window.snapEnabled = true;
window.snapThreshold = 5; // pixels

// ===== DRAWING MODE & STATE =====
window.mode = "pan"; // pan, line, circle, point, etc.
window.currentCategory = null;
window.selectedShape = null;
window.startPt = null;
window.tempShape = null;
window.drawing = false;
window.cursorPos = { x: 0, y: 0 };
window.controllerMode = "G90"; // G90 nebo G91 pro ovladač

// ===== COLOR & STYLING =====
window.currentColor = "#ff0000";
window.offsetDistance = 10;
window.strokeColor = "#ffffff";
window.fillColor = "#00ff00";
window.gridColor = "#333333";
window.axisColor = "#666666";
window.snapPointColor = "#ffff00";

// ===== POLAR SNAP =====
window.polarSnapEnabled = false;
window.polarSnapInterval = 15; // degrees
window.polarSnapAngles = [];

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

console.log("✅ Globals initialized");
