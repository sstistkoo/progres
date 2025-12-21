/**
 * AI.JS - Google Gemini AI integration
 * - Chat interface and prompts
 * - AI memory system
 * - API integration
 * - Usage tracking
 */

// Globální proměnné jsou inicializovány v globals.js

// ===== AI SELECT TOGGLE =====
window.toggleAiSelect = function () {
  window.aiSelectMode = !window.aiSelectMode;
  const btn = document.getElementById("btnAiSelect");
  if (btn) {
    if (window.aiSelectMode) {
      btn.style.background = "#3a7bc8";
      if (window.setMode) window.setMode("select");
    } else {
      btn.style.background = "#333";
      if (window.clearMode) window.clearMode();
    }
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
      const startTime = Date.now();
      const result = await apiCall();
      const latency = Date.now() - startTime;
      console.log(`✅ API call successful in ${latency}ms`);
      return result;
    } catch (err) {
      const isRateLimit =
        err.message?.includes("429") ||
        err.message?.includes("quota") ||
        err.message?.includes("RESOURCE_EXHAUSTED");

      if (isRateLimit && attempt < maxRetries - 1) {
        const delay = Math.pow(2, attempt) * 1000; // 1s, 2s, 4s
        console.log(`⏳ Rate limit hit, retrying in ${delay / 1000}s...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
        continue;
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
    console.log("🎓 AI learned from success:", { prompt: prompt.substring(0, 30), shapes: shapes.length });
  } catch (e) {
    console.warn("Could not save AI memory:", e);
  }
};

// ===== MAIN AI CALL =====
window.callGemini = async function () {
  const promptInput = document.getElementById("aiPrompt");
  const container = document.getElementById("aiChatHistory");
  if (!promptInput || !container) return;

  const prompt = promptInput.value.trim();
  if (!prompt) {
    alert("Zadej prosím příkaz pro AI!");
    return;
  }

  if (window.processingAI) {
    alert("AI zpracovává předchozí příkaz...");
    return;
  }

  window.processingAI = true;
  promptInput.disabled = true;

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
    const modeExplanation =
      xMeasureMode === "diameter"
        ? "X values in context are shown as DIAMETER (user sees X=100 for ⌀100). Create shapes with these exact values - conversion is automatic."
        : "X values in context are shown as RADIUS (user sees X=50 for R50). Create shapes with these exact values.";

    const learningContext = window.getAIMemoryContext ? window.getAIMemoryContext() : "";

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
- XvalZval = position (X=diameter/radius, Z=length)
- Rval = radius for circle
- APval = angle in polar (0°=right, 90°=up, 180°=left, 270°=down)
- RPval = polar radius/length (distance from start point)

Examples:
"X80Z56R52" → Circle at (Z=56,X=80) with radius 52
"X50Z56AP0RP120" → Line from (Z=56,X=50) at angle 0° length 120mm
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
    const response = await window.retryWithBackoff(async () => {
      const resp = await fetch(
        "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=" + apiKey,
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
    }, 3);

    const apiTime = performance.now() - startTime;
    console.log(`⏱️ API response in ${(apiTime / 1000).toFixed(1)}s`);

    if (container.contains(loadingDiv)) container.removeChild(loadingDiv);

    // Parse response
    let aiResponseText = response.candidates?.[0]?.content?.parts?.[0]?.text || "";
    if (!aiResponseText) {
      throw new Error("AI nevrátila text");
    }

    console.log("AI Response (raw):", aiResponseText.substring(0, 200));

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
      console.error("JSON Parse Error:", e);
      throw new Error("Nevalidní JSON odpověď");
    }

    const replyText = result.response_text || "Hotovo.";
    const newShapes = result.shapes || [];

    console.log("Parsed result:", { replyText, shapeCount: newShapes.length });

    // Add shapes to canvas
    if (Array.isArray(newShapes) && newShapes.length > 0) {
      const convertY = (y) => (xMeasureMode === "diameter" ? y / 2 : y);

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
              y1: convertY(s.y1),
              x2: s.x2,
              y2: convertY(s.y2),
            });
          } else if (
            s.type === "circle" &&
            typeof s.cx === "number" &&
            typeof s.cy === "number" &&
            typeof s.r === "number" &&
            s.r > 0
          ) {
            window.shapes.push({
              type: "circle",
              cx: s.cx,
              cy: convertY(s.cy),
              r: s.r,
            });
          } else if (
            s.type === "point" &&
            typeof s.x === "number" &&
            typeof s.y === "number"
          ) {
            window.points.push({ x: s.x, y: convertY(s.y) });
          }
        } catch (e) {
          console.error("Error adding shape:", e);
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

  } catch (err) {
    console.error("callGemini error:", err);

    if (container.contains(loadingDiv)) container.removeChild(loadingDiv);

    const errorDiv = document.createElement("div");
    errorDiv.className = "chat-msg model";
    errorDiv.style.color = "#ff6b6b";

    let errorMsg = "❌ " + (err.message || "Neznámá chyba");
    if (err.message.includes("API klíč")) {
      errorMsg += "\n\n💡 Otevři ⚙️ Nastavení a vlož API klíč.";
    }

    errorDiv.textContent = errorMsg;
    container.appendChild(errorDiv);
    container.scrollTop = container.scrollHeight;

    alert(errorMsg);
  } finally {
    window.processingAI = false;
    promptInput.disabled = false;
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
      infoEl.textContent = `Vybráno: ${selectedCount} objektů`;
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

// ===== HELPER: HTML escaping =====
function escapeHtml(text) {
  const map = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  };
  return String(text || "").replace(/[&<>"']/g, (m) => map[m]);
}

// ===== HELPER: Build drawing context =====
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

// ===== EXPORT =====
if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    callGemini,
    toggleAiPanel,
    clearChat,
  };
}

