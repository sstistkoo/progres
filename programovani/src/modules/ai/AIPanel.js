/**
 * AI Panel Module
 * Provides AI assistant interface with chat, templates, and quick actions
 */

import { eventBus } from '@core/events.js';
import { state } from '@core/state.js';
import { Modal } from '@ui/components/Modal.js';

export class AIPanel {
  constructor() {
    this.modal = null;
    this.chatHistory = [];
    this.setupEventListeners();
  }

  setupEventListeners() {
    eventBus.on('ai:show', () => this.show());
    eventBus.on('ai:hide', () => this.hide());
    eventBus.on('ai:sendMessage', (data) => this.sendMessage(data.message));
  }

  show() {
    if (!this.modal) {
      this.createModal();
    }
    this.modal.open();
  }

  hide() {
    if (this.modal) {
      this.modal.close();
    }
  }

  createModal() {
    const content = this.createAIInterface();

    this.modal = new Modal({
      title: '🤖 AI Asistent',
      content,
      className: 'ai-modal',
      size: 'large',
      onClose: () => this.hide()
    });

    // Create the element first
    this.modal.create();

    // Now attach event handlers
    this.attachEventHandlers();
  }

  createAIInterface() {
    return `
      <div class="ai-panel">
        <!-- Tabs -->
        <div class="ai-tabs">
          <button class="ai-tab active" data-tab="chat">💬 Chat</button>
          <button class="ai-tab" data-tab="actions">⚡ Akce</button>
          <button class="ai-tab" data-tab="prompts">📝 Prompty</button>
          <button class="ai-tab" data-tab="github">🔗 GitHub</button>
        </div>

        <!-- Chat Tab -->
        <div class="ai-tab-content active" data-content="chat">
          <!-- AI Provider Selection -->
          <div class="ai-header">
            <div class="ai-provider-selector">
              <label for="aiProvider">Provider:</label>
              <select id="aiProvider" class="ai-select">
                <option value="groq">Groq</option>
                <option value="gemini">Google Gemini</option>
                <option value="openrouter">OpenRouter</option>
                <option value="mistral">Mistral</option>
                <option value="cohere">Cohere</option>
                <option value="huggingface">HuggingFace</option>
              </select>
            </div>
            <div class="ai-model-selector">
              <label for="aiModel">Model:</label>
              <select id="aiModel" class="ai-select">
                <option value="llama-3.3-70b-versatile">Llama 3.3 70B</option>
              </select>
            </div>
          </div>

          <!-- Chat Interface -->
          <div class="ai-chat">
            <div class="ai-chat-messages" id="aiChatMessages">
              <div class="ai-message system">
                <p>Ahoj! Jsem tvůj AI asistent. Můžu ti pomoct s kódem, vysvětlit koncepty, nebo vytvořit šablony. Co potřebuješ?</p>
              </div>
            </div>
            <div class="ai-chat-input">
              <textarea
                id="aiChatInput"
                placeholder="Napiš zprávu... (Shift+Enter pro nový řádek)"
                rows="3"
              ></textarea>
              <button class="ai-send-btn" id="aiSendBtn">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/>
                </svg>
              </button>
            </div>
          </div>
        </div>

        <!-- Actions Tab -->
        <div class="ai-tab-content" data-content="actions">
          <div class="ai-quick-actions">
            <h3>Rychlé akce</h3>
            <div class="quick-actions-grid">
              <button class="quick-action-btn" data-action="explain">
                <span class="icon">💡</span>
                <span>Vysvětli kód</span>
              </button>
              <button class="quick-action-btn" data-action="fix">
                <span class="icon">🔧</span>
                <span>Oprav chyby</span>
              </button>
              <button class="quick-action-btn" data-action="optimize">
                <span class="icon">⚡</span>
                <span>Optimalizuj</span>
              </button>
              <button class="quick-action-btn" data-action="document">
                <span class="icon">📝</span>
                <span>Dokumentuj</span>
              </button>
              <button class="quick-action-btn" data-action="test">
                <span class="icon">🧪</span>
                <span>Vytvoř testy</span>
              </button>
              <button class="quick-action-btn" data-action="refactor">
                <span class="icon">♻️</span>
                <span>Refaktoruj</span>
              </button>
              <button class="quick-action-btn" data-action="review">
                <span class="icon">👀</span>
                <span>Code review</span>
              </button>
              <button class="quick-action-btn" data-action="security">
                <span class="icon">🔒</span>
                <span>Bezpečnost</span>
              </button>
            </div>
          </div>

          <div class="ai-templates">
            <h3>Šablony</h3>
            <div class="templates-list">
              <button class="template-btn" data-template="blank">Prázdná stránka</button>
              <button class="template-btn" data-template="landing">Landing page</button>
              <button class="template-btn" data-template="form">Formulář</button>
              <button class="template-btn" data-template="dashboard">Dashboard</button>
              <button class="template-btn" data-template="portfolio">Portfolio</button>
              <button class="template-btn" data-template="blog">Blog</button>
            </div>
          </div>
        </div>

        <!-- Prompts Tab -->
        <div class="ai-tab-content" data-content="prompts">
          <div class="ai-prompts">
            <h3>Uložené prompty</h3>
            <div class="prompts-list" id="promptsList">
              <div class="prompt-item" data-prompt="html-structure">
                <div class="prompt-name">HTML Struktura</div>
                <div class="prompt-text">Vytvoř sémantickou HTML strukturu pro...</div>
              </div>
              <div class="prompt-item" data-prompt="css-layout">
                <div class="prompt-name">CSS Layout</div>
                <div class="prompt-text">Vytvoř responzivní layout pomocí CSS Grid...</div>
              </div>
              <div class="prompt-item" data-prompt="js-function">
                <div class="prompt-name">JS Funkce</div>
                <div class="prompt-text">Napiš funkci v JavaScriptu, která...</div>
              </div>
              <div class="prompt-item" data-prompt="accessibility">
                <div class="prompt-name">Přístupnost</div>
                <div class="prompt-text">Zkontroluj přístupnost a navrhni vylepšení...</div>
              </div>
              <div class="prompt-item" data-prompt="performance">
                <div class="prompt-name">Výkon</div>
                <div class="prompt-text">Analyzuj výkon kódu a navrhni optimalizace...</div>
              </div>
            </div>
            <button class="ai-btn-secondary" id="addPromptBtn">➕ Přidat prompt</button>
          </div>
        </div>

        <!-- GitHub Tab -->
        <div class="ai-tab-content" data-content="github">
          <div class="ai-github">
            <h3>GitHub integrace</h3>
            <div class="github-actions">
              <button class="github-action-btn" data-action="repos">
                <span class="icon">📁</span>
                <span>Repozitáře</span>
              </button>
              <button class="github-action-btn" data-action="search-repos">
                <span class="icon">🔍</span>
                <span>Hledat repozitáře</span>
              </button>
              <button class="github-action-btn" data-action="clone">
                <span class="icon">📥</span>
                <span>Klonovat repo</span>
              </button>
              <button class="github-action-btn" data-action="create-gist">
                <span class="icon">📄</span>
                <span>Vytvořit Gist</span>
              </button>
              <button class="github-action-btn" data-action="issues">
                <span class="icon">🐛</span>
                <span>Issues</span>
              </button>
              <button class="github-action-btn" data-action="pull-requests">
                <span class="icon">🔀</span>
                <span>Pull Requests</span>
              </button>
              <button class="github-action-btn" data-action="deploy">
                <span class="icon">🚀</span>
                <span>Deploy na GitHub Pages</span>
              </button>
            </div>

            <div class="github-status">
              <h4>Nastavení</h4>
              <div class="github-token-form">
                <label for="githubToken">Personal Access Token</label>
                <input
                  type="password"
                  id="githubToken"
                  class="github-token-input"
                  placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                  value="${this.getStoredToken()}"
                />
                <div class="github-auth-buttons">
                  <button class="ai-btn-primary" id="saveGithubToken">Uložit token</button>
                  <button class="ai-btn-secondary" id="githubOAuthLogin">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                      <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/>
                    </svg>
                    Přihlásit přes GitHub
                  </button>
                </div>
                <a
                  href="https://github.com/settings/tokens/new?scopes=repo,gist,delete_repo&description=HTML%20Editor%20Token"
                  target="_blank"
                  class="github-help-link"
                >
                  📖 Jak získat token?
                </a>
              </div>

              <div class="status-item">
                <span class="status-label">Status:</span>
                <span class="status-value" id="githubConnected">❌ Nepřipojeno</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  attachEventHandlers() {
    // Tabs
    const tabs = this.modal.element.querySelectorAll('.ai-tab');
    const tabContents = this.modal.element.querySelectorAll('.ai-tab-content');

    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        // Remove active class from all tabs and contents
        tabs.forEach(t => t.classList.remove('active'));
        tabContents.forEach(c => c.classList.remove('active'));

        // Add active class to clicked tab and corresponding content
        tab.classList.add('active');
        const tabName = tab.dataset.tab;
        const content = this.modal.element.querySelector(`[data-content="${tabName}"]`);
        if (content) {
          content.classList.add('active');
        }
      });
    });

    // Quick actions
    const quickActionBtns = this.modal.element.querySelectorAll('.quick-action-btn');
    quickActionBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const action = btn.dataset.action;
        this.handleQuickAction(action);
      });
    });

    // Templates
    const templateBtns = this.modal.element.querySelectorAll('.template-btn');
    templateBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const template = btn.dataset.template;
        this.handleTemplate(template);
      });
    });

    // Prompts
    const promptItems = this.modal.element.querySelectorAll('.prompt-item');
    promptItems.forEach(item => {
      item.addEventListener('click', () => {
        const promptId = item.dataset.prompt;
        this.usePrompt(promptId);
      });
    });

    const addPromptBtn = this.modal.element.querySelector('#addPromptBtn');
    if (addPromptBtn) {
      addPromptBtn.addEventListener('click', () => this.addCustomPrompt());
    }

    // GitHub actions
    const githubActionBtns = this.modal.element.querySelectorAll('.github-action-btn');
    githubActionBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const action = btn.dataset.action;
        this.handleGitHubAction(action);
      });
    });

    // GitHub token save button
    const saveGithubToken = this.modal.element.querySelector('#saveGithubToken');
    if (saveGithubToken) {
      saveGithubToken.addEventListener('click', () => this.saveGitHubToken());
    }

    // GitHub OAuth login
    const githubOAuthLogin = this.modal.element.querySelector('#githubOAuthLogin');
    if (githubOAuthLogin) {
      githubOAuthLogin.addEventListener('click', () => this.initiateGitHubOAuth());
    }

    // Check token on load
    this.checkGitHubConnection();

    // Chat input
    const chatInput = this.modal.element.querySelector('#aiChatInput');
    const sendBtn = this.modal.element.querySelector('#aiSendBtn');

    if (sendBtn) {
      sendBtn.addEventListener('click', () => {
        const message = chatInput.value.trim();
        if (message) {
          this.sendMessage(message);
          chatInput.value = '';
        }
      });
    }

    if (chatInput) {
      chatInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          sendBtn.click();
        }
      });
    }

    // Provider change
    const providerSelect = this.modal.element.querySelector('#aiProvider');
    if (providerSelect) {
      providerSelect.addEventListener('change', (e) => {
        this.updateModels(e.target.value);
      });
    }
  }

  handleQuickAction(action) {
    const code = state.get('editor.content') || '';

    const actionPrompts = {
      explain: `Vysvětli tento kód:\n\n${code}`,
      fix: `Najdi a oprav chyby v tomto kódu:\n\n${code}`,
      optimize: `Optimalizuj tento kód pro lepší výkon:\n\n${code}`,
      document: `Přidej dokumentaci k tomuto kódu:\n\n${code}`,
      test: `Vytvoř unit testy pro tento kód:\n\n${code}`,
      refactor: `Refaktoruj tento kód pro lepší čitelnost:\n\n${code}`
    };

    const prompt = actionPrompts[action];
    if (prompt) {
      this.sendMessage(prompt);
    }
  }

  handleTemplate(template) {
    const templates = {
      blank: this.getBlankTemplate(),
      landing: this.getLandingTemplate(),
      form: this.getFormTemplate(),
      dashboard: this.getDashboardTemplate(),
      portfolio: this.getPortfolioTemplate()
    };

    const templateCode = templates[template];
    if (templateCode) {
      eventBus.emit('editor:setContent', { content: templateCode });
      this.hide();
      eventBus.emit('toast:show', {
        message: `Šablona "${template}" byla vložena`,
        type: 'success'
      });
    }
  }

  async sendMessage(message) {
    // Add user message to chat
    this.addChatMessage('user', message);

    // Show loading
    const loadingId = this.addChatMessage('assistant', 'Přemýšlím...');

    try {
      // Get current provider and model
      const provider = this.modal.element.querySelector('#aiProvider')?.value || 'groq';
      const model = this.modal.element.querySelector('#aiModel')?.value || null;

      // Check if AI module is available
      if (typeof window.AI === 'undefined') {
        throw new Error('AI modul není načten');
      }

      // Get current code for context
      const currentCode = state.get('editor.code') || '';

      // Build system prompt with context
      const systemPrompt = `Jsi AI asistent pro HTML editor. Pomáháš s kódem, vysvětluješ koncepty a vytváříš šablony.

Aktuální kód uživatele:
\`\`\`html
${currentCode.substring(0, 500)}${currentCode.length > 500 ? '...' : ''}
\`\`\`

Odpovídej česky, stručně a prakticky. Pokud generuješ kód, zabal ho do \`\`\`html...\`\`\`.`;

      // Call AI module
      const response = await window.AI.ask(message, {
        provider: provider,
        model: model,
        system: systemPrompt,
        temperature: 0.7
      });

      this.removeChatMessage(loadingId);

      // Check if response contains code
      const codeMatch = response.match(/```html\n?([\s\S]*?)```/);
      if (codeMatch) {
        const code = codeMatch[1].trim();
        this.addChatMessage('assistant', response);

        // Offer to insert code
        const insertBtn = document.createElement('button');
        insertBtn.className = 'ai-insert-code-btn';
        insertBtn.textContent = '📝 Vložit do editoru';
        insertBtn.onclick = () => {
          eventBus.emit('editor:setContent', { content: code });
          eventBus.emit('toast:show', {
            message: 'Kód byl vložen do editoru',
            type: 'success'
          });
        };

        const lastMessage = this.modal.element.querySelector('.ai-message.assistant:last-child');
        if (lastMessage) {
          lastMessage.appendChild(insertBtn);
        }
      } else {
        this.addChatMessage('assistant', response);
      }
    } catch (error) {
      this.removeChatMessage(loadingId);

      let errorMsg = error.message;
      if (error.message.includes('API key')) {
        errorMsg = 'Chybí API klíč. Nastavte klíč v ai_module.js nebo použijte demo klíče.';
      }

      this.addChatMessage('system', `❌ Chyba: ${errorMsg}`);
      console.error('AI Error:', error);
    }
  }

  addChatMessage(role, content) {
    const messagesContainer = this.modal.element.querySelector('#aiChatMessages');
    const messageId = `msg-${Date.now()}-${Math.random()}`;

    const messageEl = document.createElement('div');
    messageEl.className = `ai-message ${role}`;
    messageEl.id = messageId;
    messageEl.innerHTML = `<p>${this.escapeHtml(content)}</p>`;

    messagesContainer.appendChild(messageEl);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;

    return messageId;
  }

  removeChatMessage(messageId) {
    const message = this.modal.element.querySelector(`#${messageId}`);
    if (message) {
      message.remove();
    }
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  updateModels(provider) {
    const modelSelect = this.modal.element.querySelector('#aiModel');

    const models = {
      openai: [
        { value: 'gpt-4', label: 'GPT-4' },
        { value: 'gpt-4-turbo', label: 'GPT-4 Turbo' },
        { value: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo' }
      ],
      anthropic: [
        { value: 'claude-3-opus', label: 'Claude 3 Opus' },
        { value: 'claude-3-sonnet', label: 'Claude 3 Sonnet' },
        { value: 'claude-3-haiku', label: 'Claude 3 Haiku' }
      ],
      gemini: [
        { value: 'gemini-pro', label: 'Gemini Pro' },
        { value: 'gemini-pro-vision', label: 'Gemini Pro Vision' }
      ],
      groq: [
        { value: 'mixtral-8x7b', label: 'Mixtral 8x7B' },
        { value: 'llama2-70b', label: 'Llama 2 70B' }
      ]
    };

    modelSelect.innerHTML = models[provider]
      .map(m => `<option value="${m.value}">${m.label}</option>`)
      .join('');
  }

  // Template generators
  getBlankTemplate() {
    return `<!DOCTYPE html>
<html lang="cs">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Nová stránka</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: system-ui, -apple-system, sans-serif;
      line-height: 1.6;
      padding: 20px;
    }
  </style>
</head>
<body>
  <h1>Nová stránka</h1>
  <p>Začněte psát váš obsah zde...</p>
</body>
</html>`;
  }

  getLandingTemplate() {
    return `<!DOCTYPE html>
<html lang="cs">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Landing Page</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: system-ui, -apple-system, sans-serif;
      line-height: 1.6;
    }
    .hero {
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
      padding: 40px 20px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
    }
    h1 {
      font-size: 3rem;
      margin-bottom: 1rem;
    }
    p {
      font-size: 1.25rem;
      margin-bottom: 2rem;
      opacity: 0.9;
    }
    .cta-button {
      padding: 15px 40px;
      font-size: 1.1rem;
      background: white;
      color: #667eea;
      border: none;
      border-radius: 50px;
      cursor: pointer;
      font-weight: bold;
      transition: transform 0.2s;
    }
    .cta-button:hover {
      transform: scale(1.05);
    }
  </style>
</head>
<body>
  <section class="hero">
    <h1>Váš úžasný produkt</h1>
    <p>Řešení, které změní váš život</p>
    <button class="cta-button">Začít zdarma</button>
  </section>
</body>
</html>`;
  }

  getFormTemplate() {
    return `<!DOCTYPE html>
<html lang="cs">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Kontaktní formulář</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: system-ui, -apple-system, sans-serif;
      background: #f5f5f5;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      padding: 20px;
    }
    .form-container {
      background: white;
      padding: 40px;
      border-radius: 10px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
      max-width: 500px;
      width: 100%;
    }
    h2 {
      margin-bottom: 20px;
    }
    .form-group {
      margin-bottom: 20px;
    }
    label {
      display: block;
      margin-bottom: 5px;
      font-weight: 500;
    }
    input, textarea {
      width: 100%;
      padding: 10px;
      border: 1px solid #ddd;
      border-radius: 5px;
      font-family: inherit;
    }
    button {
      width: 100%;
      padding: 12px;
      background: #667eea;
      color: white;
      border: none;
      border-radius: 5px;
      font-size: 1rem;
      cursor: pointer;
    }
    button:hover {
      background: #5568d3;
    }
  </style>
</head>
<body>
  <div class="form-container">
    <h2>Kontaktujte nás</h2>
    <form>
      <div class="form-group">
        <label for="name">Jméno</label>
        <input type="text" id="name" required>
      </div>
      <div class="form-group">
        <label for="email">Email</label>
        <input type="email" id="email" required>
      </div>
      <div class="form-group">
        <label for="message">Zpráva</label>
        <textarea id="message" rows="5" required></textarea>
      </div>
      <button type="submit">Odeslat</button>
    </form>
  </div>
</body>
</html>`;
  }

  getDashboardTemplate() {
    return `<!DOCTYPE html>
<html lang="cs">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Dashboard</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: system-ui, -apple-system, sans-serif;
      background: #f5f5f5;
    }
    .dashboard {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 20px;
      padding: 20px;
    }
    .card {
      background: white;
      padding: 30px;
      border-radius: 10px;
      box-shadow: 0 2px 5px rgba(0,0,0,0.1);
    }
    .card h3 {
      margin-bottom: 10px;
      color: #333;
    }
    .card .value {
      font-size: 2rem;
      font-weight: bold;
      color: #667eea;
    }
  </style>
</head>
<body>
  <div class="dashboard">
    <div class="card">
      <h3>Celkem uživatelů</h3>
      <div class="value">1,234</div>
    </div>
    <div class="card">
      <h3>Aktivní dnes</h3>
      <div class="value">567</div>
    </div>
    <div class="card">
      <h3>Nové registrace</h3>
      <div class="value">89</div>
    </div>
    <div class="card">
      <h3>Úspěšnost</h3>
      <div class="value">94%</div>
    </div>
  </div>
</body>
</html>`;
  }

  getPortfolioTemplate() {
    return `<!DOCTYPE html>
<html lang="cs">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Portfolio</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: system-ui, -apple-system, sans-serif;
      line-height: 1.6;
    }
    header {
      text-align: center;
      padding: 60px 20px;
      background: #667eea;
      color: white;
    }
    h1 {
      font-size: 2.5rem;
      margin-bottom: 10px;
    }
    .projects {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 30px;
      padding: 60px 20px;
      max-width: 1200px;
      margin: 0 auto;
    }
    .project {
      border: 1px solid #ddd;
      border-radius: 10px;
      overflow: hidden;
      transition: transform 0.2s;
    }
    .project:hover {
      transform: translateY(-5px);
      box-shadow: 0 5px 20px rgba(0,0,0,0.1);
    }
    .project-image {
      height: 200px;
      background: #667eea;
    }
    .project-content {
      padding: 20px;
    }
  </style>
</head>
<body>
  <header>
    <h1>Jan Novák</h1>
    <p>Web Developer & Designer</p>
  </header>
  <div class="projects">
    <div class="project">
      <div class="project-image"></div>
      <div class="project-content">
        <h3>Projekt 1</h3>
        <p>Popis projektu zde...</p>
      </div>
    </div>
    <div class="project">
      <div class="project-image"></div>
      <div class="project-content">
        <h3>Projekt 2</h3>
        <p>Popis projektu zde...</p>
      </div>
    </div>
    <div class="project">
      <div class="project-image"></div>
      <div class="project-content">
        <h3>Projekt 3</h3>
        <p>Popis projektu zde...</p>
      </div>
    </div>
  </div>
</body>
</html>`;
  }

  // Prompt management
  usePrompt(promptId) {
    const prompts = {
      'html-structure': 'Vytvoř sémantickou HTML strukturu pro moderní webovou stránku s hlavičkou, navigací, hlavním obsahem a patičkou.',
      'css-layout': 'Vytvoř responzivní layout pomocí CSS Grid, který bude mít sidebar a hlavní obsah. Na mobilech se sidebar zobrazí pod obsahem.',
      'js-function': 'Napiš JavaScriptovou funkci, která validuje emailovou adresu a vrací true/false.',
      'accessibility': 'Zkontroluj tento kód z hlediska přístupnosti (ARIA, sémantika, klávesnice) a navrhni konkrétní vylepšení.',
      'performance': 'Analyzuj výkon tohoto kódu a navrhni optimalizace (lazy loading, minifikace, caching).'
    };

    const promptText = prompts[promptId];
    if (promptText) {
      // Switch to chat tab
      const chatTab = this.modal.element.querySelector('[data-tab="chat"]');
      if (chatTab) {
        chatTab.click();
      }

      // Fill input and send
      const chatInput = this.modal.element.querySelector('#aiChatInput');
      if (chatInput) {
        chatInput.value = promptText;
        chatInput.focus();
      }
    }
  }

  addCustomPrompt() {
    // Show prompt for custom prompt
    const name = prompt('Název promptu:');
    if (!name) return;

    const text = prompt('Text promptu:');
    if (!text) return;

    // Add to list (this would normally save to localStorage)
    const promptsList = this.modal.element.querySelector('#promptsList');
    if (promptsList) {
      const promptItem = document.createElement('div');
      promptItem.className = 'prompt-item';
      promptItem.dataset.prompt = name.toLowerCase().replace(/\s+/g, '-');
      promptItem.innerHTML = `
        <div class="prompt-name">${name}</div>
        <div class="prompt-text">${text.substring(0, 50)}...</div>
      `;
      promptsList.appendChild(promptItem);

      // Attach click handler
      promptItem.addEventListener('click', () => {
        const chatInput = this.modal.element.querySelector('#aiChatInput');
        if (chatInput) {
          chatInput.value = text;
          const chatTab = this.modal.element.querySelector('[data-tab="chat"]');
          if (chatTab) chatTab.click();
        }
      });

      eventBus.emit('toast:show', {
        message: 'Prompt byl přidán',
        type: 'success'
      });
    }
  }

  // GitHub integration
  handleGitHubAction(action) {
    const actions = {
      'repos': () => this.showRepoManager(),
      'search-repos': () => eventBus.emit('github:searchRepos'),
      'clone': () => this.cloneRepo(),
      'create-gist': () => this.createGist(),
      'issues': () => eventBus.emit('github:showIssues'),
      'pull-requests': () => eventBus.emit('github:showPullRequests'),
      'deploy': () => eventBus.emit('github:deployPages')
    };

    const actionFn = actions[action];
    if (actionFn) {
      actionFn();
    }
  }

  cloneRepo() {
    const url = prompt('URL GitHub repozitáře:');
    if (url) {
      eventBus.emit('github:clone', { url });
    }
  }

  createGist() {
    const code = state.get('editor.content') || '';
    const description = prompt('Popis Gistu:');

    if (description !== null) {
      eventBus.emit('github:createGist', {
        code,
        description,
        filename: 'index.html'
      });
      eventBus.emit('toast:show', {
        message: 'Gist byl vytvořen',
        type: 'success'
      });
    }
  }

  // GitHub token management
  getStoredToken() {
    return localStorage.getItem('github_token') || '';
  }

  saveGitHubToken() {
    const tokenInput = this.modal.element.querySelector('#githubToken');
    if (!tokenInput) return;

    const token = tokenInput.value.trim();

    if (!token) {
      eventBus.emit('toast:show', {
        message: 'Zadejte GitHub token',
        type: 'error'
      });
      return;
    }

    // Basic validation
    if (!token.startsWith('ghp_') && !token.startsWith('github_pat_')) {
      eventBus.emit('toast:show', {
        message: 'Neplatný formát tokenu. Token by měl začínat ghp_ nebo github_pat_',
        type: 'warning'
      });
    }

    // Save token
    localStorage.setItem('github_token', token);

    // Update connection status
    this.checkGitHubConnection();

    eventBus.emit('toast:show', {
      message: 'GitHub token byl uložen',
      type: 'success'
    });
  }

  checkGitHubConnection() {
    const token = this.getStoredToken();
    const statusElement = this.modal?.element?.querySelector('#githubConnected');

    if (statusElement) {
      if (token) {
        statusElement.textContent = '✅ Připojeno';
        statusElement.style.color = '#10b981';
      } else {
        statusElement.textContent = '❌ Nepřipojeno';
        statusElement.style.color = '#ef4444';
      }
    }
  }

  // GitHub OAuth
  async initiateGitHubOAuth() {
    eventBus.emit('toast:show', {
      message: 'Zahajuji GitHub přihlášení...',
      type: 'info'
    });

    // Simulate OAuth flow (in production, this would redirect to GitHub)
    const username = prompt('GitHub uživatelské jméno (pro demo):');
    if (!username) return;

    // Store username
    localStorage.setItem('github_username', username);

    // Simulate getting token (in production, this would come from OAuth callback)
    eventBus.emit('toast:show', {
      message: 'Připojeno jako @' + username + '. Nezapomeňte nastavit token pro API přístup.',
      type: 'success'
    });

    this.checkGitHubConnection();
  }

  // Repository Manager
  async showRepoManager() {
    const token = this.getStoredToken();
    if (!token) {
      eventBus.emit('toast:show', {
        message: 'Nejprve nastavte GitHub token',
        type: 'error'
      });
      return;
    }

    // Create modal for repo manager
    const repoModal = new Modal({
      title: '📁 Správce repozitářů',
      content: this.createRepoManagerContent(),
      className: 'repo-manager-modal',
      size: 'large'
    });

    repoModal.create();
    repoModal.open();

    // Attach handlers after modal is created
    this.attachRepoManagerHandlers(repoModal);

    // Load repositories
    await this.loadRepositories(repoModal);
  }

  createRepoManagerContent() {
    return `
      <div class="repo-manager">
        <div class="repo-toolbar">
          <button class="repo-btn" id="createRepoBtn">
            <span class="icon">➕</span>
            <span>Vytvořit repozitář</span>
          </button>
          <button class="repo-btn" id="refreshReposBtn">
            <span class="icon">🔄</span>
            <span>Obnovit</span>
          </button>
          <button class="repo-btn" id="undoRepoActionBtn" disabled>
            <span class="icon">↩️</span>
            <span>Vrátit zpět</span>
          </button>
        </div>

        <div class="repo-search">
          <input
            type="text"
            id="repoSearchInput"
            placeholder="🔍 Hledat repozitář..."
            class="repo-search-input"
          />
        </div>

        <div class="repo-list" id="repoList">
          <div class="repo-loading">Načítám repozitáře...</div>
        </div>
      </div>
    `;
  }

  attachRepoManagerHandlers(repoModal) {
    const createBtn = repoModal.element.querySelector('#createRepoBtn');
    const refreshBtn = repoModal.element.querySelector('#refreshReposBtn');
    const undoBtn = repoModal.element.querySelector('#undoRepoActionBtn');
    const searchInput = repoModal.element.querySelector('#repoSearchInput');

    if (createBtn) {
      createBtn.addEventListener('click', () => this.createRepository(repoModal));
    }

    if (refreshBtn) {
      refreshBtn.addEventListener('click', () => this.loadRepositories(repoModal));
    }

    if (undoBtn) {
      undoBtn.addEventListener('click', () => this.undoLastRepoAction(repoModal));
    }

    if (searchInput) {
      searchInput.addEventListener('input', (e) => this.filterRepositories(e.target.value, repoModal));
    }
  }

  async loadRepositories(repoModal) {
    const repoList = repoModal.element.querySelector('#repoList');
    if (!repoList) return;

    repoList.innerHTML = '<div class="repo-loading">Načítám repozitáře...</div>';

    try {
      // Get username from localStorage or token
      const username = localStorage.getItem('github_username') || 'user';

      // Simulate API call (in production, call GitHub API)
      const repos = this.getMockRepositories(username);

      if (repos.length === 0) {
        repoList.innerHTML = '<div class="repo-empty">Žádné repozitáře</div>';
        return;
      }

      repoList.innerHTML = repos.map(repo => this.createRepoItem(repo)).join('');

      // Attach delete handlers
      const deleteButtons = repoList.querySelectorAll('.repo-delete-btn');
      deleteButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const repoName = btn.dataset.repo;
          this.deleteRepository(repoName, repoModal);
        });
      });

      // Attach repo click handlers
      const repoItems = repoList.querySelectorAll('.repo-item');
      repoItems.forEach(item => {
        item.addEventListener('click', () => {
          const repoName = item.dataset.repo;
          this.openRepository(repoName);
        });
      });

    } catch (error) {
      repoList.innerHTML = '<div class="repo-error">Chyba při načítání repozitářů</div>';
      console.error(error);
    }
  }

  getMockRepositories(username) {
    // Load from localStorage or return mock data
    const stored = localStorage.getItem('github_repos');
    if (stored) {
      return JSON.parse(stored);
    }

    const mockRepos = [
      { name: 'my-website', description: 'Personal portfolio', stars: 5, private: false },
      { name: 'html-editor', description: 'Web-based HTML editor', stars: 12, private: false },
      { name: 'secret-project', description: 'Private repository', stars: 0, private: true }
    ];

    localStorage.setItem('github_repos', JSON.stringify(mockRepos));
    return mockRepos;
  }

  createRepoItem(repo) {
    const privateLabel = repo.private ? '<span class="repo-badge private">🔒 Private</span>' : '';
    return `
      <div class="repo-item" data-repo="${repo.name}">
        <div class="repo-icon">📁</div>
        <div class="repo-info">
          <div class="repo-name">${repo.name}</div>
          <div class="repo-description">${repo.description || 'Bez popisu'}</div>
          <div class="repo-meta">
            ${privateLabel}
            <span class="repo-stars">⭐ ${repo.stars}</span>
          </div>
        </div>
        <button class="repo-delete-btn" data-repo="${repo.name}">
          🗑️
        </button>
      </div>
    `;
  }

  async createRepository(repoModal) {
    const name = prompt('Název repozitáře:');
    if (!name) return;

    const description = prompt('Popis (volitelné):') || '';
    const isPrivate = confirm('Vytvořit jako privátní repozitář?');

    // Add to mock data
    const repos = this.getMockRepositories();
    repos.unshift({
      name,
      description,
      stars: 0,
      private: isPrivate
    });

    localStorage.setItem('github_repos', JSON.stringify(repos));

    // Store for undo
    this.storeUndoAction('create', { name, description, private: isPrivate });

    eventBus.emit('toast:show', {
      message: `Repozitář "${name}" byl vytvořen`,
      type: 'success'
    });

    // Reload list
    await this.loadRepositories(repoModal);
    this.enableUndoButton(repoModal);
  }

  async deleteRepository(repoName, repoModal) {
    // Security: require last 2 characters
    const lastTwo = repoName.slice(-2);
    const prefilled = repoName.slice(0, -2);

    const confirmation = prompt(
      `⚠️ REPOZITÁŘ: ${repoName}\n\n` +
      `Pro potvrzení smazání doplňte poslední 2 znaky názvu repozitáře:\n\n` +
      `${prefilled}____`
    );

    if (!confirmation) return;

    if (confirmation !== lastTwo) {
      eventBus.emit('toast:show', {
        message: 'Špatné potvrzení. Repozitář nebyl smazán.',
        type: 'error'
      });
      return;
    }

    // Find and remove repo
    const repos = this.getMockRepositories();
    const repoIndex = repos.findIndex(r => r.name === repoName);

    if (repoIndex === -1) return;

    const deletedRepo = repos[repoIndex];
    repos.splice(repoIndex, 1);
    localStorage.setItem('github_repos', JSON.stringify(repos));

    // Store for undo
    this.storeUndoAction('delete', deletedRepo);

    eventBus.emit('toast:show', {
      message: `Repozitář "${repoName}" byl smazán`,
      type: 'success'
    });

    // Reload list
    await this.loadRepositories(repoModal);
    this.enableUndoButton(repoModal);
  }

  storeUndoAction(action, data) {
    localStorage.setItem('github_last_action', JSON.stringify({
      action,
      data,
      timestamp: Date.now()
    }));
  }

  async undoLastRepoAction(repoModal) {
    const lastAction = localStorage.getItem('github_last_action');
    if (!lastAction) return;

    const { action, data } = JSON.parse(lastAction);
    const repos = this.getMockRepositories();

    if (action === 'create') {
      // Remove created repo
      const index = repos.findIndex(r => r.name === data.name);
      if (index !== -1) {
        repos.splice(index, 1);
      }
    } else if (action === 'delete') {
      // Restore deleted repo
      repos.unshift(data);
    }

    localStorage.setItem('github_repos', JSON.stringify(repos));
    localStorage.removeItem('github_last_action');

    eventBus.emit('toast:show', {
      message: 'Akce byla vrácena zpět',
      type: 'success'
    });

    // Reload list
    await this.loadRepositories(repoModal);
    this.disableUndoButton(repoModal);
  }

  filterRepositories(query, repoModal) {
    const repoItems = repoModal.element.querySelectorAll('.repo-item');
    const lowerQuery = query.toLowerCase();

    repoItems.forEach(item => {
      const repoName = item.dataset.repo.toLowerCase();
      const description = item.querySelector('.repo-description')?.textContent.toLowerCase() || '';

      if (repoName.includes(lowerQuery) || description.includes(lowerQuery)) {
        item.style.display = 'flex';
      } else {
        item.style.display = 'none';
      }
    });
  }

  openRepository(repoName) {
    eventBus.emit('toast:show', {
      message: `Otevírám repozitář ${repoName}...`,
      type: 'info'
    });
    // In production, this would open repo details or clone it
  }

  enableUndoButton(repoModal) {
    const undoBtn = repoModal.element.querySelector('#undoRepoActionBtn');
    if (undoBtn) {
      undoBtn.disabled = false;
    }
  }

  disableUndoButton(repoModal) {
    const undoBtn = repoModal.element.querySelector('#undoRepoActionBtn');
    if (undoBtn) {
      undoBtn.disabled = true;
    }
  }
}

