/**
 * SOUSTRUZNIK.JS - Centralized State Management
 *
 * Nový namespace pro Global State
 * Nahrazuje rozptýlenou window pollution
 *
 * Struktura:
 * - window.Soustruznik.state      ← Data
 * - window.Soustruznik.methods    ← Funkce
 * - window.Soustruznik.getters    ← Properties
 */

// ============================================================
// INICIALIZACE NAMESPACE
// ============================================================
window.Soustruznik = {

  // ========================================================
  // STATE - Centralizované data aplikace
  // ========================================================
  state: {
    // Canvas & Rendering
    canvas: null,
    ctx: null,
    width: 0,
    height: 0,

    // Shapes & Selection
    shapes: [],           // Pole všech objektů
    selectedIndex: -1,    // Vybraný tvar (-1 = nic)

    // Drawing Mode
    mode: 'line',         // 'line', 'circle', 'arc', 'dimension', 'tangent', 'perpendicular', 'select', 'pan'

    // History (Undo/Redo)
    history: [],          // Stack historických stavů
    historyIndex: 0,      // Aktuální pozice v history

    // Viewport & Zoom
    viewportX: 0,         // Pozice viewportu X
    viewportY: 0,         // Pozice viewportu Y
    panX: 0,              // Pan pozice X (pro rendering)
    panY: 0,              // Pan pozice Y (pro rendering)
    zoom: 1,              // Úroveň zoomu (default 1)

    // UI State
    panMode: false,       // Aktivní režim posunu
    lastMouseX: 0,        // Poslední poloha myši X
    lastMouseY: 0,        // Poslední poloha myši Y

    // Drawing Settings
    defaultDrawColor: '#4a9eff',      // Výchozí barva nových tvarů
    defaultDrawLineStyle: 'solid',    // Výchozí styl čar

    // Dimension Settings
    dimensionLineColor: '#ffa500',    // Barva čar kót (oranžová)
    dimensionTextColor: '#ffff99',    // Barva textu kót (světlá žlutá)

    // Controller Settings (CNC)
    controllerMode: 'G90',            // CNC režim (G90 = absolutní, G91 = relativní)
    controllerInputBuffer: '',        // Aktuální vstup do CNC controlleru
    pendingDirection: null,           // Čekající směr z modálu
    displayDecimals: 2,               // Počet zobrazených desetinných míst

    // Animation
    animationFrameId: null            // ID requestAnimationFrame loop
  },

  // ========================================================
  // GETTERS - Snadný přístup k estado
  // ========================================================
  get shapes() {
    return this.state.shapes;
  },

  get selectedIndex() {
    return this.state.selectedIndex;
  },

  get mode() {
    return this.state.mode;
  },

  get history() {
    return this.state.history;
  },

  get zoom() {
    return this.state.zoom;
  },

  get canvas() {
    return this.state.canvas;
  },

  get ctx() {
    return this.state.ctx;
  },

  // ========================================================
  // METHODS - Všechny funkce aplikace
  // ========================================================
  methods: {
    // --- DRAWING ---
    draw: function() {},
    drawShape: function(shape) {},
    drawLine: function(line) {},
    drawCircle: function(circle) {},
    drawArc: function(arc) {},
    drawDimension: function(dim) {},
    drawTangent: function(tangent) {},
    drawPerpendicular: function(perp) {},

    // --- SHAPE MANAGEMENT ---
    addShape: function(shape) {},
    selectShape: function(index) {},
    deleteSelected: function() {},
    setMode: function(newMode) {},

    // --- HISTORY (UNDO/REDO) ---
    undo: function() {},
    redo: function() {},
    pushHistory: function(snapshot) {},

    // --- CANVAS & VIEWPORT ---
    resetView: function() {},
    togglePan: function() {},
    screenToWorld: function(point) {},
    worldToScreen: function(point) {},

    // --- EXPORT & IMPORT ---
    exportPNG: function() {},
    saveToJSON: function() {},
    loadFromJSON: function(data) {},

    // --- SETTINGS ---
    setDimensionLineColor: function(color) {},
    setDimensionTextColor: function(color) {},
    initializeDefaultSettings: function() {},
    initializeDimensionSettings: function() {},

    // --- UI & MODALS ---
    showModal: function(name) {},
    hideModal: function() {},
    updateUI: function() {},

    // --- CONTROLLER (CNC) ---
    setControllerMode: function(mode) {},
    confirmControllerInput: function() {},
    parseGCode: function(input, mode) {},
    showControllerModal: function() {},
    closeControllerModal: function() {},
    showDirectionModal: function() {},
    closeDirectionModal: function() {},
    toggleMeasureInput: function() {},
    processMeasureInput: function(data) {},

    // --- UTILITIES ---
    distance: function(p1, p2) {},
    angle: function(p1, p2) {},
    intersection: function(line1, line2) {},
    tangentToCircle: function(p, center, radius) {},
    perpendicular: function(p, line) {},

    // --- AI ---
    initializeAI: function() {},
    sendAIRequest: async function(prompt) {},
    setAPIKey: function(key) {}
  }
};

// ============================================================
// LOG - Potvrzení že namespace byl vytvořen
// ============================================================
console.log('✅ Soustruznik namespace initialized');
console.log('   window.Soustruznik.state:', window.Soustruznik.state);
console.log('   window.Soustruznik.state.zoom:', window.Soustruznik.state.zoom);
console.log('   window.Soustruznik.state.panX:', window.Soustruznik.state.panX);
console.log('   window.Soustruznik.state.panY:', window.Soustruznik.state.panY);
console.log('   window.Soustruznik.methods:', Object.keys(window.Soustruznik.methods).length, 'funkcí');
