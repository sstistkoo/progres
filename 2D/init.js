/**
 * INIT.JS - Inicializace aplikace
 * - Setup canvas
 * - Load saved data
 * - Initialize UI
 * - Start animation loop
 */

let animationFrameId = null;

function initializeApp() {
  const canvas = document.getElementById("canvas");
  if (!canvas) {
    console.error("❌ Canvas element not found!");
    return;
  }

  // Prevent pinch-to-zoom on mobile (which would break the UI)
  document.addEventListener('touchmove', function(e) {
    if (e.touches.length > 1) {
      e.preventDefault();
    }
  }, { passive: false });

  // Initialize API Key with demo if needed
  const keys = JSON.parse(localStorage.getItem("soustruznik_api_keys") || "[]");
  console.log("[init] Stored keys from localStorage:", keys);
  if (keys.length === 0 && window.EMBEDDED_API_KEY) {
    console.log("[init] Přidávám demo klíč. EMBEDDED_API_KEY:", window.EMBEDDED_API_KEY.substring(0, 20) + "...");
    // Add embedded demo key automatically
    keys.push({
      key: window.EMBEDDED_API_KEY,
      name: "Demo Key",
      active: true
    });
    localStorage.setItem("soustruznik_api_keys", JSON.stringify(keys));
    console.log("[init] ✅ Demo klíč přidán a uložen do localStorage");
  }

  // Setup canvas resolution
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();

  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;

  // Store canvas reference globally
  window.canvas = canvas;

  // Initialize defaults if not already set
  if (window.zoom === undefined) window.zoom = 2;
  if (window.panX === undefined) window.panX = canvas.width / 2;
  if (window.panY === undefined) window.panY = canvas.height / 2;
  if (!window.shapes) window.shapes = [];
  if (!window.points) window.points = [];
  if (!window.selectedItems) window.selectedItems = [];

  // Initialize drawing state
  if (window.updateSnapPoints) window.updateSnapPoints();

  // Start animation loop
  startAnimationLoop();

  // Load saved project if exists
  loadAutoSave();

  // Setup keyboard shortcuts
  setupKeyboardShortcuts();

  // Auto-save every 30 seconds
  setInterval(() => {
    if (window.saveProject) {
      autoSave();
    }
  }, 30000);

  console.log("✅ Aplikace inicializována");
}

function startAnimationLoop() {
  function animate() {
    if (window.draw) {
      window.draw();
    }
    animationFrameId = requestAnimationFrame(animate);
  }
  animate();
}

function loadAutoSave() {
  try {
    const saved = localStorage.getItem("autosave_project");
    if (saved) {
      const project = JSON.parse(saved);
      if (project.shapes && project.points) {
        if (window.shapes) {
          window.shapes.length = 0;
          window.shapes.push(...project.shapes);
        }
        if (window.points) {
          window.points.length = 0;
          window.points.push(...project.points);
        }
        if (project.settings) {
          if (project.settings.zoom !== undefined) window.zoom = project.settings.zoom;
          if (project.settings.panX !== undefined) window.panX = project.settings.panX;
          if (project.settings.panY !== undefined) window.panY = project.settings.panY;
        }
        console.log("✅ AutoSave načten");
        if (window.updateSnapPoints) window.updateSnapPoints();
      }
    }
  } catch (e) {
    console.warn("⚠️ Chyba při načítání autosave:", e);
  }
}

function autoSave() {
  try {
    const project = {
      version: "1.0",
      date: new Date().toISOString(),
      settings: {
        zoom: window.zoom,
        panX: window.panX,
        panY: window.panY,
      },
      shapes: window.shapes || [],
      points: window.points || [],
    };
    localStorage.setItem("autosave_project", JSON.stringify(project));
  } catch (e) {
    // Ignore storage errors (quota exceeded)
  }
}

function setupKeyboardShortcuts() {
  document.addEventListener("keydown", function (e) {
    // Ctrl+N: Nový projekt
    if ((e.ctrlKey || e.metaKey) && e.key === "n") {
      e.preventDefault();
      if (confirm("Vytvořit nový projekt? (Aktuální práce bude ztracena)")) {
        if (window.clearAll) window.clearAll();
      }
    }

    // Ctrl+E: Export
    if ((e.ctrlKey || e.metaKey) && e.key === "e") {
      e.preventDefault();
      if (window.exportPNG) window.exportPNG();
    }

    // Ctrl+/: Help
    if ((e.ctrlKey || e.metaKey) && e.key === "/") {
      e.preventDefault();
      showHelp();
    }

    // A: Select all
    if (e.key === "a" && !e.ctrlKey && !e.metaKey) {
      if (window.selectedItems && window.shapes && window.points) {
        window.selectedItems.length = 0;
        window.selectedItems.push(...window.shapes, ...window.points);
        if (window.updateSelectionUI) window.updateSelectionUI();
      }
    }

    // D: Deselect
    if (e.key === "d" && !e.ctrlKey && !e.metaKey) {
      if (window.selectedItems) {
        window.selectedItems.length = 0;
        if (window.updateSelectionUI) window.updateSelectionUI();
      }
    }

    // H: Home view
    if (e.key === "h" && !e.ctrlKey && !e.metaKey) {
      if (window.resetView) window.resetView();
    }

    // O: Center to origin
    if (e.key === "o" && !e.ctrlKey && !e.metaKey) {
      if (window.centerToOrigin) window.centerToOrigin();
    }

    // Number keys: Quick mode switch
    const quickModes = {
      "1": "line",
      "2": "circle",
      "3": "arc",
      "4": "tangent",
      "5": "perpendicular",
      "6": "parallel",
      "7": "trim",
      "8": "offset",
      "9": "mirror",
      "0": "erase",
    };

    if (quickModes[e.key]) {
      e.preventDefault();
      if (window.setMode) window.setMode(quickModes[e.key]);
    }
  });
}

function showHelp() {
  const helpText = `
📖 KLÁVESOVÉ ZKRATKY:

🔧 NÁSTROJE (čísla):
1 - Čára | 2 - Kružnice | 3 - Oblouk
4 - Tečna | 5 - Kolmice | 6 - Rovnoběžka
7 - Oříznutí | 8 - Odsazení | 9 - Zrcadlení | 0 - Smazání

⌨️ OVLÁDÁNÍ:
H - Domů (celý výkres)
O - Střed do počátku
Esc - Zrušit akci
Delete - Smazat vybrané
A - Vybrat vše
D - Odebrat výběr

💾 PROJEKTY:
Ctrl+S - Uložit projekt
Ctrl+O - Otevřít projekt
Ctrl+E - Export PNG
Ctrl+Z - Vrátit
Ctrl+Y - Zopakovat

📝 JINÉ:
Ctrl+N - Nový projekt
Ctrl+/ - Nápověda
`;

  alert(helpText);
}

function handleWindowResize() {
  const canvas = document.getElementById("canvas");
  if (!canvas) return;

  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();

  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;

  if (window.draw) window.draw();
}

// ===== INITIALIZATION ON PAGE LOAD =====

document.addEventListener("DOMContentLoaded", function () {
  initializeApp();
});

window.addEventListener("resize", handleWindowResize);

// ===== EXPORT =====
if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    initializeApp,
  };
}
