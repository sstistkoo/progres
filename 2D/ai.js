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
  const context = window.getAIMemoryContext ? window.getAIMemoryContext() : { topCommands: [], successfulPatterns: [] };
  let msg = "🧠 AI PAMĚŤ:\n\n";
  msg += "📊 Nejčastější příkazy:\n" + (context.topCommands.length > 0
    ? context.topCommands.map((c) => `  • "${c.command}" (${c.count}×)`).join("\n")
    : "  Žádné zatím");
  msg += "\n\n✅ Úspěšné vzory:\n" + (context.successfulPatterns.length > 0
    ? context.successfulPatterns.map((p) => `  • ${p.input} → ${p.shapeCount} tvarů`).join("\n")
    : "  Žádné zatím");
  alert(msg);
};

window.showAIMetrics = function () {
  const metrics = window.aiMetrics || { totalRequests: 0, successfulRequests: 0, failedRequests: 0, avgLatency: 0 };
  let msg = "📊 AI STATISTIKY:\n\n";
  msg += "Celkem požadavků: " + metrics.totalRequests + "\n";
  msg += "Úspěšných: " + metrics.successfulRequests + "\n";
  msg += "Selhalo: " + metrics.failedRequests + "\n";
  msg += "Průměrná latence: " + metrics.avgLatency.toFixed(0) + "ms";
  alert(msg);
};

// ===== IMAGE HANDLING =====
window.clearImage = function () {
  const input = document.getElementById("aiImageInput");
  if (input) {
    input.value = "";
  }
  const preview = document.getElementById("aiImagePreview");
  if (preview) {
    preview.style.display = "none";
    preview.src = "";
  }
};

window.clearChat = function () {
  const chatWindow = document.getElementById("chatWindow");
  if (chatWindow) {
    chatWindow.innerHTML = "";
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

window.callGemini = async function () {
  const promptInput = document.getElementById("aiPrompt");
  if (!promptInput) {
    return;
  }

  const userPrompt = promptInput.value.trim();
  if (!userPrompt) {
    alert("Zadej prosím příkaz pro AI!");
    return;
  }

  if (window.processingAI) {
    alert("AI zpracovává předchozí příkaz. Čekej prosím...");
    return;
  }
  window.processingAI = true;
  promptInput.disabled = true;
  const btn = document.getElementById("btnSendAi");
  if (btn) {
    btn.disabled = true;
    btn.textContent = "⏳ Zpracovávám...";
  }

  const chatWindow = document.getElementById("chatWindow");
  if (chatWindow) {
    const userMsg = document.createElement("div");
    userMsg.className = "message user-message";
    userMsg.innerHTML = `<strong>Ty:</strong> ${escapeHtml(userPrompt)}`;
    chatWindow.appendChild(userMsg);
    chatWindow.scrollTop = chatWindow.scrollHeight;
  }

  const apiKey = window.getCurrentApiKey ? window.getCurrentApiKey() : null;

  if (!apiKey) {
    const errorMsg = "❌ Chyba: Nemáte nastaveného API klíč!";
    if (chatWindow) {
      const msg = document.createElement("div");
      msg.className = "message ai-message error";
      msg.innerHTML = `<strong>Gemini:</strong> ${errorMsg}`;
      chatWindow.appendChild(msg);
      chatWindow.scrollTop = chatWindow.scrollHeight;
    }

    processingAI = false;
    promptInput.disabled = false;
    if (btn) {
      btn.disabled = false;
      btn.textContent = "Poslat AI ✨";
    }
    promptInput.value = "";
    alert("❌ Připrav si API klíč Gemini!");
    return;
  }

  try {
    const contextInfo = window.buildDrawingContext ? window.buildDrawingContext() : "";

    const systemPrompt = `CAD Assistant for CNC Lathe/Mill operations (Czech language).

COORDINATE SYSTEM:
Z-axis (horizontal/→) = JSON 'x' property
X-axis (vertical/↑) = JSON 'y' property
Origin: (0,0) center
Report coords as: "Z=[x] X=[y]"

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

IMPORTANT FOR POLAR LINES:
When user says "úsečka OD STŘEDU kružnice" or "line FROM CENTER of circle":
- Start point (x1,y1) = center of that circle (cx,cy)
- End point: calculate using angle and length FROM that center
- CALCULATION:
  * x2 = x1 + length*cos(angle_degrees * π/180)
  * y2 = y1 + length*sin(angle_degrees * π/180)

CRITICAL RULES:
1. Parse CNC syntax: AP=angle, RP=polar_length
2. For polar coords: calculate endpoint using angle and length
3. NEVER hallucinate coords - use provided data or ask
4. Support Czech terms: úsečka=line, kružnice=circle, střed=center

RESPONSE FORMAT (strict JSON):
{"response_text":"Brief Czech confirmation","shapes":[...]}

SHAPE TYPES:
Line: {"type":"line","x1":z1,"y1":x1,"x2":z2,"y2":x2}
Circle: {"type":"circle","cx":z,"cy":x,"r":radius}
Point: {"type":"point","x":z,"y":x}`;

    const fullPrompt = `${systemPrompt}

Aktuální kreslení:
${contextInfo}

Uživatel: ${userPrompt}

Odpověz česky, stručně a prakticky. Pokud mám nakreslit něco - vrať JSON s shapes.`;

    const response = await window.retryWithBackoff(async () => {
      const resp = await fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=" + apiKey, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: fullPrompt }] }],
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 1024,
          },
        }),
      });

      if (!resp.ok) {
        const error = await resp.json().catch(() => ({}));
        throw new Error(
          error.error?.message || `HTTP ${resp.status}: ${resp.statusText}`
        );
      }

      return await resp.json();
    }, 3);

    let aiResponse = "";

    if (response.candidates && response.candidates[0]?.content?.parts?.[0]?.text) {
      aiResponse = response.candidates[0].content.parts[0].text;
    } else {
      aiResponse = "❌ Neplatná odpověď od API";
    }

    if (chatWindow) {
      const msg = document.createElement("div");
      msg.className = "message ai-message";
      msg.innerHTML = `<strong>Gemini:</strong> <p>${escapeHtml(aiResponse)
        .replace(/\n/g, "<br>")
        .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
        .replace(/_(.*?)_/g, "<em>$1</em>")}</p>`;
      chatWindow.appendChild(msg);
      chatWindow.scrollTop = chatWindow.scrollHeight;
    }

    if (window.recordCommand) {
      window.recordCommand(userPrompt, aiResponse);
    }

    window.chatHistory.push({
      user: userPrompt,
      ai: aiResponse,
      timestamp: new Date().toISOString(),
    });

    // Uložit chat historii do localStorage
    if (window.saveChatHistory) {
      window.saveChatHistory();
    }

    promptInput.value = "";

    if (window.updateAiStats) {
      window.updateAiStats();
    }
  } catch (error) {
    let errorMessage = "❌ Chyba komunikace s API";
    let shouldRetry = false;

    if (error.message.includes("429")) {
      errorMessage =
        "⚠️ Příliš mnoho požadavků. Přepínám na další API klíč...";

      // Automatické přepnutí na další klíč
      if (window.switchToNextApiKey && window.switchToNextApiKey()) {
        errorMessage += " ✅ Klíč přepnut. Znovu odesílám zprávu...";
        shouldRetry = true;
      } else {
        errorMessage += " ⚠️ Další klíč není dostupný. Čekej prosím 60 sekund...";
      }
    } else if (error.message.includes("401")) {
      errorMessage = "❌ Neplatný API klíč!";
    } else if (error.message.includes("403")) {
      errorMessage = "❌ API klíč nemá dovolené práva!";
    } else {
      errorMessage = `❌ Chyba: ${error.message}`;
    }

    if (chatWindow) {
      const msg = document.createElement("div");
      msg.className = "message ai-message error";
      msg.innerHTML = `<strong>Gemini:</strong> ${errorMessage}`;
      chatWindow.appendChild(msg);
      chatWindow.scrollTop = chatWindow.scrollHeight;
    }

    if (!shouldRetry) {
      alert(errorMessage);
    }

    window.processingAI = false;
    promptInput.disabled = false;
    if (btn) {
      btn.disabled = false;
      btn.textContent = "Poslat AI ✨";
    }

    // Pokud byl klíč přepnut, znovu odešli stejnou zprávu
    if (shouldRetry) {
      promptInput.value = userPrompt;
      setTimeout(() => {
        if (window.callGemini) {
          window.callGemini();
        }
      }, 1500); // Čekej 1.5 sekundy před opakováním
    }
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
  const aiPrompt = document.getElementById("aiPrompt");
  if (aiPrompt) {
    aiPrompt.addEventListener("keydown", function (e) {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        if (window.callGemini) window.callGemini();
      }
    });
  }

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

// ===== EXPORT =====
if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    callGemini,
    toggleAiPanel,
    clearChat,
  };
}

