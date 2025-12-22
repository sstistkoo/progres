/**
 * UI.JS - Uživatelské rozhraní a event handlery
 * - Modal management
 * - Button handlers
 * - User interactions
 * - Settings panels
 */

// ============================================================
// NAMESPACE MIGRATION - Mapper ke Soustruznik.methods
// ============================================================
// Tato část mapuje klíčové UI funkce na window.Soustruznik.methods
// Zachovává zpětnou kompatibilitu skrze window.* funkce

if (window.Soustruznik && window.Soustruznik.methods) {
  // Settings management - bude mapováno po definici funkcí
  // window.Soustruznik.methods.initializeDefaultSettings = window.initializeDefaultSettings;
  // window.Soustruznik.methods.initializeDimensionSettings = window.initializeDimensionSettings;
  // window.Soustruznik.methods.setDimensionLineColor = window.setDimensionLineColor;
  // window.Soustruznik.methods.setDimensionTextColor = window.setDimensionTextColor;
}

// Globální proměnné jsou inicializovány v globals.js

// ===== DEFAULT DRAWING SETTINGS =====

window.initializeDefaultSettings = function () {
  // Načíst uložené nastavení z localStorage
  const savedColor = localStorage.getItem("defaultDrawColor") || "#4a9eff";
  const savedStyle = localStorage.getItem("defaultDrawLineStyle") || "solid";

  window.defaultDrawColor = savedColor;
  window.defaultDrawLineStyle = savedStyle;

  // Sync s namespace
  if (window.Soustruznik && window.Soustruznik.state) {
    window.Soustruznik.state.defaultDrawColor = savedColor;
    window.Soustruznik.state.defaultDrawLineStyle = savedStyle;
  }

  // Nastavit selecty v HTML
  const colorSelect = document.getElementById("defaultColorSelect");
  const styleSelect = document.getElementById("defaultLineStyleSelect");

  if (colorSelect) colorSelect.value = savedColor;
  if (styleSelect) styleSelect.value = savedStyle;
};

window.setDefaultColor = function (color) {
  window.defaultDrawColor = color;
  localStorage.setItem("defaultDrawColor", color);
};

window.setDefaultLineStyle = function (style) {
  window.defaultDrawLineStyle = style;
  localStorage.setItem("defaultDrawLineStyle", style);
};

// ===== DIMENSION COLOR SETTINGS =====

window.initializeDimensionSettings = function () {
  // Načíst uložené barvy kót z localStorage
  const savedLineColor = localStorage.getItem("dimensionLineColor") || "#ffa500";
  const savedTextColor = localStorage.getItem("dimensionTextColor") || "#ffff99";

  window.dimensionLineColor = savedLineColor;
  window.dimensionTextColor = savedTextColor;

  // Sync s namespace
  if (window.Soustruznik && window.Soustruznik.state) {
    window.Soustruznik.state.dimensionLineColor = savedLineColor;
    window.Soustruznik.state.dimensionTextColor = savedTextColor;
  }

  // Nastavit selecty v HTML
  const lineColorSelect = document.getElementById("dimensionLineColorSelect");
  const textColorSelect = document.getElementById("dimensionTextColorSelect");

  if (lineColorSelect) lineColorSelect.value = savedLineColor;
  if (textColorSelect) textColorSelect.value = savedTextColor;
};

window.setDimensionLineColor = function (color) {
  window.dimensionLineColor = color;
  if (window.Soustruznik && window.Soustruznik.state) {
    window.Soustruznik.state.dimensionLineColor = color;
  }
  localStorage.setItem("dimensionLineColor", color);
  if (window.draw) window.draw(); // Překreslit plátno
};

window.setDimensionTextColor = function (color) {
  window.dimensionTextColor = color;
  if (window.Soustruznik && window.Soustruznik.state) {
    window.Soustruznik.state.dimensionTextColor = color;
  }
  localStorage.setItem("dimensionTextColor", color);
  if (window.draw) window.draw(); // Překreslit plátno
};

// ===== INFO NOTIFICATIONS =====

window.showInfoNotification = function (message, duration = 3000) {
  // Vytvoření notifikačního elementu
  const notification = document.createElement("div");
  notification.id = "infoNotification";
  notification.style.cssText = `
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: rgba(26, 26, 26, 0.95);
    color: #6ab0ff;
    padding: 20px 40px;
    border-radius: 8px;
    border: 2px solid #6ab0ff;
    font-size: 16px;
    font-weight: bold;
    z-index: 9999;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.8);
    animation: fadeInOut ${duration}ms ease-in-out;
  `;
  notification.textContent = message;

  document.body.appendChild(notification);

  // Přidat CSS animaci
  if (!document.getElementById("notificationStyles")) {
    const style = document.createElement("style");
    style.id = "notificationStyles";
    style.textContent = `
      @keyframes fadeInOut {
        0% { opacity: 0; transform: translate(-50%, -50%) scale(0.8); }
        10% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
        90% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
        100% { opacity: 0; transform: translate(-50%, -50%) scale(0.8); }
      }
    `;
    document.head.appendChild(style);
  }

  // Odstranit element po skončení animace
  setTimeout(() => {
    notification.remove();
  }, duration);
};

// ===== DEBOUNCE PRO CATEGORY SWITCHING =====
let lastCategoryChangeTime = 0;
const CATEGORY_DEBOUNCE_MS = 500; // Ochrana proti dvojímu volání

window.setMode = function (m) {
  window.mode = m;
  document.querySelectorAll(".tool-btn").forEach((b) => {
    if (!b.id.startsWith("btnCat")) b.classList.remove("active");
  });

  const btnPan = document.getElementById("btnPanCanvas");
  if (btnPan) btnPan.classList.remove("active");

  const btnMap = {
    pan: "btnPanCanvas",
    line: "btnLine",
    circle: "btnCircle",
    arc: "btnArc",
    point: "btnPoint",
    rectangle: "btnRectangle",
    trim: "btnTrim",
    extend: "btnExtend",
    tangent: "btnTangent",
    perpendicular: "btnPerpendicular",
    parallel: "btnParallel",
    offset: "btnOffset",
    mirror: "btnMirror",
    erase: "btnErase",
    measure: "btnMeasure",
    dimension: "btnDimension",
    select: "btnAiSelect",
    ai: "btnCatAi",
    align: "align",
    rotate: "rotate",
  };

  if (btnMap[m] && document.getElementById(btnMap[m])) {
    document.getElementById(btnMap[m]).classList.add("active");
  }

  const btnAiSelect = document.getElementById("btnAiSelect");
  if (btnAiSelect) {
    if (m === "select") {
      btnAiSelect.style.background = "#7c3aed";
      btnAiSelect.style.borderColor = "#8b5cf6";
      btnAiSelect.style.color = "#fff";

      // Schovat všechny panely - NE otevírat AI automaticky
      document.getElementById("toolsDrawing").style.display = "none";
      document.getElementById("toolsEdit").style.display = "none";
      document.getElementById("toolsCoords").style.display = "none";
      document.getElementById("toolsOther").style.display = "none";
      document.getElementById("toolsAi").style.display = "none";
    } else {
      btnAiSelect.style.background = "#333";
      btnAiSelect.style.borderColor = "#444";
      btnAiSelect.style.color = "#ccc";

      // Zobrazit patřičný panel pro režim
      if (m === "pan" || m === "line" || m === "circle" || m === "arc" || m === "point" || m === "rectangle" || m === "trim" || m === "extend" || m === "tangent" || m === "perpendicular" || m === "parallel" || m === "offset" || m === "mirror" || m === "erase" || m === "measure") {
        document.getElementById("toolsDrawing").style.display = "block";
        document.getElementById("toolsEdit").style.display = "none";
        document.getElementById("toolsCoords").style.display = "none";
        document.getElementById("toolsOther").style.display = "none";
        document.getElementById("toolsAi").style.display = "none";
      } else if (m === "dimension") {
        document.getElementById("toolsDrawing").style.display = "none";
        document.getElementById("toolsEdit").style.display = "block";
        document.getElementById("toolsCoords").style.display = "none";
        document.getElementById("toolsOther").style.display = "none";
        document.getElementById("toolsAi").style.display = "none";
      }
    }
  }

  const modeInfo = document.getElementById("modeInfo");
  const infoTexts = {
    select: "👆 Klikni na objekty pro výběr (Shift pro vícenásobný výběr)",
    point: "📍 Klikni pro vytvoření bodu",
    line: "📏 Klikni pro 1. bod, pak klikni pro 2. bod",
    circle: "⭕ Klikni střed, klikni obvod (pak zadej poloměr)",
    circumcircle: "🔵 Klikni na 3 body pro kružnici skrze ně",
    arc: "🌙 Klikni start → end → zadat úhel (stupně)",
    rectangle: "▭ Klikni pro 1. roh, pak pro 2. roh (protilehlý)",
    tangent: "⟂ Klikni bod, pak kružnici",
    perpendicular: "┴ Klikni bod, pak čáru",
    parallel: "∥ Klikni bod, pak čáru",
    trim: "✂️ Klikni na čáru pro oříznutí",
    extend: "↔️ Klikni na čáru pro protažení do průsečíku",
    offset: "⇄ Klikni na čáru pro odsazení",
    mirror: "🪞 Klikni na objekt (zdroj), pak na čáru (osa)",
    erase: "🗑️ Klikni na objekt pro smazání",
    measure: "📏 Klikni na objekt pro zobrazení rozměrů",
    pan: "✋ Táhni pro posun pohledu",
    ai: "✨ Napiš příkaz pro Gemini AI",
    align: "⚖️ Krok 1: Klikni na REFERENČNÍ bod objektu",
    rotate: "🔁 Krok 1: Klikni na STŘED rotace",
    dimension: "📐 Klikni na objekty pro vytvoření rozměrů",
  };

  if (modeInfo) {
    if (infoTexts[m]) {
      modeInfo.textContent = infoTexts[m];
      modeInfo.classList.add("show");
      if (m !== "pan" && m !== "select" && m !== "align") {
        setTimeout(() => {
          if (modeInfo) modeInfo.classList.remove("show");
        }, 5000);
      }
    } else {
      modeInfo.classList.remove("show");
    }
  }

  window.selectedShape = null;
  window.startPt = null;
  window.drawing = false;
  window.tempShape = null;

  // Speciální handling pro circumcircle - když jsou vybrané 3 body, vykresli hned
  if (m === "circumcircle" && window.selectedItems && window.selectedItems.length === 3) {
    const itemA = window.selectedItems[0];
    const itemB = window.selectedItems[1];
    const itemC = window.selectedItems[2];

    // Pokud všechny tři jsou body, vytvoř kružnici
    if (itemA.category === "point" && itemB.category === "point" && itemC.category === "point") {
      setTimeout(() => {
        if (window.createCircumcircleFromSelectedPoints) {
          window.createCircumcircleFromSelectedPoints();
        }
      }, 100);
    }
  }
  if (window.draw) window.draw();
};

window.showToolCategory = function (category) {
  // ===== DEBOUNCE: Ochrana proti dvojímu volání =====
  const now = Date.now();
  if (now - lastCategoryChangeTime < CATEGORY_DEBOUNCE_MS) {
    return;
  }
  lastCategoryChangeTime = now;

  const menuId =
    "tools" + category.charAt(0).toUpperCase() + category.slice(1);
  const menuEl = document.getElementById(menuId);
  const btnId =
    "btnCat" + category.charAt(0).toUpperCase() + category.slice(1);
  const btnEl = document.getElementById(btnId);

  // Speciální handling pro AI - nevřít ho stejně jako ostatní panely
  if (category === "ai") {
    // Pro AI zkusíme toggle
    if (window.currentCategory === category && menuEl && menuEl.style.display !== "none") {
      // AI je otevřené, zavři ho
      if (menuEl) menuEl.style.display = "none";
      if (btnEl) btnEl.classList.remove("active");
      window.currentCategory = null;
      window.toggleAiPanel(false);
      return;
    }

    // Zavři všechny ostatní panely
    document.querySelectorAll(".tool-submenu").forEach((menu) => {
      if (menu.id !== "toolsAi") {
        menu.style.display = "none";
      }
    });

    document.querySelectorAll(".toolbar .tool-btn").forEach((btn) => {
      if (btn.id && btn.id.startsWith("btnCat")) {
        btn.classList.remove("active");
      }
    });

    // Otevři AI
    if (menuEl) {
      menuEl.style.display = "flex";
      if (btnEl) btnEl.classList.add("active");
      window.currentCategory = category;
      if (window.toggleAiPanel) {
        window.toggleAiPanel(true);
      }

      setTimeout(() => {
        const input = document.getElementById("aiPrompt");
        if (input) {
          input.focus();
        }
      }, 200);
    }
    return;
  }

  // Normální handling pro ostatní panely
  if (window.currentCategory === category && menuEl && menuEl.style.display !== "none") {
    menuEl.style.display = "none";
    if (btnEl) btnEl.classList.remove("active");
    window.currentCategory = null;
    if (window.mode !== "pan" && window.mode !== "select") {
      window.setMode("pan");
    }
    return;
  }

  document.querySelectorAll(".tool-submenu").forEach((menu) => {
    menu.style.display = "none";
  });

  document.querySelectorAll(".toolbar .tool-btn").forEach((btn) => {
    if (btn.id && btn.id.startsWith("btnCat")) {
      btn.classList.remove("active");
    }
  });

  if (window.mode !== "pan" && window.mode !== "select") {
    window.setMode("pan");
  }

  if (menuEl) {
    menuEl.style.display = "flex";
    if (btnEl) btnEl.classList.add("active");
    window.currentCategory = category;
  }
};

// ===== SETTINGS & PREFERENCES =====

window.openSettings = function () {
  const modal = document.getElementById("settingsModal");
  if (modal) {
    modal.style.display = "flex";
    if (window.renderKeyList) window.renderKeyList();
    if (window.updateKeyIndicator) window.updateKeyIndicator();
  }
};

window.closeSettings = function () {
  const modal = document.getElementById("settingsModal");
  if (modal) modal.style.display = "none";
};

window.openAIPreferences = function () {
  const modal = document.getElementById("aiPreferencesModal");
  if (modal) {
    modal.style.display = "flex";
    if (window.renderPreferencesList) window.renderPreferencesList();
  }
};

window.closeAIPreferences = function () {
  const modal = document.getElementById("aiPreferencesModal");
  if (modal) modal.style.display = "none";
};

// ===== VIEW CONTROLS =====

window.togglePan = function () {
  if (window.mode === "pan") {
    window.mode = null;
    const btn = document.getElementById("btnPanCanvas");
    if (btn) btn.classList.remove("active");
    const info = document.getElementById("modeInfo");
    if (info) info.classList.remove("show");
  } else {
    window.setMode("pan");
  }
};

window.resetView = function () {
  if (!window.shapes || !window.points) return;

  if (window.shapes.length === 0 && window.points.length === 0) {
    if (window.zoom) window.zoom = 1;
    if (window.panX !== undefined) window.panX = window.canvas ? window.canvas.width / 2 : 0;
    if (window.panY !== undefined) window.panY = window.canvas ? -window.canvas.height / 2 : 0;
    if (window.draw) window.draw();
    return;
  }

  let minX = Infinity, maxX = -Infinity;
  let minY = Infinity, maxY = -Infinity;

  window.shapes.forEach((s) => {
    if (s.type === "line") {
      minX = Math.min(minX, s.x1, s.x2);
      maxX = Math.max(maxX, s.x1, s.x2);
      minY = Math.min(minY, s.y1, s.y2);
      maxY = Math.max(maxY, s.y1, s.y2);
    } else if (s.type === "circle") {
      minX = Math.min(minX, s.cx - s.r);
      maxX = Math.max(maxX, s.cx + s.r);
      minY = Math.min(minY, s.cy - s.r);
      maxY = Math.max(maxY, s.cy + s.r);
    }
  });

  window.points.forEach((p) => {
    minX = Math.min(minX, p.x);
    maxX = Math.max(maxX, p.x);
    minY = Math.min(minY, p.y);
    maxY = Math.max(maxY, p.y);
  });

  if (!isFinite(minX) || !isFinite(maxX) || !isFinite(minY) || !isFinite(maxY)) return;

  const canvas = document.getElementById("canvas");
  const centerX = (minX + maxX) / 2;
  const centerY = (minY + maxY) / 2;
  const rangeX = maxX - minX;
  const rangeY = maxY - minY;

  const margin = 1.1;
  const zoomX = (canvas.width / rangeX) * margin;
  const zoomY = (canvas.height / rangeY) * margin;

  if (window.zoom !== undefined) {
    window.zoom = Math.min(zoomX, zoomY, 100);
    window.zoom = Math.max(window.zoom, 0.1);
  }

  if (window.panX !== undefined) window.panX = canvas.width / 2 - centerX * (window.zoom || 2);
  if (window.panY !== undefined) window.panY = canvas.height / 2 + centerY * (window.zoom || 2);

  if (window.draw) window.draw();
};

window.centerToOrigin = function () {
  const canvas = document.getElementById("canvas");
  if (window.panX !== undefined) window.panX = canvas.width / 2;
  if (window.panY !== undefined) window.panY = canvas.height / 2;
  if (window.draw) window.draw();
};

window.clearMode = function () {
  // Zrušit aktuální mód
  window.mode = null;

  // Zrušit constraint mód
  window.constraintMode = null;
  window.constraintSelection = [];
  if (window.cancelConstraintValue) window.cancelConstraintValue();

  // Zrušit align mód
  window.alignStep = 0;
  window.alignRefPoint = null;
  window.alignTargetPoint = null;
  window.alignLine = null;
  window.alignAxis = null;

  // Zrušit startPt (pokud byl nějaký rozdělaný tvar)
  window.startPt = null;
  window.tempShape = null;
  window.selectedShape = null;
  window.drawing = false;

  // Odstranit active ze všech tlačítek (kromě kategorií)
  document.querySelectorAll(".tool-btn").forEach((b) => {
    if (!b.id.startsWith("btnCat")) b.classList.remove("active");
  });

  // Odstranit active z Posun tlačítka
  const btnPan = document.getElementById("btnPanCanvas");
  if (btnPan) btnPan.classList.remove("active");

  // Skrýt mode info
  const info = document.getElementById("modeInfo");
  if (info) info.classList.remove("show");

  // Překreslit canvas
  if (window.draw) window.draw();

  // Krátký vizuální feedback
  const snapInfo = document.getElementById("snapInfo");
  if (snapInfo) {
    snapInfo.textContent = "✕ Mód zrušen";
    snapInfo.style.display = "block";
    setTimeout(() => (snapInfo.style.display = "none"), 800);
  }
};

// ===== COORDINATE LABELS =====

window.updateCoordinateLabels = function() {
  // Aktualizovat popisky podle režimu
  const labels =
    window.axisMode === "lathe"
      ? { axis1: "Z", axis2: "X" }
      : { axis1: "X", axis2: "Y" };
  // Popisky se aktualizují v drawAxes
};

// ===== GRID SPACING =====

window.updateGridSpacing = function() {
  const gridSpacingInput = document.getElementById("gridSpacing");
  if (gridSpacingInput) {
    window.gridSize = parseFloat(gridSpacingInput.value) || 10;
    if (window.draw) window.draw();
  }
};

window.setGridSpacing = function(size) {
  window.gridSize = size;
  const gridSpacingInput = document.getElementById("gridSpacing");
  if (gridSpacingInput) gridSpacingInput.value = size;
  if (window.draw) window.draw();
};

// ===== TOGGLE SECTIONS =====

window.toggleSection = function(sectionId) {
  const section = document.getElementById(sectionId + "Section");
  const toggle = document.getElementById(sectionId + "Toggle");

  if (section && toggle) {
    if (section.style.display === "none") {
      section.style.display = "block";
      toggle.textContent = "▲";
    } else {
      section.style.display = "none";
      toggle.textContent = "▼";
    }
  }
};

// ===== CLEAR ALL =====

window.clearAll = function () {
  if (confirm("Vymazat vše?")) {
    if (window.shapes) window.shapes.length = 0;
    if (window.points) window.points.length = 0;
    if (window.selectedItems) window.selectedItems.length = 0;
    if (window.updateSnapPoints) window.updateSnapPoints();
    if (window.draw) window.draw();
  }
};

// ===== EXPORT & IMPORT =====

window.exportPNG = function () {
  const canvas = document.getElementById("canvas");
  const link = document.createElement("a");
  link.download = "soustruzeni_" + Date.now() + ".png";
  link.href = canvas.toDataURL();
  link.click();
};

window.saveProject = function () {
  const project = {
    version: "1.0",
    date: new Date().toISOString(),
    settings: {
      axisMode: window.axisMode,
      xMeasureMode: window.xMeasureMode,
      gridSize: window.gridSize,
      zoom: window.zoom,
      panX: window.panX,
      panY: window.panY,
    },
    shapes: window.shapes || [],
    points: window.points || [],
  };

  const json = JSON.stringify(project, null, 2);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10);
  const timeStr = now.toTimeString().slice(0, 5).replace(":", "-");
  link.download = `projekt_${dateStr}_${timeStr}.json`;

  link.href = url;
  link.click();
  URL.revokeObjectURL(url);
};

window.loadProject = function (input) {
  const file = input.files[0];
  if (!file) return;

  if (!file.name.endsWith(".json")) {
    alert("❌ Chyba: Můžeš načíst pouze .json soubory!");
    input.value = "";
    return;
  }

  const reader = new FileReader();

  reader.onload = function (e) {
    try {
      const project = JSON.parse(e.target.result);

      if (!project.shapes || !Array.isArray(project.shapes)) {
        throw new Error("Neplatná struktura projektu");
      }

      if ((window.shapes && window.shapes.length > 0) ||
          (window.points && window.points.length > 0)) {
        const confirm_load = window.confirm(
          "⚠️ Načtením projektu přepíšeš aktuální kreslení.\n\nChceš pokračovat?"
        );
        if (!confirm_load) {
          input.value = "";
          return;
        }
      }

      if (window.shapes) {
        window.shapes.length = 0;
        window.shapes.push(...(project.shapes || []));
      }
      if (window.points) {
        window.points.length = 0;
        window.points.push(...(project.points || []));
      }

      if (project.settings) {
        if (project.settings.axisMode) window.axisMode = project.settings.axisMode;
        if (project.settings.xMeasureMode) window.xMeasureMode = project.settings.xMeasureMode;
        if (project.settings.gridSize !== undefined) window.gridSize = project.settings.gridSize;
        if (project.settings.zoom !== undefined) window.zoom = project.settings.zoom;
        if (project.settings.panX !== undefined) window.panX = project.settings.panX;
        if (project.settings.panY !== undefined) window.panY = project.settings.panY;
      }

      if (window.updateSnapPoints) window.updateSnapPoints();
      if (window.draw) window.draw();
    } catch (error) {
      alert("❌ Chyba při načítání projektu:\n\n" + error.message);
    }

    input.value = "";
  };

  reader.onerror = function () {
    alert("❌ Chyba při čtení souboru!");
    input.value = "";
  };

  reader.readAsText(file);
};

// ===== CLOSE MODALS ON OUTSIDE CLICK =====

document.addEventListener("DOMContentLoaded", function () {
  const modals = [
    "settingsModal",
    "aiPreferencesModal",
    "circleModal",
    "constraintModal",
    "quickInputModal",
    "controllerModal",
    "directionModal",
  ];

  modals.forEach((modalId) => {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.addEventListener("click", (e) => {
        if (e.target.id === modalId) {
          modal.style.display = "none";
        }
      });
    }
  });

  // Inicializuj seznam klíčů a indikátor
  setTimeout(() => {
    if (window.renderKeyList) window.renderKeyList();
    if (window.updateKeyIndicator) window.updateKeyIndicator();
  }, 100);
});

// ===== EXPORT =====
window.showControllerModal = function () {
  const modal = document.getElementById("controllerModal");
  if (modal) modal.style.display = "flex";
};

window.closeControllerModal = function () {
  const modal = document.getElementById("controllerModal");
  if (modal) modal.style.display = "none";
};

// ===== CONTROLLER DIRECTION & LENGTH =====
window.showControllerDirectionModal = function () {
  window.directionTarget = "controller";
  const modal = document.getElementById("directionModal");
  if (modal) modal.style.display = "flex";
};

window.showControllerLengthModal = function () {
  window.lengthTarget = "controller";
  const modal = document.getElementById("lengthModal");
  if (modal) {
    modal.style.display = "flex";
    const input = document.getElementById("lengthInput");
    if (input) {
      input.value = "";
      setTimeout(() => input.focus(), 100);
    }
  }
};

// Update direction modal to handle both targets
const originalInsertDirection = window.insertDirection;
window.insertDirection = function (angle) {

  if (window.directionTarget === "controller") {
    // Vloží do controllerInput
    const input = document.getElementById("controllerInput");
    if (input) {
      input.value += "AP" + angle + " ";
    }
  } else {
    // Vloží do quickInputDisplay (originální chování)
    const display = document.getElementById("quickInputDisplay");
    if (display) {
      display.value += "AP" + angle + " ";
      display.scrollTop = display.scrollHeight;
    }
  }

  window.directionTarget = null;
  window.closeDirectionModal();
};

// Update length modal to handle both targets
const originalConfirmLength = window.confirmLength;
window.confirmLength = function () {
  const input = document.getElementById("lengthInput");
  if (!input) return;

  const value = input.value.trim();
  if (!value) {
    alert("Zadej prosím délku!");
    return;
  }

  const type = window.lengthType || "L";

  if (window.lengthTarget === "controller") {
    const controllerInput = document.getElementById("controllerInput");
    if (controllerInput) {
      controllerInput.value += type + value + " ";
    }
  } else {
    const display = document.getElementById("quickInputDisplay");
    if (display) {
      display.value += type + value + " ";
      display.scrollTop = display.scrollHeight;
    }
  }

  window.lengthTarget = null;
  window.closeLengthModal();
};

window.closeControllerModal = function () {
  const modal = document.getElementById("controllerModal");
  if (modal) modal.style.display = "none";
};

// Controller functions jsou v controller.js - zde necháme pouze modal show/close

// Přepínání sekcí v panelech
window.toggleCoordSection = function (sectionId) {
  const section = document.getElementById(sectionId);
  if (!section) return;

  const isHidden = section.style.display === "none";
  section.style.display = isHidden ? "block" : "none";

  const toggleSpan = document.getElementById(sectionId + "Toggle");
  if (toggleSpan) {
    toggleSpan.textContent = isHidden ? "▲" : "▼";
  }
};

// Souřadnice - Bod
window.setPointFromCursor = function () {
  const el = document.getElementById("quickPointZ");
  if (!el || !window.cursorX) return;

  document.getElementById("quickPointZ").value = (window.cursorY || 0).toFixed(2);
  document.getElementById("quickPointX").value = (window.cursorX || 0).toFixed(2);
};

window.quickAddPoint = function () {
  const z = parseFloat(document.getElementById("quickPointZ").value);
  const x = parseFloat(document.getElementById("quickPointX").value);

  if (isNaN(z) || isNaN(x)) {
    alert("Zadej prosím Z a X souřadnice");
    return;
  }

  window.shapes.push({ type: "point", z, x });
  window.saveState();
  window.draw();
  document.getElementById("quickPointZ").value = "";
  document.getElementById("quickPointX").value = "";
};

// Souřadnice - Čára
window.addLineByCoords = function () {
  const z1 = parseFloat(document.getElementById("lineZ1").value);
  const x1 = parseFloat(document.getElementById("lineX1").value);
  const z2 = parseFloat(document.getElementById("lineZ2").value);
  const x2 = parseFloat(document.getElementById("lineX2").value);

  if (isNaN(z1) || isNaN(x1) || isNaN(z2) || isNaN(x2)) {
    alert("Zadej prosím souřadnice obou bodů");
    return;
  }

  window.shapes.push({ type: "line", z1, x1, z2, x2, color: window.defaultDrawColor || "#4a9eff", lineStyle: window.defaultDrawLineStyle || "solid" });
  window.saveState();
  window.draw();
  document.getElementById("lineZ1").value = "";
  document.getElementById("lineX1").value = "";
  document.getElementById("lineZ2").value = "";
  document.getElementById("lineX2").value = "";
};

// Souřadnice - Kružnice
window.quickAddCircle = function () {
  const z = parseFloat(document.getElementById("quickCircleZ").value);
  const x = parseFloat(document.getElementById("quickCircleX").value);
  const r = parseFloat(document.getElementById("quickCircleR").value);

  if (isNaN(z) || isNaN(x) || isNaN(r)) {
    alert("Zadej prosím střed a poloměr");
    return;
  }

  window.shapes.push({ type: "circle", z, x, r, color: window.defaultDrawColor || "#4a9eff", lineStyle: window.defaultDrawLineStyle || "solid" });
  window.saveState();
  window.draw();
  document.getElementById("quickCircleZ").value = "";
  document.getElementById("quickCircleX").value = "";
  document.getElementById("quickCircleR").value = "";
};

// Ostatní - Export a Projekty
window.exportPNG = function () {
  const canvas = document.getElementById("canvas");
  if (!canvas) return;

  const link = document.createElement("a");
  link.href = canvas.toDataURL("image/png");
  link.download = "kresba_" + new Date().getTime() + ".png";
  link.click();
};

window.saveProject = function () {
  const project = {
    shapes: window.shapes || [],
    settings: {
      gridSize: window.gridSize,
      axisMode: window.axisMode,
      xMeasureMode: window.xMeasureMode
    }
  };

  const json = JSON.stringify(project, null, 2);
  const link = document.createElement("a");
  link.href = "data:application/json;charset=utf-8," + encodeURIComponent(json);
  link.download = "projekt_" + new Date().getTime() + ".json";
  link.click();
};

window.loadProject = function (input) {
  if (!input.files || !input.files[0]) return;

  const reader = new FileReader();
  reader.onload = function (e) {
    try {
      const project = JSON.parse(e.target.result);
      window.shapes = project.shapes || [];
      
      // Konvertuj obdélníky na 4 usečky (pro snadnější měření)
      window.shapes = convertRectanglesToLines(window.shapes);
      
      if (project.settings) {
        window.gridSize = project.settings.gridSize || window.gridSize;
        window.axisMode = project.settings.axisMode || window.axisMode;
        window.xMeasureMode = project.settings.xMeasureMode || window.xMeasureMode;
      }
      window.saveState();
      window.draw();
    } catch (err) {
      alert("Chyba při načítání projektu: " + err.message);
    }
  };
  reader.readAsText(input.files[0]);
};

// Stubní funkce - Snap
window.updateSnap = function () {
};

// Stubní funkce pro transformace
window.showColorPicker = function () {
  // Resetovat výběr
  window.colorStyleSelected = {
    color: null,
    lineStyle: null,
  };

  // Pokud něco vybrané je, použít to
  if (window.selectedItems && window.selectedItems.length > 0) {
    const modal = document.getElementById("colorStyleModal");
    if (modal) {
      modal.style.display = "flex";
    }
    return;
  }

  // Pokud nic není vybrané, otevřít modal pro nastavení barev a stylu
  // Ale nejdřív bez výběru - prosí o výběr v confirmColorStyle
  window.colorPickerMode = "waitingForColor"; // Speciální režim
  const modal = document.getElementById("colorStyleModal");
  if (modal) {
    modal.style.display = "flex";
  }
};

window.closeColorStyleModal = function () {
  const modal = document.getElementById("colorStyleModal");
  if (modal) {
    modal.style.display = "none";
  }

  // Resetovat výběr UI
  document.querySelectorAll("#colorStyleModal button.selected").forEach((btn) => {
    btn.classList.remove("selected");
    if (btn.id.startsWith("colorBtn_")) {
      btn.style.borderWidth = "2px";
    } else {
      btn.style.borderWidth = "1px";
    }
  });

  // Zrušit výběr objektů aby se viděly změny
  if (window.selectedItems) {
    window.selectedItems = [];
  }
  if (window.draw) window.draw();
};

window.selectColor = function (color, btn) {
  // Odebrat selected třídu z ostatních barev
  document.querySelectorAll("#colorStyleModal [id^='colorBtn_']").forEach((btn) => {
    btn.classList.remove("selected");
    btn.style.borderWidth = "2px";
  });

  // Přidat selected třídu na aktuální
  btn.classList.add("selected");
  btn.style.borderWidth = "4px";

  window.colorStyleSelected = window.colorStyleSelected || {};
  window.colorStyleSelected.color = color;
};

window.selectLineStyle = function (style, btn) {
  // Odebrat selected třídu z ostatních stylů
  document.querySelectorAll("#colorStyleModal [id^='styleBtn_']").forEach((btn) => {
    btn.classList.remove("selected");
    btn.style.borderWidth = "1px";
    btn.style.background = "#2a3a4a";
    btn.style.color = "#aaa";
  });

  // Přidat selected třídu na aktuální
  btn.classList.add("selected");
  btn.style.borderWidth = "2px";
  btn.style.background = "#3a7bc8";
  btn.style.color = "#fff";

  window.colorStyleSelected = window.colorStyleSelected || {};
  window.colorStyleSelected.lineStyle = style;
};

window.confirmColorStyle = function () {
  // Pokud čekáme na výběr barvy (bez vybraných objektů), přejít do režimu výběru
  if (
    window.colorPickerMode === "waitingForColor" &&
    (!window.selectedItems || window.selectedItems.length === 0)
  ) {
    if (
      !window.colorStyleSelected.color &&
      !window.colorStyleSelected.lineStyle
    ) {
      alert("⚠️ Vyberte barvu nebo styl čáry!");
      return;
    }

    // Nastavit režim výběru PŘED zavřením modalu
    window.colorPickerMode = true;
    window.mode = "colorPicker";

    // Zavřít modal ručně aby se neměnily stavové proměnné
    const modal = document.getElementById("colorStyleModal");
    if (modal) {
      modal.style.display = "none";
    }

    // Resetovat vizuální stav tlačítek
    document.querySelectorAll("#colorStyleModal button.selected").forEach((btn) => {
      btn.classList.remove("selected");
      if (btn.id.startsWith("colorBtn_")) {
        btn.style.borderWidth = "2px";
      } else {
        btn.style.borderWidth = "1px";
      }
    });

    // Zavolat draw ale bez resetování selectedItems na tomto místě
    if (window.draw) window.draw();

    window.showInfoNotification("Vyberte čáru k úpravě", 1000);
    return;
  }

  // Standardní režim - aplikovat na vybrané objekty
  if (!window.selectedItems || window.selectedItems.length === 0) {
    alert("❌ Žádné objekty nejsou vybrány!");
    return;
  }

  if (
    !window.colorStyleSelected.color &&
    !window.colorStyleSelected.lineStyle
  ) {
    alert("⚠️ Vyberte barvu nebo styl čáry!");
    return;
  }

  if (window.saveState) window.saveState();

  // Aplikovat změny
  for (let item of window.selectedItems) {
    if (item && item.ref) {
      if (window.colorStyleSelected.color) {
        item.ref.color = window.colorStyleSelected.color;
      }
      if (window.colorStyleSelected.lineStyle) {
        item.ref.lineStyle = window.colorStyleSelected.lineStyle;
      }
    }
  }

  // Zavřít modal a zrušit výběr
  window.closeColorStyleModal();
};

window.setObjectColor = function (color) {
  if (!window.selectedItems || window.selectedItems.length === 0) {
    return;
  }

  if (window.saveState) window.saveState();

  for (let item of window.selectedItems) {
    if (item && item.ref) {
      item.ref.color = color;
    }
  }

  if (window.draw) window.draw();
};

window.setLineStyle = function (style) {
  if (!window.selectedItems || window.selectedItems.length === 0) {
    return;
  }

  if (window.saveState) window.saveState();

  for (let item of window.selectedItems) {
    if (item && item.ref) {
      item.ref.lineStyle = style;
    }
  }

  if (window.draw) window.draw();
};

window.booleanUnion = function () {
  if (!window.selectedItems || window.selectedItems.length < 2) {
    alert("❌ Vyberte minimálně 2 objekty pro sjednocení!");
    return;
  }

  const selected = window.selectedItems.filter((item) => item.ref);
  if (selected.length < 2) {
    alert("❌ Vybrané objekty nejsou validní!");
    return;
  }

  if (window.saveState) window.saveState();

  window.shapes = window.shapes.filter(
    (s) => !selected.some((item) => item.ref === s)
  );

  window.shapes.push({
    type: "union",
    color: "#4fc3f7",
    timestamp: Date.now(),
    data: selected.map((item) => item.ref),
  });

  window.selectedItems = [];
  if (window.updateSnapPoints) window.updateSnapPoints();
  if (window.draw) window.draw();
};

window.booleanIntersect = function () {
  if (!window.selectedItems || window.selectedItems.length < 2) {
    alert("❌ Vyberte minimálně 2 objekty pro průnik!");
    return;
  }

  const selected = window.selectedItems.filter((item) => item.ref);
  if (selected.length < 2) {
    alert("❌ Vybrané objekty nejsou validní!");
    return;
  }

  if (window.saveState) window.saveState();

  window.shapes = window.shapes.filter(
    (s) => !selected.some((item) => item.ref === s)
  );

  window.shapes.push({
    type: "intersection",
    color: "#81c784",
    timestamp: Date.now(),
    data: selected.map((item) => item.ref),
  });

  window.selectedItems = [];
  if (window.updateSnapPoints) window.updateSnapPoints();
  if (window.draw) window.draw();
};

window.booleanDifference = function () {
  if (!window.selectedItems || window.selectedItems.length < 2) {
    alert("❌ Vyberte minimálně 2 objekty pro rozdíl!");
    return;
  }

  const selected = window.selectedItems.filter((item) => item.ref);
  if (selected.length < 2) {
    alert("❌ Vybrané objekty nejsou validní!");
    return;
  }

  if (window.saveState) window.saveState();

  const baseShape = selected[0].ref;

  window.shapes = window.shapes.filter(
    (s) => !selected.some((item) => item.ref === s)
  );

  window.shapes.push({
    type: "difference",
    ...baseShape,
    color: "#ff9800",
    timestamp: Date.now(),
    subtractData: selected.slice(1).map((item) => item.ref),
  });

  window.selectedItems = [];
  if (window.updateSnapPoints) window.updateSnapPoints();
  if (window.draw) window.draw();
};

// ===== COORDINATE SETUP FUNCTIONS =====
window.toggleCoordSection = function (sectionId) {
  const section = document.getElementById(sectionId);
  if (section) {
    const isHidden = section.style.display === "none";
    section.style.display = isHidden ? "block" : "none";
  }
};

window.setPointFromCursor = function () {
  // TODO: Implementovat - vezmi aktuální pozici myši a nastav ji jako bod
};

window.quickAddPoint = function () {
  const xInput = document.getElementById("coordPointX");
  const yInput = document.getElementById("coordPointY");
  if (xInput && yInput) {
    const x = parseFloat(xInput.value) || 0;
    const y = parseFloat(yInput.value) || 0;
    if (!window.points) window.points = [];
    window.points.push({ x, y });
    window.saveState();
    window.draw();
  }
};

window.setLineStart = function () {
  // TODO: Implementovat - vezmi aktuální pozici myši pro počátek čáry
};

window.setLineEnd = function () {
  // TODO: Implementovat - vezmi aktuální pozici myši pro konec čáry
};

window.addLineByCoords = function () {
  const x1 = parseFloat(document.getElementById("coordLineX1")?.value) || 0;
  const y1 = parseFloat(document.getElementById("coordLineY1")?.value) || 0;
  const x2 = parseFloat(document.getElementById("coordLineX2")?.value) || 0;
  const y2 = parseFloat(document.getElementById("coordLineY2")?.value) || 0;
  if (!window.shapes) window.shapes = [];
  window.shapes.push({ type: "line", x1, y1, x2, y2, color: window.defaultDrawColor || "#4a9eff", lineStyle: window.defaultDrawLineStyle || "solid" });
  window.saveState();
  window.draw();
};

window.setCircleCenter = function () {
  // TODO: Implementovat - vezmi aktuální pozici myši pro střed
};

window.quickAddCircle = function () {
  const cx = parseFloat(document.getElementById("coordCircleCX")?.value) || 0;
  const cy = parseFloat(document.getElementById("coordCircleCY")?.value) || 0;
  const r = parseFloat(document.getElementById("coordCircleR")?.value) || 1;
  if (!window.shapes) window.shapes = [];
  window.shapes.push({ type: "circle", cx, cy, r, color: window.defaultDrawColor || "#4a9eff", lineStyle: window.defaultDrawLineStyle || "solid" });
  window.saveState();
  window.draw();
};

window.addLinePolar = function () {
  // TODO: Implementovat polární souřadnice
};

window.addPointPolar = function () {
  // TODO: Implementovat polární souřadnice
};

// ===== CONSTRAINT FUNCTIONS =====
window.showConstraintModal = function () {
  const modal = document.getElementById("constraintModal");
  if (modal) {
    modal.style.display = "flex";
  }
};

window.closeConstraintModal = function () {
  const modal = document.getElementById("constraintModal");
  if (modal) {
    modal.style.display = "none";
  }
};

window.applyConstraint = function (type) {
  if (!window.selectedItems || window.selectedItems.length === 0) {
    alert("❌ Vyberte objekty pro aplikaci fixace!");
    return;
  }

  const selected = window.selectedItems.filter((item) => item.ref);
  if (selected.length === 0) return;

  if (window.saveState) window.saveState();

  for (let item of selected) {
    if (!item.ref.constraints) {
      item.ref.constraints = [];
    }
    item.ref.constraints.push({
      type: type,
      timestamp: Date.now(),
    });
  }

  alert(`✅ Fixace typu "${type}" aplikována na ${selected.length} objektů!`);
  window.closeConstraintModal();
  if (window.draw) window.draw();
};

window.removeConstraint = function (which) {
  if (!window.selectedItems || window.selectedItems.length === 0) {
    return;
  }

  if (window.saveState) window.saveState();

  for (let item of window.selectedItems) {
    if (item && item.ref && item.ref.constraints) {
      item.ref.constraints = item.ref.constraints.filter(
        (c) => c.type !== which
      );
    }
  }

  if (window.draw) window.draw();
};

window.cancelConstraintValue = function () {
  window.closeConstraintModal();
};

window.confirmConstraintPoint = function () {
  // TODO: Implementovat
};

window.confirmConstraintDistance = function () {
  // TODO: Implementovat
};

window.confirmConstraintRadius = function () {
  // TODO: Implementovat
};

window.confirmConstraintPolarAngle = function () {
  // TODO: Implementovat
};

// ===== CIRCLE MODAL =====
window.closeCircleModal = function () {
  const modal = document.getElementById("circleModal");
  if (modal) modal.style.display = "none";
};

window.confirmCircle = function () {
  // TODO: Implementovat
};

// ===== HELP MODAL =====
window.showQuickInputHelp = function () {
  const helpModal = document.getElementById("quickInputHelpModal");
  if (helpModal) {
    helpModal.style.display = "flex";
  }
};

window.closeQuickInputHelp = function () {
  const helpModal = document.getElementById("quickInputHelpModal");
  if (helpModal) {
    helpModal.style.display = "none";
  }
};

// ============================================================
// FÁZA 5 COMPLETION - Namespace method delegation
// ============================================================
// UI metody jsou nyní dostupné na window.Soustruznik.methods
// a také stále na window.* pro zpětnou kompatibilitu

// Přidat mapování po načtení funkcí
if (window.Soustruznik && window.Soustruznik.methods) {
  window.Soustruznik.methods.initializeDefaultSettings = window.initializeDefaultSettings;
  window.Soustruznik.methods.initializeDimensionSettings = window.initializeDimensionSettings;
  window.Soustruznik.methods.setDimensionLineColor = window.setDimensionLineColor;
  window.Soustruznik.methods.setDimensionTextColor = window.setDimensionTextColor;
}



if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    setMode,
    showToolCategory,
    openSettings,
    closeSettings,
  };
}
