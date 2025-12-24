/**
 * AI.JS - Google Gemini AI integration
 * - Chat interface and prompts
 * - AI memory system
 * - API integration
 * - Usage tracking
 */

// Globální proměnné jsou inicializovány v globals.js

// API Usage Stats
let apiUsageStats = {
  totalCalls: 0,
  totalTokensIn: 0,
  totalTokensOut: 0,
  dailyCalls: 0,
  lastReset: new Date().toISOString(),
};

// Inicializuj API stats na začátku
document.addEventListener("DOMContentLoaded", () => {
  loadApiStats();
  updateApiUsageUI();
});

// Inicializuj request timestamps
window.requestTimestamps = (() => {
  try {
    const stored = localStorage.getItem("ai_request_timestamps");
    if (stored) {
      const timestamps = JSON.parse(stored);
      const now = Date.now();
      return timestamps.filter(ts => now - ts < 60000);
    }
  } catch (e) {}
  return [];
})();

// Ulož timestamps do localStorage
window.saveRequestTimestamps = function() {
  try {
    localStorage.setItem("ai_request_timestamps", JSON.stringify(window.requestTimestamps));
  } catch (e) {
    console.warn("⚠️ Nelze uložit timestamps:", e);
  }
};

// Ulož API stats
function saveApiStats() {
  try {
    localStorage.setItem("api_usage_stats", JSON.stringify(apiUsageStats));
    updateApiUsageUI();
  } catch (e) {
    console.warn("⚠️ Nelze uložit API stats:", e);
  }
}

// Načti API stats
function loadApiStats() {
  const stored = localStorage.getItem("api_usage_stats");
  if (stored) {
    try {
      apiUsageStats = JSON.parse(stored);
      checkAndResetDailyStats();
    } catch (e) {
      console.warn("Could not parse API stats", e);
    }
  }
  scheduleMidnightReset();
}

// Zkontroluj a resetuj denní statistiky
function checkAndResetDailyStats() {
  const lastResetDate = new Date(apiUsageStats.lastReset);
  const today = new Date();

  if (
    lastResetDate.getDate() !== today.getDate() ||
    lastResetDate.getMonth() !== today.getMonth() ||
    lastResetDate.getFullYear() !== today.getFullYear()
  ) {
    console.log("🔄 Nový den - resetuji denní statistiky");
    apiUsageStats.dailyCalls = 0;
    apiUsageStats.lastReset = new Date().toISOString();
    saveApiStats();
  }
}

// Naplánuj reset v 10:00
function scheduleMidnightReset() {
  const now = new Date();
  const resetTime = new Date(now);
  resetTime.setHours(10, 0, 0, 0);

  if (resetTime <= now) {
    resetTime.setDate(resetTime.getDate() + 1);
  }

  const timeUntilReset = resetTime - now;

  setTimeout(() => {
    console.log("🌅 10:00 - resetuji denní limit API");
    apiUsageStats.dailyCalls = 0;
    apiUsageStats.lastReset = new Date().toISOString();
    saveApiStats();
    updateApiUsageUI();
    scheduleMidnightReset();
  }, timeUntilReset);
}

// Ruční reset API stats
window.resetApiStats = function () {
  if (confirm("Opravdu resetovat API statistiky?")) {
    apiUsageStats = {
      totalCalls: 0,
      totalTokensIn: 0,
      totalTokensOut: 0,
      dailyCalls: 0,
      lastReset: new Date().toISOString(),
    };
    saveApiStats();
    alert("✅ API statistiky resetovány");
  }
};

// Aktualizuj UI s API stats
function updateApiUsageUI() {
  const usage = document.getElementById("apiUsageInfo");
  if (!usage) return;

  const apiCallsCount = window.requestTimestamps?.length || 0;
  const API_FREE_LIMIT = window.getCurrentModelLimit?.() || 15;
  const keyName = window.getCurrentApiKeyName?.() || "Žádný klíč";

  const percentage = Math.round((apiCallsCount / API_FREE_LIMIT) * 100);
  const color =
    apiCallsCount >= API_FREE_LIMIT
      ? "#ff4444"
      : apiCallsCount > 10
      ? "#ff9900"
      : "#44ff44";

  usage.innerHTML = `
    <div style="font-size: 11px; color: #aaa; text-align: center;">
      🔑 ${keyName}<br/>
      📊 API limit: <span style="color: ${color}; font-weight: bold">${apiCallsCount}/${API_FREE_LIMIT}</span> za minutu<br/>
      <div style="margin-top: 4px; font-size: 10px; color: #666;">📈 Dnes: <span style="color: #888">${apiUsageStats.dailyCalls || 0}</span> | Celkem: <span style="color: #888">${apiUsageStats.totalCalls}</span></div><br/>
      <button onclick="window.resetApiStats()" style="font-size: 9px; padding: 2px 6px; margin-top: 2px; background: #333; border: 1px solid #555; color: #aaa; cursor: pointer; border-radius: 3px; width: 100%; margin-right: 0;">🔄 Reset</button>
    </div>
  `;
}

// Zruš aktuální AI request
window.cancelAIRequest = function() {
  window.processingAI = false;

  const promptInput = document.getElementById("aiPrompt");
  const btnCancel = document.getElementById("btnCancel");
  const btnGenerate = document.getElementById("btnGenerate");

  if (promptInput) promptInput.disabled = false;
  if (btnCancel) btnCancel.style.display = "none";
  if (btnGenerate) btnGenerate.style.display = "inline-block";

  const container = document.getElementById("aiChatHistory");
  if (container) {
    const loadingDivs = container.querySelectorAll("div[style*='loading-dots']");
    loadingDivs.forEach(div => div.remove());

    const cancelMsg = document.createElement("div");
    cancelMsg.className = "chat-msg model";
    cancelMsg.style.color = "#ef4444";
    cancelMsg.textContent = "❌ Požadavek zrušen";
    container.appendChild(cancelMsg);
    container.scrollTop = container.scrollHeight;
  }
};
// Mapy limitů pro jednotlivé modely (Requests Per Minute)
window.MODEL_LIMITS = {
  "gemini-2.5-flash-lite": { rpm: 15, name: "Gemini 2.5 Flash Lite" },
  "gemini-2.5-flash": { rpm: 10, name: "Gemini 2.5 Flash" },
  "gemini-3-pro-preview": { rpm: 2, name: "Gemini 3 Pro" },
  "gemini-2.0-flash-exp": { rpm: 15, name: "Gemini 2.0 Flash Exp" }
};

window.REQUESTS_WINDOW_MS = 60000; // 1 minuta

// Získej aktuální limit na základě vybraného modelu
window.getCurrentModelLimit = function() {
  const modelSelect = document.getElementById("aiModelSelect");
  const selectedModel = modelSelect?.value || "gemini-2.5-flash-lite";
  const limit = window.MODEL_LIMITS[selectedModel];
  return limit ? limit.rpm : 15; // Fallback na 15
};

window.getCurrentModel = function() {
  const modelSelect = document.getElementById("aiModelSelect");
  return modelSelect?.value || "gemini-2.5-flash-lite";
};

// Přidej request do queue
// ===== JEDNODUCHÉ POSLÁNÍ REQUESTU BEZ QUEUE =====
// Aktualizuj UI s informací o limitech
window.updateQueueDisplay = function() {
  const now = Date.now();
  window.requestTimestamps = window.requestTimestamps.filter(
    ts => now - ts < window.REQUESTS_WINDOW_MS
  );
  window.saveRequestTimestamps(); // Ulož aktualizované timestamps

  const maxRequests = window.getCurrentModelLimit();
  const usedSlots = window.requestTimestamps.length;
  const availableSlots = maxRequests - usedSlots;

  const meterDiv = document.getElementById("aiLimitMeter");
  if (!meterDiv) return;

  // Jen čísla - integrované do stránky
  const text = `${usedSlots}/${maxRequests}`;
  meterDiv.textContent = text;

  // Varuj když se blížíš limitu
  if (availableSlots <= 2) {
    meterDiv.style.color = "#ff9800";
  } else if (usedSlots >= maxRequests) {
    meterDiv.style.color = "#f87171";
  } else {
    meterDiv.style.color = "#888";
  }

  // Zablokuj/Odblokuj tlačítko
  const btnGenerate = document.getElementById("btnGenerate");

  if (btnGenerate) {
    if (availableSlots <= 0) {
      btnGenerate.disabled = true;
      btnGenerate.style.opacity = "0.5";
    } else {
      btnGenerate.disabled = false;
      btnGenerate.style.opacity = "1";
    }
  }
};

// ===== AI SELECT TOGGLE =====
window.toggleAiSelect = function () {
  window.aiSelectMode = !window.aiSelectMode;

  // Aktualizuj všechna select tlačítka (v AI sekci i na canvas)
  const selectBtns = document.querySelectorAll('[id*="Select"]');
  selectBtns.forEach(btn => {
    if (window.aiSelectMode) {
      btn.style.background = "#3a7bc8";
      btn.style.borderColor = "#5b8ef5";
    } else {
      btn.style.background = "#333";
      btn.style.borderColor = "#444";
    }
  });

  if (window.aiSelectMode) {
    if (window.setMode) window.setMode("select");
  } else {
    if (window.clearMode) window.clearMode();
  }
};

// ===== QUICK INPUT (Keyboard) =====
window.openQuickInput = function () {
  const modal = document.getElementById("quickInputModal");
  if (modal) {
    modal.style.display = "flex";
  }
};

window.closeQuickInput = function () {
  const modal = document.getElementById("quickInputModal");
  if (modal) {
    modal.style.display = "none";
  }
};

window.confirmQuickInput = function () {
  const display = document.getElementById("quickInputDisplay");
  const prompt = document.getElementById("aiPrompt");
  if (display && prompt) {
    const text = display.value.trim();
    if (text) {
      prompt.value = text;
      window.closeQuickInput();
      if (window.callGemini) window.callGemini();
    }
  }
};

window.insertToken = function (token) {
  const display = document.getElementById("quickInputDisplay");
  if (display) {
    display.value += token;
    display.scrollTop = display.scrollHeight;
  }
};

window.backspaceToken = function () {
  const display = document.getElementById("quickInputDisplay");
  if (display && display.value) {
    display.value = display.value.slice(0, -1);
  }
};

// ===== QUICK INPUT HELP =====
window.showQuickInputHelp = function () {
  const modal = document.getElementById("quickInputHelpModal");
  if (modal) modal.style.display = "flex";
};

window.closeQuickInputHelp = function () {
  const modal = document.getElementById("quickInputHelpModal");
  if (modal) modal.style.display = "none";
};

// ===== VOICE INPUT =====
window.toggleVoice = function () {
  const btn = document.getElementById("btnVoice");
  if (!btn) return;
  btn.classList.toggle("recording-pulse");
  setTimeout(() => {
    btn.classList.remove("recording-pulse");
  }, 2000);
  alert("🎤 Hlasové zadání: Funkce bude implementována v příští verzi.");
};

// ===== AI PREFERENCES =====
window.openAIPreferences = function () {
  const modal = document.getElementById("aiPreferencesModal");
  if (modal) {
    modal.style.display = "flex";
    window.renderPreferencesList();
  }
};

window.closeAIPreferences = function () {
  const modal = document.getElementById("aiPreferencesModal");
  if (modal) modal.style.display = "none";
};

window.renderPreferencesList = function () {
  const memory = window.loadAIMemory ? window.loadAIMemory() : {};
  const list = document.getElementById("preferencesList");
  if (!list) return;

  const prefs = memory.preferences || {};
  if (Object.keys(prefs).length === 0) {
    list.innerHTML = '<div style="padding: 10px; color: #555; font-style: italic; text-align: center;">Zatím žádné preference</div>';
    return;
  }

  list.innerHTML = Object.entries(prefs)
    .map(([k, v]) => `<div style="padding: 8px; background: #222; border-radius: 4px; margin-bottom: 6px;"><strong>${k}:</strong> ${v}</div>`)
    .join("");
};

window.addAIPreference = function () {
  const keyEl = document.getElementById("newPrefKey");
  const valEl = document.getElementById("newPrefValue");
  if (!keyEl || !valEl) return;

  const key = keyEl.value.trim();
  const val = valEl.value.trim();

  if (!key || !val) {
    alert("Vyplň klíč i hodnotu");
    return;
  }

  const memory = window.loadAIMemory ? window.loadAIMemory() : {};
  if (!memory.preferences) memory.preferences = {};
  memory.preferences[key] = val;

  if (window.saveAIMemory) window.saveAIMemory(memory);

  keyEl.value = "";
  valEl.value = "";
  window.renderPreferencesList();
  alert("✅ Preference přidána!");
};

// ===== AI MEMORY & METRICS =====
window.showAIMemory = function () {
  try {
    const memory = JSON.parse(localStorage.getItem("soustruznik_ai_memory") || "{}");
    const patterns = memory.successfulPatterns || [];

    let msg = "🧠 AI SE NAUČILA:\n\n";
    if (patterns.length > 0) {
      msg += "✅ Úspěšné vzory:\n";
      patterns.slice(-10).forEach((p) => {
        msg += `  • "${p.input}" → ${p.shapeCount} tvarů\n`;
      });
    } else {
      msg += "Zatím se nic nenaučila. Posílej jí příkazy!";
    }
    alert(msg);
  } catch (e) {
    alert("❌ Nelze načíst paměť: " + e.message);
  }
};

window.showAIMetrics = function () {
  try {
    const memory = JSON.parse(localStorage.getItem("soustruznik_ai_memory") || "{}");
    const patterns = memory.successfulPatterns || [];

    let msg = "📊 AI STATISTIKY:\n\n";
    msg += "Úspěšných příkazů: " + patterns.length + "\n";
    msg += "Poslední: " + (patterns.length > 0 ? patterns[patterns.length - 1].input : "žádný");
    alert(msg);
  } catch (e) {
    alert("❌ Chyba: " + e.message);
  }
};

// ===== IMAGE HANDLING =====
window.handleImageSelect = function (input) {
  const file = input.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    const result = e.target.result;
    window.currentImageBase64 = result.split(",")[1];
    window.currentImageMimeType = file.type;

    const previewImg = document.getElementById("aiPreviewImg");
    if (previewImg) previewImg.src = result;

    const preview = document.getElementById("aiImagePreview");
    if (preview) preview.style.display = "block";

    const fileNameEl = document.getElementById("aiFileName");
    if (fileNameEl) fileNameEl.textContent = file.name;
  };

  reader.onerror = () => {
    alert("⚠️ Nepodařilo se přečíst soubor.");
  };

  reader.readAsDataURL(file);
};

window.clearImage = function () {
  window.currentImageBase64 = null;
  window.currentImageMimeType = null;

  const input = document.getElementById("aiImageInput");
  if (input) input.value = "";

  const preview = document.getElementById("aiImagePreview");
  if (preview) preview.style.display = "none";

  const fileNameEl = document.getElementById("aiFileName");
  if (fileNameEl) fileNameEl.textContent = "";
};

window.clearChat = function () {
  const container = document.getElementById("aiChatHistory");
  if (container) {
    const messages = container.querySelectorAll(".chat-msg");
    messages.forEach(msg => msg.remove());
  }
};



// ===== DIRECTION MODAL =====
window.showDirectionModal = function () {
  const modal = document.getElementById("directionModal");
  if (modal) {
    modal.style.display = "flex";
  }
};

window.closeDirectionModal = function () {
  const modal = document.getElementById("directionModal");
  if (modal) {
    modal.style.display = "none";
  }
};

window.insertDirection = function (angle) {
  const display = document.getElementById("quickInputDisplay");
  if (display) {
    display.value += "AP" + angle + " ";
    display.scrollTop = display.scrollHeight;
  }
  window.closeDirectionModal();
};

// ===== LENGTH MODAL =====
window.openLengthModal = function () {
  const modal = document.getElementById("lengthModal");
  const input = document.getElementById("lengthInput");
  if (modal) {
    modal.style.display = "flex";
    if (input) {
      input.value = "";
      setTimeout(() => input.focus(), 100);
    }
  }
};

window.closeLengthModal = function () {
  const modal = document.getElementById("lengthModal");
  if (modal) {
    modal.style.display = "none";
  }
};

window.insertLengthToken = function (type) {
  window.lengthType = type;
};

window.confirmLength = function () {
  const input = document.getElementById("lengthInput");
  const display = document.getElementById("quickInputDisplay");
  if (!input || !display) return;

  const value = input.value.trim();
  if (!value) {
    alert("Zadej prosím délku!");
    return;
  }

  const type = window.lengthType || "L";
  display.value += type + value + " ";
  display.scrollTop = display.scrollHeight;
  window.closeLengthModal();
};

// ===== UNDO/REDO =====
window.aiUndo = function () {
  if (window.undo) window.undo();
};

window.aiRedo = function () {
  if (window.redo) window.redo();
};

window.toggleAiPanel = function (open) {
  const container = document.getElementById("toolsAi");
  if (!container) {
    return;
  }

  // Inicalizuj window.aiPanelOpen pokud neexistuje
  if (window.aiPanelOpen === undefined) {
    window.aiPanelOpen = container.style.display !== "none";
  }

  if (open !== undefined) {
    window.aiPanelOpen = open;
  } else {
    window.aiPanelOpen = !window.aiPanelOpen;
  }

  if (window.aiPanelOpen) {
    container.style.display = "flex";
    const chatWindow = document.getElementById("chatWindow");
    if (chatWindow) {
      chatWindow.style.display = "block";
    }
    const input = document.getElementById("aiPrompt");
    if (input) {
      setTimeout(() => input.focus(), 100);
    }
    if (!window.aiMemoryLoaded && window.loadAIMemory) {
      window.loadAIMemory();
      window.aiMemoryLoaded = true;
    }
  } else {
    container.style.display = "none";
    const chatWindow = document.getElementById("chatWindow");
    if (chatWindow) {
      chatWindow.style.display = "none";
    }
  }
};

// ===== RETRY WITH BACKOFF (Pro API chyby) =====
window.retryWithBackoff = async function (apiCall, maxRetries = 3) {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const result = await apiCall();
      return result;
    } catch (err) {
      const isRateLimit =
        err.message?.includes("429") ||
        err.message?.includes("quota") ||
        err.message?.includes("Quota exceeded") ||
        err.message?.includes("RESOURCE_EXHAUSTED");

      if (isRateLimit && attempt < maxRetries - 1) {
        // Exponenciální backoff bez viditelného čekání: 2s, 4s, 8s
        const delayMs = Math.pow(2, attempt + 1) * 1000;
        await new Promise((resolve) => setTimeout(resolve, delayMs));
        continue;
      }

      // Pokud to není rate limit nebo už jsme vyčerpali pokusy, vyhoď error
      if (attempt === maxRetries - 1 || !isRateLimit) {
        console.error("❌ API Error:", err.message);
        throw err;
      }

      throw err;
    }
  }
};

// ===== AI MEMORY: Learn from patterns =====
const AI_MEMORY_KEY = "soustruznik_ai_memory";

window.getAIMemoryContext = function () {
  try {
    const memory = JSON.parse(localStorage.getItem(AI_MEMORY_KEY) || "{}");
    const commands = memory.commands || [];
    const patterns = memory.successfulPatterns || [];

    const context = [];
    if (commands.length > 0) {
      context.push(`📌 Naposledy používané příkazy: ${commands.slice(-3).map(c => c.text).join(", ")}`);
    }
    if (patterns.length > 0) {
      context.push(`✅ Úspěšné vzory: ${patterns.slice(-2).map(p => p.input).join(", ")}`);
    }

    return context.join("\n");
  } catch (e) {
    return "";
  }
};

window.recordAISuccess = function (prompt, shapes) {
  try {
    const memory = JSON.parse(localStorage.getItem(AI_MEMORY_KEY) || "{}");

    if (!memory.successfulPatterns) memory.successfulPatterns = [];
    memory.successfulPatterns.push({
      input: prompt.toLowerCase().substring(0, 50),
      shapeCount: shapes.length,
      timestamp: new Date().toISOString(),
    });

    if (memory.successfulPatterns.length > 50) {
      memory.successfulPatterns = memory.successfulPatterns.slice(-50);
    }

    localStorage.setItem(AI_MEMORY_KEY, JSON.stringify(memory));
  } catch (e) {
  }
};

// ===== MAIN AI CALL =====
window.callGemini = async function () {
  const promptInput = document.getElementById("aiPrompt");
  if (!promptInput) return;

  const prompt = promptInput.value.trim();
  if (!prompt) {
    alert("Zadej prosím příkaz pro AI!");
    return;
  }

  // Zobraz Cancel button
  const btnCancel = document.getElementById("btnCancel");
  const btnGenerate = document.getElementById("btnGenerate");
  if (btnCancel) btnCancel.style.display = "inline-block";
  if (btnGenerate) btnGenerate.style.display = "none";

  if (window.processingAI) {
    alert("AI zpracovává předchozí příkaz. Čekej prosím.");
    return;
  }

  // Pošli přímo na AI
  window.callGeminiDirect();
};

// Volání AI - pošle request přímo na API
window.callGeminiDirect = async function () {
  const promptInput = document.getElementById("aiPrompt");
  const container = document.getElementById("aiChatHistory");
  if (!promptInput || !container) return;

  const prompt = promptInput.value.trim();
  if (!prompt) return;

  window.processingAI = true;
  promptInput.disabled = true;

  // Zobraz user zprávu hned
  const userMsgDiv = document.createElement("div");
  userMsgDiv.className = "chat-msg user";
  userMsgDiv.style.marginBottom = "10px";
  userMsgDiv.innerHTML = `<strong>Ty:</strong> ${escapeHtml(prompt)}`;
  container.appendChild(userMsgDiv);
  container.scrollTop = container.scrollHeight;

  // Add loading indicator
  const loadingDiv = document.createElement("div");
  loadingDiv.style.cssText = "text-align: center; color: #666; padding: 12px; font-size: 12px;";
  loadingDiv.innerHTML = '<div class="loading-dots"><div></div><div></div><div></div></div> Čekám na odpověď...';
  container.appendChild(loadingDiv);
  container.scrollTop = container.scrollHeight;

  try {
    const apiKey = window.getCurrentApiKey ? window.getCurrentApiKey() : null;
    if (!apiKey) {
      throw new Error("Nemáte API klíč. Otevřete ⚙️ Nastavení.");
    }

    // Build full system prompt with all critical instructions
    const modeIndicator = window.mode ? `Current mode: ${window.mode}` : "";
    const xMeasureMode = window.xMeasureMode || "diameter";

    const learningContext = window.getAIMemoryContext ? window.getAIMemoryContext() : "";

    const modeExplanation =
      xMeasureMode === "diameter"
        ? `X-AXIS MODE: DIAMETER (⌀)
User shows values as diameter from center axis.
Example: User says "X=100" = 50mm from center (radius=50)
You MUST respond with DIAMETER values: "X=100" even though internal radius=50
The application will automatically convert diameter→radius for rendering.`
        : `X-AXIS MODE: RADIUS (R)
User shows values as radius distance from center axis.
Example: User says "X=50" = exactly 50mm from center
You MUST respond with RADIUS values: "X=50"
No conversion needed, use values exactly as specified.`;

    const systemPrompt = `CAD Assistant for CNC Lathe/Mill operations (Czech language).

COORDINATE SYSTEM:
Z-axis (horizontal/→) = JSON 'x' property
X-axis (vertical/↑) = JSON 'y' property
Origin: (0,0) center
Report coords as: "Z=[x] X=[y]"

🔧 CURRENT MODE: ${modeIndicator}
${modeExplanation}

ANGLES (Standard Unit Circle):
0°=RIGHT(+Z), 90°=UP(+X), 180°=LEFT(-Z), 270°=DOWN(-X)

INPUT FORMATS:
1. Natural language: "kružnice Z100 X50 R30"
2. CNC/G-code style: "X80Z56R52" or "X50Z56AP0RP120"

CNC SYNTAX PARSING:
- XvalZval = position (X=diameter/radius depending on mode, Z=length)
- Rval = radius for circle
- APval = angle in polar (0°=right, 90°=up, 180°=left, 270°=down)
- RPval = polar radius/length (distance from start point)

Examples (when in DIAMETER mode):
"X80Z56R52" → Circle at (Z=56,X=80⌀) with radius 52 (diameter=104)
            User sees center at X=80 (which is 80mm from axis, diameter)
"X50Z56AP0RP120" → Line from (Z=56,X=50⌀) at angle 0° length 120mm
                 User sees start X=50 (50mm from axis, diameter)
  → End point: Z=56+120*cos(0°)=176, X=50+120*sin(0°)=50
  → {"type":"line","x1":56,"y1":50,"x2":176,"y2":50}

"X80Z56R52;X50Z56AP0RP120" → Circle + Line:
  - Circle: center (56,80), R=52
  - Line: from (56,50) angle 0° length 120 → to (176,50)

IMPORTANT FOR POLAR LINES:
When user says "úsečka OD STŘEDU kružnice" or "line FROM CENTER of circle":
- Start point (x1,y1) = center of that circle (cx,cy)
- End point: calculate using angle and length FROM that center
- CALCULATION:
  * x2 = x1 + length*cos(angle_degrees * π/180)
  * y2 = y1 + length*sin(angle_degrees * π/180)

- Example 1: Center Z=100,X=100 + line angle 0° length 120mm
  → x2 = 100 + 120*cos(0°) = 100 + 120*1 = 220
  → y2 = 100 + 120*sin(0°) = 100 + 120*0 = 100
  → Line: {"type":"line","x1":100,"y1":100,"x2":220,"y2":100}

- Example 2: Center Z=96,X=78 + line angle 5° length 250mm
  → x2 = 96 + 250*cos(5°) = 96 + 250*0.9962 = 345
  → y2 = 78 + 250*sin(5°) = 78 + 250*0.0872 = 100
  → Line: {"type":"line","x1":96,"y1":78,"x2":345,"y2":100}

⭕ CIRCUMCIRCLE (kružnice procházející 3 body A, B, C):
When user says "kružnici procházející body A B C" or "circle through 3 points":
1. Use the 3 points from context (e.g., points A(x1,y1), B(x2,y2), C(x3,y3))
2. Calculate circumcircle center (cx, cy) and radius r:

CIRCUMCIRCLE FORMULA:
Let: A=(x1,y1), B=(x2,y2), C=(x3,y3)
D = 2*(x1*(y2-y3) + x2*(y3-y1) + x3*(y1-y2))
If D ≈ 0: Points are collinear, cannot draw circle

If D ≠ 0:
ux = ((x1²+y1²)*(y2-y3) + (x2²+y2²)*(y3-y1) + (x3²+y3²)*(y1-y2)) / D
uy = ((x1²+y1²)*(x3-x2) + (x2²+y2²)*(x1-x3) + (x3²+y3²)*(x2-x1)) / D
cx = ux
cy = uy
r = √((x1-cx)² + (y1-cy)²)

Example: Points A(0,0), B(100,0), C(50,86.6)
- D = 2*(0*(0-86.6) + 100*(86.6-0) + 50*(0-0)) = 17320
- ux = ((0)*(0-86.6) + (10000)*(86.6-0) + (9966)*(0-0)) / 17320 = 50
- uy = ((0)*(50-100) + (10000)*(0-50) + (9966)*(100-0)) / 17320 ≈ 57.7
- cx=50, cy=57.7, r=√((0-50)²+(0-57.7)²) ≈ 76.3

3. Return the circle as: {"type":"circle","cx":cx,"cy":cy,"r":r}

⚠️ CRITICAL RULES FOR LINES:
1. ALWAYS calculate BOTH x2 AND y2 using the angle and length
2. DO NOT provide only y2 without x2 - both must be present
3. Use the FULL formulas:
   - x2 = x1 + length*cos(angle_in_radians)
   - y2 = y1 + length*sin(angle_in_radians)
4. Even if you're unsure about x, always provide calculated x2
5. A line with x1==x2 AND y1==y2 is invisible (zero length)!

RESPONSE FORMAT (strict JSON only):
{"response_text":"Brief Czech confirmation <50 chars","shapes":[...]}

SHAPE TYPES:
Line: {"type":"line","x1":z1,"y1":x1,"x2":z2,"y2":x2}
Circle: {"type":"circle","cx":z,"cy":x,"r":radius}
Point: {"type":"point","x":z,"y":x}

${learningContext}`;

    const contextInfo = window.buildDrawingContext ? window.buildDrawingContext() : "Prázdné kreslení";

    const fullPrompt = `${systemPrompt}

Aktuální kreslení:
${contextInfo}

Uživatel: ${prompt}`;

    // Call API with retry
    const startTime = performance.now();
    const selectedModel = window.getCurrentModel();
    const response = await window.retryWithBackoff(async () => {
      const resp = await fetch(
        "https://generativelanguage.googleapis.com/v1beta/models/" + selectedModel + ":generateContent?key=" + apiKey,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: fullPrompt }] }],
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: 2048,
            },
          }),
        }
      );

      if (!resp.ok) {
        const error = await resp.json().catch(() => ({}));
        throw new Error(error.error?.message || `HTTP ${resp.status}`);
      }

      return await resp.json();
    }, 5);

    const apiTime = performance.now() - startTime;

    if (container.contains(loadingDiv)) container.removeChild(loadingDiv);

    // Parse response
    let aiResponseText = response.candidates?.[0]?.content?.parts?.[0]?.text || "";
    if (!aiResponseText) {
      throw new Error("AI nevrátila text");
    }

    // Aggressive JSON cleaning
    let cleanedJson = aiResponseText
      .replace(/```json\s*/gi, "")
      .replace(/```\s*/g, "");

    const firstBrace = cleanedJson.indexOf("{");
    const lastBrace = cleanedJson.lastIndexOf("}");
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      cleanedJson = cleanedJson.substring(firstBrace, lastBrace + 1);
    }

    // Fix incomplete JSON
    const openBraces = (cleanedJson.match(/\{/g) || []).length;
    const closeBraces = (cleanedJson.match(/\}/g) || []).length;
    const openBrackets = (cleanedJson.match(/\[/g) || []).length;
    const closeBrackets = (cleanedJson.match(/\]/g) || []).length;

    if (openBrackets > closeBrackets) {
      cleanedJson += "]".repeat(openBrackets - closeBrackets);
    }
    if (openBraces > closeBraces) {
      cleanedJson += "}".repeat(openBraces - closeBraces);
    }

    // Fix missing x2
    cleanedJson = cleanedJson.replace(
      /\{"type":"line","x1":([^,]+),"y1":([^,]+),"y2":([^}]+)\}/g,
      '{"type":"line","x1":$1,"y1":$2,"x2":$1,"y2":$3}'
    );

    // Shorten long numbers
    cleanedJson = cleanedJson.replace(/(\d+\.\d{6})\d{4,}/g, "$1");
    cleanedJson = cleanedJson.replace(/,\s*([}\]])/g, "$1");

    let result;
    try {
      result = JSON.parse(cleanedJson);
    } catch (e) {
      throw new Error("Nevalidní JSON odpověď");
    }

    const replyText = result.response_text || "Hotovo.";
    const newShapes = result.shapes || [];

    // Add shapes to canvas
    if (Array.isArray(newShapes) && newShapes.length > 0) {
      const xMeasureMode = window.xMeasureMode || "diameter";

      newShapes.forEach((s) => {
        try {
          if (
            s.type === "line" &&
            typeof s.x1 === "number" &&
            typeof s.y1 === "number" &&
            typeof s.x2 === "number" &&
            typeof s.y2 === "number"
          ) {
            window.shapes.push({
              type: "line",
              x1: s.x1,
              y1: s.y1,
              x2: s.x2,
              y2: s.y2,
            });
          } else if (
            s.type === "circle" &&
            typeof s.cx === "number" &&
            typeof s.cy === "number" &&
            typeof s.r === "number" &&
            s.r > 0
          ) {
            // Konvertuj poloměr pokud je xMeasureMode = "diameter"
            const convertedR = xMeasureMode === "diameter" ? s.r / 2 : s.r;
            window.shapes.push({
              type: "circle",
              cx: s.cx,
              cy: s.cy,
              r: convertedR,
            });
          } else if (
            s.type === "point" &&
            typeof s.x === "number" &&
            typeof s.y === "number"
          ) {
            window.points.push({ x: s.x, y: s.y });
          }
        } catch (e) {
        }
      });

      if (window.updateSnapPoints) window.updateSnapPoints();
      if (window.draw) window.draw();

      // Learn from success
      window.recordAISuccess(prompt, newShapes);
    }

    // Add to chat
    const msgDiv = document.createElement("div");
    msgDiv.className = "chat-msg model";
    if (newShapes.length > 0) {
      msgDiv.innerHTML = `<span class="shape-tag">✏️ +${newShapes.length} tvarů</span><br>${escapeHtml(replyText)}`;
    } else {
      msgDiv.innerHTML = escapeHtml(replyText);
    }
    container.appendChild(msgDiv);
    container.scrollTop = container.scrollHeight;

    promptInput.value = "";
    window.clearImage?.();

    // Aktualizuj API usage stats
    apiUsageStats.totalCalls = (apiUsageStats.totalCalls || 0) + 1;
    apiUsageStats.dailyCalls = (apiUsageStats.dailyCalls || 0) + 1;
    saveApiStats();
    updateApiUsageUI();

  } catch (err) {

    if (container.contains(loadingDiv)) container.removeChild(loadingDiv);

    const errorDiv = document.createElement("div");
    errorDiv.className = "chat-msg model";
    errorDiv.style.color = "#ff6b6b";
    errorDiv.style.whiteSpace = "pre-wrap";

    let errorMsg = "❌ " + (err.message || "Neznámá chyba");

    // Lepší zpráva pro quota exceeded
    if (err.message.includes("quota") || err.message.includes("Quota exceeded")) {
      errorMsg = "⏳ KVÓTA PŘEKROČENA\n\n💡 Aplikace již automaticky čekala a zkusila znovu.\n\nMožnosti:\n• Čekej 1-2 minuty a zkus znovu\n• Přidej svůj vlastní API klíč (⚙️ Nastavení)\n• Jdi na: https://console.cloud.google.com\n\nGemini 2.5 Flash Lite má 15 RPM limit na bezplatném plánu.";
    } else if (err.message.includes("API klíč")) {
      errorMsg += "\n\n💡 Otevři ⚙️ Nastavení a vlož API klíč.";
    }

    errorDiv.textContent = errorMsg;
    container.appendChild(errorDiv);
    container.scrollTop = container.scrollHeight;
  } finally {
    window.processingAI = false;
    promptInput.disabled = false;

    // Skryj Cancel button, zobraz Generate button
    const btnCancel = document.getElementById("btnCancel");
    const btnGenerate = document.getElementById("btnGenerate");
    if (btnCancel) btnCancel.style.display = "none";
    if (btnGenerate) btnGenerate.style.display = "inline-block";
  }
};

window.buildDrawingContext = function () {
  const shapes = window.shapes || [];
  const points = window.points || [];
  let context = "";

  if (points.length > 0) {
    context += `🔹 BODY (${points.length}):\n`;
    points.forEach((p, i) => {
      context += `  ${i + 1}. [${p.x.toFixed(1)}, ${p.y.toFixed(1)}]\n`;
    });
  }

  if (shapes.length > 0) {
    context += `\n📐 OBJEKTY (${shapes.length}):\n`;
    shapes.forEach((s, i) => {
      if (s.type === "line") {
        const len = Math.sqrt((s.x2 - s.x1) ** 2 + (s.y2 - s.y1) ** 2).toFixed(1);
        context += `  ${i + 1}. Čára: [${s.x1.toFixed(1)},${s.y1.toFixed(1)}] → [${s.x2.toFixed(1)},${s.y2.toFixed(1)}] (délka: ${len})\n`;
      } else if (s.type === "circle") {
        context += `  ${i + 1}. Kružnice: střed [${s.cx.toFixed(1)},${s.cy.toFixed(1)}], r=${s.r.toFixed(1)}\n`;
      } else if (s.type === "arc") {
        context += `  ${i + 1}. Oblouk: [${s.x1.toFixed(1)},${s.y1.toFixed(1)}] → [${s.x2.toFixed(1)},${s.y2.toFixed(1)}], úhel=${(s.angle || 0).toFixed(1)}°\n`;
      }
    });
  }

  if (context === "") {
    context = "Prázdné kreslení - zatím nic";
  }

  return context;
};

window.clearChat = function () {
  const chatWindow = document.getElementById("chatWindow");
  if (chatWindow) {
    chatWindow.innerHTML = "";
  }
  chatHistory = [];
};

window.loadAIMemory = function () {
  const chatWindow = document.getElementById("chatWindow");
  if (!chatWindow) return;

  // Načti historii z localStorage
  try {
    const stored = localStorage.getItem("ai_chat_history");
    if (stored) {
      window.chatHistory = JSON.parse(stored);
      chatWindow.innerHTML = "";

      window.chatHistory.forEach((entry) => {
        const userMsg = document.createElement("div");
        userMsg.className = "message user-message";
        userMsg.innerHTML = `<strong>Ty:</strong> ${escapeHtml(entry.user)}`;
        chatWindow.appendChild(userMsg);

        const aiMsg = document.createElement("div");
        aiMsg.className = "message ai-message";
        aiMsg.innerHTML = `<strong>Gemini:</strong> ${escapeHtml(entry.ai)}`;
        chatWindow.appendChild(aiMsg);
      });

      chatWindow.scrollTop = chatWindow.scrollHeight;
    }
  } catch (e) {
  }
};

// Funkce pro uložení chat historie do localStorage
window.saveChatHistory = function () {
  try {
    localStorage.setItem("ai_chat_history", JSON.stringify(window.chatHistory || []));
  } catch (e) {
  }
};

window.showAiStats = function () {
  const modal = document.getElementById("aiStatsModal") || createStatsModal();
  if (modal) {
    modal.style.display = "flex";
    if (window.updateAiStats) window.updateAiStats();
  }
};

function createStatsModal() {
  const modal = document.createElement("div");
  modal.id = "aiStatsModal";
  modal.className = "modal";
  modal.style.display = "none";
  modal.innerHTML = `
    <div class="modal-content">
      <h3>📊 Statistika AI</h3>
      <div id="statsContent" style="margin-top: 15px; font-size: 14px; line-height: 1.8;">
        <p>Inicialisuje se...</p>
      </div>
      <button onclick="document.getElementById('aiStatsModal').style.display='none'" style="margin-top: 15px;">Zavřít</button>
    </div>
  `;
  document.body.appendChild(modal);

  modal.addEventListener("click", (e) => {
    if (e.target === modal) modal.style.display = "none";
  });

  return modal;
}

window.updateAiStats = function () {
  const statsContent = document.getElementById("statsContent");
  if (!statsContent) return;

  const memory = window.getAIMemoryContext ? window.getAIMemoryContext() : {};
  const commandCount = memory.commands ? memory.commands.length : 0;
  const correctionCount = memory.corrections ? memory.corrections.length : 0;
  const totalInteractions = chatHistory.length;

  const stats = `
    <strong>📝 Interakce:</strong> ${totalInteractions}<br>
    <strong>📌 Příkazů:</strong> ${commandCount}<br>
    <strong>✏️ Oprav:</strong> ${correctionCount}<br>
    <strong>💾 Chyťů:</strong> ${new Date().toLocaleString()}<br>
  `;

  statsContent.innerHTML = stats;
};

function escapeHtml(text) {
  const map = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  };
  return text.replace(/[&<>"']/g, (m) => map[m]);
}

window.updateSelectionUI = function () {
  const selectedCount = window.selectedItems ? window.selectedItems.length : 0;
  const infoEl = document.getElementById("selectionInfo");

  if (infoEl) {
    if (selectedCount > 0) {
      let infoText = `📌 Vybráno: ${selectedCount} objektů`;

      // Přidej vzdálenost pokud jsou vybrané 2 body
      if (selectedCount === 2) {
        const item1 = window.selectedItems[0];
        const item2 = window.selectedItems[1];

        if (item1.category === "point" && item2.category === "point") {
          const dist = Math.sqrt((item1.x - item2.x) ** 2 + (item1.y - item2.y) ** 2);
          infoText += ` | 📏 Vzdálenost AB: ${dist.toFixed(2)} mm`;
        }
      }

      // Přidej informaci o střídavých typech
      if (selectedCount >= 2) {
        const hasPoints = window.selectedItems.some(i => i.category === "point");
        const hasShapes = window.selectedItems.some(i => i.category === "shape");

        if (hasPoints && hasShapes) {
          infoText += " | ⚙️ (bod+tvar)";
        }
      }

      infoEl.textContent = infoText;
      infoEl.style.display = "block";
    } else {
      infoEl.style.display = "none";
    }
  }
};

// ===== EVENT LISTENERS =====

document.addEventListener("DOMContentLoaded", function () {
  // ✅ Keyboard handler pro aiPrompt nyní spravuje unified keyboard.js
  // Enter v aiPrompt nyní volá window.callGemini přes keyboard.js

  const btnSendAi = document.getElementById("btnSendAi");
  if (btnSendAi) {
    btnSendAi.addEventListener("click", function () {
      if (window.callGemini) window.callGemini();
    });
  }

  const btnClearChat = document.getElementById("btnClearChat");
  if (btnClearChat) {
    btnClearChat.addEventListener("click", function () {
      if (confirm("Smazat chat historii?")) {
        window.clearChat();
      }
    });
  }

  // Event listener removed - using inline onclick="window.showToolCategory('ai')" instead
  // (Was causing double-invocation: onclick + event listener)
});

// ===== HELPER: Build drawing context =====
window.buildDrawingContext = function () {
  const shapes = window.shapes || [];
  const points = window.points || [];
  const selectedItems = window.selectedItems || [];
  let context = "";

  // Zobraz vybrané objekty
  if (selectedItems.length > 0) {
    context += `⭐ VYBRANÉ OBJEKTY (${selectedItems.length}):\n`;
    selectedItems.forEach((item) => {
      if (item.category === "point") {
        context += `  ✓ Bod [${item.x?.toFixed(1) || "?"}, ${item.y?.toFixed(1) || "?"}] (Label: ${item.label || "?"})\n`;
      } else if (item.category === "shape" && item.type) {
        if (item.type === "circle") {
          context += `  ✓ Kružnice: střed [${item.cx?.toFixed(1) || "?"}, ${item.cy?.toFixed(1) || "?"}], r=${item.r?.toFixed(1) || "?"} (Label: ${item.label || "?"})\n`;
        } else if (item.type === "line") {
          context += `  ✓ Čára: [${item.x1?.toFixed(1) || "?"}, ${item.y1?.toFixed(1) || "?"}] → [${item.x2?.toFixed(1) || "?"}, ${item.y2?.toFixed(1) || "?"}] (Label: ${item.label || "?"})\n`;
        } else {
          context += `  ✓ ${item.type}: (Label: ${item.label || "?"})\n`;
        }
      }
    });
    context += "\n";
  }

  if (points.length > 0) {
    context += `🔹 BODY (${points.length}):\n`;
    points.forEach((p, i) => {
      context += `  ${i + 1}. [${p.x.toFixed(1)}, ${p.y.toFixed(1)}]\n`;
    });
  }

  if (shapes.length > 0) {
    context += `\n📐 OBJEKTY (${shapes.length}):\n`;
    shapes.forEach((s, i) => {
      if (s.type === "line") {
        const len = Math.sqrt(((s.x2 || 0) - (s.x1 || 0)) ** 2 + ((s.y2 || 0) - (s.y1 || 0)) ** 2).toFixed(1);
        context += `  ${i + 1}. Čára: [${(s.x1 || 0).toFixed(1)},${(s.y1 || 0).toFixed(1)}] → [${(s.x2 || 0).toFixed(1)},${(s.y2 || 0).toFixed(1)}] (délka: ${len})\n`;
      } else if (s.type === "circle") {
        context += `  ${i + 1}. Kružnice: střed [${(s.cx || 0).toFixed(1)},${(s.cy || 0).toFixed(1)}], r=${(s.r || 0).toFixed(1)}\n`;
      } else if (s.type === "arc") {
        context += `  ${i + 1}. Oblouk: [${(s.x1 || 0).toFixed(1)},${(s.y1 || 0).toFixed(1)}] → [${(s.x2 || 0).toFixed(1)},${(s.y2 || 0).toFixed(1)}], úhel=${((s.angle || 0)).toFixed(1)}°\n`;
      }
    });
  }

  return context || "Prázdné kreslení - zatím nic";
};

// ===== AI TEST SUITE =====
window.AI_TEST_PROMPTS = [
  // ===== LEVEL 1: VELMI JEDNODUCHÉ =====
  {
    level: "VELMI JEDNODUCHÉ",
    name: "L1-1: Bod",
    prompt: "bod Z100 X100",
    expectedShapes: 1,
    expectedType: "point",
    complexity: 1
  },
  {
    level: "VELMI JEDNODUCHÉ",
    name: "L1-2: Jednoduchá čára",
    prompt: "čára Z0 X0 do Z100 X100",
    expectedShapes: 1,
    expectedType: "line",
    complexity: 1
  },
  {
    level: "VELMI JEDNODUCHÉ",
    name: "L1-3: Jednoduchá kružnice",
    prompt: "kružnice Z100 X100 R50",
    expectedShapes: 1,
    expectedType: "circle",
    complexity: 1
  },

  // ===== LEVEL 2: JEDNODUCHÉ =====
  {
    level: "JEDNODUCHÉ",
    name: "L2-1: CNC syntax kružnice",
    prompt: "X80Z56R52",
    expectedShapes: 1,
    expectedType: "circle",
    complexity: 2
  },
  {
    level: "JEDNODUCHÉ",
    name: "L2-2: Dvě čáry",
    prompt: "čára Z0 X0 do Z100 X0, čára Z100 X0 do Z100 X100",
    expectedShapes: 2,
    expectedType: "line",
    complexity: 2
  },
  {
    level: "JEDNODUCHÉ",
    name: "L2-3: Dvě kružnice",
    prompt: "kružnice Z100 X100 R30, kružnice Z200 X100 R40",
    expectedShapes: 2,
    expectedType: "circle",
    complexity: 2
  },
  {
    level: "JEDNODUCHÉ",
    name: "L2-4: Mix - čára a kružnice",
    prompt: "čára Z0 X0 do Z100 X100, kružnice Z200 X200 R50",
    expectedShapes: 2,
    expectedType: ["line", "circle"],
    complexity: 2
  },

  // ===== LEVEL 3: STŘEDNÍ =====
  {
    level: "STŘEDNÍ",
    name: "L3-1: Čára z centra kružnice",
    prompt: "kružnice Z100 X100 R50, pak čára od středu úhel 0° délka 100",
    expectedShapes: 2,
    expectedType: ["circle", "line"],
    complexity: 3
  },
  {
    level: "STŘEDNÍ",
    name: "L3-2: CNC - pozice + radius",
    prompt: "X50Z56R52, X100Z56R40",
    expectedShapes: 2,
    expectedType: "circle",
    complexity: 3
  },
  {
    level: "STŘEDNÍ",
    name: "L3-3: Obdélník (4 čáry)",
    prompt: "čára Z0 X0 do Z100 X0, čára Z100 X0 do Z100 X100, čára Z100 X100 do Z0 X100, čára Z0 X100 do Z0 X0",
    expectedShapes: 4,
    expectedType: "line",
    complexity: 3
  },
  {
    level: "STŘEDNÍ",
    name: "L3-4: Tři kružnice různých velikostí",
    prompt: "kružnice Z50 X50 R20, kružnice Z150 X150 R35, kružnice Z250 X100 R45",
    expectedShapes: 3,
    expectedType: "circle",
    complexity: 3
  },

  // ===== LEVEL 4: POKROČILÉ =====
  {
    level: "POKROČILÉ",
    name: "L4-1: Čára se středem - úhel 45°",
    prompt: "kružnice Z100 X100 R60, pak čára od středu úhel 45° délka 120",
    expectedShapes: 2,
    expectedType: ["circle", "line"],
    complexity: 4
  },
  {
    level: "POKROČILÉ",
    name: "L4-2: Více čar v jednom",
    prompt: "čára Z0 X0 do Z50 X50, čára Z50 X50 do Z100 X0, čára Z100 X0 do Z150 X50",
    expectedShapes: 3,
    expectedType: "line",
    complexity: 4
  },
  {
    level: "POKROČILÉ",
    name: "L4-3: Průměr místo poloměru",
    prompt: "kružnice Z100 X100 ⌀100",
    expectedShapes: 1,
    expectedType: "circle",
    complexity: 4
  },
  {
    level: "POKROČILÉ",
    name: "L4-4: Mix - kružnice, čára, body",
    prompt: "bod Z50 X50, kružnice Z100 X100 R40, čára Z150 X150 do Z200 X200",
    expectedShapes: 3,
    expectedType: ["point", "circle", "line"],
    complexity: 4
  },

  // ===== LEVEL 5: VELMI POKROČILÉ =====
  {
    level: "VELMI POKROČILÉ",
    name: "L5-1: Čára od kružnice s úhlem a délkou",
    prompt: "kružnice Z100 X100 R50, pak čára od středu úhel 30° délka 150",
    expectedShapes: 2,
    expectedType: ["circle", "line"],
    complexity: 5
  },
  {
    level: "VELMI POKROČILÉ",
    name: "L5-2: Složitý CNC syntax",
    prompt: "X80Z56R52;X50Z56AP0RP120",
    expectedShapes: 2,
    expectedType: ["circle", "line"],
    complexity: 5
  },
  {
    level: "VELMI POKROČILÉ",
    name: "L5-3: Kreis s čárou z centra - více úhlů",
    prompt: "kružnice Z100 X100 R50, čára od středu 0° 80, čára od středu 90° 80",
    expectedShapes: 3,
    expectedType: ["circle", "line", "line"],
    complexity: 5
  },
  {
    level: "VELMI POKROČILÉ",
    name: "L5-4: Komplexní mix",
    prompt: "bod Z0 X0, čára Z0 X0 do Z100 X100, kružnice Z100 X100 R40, čára od středu 45° 100",
    expectedShapes: 4,
    expectedType: ["point", "line", "circle", "line"],
    complexity: 5
  },

  // ===== LEVEL 6: EXPERT =====
  {
    level: "EXPERT",
    name: "L6-1: Dvě kružnice + čáry mezi nimi",
    prompt: "kružnice Z50 X50 R30, kružnice Z150 X150 R40, čára Z50 X50 do Z150 X150",
    expectedShapes: 3,
    expectedType: ["circle", "circle", "line"],
    complexity: 6
  },
  {
    level: "EXPERT",
    name: "L6-2: Polygon - šestiúhelník",
    prompt: "čára Z100 X0 do Z150 X50, čára Z150 X50 do Z150 X150, čára Z150 X150 do Z100 X200, čára Z100 X200 do Z50 X150, čára Z50 X150 do Z50 X50, čára Z50 X50 do Z100 X0",
    expectedShapes: 6,
    expectedType: "line",
    complexity: 6
  },
  {
    level: "EXPERT",
    name: "L6-3: Tři kružnice v řadě + čáry",
    prompt: "kružnice Z50 X100 R30, kružnice Z150 X100 R35, kružnice Z250 X100 R40, čára Z50 X100 do Z150 X100, čára Z150 X100 do Z250 X100",
    expectedShapes: 5,
    expectedType: ["circle", "circle", "circle", "line", "line"],
    complexity: 6
  },
  {
    level: "EXPERT",
    name: "L6-4: Závitový profil (teoreticky)",
    prompt: "kružnice Z100 X50 R20, kružnice Z150 X50 R20, kružnice Z200 X50 R20, čára Z100 X50 do Z200 X50",
    expectedShapes: 4,
    expectedType: ["circle", "circle", "circle", "line"],
    complexity: 6
  }
];

window.runAITest = async function(testIndex = 0) {
  if (testIndex >= window.AI_TEST_PROMPTS.length) {
    alert("✅ Všechny testy hotovy!");
    return;
  }

  const test = window.AI_TEST_PROMPTS[testIndex];
  const promptInput = document.getElementById("aiPrompt");
  const container = document.getElementById("aiChatHistory");

  if (!promptInput || !container) {
    alert("❌ AI panel nenalezen!");
    return;
  }

  // Zobraz test zprávu
  const testDiv = document.createElement("div");
  testDiv.className = "chat-msg model";
  testDiv.style.color = "#60a5fa";
  testDiv.style.fontWeight = "bold";
  testDiv.textContent = `🧪 TEST ${testIndex + 1}/${window.AI_TEST_PROMPTS.length}: ${test.name}`;
  container.appendChild(testDiv);
  container.scrollTop = container.scrollHeight;

  // Nastav prompt a chvíli čekej
  promptInput.value = test.prompt;
  await new Promise(resolve => setTimeout(resolve, 500));

  // Spusť AI
  if (window.callGemini) {
    await window.callGemini();
  }

  // Čekat na výsledek (5 sekund)
  await new Promise(resolve => setTimeout(resolve, 5000));

  // Ověř výsledky
  const shapeCount = (window.shapes || []).length;
  let testResult = `\n📊 Výsledek: ${shapeCount} tvarů`;

  if (shapeCount >= test.expectedShapes) {
    testResult += ` ✅`;
  } else {
    testResult += ` ❌ (očekáváno ${test.expectedShapes})`;
  }

  // Zobraz výsledek
  const resultDiv = document.createElement("div");
  resultDiv.className = "chat-msg model";
  resultDiv.style.color = shapeCount >= test.expectedShapes ? "#10b981" : "#ef4444";
  resultDiv.textContent = testResult;
  container.appendChild(resultDiv);
  container.scrollTop = container.scrollHeight;

  // Pokračuj další test za 3 sekundy
  await new Promise(resolve => setTimeout(resolve, 3000));
  window.runAITest(testIndex + 1);
};

window.closeAITestModal = function() {
  const modal = document.getElementById("aiTestModal");
  if (modal) {
    modal.style.display = "none";
  }
};

// Formátuj CNC příkazy přidáním mezer (např. X80Z56R52 → X80 Z56 R52)
window.formatCNCCommand = function(text) {
  if (!text) return text;
  // Přidej mezery před G, X, Z, R, D, L, A, AP, RP, CR atd.
  return text.replace(/([GXZRDALC])/g, ' $1').replace(/^\s+/, '').replace(/\s+/g, ' ');
};

// Validuj CNC příkaz - vrátí chybovou zprávu nebo null pokud je OK
window.validateCNCCommand = function(text) {
  if (!text || text.trim() === '') return 'Prázdný příkaz';

  // Odstraň mezery pro analýzu
  const clean = text.replace(/\s+/g, '').toUpperCase();

  // Kontrola G-kódů
  if (clean.match(/^G[0-3]/)) {
    // G0, G1, G2, G3 - vyžadují parametry
    if (!/[XZ]/.test(clean)) {
      return '❌ Chybí souřadnice: Přidej X nebo Z (např. G0X50Z100)';
    }
  }

  // Kontrola samostatného R (radius) - měl by být součást G-kódu nebo kruh
  if (clean.match(/^R\d/) && !clean.match(/^[GX]/)) {
    return '❌ R (radius) se musí psát s G-kódem (např. G0R50) nebo X/Z souřadnicemi';
  }

  // Kontrola R/CR v kruhu - měly by být s X a Z
  if (clean.match(/R\d/) && !clean.match(/[XZ]/)) {
    return '❌ Radius R se musí kombinovat se souřadnicemi X nebo Z';
  }

  // Kontrola polárních souřadnic
  if (clean.match(/(RP|AP)/) && !clean.match(/[LXZ]/)) {
    return '❌ Polární souřadnice (RP, AP) se musí kombinovat s L (délka) nebo X/Z';
  }

  return null; // Bez chyby
};

// Auto-formatuj a validuj po zmáčknutí ";"
window.handleSemicolonInInput = function(inputElement) {
  if (!inputElement) return;

  const fullText = inputElement.value;
  const parts = fullText.split(';');

  // Zpracuj poslední část (tu, kterou jsme právě zadali)
  const lastPart = parts[parts.length - 2] || ''; // Text před posledním ;

  if (lastPart.trim()) {
    // Validuj poslední příkaz
    const error = window.validateCNCCommand(lastPart);

    if (error) {
      // Zobraz chybu v odpovídajícím error elementu
      let errorElement = null;
      if (inputElement.id === 'quickInputDisplay') {
        errorElement = document.getElementById('quickInputError');
      } else if (inputElement.id === 'aiPrompt') {
        errorElement = document.getElementById('cncInputError');
      }

      if (errorElement) {
        errorElement.textContent = error;
        errorElement.style.display = 'block';
        setTimeout(() => {
          errorElement.style.display = 'none';
        }, 4000);
      } else {
        alert(error);
      }
    }

    // Nahraď poslední část formátovanou verzí
    const formattedPart = window.formatCNCCommand(lastPart);
    const newText = parts.slice(0, -2).join(';') +
                   (parts.slice(0, -2).length > 0 ? '; ' : '') +
                   formattedPart + '; ';

    inputElement.value = newText;
    inputElement.scrollLeft = inputElement.scrollWidth;
  }
};

// Přidej event listener pro oba input fieldy
window.setupCNCInputListeners = function() {
  // Pro quickInputDisplay (AI klávesnice)
  const quickDisplay = document.getElementById('quickInputDisplay');
  if (quickDisplay) {
    quickDisplay.addEventListener('keypress', function(e) {
      if (e.key === ';') {
        e.preventDefault();
        this.value += '; ';
        window.handleSemicolonInInput(this);
      }
    });

    // Alternativně při změně textu
    quickDisplay.addEventListener('input', function() {
      if (this.value.includes(';')) {
        window.handleSemicolonInInput(this);
      }
    });
  }

  // Pro aiPrompt (hlavní input v AI panelu)
  const aiPrompt = document.getElementById('aiPrompt');
  if (aiPrompt) {
    aiPrompt.addEventListener('keypress', function(e) {
      if (e.key === ';') {
        e.preventDefault();
        this.value += '; ';
        window.handleSemicolonInInput(this);
      }
    });
  }
};

// Inicializuj při načtení
document.addEventListener('DOMContentLoaded', function() {
  setTimeout(() => {
    window.setupCNCInputListeners();
    window.updateQueueDisplay(); // Inicializuj UI queue display

    // Přidej listener na změnu modelu
    const modelSelect = document.getElementById("aiModelSelect");
    if (modelSelect) {
      modelSelect.addEventListener("change", function() {
        // Reset timestamps aby se aplikoval nový limit hned
        window.requestTimestamps = [];
        window.updateQueueDisplay();

        // Zobraz zprávu o změně limitu
        const modelName = window.MODEL_LIMITS[this.value]?.name || "Model";
        const limit = window.MODEL_LIMITS[this.value]?.rpm || 15;
        const container = document.getElementById("aiChatHistory");
        if (container) {
          const infoDiv = document.createElement("div");
          infoDiv.className = "chat-msg model";
          infoDiv.style.color = "#90cdf4";
          infoDiv.textContent = `✅ Vybrán: ${modelName} (${limit} requestů/min)`;
          container.appendChild(infoDiv);
          container.scrollTop = container.scrollHeight;
        }
      });
    }
  }, 500);
});

window.showTestOptions = function(testIndex) {
  const test = window.AI_TEST_PROMPTS[testIndex];
  const modal = document.getElementById("aiTestModal");
  const content = document.getElementById("aiTestContent");

  if (!modal || !content) return;

  content.innerHTML = `
    <div style="background: #1a1a1a; padding: 15px; border-radius: 8px; margin-bottom: 15px; border: 1px solid #444">
      <div style="margin-bottom: 12px">
        <h3 style="color: #90cdf4; margin: 0 0 8px 0; font-size: 14px">📋 Test ${testIndex + 1}: ${test.name}</h3>
        <p style="color: #aaa; margin: 0 0 8px 0; font-size: 12px">
          <strong>Úroveň:</strong> ${test.level} |
          <strong>Složitost:</strong> ${test.complexity} |
          <strong>Očekávané tvary:</strong> ${test.expectedShapes}
        </p>
      </div>
      <div style="background: #111; padding: 10px; border-radius: 4px; border: 1px solid #333; font-family: monospace; font-size: 12px; color: #90ee90; word-wrap: break-word; max-height: 100px; overflow-y: auto">
        ${window.formatCNCCommand(test.prompt)}
      </div>
    </div>

    <div style="background: #0a3a2a; padding: 12px; border-radius: 8px; margin-bottom: 15px; border-left: 3px solid #22c55e">
      <p style="color: #90cdf4; margin: 0 0 10px 0; font-size: 13px; font-weight: bold">Vyberte co chcete dělat:</p>
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px">
        <button onclick="window.runSelectedTest(${testIndex})" style="padding: 12px; background: #22c55e; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: bold; font-size: 13px; text-align: center">
          <div style="font-size: 18px; margin-bottom: 4px">🎨</div>
          VYKRESLI NA PLÁTNO
        </button>
        <button onclick="window.showTestResponse(${testIndex})" style="padding: 12px; background: #3a7bc8; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: bold; font-size: 13px; text-align: center">
          <div style="font-size: 18px; margin-bottom: 4px">📝</div>
          ZOBRAZ ODPOVĚĎ
        </button>
      </div>
    </div>
  `;
};

window.runSelectedTest = function(testIndex) {
  const test = window.AI_TEST_PROMPTS[testIndex];
  const promptInput = document.getElementById("aiPrompt");
  if (promptInput) {
    promptInput.value = test.prompt;
    window.closeAITestModal();
    if (window.callGemini) window.callGemini();
  }
};

// ===== Spustit všechny testy v queue =====
window.runAllTests = function() {
  const modal = document.getElementById("aiTestModal");
  const content = document.getElementById("aiTestContent");

  if (!modal || !content) return;

  // UI - zobraz progress
  content.innerHTML = `
    <div style="background: #0a2a1a; padding: 15px; border-radius: 8px; border-left: 3px solid #22c55e">
      <h3 style="color: #22c55e; margin: 0 0 10px 0">⚙️ Zařazuji testy...</h3>
      <p style="color: #888; font-size: 12px; margin: 0">Všechny testy se postupně zařadí do queue a vykonají s ohledem na rate limit.</p>
      <div id="allTestsProgress" style="margin-top: 12px; font-size: 11px; color: #aaa"></div>
    </div>
  `;

  const progressDiv = document.getElementById("allTestsProgress");

  // Zařaď všechny testy do queue
  let enqueued = 0;
  window.AI_TEST_PROMPTS.forEach((test, idx) => {
    setTimeout(() => {
      const promptInput = document.getElementById("aiPrompt");
      if (promptInput) {
        promptInput.value = test.prompt;
        if (window.callGemini) {
          window.callGemini();
          enqueued++;

          if (progressDiv) {
            progressDiv.innerHTML = `
              ✅ Zařazeno: <strong>${enqueued}/${window.AI_TEST_PROMPTS.length}</strong> testů<br>
              📊 Queue: ${window.aiRequestQueue ? window.aiRequestQueue.length : 0} čekajících requestů
            `;
          }
        }
      }
    }, idx * 100); // Rozestup 100ms mezi zařazením
  });

  // Zavři modal po chvíli
  setTimeout(() => {
    if (progressDiv) {
      progressDiv.innerHTML = `
        <div style="color: #22c55e">✅ Všechny testy zařazeny do queue!</div>
        <div style="color: #888; margin-top: 8px; font-size: 10px">Kontroluj console a UI status pro průběh...</div>
      `;
    }
  }, window.AI_TEST_PROMPTS.length * 100 + 500);
};

window.showTestResponse = function(testIndex) {
  const test = window.AI_TEST_PROMPTS[testIndex];
  const modal = document.getElementById("aiTestModal");
  const content = document.getElementById("aiTestContent");

  if (!modal || !content) return;

  content.innerHTML = `
    <div style="background: #0a1a3a; padding: 15px; border-radius: 8px; margin-bottom: 15px; border: 1px solid #3a7bc8">
      <h3 style="color: #90cdf4; margin: 0 0 10px 0; font-size: 14px">✨ Spouštím AI...</h3>
      <p style="color: #aaa; font-size: 12px; margin: 0">Test: ${test.name} (${test.level})</p>
    </div>
  `;

  // Spusť AI a pak zobraz výsledek
  const promptInput = document.getElementById("aiPrompt");
  if (promptInput) {
    promptInput.value = test.prompt;

    // Zavolej Gemini a pak zobraz v výsledku
    if (window.callGemini) {
      window.callGemini().then(() => {
        // Chvíli počkej na zpracování
        setTimeout(() => {
          const chatHistory = document.getElementById("aiChatHistory");
          let response = "❌ Odpověď nebyla obdržena";

          if (chatHistory) {
            // Najdi poslední zprávu od AI (chat-msg model)
            const messages = chatHistory.querySelectorAll(".chat-msg.model");
            if (messages.length > 0) {
              const lastMessage = messages[messages.length - 1];
              response = lastMessage.innerText || lastMessage.textContent;
            }
          }

          content.innerHTML = `
            <div style="background: #0a2a1a; padding: 15px; border-radius: 8px; margin-bottom: 15px; border: 2px solid #22c55e">
              <h3 style="color: #22c55e; margin: 0 0 10px 0; font-size: 14px">✅ Odpověď z AI:</h3>
              <div style="background: #111; padding: 12px; border-radius: 4px; border: 1px solid #333; font-family: monospace; font-size: 11px; color: #90ee90; word-wrap: break-word; max-height: 300px; overflow-y: auto; white-space: pre-wrap">
                ${response}
              </div>
            </div>

            <div style="background: #1a1a1a; padding: 15px; border-radius: 8px; margin-bottom: 15px">
              <h3 style="color: #90cdf4; margin: 0 0 10px 0; font-size: 14px">📊 Detaily testu:</h3>
              <div style="font-size: 12px; color: #aaa; line-height: 1.6">
                <div><strong>Prompt:</strong> <code style="color: #90ee90">${window.formatCNCCommand(test.prompt)}</code></div>
                <div style="margin-top: 8px"><strong>Očekávané tvary:</strong> ${test.expectedShapes}</div>
                <div><strong>Typ:</strong> ${Array.isArray(test.expectedType) ? test.expectedType.join(', ') : test.expectedType}</div>
                <div><strong>Složitost:</strong> ${test.complexity}</div>
              </div>
            </div>
          `;
        }, 500);
      }).catch(() => {
        content.innerHTML = `
          <div style="background: #3a1a1a; padding: 15px; border-radius: 8px; border: 2px solid #ff6b6b; color: #ff6b6b">
            ❌ Chyba při volání AI. Zkontroluj API klíč a připojení.
          </div>
        `;
      });
    }
  }
};

window.showAITestPanel = function() {
  const modal = document.getElementById("aiTestModal");
  if (!modal) return;

  // Seskupi testy podle levelu
  const grouped = {};
  window.AI_TEST_PROMPTS.forEach((t, i) => {
    if (!grouped[t.level]) grouped[t.level] = [];
    grouped[t.level].push({ ...t, index: i + 1, actualIndex: i });
  });

  let html = `
    <div style="margin-bottom: 15px; padding: 12px; background: #0a2a1a; border-radius: 6px; border-left: 3px solid #22c55e">
      <div style="display: flex; gap: 10px; align-items: center; justify-content: space-between; margin-bottom: 10px;">
        <p style="color: #90cdf4; margin: 0; font-size: 12px">
          Celkem: <strong>${window.AI_TEST_PROMPTS.length}</strong> testů
        </p>
        <button onclick="window.runAllTests()" style="
          padding: 6px 12px;
          background: linear-gradient(135deg, #c084fc 0%, #ec4899 100%);
          border: none;
          border-radius: 4px;
          color: white;
          cursor: pointer;
          font-weight: bold;
          font-size: 11px;
          transition: all 0.2s
        " onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'">
          ▶️ VŠECHNY TESTY
        </button>
      </div>
      <p style="color: #888; margin: 0; font-size: 11px">
        Klikni na test pro jednotlivé možnosti, nebo spusť všechny najednou
      </p>
    </div>
  `;

  // Zobraz testy seřazené podle levelu
  Object.keys(grouped).forEach(level => {
    html += `<h3 style="color: #6ab0ff; margin: 12px 0 8px 0; font-size: 13px; border-bottom: 1px solid #444; padding-bottom: 6px">━ ${level} ━</h3>`;
    html += `<div style="display: grid; grid-template-columns: 1fr; gap: 6px; margin-bottom: 12px">`;

    grouped[level].forEach(t => {
      html += `
        <button onclick="window.showTestOptions(${t.actualIndex})" style="
          padding: 10px 12px;
          background: #1a1a1a;
          border: 1px solid #333;
          border-radius: 6px;
          color: #e0e0e0;
          cursor: pointer;
          text-align: left;
          transition: all 0.2s;
          font-size: 12px
        " onmouseover="this.style.borderColor='#6ab0ff'; this.style.background='#222'" onmouseout="this.style.borderColor='#333'; this.style.background='#1a1a1a'">
          <div style="font-weight: bold; color: #6ab0ff">${t.index}. ${t.name}</div>
          <div style="font-size: 11px; color: #888; margin-top: 4px">
            Prompt: "${window.formatCNCCommand(t.prompt).substring(0, 40)}${window.formatCNCCommand(t.prompt).length > 40 ? '...' : ''}" | Tvary: ${t.expectedShapes}
          </div>
        </button>
      `;
    });

    html += `</div>`;
  });

  document.getElementById("aiTestContent").innerHTML = html;
  modal.style.display = "flex";
};

// ===== EXPORT =====
if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    callGemini,
    toggleAiPanel,
    clearChat,
  };
}

