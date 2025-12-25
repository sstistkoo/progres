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
  if (keys.length === 0 && window.EMBEDDED_API_KEY) {
    // Add embedded demo key automatically
    keys.push({
      key: window.EMBEDDED_API_KEY,
      name: "Demo Key",
      active: true
    });
    localStorage.setItem("soustruznik_api_keys", JSON.stringify(keys));
  }

  // Initialize Groq API Key with demo if needed
  const groqKeys = JSON.parse(localStorage.getItem("soustruznik_groq_api_keys") || "[]");
  if (groqKeys.length === 0 && window.EMBEDDED_GROQ_API_KEY) {
    // Add embedded demo Groq key automatically
    groqKeys.push({
      key: window.EMBEDDED_GROQ_API_KEY,
      name: "Demo Groq Key",
      active: true
    });
    localStorage.setItem("soustruznik_groq_api_keys", JSON.stringify(groqKeys));
  }

  // Initialize OpenRouter API Key with demo if needed
  const openrouterKeys = JSON.parse(localStorage.getItem("soustruznik_openrouter_api_keys") || "[]");
  if (openrouterKeys.length === 0 && window.EMBEDDED_OPENROUTER_API_KEY) {
    // Add embedded demo OpenRouter key automatically
    openrouterKeys.push({
      key: window.EMBEDDED_OPENROUTER_API_KEY,
      name: "Demo OpenRouter Key",
      active: true
    });
    localStorage.setItem("soustruznik_openrouter_api_keys", JSON.stringify(openrouterKeys));
  }

  // Initialize Mistral API Key with demo if needed
  const mistralKeys = JSON.parse(localStorage.getItem("soustruznik_mistral_api_keys") || "[]");
  if (mistralKeys.length === 0 && window.EMBEDDED_MISTRAL_API_KEY) {
    // Add embedded demo Mistral key automatically
    mistralKeys.push({
      key: window.EMBEDDED_MISTRAL_API_KEY,
      name: "Demo Mistral Key",
      active: true
    });
    localStorage.setItem("soustruznik_mistral_api_keys", JSON.stringify(mistralKeys));
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

  // Setup canvas event handlers (mousedown, mousemove, etc.)
  if (window.setupCanvasEvents) window.setupCanvasEvents();

  // Initialize default drawing settings (barvy a styly)
  if (window.initializeDefaultSettings) {
    window.initializeDefaultSettings();
  }

  // Initialize dimension color settings (barvy kót)
  if (window.initializeDimensionSettings) {
    window.initializeDimensionSettings();
  }

  // Initialize AI provider models
  if (window.updateModelsForProvider) {
    window.updateModelsForProvider();
  }

  // Setup model select change listener for image upload visibility
  const modelSelect = document.getElementById("aiModelSelect");
  if (modelSelect && window.updateImageUploadVisibility) {
    modelSelect.addEventListener("change", window.updateImageUploadVisibility);
  }

  // Start animation loop
  startAnimationLoop();

  // Load saved project if exists
  loadAutoSave();

  // ✅ Keyboard shortcuts nyní spravuje unified keyboard.js
  // setupKeyboardShortcuts() již není potřeba

  // Auto-save every 30 seconds
  setInterval(() => {
    if (window.saveProject) {
      autoSave();
    }
  }, 30000);
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

// ✅ setupKeyboardShortcuts - nyní nahrazena unified keyboard.js modulem
// Všechny keyboard shortcuts jsou teď v keyboard.js

function showHelp() {
  const shortcuts = window.getAllShortcuts ? window.getAllShortcuts() : {};

  let helpText = `
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
