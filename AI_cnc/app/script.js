// Tab switching
function switchTab(tabName) {
    const tabs = document.querySelectorAll('.tab-content');
    tabs.forEach(tab => tab.classList.remove('active'));

    const btns = document.querySelectorAll('.tab-btn');
    btns.forEach(btn => btn.classList.remove('active'));

    document.getElementById(tabName).classList.add('active');
    event.target.classList.add('active');
}

// G-Code Management
function saveGCode() {
    const gcode = document.getElementById('gcode').value;
    localStorage.setItem('cnc_gcode', gcode);
    showStatus('✅ G-kód uložen!', 'success');
}

function loadGCode() {
    const saved = localStorage.getItem('cnc_gcode');
    if (saved) {
        document.getElementById('gcode').value = saved;
    }
}

function clearGCode() {
    if (confirm('Opravdu chceš vymazat G-kód?')) {
        document.getElementById('gcode').value = '';
        localStorage.removeItem('cnc_gcode');
        showStatus('✅ G-kód vymazán', 'success');
    }
}

function exportGCode() {
    const gcode = document.getElementById('gcode').value;
    if (!gcode.trim()) {
        showStatus('❌ G-kód je prázdný!', 'error');
        return;
    }
    const blob = new Blob([gcode], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'program.nc';
    a.click();
    URL.revokeObjectURL(url);
    showStatus('✅ G-kód stažen!', 'success');
}

// Calculator Functions
function calculateRPM() {
    const diameter = parseFloat(document.getElementById('toolDiameter').value);
    const speed = parseFloat(document.getElementById('cutSpeed').value);

    if (!diameter || !speed || diameter <= 0 || speed <= 0) {
        showStatus('❌ Vyplň všechna pole korektně!', 'error');
        return;
    }

    const rpm = (speed * 1000) / (Math.PI * diameter);
    const result = document.getElementById('rpmResult');
    result.innerHTML = `<strong>RPM = ${rpm.toFixed(0)}</strong> otáček za minutu`;
    result.style.display = 'block';
    showStatus('✅ Vypočítáno!', 'success');
}

function calculateFeed() {
    const rpm = parseFloat(document.getElementById('rpm').value);
    const fz = parseFloat(document.getElementById('feedPerTooth').value);
    const teeth = parseFloat(document.getElementById('teeth').value);

    if (!rpm || !fz || !teeth || rpm <= 0 || fz <= 0 || teeth <= 0) {
        showStatus('❌ Vyplň všechna pole korektně!', 'error');
        return;
    }

    const feed = rpm * fz * teeth;
    const result = document.getElementById('feedResult');
    result.innerHTML = `<strong>Posuvová rychlost = ${feed.toFixed(1)}</strong> mm/min`;
    result.style.display = 'block';
    showStatus('✅ Vypočítáno!', 'success');
}

// Settings
function saveSettings() {
    const settings = {
        maxRpm: document.getElementById('maxRpm').value,
        maxFeed: document.getElementById('maxFeed').value,
        workX: document.getElementById('workX').value,
        workY: document.getElementById('workY').value,
        workZ: document.getElementById('workZ').value
    };
    localStorage.setItem('cnc_settings', JSON.stringify(settings));
    showStatus('✅ Nastavení uloženo!', 'success');
}

function loadSettings() {
    const saved = localStorage.getItem('cnc_settings');
    if (saved) {
        const settings = JSON.parse(saved);
        document.getElementById('maxRpm').value = settings.maxRpm;
        document.getElementById('maxFeed').value = settings.maxFeed;
        document.getElementById('workX').value = settings.workX;
        document.getElementById('workY').value = settings.workY;
        document.getElementById('workZ').value = settings.workZ;
    }
}

function resetSettings() {
    if (confirm('Obnovit výchozí nastavení?')) {
        localStorage.removeItem('cnc_settings');
        location.reload();
    }
}

function saveMachine() {
    const machine = {
        type: document.getElementById('machineType').value,
        control: document.getElementById('controlSystem').value
    };
    localStorage.setItem('cnc_machine', JSON.stringify(machine));
    showStatus('✅ Nastavení stroje uloženo!', 'success');
}

function loadMachine() {
    const saved = localStorage.getItem('cnc_machine');
    if (saved) {
        const machine = JSON.parse(saved);
        document.getElementById('machineType').value = machine.type;
        document.getElementById('controlSystem').value = machine.control;
    }
}

// Helper functions
function showStatus(message, type = 'info') {
    const status = document.getElementById('status');
    status.className = `info-box ${type}`;
    status.textContent = message;
    status.style.display = 'block';
    setTimeout(() => {
        status.style.display = 'none';
    }, 3000);
}

function showChatStatus(message, type = 'info') {
    const status = document.getElementById('chatStatus');
    if (!status) return;
    status.className = `info-box ${type}`;
    status.textContent = message;
    status.style.display = 'block';
    setTimeout(() => {
        status.style.display = 'none';
    }, 3000);
}

// AI Chat Functions
let chatHistory = [];

function loadApiKey() {
    const saved = localStorage.getItem('cnc_api_key');
    if (saved) {
        document.getElementById('apiKey').value = saved;
    }
}

function saveApiKey() {
    const key = document.getElementById('apiKey').value.trim();
    if (!key) {
        showChatStatus('❌ Vyplň API klíč!', 'error');
        return;
    }
    localStorage.setItem('cnc_api_key', key);
    showChatStatus('✅ API klíč uložen!', 'success');
}

function loadChatHistory() {
    const saved = localStorage.getItem('cnc_chat_history');
    if (saved) {
        try {
            chatHistory = JSON.parse(saved);
            renderChat();
        } catch (e) {
            chatHistory = [];
        }
    }
}

function saveChatHistory() {
    localStorage.setItem('cnc_chat_history', JSON.stringify(chatHistory));
}

function renderChat() {
    const container = document.getElementById('chatMessages');
    if (!container) return;

    if (chatHistory.length === 0) {
        container.innerHTML = '<div style="color: #64748b; font-size: 13px; text-align: center; padding: 20px;">Zde se budou zobrazovat zprávy. Zatím žádná konverzace.</div>';
        return;
    }

    container.innerHTML = chatHistory.map((msg, idx) => `
        <div style="margin-bottom: 15px; padding: 10px; border-radius: 6px; background: ${msg.role === 'user' ? '#dbeafe' : '#e0e7ff'}; ${msg.role === 'user' ? 'margin-left: 40px; border-left: 3px solid #3b82f6;' : 'margin-right: 40px; border-left: 3px solid #667eea;'}">
            <div style="font-weight: bold; font-size: 12px; color: #475569; margin-bottom: 5px;">
                ${msg.role === 'user' ? '👤 Ty' : '🤖 AI'}
            </div>
            <div style="font-size: 14px; color: #1e293b; white-space: pre-wrap; word-break: break-word;">
                ${msg.role === 'assistant' ? formatAIResponse(msg.content) : msg.content}
            </div>
        </div>
    `).join('');

    container.scrollTop = container.scrollHeight;
}

function formatAIResponse(text) {
    // Převeď jednoduchý markdown na HTML
    let html = text
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/`(.*?)`/g, '<code style="background: #f1f5f9; padding: 2px 6px; border-radius: 3px; font-family: monospace;">$1</code>');
    return html;
}

async function sendChatMessage() {
    const input = document.getElementById('chatInput');
    const apiKey = localStorage.getItem('cnc_api_key');

    if (!apiKey) {
        showChatStatus('❌ Nejdříve vložte API klíč!', 'error');
        return;
    }

    const message = input.value.trim();
    if (!message) return;

    // Přidej uživatelskou zprávu
    chatHistory.push({ role: 'user', content: message });
    input.value = '';
    renderChat();
    showChatStatus('⏳ AI zpracovává...', 'info');

    try {
        const response = await callGeminiAPI(message, apiKey);
        chatHistory.push({ role: 'assistant', content: response });
        saveChatHistory();
        renderChat();
        showChatStatus('✅ Odpověď přijata!', 'success');
    } catch (error) {
        showChatStatus(`❌ Chyba: ${error.message}`, 'error');
    }
}

async function analyzeGCodeAI() {
    const gcode = document.getElementById('gcode').value;
    const apiKey = localStorage.getItem('cnc_api_key');

    if (!gcode.trim()) {
        showChatStatus('❌ Vložte G-kód k analýze!', 'error');
        return;
    }

    if (!apiKey) {
        showChatStatus('❌ Nejdříve vložte API klíč!', 'error');
        return;
    }

    const machine = JSON.parse(localStorage.getItem('cnc_machine') || '{}');
    const prompt = `Analyzuj tento G-kód pro ${machine.type || 'neznámý stroj'} (${machine.control || 'neznámý systém'}). Zaměř se na:
1. Bezpečnost (bezpečné posuvy, otáčky)
2. Optimalizaci (je možné zrychlit?)
3. Chyby nebo anomálie
4. Doporučení na zlepšení

G-kód:
\`\`\`
${gcode}
\`\`\``;

    document.getElementById('chatInput').value = prompt;
    sendChatMessage();
}

function clearChat() {
    if (confirm('Opravdu chceš vymazat historii chatu?')) {
        chatHistory = [];
        localStorage.removeItem('cnc_chat_history');
        renderChat();
        showChatStatus('✅ Chat vymazán!', 'success');
    }
}

async function callGeminiAPI(message, apiKey) {
    const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=' + apiKey, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            contents: [{
                role: 'user',
                parts: [{ text: message }]
            }],
            systemInstruction: 'Jsi expert na CNC programování. Odpovídej česky, buď technicky přesný a prakticky orientovaný.'
        })
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'API chyba');
    }

    const data = await response.json();
    return data.candidates[0].content.parts[0].text;
}

function loadData() {
    loadGCode();
    loadSettings();
    loadMachine();
    loadApiKey();
    loadChatHistory();
    loadMathHistory();
}

// Initialize on page load
window.addEventListener('load', loadData);

// ============ TOOL OFFSET CALCULATOR ============
function updateToolCalc() {
    const display = parseFloat(document.getElementById('displayValue').value) || 0;
    const target = parseFloat(document.getElementById('targetValue').value) || 0;
    const currentL = parseFloat(document.getElementById('currentL').value) || 0;

    if (!document.getElementById('displayValue').value && !document.getElementById('targetValue').value && !document.getElementById('currentL').value) {
        document.getElementById('toolResult').style.display = 'none';
        return;
    }

    const diff = target - display;
    const newValue = currentL - diff;

    const result = document.getElementById('toolResult');
    result.innerHTML = `<strong>Nová L-hodnota:</strong> <span style="font-size: 20px; color: #10b981;">${newValue.toFixed(3)}</span><br/>Rozdíl: ${diff > 0 ? '+' : ''}${diff.toFixed(3)}`;
    result.style.display = 'block';
}

function copyToolValue() {
    const display = parseFloat(document.getElementById('displayValue').value) || 0;
    const target = parseFloat(document.getElementById('targetValue').value) || 0;
    const currentL = parseFloat(document.getElementById('currentL').value) || 0;

    if (!document.getElementById('currentL').value) {
        showStatus('❌ Vyplň všechna pole!', 'error');
        return;
    }

    const diff = target - display;
    const newValue = currentL - diff;

    navigator.clipboard.writeText(newValue.toFixed(3));
    showStatus(`✅ Zkopírováno: ${newValue.toFixed(3)}`, 'success');
}

// ============ MATH CALCULATOR ============
let mathHistory = [];

function loadMathHistory() {
    const saved = localStorage.getItem('cnc_math_history');
    if (saved) {
        try {
            mathHistory = JSON.parse(saved);
            renderMathHistory();
        } catch (e) {
            mathHistory = [];
        }
    }
}

function saveMathHistory() {
    localStorage.setItem('cnc_math_history', JSON.stringify(mathHistory));
    renderMathHistory();
}

function renderMathHistory() {
    const historyList = document.getElementById('mathHistoryList');
    if (!historyList) return;

    if (mathHistory.length === 0) {
        historyList.innerHTML = '<div style="color: #94a3b8; font-size: 13px; text-align: center; padding: 10px;">Zatím žádný výpočet</div>';
        return;
    }

    historyList.innerHTML = mathHistory.map((item, idx) => `
        <div style="background: #f1f5f9; padding: 8px; border-radius: 4px; margin-bottom: 5px; display: flex; justify-content: space-between; align-items: center;">
            <span style="font-size: 12px;">
                <strong>${item.expression}</strong> = <span style="color: #10b981;">${item.result}</span>
            </span>
            <button onclick="deleteMathHistoryItem(${idx})" style="padding: 2px 6px; font-size: 11px; background: #ef4444; color: white; border: none; border-radius: 3px; cursor: pointer;">✕</button>
        </div>
    `).join('');
}

function deleteMathHistoryItem(idx) {
    mathHistory.splice(idx, 1);
    saveMathHistory();
}

function appendMathChar(char) {
    const expr = document.getElementById('mathExpression');
    expr.value += char;
}

function deleteMathChar() {
    const expr = document.getElementById('mathExpression');
    expr.value = expr.value.slice(0, -1);
}

function calculateMath() {
    const expr = document.getElementById('mathExpression').value.trim();
    if (!expr) {
        showStatus('❌ Vyplň výraz!', 'error');
        return;
    }

    try {
        // Bezpečné nahrazení symbolů
        let evalString = expr
            .replace(/×/g, '*')
            .replace(/÷/g, '/')
            .replace(/π/g, Math.PI.toString())
            .replace(/sqrt\(/g, 'Math.sqrt(')
            .replace(/sin\(/g, 'Math.sin(')
            .replace(/cos\(/g, 'Math.cos(')
            .replace(/tan\(/g, 'Math.tan(')
            .replace(/pow\(/g, 'Math.pow(');

        // Evaluace
        const result = Function('"use strict"; return (' + evalString + ')')();

        if (!isFinite(result) || isNaN(result)) {
            throw new Error('Neplatný výsledek');
        }

        const formattedResult = Number(result.toFixed(6)).toString();

        // Přidej do historie
        mathHistory.unshift({
            expression: expr,
            result: formattedResult
        });
        saveMathHistory();

        // Zobraz výsledek
        const resultEl = document.getElementById('mathResult');
        resultEl.textContent = formattedResult;
        resultEl.style.display = 'block';

        document.getElementById('mathExpression').value = formattedResult;
        showStatus('✅ Vypočítáno!', 'success');
    } catch (e) {
        showStatus(`❌ Chyba: ${e.message}`, 'error');
        document.getElementById('mathResult').style.display = 'none';
    }
}

function clearMath() {
    document.getElementById('mathExpression').value = '';
    document.getElementById('mathResult').style.display = 'none';
}
