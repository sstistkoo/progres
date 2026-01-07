/**
 * AI Panel Module
 * Provides AI assistant interface with chat, templates, and quick actions
 */

import { eventBus } from '../../core/events.js';
import { state } from '../../core/state.js';
import { Modal } from '../../ui/components/Modal.js';
import { toast } from '../../ui/components/Toast.js';
import { AITester } from './AITester.js';

export class AIPanel {
  constructor() {
    this.modal = null;
    this.chatHistory = state.get('ai.chatHistory') || [];
    this.pendingChanges = new Map(); // Store pending changes for accept/reject
    this.originalCode = null; // Store original code before changes
    this.aiTester = new AITester();
    this.isProcessing = false; // Race condition protection
    this.eventListeners = []; // Track event listeners for cleanup
    this.setupEventListeners();
  }

  setupEventListeners() {
    // Track listeners for cleanup
    const listeners = [
      { event: 'ai:show', handler: () => this.show() },
      { event: 'ai:hide', handler: () => this.hide() },
      { event: 'ai:sendMessage', handler: (data) => this.sendMessage(data.message) },
      { event: 'aiSettings:show', handler: () => this.showSettings() },
      { event: 'console:errorCountChanged', handler: (data) => this.updateErrorIndicator(data.count) }
    ];

    listeners.forEach(({ event, handler }) => {
      eventBus.on(event, handler);
      this.eventListeners.push({ event, handler });
    });
  }

  cleanup() {
    // Remove all event listeners to prevent memory leaks
    this.eventListeners.forEach(({ event, handler }) => {
      eventBus.off(event, handler);
    });
    this.eventListeners = [];

    // Cleanup modal
    if (this.modal) {
      this.modal.close();
      this.modal = null;
    }

    // Clear pending changes
    this.pendingChanges.clear();
  }

  showSettings() {
    // Open AI modal and automatically expand settings
    this.show();

    // Use requestAnimationFrame for better DOM ready check
    const expandSettings = () => {
      const settingsToggle = this.modal?.element?.querySelector('.ai-settings-toggle');
      const settingsContent = this.modal?.element?.querySelector('.ai-header-settings');

      if (settingsToggle && settingsContent) {
        if (settingsContent.classList.contains('hidden')) {
          settingsToggle.click();
        }
      } else {
        // Retry if elements not found yet
        requestAnimationFrame(expandSettings);
      }
    };

    requestAnimationFrame(expandSettings);
  }

  show() {
    if (!this.modal) {
      this.createModal();
    }
    this.modal.open();
    this.restoreChatMessages();
  }

  hide() {
    if (this.modal) {
      this.modal.close();
    }
  }

  createModal() {
    const content = this.createAIInterface();

    this.modal = new Modal({
      title: `<div class="modal-title-wrapper">
        <select class="ai-tab-select-header" id="aiTabSelectHeader">
          <option value="chat" selected>💬 Chat</option>
          <option value="agents">🤖 Agenti</option>
          <option value="editor">📝 Kód</option>
          <option value="actions">⚡ Akce</option>
          <option value="prompts">📝 Prompty</option>
          <option value="testing">🧪 Testing</option>
          <option value="github">🔗 GitHub</option>
        </select>
        <button class="ai-error-indicator" id="aiErrorIndicator" title="Klikněte pro odeslání chyb AI">
          <span class="error-icon">✓</span>
          <span class="error-count">0 chyb</span>
        </button>
        <div class="ai-settings-header" id="aiSettingsHeader">
          <button class="ai-settings-toggle" type="button">Nastavení AI <span class="toggle-arrow">▼</span></button>
          <div class="ai-header-settings hidden">
            <div class="ai-provider-selector">
              <label for="aiProvider">Provider:</label>
              <select id="aiProvider" class="ai-select">
                ${this.generateProviderOptions()}
              </select>
            </div>
            <div class="ai-model-selector">
              <label for="aiModel">Model:</label>
              <select id="aiModel" class="ai-select">
                <option value="">Načítání...</option>
              </select>
            </div>
          </div>
        </div>
      </div>`,
      content,
      className: 'ai-modal',
      size: 'large',
      onClose: () => this.hide()
    });

    // Create the element first
    this.modal.create();

    // Now attach event handlers
    this.attachEventHandlers();
    this.setupErrorIndicator();
    this.setupTokenCounter();

    // Initialize provider/model after DOM is ready
    const providerSelect = this.modal.element.querySelector('#aiProvider');
    if (providerSelect) {
      this.updateModels(providerSelect.value);
    }

    // Add toggle functionality for settings dropdown
    const settingsToggle = this.modal.element.querySelector('.ai-settings-toggle');
    const settingsContent = this.modal.element.querySelector('.ai-header-settings');
    const toggleArrow = this.modal.element.querySelector('.toggle-arrow');

    console.log('Settings toggle found:', settingsToggle);
    console.log('Settings content found:', settingsContent);
    console.log('Toggle arrow found:', toggleArrow);

    if (settingsToggle && settingsContent) {
      console.log('Adding click listener to settings toggle');
      settingsToggle.addEventListener('click', (e) => {
        e.preventDefault();
        console.log('Settings toggle clicked!');
        console.log('Before toggle - hidden class:', settingsContent.classList.contains('hidden'));
        settingsContent.classList.toggle('hidden');
        const isOpen = !settingsContent.classList.contains('hidden');
        console.log('After toggle - is open:', isOpen);
        if (toggleArrow) {
          toggleArrow.style.transform = isOpen ? 'rotate(180deg)' : 'rotate(0deg)';
        }
      });
    } else {
      console.error('Settings toggle or content not found!');
    }
  }

  createAIInterface() {
    return `
      <div class="ai-panel">
        <!-- Chat Tab -->
        <div class="ai-tab-content active" data-content="chat">
          <!-- Chat Interface -->
          <div class="ai-chat">
            <div class="ai-chat-header">
              <span class="chat-history-info" id="chatHistoryInfo">Historie: 0 zpráv</span>
              <div class="chat-header-buttons">
                <button class="export-chat-btn" id="exportChatBtn" title="Exportovat konverzaci">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                    <polyline points="7 10 12 15 17 10"/>
                    <line x1="12" y1="15" x2="12" y2="3"/>
                  </svg>
                  Export
                </button>
                <button class="clear-history-btn" id="clearHistoryBtn" title="Vymazat historii konverzace">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
                    <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                  </svg>
                  Vymazat
                </button>
              </div>
            </div>
            <div class="ai-chat-messages" id="aiChatMessages">
              <div class="ai-message system">
                <p>Ahoj! Jsem tvůj AI asistent. Můžu ti pomoct s kódem, vysvětlit koncepty, nebo vytvořit šablony. Co potřebuješ?</p>
              </div>
            </div>
            <div class="ai-chat-input">
              <div class="token-counter" id="tokenCounter">
                <span class="token-count">0</span> tokenů (~<span class="char-count">0</span> znaků)
              </div>
              <textarea
                id="aiChatInput"
                placeholder="Napiš zprávu... (Shift+Enter pro nový řádek)"
                rows="3"
              ></textarea>
              <div class="ai-chat-buttons">
                <button class="ai-send-btn" id="aiSendBtn">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/>
                  </svg>
                  <span>Odeslat</span>
                </button>
                <button class="ai-orchestrator-btn" id="aiOrchestratorBtn" title="Orchestrator zpracuje zadání a rozdělí úkoly mezi agenty">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M12 2L2 7l10 5 10-5-10-5z"/>
                    <path d="M2 17l10 5 10-5"/>
                    <path d="M2 12l10 5 10-5"/>
                  </svg>
                  <span>Orchestrator</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- AI Agents Tab -->
        <div class="ai-tab-content" data-content="agents">
          <div class="agents-panel">
            <h3>🤖 AI Programovací Agenti</h3>
            <p class="agents-description">Aktivuj agenty podle typu úkolu. Můžeš použít více agentů najednou pro kolaborativní práci.</p>

            <!-- Engine Selector -->
            <div class="agent-engine-selector">
              <label>
                <input type="radio" name="agentEngine" value="javascript" checked>
                <span>⚡ JavaScript Agenti (Online AI)</span>
              </label>
              <label>
                <input type="radio" name="agentEngine" value="crewai">
                <span>🐍 CrewAI (Ollama lokálně)</span>
                <span class="engine-status" id="crewaiStatus">○</span>
              </label>
            </div>

            <div class="agents-grid" id="agentsGrid">
              <!-- Agents will be dynamically loaded here -->
            </div>

            <div class="active-agents-section" id="activeAgentsSection" style="display: none;">
              <h4>Aktivní agenti</h4>
              <div class="active-agents-list" id="activeAgentsList"></div>

              <div class="collaborative-actions">
                <button class="btn-orchestrated" id="orchestratedTaskBtn">
                  <span class="icon">🎯</span>
                  <span>Orchestrovaný úkol</span>
                </button>
                <button class="btn-collaborative" id="collaborativeTaskBtn">
                  <span class="icon">🤝</span>
                  <span>Společný úkol</span>
                </button>
                <button class="btn-clear-agents" id="clearAgentsBtn">
                  <span class="icon">🗑️</span>
                  <span>Vymazat historii</span>
                </button>
              </div>
            </div>

            <!-- Agent Chat -->
            <div class="agent-chat-section" id="agentChatSection" style="display: none;">
              <h4>Chat s agentem: <span id="currentAgentName"></span></h4>
              <div class="agent-chat-messages" id="agentChatMessages"></div>
              <div class="agent-chat-input">
                <textarea
                  id="agentChatInput"
                  placeholder="Napiš zprávu agentovi..."
                  rows="3"
                ></textarea>
                <button id="sendToAgentBtn" class="btn-primary">
                  Odeslat
                </button>
              </div>
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

        <!-- Testing Tab -->
        <div class="ai-tab-content" data-content="testing">
          <div class="ai-testing">
            <h3>🧪 Test AI Modelů</h3>

            <div class="testing-header">
              <p style="margin-bottom: 16px; color: var(--text-secondary);">
                Automaticky otestuj všechny dostupné AI modely a zjisti, které fungují správně.
              </p>

              <div class="testing-controls">
                <button class="btn-primary" id="startAllTestsBtn">
                  <span class="icon">▶️</span>
                  <span>Spustit všechny testy</span>
                </button>
                <button class="btn-secondary" id="exportResultsBtn" style="display: none;">
                  <span class="icon">💾</span>
                  <span>Export výsledků</span>
                </button>
                <button class="btn-secondary" id="stopTestsBtn" style="display: none;">
                  <span class="icon">⏹️</span>
                  <span>Zastavit</span>
                </button>
              </div>
            </div>

            <!-- Progress Bar -->
            <div class="testing-progress" id="testingProgress" style="display: none;">
              <div class="progress-bar">
                <div class="progress-fill" id="testProgressFill"></div>
              </div>
              <div class="progress-text" id="testProgressText">0 / 0 (0%)</div>
              <div class="progress-status" id="testProgressStatus">Inicializace...</div>
            </div>

            <!-- Statistics -->
            <div class="testing-stats" id="testingStats" style="display: none;">
              <h4>📊 Statistiky</h4>
              <div class="stats-grid">
                <div class="stat-item">
                  <div class="stat-value" id="statTotal">0</div>
                  <div class="stat-label">Celkem modelů</div>
                </div>
                <div class="stat-item success">
                  <div class="stat-value" id="statSuccess">0</div>
                  <div class="stat-label">✅ Úspěch</div>
                </div>
                <div class="stat-item error">
                  <div class="stat-value" id="statError">0</div>
                  <div class="stat-label">❌ Chyba</div>
                </div>
                <div class="stat-item warning">
                  <div class="stat-value" id="statNoKey">0</div>
                  <div class="stat-label">⚠️ Bez klíče</div>
                </div>
                <div class="stat-item info">
                  <div class="stat-value" id="statAvgTime">0ms</div>
                  <div class="stat-label">⚡ Průměrná doba</div>
                </div>
              </div>
            </div>

            <!-- Provider Tests -->
            <div class="testing-providers" id="testingProviders">
              <h4>Test podle providera</h4>
              <div class="provider-test-grid">
                <button class="provider-test-btn" data-provider="gemini">
                  <span class="icon">💎</span>
                  <span>Google Gemini</span>
                </button>
                <button class="provider-test-btn" data-provider="groq">
                  <span class="icon">⚡</span>
                  <span>Groq</span>
                </button>
                <button class="provider-test-btn" data-provider="openrouter">
                  <span class="icon">🌐</span>
                  <span>OpenRouter</span>
                </button>
                <button class="provider-test-btn" data-provider="mistral">
                  <span class="icon">🌊</span>
                  <span>Mistral AI</span>
                </button>
                <button class="provider-test-btn" data-provider="cohere">
                  <span class="icon">🧠</span>
                  <span>Cohere</span>
                </button>
                <button class="provider-test-btn" data-provider="huggingface">
                  <span class="icon">🤗</span>
                  <span>HuggingFace</span>
                </button>
              </div>
            </div>

            <!-- Results Table -->
            <div class="testing-results" id="testingResults" style="display: none;">
              <h4>📋 Výsledky testů</h4>
              <div class="results-table-container">
                <table class="results-table">
                  <thead>
                    <tr>
                      <th>Provider</th>
                      <th>Model</th>
                      <th>Status</th>
                      <th>Doba odezvy</th>
                      <th>Chyba</th>
                    </tr>
                  </thead>
                  <tbody id="resultsTableBody">
                  </tbody>
                </table>
              </div>
            </div>
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

  setupErrorIndicator() {
    const errorBtn = this.modal?.element?.querySelector('#aiErrorIndicator');
    if (errorBtn) {
      errorBtn.addEventListener('click', () => this.sendAllErrorsToAI());
    }
    // Initialize with current error count
    this.updateErrorIndicator(0);
  }

  updateErrorIndicator(errorCount) {
    const errorBtn = this.modal?.element?.querySelector('#aiErrorIndicator');
    if (!errorBtn) return;

    const icon = errorBtn.querySelector('.error-icon');
    const countText = errorBtn.querySelector('.error-count');

    if (errorCount === 0) {
      errorBtn.className = 'ai-error-indicator success';
      icon.textContent = '✓';
      countText.textContent = '0 chyb';
      errorBtn.title = 'Žádné chyby v konzoli';
    } else {
      errorBtn.className = 'ai-error-indicator error';
      icon.textContent = '⚠';
      countText.textContent = `${errorCount} ${errorCount === 1 ? 'chyba' : errorCount < 5 ? 'chyby' : 'chyb'}`;
      errorBtn.title = `Klikněte pro odeslání ${errorCount} chyb AI k opravě`;
    }
  }

  sendAllErrorsToAI() {
    // Get all errors from console
    const consoleContent = document.getElementById('consoleContent');
    if (!consoleContent) return;

    const errorMessages = [];
    const errorElements = consoleContent.querySelectorAll('.console-error .console-text');
    errorElements.forEach(el => {
      const errorText = el.textContent;
      // Check if error is ignored
      if (!this.isErrorIgnored(errorText)) {
        errorMessages.push(errorText);
      }
    });

    if (errorMessages.length === 0) {
      eventBus.emit('toast:show', {
        message: '✅ Žádné chyby k odeslání',
        type: 'info',
        duration: 2000
      });
      return;
    }

    // Show error selection modal
    this.showErrorSelectionModal(errorMessages);
  }

  isErrorIgnored(errorText) {
    const ignoredErrors = JSON.parse(localStorage.getItem('ignoredErrors') || '[]');
    return ignoredErrors.some(ignored => errorText.includes(ignored));
  }

  ignoreErrors(errors) {
    const ignoredErrors = JSON.parse(localStorage.getItem('ignoredErrors') || '[]');
    errors.forEach(error => {
      if (!ignoredErrors.includes(error)) {
        ignoredErrors.push(error);
      }
    });
    localStorage.setItem('ignoredErrors', JSON.stringify(ignoredErrors));

    eventBus.emit('toast:show', {
      message: `🔕 ${errors.length} chyb ignorováno`,
      type: 'info',
      duration: 2000
    });

    // Update error count
    const consoleContent = document.getElementById('consoleContent');
    if (consoleContent) {
      const visibleErrorCount = Array.from(consoleContent.querySelectorAll('.console-error .console-text'))
        .filter(el => !this.isErrorIgnored(el.textContent)).length;
      this.updateErrorIndicator(visibleErrorCount);
    }
  }

  showErrorSelectionModal(errorMessages) {
    // Create modal
    const modal = document.createElement('div');
    modal.className = 'modal-backdrop error-selection-modal-backdrop';
    modal.innerHTML = `
      <div class="modal-content error-selection-modal">
        <div class="modal-header">
          <h3>🐛 Výběr chyb k odeslání AI</h3>
          <button class="modal-close" id="errorModalClose">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>
        <div class="modal-body error-selection-body">
          <p class="error-selection-description">
            Vyberte chyby, které chcete odeslat AI k opravě, nebo je ignorujte.
          </p>
          <div class="error-selection-controls">
            <button class="select-all-btn" id="selectAllErrors">✓ Vybrat vše</button>
            <button class="deselect-all-btn" id="deselectAllErrors">✗ Zrušit výběr</button>
            <button class="manage-ignored-btn" id="manageIgnoredBtn">🔕 Spravovat ignorované</button>
          </div>
          <div class="error-list" id="errorList">
            ${errorMessages.map((error, index) => `
              <div class="error-item" data-index="${index}">
                <input type="checkbox" id="error-${index}" checked>
                <label for="error-${index}" class="error-text">${this.escapeHTML(error)}</label>
              </div>
            `).join('')}
          </div>
        </div>
        <div class="modal-footer error-selection-footer">
          <button class="btn-secondary" id="ignoreSelectedBtn">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
              <path d="M1 1l22 22M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
            </svg>
            Ignorovat vybrané
          </button>
          <button class="btn-primary" id="sendSelectedBtn">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
              <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/>
            </svg>
            Odeslat vybrané do AI
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    // Close handlers
    const closeModal = () => modal.remove();
    modal.querySelector('#errorModalClose').addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeModal();
    });

    // Select/Deselect all
    modal.querySelector('#selectAllErrors').addEventListener('click', () => {
      modal.querySelectorAll('.error-item input[type="checkbox"]').forEach(cb => cb.checked = true);
    });

    modal.querySelector('#deselectAllErrors').addEventListener('click', () => {
      modal.querySelectorAll('.error-item input[type="checkbox"]').forEach(cb => cb.checked = false);
    });

    // Manage ignored errors
    modal.querySelector('#manageIgnoredBtn').addEventListener('click', () => {
      this.showIgnoredErrorsModal();
    });

    // Ignore selected errors
    modal.querySelector('#ignoreSelectedBtn').addEventListener('click', () => {
      const selectedErrors = [];
      modal.querySelectorAll('.error-item input[type="checkbox"]:checked').forEach(cb => {
        const index = parseInt(cb.closest('.error-item').dataset.index);
        selectedErrors.push(errorMessages[index]);
      });

      if (selectedErrors.length === 0) {
        eventBus.emit('toast:show', {
          message: '⚠️ Nevybrali jste žádné chyby',
          type: 'warning',
          duration: 2000
        });
        return;
      }

      this.ignoreErrors(selectedErrors);
      closeModal();
    });

    // Send selected errors
    modal.querySelector('#sendSelectedBtn').addEventListener('click', () => {
      const selectedErrors = [];
      modal.querySelectorAll('.error-item input[type="checkbox"]:checked').forEach(cb => {
        const index = parseInt(cb.closest('.error-item').dataset.index);
        selectedErrors.push(errorMessages[index]);
      });

      if (selectedErrors.length === 0) {
        eventBus.emit('toast:show', {
          message: '⚠️ Nevybrali jste žádné chyby k odeslání',
          type: 'warning',
          duration: 2000
        });
        return;
      }

      // Get current code
      const code = state.get('editor.code') || '';
      const activeFile = state.get('files.active') || 'untitled.html';

      // Construct prompt
      const prompt = `Prosím, oprav následující chyby v mém kódu:

**Nalezené chyby (${selectedErrors.length}):**
${selectedErrors.map((err, i) => `${i + 1}. ${err}`).join('\n')}

**Soubor:** ${activeFile}

**Aktuální kód:**
\`\`\`html
${code}
\`\`\`

Přepiš celý kód s opravami všech chyb a vysvětli, co bylo špatně.`;

      // Send message to chat
      this.sendMessage(prompt);

      eventBus.emit('toast:show', {
        message: `✅ ${selectedErrors.length} chyb odesláno AI k opravě`,
        type: 'success',
        duration: 2000
      });

      closeModal();
    });
  }

  showIgnoredErrorsModal() {
    const ignoredErrors = JSON.parse(localStorage.getItem('ignoredErrors') || '[]');

    const modal = document.createElement('div');
    modal.className = 'modal-backdrop error-selection-modal-backdrop';
    modal.innerHTML = `
      <div class="modal-content error-selection-modal">
        <div class="modal-header">
          <h3>🔕 Ignorované chyby</h3>
          <button class="modal-close" id="ignoredModalClose">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>
        <div class="modal-body error-selection-body">
          ${ignoredErrors.length === 0 ? `
            <p class="error-selection-description">
              Žádné ignorované chyby. Chyby můžete ignorovat při výběru chyb k odeslání AI.
            </p>
          ` : `
            <p class="error-selection-description">
              Seznam ignorovaných chyb. Klikněte na tlačítko pro odebrání z ignorovaných.
            </p>
            <div class="error-list" id="ignoredErrorList">
              ${ignoredErrors.map((error, index) => `
                <div class="error-item" data-index="${index}">
                  <span class="error-text">${this.escapeHTML(error)}</span>
                  <button class="remove-ignored-btn" data-error="${this.escapeHTML(error)}" title="Přestat ignorovat">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14">
                      <path d="M18 6L6 18M6 6l12 12"/>
                    </svg>
                  </button>
                </div>
              `).join('')}
            </div>
          `}
        </div>
        <div class="modal-footer error-selection-footer">
          ${ignoredErrors.length > 0 ? `
            <button class="btn-secondary" id="clearAllIgnoredBtn">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
                <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
              </svg>
              Vymazat vše
            </button>
          ` : ''}
          <button class="btn-primary" id="closeIgnoredBtn">Zavřít</button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    // Close handlers
    const closeModal = () => {
      modal.remove();
      // Refresh error count after managing ignored errors
      const consoleContent = document.getElementById('consoleContent');
      if (consoleContent) {
        const visibleErrorCount = Array.from(consoleContent.querySelectorAll('.console-error .console-text'))
          .filter(el => !this.isErrorIgnored(el.textContent)).length;
        this.updateErrorIndicator(visibleErrorCount);
      }
    };

    modal.querySelector('#ignoredModalClose').addEventListener('click', closeModal);
    modal.querySelector('#closeIgnoredBtn').addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeModal();
    });

    // Remove individual ignored error
    modal.querySelectorAll('.remove-ignored-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const errorToRemove = btn.dataset.error;
        const ignoredErrors = JSON.parse(localStorage.getItem('ignoredErrors') || '[]');
        const updatedErrors = ignoredErrors.filter(err => err !== errorToRemove);
        localStorage.setItem('ignoredErrors', JSON.stringify(updatedErrors));

        eventBus.emit('toast:show', {
          message: '✅ Chyba již nebude ignorována',
          type: 'success',
          duration: 2000
        });

        // Refresh modal
        modal.remove();
        this.showIgnoredErrorsModal();
      });
    });

    // Clear all ignored errors
    const clearAllBtn = modal.querySelector('#clearAllIgnoredBtn');
    if (clearAllBtn) {
      clearAllBtn.addEventListener('click', () => {
        if (confirm('Opravdu chcete vymazat všechny ignorované chyby?')) {
          localStorage.setItem('ignoredErrors', JSON.stringify([]));

          eventBus.emit('toast:show', {
            message: '🗑️ Všechny ignorované chyby vymazány',
            type: 'success',
            duration: 2000
          });

          closeModal();
        }
      });
    }
  }

  escapeHTML(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  setupTokenCounter() {
    const chatInput = this.modal?.element?.querySelector('#aiChatInput');
    const tokenCounter = this.modal?.element?.querySelector('#tokenCounter');

    if (!chatInput || !tokenCounter) return;

    chatInput.addEventListener('input', () => {
      const text = chatInput.value;
      const charCount = text.length;
      // Rough estimation: 1 token ≈ 4 characters
      const tokenCount = Math.ceil(charCount / 4);

      tokenCounter.querySelector('.token-count').textContent = tokenCount;
      tokenCounter.querySelector('.char-count').textContent = charCount;

      // Color coding
      if (tokenCount > 2000) {
        tokenCounter.style.color = '#ef4444';
      } else if (tokenCount > 1000) {
        tokenCounter.style.color = '#f59e0b';
      } else {
        tokenCounter.style.color = 'var(--text-secondary)';
      }
    });
  }

  attachEventHandlers() {
    // Tab Select Dropdown in Header
    const tabSelect = this.modal.element.querySelector('#aiTabSelectHeader');
    const tabContents = this.modal.element.querySelectorAll('.ai-tab-content');

    if (tabSelect) {
      tabSelect.addEventListener('change', (e) => {
        const tabName = e.target.value;

        // Special handling for editor tab - close modal and focus editor
        if (tabName === 'editor') {
          Modal.close();
          // Focus editor
          const editorTextarea = document.querySelector('#editor');
          if (editorTextarea) {
            editorTextarea.focus();
          }
          toast.show('📝 Přepnuto na editor', 'info');
          // Reset select to chat
          tabSelect.value = 'chat';
          return;
        }

        // Remove active class from all contents
        tabContents.forEach(c => c.classList.remove('active'));

        // Add active class to corresponding content
        const content = this.modal.element.querySelector(`[data-content="${tabName}"]`);
        if (content) {
          content.classList.add('active');
        }
      });
    }

    // Chat Input & Send
    const chatInput = this.modal.element.querySelector('#aiChatInput');
    const sendBtn = this.modal.element.querySelector('#aiSendBtn');

    if (chatInput && sendBtn) {
      const sendMessage = () => {
        const message = chatInput.value.trim();
        if (message) {
          this.sendMessage(message);
          chatInput.value = '';
          chatInput.style.height = 'auto';
        }
      };

      sendBtn.addEventListener('click', sendMessage);

      // Orchestrator button
      const orchestratorBtn = this.modal.element.querySelector('#aiOrchestratorBtn');
      if (orchestratorBtn) {
        orchestratorBtn.addEventListener('click', () => {
          const message = chatInput.value.trim();
          if (message) {
            this.sendToOrchestrator(message);
            chatInput.value = '';
            chatInput.style.height = 'auto';
          }
        });
      }

      chatInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          sendMessage();
        }
      });

      // Auto-resize textarea
      chatInput.addEventListener('input', () => {
        chatInput.style.height = 'auto';
        chatInput.style.height = chatInput.scrollHeight + 'px';
      });
    }

    // Clear History Button
    const clearHistoryBtn = this.modal.element.querySelector('#clearHistoryBtn');
    if (clearHistoryBtn) {
      clearHistoryBtn.addEventListener('click', () => {
        this.clearChatHistory();
      });
    }

    // Export Chat Button
    const exportChatBtn = this.modal.element.querySelector('#exportChatBtn');
    if (exportChatBtn) {
      exportChatBtn.addEventListener('click', () => {
        // Show export options
        const options = ['💾 JSON', '📝 Markdown'];
        const choice = confirm('Exportovat jako:\n1 = JSON\n2 = Markdown\n\nZvolte 1 nebo 2 a stiskněte OK');
        if (choice) {
          const format = prompt('Zadejte 1 pro JSON nebo 2 pro Markdown:', '1');
          if (format === '1') {
            this.exportChatHistory();
          } else if (format === '2') {
            this.exportChatAsMarkdown();
          }
        }
      });
    }

    // Update history info
    this.updateHistoryInfo();

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

    // New project button
    const newProjectBtn = this.modal.element.querySelector('#aiNewProjectBtn');
    if (newProjectBtn) {
      newProjectBtn.addEventListener('click', () => this.startNewProject());
    }

    // AI Agents handlers
    this.attachAgentsHandlers();

    // Provider change
    const providerSelect = this.modal.element.querySelector('#aiProvider');
    if (providerSelect) {
      providerSelect.addEventListener('change', (e) => {
        this.updateModels(e.target.value);
      });

      // Initialize models for default provider
      this.updateModels(providerSelect.value);
    }

    // Testing tab handlers
    this.attachTestingHandlers();
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
    // Race condition protection
    if (this.isProcessing) {
      toast.warn('⏳ Čekám na dokončení předchozího požadavku...', 2000);
      return;
    }

    this.isProcessing = true;

    // Add user message to chat
    this.addChatMessage('user', message);

    // Přidat loading animaci
    const loadingId = 'ai-loading-' + Date.now();
    const messagesContainer = this.modal.element.querySelector('#aiChatMessages');
    const loadingMsg = document.createElement('div');
    loadingMsg.className = 'ai-message assistant loading';
    loadingMsg.id = loadingId;
    loadingMsg.innerHTML = `
      <div class="ai-thinking">
        <div class="thinking-dots">
          <span></span><span></span><span></span>
        </div>
        <p>AI přemýšlí a generuje kód...</p>
      </div>
    `;
    messagesContainer.appendChild(loadingMsg);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;

    // Start timing
    const startTime = performance.now();

    // Add to history
    this.chatHistory.push({
      role: 'user',
      content: message
    });

    // Uložit historii do state
    state.set('ai.chatHistory', this.chatHistory);

    // Update history counter
    this.updateHistoryInfo();

    try {
      // Get current provider and model from UI or use auto-selection
      // Check if AI module is available
      if (typeof window.AI === 'undefined') {
        throw new Error('AI modul není načten');
      }

      // Get current code for context
      const currentCode = state.get('editor.code') || '';
      const openFiles = state.get('files.tabs') || [];
      const activeFileId = state.get('files.active');
      const activeFile = openFiles.find(f => f.id === activeFileId);

      // Build files context
      let filesContext = '';
      if (openFiles.length > 0) {
        filesContext = `\n\nOtevřené soubory:\n${openFiles.map(f => `- ${f.name}${f.id === activeFileId ? ' (aktivní)' : ''}`).join('\n')}`;
      }

      // Build chat history context (last 10 messages)
      let historyContext = '';
      if (this.chatHistory.length > 1) {
        const recentHistory = this.chatHistory.slice(-10);
        historyContext = `\n\nPředchozí konverzace:\n${recentHistory.map(msg =>
          `${msg.role === 'user' ? 'Uživatel' : 'AI'}: ${msg.content.substring(0, 200)}${msg.content.length > 200 ? '...' : ''}`
        ).join('\n')}`;
      }

      // Check if this is orchestrator new project (empty editor + minimal history)
      const isNewOrchestratorProject = currentCode.trim() === '' && this.chatHistory.length <= 1;

      // Build system prompt with context
      let systemPrompt;

      if (isNewOrchestratorProject) {
        // New orchestrator project - NO old code context
        console.log('🎯 Orchestrator režim: Generuji bez starého kontextu');
        systemPrompt = `Jsi expert full-stack vývojář vytvářející KOMPLETNÍ FUNKČNÍ webové aplikace od nuly.

🎯 TVŮJ CÍL:
Vytvořit plně funkční, moderní webovou aplikaci podle zadání uživatele.

📋 STRUKTURA VÝSTUPU:
1. Kompletní HTML s DOCTYPE, head (meta, title), body
2. CSS styly v <style> tagu v <head> - moderní, responzivní design
3. JavaScript v <script> tagu před </body> - PLNÁ FUNKČNOST

⚠️ KRITICKÁ PRAVIDLA:
✅ VŽDY přidej event listenery a kompletní logiku
✅ Každá proměnná UNIKÁTNÍ název (result1, result2, input1, input2...)
✅ TESTUJ kód mentálně - žádné chyby, žádné duplicity
✅ Modern JavaScript (addEventListener, querySelector, arrow functions)
✅ Responzivní CSS (flexbox/grid, mobile-first)
❌ NIKDY jen HTML/CSS bez JavaScriptu
❌ NIKDY duplicitní let/const/var deklarace
❌ NIKDY nedokončený nebo nefunkční kód

📐 BEST PRACTICES:
- Sémantický HTML5 (section, article, nav...)
- CSS custom properties (--primary-color: #...)
- Input validace a error handling
- Přístupnost (labels, ARIA, keyboard navigation)
- Clean code - komentáře u složitějších částí

🔄 PŘED ODESLÁNÍM:
1. Zkontroluj duplicitní proměnné
2. Ověř že všechny eventy jsou navázané
3. Ujisti se že kód funguje samostatně

Odpovídej česky, kód zabal do \`\`\`html...\`\`\`.`;
      } else {
        // Normal mode - include current code context
        const hasCode = currentCode && currentCode.trim().length > 100;
        const hasHistory = this.chatHistory && this.chatHistory.length > 2;

        systemPrompt = `Jsi expert programátor a full-stack vývojář. Pomáháš s vývojem webových aplikací.

📁 KONTEXT PROJEKTU:
${filesContext}

📄 ${activeFile ? `Aktivní soubor: ${activeFile.name}` : 'Žádný aktivní soubor'}
💾 Aktuální kód v editoru (${currentCode ? currentCode.split('\n').length : 0} řádků):
\`\`\`html
${currentCode ? (() => {
  // Detect if AI will likely use EDIT:LINES mode
  const msg = message ? message.toLowerCase() : '';
  const willEdit = hasCode && (
    msg.match(/\b(změň|change|uprav|edit|oprav|fix|přidej|add|odstraň|remove|smaž|delete)\b/) ||
    msg.includes('celý soubor') ||
    msg.includes('celý kód') ||
    msg.includes('zobraz vše')
  );

  // For EDIT mode or small files, send full code with line numbers
  if (willEdit || currentCode.length < 8000) {
    return this.addLineNumbers(currentCode);
  }

  // Otherwise truncate for context
  const truncated = this.truncateCodeIntelligently(currentCode, 3000);
  return this.addLineNumbers(typeof truncated === 'string' ? truncated : truncated.code, typeof truncated === 'object' ? truncated : null);
})() : '(prázdný editor)'}
\`\`\`

💬 ${historyContext}

🎯 TVŮJ ÚKOL:
${this.selectPromptByContext(message, hasCode, hasHistory, currentCode)}

📋 PRAVIDLA VÝSTUPU:
✅ Kód MUSÍ obsahovat JavaScript pro interaktivitu
✅ Všechny proměnné UNIKÁTNÍ názvy (no duplicates!)
✅ Event listenery připojené správně
✅ Moderní ES6+ syntax (const/let, arrow functions)
✅ Validace vstupů, error handling
✅ Responzivní design (mobile-first)
❌ NIKDY jen HTML/CSS bez funkčnosti
❌ NIKDY duplicitní deklarace proměnných
❌ NIKDY neúplný nebo nefunkční kód

🗂️ MULTI-FILE PROJEKTY:
- Projekt může obsahovat VÍCE souborů (.html, .css, .js, .png...)
- Vidíš seznam všech otevřených souborů výše v KONTEXT PROJEKTU
- ⚠️ NEPOTŘEBUJEŠ vždy VŠECHNY soubory! Zaměř se jen na relevantní
- 🧠 CHÁPEJ KONTEXT a NAJDI SPRÁVNÝ SOUBOR:
  • Změna barev, fontů, layoutu → Hledej .css soubor (styles.css, style.css, main.css)
  • Nová funkce, event handler → Hledej .js soubor (script.js, main.js, app.js)
  • Struktura HTML, přidání elementů → Hledej .html soubor (index.html)
  • ❌ NIKDY nepřidávej CSS do HTML pokud existuje samostatný .css soubor!
  • ❌ NIKDY nepřidávaj JS do HTML pokud existuje samostatný .js soubor!
- 📍 OZNAČENÍ SOUBORU: Vždy jasně řekni: "Otevři soubor **styles.css** a změň..."
- CSS a JS soubory se AUTOMATICKY injektují do HTML preview
- Obrázky (.png, .jpg) se stahují jako base64 a zobrazují v preview
- Pokud příslušný soubor NEEXISTUJE, doporuč vytvořit: "Vytvoř nový soubor **styles.css** s tímto obsahem:"
- Pro úpravy více souborů najednou uveď každý zvlášť se správným code blokem (\\\`\\\`\\\`html, \\\`\\\`\\\`css, \\\`\\\`\\\`javascript)
- Relativní cesty v HTML fungují automaticky díky injection systému

💡 ODPOVĚDI:
- Stručně a prakticky v češtině
- Kód zabal do \\\`\\\`\\\`html...\\\`\\\`\\\` (nebo \\\`\\\`\\\`css\\\`\\\`\\\`, \\\`\\\`\\\`javascript\\\`\\\`\\\`)
- Pro vysvětlení použij jasný jazyk
- Navazuj na předchozí konverzaci
- Pokud doporučuješ více souborů, jasně to označ`;
      }

      // Get provider and model from UI
      let provider = this.modal.element.querySelector('#aiProvider')?.value;
      let model = this.modal.element.querySelector('#aiModel')?.value;

      // If user hasn't explicitly selected a model, use the best one
      if (!model || model === 'null' || model === '') {
        const bestModel = window.AI.selectBestModel();
        provider = bestModel.provider;
        model = bestModel.model;
        console.log(`✨ Auto-vybrán nejlepší model: ${provider}/${model}`);
      }

      const response = await window.AI.ask(message, {
        provider: provider,
        model: model,
        system: systemPrompt,
        temperature: 0.7,
        autoFallback: true,  // Auto-switch on rate limit
        history: this.chatHistory.slice(-10) // Send last 10 messages as context
      });

      // Add to history
      this.chatHistory.push({
        role: 'assistant',
        content: response
      });

      // Uložit historii do state
      state.set('ai.chatHistory', this.chatHistory);

      // Update history counter
      this.updateHistoryInfo();

      // Odstranit loading animaci
      const loadingElement = document.getElementById(loadingId);
      if (loadingElement) loadingElement.remove();

      // First check if response contains EDIT:LINES instructions
      const editInstructions = this.parseEditInstructions(response);

      if (editInstructions.length > 0) {
        console.log(`🔧 Detekováno ${editInstructions.length} EDIT:LINES instrukcí`);

        // Show preview of changes
        const preview = editInstructions.map(e =>
          `📝 Řádky ${e.startLine}-${e.endLine}:\n❌ Původní: ${e.oldCode.substring(0, 60)}...\n✅ Nový: ${e.newCode.substring(0, 60)}...`
        ).join('\n\n');

        console.log('📋 Náhled změn:\n' + preview);

        // Apply edits automatically (no user confirmation for speed)
        const applied = this.applyLineEdits(editInstructions);

        if (applied) {
          // Add success message with summary
          const summary = editInstructions.map((e, i) =>
            `${i + 1}. Řádky ${e.startLine}-${e.endLine}: ✅`
          ).join('\n');

          this.addChatMessage('assistant', `✅ Automaticky aplikováno ${editInstructions.length} změn:\n\n${summary}\n\n${response}`);

          // Close modal on success
          if (this.modal) {
            setTimeout(() => this.modal.close(), 500);
          }
          return;
        } else {
          // Edits failed - show helpful message with current code context
          const currentCode = state.get('editor.code');
          const lines = currentCode ? currentCode.split('\n') : [];

          // Show context around failed lines
          let contextMessage = '📄 **Aktuální kód v editoru:**\n\n';
          for (const edit of editInstructions) {
            const startLine = Math.max(1, edit.startLine - 2);
            const endLine = Math.min(lines.length, edit.endLine + 2);
            const contextLines = lines.slice(startLine - 1, endLine).map((line, i) =>
              `${startLine + i}: ${line}`
            ).join('\n');
            contextMessage += `Řádky ${edit.startLine}-${edit.endLine} (+ kontext):\n\`\`\`\n${contextLines}\n\`\`\`\n\n`;
          }

          this.addChatMessage('assistant',
            `⚠️ Nepodařilo se aplikovat změny - kód v editoru se liší od očekávání.\n\n` +
            `${contextMessage}\n` +
            `💡 **Co dělat:**\n` +
            `- Zkus požádat znovu s aktuálním stavem kódu\n` +
            `- Nebo upřesni co chceš změnit\n\n` +
            `**AI odpověď:**\n${response}`
          );
          return;
        }
      } else if (response.includes('EDIT:LINES')) {
        // EDIT:LINES bloky byly detekovány ale ignorovány kvůli prázdným OLD blokům
        toast.error(
          `❌ AI použila ZAKÁZANÉ zkratky v OLD blocích!\n\n` +
          `💡 AI musí zkopírovat PŘESNÝ kód, ne "...", "// ...", "/* ... */"\n\n` +
          `🔄 Zkus požádat AI znovu nebo buď konkrétnější.`,
          8000
        );
        console.error('❌ EDIT:LINES bloky ignorovány - obsahují prázdné nebo zkrácené OLD bloky');
      }

      // Check if this is modification of existing code (has history and code)
      const isModification = this.chatHistory.length > 3 && currentCode.trim().length > 100;

      // Add assistant message with formatted code (fallback for full code)
      this.addChatMessageWithCode('assistant', response, message, isModification);
    } catch (error) {
      // Odstranit loading animaci při chybě
      const loadingElement = document.getElementById(loadingId);
      if (loadingElement) loadingElement.remove();
      let errorMsg = error.message;
      if (error.message.includes('API key')) {
        errorMsg = 'Chybí API klíč. Nastavte klíč v ai_module.js nebo použijte demo klíče.';
      }

      this.addChatMessage('system', `❌ Chyba: ${errorMsg}`);
      console.error('AI Error:', error);
    } finally {
      this.isProcessing = false; // Always reset processing flag
    }
  }

  addChatMessage(role, content, responseTime = null) {
    const messagesContainer = this.modal.element.querySelector('#aiChatMessages');
    const messageId = `msg-${Date.now()}-${Math.random()}`;

    const messageEl = document.createElement('div');
    messageEl.className = `ai-message ${role}`;
    messageEl.id = messageId;

    // Render markdown if marked is available and it's not user message
    if (role === 'assistant' && typeof marked !== 'undefined') {
      try {
        // Configure marked
        marked.setOptions({
          breaks: true,
          gfm: true,
          headerIds: false
        });

        // Parse markdown
        const htmlContent = marked.parse(content);
        messageEl.innerHTML = htmlContent;
      } catch (error) {
        console.error('Markdown parsing error:', error);
        messageEl.innerHTML = `<p>${this.escapeHtml(content)}</p>`;
      }
    } else {
      messageEl.innerHTML = `<p>${this.escapeHtml(content)}</p>`;
    }

    messagesContainer.appendChild(messageEl);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;

    return messageId;
  }

  addChatMessageWithCode(role, content, originalMessage = '', isModification = false, codeStatus = {}) {
    const messagesContainer = this.modal.element.querySelector('#aiChatMessages');
    const messageEl = document.createElement('div');
    messageEl.className = `ai-message ${role}`;

    // Detect code blocks
    const codeBlockRegex = /```(\w+)?\n?([\s\S]*?)```/g;
    let lastIndex = 0;
    let formattedContent = '';
    let codeBlocks = [];
    let match;

    while ((match = codeBlockRegex.exec(content)) !== null) {
      // Add text before code block
      if (match.index > lastIndex) {
        formattedContent += `<p>${this.escapeHtml(content.substring(lastIndex, match.index))}</p>`;
      }

      const language = match[1] || 'html';
      const code = match[2].trim();
      codeBlocks.push({ language, code });

      // Add code block with collapsible wrapper and actions on top
      formattedContent += `
        <div class="code-block-wrapper">
          <div class="code-block-actions" data-code-index="${codeBlocks.length - 1}"></div>
          <details class="code-block-collapsible">
            <summary class="code-block-header">
              <span class="code-language">${language}</span>
              <span class="toggle-icon">▼</span>
            </summary>
            <pre class="code-block"><code>${this.escapeHtml(code)}</code></pre>
          </details>
        </div>
      `;

      lastIndex = match.index + match[0].length;
    }

    // Add remaining text
    if (lastIndex < content.length) {
      formattedContent += `<p>${this.escapeHtml(content.substring(lastIndex))}</p>`;
    }

    messageEl.innerHTML = formattedContent;
    messagesContainer.appendChild(messageEl);

    // Add action buttons for code blocks
    codeBlocks.forEach((block, index) => {
      const actionsContainer = messageEl.querySelector(`[data-code-index="${index}"]`);
      if (actionsContainer) {
        // Store pending change
        const changeId = `change-${Date.now()}-${index}`;

        // Check if this code block was already accepted/rejected (use index)
        const status = codeStatus[`code-${index}`];

        if (status === 'accepted' || status === 'rejected') {
          // Show reset button instead of status
          const resetBtn = document.createElement('button');
          resetBtn.className = 'code-action-btn';
          resetBtn.innerHTML = `
            <svg viewBox="0 0 16 16" width="14" height="14" fill="currentColor">
              <path d="M1.5 3.25a.75.75 0 0 1 .75-.75h12.5a.75.75 0 0 1 0 1.5H2.25a.75.75 0 0 1-.75-.75zM1.5 8a.75.75 0 0 1 .75-.75h12.5a.75.75 0 0 1 0 1.5H2.25A.75.75 0 0 1 1.5 8zm.75 4a.75.75 0 0 0 0 1.5h12.5a.75.75 0 0 0 0-1.5H2.25z"/>
            </svg>
            Obnovit volbu
          `;
          resetBtn.onclick = () => {
            // Remove status from chatHistory
            const lastMsg = this.chatHistory[this.chatHistory.length - 1];
            if (lastMsg && lastMsg.role === 'assistant' && lastMsg.codeStatus) {
              delete lastMsg.codeStatus[`code-${index}`];
              state.set('ai.chatHistory', this.chatHistory);
            }

            // Clear container and re-add buttons
            actionsContainer.innerHTML = '';

            const isNewProject = this.detectNewProject(originalMessage, block.code);
            this.pendingChanges.set(changeId, {
              code: block.code,
              isNewProject: isNewProject,
              timestamp: Date.now()
            });

            // Create Accept button
            const acceptBtn = document.createElement('button');
            acceptBtn.className = 'code-action-btn accept';
            acceptBtn.innerHTML = `
              <svg viewBox="0 0 16 16" width="14" height="14" fill="currentColor">
                <path d="M13.78 4.22a.75.75 0 010 1.06l-7.25 7.25a.75.75 0 01-1.06 0L2.22 9.28a.75.75 0 011.06-1.06L6 10.94l6.72-6.72a.75.75 0 011.06 0z"/>
              </svg>
              Accept
            `;
            acceptBtn.onclick = () => {
              this.acceptChange(changeId, actionsContainer, false, isModification);
            };

            // Create Reject button
            const rejectBtn = document.createElement('button');
            rejectBtn.className = 'code-action-btn reject';
            rejectBtn.innerHTML = `
              <svg viewBox="0 0 16 16" width="14" height="14" fill="currentColor">
                <path d="M3.72 3.72a.75.75 0 011.06 0L8 6.94l3.22-3.22a.75.75 0 111.06 1.06L9.06 8l3.22 3.22a.75.75 0 11-1.06 1.06L8 9.06l-3.22 3.22a.75.75 0 01-1.06-1.06L6.94 8 3.72 4.78a.75.75 0 010-1.06z"/>
              </svg>
              Reject
            `;
            rejectBtn.onclick = () => {
              this.rejectChange(changeId, actionsContainer);
            };

            actionsContainer.appendChild(acceptBtn);
            actionsContainer.appendChild(rejectBtn);
          };

          const statusText = document.createElement('span');
          statusText.className = `change-status ${status}`;
          statusText.innerHTML = status === 'accepted'
            ? `<svg viewBox="0 0 16 16" width="14" height="14" fill="currentColor">
                <path d="M13.78 4.22a.75.75 0 010 1.06l-7.25 7.25a.75.75 0 01-1.06 0L2.22 9.28a.75.75 0 011.06-1.06L6 10.94l6.72-6.72a.75.75 0 011.06 0z"/>
              </svg> Změna potvrzena`
            : `<svg viewBox="0 0 16 16" width="14" height="14" fill="currentColor">
                <path d="M3.72 3.72a.75.75 0 011.06 0L8 6.94l3.22-3.22a.75.75 0 111.06 1.06L9.06 8l3.22 3.22a.75.75 0 11-1.06 1.06L8 9.06l-3.22 3.22a.75.75 0 01-1.06-1.06L6.94 8 3.72 4.78a.75.75 0 010-1.06z"/>
              </svg> Změna zamítnuta`;

          actionsContainer.appendChild(statusText);
          actionsContainer.appendChild(resetBtn);
          return;
        }

        const isNewProject = this.detectNewProject(originalMessage, block.code);

        this.pendingChanges.set(changeId, {
          code: block.code,
          isNewProject: isNewProject,
          timestamp: Date.now()
        });

        // Create Accept/Reject buttons (primary action)
        const acceptBtn = document.createElement('button');
        acceptBtn.className = 'code-action-btn accept';
        acceptBtn.innerHTML = `
          <svg viewBox="0 0 16 16" width="14" height="14" fill="currentColor">
            <path d="M13.78 4.22a.75.75 0 010 1.06l-7.25 7.25a.75.75 0 01-1.06 0L2.22 9.28a.75.75 0 011.06-1.06L6 10.94l6.72-6.72a.75.75 0 011.06 0z"/>
          </svg>
          Accept
        `;
        acceptBtn.onclick = () => {
          this.acceptChange(changeId, actionsContainer, false, isModification);
        };

        const rejectBtn = document.createElement('button');
        rejectBtn.className = 'code-action-btn reject';
        rejectBtn.innerHTML = `
          <svg viewBox="0 0 16 16" width="14" height="14" fill="currentColor">
            <path d="M3.72 3.72a.75.75 0 011.06 0L8 6.94l3.22-3.22a.75.75 0 111.06 1.06L9.06 8l3.22 3.22a.75.75 0 11-1.06 1.06L8 9.06l-3.22 3.22a.75.75 0 01-1.06-1.06L6.94 8 3.72 4.78a.75.75 0 010-1.06z"/>
          </svg>
          Reject
        `;
        rejectBtn.onclick = () => {
          this.rejectChange(changeId, actionsContainer);
        };

        actionsContainer.appendChild(acceptBtn);
        actionsContainer.appendChild(rejectBtn);

        // No auto-apply - user must choose
      }
    });

    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }

  acceptChange(changeId, actionsContainer, isAuto = false, isModification = false) {
    const change = this.pendingChanges.get(changeId);
    if (!change) return;

    // Clear countdown if exists
    if (change.countdownInterval) {
      clearInterval(change.countdownInterval);
    }

    // Always update current editor (don't create new files)
    this.insertCodeToEditor(change.code, isModification);

    // Update UI
    actionsContainer.innerHTML = `
      <span class="change-status accepted">
        <svg viewBox="0 0 16 16" width="14" height="14" fill="currentColor">
          <path d="M13.78 4.22a.75.75 0 010 1.06l-7.25 7.25a.75.75 0 01-1.06 0L2.22 9.28a.75.75 0 011.06-1.06L6 10.94l6.72-6.72a.75.75 0 011.06 0z"/>
        </svg>
        Změna potvrzena
      </span>
    `;
    actionsContainer.dataset.accepted = 'true';

    // Mark code block as accepted in chatHistory (use index as key)
    const codeIndex = actionsContainer.dataset.codeIndex;
    const lastMsg = this.chatHistory[this.chatHistory.length - 1];
    if (lastMsg && lastMsg.role === 'assistant') {
      if (!lastMsg.codeStatus) lastMsg.codeStatus = {};
      lastMsg.codeStatus[`code-${codeIndex}`] = 'accepted';
      state.set('ai.chatHistory', this.chatHistory);
    }

    // Remove from pending
    this.pendingChanges.delete(changeId);
  }

  rejectChange(changeId, actionsContainer) {
    const change = this.pendingChanges.get(changeId);
    if (!change) return;

    // Clear countdown
    if (change.countdownInterval) {
      clearInterval(change.countdownInterval);
    }

    // Restore original code if it was modified
    if (this.originalCode) {
      state.set('editor.code', this.originalCode);
      eventBus.emit('editor:setCode', { code: this.originalCode });
    }

    // Update UI
    actionsContainer.innerHTML = `
      <span class="change-status rejected">
        <svg viewBox="0 0 16 16" width="14" height="14" fill="currentColor">
          <path d="M3.72 3.72a.75.75 0 011.06 0L8 6.94l3.22-3.22a.75.75 0 111.06 1.06L9.06 8l3.22 3.22a.75.75 0 11-1.06 1.06L8 9.06l-3.22 3.22a.75.75 0 01-1.06-1.06L6.94 8 3.72 4.78a.75.75 0 010-1.06z"/>
        </svg>
        Změna zamítnuta
      </span>
    `;
    actionsContainer.dataset.rejected = 'true';

    // Mark code block as rejected in chatHistory (use index as key)
    const codeIndex = actionsContainer.dataset.codeIndex;
    const lastMsg = this.chatHistory[this.chatHistory.length - 1];
    if (lastMsg && lastMsg.role === 'assistant') {
      if (!lastMsg.codeStatus) lastMsg.codeStatus = {};
      lastMsg.codeStatus[`code-${codeIndex}`] = 'rejected';
      state.set('ai.chatHistory', this.chatHistory);
    }

    // Remove from pending
    this.pendingChanges.delete(changeId);
  }

  detectNewProject(userMessage, code) {
    // Keywords that indicate user wants a new project
    const newProjectKeywords = ['udělej', 'vytvoř', 'vygeneruj', 'nový', 'kalkulačk', 'formulář', 'stránk', 'web', 'app'];
    const messageLower = userMessage.toLowerCase();

    // Check if message contains new project keywords
    const hasKeyword = newProjectKeywords.some(kw => messageLower.includes(kw));

    // Check if code is a complete HTML document
    const isCompleteDoc = code.includes('<!DOCTYPE') && code.includes('<html') && code.includes('</html>');

    return hasKeyword && isCompleteDoc;
  }

  createNewFileWithCode(code) {
    // Create new file via event
    eventBus.emit('file:createWithCode', { code });
  }

  /**
   * Meta-prompt for AI to determine which prompt(s) to use
   * Used when user request is ambiguous or complex
   *
   * @param {string} userMessage - User's request
   * @param {number} codeLength - Current code length
   * @param {number} lineCount - Current code line count
   * @returns {string} Meta-prompt text
   */
  getPromptSelectionMetaPrompt(userMessage, codeLength, lineCount) {
    const wordCount = userMessage ? userMessage.split(/\s+/).length : 0;
    return `🤔 ANALÝZA POŽADAVKU - Určení Správného Přístupu

📋 UŽIVATELSKÝ POŽADAVEK:
"${userMessage || '(prázdný požadavek)'}"

📊 KONTEXT:
- Současný kód: ${codeLength || 0} znaků, ${lineCount || 0} řádků
- Požadavek obsahuje: ${wordCount} slov

🎯 TVŮJ ÚKOL:
Analyzuj požadavek a urči který přístup/prompty použít.

📚 DOSTUPNÉ PROMPTY:

1. 🐛 DEBUG MODE
   Kdy: Oprava chyb, bugs, errors, nefunkčnost
   Příklad: "Tlačítko nefunguje", "Console error"

2. 🎨 STYLE MODE
   Kdy: Design, CSS, barvy, layout, responzivní
   Příklad: "Změň barvu na modrou", "Moderní design"

3. ♻️ REFACTOR MODE
   Kdy: Vyčištění kódu, optimalizace struktury, DRY
   Příklad: "Refaktoruj", "Vyčisti kód"

4. ➕ ADD FEATURE MODE
   Kdy: Přidání nové funkce/prvku
   Příklad: "Přidej dark mode", "Implementuj timer"

5. 📝 DOCUMENTATION MODE
   Kdy: Komentáře, JSDoc, vysvětlení
   Příklad: "Přidej komentáře", "Dokumentuj funkce"

6. 🧪 TESTING MODE
   Kdy: Testy, validace, edge cases
   Příklad: "Validace emailu", "Unit testy"

7. 🔧 PERFORMANCE MODE
   Kdy: Zrychlení, optimalizace rychlosti
   Příklad: "Je to pomalé", "Optimalizuj performance"

8. ⚠️ EDIT MODE
   Kdy: Obecné úpravy existujícího kódu
   Příklad: "Změň text", "Uprav hodnotu"

9. 🆕 NEW PROJECT MODE
   Kdy: Vytvoření nové aplikace od začátku
   Příklad: "Vytvoř kalkulačku", "Todo list"

🎯 INSTRUKCE:
1. Analyzuj požadavek uživatele
2. Urči který prompt(y) jsou nejvhodnější
3. Pokud je potřeba více promptů, specifikuj pořadí
4. Poté PROVEĎ úkol podle vybraného promptu!

📝 FORMÁT ODPOVĚDI:

KROK 1 - ANALÝZA:
[Krátká analýza co uživatel chce]

KROK 2 - VYBRANÝ PROMPT:
[Ikona a název promptu, např: "🎨 STYLE MODE"]

KROK 3 - DŮVOD:
[Proč je tento prompt nejvhodnější]

KROK 4 - ŘEŠENÍ:
[Nyní VYKONEJ úkol podle vybraného promptu - vrať EDIT:LINES nebo celý kód]

💡 PŘÍKLAD:

KROK 1 - ANALÝZA:
Uživatel chce změnit vzhled tlačítek a přidat hover efekt.

KROK 2 - VYBRANÝ PROMPT:
🎨 STYLE MODE

KROK 3 - DŮVOD:
Požadavek se týká čistě CSS/designu, žádné strukturální změny.

KROK 4 - ŘEŠENÍ:
\\\`\\\`\\\`EDIT:LINES:45-47
OLD:
.button { background: blue; }
NEW:
.button {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  transition: transform 0.3s;
}
.button:hover {
  transform: translateY(-2px);
}
\\\`\\\`\\\`

⚠️ DŮLEŽITÉ:
- Po analýze PROVEĎ úkol!
- Nejen popisuj co by se mělo udělat
- Vrať konkrétní kód/změny!`;
  }

  /**
   * Intelligent prompt selection based on context and user intent
   * Analyzes user message and code state to select optimal prompt
   *
   * @param {string} userMessage - User's request
   * @param {boolean} hasCode - Whether editor has code
   * @param {boolean} hasHistory - Whether editor has change history
   * @param {string} currentCode - Current editor code
   * @returns {string} Selected prompt text
   */
  selectPromptByContext(userMessage, hasCode, hasHistory, currentCode) {
    const msg = userMessage ? userMessage.toLowerCase() : '';
    const codeLength = currentCode ? currentCode.length : 0;
    const lineCount = currentCode ? currentCode.split('\n').length : 0;

    // ⚠️ KRITICKÉ PRAVIDLO PRO VŠECHNY PROMPTY
    const CRITICAL_FORMAT_RULE = `🚨 ABSOLUTNÍ ZÁKAZ VYSVĚTLOVÁNÍ! 🚨

❌ NIKDY NESMÍŠ:
- Psát "Timto změním...", "Tady je úprava...", "Provedu změnu..."
- Vysvětlovat co děláš PŘED kódem
- Psát jakýkoliv český text mimo EDIT:LINES bloky
- Popisovat změny slovy
- Používat zkratky "// ...", "/* ... */", "..." v OLD blocích

✅ JEDINÁ POVOLENÁ ODPOVĚĎ:
\\\`\\\`\\\`EDIT:LINES:1-5
OLD:
[PŘESNÝ původní kód - kopie z editoru!]
NEW:
[nový kód]
\\\`\\\`\\\`

🚨 KRITICKÉ - OLD BLOK:
- Musí obsahovat PŘESNÝ kód z editoru
- NIKDY nepoužívej "// ...", "/* ... */", "...zkráceno..."
- Zkopíruj CELÝ kód z daných řádků (vidíš ho výše s čísly řádků)
- Pokud kód je zkrácený a nevidíš tu část, POŽÁDEJ o zobrazení

⚠️ KDYŽ PŘIDÁVÁŠ KÓD (ne jen upravuješ):
- OLD blok MUSÍ obsahovat i řádky KOLEM, ne jen jeden řádek!
- Špatně: EDIT:LINES:60-60 s OLD:"border:none;" a NEW:"border:none; + 50 řádků nového kódu"
- Správně: EDIT:LINES:60-65 s OLD:"border:none;\n}\n\n.card {\n..." a NEW:"border:none;\n}\n\n/* NEW */.calc{...}\n\n.card{\n..."
- Počet řádků v OLD určuje, kolik řádků se NAHRADÍ! Pokud OLD má 1 řádek, nahradí se 1 řádek!
- Když přidáváš nový blok kódu, zahrň do OLD i následující řádky, které chceš zachovat

⚠️ ZKRÁCENÝ KÓD:
- Pokud vidíš "🔽 ZKRÁCENO" a "ŘÁDKY X-Y NEJSOU VIDITELNÉ", NESMĚJ editovat ty řádky!
- Pro editaci neviditelných řádků napiš: "Potřebuji vidět celý soubor pro editaci řádků X-Y"
- Edituj JEN ty řádky, které vidíš s čísly v levé části!

IHNED začni s \\\`\\\`\\\`EDIT:LINES! Žádné slovo navíc!

📍 DŮLEŽITÉ - KDE CO HLEDAT:
- "změň název/titulek stránky" → <title> tag (v <head>)
- "změň nadpis/popis/text na stránce" → <h1>, <h2>, <p> tagy (v <body>)
- "přidej text" → do <body>, ne do <title>
────────────────────────────────────────────────────
`;

    // 1. 🐛 DEBUG MODE - Error fixing & debugging
    if (msg.match(/\b(nefunguje|chyba|error|bug|oprav|fix|debug|console)\b/)) {
      return `${CRITICAL_FORMAT_RULE}

🐛 DEBUG & ERROR FIXING

📊 ANALÝZA KÓDU:
- Celkem: ${codeLength} znaků, ${lineCount} řádků
- Hledej syntax errors, runtime errors, logic bugs

🔍 TVŮJ ÚKOL:
IHNED vrať EDIT:LINES bloky s opravami. ŽÁDNÉ vysvětlování!

\\\`\\\`\\\`EDIT:LINES:X-Y
OLD:
<kód s chybou>
NEW:
<opravený kód>
\\\`\\\`\\\`

❌ ZAKÁZÁNO:
- Psát "Problém je...", "Chyba je v..."
- Vysvětlovat co děláš
- Psát kroky nebo instrukce

✅ SPRÁVNĚ:
Pouze EDIT:LINES bloky, žádný další text!`;
    }

    // 2. 🎨 STYLE MODE - CSS & Design changes
    if (msg.match(/\b(barva|color|design|styl|style|css|vzhled|font|velikost|layout|responzivní|mobile)\b/)) {
      return `${CRITICAL_FORMAT_RULE}

🎨 DESIGN & STYLING

📊 KONTEXT:
- ${lineCount} řádků kódu
- Změny se týkají jen vizuální stránky

🎯 TVŮJ ÚKOL:
IHNED vrať EDIT:LINES bloky se CSS změnami. BEZ vysvětlení!

PŘÍKLAD:
\\\`\\\`\\\`EDIT:LINES:45-47
OLD:
.button {
  background: blue;
  color: white;
}
NEW:
.button {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 8px;
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
}
\\\`\\\`\\\`

💡 BEST PRACTICES:
- Moderní CSS (flexbox, grid, custom properties)
- Responzivní design (media queries)
- Accessibility (kontrast, focus states)
- Smooth transitions
- Mobile-first approach

✅ FORMÁT: Jen EDIT:LINES bloky se CSS změnami`;
    }

    // 3. ♻️ REFACTOR MODE - Code optimization & cleanup
    if (msg.match(/\b(optimalizuj|refactor|vyčisti|cleanup|zlepši|improve|reorganizuj|clean)\b/)) {
      return `${CRITICAL_FORMAT_RULE}

♻️ CODE REFACTORING & OPTIMIZATION

📊 SOUČASNÝ STAV:
- ${codeLength} znaků, ${lineCount} řádků
- Cíl: Lepší čitelnost, performance, maintainability

🎯 TVŮJ ÚKOL:
Refaktoruj kód pomocí EDIT:LINES formátu.

ZAMĚŘ SE NA:
✅ DRY (Don't Repeat Yourself)
✅ Jednodušší funkce (max 20 řádků)
✅ Výstižné názvy proměnných
✅ Odstranění dead code
✅ Modern ES6+ syntax (arrow functions, destructuring)
✅ Performance optimizations
✅ Better error handling

PŘÍKLAD:
\\\`\\\`\\\`EDIT:LINES:23-30
OLD:
function calculate(a, b, operation) {
  if (operation === 'add') return a + b;
  if (operation === 'subtract') return a - b;
  if (operation === 'multiply') return a * b;
  if (operation === 'divide') return a / b;
}
NEW:
const operations = {
  add: (a, b) => a + b,
  subtract: (a, b) => a - b,
  multiply: (a, b) => a * b,
  divide: (a, b) => b !== 0 ? a / b : null
};
const calculate = (a, b, operation) => operations[operation]?.(a, b) ?? null;
\\\`\\\`\\\`

✅ FORMÁT: Jen EDIT:LINES bloky s refactorovaným kódem`;
    }

    // 4. ➕ ADD FEATURE - New functionality
    if (msg.match(/\b(přidej|add|nový|new|implementuj|implement|vytvoř|create|feature|funkc)\b/)) {
      return `${CRITICAL_FORMAT_RULE}

➕ ADD NEW FEATURE

📊 KONTEXT:
- Existující kód: ${lineCount} řádků
- Přidáváš novou funkčnost

🎯 TVŮJ ÚKOL:
Přidej novou funkci/feature pomocí EDIT:LINES formátu.

KROKY:
1. Najdi správné místo v kódu
2. Přidej HTML strukturu (pokud potřeba)
3. Přidej CSS styling
4. Přidej JavaScript logiku

🚨 KRITICKÉ PRO PŘIDÁVÁNÍ KÓDU:
- Když přidáváš nový blok, MUSÍŠ zahrnout do OLD i následující řádky!
- OLD řádky = kolik řádků se NAHRADÍ (ne přidá!)
- Pokud OLD má 1 řádek a NEW má 20 řádků, nahradí se JEN 1 řádek → zbytek se přidá
- Ale pokud po tom řádku následují další, budou duplikáty!

PŘÍKLAD SPRÁVNĚ (přidání kalkulačky do CSS):
\\\`\\\`\\\`EDIT:LINES:58-65
OLD:
  border: none;
}

.card {
  background: rgba(0,0,0,0.65);
  border-radius: 12px;
NEW:
  border: none;
}

/* Calculator section */
.calculator-card {
  background: rgba(0,0,0,0.7);
  padding: 20px;
}

.card {
  background: rgba(0,0,0,0.65);
  border-radius: 12px;
\\\`\\\`\\\`

❌ ŠPATNĚ (nahradí jen 1 řádek, zbytek duplikuje):
\\\`\\\`\\\`EDIT:LINES:60-60
OLD:
border: none;
NEW:
border: none;
}
/* 50 řádků nového kódu */
.card {
\\\`\\\`\\\`

💡 BEST PRACTICES:
- Nesmaž existující funkce
- Nové ID/classes musí být unikátní
- Event listeners správně připojené
- Error handling pro nové featury
- Accessibility (ARIA labels)

✅ FORMÁT: Jen EDIT:LINES bloky s novou funkčností`;
    }

    // 5. 📝 DOCUMENTATION MODE - Comments & docs
    if (msg.match(/\b(komentář|comment|dokumentace|documentation|doc|vysvětli|explain|popis)\b/)) {
      return `${CRITICAL_FORMAT_RULE}

📝 DOCUMENTATION & COMMENTS

📊 KONTEXT:
- ${lineCount} řádků kódu k dokumentování

🎯 TVŮJ ÚKOL:
Přidej kvalitní dokumentaci a komentáře pomocí EDIT:LINES.

CO PŘIDAT:
✅ JSDoc pro funkce
✅ Inline komentáře pro složitou logiku
✅ TODO/FIXME/NOTE značky
✅ Vysvětlení algoritmů
✅ Popis parametrů a return values

PŘÍKLAD:
\\\`\\\`\\\`EDIT:LINES:34-36
OLD:
function processData(data) {
  return data.filter(x => x.active).map(x => x.value);
}
NEW:
/**
 * Processes raw data by filtering active items and extracting values
 * @param {Array<{active: boolean, value: any}>} data - Input data array
 * @returns {Array} Array of values from active items
 */
function processData(data) {
  // Filter only active items and extract their values
  return data.filter(x => x.active).map(x => x.value);
}
\\\`\\\`\\\`

💡 STYLE GUIDE:
- Stručné ale výstižné
- Česky nebo anglicky (konzistentně)
- Vysvětli "proč", ne jen "co"

✅ FORMÁT: Jen EDIT:LINES bloky s dokumentací`;
    }

    // 6. 🧪 TESTING MODE - Unit tests
    if (msg.match(/\b(test|testing|unit test|test case|testuj|validace|validation)\b/)) {
      return `${CRITICAL_FORMAT_RULE}

🧪 TESTING & VALIDATION

📊 KONTEXT:
- ${lineCount} řádků kódu k otestování

🎯 TVŮJ ÚKOL:
Přidej testy nebo validaci pomocí EDIT:LINES formátu.

PŘÍKLAD (přidání validace formuláře):
\\\`\\\`\\\`EDIT:LINES:45-47
OLD:
submitBtn.addEventListener('click', () => {
  sendData(inputField.value);
});
NEW:
submitBtn.addEventListener('click', () => {
  const value = inputField.value.trim();

  // Validation
  if (!value) {
    showError('Pole nesmí být prázdné');
    return;
  }
  if (value.length < 3) {
    showError('Minimálně 3 znaky');
    return;
  }
  if (!/^[a-zA-Z0-9]+$/.test(value)) {
    showError('Jen alfanumerické znaky');
    return;
  }

  sendData(value);
});
\\\`\\\`\\\`

💡 CO TESTOVAT:
- Input validace
- Edge cases (prázdné hodnoty, null, undefined)
- Boundary conditions
- Error scenarios
- Happy path scenarios

✅ FORMÁT: Jen EDIT:LINES bloky s testy/validací`;
    }

    // 7. 🔧 PERFORMANCE MODE - Speed optimization
    if (msg.match(/\b(performance|rychlost|speed|optimalizace|optimize|pomalý|slow|zrychli)\b/)) {
      return `${CRITICAL_FORMAT_RULE}

🔧 PERFORMANCE OPTIMIZATION

📊 ANALÝZA:
- ${lineCount} řádků kódu
- Cíl: Zlepšit rychlost a efektivitu

🎯 TVŮJ ÚKOL:
Optimalizuj performance pomocí EDIT:LINES formátu.

ZAMĚŘ SE NA:
✅ Debouncing/Throttling
✅ Lazy loading
✅ Event delegation
✅ Caching výsledků
✅ Reduce DOM manipulations
✅ Use fragments for multiple inserts
✅ Async operations
✅ Memory leaks prevention

PŘÍKLAD (debouncing):
\\\`\\\`\\\`EDIT:LINES:56-58
OLD:
searchInput.addEventListener('input', (e) => {
  performSearch(e.target.value);
});
NEW:
const debounce = (fn, delay) => {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => fn(...args), delay);
  };
};

searchInput.addEventListener('input', debounce((e) => {
  performSearch(e.target.value);
}, 300));
\\\`\\\`\\\`

💡 TECHNIKY:
- Minimalizuj repaints/reflows
- Use requestAnimationFrame for animations
- Batch DOM updates
- Remove unused event listeners

✅ FORMÁT: Jen EDIT:LINES bloky s optimalizacemi`;
    }

    // 8. 🤔 AMBIGUOUS - Ask AI to determine best prompt
    // Check if message is complex/ambiguous and no clear pattern matched
    const wordCount = userMessage ? userMessage.split(/\s+/).length : 0;
    const hasMultipleIntents = userMessage ? userMessage.match(/a zároveň|a také|plus|navíc|ještě/) : false;

    if (wordCount > 15 || hasMultipleIntents) {
      // Complex request - let AI analyze and choose
      return this.getPromptSelectionMetaPrompt(userMessage, codeLength, lineCount);
    }

    // 9. DEFAULT: EDIT MODE (existing code) vs NEW PROJECT
    if (hasCode) {
      // Pokud má existující kód (i bez historie), použij EDIT MODE
      return `${CRITICAL_FORMAT_RULE}

⚠️ EDITACE EXISTUJÍCÍHO KÓDU (${codeLength} znaků, ${lineCount} řádků)

🚨 POVINNÝ FORMÁT - AUTOMATICKÝ SYSTÉM 🚨

System automaticky aplikuje změny podle tohoto formátu:

\\\`\\\`\\\`EDIT:LINES:5-5
OLD:
<title>Původní název</title>
NEW:
<title>Nový název</title>
\\\`\\\`\\\`

\\\`\\\`\\\`EDIT:LINES:35-37
OLD:
<h2>Původní nadpis</h2>
<p>Původní text</p>
NEW:
<h2>Nový nadpis</h2>
<p>Nový text s více detaily</p>
\\\`\\\`\\\`

💡 PRAVIDLA:
- Každá změna = blok \\\`\\\`\\\`EDIT:LINES:X-Y (X-Y = čísla řádků)
- OLD: PŘESNÝ kód z editoru - NIKDY nepoužívej "// ...", "/* ... */", "..."
- NEW: nový kód (může být víc/míň řádků)
- System najde OLD, ověří a nahradí za NEW
- Vidíš čísla řádků v kódu výše - zkopíruj PŘESNĚ z těch řádků!

🚨 KRITICKÉ - JAK PSÁT OLD BLOK:
1. Najdi čísla řádků v kódu výše (např. "  50| <div>...")
2. Zkopíruj CELÝ kód z těch řádků (bez čísla řádku)
3. NIKDY nepoužívej zkratky "// ...", "/* ... */", "...zkráceno..."
4. Pokud kód není viditelný (zkrácený), ŘEKNI: "Prosím zobraz řádky X-Y"

PŘÍKLAD SPRÁVNĚ:
\\\`\\\`\\\`EDIT:LINES:50-52
OLD:
<div class="card">
    <h2>Nadpis</h2>
</div>
NEW:
<div class="card active">
    <h2>Nový nadpis</h2>
</div>
\\\`\\\`\\\`

PŘÍKLAD ŠPATNĚ ❌:
\\\`\\\`\\\`EDIT:LINES:50-52
OLD:
<div class="card">
    // ...
</div>
NEW:
...
\\\`\\\`\\\`

⚠️ DŮLEŽITÉ PRO STAŽENÉ/EXTERNÍ SOUBORY:
- Tento kód může být z GitHubu nebo jiného zdroje
- Může být zkrácen kvůli velikosti
- OLD bloky musí přesně odpovídat zobrazené části kódu
- Pokud potřebuješ vidět více kódu, požádej uživatele o konkrétní část

❌ ZAKÁZÁNO:
- Vracet celý soubor (bude zkrácen!)
- Psát "...zkráceno" nebo "...rest of code..." v NEW blocích
- Psát "**Krok 1:**" nebo vysvětlení
- Psát "Timto změním...", "Potřeba provést..."
- JAKÉKOLIV vysvětlování místo kódu!

✅ SPRÁVNĚ:
- IHNED začni s \\\`\\\`\\\`EDIT:LINES:X-Y
- Jen EDIT:LINES bloky, žádný text navíc
- Každá změna = samostatný blok
- Pracuj jen s viditelnou částí kódu`;
    } else {
      // NEW PROJECT - editor je prázdný
      return `${CRITICAL_FORMAT_RULE}

🆕 NOVÝ PROJEKT - Vytvoř kompletní funkční aplikaci

📋 POŽADAVKY:
- Vytvoř CELÝ soubor od <!DOCTYPE html> až po </html>
- Zahrň všechny sekce: <head>, <style>, <body>, <script>
- CSS v <style> tagu v <head>
- JavaScript v <script> tagu před </body>
- Kompletní funkčnost - všechno musí fungovat!
- Moderní, responzivní design
- Interaktivní prvky (formuláře, tlačítka, atd.)

✅ MUSÍ OBSAHOVAT:
- Úplnou HTML strukturu
- Styling pro všechny prvky
- JavaScript pro interaktivitu
- Event listenery správně připojené
- Validaci vstupů
- Error handling

❌ NEPIŠ:
- "...zkráceno" - vrať všechno!
- Částečný kód
- Jen HTML bez funkčnosti

💡 TIP: Kód může být i 1000+ řádků, token limit to zvládne!`;
    }
  }

  /**
   * Parse EDIT:LINES instructions from AI response
   * Format: ```EDIT:LINES:5-10
   *         OLD:
   *         <old code>
   *         NEW:
   *         <new code>
   *         ```
   *
   * @param {string} response - AI response text
   * @returns {Array} Array of edit objects with {startLine, endLine, oldCode, newCode}
   */
  parseEditInstructions(response) {
    if (!response) return [];

    // Parse EDIT:LINES blocks from AI response
    // Try multiple patterns to catch various AI formatting mistakes
    const patterns = [
      // Standard format with triple backticks
      /```EDIT:LINES:(\d+)-(\d+)\s+OLD:\s*([\s\S]*?)\s*NEW:\s*([\s\S]*?)\s*```/g,
      // With escaped backticks
      /\`\`\`EDIT:LINES:(\d+)-(\d+)\s+OLD:\s*([\s\S]*?)\s*NEW:\s*([\s\S]*?)\s*\`\`\`/g,
      // Without backticks
      /EDIT:LINES:(\d+)-(\d+)\s+OLD:\s*([\s\S]*?)\s*NEW:\s*([\s\S]*?)(?=EDIT:LINES:|$)/g,
      // Missing "EDIT" prefix (just :LINES:)
      /:LINES:(\d+)-(\d+)\s+OLD:\s*([\s\S]*?)\s*NEW:\s*([\s\S]*?)(?::LINES:|$)/g,
      // With newlines after OLD: and NEW:
      /EDIT:LINES:(\d+)-(\d+)\s*\n\s*OLD:\s*\n([\s\S]*?)\s*\n\s*NEW:\s*\n([\s\S]*?)(?=EDIT:LINES:|$)/g
    ];

    const edits = [];

    for (const editPattern of patterns) {
      const regex = new RegExp(editPattern);
      let match;
      while ((match = regex.exec(response)) !== null) {
        const oldCode = match[3].trim();
        const newCode = match[4].trim();

        // Validate OLD code - reject empty or placeholder content
        if (!oldCode || oldCode === '...' || oldCode === '// ...' || oldCode === '/* ... */' ||
            oldCode.includes('...') && oldCode.length < 10) {
          console.warn(`⚠️ Ignoruji EDIT:LINES ${match[1]}-${match[2]}: OLD blok je prázdný nebo obsahuje zkratky`);
          continue;
        }

        edits.push({
          startLine: parseInt(match[1]),
          endLine: parseInt(match[2]),
          oldCode: oldCode,
          newCode: newCode
        });
      }
      if (edits.length > 0) {
        console.log(`✅ Detekováno ${edits.length} změn pomocí pattern #${patterns.indexOf(editPattern) + 1}`);
        break; // Found matches, stop trying other patterns
      }
    }

    if (edits.length === 0) {
      console.warn('⚠️ Žádné EDIT:LINES bloky nebyly detekovány. AI možná ignoruje prompt formát!');
      console.warn('💡 Možný důvod: OLD bloky obsahují zkratky "...", "// ...", což je zakázáno!');
    }

    return edits;
  }

  /**
   * Apply line-based edits to current editor code
   * Validates OLD code matches before applying NEW code
   * Sorts edits in reverse order to prevent line number shifts
   *
   * @param {Array} edits - Array of {startLine, endLine, oldCode, newCode}
   * @returns {boolean} True if at least one edit was applied
   */
  applyLineEdits(edits) {
    if (!edits || edits.length === 0) {
      console.warn('⚠️ Žádné EDIT:LINES bloky k aplikaci');
      return false;
    }

    const currentCode = state.get('editor.code');
    if (!currentCode) {
      toast.error('Editor je prázdný - nelze aplikovat změny');
      return false;
    }

    const lines = currentCode.split('\n');
    let appliedCount = 0;
    let failedEdits = [];

    // Sort edits by line number (descending) to avoid line number shifts
    // Aplikujeme změny od konce k začátku, aby se čísla řádků neměnila
    edits.sort((a, b) => b.startLine - a.startLine);

    console.log(`📝 Aplikuji ${edits.length} změn od konce k začátku (aby se čísla řádků neměnila):`,
      edits.map(e => `${e.startLine}-${e.endLine}`).join(', '));

    for (const edit of edits) {
      const { startLine, endLine, oldCode, newCode } = edit;

      // Validate line numbers
      if (startLine < 1 || endLine > lines.length || startLine > endLine) {
        failedEdits.push(`Řádky ${startLine}-${endLine}: Neplatný rozsah`);
        continue;
      }

      // Get current code at those lines
      const actualCode = lines.slice(startLine - 1, endLine).join('\n');

      // Verify OLD code matches
      if (actualCode.trim() !== oldCode.trim()) {
        const expectedPreview = oldCode.length > 50 ? oldCode.substring(0, 50) + '...' : oldCode;
        const actualPreview = actualCode.length > 50 ? actualCode.substring(0, 50) + '...' : actualCode;

        // Show detailed error with option to see full context
        console.error(`❌ Řádky ${startLine}-${endLine}: OLD kód nesedí`);
        console.log('📋 Očekáváno AI:', oldCode);
        console.log('📄 Skutečný kód:', actualCode);

        // Try fuzzy match - maybe just whitespace differs
        const actualNormalized = actualCode.replace(/\s+/g, ' ').trim();
        const oldNormalized = oldCode.replace(/\s+/g, ' ').trim();

        if (actualNormalized === oldNormalized) {
          console.log('✓ Whitespace mismatch - aplikuji stejně');
          // Continue with the change (but don't skip the apply logic below)
        } else {
          // Try to find similar content nearby (within 10 lines for larger files)
          const totalLines = lines.length;
          const searchRange = Math.min(10, Math.floor(totalLines / 100));
          let foundMatch = false;

          for (let offset = -searchRange; offset <= searchRange; offset++) {
            if (offset === 0) continue;
            const offsetStart = startLine + offset - 1;
            const offsetEnd = endLine + offset;
            if (offsetStart < 0 || offsetEnd > lines.length) continue;

            const offsetCode = lines.slice(offsetStart, offsetEnd).join('\n');
            const offsetNormalized = offsetCode.replace(/\s+/g, ' ').trim();

            // Exact match after normalization
            if (offsetNormalized === oldNormalized) {
              console.log(`✓ Našel jsem shodu na řádcích ${offsetStart + 1}-${offsetEnd} (offset ${offset})`);
              // Apply change at correct location
              const newLines = newCode.split('\n');
              lines.splice(offsetStart, offsetEnd - offsetStart, ...newLines);
              appliedCount++;
              foundMatch = true;
              break;
            }

            // Partial match (obsahuje alespoň 90% stejného textu)
            if (!foundMatch && oldCode.length > 20) {
              const similarity = this.calculateSimilarity(offsetNormalized, oldNormalized);
              if (similarity > 0.90) {
                console.log(`✓ Našel jsem podobnou shodu (${Math.round(similarity * 100)}%) na řádcích ${offsetStart + 1}-${offsetEnd}`);
                const newLines = newCode.split('\n');
                lines.splice(offsetStart, offsetEnd - offsetStart, ...newLines);
                appliedCount++;
                foundMatch = true;
                break;
              }
            }
          }

          if (!foundMatch) {
            failedEdits.push({
              lines: `${startLine}-${endLine}`,
              reason: 'OLD kód nesedí',
              expected: expectedPreview,
              actual: actualPreview,
              fullExpected: oldCode,
              fullActual: actualCode,
              newCode: newCode
            });
            continue;
          }
        }
      } else {
        // Apply change normally
        const newLines = newCode.split('\n');
        lines.splice(startLine - 1, endLine - startLine + 1, ...newLines);
        appliedCount++;
      }

      // Apply change
      const newLines = newCode.split('\n');
      lines.splice(startLine - 1, endLine - startLine + 1, ...newLines);
      appliedCount++;
    }

    if (failedEdits.length > 0) {
      console.warn('⚠️ Některé změny selhaly:', failedEdits);

      // Show failed edits with context in console
      failedEdits.forEach((f, i) => {
        console.group(`❌ Změna #${i + 1} (řádky ${f.lines})`);
        console.log('📝 Aktuální kód v editoru:');
        console.log(f.fullActual);
        console.log('\n💡 Co chce AI nahradit (nesedí):');
        console.log(f.fullExpected);
        console.log('\n✨ Nový kód od AI:');
        console.log(f.newCode);
        console.groupEnd();
      });

      // Create interactive error UI
      const errorDetails = failedEdits.map((f, i) => {
        return `
          <div class="failed-edit" style="margin-bottom: 15px; padding: 10px; background: #2a2a2a; border-left: 3px solid #f59e0b; border-radius: 4px;">
            <div style="font-weight: bold; margin-bottom: 8px;">❌ Změna #${i + 1} (řádky ${f.lines})</div>
            <div style="margin-bottom: 5px; font-size: 0.9em; color: #999;">
              <strong>📄 Aktuální kód v editoru:</strong>
            </div>
            <pre style="background: #1a1a1a; padding: 8px; border-radius: 3px; overflow-x: auto; font-size: 0.85em;">${this.escapeHtml(f.fullActual)}</pre>

            <div style="margin: 10px 0 5px; font-size: 0.9em; color: #999;">
              <strong>💡 Co AI chce nahradit (nesedí):</strong>
            </div>
            <pre style="background: #1a1a1a; padding: 8px; border-radius: 3px; overflow-x: auto; font-size: 0.85em;">${this.escapeHtml(f.fullExpected)}</pre>

            <div style="margin: 10px 0 5px; font-size: 0.9em; color: #999;">
              <strong>✨ Nový kód od AI:</strong>
            </div>
            <pre style="background: #1a1a1a; padding: 8px; border-radius: 3px; overflow-x: auto; font-size: 0.85em;">${this.escapeHtml(f.newCode)}</pre>

            <button class="apply-manual-btn" data-newcode="${this.escapeHtml(f.newCode)}" style="margin-top: 10px; padding: 6px 12px; background: #10b981; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 0.9em;">
              📋 Zkopírovat nový kód
            </button>
          </div>
        `;
      }).join('');

      const modalContent = `
        <div style="max-height: 60vh; overflow-y: auto; padding: 10px;">
          <div style="margin-bottom: 15px; padding: 12px; background: #1a1a1a; border-radius: 6px;">
            <div style="font-size: 1.1em; margin-bottom: 8px;">
              ${appliedCount > 0
                ? `⚠️ <strong>${appliedCount}/${edits.length} změn aplikováno</strong>`
                : '❌ <strong>Nepodařilo se aplikovat změny</strong>'}
            </div>
            <div style="color: #999; font-size: 0.95em;">
              Kód v editoru se liší od očekávání AI. Možná byl mezitím změněn nebo AI neviděla aktuální verzi.
            </div>
          </div>

          <div style="margin-bottom: 15px;">
            <strong>💡 Co dělat:</strong>
            <ul style="margin: 8px 0; padding-left: 20px; color: #999;">
              <li>Zkus požádat znovu s aktuálním stavem kódu</li>
              <li>Nebo upřesni co chceš změnit</li>
              <li>Můžeš zkopírovat navržený kód níže a vložit ručně</li>
            </ul>
          </div>

          ${errorDetails}
        </div>
      `;

      // Create modal for errors
      const errorModal = new Modal({
        title: `${appliedCount > 0 ? '⚠️ Částečné selhání' : '❌ Změny nelze aplikovat'}`,
        content: modalContent,
        className: 'failed-edits-modal',
        size: 'large'
      });

      errorModal.create();
      errorModal.open();

      // Add event listeners for copy buttons
      setTimeout(() => {
        const copyButtons = errorModal.element.querySelectorAll('.apply-manual-btn');
        copyButtons.forEach(btn => {
          btn.addEventListener('click', (e) => {
            const newCode = e.target.dataset.newcode;
            const decoded = this.unescapeHtml(newCode);
            navigator.clipboard.writeText(decoded).then(() => {
              toast.success('✅ Kód zkopírován do schránky', 2000);
              e.target.textContent = '✓ Zkopírováno!';
              e.target.style.background = '#059669';
              setTimeout(() => {
                e.target.textContent = '📋 Zkopírovat nový kód';
                e.target.style.background = '#10b981';
              }, 2000);
            });
          });
        });
      }, 100);

      if (appliedCount === 0) {
        return false;
      }
    } else if (appliedCount > 0) {
      toast.success(`✅ Aplikováno ${appliedCount} změn automaticky`, 3000);
    }

    // Update editor with undo support
    const newCode = lines.join('\n');
    const editor = document.querySelector('.editor-container')?.__editor;

    if (editor) {
      // Save current state to history BEFORE making changes
      const currentEditorCode = editor.getCode();
      console.log('📝 Před AI změnou - aktuální kód:', currentEditorCode.substring(0, 100) + '...');

      if (currentEditorCode && editor.history) {
        const last = editor.history.past[editor.history.past.length - 1];
        console.log('📝 Historie před změnou:', editor.history.past.length, 'kroků');

        if (currentEditorCode !== last) {
          editor.history.past.push(currentEditorCode);
          if (editor.history.past.length > editor.history.maxSize) {
            editor.history.past.shift();
          }
          editor.history.future = []; // Clear redo stack
          console.log('✅ Uloženo do historie - nyní:', editor.history.past.length, 'kroků');
        } else {
          console.log('⚠️ Kód už je v historii - neukládám duplicitně');
        }
      }

      // Apply new code - use setCode without skip to trigger normal flow
      // But don't save to history again (we just did above)
      editor.isUndoRedoInProgress = true;
      editor.setCode(newCode, true); // Skip state update
      editor.isUndoRedoInProgress = false;

      // Manually update state
      state.set('editor.code', newCode);

      console.log(`💾 Undo historie po změně: ${editor.history?.past?.length || 0} kroků`);
    } else {
      console.error('❌ Editor nenalezen - nelze uložit do historie');
    }
  }

  addLineNumbers(code, metadata = null) {
    if (!code) return '';
    const lines = code.split('\n');

    if (!metadata || !metadata.isTruncated) {
      // Normal numbering
      return lines.map((line, i) => `${String(i + 1).padStart(4, ' ')}| ${line}`).join('\n');
    }

    // Truncated code - preserve original line numbers
    const result = [];
    let currentLine = 1;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Check if this is the truncation marker
      if (line.includes('🔽 ZKRÁCENO')) {
        result.push(`     | ${line}`);
        // Add warning about missing lines
        const missingStart = metadata.topLinesCount + 1;
        const missingEnd = metadata.bottomStartLine - 1;
        result.push(`     | ⚠️ ŘÁDKY ${missingStart}-${missingEnd} NEJSOU VIDITELNÉ! ⚠️`);
        result.push(`     | ⚠️ PRO EDITACI TĚCHTO ŘÁDKŮ POŽÁDEJ O ZOBRAZENÍ CELÉHO SOUBORU! ⚠️`);
        // Jump to bottom section line numbers
        currentLine = metadata.bottomStartLine;
      } else {
        result.push(`${String(currentLine).padStart(4, ' ')}| ${line}`);
        currentLine++;
      }
    }

    return result.join('\n');
  }

  /**
   * Truncate code intelligently - show beginning, end, and indicate middle is truncated
   * Returns object with code and metadata about line numbers
   */
  truncateCodeIntelligently(code, maxChars = 3000) {
    if (!code || code.length <= maxChars) {
      return { code, isTruncated: false, topLinesCount: 0, bottomStartLine: 0 };
    }

    const lines = code.split('\n');
    const totalLines = lines.length;

    // Show first ~45% and last ~45% of allowed space (více prostoru pro kontext)
    const charsPerSection = Math.floor(maxChars * 0.45);

    let topLines = [];
    let bottomLines = [];
    let topChars = 0;
    let bottomChars = 0;

    // Get top lines (včetně <head> a začátku <body>)
    for (let i = 0; i < lines.length; i++) {
      if (topChars + lines[i].length + 1 > charsPerSection) break;
      topLines.push(lines[i]);
      topChars += lines[i].length + 1;
    }

    // Get bottom lines (včetně <script> a </html>)
    for (let i = lines.length - 1; i >= 0; i--) {
      if (bottomChars + lines[i].length + 1 > charsPerSection) break;
      bottomLines.unshift(lines[i]);
      bottomChars += lines[i].length + 1;
    }

    const truncatedLineCount = totalLines - topLines.length - bottomLines.length;
    const middleStartLine = topLines.length + 1;
    const middleEndLine = middleStartLine + truncatedLineCount - 1;
    const bottomStartLine = middleEndLine + 1;

    const truncatedCode = topLines.join('\n') +
      `\n\n... 🔽 ZKRÁCENO ${truncatedLineCount} řádků (${middleStartLine}-${middleEndLine}) 🔽 ...\n` +
      `... ⚠️ Pro úpravy v této oblasti použij přibližná čísla řádků nebo požádej o zobrazení této části ...\n\n` +
      bottomLines.join('\n');

    return {
      code: truncatedCode,
      isTruncated: true,
      topLinesCount: topLines.length,
      bottomStartLine: bottomStartLine,
      totalLines: totalLines
    };
  }

  insertCodeToEditor(code, isModification = false) {
    // Store original code for undo
    this.originalCode = state.get('editor.code');

    // Validate code for duplicate variable declarations
    const duplicates = this.detectDuplicateVariables(code);
    if (duplicates.length > 0) {
      console.error('⚠️ Detekované duplicitní proměnné:', duplicates);
      toast.error(`⚠️ Kód obsahuje duplicitní proměnné: ${duplicates.join(', ')}. Oprav to prosím.`, 5000);

      // Still insert but warn user
      const confirmed = confirm(`⚠️ VAROVÁNÍ: AI vygenerovala kód s duplicitními proměnnými:\n\n${duplicates.join('\n')}\n\nChcete kód přesto vložit? (bude nefunkční)`);
      if (!confirmed) {
        return;
      }
    }

    // Check if this is a complete new project (has DOCTYPE and html tags)
    const isCompleteProject = code.includes('<!DOCTYPE') && code.includes('<html') && code.includes('</html>');

    // Check if current editor has content
    const currentCode = this.originalCode || '';
    const hasExistingContent = currentCode.trim().length > 0;

    // Check if there's chat history - if yes, it's likely a modification
    const hasHistory = this.chatHistory && this.chatHistory.length > 1;

    if (isModification || hasHistory) {
      // This is a modification of existing project
      console.log('✏️ Úprava existujícího projektu - aktualizuji editor');
    } else if (isCompleteProject && hasExistingContent) {
      // Complete replacement for new projects
      console.log('📄 Nový kompletní projekt - nahrazuji obsah editoru');
    } else if (!isCompleteProject && hasExistingContent) {
      // Partial code - could be snippet or continuation
      console.log('➕ Částečný kód - vkládám do editoru');
    }

    // Get editor instance and use skipStateUpdate to prevent loop
    const editor = document.querySelector('.editor-container')?.__editor;
    if (editor && editor.setCode) {
      // DŮLEŽITÉ: Před změnou kódu uložit současný stav do historie
      // Aby fungoval undo (zpět na starý kód)
      if (editor.saveToHistory) {
        editor.saveToHistory();
      }

      editor.setCode(code, true); // Skip state update first
    }

    // Then update state after editor is set
    state.set('editor.code', code);

    // Zavřít AI modal po vložení kódu
    if (this.modal) {
      this.modal.close();
    }

    // Na mobilu - přepnout na preview aby uživatel viděl výsledek
    if (window.innerWidth <= 768) {
      const app = document.querySelector('.app');
      if (app) {
        setTimeout(() => {
          eventBus.emit('view:change', { view: 'preview' });
        }, 150);
      }
    }

    // Show toast - jen pokud není historie (nový projekt)
    const toastMsg = (!hasHistory && isCompleteProject) ? '✅ Nový projekt vytvořen' : '✅ Kód aktualizován';
    if (window.innerWidth <= 768) {
      toast.show(toastMsg + ' - Přepnuto na editor', 'success');
    } else {
      const toastEl = document.querySelector('.toast');
      if (toastEl) {
        toastEl.textContent = toastMsg;
        toastEl.classList.add('show');
        setTimeout(() => toastEl.classList.remove('show'), 2000);
      }
    }
  }

  detectDuplicateVariables(code) {
    const duplicates = [];
    const variableNames = new Map();

    // Find all let/const/var declarations
    const declarationRegex = /(?:let|const|var)\s+([a-zA-ZáčďéěíňóřšťúůýžÁČĎÉĚÍŇÓŘŠŤÚŮÝŽ_$][a-zA-ZáčďéěíňóřšťúůýžÁČĎÉĚÍŇÓŘŠŤÚŮÝŽ0-9_$]*)/g;
    let match;

    while ((match = declarationRegex.exec(code)) !== null) {
      const varName = match[1];
      if (variableNames.has(varName)) {
        variableNames.set(varName, variableNames.get(varName) + 1);
      } else {
        variableNames.set(varName, 1);
      }
    }

    // Find duplicates
    variableNames.forEach((count, name) => {
      if (count > 1) {
        duplicates.push(`${name} (${count}x)`);
      }
    });

    return duplicates;
  }

  handleNewProjectStart() {
    const tabs = state.get('files.tabs') || [];

    if (tabs.length === 0) {
      // No project to save, just reset
      this.resetToNewProject();
      return;
    }

    // Confirm if user wants to save current project
    const confirmSave = confirm('Chcete uložit a stáhnout aktuální projekt před začátkem nového?');

    if (confirmSave) {
      // Download all files as ZIP would be ideal, but for now download active file
      const activeFileId = state.get('files.active');
      const activeFile = tabs.find(f => f.id === activeFileId);

      if (activeFile) {
        // Download the active file
        const blob = new Blob([activeFile.content], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = activeFile.name;
        a.click();
        URL.revokeObjectURL(url);
      }

      // If multiple files, notify user
      if (tabs.length > 1) {
        alert(`Uložen hlavní soubor. Máte ${tabs.length} otevřených souborů. Pro kompletní zálohu použijte GitHub nebo manuální export.`);
      }
    }

    // Reset to new project
    this.resetToNewProject();
  }

  resetToNewProject() {
    // Clear all files
    state.set('files.tabs', []);
    state.set('files.active', null);
    state.set('files.nextId', 1);

    // Clear editor
    const defaultCode = `<!DOCTYPE html>
<html lang="cs">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Nový projekt</title>
  <style>
    body {
      font-family: system-ui, sans-serif;
      padding: 2rem;
      max-width: 800px;
      margin: 0 auto;
    }
  </style>
</head>
<body>
  <h1>Nový projekt</h1>
  <p>Začněte psát svůj kód zde...</p>
</body>
</html>`;

    state.set('editor.code', defaultCode);
    eventBus.emit('editor:setCode', { code: defaultCode });

    // Clear chat history
    this.clearChatHistory();

    toast.show('✨ Nový projekt vytvořen!', 'success');
  }

  clearChatHistory() {
    this.chatHistory = [];
    state.set('ai.chatHistory', []);
    const messagesContainer = this.modal?.element?.querySelector('#aiChatMessages');
    if (messagesContainer) {
      messagesContainer.innerHTML = `
        <div class="ai-message system">
          <p>Historie konverzace byla vymazána. Můžeš začít novou konverzaci!</p>
        </div>
      `;
    }
    this.updateHistoryInfo();
    toast.show('🗑️ Historie konverzace vymazána', 'info');
  }

  restoreChatMessages() {
    if (!this.modal || !this.chatHistory || this.chatHistory.length === 0) {
      return;
    }

    const messagesContainer = this.modal.element.querySelector('#aiChatMessages');
    if (!messagesContainer) return;

    // Vymazat existující zprávy
    messagesContainer.innerHTML = '';

    // Obnovit všechny zprávy z historie
    this.chatHistory.forEach((msg) => {
      if (msg.role === 'user') {
        this.addChatMessage('user', msg.content);
      } else if (msg.role === 'assistant') {
        // Zkontroluj, jestli obsahuje kód (triple backticks)
        const hasCodeBlock = /```[\s\S]*?```/.test(msg.content);
        if (hasCodeBlock) {
          this.addChatMessageWithCode('assistant', msg.content, '', false, msg.codeStatus || {});
        } else {
          this.addChatMessage('assistant', msg.content);
        }
      }
    });

    // Scrollovat na konec
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }

  exportChatHistory() {
    if (this.chatHistory.length === 0) {
      toast.show('⚠️ Žádná konverzace k exportu', 'warning');
      return;
    }

    const exportData = {
      timestamp: new Date().toISOString(),
      messageCount: this.chatHistory.length,
      messages: this.chatHistory.map((msg, idx) => ({
        index: idx + 1,
        role: msg.role,
        content: msg.content,
        timestamp: msg.timestamp || new Date().toISOString()
      }))
    };

    // Export as JSON
    const json = JSON.stringify(exportData, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ai-chat-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);

    toast.show('💾 Konverzace exportována', 'success');
  }

  exportChatAsMarkdown() {
    if (this.chatHistory.length === 0) {
      toast.show('⚠️ Žádná konverzace k exportu', 'warning');
      return;
    }

    let markdown = `# AI Chat Export\n\n`;
    markdown += `**Datum:** ${new Date().toLocaleString('cs-CZ')}\n`;
    markdown += `**Počet zpráv:** ${this.chatHistory.length}\n\n`;
    markdown += `---\n\n`;

    this.chatHistory.forEach((msg, idx) => {
      const role = msg.role === 'user' ? '👤 Uživatel' : '🤖 AI';
      markdown += `## ${idx + 1}. ${role}\n\n`;
      markdown += `${msg.content}\n\n`;
      markdown += `---\n\n`;
    });

    const blob = new Blob([markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ai-chat-${new Date().toISOString().slice(0, 10)}.md`;
    a.click();
    URL.revokeObjectURL(url);

    toast.show('💾 Konverzace exportována jako Markdown', 'success');
  }

  updateHistoryInfo() {
    const historyInfo = this.modal?.element?.querySelector('#chatHistoryInfo');
    if (historyInfo) {
      const messageCount = this.chatHistory.length;
      historyInfo.textContent = `Historie: ${messageCount} ${messageCount === 1 ? 'zpráva' : messageCount < 5 ? 'zprávy' : 'zpráv'}`;
    }
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

  unescapeHtml(text) {
    const div = document.createElement('div');
    div.innerHTML = text;
    return div.textContent;
  }

  /**
   * Calculate similarity between two strings (0-1)
   * Uses Levenshtein distance ratio
   */
  calculateSimilarity(str1, str2) {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;

    if (longer.length === 0) return 1.0;

    const editDistance = this.levenshteinDistance(longer, shorter);
    return (longer.length - editDistance) / longer.length;
  }

  /**
   * Calculate Levenshtein distance between two strings
   */
  levenshteinDistance(str1, str2) {
    const matrix = [];

    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }

    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }

    return matrix[str2.length][str1.length];
  }

  generateProviderOptions() {
    // Načti providery z AI modulu
    if (typeof window.AI === 'undefined' || !window.AI.getAllProvidersWithModels) {
      return `
        <option value="groq">Groq</option>
        <option value="gemini">Google Gemini</option>
        <option value="openrouter">OpenRouter</option>
        <option value="mistral">Mistral</option>
        <option value="cohere">Cohere</option>
        <option value="huggingface">HuggingFace</option>
      `;
    }

    const allProviders = window.AI.getAllProvidersWithModels();
    return Object.entries(allProviders)
      .map(([key, data]) => `<option value="${key}">${data.name}</option>`)
      .join('');
  }

  updateModels(provider) {
    const modelSelect = this.modal.element.querySelector('#aiModel');
    if (!modelSelect) return;

    // Načti modely z AI modulu
    if (typeof window.AI === 'undefined' || !window.AI.getAllProvidersWithModels) {
      console.warn('AI module not loaded, using fallback models');
      modelSelect.innerHTML = '<option value="">AI modul není načten</option>';
      return;
    }

    const allProviders = window.AI.getAllProvidersWithModels();
    const providerData = allProviders[provider];
    const favoriteModels = JSON.parse(localStorage.getItem('favoriteModels') || '[]');

    if (providerData && Array.isArray(providerData.models)) {
      modelSelect.innerHTML = providerData.models
        .map(m => {
          const isFavorite = favoriteModels.includes(`${provider}:${m.value}`);
          const star = isFavorite ? '⭐ ' : '';
          const freeLabel = m.free ? '🟢 FREE' : '💰 Paid';
          const rpmLabel = `${m.rpm} RPM`;
          const contextLabel = m.context || '';
          const info = `${freeLabel} | ${rpmLabel} | ${contextLabel}`;
          return `<option value="${m.value}" title="${m.description || ''}" data-favorite="${isFavorite}">${star}${m.label} (${info})</option>`;
        })
        .join('');

      // Add double-click handler for favoriting
      modelSelect.addEventListener('dblclick', (e) => {
        const selectedOption = modelSelect.options[modelSelect.selectedIndex];
        if (selectedOption) {
          this.toggleModelFavorite(provider, selectedOption.value);
        }
      });
    } else {
      modelSelect.innerHTML = '<option value="">Žádné modely</option>';
    }
  }

  toggleModelFavorite(provider, modelValue) {
    const favoriteModels = JSON.parse(localStorage.getItem('favoriteModels') || '[]');
    const modelKey = `${provider}:${modelValue}`;

    const index = favoriteModels.indexOf(modelKey);
    if (index > -1) {
      favoriteModels.splice(index, 1);
      toast.success('Model odebrán z oblíbených', 1500);
    } else {
      favoriteModels.push(modelKey);
      toast.success('⭐ Model přidán do oblíbených', 1500);
    }

    localStorage.setItem('favoriteModels', JSON.stringify(favoriteModels));

    // Refresh model list
    const providerSelect = this.modal.element.querySelector('#aiProvider');
    if (providerSelect) {
      this.updateModels(providerSelect.value);
    }
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
      background: var(--bg-elevated, white);
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
      background: var(--bg-secondary, #f5f5f5);
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      padding: 20px;
    }
    .form-container {
      background: var(--bg-elevated, white);
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
      background: var(--bg-secondary, #f5f5f5);
    }
    .dashboard {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 20px;
      padding: 20px;
    }
    .card {
      background: var(--bg-elevated, white);
      padding: 30px;
      border-radius: 10px;
      box-shadow: 0 2px 5px rgba(0,0,0,0.1);
    }
    .card h3 {
      margin-bottom: 10px;
      color: var(--text-primary, #333);
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
      'search-repos': () => this.showGitHubSearchDialog(),
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

  showGitHubSearchDialog() {
    const modal = document.createElement('div');
    modal.className = 'modal-backdrop';
    modal.innerHTML = `
      <div class="modal-content" style="max-width: 800px;">
        <div class="modal-header">
          <h3>🔍 Hledat HTML na GitHub</h3>
          <button class="modal-close" id="githubSearchClose">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>
        <div class="modal-body" style="padding: 30px;">
          <div style="margin-bottom: 20px;">
            <label style="display: block; margin-bottom: 8px; font-weight: 600;">Co hledáte?</label>
            <input type="text" id="githubSearchQuery" placeholder="Např. landing page, portfolio, navbar..." style="width: 100%; padding: 12px; border: 1px solid var(--border-color); border-radius: 8px; font-size: 14px;">
          </div>
          <div style="margin-bottom: 20px;">
            <label style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
              <input type="checkbox" id="singleFileSearch" style="width: 18px; height: 18px; cursor: pointer;">
              <span style="font-weight: 500;">Hledat pouze jeden HTML soubor s kompletním kódem</span>
            </label>
            <p style="font-size: 12px; color: var(--text-secondary); margin-top: 4px; margin-left: 26px;">
              Vyhledá samostatné HTML soubory místo celých repozitářů
            </p>
          </div>
          <button id="startGithubSearch" style="width: 100%; padding: 14px; background: var(--accent); color: white; border: none; border-radius: 8px; font-weight: 600; cursor: pointer; font-size: 15px;">
            🔍 Hledat
          </button>
          <div id="githubSearchResults" style="margin-top: 30px; display: none;">
            <h4 style="margin-bottom: 15px; color: var(--text-primary);">Výsledky hledání:</h4>
            <div id="githubResultsList" style="display: grid; gap: 10px; max-height: 400px; overflow-y: auto;"></div>
          </div>
          <div id="githubSearchLoading" style="display: none; text-align: center; padding: 40px;">
            <div style="display: inline-block; width: 40px; height: 40px; border: 4px solid var(--border-color); border-top-color: var(--accent); border-radius: 50%; animation: spin 1s linear infinite;"></div>
            <p style="margin-top: 15px; color: var(--text-secondary);">Hledání na GitHub...</p>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    const closeModal = () => modal.remove();
    modal.querySelector('#githubSearchClose').addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeModal();
    });

    modal.querySelector('#startGithubSearch').addEventListener('click', async () => {
      const query = modal.querySelector('#githubSearchQuery').value.trim();
      const singleFile = modal.querySelector('#singleFileSearch').checked;

      if (!query) {
        alert('Zadejte prosím hledaný výraz');
        return;
      }

      const loadingDiv = modal.querySelector('#githubSearchLoading');
      const resultsDiv = modal.querySelector('#githubSearchResults');
      const resultsList = modal.querySelector('#githubResultsList');

      loadingDiv.style.display = 'block';
      resultsDiv.style.display = 'none';
      resultsList.innerHTML = '';

      try {
        let results;
        if (singleFile) {
          // Hledat jednotlivé HTML soubory
          results = await this.searchGitHubFiles(query);
        } else {
          // Hledat celé repozitáře s HTML
          results = await this.searchGitHubRepos(query);
        }

        loadingDiv.style.display = 'none';
        resultsDiv.style.display = 'block';

        if (results.length === 0) {
          resultsList.innerHTML = '<p style="text-align: center; color: var(--text-secondary); padding: 20px;">Nenalezeny žádné výsledky</p>';
          return;
        }

        results.forEach(result => {
          const resultCard = document.createElement('div');
          resultCard.style.cssText = 'padding: 15px; background: var(--bg-secondary); border: 1px solid var(--border-color); border-radius: 8px; transition: all 0.2s;';
          resultCard.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: start; gap: 15px;">
              <div style="flex: 1;">
                <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 5px;">
                  <h5 style="margin: 0; color: var(--accent); font-size: 14px;">${result.name}</h5>
                  <a href="${result.url}" target="_blank" rel="noopener noreferrer" style="color: var(--text-secondary); text-decoration: none; font-size: 12px; display: inline-flex; align-items: center; gap: 4px; padding: 2px 6px; background: var(--bg-tertiary); border-radius: 4px; transition: all 0.2s;" title="Otevřít na GitHub">
                    🔗 GitHub
                  </a>
                </div>
                <p style="margin: 0 0 8px 0; font-size: 12px; color: var(--text-secondary);">${result.description || 'Bez popisu'}</p>
                ${singleFile ?
                  `<div style="font-size: 11px; color: var(--text-secondary);">📄 ${result.path}</div>` :
                  `<div style="display: flex; gap: 15px; font-size: 11px; color: var(--text-secondary);">
                    <span>⭐ ${result.stars}</span>
                    <span>🍴 ${result.forks}</span>
                  </div>`
                }
              </div>
              <button class="load-github-code" data-url="${result.url}" data-name="${result.name}" style="padding: 8px 16px; background: var(--accent); color: white; border: none; border-radius: 6px; font-size: 12px; font-weight: 600; cursor: pointer; white-space: nowrap;">
                📥 Načíst kód
              </button>
            </div>
          `;

          resultCard.querySelector('.load-github-code').addEventListener('click', async (e) => {
            e.stopPropagation();
            const btn = e.currentTarget;
            btn.disabled = true;
            btn.textContent = '⏳ Načítání...';

            try {
              // Zavřít dialog PŘED načítáním
              closeModal();

              // Zobrazit loading overlay
              this.showLoadingOverlay('📥 Načítám soubory z GitHub...', name);

              await this.loadGitHubCode(result.url, result.name, singleFile);

              // Skrýt loading overlay
              this.hideLoadingOverlay();

              eventBus.emit('toast:show', {
                message: '✅ Kód načten z GitHub',
                type: 'success',
                duration: 2000
              });
            } catch (error) {
              this.hideLoadingOverlay();
              eventBus.emit('toast:show', {
                message: '❌ Chyba při načítání: ' + error.message,
                type: 'error',
                duration: 3000
              });
              btn.disabled = false;
              btn.textContent = '📥 Načíst kód';
            }
          });

          resultsList.appendChild(resultCard);
        });

      } catch (error) {
        loadingDiv.style.display = 'none';
        resultsDiv.style.display = 'block';
        resultsList.innerHTML = `<p style="text-align: center; color: #ef4444; padding: 20px;">Chyba: ${error.message}</p>`;
      }
    });
  }

  async searchGitHubFiles(query) {
    const searchQuery = encodeURIComponent(`${query} extension:html`);
    const response = await fetch(`https://api.github.com/search/code?q=${searchQuery}&per_page=10`);

    if (!response.ok) {
      throw new Error('GitHub API chyba: ' + response.statusText);
    }

    const data = await response.json();

    return data.items.map(item => ({
      name: item.name,
      path: item.path,
      description: item.repository.description,
      url: item.html_url,
      downloadUrl: `https://raw.githubusercontent.com/${item.repository.full_name}/${item.repository.default_branch}/${item.path}`,
      stars: item.repository.stargazers_count,
      forks: item.repository.forks_count
    }));
  }

  async searchGitHubRepos(query) {
    const searchQuery = encodeURIComponent(`${query} language:html`);
    const response = await fetch(`https://api.github.com/search/repositories?q=${searchQuery}&sort=stars&per_page=10`);

    if (!response.ok) {
      throw new Error('GitHub API chyba: ' + response.statusText);
    }

    const data = await response.json();

    return data.items.map(repo => ({
      name: repo.name,
      description: repo.description,
      url: repo.html_url,
      cloneUrl: repo.clone_url,
      stars: repo.stargazers_count,
      forks: repo.forks_count,
      defaultBranch: repo.default_branch,
      fullName: repo.full_name
    }));
  }

  async loadGitHubCode(url, name, isSingleFile) {
    if (isSingleFile) {
      // Načíst obsah souboru
      const match = url.match(/github\.com\/([^/]+)\/([^/]+)\/blob\/([^/]+)\/(.+)/);
      if (!match) {
        throw new Error('Neplatná URL GitHub souboru');
      }

      const [, owner, repo, branch, path] = match;
      const rawUrl = `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${path}`;

      const response = await fetch(rawUrl);
      if (!response.ok) {
        throw new Error('Nepodařilo se načíst soubor z GitHub');
      }

      const code = await response.text();

      // Vytvořit nový soubor
      eventBus.emit('file:create', {
        name: name,
        content: code
      });

    } else {
      // Pro repozitář - zkusit najít index.html
      const match = url.match(/github\.com\/([^/]+)\/([^/]+)/);
      if (!match) {
        throw new Error('Neplatná URL GitHub repozitáře');
      }

      const [, owner, repo] = match;

      // Zkusit načíst index.html
      const possibleFiles = ['index.html', 'index.htm', 'home.html', 'main.html'];
      let code = null;

      for (const file of possibleFiles) {
        try {
          const rawUrl = `https://raw.githubusercontent.com/${owner}/${repo}/main/${file}`;
          const response = await fetch(rawUrl);
          if (response.ok) {
            code = await response.text();
            break;
          }
        } catch (e) {
          // Zkusit další soubor
          continue;
        }
      }

      if (!code) {
        // Zkusit master branch
        for (const file of possibleFiles) {
          try {
            const rawUrl = `https://raw.githubusercontent.com/${owner}/${repo}/master/${file}`;
            const response = await fetch(rawUrl);
            if (response.ok) {
              code = await response.text();
              break;
            }
          } catch (e) {
            continue;
          }
        }
      }

      if (!code) {
        throw new Error('Nenalezen žádný HTML soubor v repozitáři. Zkuste hledat samostatné soubory.');
      }

      // Vytvořit nový soubor
      eventBus.emit('file:create', {
        name: `${name}.html`,
        content: code
      });
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

    // Show GitHub login modal instead of prompt
    const result = await this.showGitHubLoginModal();
    if (!result || !result.username) return;

    // Store username and token
    localStorage.setItem('github_username', result.username);
    if (result.token) {
      localStorage.setItem('github_token', result.token);
    }

    eventBus.emit('toast:show', {
      message: 'Připojeno jako @' + result.username + (result.token ? '' : '. Nezapomeňte nastavit token pro API přístup.'),
      type: 'success'
    });

    this.checkGitHubConnection();
  }

  // Show GitHub Login Modal
  showGitHubLoginModal() {
    return new Promise((resolve) => {
      // Prevent multiple modals
      const existingModal = document.querySelector('.github-login-modal');
      if (existingModal) {
        existingModal.remove();
      }

      const modal = document.createElement('div');
      modal.className = 'modal-overlay github-login-modal';
      modal.innerHTML = `
        <div class="modal-content">
          <div class="modal-header">
            <h2>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 24px; height: 24px;">
                <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"/>
              </svg>
              Přihlášení na GitHub
            </h2>
            <button class="modal-close" aria-label="Zavřít">&times;</button>
          </div>
          <div class="modal-body">
            <p class="modal-description" style="background: var(--bg-secondary); padding: 12px; border-radius: 8px; margin-bottom: 20px;">
              💡 V produkční verzi by se zde otevřelo OAuth okno od GitHubu.
              Pro demo zadejte své GitHub údaje:
            </p>
            <form id="githubLoginForm">
              <div class="form-group" style="margin-bottom: 16px;">
                <label for="githubUsername" style="display: block; margin-bottom: 6px; font-weight: 500;">GitHub uživatelské jméno</label>
                <input
                  type="text"
                  id="githubUsername"
                  name="github-user"
                  placeholder="např. octocat"
                  required
                  autocomplete="off"
                  autocorrect="off"
                  autocapitalize="off"
                  spellcheck="false"
                  style="width: 100%; padding: 10px 12px; background: var(--bg-secondary); border: 1px solid var(--border); border-radius: 6px; color: var(--text-primary); font-size: 14px;"
                />
              </div>
              <div class="form-group" style="margin-bottom: 16px;">
                <label for="githubToken" style="display: block; margin-bottom: 6px; font-weight: 500;">Personal Access Token (volitelné)</label>
                <input
                  type="password"
                  id="githubToken"
                  name="github-token"
                  placeholder="ghp_xxxxxxxxxxxx"
                  autocomplete="new-password"
                  style="width: 100%; padding: 10px 12px; background: var(--bg-secondary); border: 1px solid var(--border); border-radius: 6px; color: var(--text-primary); font-size: 14px;"
                />
                <small style="display: block; margin-top: 6px; font-size: 12px; color: var(--text-secondary);">
                  Pro API přístup. <a href="https://github.com/settings/tokens" target="_blank" style="color: var(--primary);">Vytvořit token</a>
                </small>
              </div>
              <div class="modal-actions" style="display: flex; gap: 10px; justify-content: flex-end; padding-top: 15px; border-top: 1px solid var(--border);">
                <button type="button" class="btn btn-secondary" data-action="cancel" style="padding: 10px 20px; border: none; border-radius: 6px; background: var(--bg-secondary); color: var(--text-primary); cursor: pointer; min-width: 44px; min-height: 44px;">Zrušit</button>
                <button type="submit" class="btn btn-primary" style="padding: 10px 20px; border: none; border-radius: 6px; background: var(--primary); color: white; cursor: pointer; min-width: 44px; min-height: 44px;">Přihlásit</button>
              </div>
            </form>
          </div>
        </div>
      `;

      const closeModal = (result = null) => {
        modal.classList.add('closing');
        setTimeout(() => {
          modal.remove();
          document.removeEventListener('keydown', escHandler);
          resolve(result);
        }, 300);
      };

      // Prevent event bubbling on modal content
      modal.querySelector('.modal-content')?.addEventListener('click', (e) => {
        e.stopPropagation();
      });

      // Close button
      modal.querySelector('.modal-close')?.addEventListener('click', (e) => {
        e.stopPropagation();
        closeModal();
      });

      modal.querySelector('[data-action="cancel"]')?.addEventListener('click', (e) => {
        e.stopPropagation();
        closeModal();
      });

      // Close on backdrop click
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          closeModal();
        }
      });

      // Close on ESC
      const escHandler = (e) => {
        if (e.key === 'Escape') {
          closeModal();
        }
      };
      document.addEventListener('keydown', escHandler);

      // Form submit
      modal.querySelector('#githubLoginForm').addEventListener('submit', (e) => {
        e.preventDefault();
        const username = modal.querySelector('#githubUsername').value.trim();
        const token = modal.querySelector('#githubToken').value.trim();
        if (username) {
          closeModal({ username, token });
        }
      });

      document.body.appendChild(modal);

      // Trigger animation
      setTimeout(() => {
        modal.classList.add('show');
      }, 10);

      // Focus first input
      setTimeout(() => modal.querySelector('#githubUsername').focus(), 100);
    });
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
    const undoHistory = this.getUndoHistory();
    const redoHistory = this.getRedoHistory();

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
          <div class="repo-history-btns">
            <button class="repo-btn" id="undoRepoActionBtn" ${undoHistory.length === 0 ? 'disabled' : ''}>
              <span class="icon">↩️</span>
              <span>Zpět (${undoHistory.length}/5)</span>
            </button>
            <button class="repo-btn" id="redoRepoActionBtn" ${redoHistory.length === 0 ? 'disabled' : ''}>
              <span class="icon">↪️</span>
              <span>Vpřed (${redoHistory.length})</span>
            </button>
          </div>
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
    const redoBtn = repoModal.element.querySelector('#redoRepoActionBtn');
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

    if (redoBtn) {
      redoBtn.addEventListener('click', () => this.redoRepoAction(repoModal));
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
    this.updateHistoryButtons(repoModal);
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
    this.updateHistoryButtons(repoModal);
  }

  // Undo/Redo History Management (max 5 steps)
  getUndoHistory() {
    const history = localStorage.getItem('github_undo_history');
    return history ? JSON.parse(history) : [];
  }

  getRedoHistory() {
    const history = localStorage.getItem('github_redo_history');
    return history ? JSON.parse(history) : [];
  }

  storeUndoAction(action, data) {
    const history = this.getUndoHistory();

    // Add new action to history
    history.push({
      action,
      data,
      timestamp: Date.now()
    });

    // Keep only last 5 actions
    if (history.length > 5) {
      history.shift();
    }

    localStorage.setItem('github_undo_history', JSON.stringify(history));

    // Clear redo history when new action is performed
    localStorage.removeItem('github_redo_history');
  }

  async undoLastRepoAction(repoModal) {
    const undoHistory = this.getUndoHistory();
    if (undoHistory.length === 0) return;

    // Get last action
    const lastAction = undoHistory.pop();
    const { action, data } = lastAction;
    const repos = this.getMockRepositories();

    // Store to redo history
    const redoHistory = this.getRedoHistory();
    redoHistory.push(lastAction);
    localStorage.setItem('github_redo_history', JSON.stringify(redoHistory));

    // Perform undo
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
    localStorage.setItem('github_undo_history', JSON.stringify(undoHistory));

    eventBus.emit('toast:show', {
      message: `Akce vrácena zpět (${undoHistory.length} zbývá)`,
      type: 'success'
    });

    // Reload list and update buttons
    await this.loadRepositories(repoModal);
    this.updateHistoryButtons(repoModal);
  }

  async redoRepoAction(repoModal) {
    const redoHistory = this.getRedoHistory();
    if (redoHistory.length === 0) return;

    // Get last redo action
    const lastAction = redoHistory.pop();
    const { action, data } = lastAction;
    const repos = this.getMockRepositories();

    // Store back to undo history
    const undoHistory = this.getUndoHistory();
    undoHistory.push(lastAction);
    localStorage.setItem('github_undo_history', JSON.stringify(undoHistory));

    // Perform redo (reverse of undo)
    if (action === 'create') {
      // Re-add created repo
      repos.unshift(data);
    } else if (action === 'delete') {
      // Re-remove deleted repo
      const index = repos.findIndex(r => r.name === data.name);
      if (index !== -1) {
        repos.splice(index, 1);
      }
    }

    localStorage.setItem('github_repos', JSON.stringify(repos));
    localStorage.setItem('github_redo_history', JSON.stringify(redoHistory));

    eventBus.emit('toast:show', {
      message: `Akce obnovena (${redoHistory.length} zbývá vpřed)`,
      type: 'success'
    });

    // Reload list and update buttons
    await this.loadRepositories(repoModal);
    this.updateHistoryButtons(repoModal);
  }

  updateHistoryButtons(repoModal) {
    const undoHistory = this.getUndoHistory();
    const redoHistory = this.getRedoHistory();

    const undoBtn = repoModal.element.querySelector('#undoRepoActionBtn');
    const redoBtn = repoModal.element.querySelector('#redoRepoActionBtn');

    if (undoBtn) {
      undoBtn.disabled = undoHistory.length === 0;
      undoBtn.querySelector('span:last-child').textContent = `Zpět (${undoHistory.length}/5)`;
    }

    if (redoBtn) {
      redoBtn.disabled = redoHistory.length === 0;
      redoBtn.querySelector('span:last-child').textContent = `Vpřed (${redoHistory.length})`;
    }
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

  /**
   * AI Agents Methods
   */
  attachAgentsHandlers() {
    // Store current engine
    this.currentAgentEngine = 'javascript';

    // Load agents grid
    this.loadAgentsGrid();

    // Check CrewAI connection
    this.checkCrewAIConnection();

    // Engine selector
    const engineRadios = this.modal.element.querySelectorAll('input[name="agentEngine"]');
    engineRadios.forEach(radio => {
      radio.addEventListener('change', (e) => {
        this.currentAgentEngine = e.target.value;
        this.loadAgentsGrid();
        if (window.showNotification) {
          window.showNotification(`Přepnuto na ${e.target.value === 'javascript' ? 'JavaScript' : 'CrewAI'} agenty`, 'info');
        }
      });
    });

    // Orchestrated task button
    const orchestratedBtn = this.modal.element.querySelector('#orchestratedTaskBtn');
    if (orchestratedBtn) {
      orchestratedBtn.addEventListener('click', () => this.startOrchestratedTask());
    }

    // Collaborative task button
    const collaborativeBtn = this.modal.element.querySelector('#collaborativeTaskBtn');
    if (collaborativeBtn) {
      collaborativeBtn.addEventListener('click', () => this.startCollaborativeTask());
    }

    // Clear agents button
    const clearAgentsBtn = this.modal.element.querySelector('#clearAgentsBtn');
    if (clearAgentsBtn) {
      clearAgentsBtn.addEventListener('click', () => this.clearAgentsHistory());
    }

    // Send to agent button
    const sendToAgentBtn = this.modal.element.querySelector('#sendToAgentBtn');
    const agentChatInput = this.modal.element.querySelector('#agentChatInput');

    if (sendToAgentBtn && agentChatInput) {
      sendToAgentBtn.addEventListener('click', () => {
        const message = agentChatInput.value.trim();
        if (message && this.currentAgent) {
          this.sendToCurrentAgent(message);
          agentChatInput.value = '';
        }
      });

      agentChatInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          sendToAgentBtn.click();
        }
      });
    }
  }

  async checkCrewAIConnection() {
    if (!window.CrewAI) {
      setTimeout(() => this.checkCrewAIConnection(), 200);
      return;
    }

    const isConnected = await window.CrewAI.checkConnection();
    const statusIndicator = this.modal.element.querySelector('#crewaiStatus');

    if (statusIndicator) {
      if (isConnected) {
        statusIndicator.textContent = '✅';
        statusIndicator.title = 'CrewAI server běží na http://localhost:5005';
      } else {
        statusIndicator.textContent = '○';
        statusIndicator.title = 'CrewAI server není dostupný. Spusť: python crewai_api.py';
      }
    }
  }

  loadAgentsGrid() {
    const agentsGrid = this.modal.element.querySelector('#agentsGrid');
    if (!agentsGrid) return;

    if (this.currentAgentEngine === 'crewai') {
      this.loadCrewAIAgents(agentsGrid);
    } else {
      this.loadJavaScriptAgents(agentsGrid);
    }
  }

  loadJavaScriptAgents(agentsGrid) {
    // Wait for AIAgents to be initialized
    if (!window.AIAgents || !window.AIAgents.initialized) {
      setTimeout(() => this.loadAgentsGrid(), 100);
      return;
    }

    const agents = window.AIAgents.getAgents();

    agentsGrid.innerHTML = agents.map(agent => `
      <div class="agent-card ${agent.active ? 'active' : ''}" data-agent-id="${agent.id}">
        <div class="agent-icon">${agent.icon}</div>
        <div class="agent-info">
          <h4 class="agent-name">${agent.name}</h4>
          <p class="agent-role">${agent.role}</p>
          <div class="agent-capabilities">
            ${agent.capabilities.slice(0, 3).map(cap =>
              `<span class="capability-tag">${cap}</span>`
            ).join('')}
          </div>
        </div>
        <div class="agent-actions">
          <button class="btn-agent-toggle" data-agent-id="${agent.id}">
            ${agent.active ? '✅ Aktivní' : '⚪ Aktivovat'}
          </button>
          <button class="btn-agent-chat" data-agent-id="${agent.id}" style="${agent.active ? '' : 'display:none;'}">
            💬 Chat
          </button>
          <button class="btn-agent-prompt" data-agent-id="${agent.id}" title="Předvyplnit prompt">
            ✨ Prompt
          </button>
        </div>
      </div>
    `).join('');

    // Attach card handlers
    const toggleBtns = agentsGrid.querySelectorAll('.btn-agent-toggle');
    toggleBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const agentId = btn.dataset.agentId;
        this.toggleAgent(agentId);
      });
    });

    const chatBtns = agentsGrid.querySelectorAll('.btn-agent-chat');
    chatBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const agentId = btn.dataset.agentId;
        this.openAgentChat(agentId);
      });
    });

    const promptBtns = agentsGrid.querySelectorAll('.btn-agent-prompt');
    promptBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const agentId = btn.dataset.agentId;

        // Special handling for orchestrator
        if (agentId === 'orchestrator') {
          this.openOrchestratorPromptBuilder();
        } else {
          this.prefillPromptForAgent(agentId);
        }
      });
    });

    // Update active agents list
    this.updateActiveAgentsList();
  }

  async loadCrewAIAgents(agentsGrid) {
    if (!window.CrewAI || !window.CrewAI.isAvailable) {
      agentsGrid.innerHTML = `
        <div class="crewai-warning">
          <h4>⚠️ CrewAI server není dostupný</h4>
          <p>Spusť Python server příkazem:</p>
          <code>python crewai_api.py</code>
          <p>Server běží na http://localhost:5005</p>
        </div>
      `;
      return;
    }

    try {
      const agents = await window.CrewAI.getAgents();

      agentsGrid.innerHTML = agents.map(agent => `
        <div class="agent-card crewai-agent" data-agent-id="${agent.id}">
          <div class="agent-icon">🐍</div>
          <div class="agent-info">
            <h4 class="agent-name">${agent.name}</h4>
            <p class="agent-role">${agent.role}</p>
            <div class="agent-goal">${agent.goal}</div>
          </div>
          <div class="agent-actions">
            <button class="btn-agent-use" data-agent-id="${agent.id}">
              🚀 Použít
            </button>
          </div>
        </div>
      `).join('');

      // Attach handlers for CrewAI agents
      const useBtns = agentsGrid.querySelectorAll('.btn-agent-use');
      useBtns.forEach(btn => {
        btn.addEventListener('click', () => {
          const agentId = btn.dataset.agentId;
          this.useCrewAIAgent(agentId);
        });
      });

    } catch (error) {
      agentsGrid.innerHTML = `
        <div class="crewai-error">
          <h4>❌ Chyba při načítání CrewAI agentů</h4>
          <p>${error.message}</p>
        </div>
      `;
    }
  }

  async useCrewAIAgent(agentId) {
    const task = prompt('Zadej úkol pro CrewAI agenta:');
    if (!task) return;

    const messagesContainer = this.modal.element.querySelector('#agentChatMessages');
    const chatSection = this.modal.element.querySelector('#agentChatSection');
    const agentName = this.modal.element.querySelector('#currentAgentName');

    if (chatSection) {
      chatSection.style.display = 'block';
    }

    if (agentName) {
      agentName.textContent = `CrewAI - ${agentId}`;
    }

    if (messagesContainer) {
      // Add user message
      const userMsg = document.createElement('div');
      userMsg.className = 'agent-message user';
      userMsg.innerHTML = `<strong>Ty:</strong><p>${task}</p>`;
      messagesContainer.appendChild(userMsg);

      // Add loading message
      const loadingMsg = document.createElement('div');
      loadingMsg.className = 'agent-message assistant loading';
      loadingMsg.innerHTML = `<strong>CrewAI:</strong><p>Zpracovávám úkol...</p>`;
      messagesContainer.appendChild(loadingMsg);
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    try {
      const result = await window.CrewAI.runSingleAgent(agentId, task);

      if (messagesContainer) {
        loadingMsg.remove();

        const responseMsg = document.createElement('div');
        responseMsg.className = 'agent-message assistant';
        responseMsg.innerHTML = `<strong>CrewAI:</strong><p>${result.result}</p>`;
        messagesContainer.appendChild(responseMsg);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
      }

      toast.success('CrewAI úkol dokončen', 3000);

    } catch (error) {
      if (messagesContainer && loadingMsg) {
        loadingMsg.remove();

        const errorMsg = document.createElement('div');
        errorMsg.className = 'agent-message error';
        errorMsg.innerHTML = `<strong>Chyba:</strong><p>${error.message}</p>`;
        messagesContainer.appendChild(errorMsg);
      }

      toast.error('Chyba při spouštění CrewAI', 3000);
    }
  }

  toggleAgent(agentId) {
    const agent = window.AIAgents.getAgent(agentId);
    if (!agent) {
      toast.error('Agent nenalezen', 2000);
      return;
    }

    // Use the toggleAgent method from AIAgentsSystem
    const success = window.AIAgents.toggleAgent(agentId);

    if (!success) {
      toast.error(`Chyba při přepínání agenta ${agent.name}`, 2000);
      return;
    }

    // Reload grid to update UI
    this.loadAgentsGrid();
    this.updateActiveAgentsList();

    // Get updated agent state
    const updatedAgent = window.AIAgents.getAgent(agentId);
    toast.success(
      updatedAgent.active ? `✅ Agent ${agent.name} aktivován` : `🔴 Agent ${agent.name} deaktivován`,
      2000
    );
  }

  updateActiveAgentsList() {
    const activeAgents = window.AIAgents.getActiveAgents();
    const section = this.modal.element.querySelector('#activeAgentsSection');
    const list = this.modal.element.querySelector('#activeAgentsList');

    if (!section || !list) return;

    if (activeAgents.length === 0) {
      section.style.display = 'none';
      return;
    }

    section.style.display = 'block';
    list.innerHTML = activeAgents.map(agent => `
      <div class="active-agent-badge">
        <span class="agent-icon">${agent.icon}</span>
        <span class="agent-name">${agent.name}</span>
        <button class="btn-remove-agent" data-agent-id="${agent.id}">×</button>
      </div>
    `).join('');

    // Attach remove handlers
    const removeBtns = list.querySelectorAll('.btn-remove-agent');
    removeBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const agentId = btn.dataset.agentId;
        this.toggleAgent(agentId);
      });
    });
  }

  openAgentChat(agentId) {
    const agent = window.AIAgents.getAgent(agentId);
    if (!agent) return;

    this.currentAgent = agentId;
    const chatSection = this.modal.element.querySelector('#agentChatSection');
    const agentName = this.modal.element.querySelector('#currentAgentName');
    const messagesContainer = this.modal.element.querySelector('#agentChatMessages');

    if (!chatSection || !agentName || !messagesContainer) return;

    chatSection.style.display = 'block';
    agentName.textContent = agent.name;

    // Load conversation history
    messagesContainer.innerHTML = agent.conversationHistory.length === 0
      ? '<div class="agent-message system">Ahoj! Jsem ' + agent.name + '. ' + agent.role + '</div>'
      : agent.conversationHistory.map(msg => `
          <div class="agent-message ${msg.role}">
            <strong>${msg.role === 'user' ? 'Ty' : agent.name}:</strong>
            <p>${msg.content}</p>
          </div>
        `).join('');

    // Scroll to bottom
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }

  async sendToOrchestrator(message) {
    // Add user message to chat
    this.addChatMessage('user', message);

    // Show thinking message
    const thinkingId = 'orchestrator-thinking-' + Date.now();
    this.addChatMessage('ai', '🎭 Orchestrator připravuje úkoly pro agenty...', thinkingId);

    try {
      // Get current code for context
      const currentCode = state.get('editor.code') || '';

      // Build orchestrator prompt
      const orchestratorPrompt = `Jsi Orchestrator - řídící AI agent, který analyzuje požadavky uživatele a vytváří detailní task list pro ostatní specializované agenty.

TVŮJ ÚKOL:
Uživatelský požadavek: "${message}"

Aktuální stav projektu:
${currentCode ? `Projekt existuje (${currentCode.length} znaků)` : 'Prázdný editor - nový projekt'}

ANALYZUJ požadavek a rozděl ho na konkrétní úkoly pro tyto agenty:
1. HTML Agent - struktura, značky, sémantika
2. CSS Agent - design, layout, responsivita
3. JavaScript Agent - interaktivita, logika, funkce

ODPOVĚZ VE FORMÁTU:
📋 **Analýza požadavku:**
[Krátká analýza co uživatel chce]

🎯 **Plán úkolů:**

**HTML Agent:**
- [konkrétní úkol 1]
- [konkrétní úkol 2]

**CSS Agent:**
- [konkrétní úkol 1]
- [konkrétní úkol 2]

**JavaScript Agent:**
- [konkrétní úkol 1]
- [konkrétní úkol 2]

**Výsledek:**
\`\`\`html
[zde vlož KOMPLETNÍ fungující kód s UNIKÁTNÍMI názvy proměnných]
\`\`\`

⚠️ KRITICKÉ PRAVIDLO: KAŽDÁ PROMĚNNÁ MUSÍ MÍT UNIKÁTNÍ NÁZEV!`;

      // Call AI with orchestrator prompt
      const bestModel = window.AI.selectBestModel();
      const response = await window.AI.ask(orchestratorPrompt, {
        provider: bestModel.provider,
        model: bestModel.model,
        temperature: 0.7
      });

      // Remove thinking message
      const thinkingEl = this.modal.element.querySelector(`[data-message-id="${thinkingId}"]`);
      if (thinkingEl) thinkingEl.remove();

      // Extract and apply code if present
      const codeMatch = response.match(/```(?:html)?\n([\s\S]*?)```/);
      if (codeMatch && codeMatch[1]) {
        const code = codeMatch[1].trim();

        // Extract only the description/plan part (before the code)
        const descriptionMatch = response.match(/([\s\S]*?)```/);
        const description = descriptionMatch ? descriptionMatch[1].trim() : '✅ Kód byl vygenerován a vložen do editoru.';

        // Add only description to chat, not the full code
        this.addChatMessage('ai', description);

        // Add to history (without full code)
        this.chatHistory.push({
          role: 'assistant',
          content: description
        });

        // Insert code to editor
        this.insertCodeToEditor(code, false);

        // Show success toast
        eventBus.emit('toast:show', {
          message: '✅ Orchestrator vytvořil projekt a vložil do editoru',
          type: 'success',
          duration: 3000
        });
      } else {
        // No code found, show full response
        this.addChatMessage('ai', response);

        // Add to history
        this.chatHistory.push({
          role: 'assistant',
          content: response
        });
      }

      // Update history counter
      this.updateHistoryInfo();

    } catch (error) {
      console.error('Orchestrator error:', error);

      // Remove thinking message
      const thinkingEl = this.modal.element.querySelector(`[data-message-id="${thinkingId}"]`);
      if (thinkingEl) thinkingEl.remove();

      this.addChatMessage('ai', `❌ Chyba Orchestratora: ${error.message}`);
    }
  }

  async sendToCurrentAgent(message) {
    if (!this.currentAgent) return;

    const agent = window.AIAgents.getAgent(this.currentAgent);
    const messagesContainer = this.modal.element.querySelector('#agentChatMessages');

    // Add user message to UI
    const userMsg = document.createElement('div');
    userMsg.className = 'agent-message user';
    userMsg.innerHTML = `<strong>Ty:</strong><p>${message}</p>`;
    messagesContainer.appendChild(userMsg);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;

    // Show loading
    const loadingMsg = document.createElement('div');
    loadingMsg.className = 'agent-message assistant loading';
    loadingMsg.innerHTML = `<strong>${agent.name}:</strong><p>⏳ Pracuji na úkolu...</p>`;
    messagesContainer.appendChild(loadingMsg);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;

    try {
      // Get current code context
      const code = state.get('editor.code') || '';
      const context = { code };

      // Send to agent
      const response = await window.AIAgents.sendToAgent(this.currentAgent, message, context);

      // Remove loading message
      loadingMsg.remove();

      // Add agent response
      const agentMsg = document.createElement('div');
      agentMsg.className = 'agent-message assistant';
      agentMsg.innerHTML = `<strong>${agent.name}:</strong><p>${response.response}</p>`;
      messagesContainer.appendChild(agentMsg);
      messagesContainer.scrollTop = messagesContainer.scrollHeight;

    } catch (error) {
      loadingMsg.remove();

      const errorMsg = document.createElement('div');
      errorMsg.className = 'agent-message error';
      errorMsg.innerHTML = `<strong>Chyba:</strong><p>${error.message}</p>`;
      messagesContainer.appendChild(errorMsg);
    }
  }

  async startOrchestratedTask() {
    // Check if orchestrator is active
    const orchestratorAgent = window.AIAgents.getAgent('orchestrator');
    if (!orchestratorAgent || !orchestratorAgent.active) {
      toast.error('Aktivuj Orchestrator agenta pro orchestrovaný režim', 3000);
      return;
    }

    const task = prompt('Zadej úkol pro Orchestrátora (rozdělí ho mezi agenty):');
    if (!task) return;

    const messagesContainer = this.modal.element.querySelector('#agentChatMessages');
    const chatSection = this.modal.element.querySelector('#agentChatSection');

    if (chatSection) {
      chatSection.style.display = 'block';
      const agentName = this.modal.element.querySelector('#currentAgentName');
      if (agentName) agentName.textContent = '🎯 Orchestrovaná session';
    }

    if (messagesContainer) {
      messagesContainer.innerHTML = '<div class="agent-message system">🎯 Orchestrator analyzuje a rozděluje úkol...</div>';
    }

    try {
      const code = state.get('editor.code') || '';
      const context = { code };

      const results = await window.AIAgents.orchestratedSession(task, context);

      // Display results phase by phase
      results.forEach(phaseResult => {
        if (phaseResult.phase === 'orchestration') {
          const msg = document.createElement('div');
          msg.className = 'agent-message orchestrator';
          msg.innerHTML = `<strong>🎯 Orchestrator - Plán:</strong><p>${phaseResult.response.response}</p>`;
          messagesContainer.appendChild(msg);
        } else if (phaseResult.phase === 'execution') {
          // Show plan first
          if (phaseResult.plan) {
            const planMsg = document.createElement('div');
            planMsg.className = 'agent-message system';
            planMsg.innerHTML = `<strong>📋 Rozdělení úkolů:</strong><ul>${
              (phaseResult.plan.agents || []).map(a =>
                `<li><strong>${a.agent}</strong>: ${a.task}</li>`
              ).join('')
            }</ul>`;
            messagesContainer.appendChild(planMsg);
          }

          // Show agent responses
          phaseResult.responses.forEach(response => {
            const msg = document.createElement('div');
            msg.className = 'agent-message assistant';
            msg.innerHTML = `<strong>${response.agent}:</strong><p>${response.response}</p>`;
            messagesContainer.appendChild(msg);
          });
        } else if (phaseResult.phase === 'synthesis') {
          const msg = document.createElement('div');
          msg.className = 'agent-message synthesis';
          msg.innerHTML = `<strong>✨ Finální řešení od Orchestrátora:</strong><p>${phaseResult.response.response}</p>`;
          messagesContainer.appendChild(msg);
        }
      });

      messagesContainer.scrollTop = messagesContainer.scrollHeight;
      toast.success('Orchestrovaná session dokončena', 3000);

    } catch (error) {
      const errorMsg = document.createElement('div');
      errorMsg.className = 'agent-message error';
      errorMsg.innerHTML = `<strong>Chyba:</strong><p>${error.message}</p>`;
      messagesContainer.appendChild(errorMsg);
      toast.error('Chyba při orchestrované session', 3000);
    }
  }

  async startCollaborativeTask() {
    if (this.currentAgentEngine === 'crewai') {
      return this.startCrewAICollaborativeTask();
    }

    const activeAgents = window.AIAgents.getActiveAgents();

    if (activeAgents.length < 2) {
      toast.error('Aktivuj alespoň 2 agenty pro kolaborativní práci', 3000);
      return;
    }

    const task = prompt('Zadej úkol pro agenty:');
    if (!task) return;

    const messagesContainer = this.modal.element.querySelector('#agentChatMessages');
    const chatSection = this.modal.element.querySelector('#agentChatSection');

    if (chatSection) {
      chatSection.style.display = 'block';
      const agentName = this.modal.element.querySelector('#currentAgentName');
      if (agentName) agentName.textContent = 'Kolaborativní session';
    }

    if (messagesContainer) {
      messagesContainer.innerHTML = '<div class="agent-message system">🤝 Spouštím kolaborativní session...</div>';
    }

    try {
      const code = state.get('editor.code') || '';
      const context = { code };

      const agentIds = activeAgents.map(a => a.id);
      const results = await window.AIAgents.collaborativeSession(agentIds, task, context);

      // Display results
      results.forEach(phaseResult => {
        if (phaseResult.phase === 'analysis' || phaseResult.phase === 'review') {
          phaseResult.responses.forEach(response => {
            const msg = document.createElement('div');
            msg.className = 'agent-message assistant';
            msg.innerHTML = `<strong>${response.agent} (${phaseResult.phase}):</strong><p>${response.response}</p>`;
            messagesContainer.appendChild(msg);
          });
        } else if (phaseResult.phase === 'synthesis') {
          const msg = document.createElement('div');
          msg.className = 'agent-message synthesis';
          msg.innerHTML = `<strong>📋 Finální řešení:</strong><p>${phaseResult.response.response}</p>`;
          messagesContainer.appendChild(msg);
        }
      });

      messagesContainer.scrollTop = messagesContainer.scrollHeight;
      toast.success('Kolaborativní session dokončena', 3000);

    } catch (error) {
      const errorMsg = document.createElement('div');
      errorMsg.className = 'agent-message error';
      errorMsg.innerHTML = `<strong>Chyba:</strong><p>${error.message}</p>`;
      messagesContainer.appendChild(errorMsg);
      toast.error('Chyba při kolaborativní session', 3000);
    }
  }

  async startCrewAICollaborativeTask() {
    const task = prompt('Zadej úkol pro CrewAI tým (Architekt, Vývojář, Tester, Dokumentarista):');
    if (!task) return;

    const messagesContainer = this.modal.element.querySelector('#agentChatMessages');
    const chatSection = this.modal.element.querySelector('#agentChatSection');

    if (chatSection) {
      chatSection.style.display = 'block';
      const agentName = this.modal.element.querySelector('#currentAgentName');
      if (agentName) agentName.textContent = 'CrewAI - Celý tým';
    }

    if (messagesContainer) {
      messagesContainer.innerHTML = '<div class="agent-message system">🐍 Spouštím CrewAI tým...</div>';

      const loadingMsg = document.createElement('div');
      loadingMsg.className = 'agent-message assistant loading';
      loadingMsg.innerHTML = `<strong>CrewAI:</strong><p>Agenti pracují na úkolu (může trvat několik minut)...</p>`;
      messagesContainer.appendChild(loadingMsg);
    }

    try {
      const result = await window.CrewAI.runCrew(task);

      if (messagesContainer && loadingMsg) {
        loadingMsg.remove();

        const responseMsg = document.createElement('div');
        responseMsg.className = 'agent-message synthesis';
        responseMsg.innerHTML = `<strong>📋 Výsledek CrewAI týmu:</strong><p>${result.result}</p>`;
        messagesContainer.appendChild(responseMsg);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
      }

      toast.success('CrewAI tým dokončil úkol', 3000);

    } catch (error) {
      if (messagesContainer && loadingMsg) {
        loadingMsg.remove();

        const errorMsg = document.createElement('div');
        errorMsg.className = 'agent-message error';
        errorMsg.innerHTML = `<strong>Chyba:</strong><p>${error.message}</p>`;
        messagesContainer.appendChild(errorMsg);
      }

      toast.error('Chyba při spouštění CrewAI týmu', 3000);
    }
  }

  clearAgentsHistory() {
    if (confirm('Opravdu chceš vymazat historii všech agentů?')) {
      window.AIAgents.clearAllHistory();
      toast.success('Historie agentů vymazána', 2000);

      // Clear chat display
      const messagesContainer = this.modal.element.querySelector('#agentChatMessages');
      if (messagesContainer) {
        messagesContainer.innerHTML = '';
      }
    }
  }

  prefillPromptForAgent(agentId) {
    // Get agent details
    const agent = window.AIAgents?.getAgent(agentId);
    if (!agent) return;

    // Switch to chat tab
    const chatTab = this.modal.element.querySelector('[data-tab="chat"]');
    if (chatTab) {
      chatTab.click();
    }

    // Build prompt based on agent
    let prompt = '';
    switch (agentId) {
      case 'code-generator':
        prompt = `Jako Code Generator, potřebuji vytvořit ${agent.capabilities.includes('HTML') ? 'HTML' : agent.capabilities.includes('JavaScript') ? 'JavaScript' : 'CSS'} kód pro: `;
        break;
      case 'code-reviewer':
        prompt = `Zkontroluj prosím můj kód a navrhni vylepšení z hlediska: ${agent.capabilities.join(', ')}`;
        break;
      case 'debugger':
        prompt = `Pomoz mi najít a opravit chyby v kódu. Zaměř se na: `;
        break;
      case 'optimizer':
        prompt = `Optimalizuj tento kód z hlediska: ${agent.capabilities.join(', ')}. `;
        break;
      case 'documenter':
        prompt = `Vytvoř dokumentaci pro tento kód. Zahrň: ${agent.capabilities.join(', ')}`;
        break;
      case 'tester':
        prompt = `Navrhni testovací případy pro tento kód. Zaměř se na: ${agent.capabilities.join(', ')}`;
        break;
      case 'refactorer':
        prompt = `Refaktoruj tento kód podle principů: ${agent.capabilities.join(', ')}`;
        break;
      case 'security':
        prompt = `Zkontroluj bezpečnost kódu. Zaměř se na: ${agent.capabilities.join(', ')}`;
        break;
      case 'accessibility':
        prompt = `Zkontroluj přístupnost (a11y) a navrhni vylepšení podle: ${agent.capabilities.join(', ')}`;
        break;
      default:
        prompt = `Jako ${agent.name}, pomoz mi s: `;
    }

    // Fill the chat input
    const chatInput = this.modal.element.querySelector('#aiChatInput');
    if (chatInput) {
      chatInput.value = prompt;
      chatInput.focus();

      // Move cursor to end
      chatInput.setSelectionRange(prompt.length, prompt.length);

      // Show notification
      toast.show(`✨ Prompt předvyplněn pro ${agent.name}`, 'info');
    }
  }

  openOrchestratorPromptBuilder() {
    // Log available agents for debugging
    if (window.AIAgents) {
      const allAgents = window.AIAgents.getAgents();
      console.log('📋 Dostupné agenti pro orchestrátor:', allAgents.map(a => `${a.id} (${a.name})`).join(', '));
    }

    // Create orchestrator prompt builder modal
    const orchestratorModal = new Modal({
      title: '🎯 Orchestrator - Sestavení týmu agentů',
      content: this.createOrchestratorBuilderContent(),
      size: 'large'
    });

    orchestratorModal.open();
    this.currentOrchestratorModal = orchestratorModal;
    this.orchestratorChatHistory = [];

    // Attach event handlers
    setTimeout(() => {
      this.attachOrchestratorBuilderHandlers(orchestratorModal);
    }, 100);
  }

  createOrchestratorBuilderContent() {
    return `
      <div class="orchestrator-builder">
        <div class="orchestrator-prompt-section">
          <h3>📝 Zadání projektu</h3>

          <div class="complexity-selector">
            <label>Složitost projektu:</label>
            <div class="complexity-buttons">
              <button class="complexity-btn active" data-complexity="1" title="Jedna HTML stránka">
                <span class="complexity-icon">1️⃣</span>
                <span class="complexity-label">Základ</span>
                <span class="complexity-desc">Jedna HTML stránka</span>
              </button>
              <button class="complexity-btn" data-complexity="2" title="HTML + CSS + JS v samostatných souborech">
                <span class="complexity-icon">2️⃣</span>
                <span class="complexity-label">Menší projekt</span>
                <span class="complexity-desc">HTML, CSS, JS soubory</span>
              </button>
              <button class="complexity-btn" data-complexity="3" title="Rozsáhlejší projekt s více soubory">
                <span class="complexity-icon">3️⃣</span>
                <span class="complexity-label">Rozsáhlý projekt</span>
                <span class="complexity-desc">Více souborů a struktura</span>
              </button>
            </div>
          </div>

          <textarea
            id="orchestratorPromptInput"
            class="orchestrator-prompt-textarea"
            placeholder="Popište co chcete vytvořit... Například: 'Vytvoř responzivní landing page s kontaktním formulářem'"
            rows="4"
          ></textarea>

          <div class="orchestrator-ai-help">
            <h4>💬 AI Asistent pro upřesnění zadání</h4>
            <div class="orchestrator-chat-messages" id="orchestratorChatMessages">
              <div class="orchestrator-message system">
                👋 Jsem AI asistent. Pomohu ti upřesnit zadání a navrhnout optimální tým agentů. Zeptej se mě na cokoliv!
              </div>
            </div>
            <div class="orchestrator-chat-input">
              <textarea
                id="orchestratorChatInput"
                placeholder="Zeptej se AI na upřesnění..."
                rows="2"
              ></textarea>
              <button class="btn-orchestrator-send" id="orchestratorSendBtn">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20">
                  <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/>
                </svg>
              </button>
            </div>
          </div>
        </div>

        <div class="orchestrator-team-preview">
          <h3>👥 Navržený tým (bude vytvořen po aktivaci)</h3>
          <div id="orchestratorTeamPreview" class="team-preview-list">
            <div class="team-preview-placeholder">
              Zadejte projekt a AI navrhne optimální tým agentů...
            </div>
          </div>
        </div>

        <div class="orchestrator-actions">
          <button class="btn-orchestrator-analyze" id="orchestratorAnalyzeBtn">
            🔍 Analyzovat a navrhnout tým
          </button>
          <button class="btn-orchestrator-activate" id="orchestratorActivateBtn" disabled>
            ✨ Vytvořit projekt s týmem (0 agentů)
          </button>
        </div>
      </div>
    `;
  }

  attachOrchestratorBuilderHandlers(modal) {
    const promptInput = modal.element.querySelector('#orchestratorPromptInput');
    const chatInput = modal.element.querySelector('#orchestratorChatInput');
    const sendBtn = modal.element.querySelector('#orchestratorSendBtn');
    const analyzeBtn = modal.element.querySelector('#orchestratorAnalyzeBtn');
    const activateBtn = modal.element.querySelector('#orchestratorActivateBtn');
    const complexityBtns = modal.element.querySelectorAll('.complexity-btn');

    // Store selected complexity
    this.selectedComplexity = 1;

    // Complexity selector
    complexityBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        complexityBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.selectedComplexity = parseInt(btn.dataset.complexity);

        // Update placeholder based on complexity
        const placeholders = {
          1: 'Například: Vytvoř jednoduchou vizitku s kontaktem',
          2: 'Například: Vytvoř landing page s formulářem a stylovaným designem',
          3: 'Například: Vytvoř kompletní webovou aplikaci s menu, více stránkami a interaktivními prvky'
        };
        promptInput.placeholder = placeholders[this.selectedComplexity];
      });
    });

    // Chat with AI
    const sendMessage = async () => {
      const message = chatInput.value.trim();
      if (!message) return;

      this.addOrchestratorMessage('user', message);
      chatInput.value = '';

      try {
        const context = promptInput.value.trim();
        const systemPrompt = `Jsi expert project manager a solution architect pomáhající s definicí webového projektu.

📋 AKTUÁLNÍ ZADÁNÍ:
"${context || '🔴 Zatím nespecifikováno - pomoz uživateli definovat projekt'}"

🎯 TVOJE ROLE:
1. **Upřesnit požadavky** - co přesně projekt má dělat?
2. **Identifikovat technologie** - HTML/CSS/JS, framework, knihovny?
3. **Navrhnout strukturu** - komponenty, stránky, funkce
4. **Určit komplexitu** - simple/medium/complex
5. **Doporučit typy agentů** - frontend, backend, fullstack?

💡 KLÍČOVÉ OTÁZKY K POLOŽENÍ:
- Jaký je účel aplikace? (e-shop, portfólio, tool...)
- Kdo jsou uživatelé? (obecná veřejnost, admin...)
- Potřebuješ backend? (databáze, API, auth...)
- Jaké hlavní funkce? (formuláře, kalkulace, CRUD...)
- Máš designové požadavky? (barvy, layout...)

✅ BEST PRACTICES:
- Ptej se na 1-2 věci najednou (ne všechno naráz)
- Navrhuj konkrétní řešení s příklady
- Zmiň možná úskalí a jak je řešit
- Doporuč vhodný tým agentů pro daný typ projektu

📝 STYL ODPOVĚDI:
- Krátké odstavce, emoji pro přehlednost
- Konkrétní a akční rady
- V češtině, přátelsky ale profesionálně`;

        const response = await window.AI.ask(message, {
          provider: 'groq',
          system: systemPrompt,
          temperature: 0.7
        });

        this.addOrchestratorMessage('assistant', response);

        // Update main prompt if AI suggests improvements
        if (response.toLowerCase().includes('navrhuji') || response.toLowerCase().includes('mělo by')) {
          analyzeBtn.style.animation = 'pulse 1s ease-in-out 2';
        }

      } catch (error) {
        this.addOrchestratorMessage('system', '❌ Chyba: ' + error.message);
      }
    };

    if (sendBtn) {
      sendBtn.addEventListener('click', sendMessage);
    }

    if (chatInput) {
      chatInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          sendMessage();
        }
      });
    }

    // Analyze and suggest team
    if (analyzeBtn) {
      analyzeBtn.addEventListener('click', async () => {
        const projectDescription = promptInput.value.trim();
        if (!projectDescription) {
          toast.show('❌ Zadejte popis projektu', 'error');
          return;
        }

        analyzeBtn.disabled = true;
        analyzeBtn.textContent = '🔄 Analyzuji...';

        try {
          const teamSuggestion = await this.analyzeProjectAndSuggestTeam(projectDescription);
          this.displayTeamPreview(teamSuggestion);

          activateBtn.disabled = false;
          activateBtn.textContent = `✨ Aktivovat tým (${teamSuggestion.agents.length} agentů)`;

          // Store suggestion for activation
          this.currentTeamSuggestion = teamSuggestion;

        } catch (error) {
          toast.show('❌ Chyba při analýze: ' + error.message, 'error');
        } finally {
          analyzeBtn.disabled = false;
          analyzeBtn.textContent = '🔍 Analyzovat a navrhnout tým';
        }
      });
    }

    // Activate team
    if (activateBtn) {
      activateBtn.addEventListener('click', async () => {
        if (this.currentTeamSuggestion) {
          activateBtn.disabled = true;
          activateBtn.textContent = '🔄 Spouštím agenty...';

          // Close modal immediately to show animation in chat
          modal.close();

          // Show AI panel with chat tab
          eventBus.emit('panel:show', { name: 'ai' });

          try {
            await this.activateOrchestratedTeam(this.currentTeamSuggestion, promptInput.value.trim(), true);
          } catch (error) {
            toast.show('❌ Chyba při vytváření projektu: ' + error.message, 'error');
            console.error('Orchestration error:', error);
          }
        }
      });
    }
  }

  addOrchestratorMessage(role, content) {
    const messagesContainer = this.currentOrchestratorModal?.element?.querySelector('#orchestratorChatMessages');
    if (!messagesContainer) return;

    const messageEl = document.createElement('div');
    messageEl.className = `orchestrator-message ${role}`;
    messageEl.innerHTML = `<p>${this.escapeHtml(content)}</p>`;

    messagesContainer.appendChild(messageEl);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;

    this.orchestratorChatHistory.push({ role, content });
  }

  async analyzeProjectAndSuggestTeam(projectDescription) {
    const systemPrompt = `Jsi expert AI team architect. Analyzuj projekt a navrhni optimální tým AI agentů.

🤖 DOSTUPNÍ AGENTI (POUŽIJ POUZE TATO ID!):

1. **orchestrator** - Hlavní koordinátor (automaticky aktivní)
   • Řídí komunikaci mezi agenty
   • Deleguje úkoly
   • Monitoruje progress

2. **architect** - Solution architect
   • Návrh struktury aplikace
   • Volba technologií
   • Definice komponent

3. **frontend** - Frontend developer
   • HTML, CSS, vanilla JS
   • React/Vue komponenty
   • Responzivní UI

4. **backend** - Backend developer
   • API endpoints
   • Databázové schéma
   • Server logika (Node.js/Python)

5. **fullstack** - Full-stack developer
   • End-to-end features
   • Frontend + Backend integrace
   • Komplexní funkcionalita

6. **debugger** - Bug hunter
   • Hledání chyb
   • Fix console errors
   • Performance issues

7. **reviewer** - Code reviewer
   • Quality assurance
   • Best practices check
   • Security audit

8. **documentation** - Tech writer
   • README, komentáře
   • API docs
   • User guides

9. **tester** - QA engineer
   • Unit testy
   • Integration testy
   • Manual testing

📋 VÝSTUP - POUZE VALIDNÍ JSON:
{
  "projectType": "web-app|landing-page|dashboard|e-shop|portfolio|tool",
  "complexity": "simple|medium|complex",
  "estimatedTime": "5 min|30 min|2 hours",
  "agents": [
    {
      "id": "frontend",
      "task": "Konkrétní, akční úkol (ne obecný)",
      "priority": 1
    },
    {
      "id": "debugger",
      "task": "Testovat funkčnost a opravit bugy",
      "priority": 3
    }
  ],
  "workflow": "1. Architect navrhne → 2. Frontend/Backend implementuje → 3. Debugger testuje"
}

⚠️ PRAVIDLA:
- Simple projekt: 2-3 agenti (frontend + debugger)
- Medium projekt: 3-5 agentů (architect + frontend/fullstack + reviewer)
- Complex projekt: 5+ agentů (celý tým)
- Priority: 1=ASAP, 2=high, 3=medium, 4=low, 5=nice-to-have
- Task MUSÍ být konkrétní akce, ne role popis`;

    const response = await window.AI.ask(`Projekt: ${projectDescription}`, {
      provider: 'groq',
      system: systemPrompt,
      temperature: 0.3
    });

    // Parse JSON from response
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('AI nevrátila validní JSON odpověď');
    }

    return JSON.parse(jsonMatch[0]);
  }

  displayTeamPreview(teamSuggestion) {
    const previewContainer = this.currentOrchestratorModal?.element?.querySelector('#orchestratorTeamPreview');
    if (!previewContainer) return;

    // Get agent info from actual registered agents
    const getAgentInfo = (agentId) => {
      const agent = window.AIAgents?.getAgent(agentId);
      if (agent) {
        return { icon: agent.icon, name: agent.name };
      }
      // Fallback for unknown agents
      return { icon: '❓', name: agentId };
    };

    previewContainer.innerHTML = `
      <div class="team-preview-header">
        <div class="team-info">
          <span class="team-type">📊 Typ: ${teamSuggestion.projectType}</span>
          <span class="team-complexity">🎯 Složitost: ${teamSuggestion.complexity}</span>
        </div>
        <div class="team-workflow">
          <strong>Workflow:</strong> ${teamSuggestion.workflow}
        </div>
      </div>
      ${teamSuggestion.agents.sort((a, b) => a.priority - b.priority).map((agent, index) => {
        const agentInfo = getAgentInfo(agent.id);
        return `
          <div class="team-agent-preview" data-priority="${agent.priority}">
            <div class="team-agent-number">#${index + 1}</div>
            <div class="team-agent-icon">${agentInfo.icon}</div>
            <div class="team-agent-info">
              <div class="team-agent-name">${agentInfo.name}</div>
              <div class="team-agent-task">${agent.task}</div>
            </div>
            <div class="team-agent-priority priority-${agent.priority}">
              Priorita: ${agent.priority}
            </div>
          </div>
        `;
      }).join('')}
    `;
  }

  async activateOrchestratedTeam(teamSuggestion, projectDescription, forceNew = false) {
    if (!window.AIAgents) {
      toast.error('❌ AI Agents System není k dispozici', 3000);
      return;
    }

    // Store tasks for agents
    if (!this.agentTasks) {
      this.agentTasks = new Map();
    }

    // Prepare agent activation data - filter out non-existent agents
    const agentIds = [];
    const notFoundAgents = [];

    teamSuggestion.agents.forEach(agentConfig => {
      const agent = window.AIAgents.getAgent(agentConfig.id);
      if (agent) {
        agentIds.push(agentConfig.id);
        this.agentTasks.set(agentConfig.id, agentConfig.task);
      } else {
        notFoundAgents.push(agentConfig.id);
        console.warn(`⚠️ Agent ${agentConfig.id} nenalezen`);
      }
    });

    if (notFoundAgents.length > 0) {
      console.warn(`⚠️ Nenalezení agenti: ${notFoundAgents.join(', ')}`);
    }

    if (agentIds.length === 0) {
      toast.error('❌ Žádný validní agent k aktivaci', 3000);
      return;
    }

    // Activate all agents at once
    const results = window.AIAgents.activateAgents(agentIds);
    const successCount = results.filter(r => r.success).length;

    if (successCount === 0) {
      toast.error('❌ Nepodařilo se aktivovat žádného agenta', 3000);
      return;
    }

    console.log(`✅ Aktivováno ${successCount}/${agentIds.length} agentů`);

    if (successCount < agentIds.length) {
      const failed = results.filter(r => !r.success).map(r => r.name).join(', ');
      toast.warning(`⚠️ Někteří agenti nebyli aktivováni: ${failed}`, 4000);
    } else {
      toast.success(`✅ Aktivováno ${successCount} agentů`, 2000);
    }

    // Update UI
    this.loadAgentsGrid();
    this.updateActiveAgentsList();

    // Check if editor already has content from previous orchestration
    const currentCode = state.get('editor.code') || '';
    const hasExistingProject = currentCode.trim().length > 100; // More than just basic HTML

    // Only skip orchestration if NOT forced and has existing project
    if (hasExistingProject && !forceNew) {
      // User is refining existing project via normal chat - keep the code and context
      console.log('🔄 Editor obsahuje existující projekt - zachovávám kontext pro úpravy (pokud chceš začít znovu, klikni na orchestrační tlačítka)');

      // Add system message that agents will improve existing code
      this.addChatMessage('system', '💡 Editor již obsahuje projekt. Pokud chceš začít úplně od začátku, klikni na orchestrační tlačítka v levém panelu.');

      // Keep originalCode for comparison
      this.originalCode = currentCode;

      // Don't clear chat history - agents need context of what was done before
      return; // Exit without starting orchestration
    }

    // Clear editor AND chat history for new project (either empty or forceNew)
    console.log('🗑️ Mazání editoru a historie pro nový projekt...');
    this.originalCode = '';
    state.set('editor.code', '');
    eventBus.emit('editor:setCode', { code: '' });

    // DŮLEŽITÉ: Vymazat chat historii aby AI neviděla starý kód
    this.chatHistory = [];
    this.updateHistoryInfo();

    // Visual feedback for user
    toast.info('🗑️ Editor a historie vymazány - začínáme nový projekt', 2000);

    // Switch to chat tab
    const chatTab = this.modal.element.querySelector('[data-tab="chat"]');
    if (chatTab) {
      chatTab.click();
    }

    // Generate project with AI
    const complexity = this.selectedComplexity || 1;
    const complexityDescriptions = {
      1: 'jednoduchý projekt v jednom HTML souboru',
      2: 'menší projekt s oddělenými HTML, CSS a JS soubory',
      3: 'rozsáhlý projekt s více soubory a strukturou'
    };

    const orchestratorPrompt = `🎯 ORCHESTRATOR AKTIVOVÁN - NOVÝ PROJEKT

⚠️ KRITICKÁ INSTRUKCE: Předchozí kontext je SMAZÁN. Editor je prázdný. Začínáš od nuly.

Projekt: ${projectDescription}
Složitost: ${complexityDescriptions[complexity]}

Aktivovaný tým agentů (${teamSuggestion.agents.length}):
${teamSuggestion.agents.map((a, i) => `${i + 1}. ${a.id} - ${a.task}`).join('\n')}

Workflow: ${teamSuggestion.workflow}

🚨 KRITICKÁ PRAVIDLA (NESELHEJ!):
1. Vytvoř KOMPLETNĚ NOVÝ projekt (ignoruj vše předchozí)
2. ${complexity === 1 ? 'Celý projekt v JEDNOM HTML souboru včetně <style> a <script>.' : complexity === 2 ? 'Rozděl do HTML, CSS a JS souborů.' : 'Kompletní struktura s více soubory.'}
3. Začni kompletním základním souborem (<!DOCTYPE html>...</html>)
4. 🔥 KAŽDÁ PROMĚNNÁ MUSÍ MÍT UNIKÁTNÍ NÁZEV! 🔥
   - NIKDY nedeklaruj stejnou proměnnou 2x (např. let x; ... let x; ❌)
   - Použij různé názvy: cislo1, cislo2, hodnota1, hodnota2
   - Kontroluj kód PŘED odesláním!
5. Kód FUNKČNÍ na první spuštění (bez chyb!)

⚠️ POZOR: Kód bude validován! Duplicitní proměnné = SELHÁNÍ!

Začni vytvořením kompletního základního souboru.`;

    // Add to chat history
    this.chatHistory.push({
      role: 'system',
      content: orchestratorPrompt
    });

    // Display in chat
    this.addChatMessage('system', orchestratorPrompt);

    // Use real orchestrated session with agent collaboration
    try {
      console.log(`🎯 Spouštím orchestrovanou session s ${teamSuggestion.agents.length} agenty...`);

      // Show animated loading message
      const loadingMsgId = `loading-${Date.now()}`;
      const messagesContainer = this.modal.element.querySelector('#aiChatMessages');
      const loadingEl = document.createElement('div');
      loadingEl.className = 'ai-message system';
      loadingEl.id = loadingMsgId;
      loadingEl.innerHTML = `
        <div class="orchestrator-loading">
          <div class="loading-spinner"></div>
          <div class="loading-text">
            <strong>🤖 Agenti spolupracují na projektu...</strong>
            <div class="agent-status" id="agent-status-${loadingMsgId}"></div>
          </div>
        </div>
      `;
      messagesContainer.appendChild(loadingEl);
      messagesContainer.scrollTop = messagesContainer.scrollHeight;

      // Call orchestrated session from AIAgents
      const agentIds = teamSuggestion.agents.map(a => a.id);
      const taskDescription = `Vytvoř ${complexityDescriptions[complexity]}: ${projectDescription}

Úkoly pro jednotlivé agenty:
${teamSuggestion.agents.map(a => `- ${a.id}: ${a.task}`).join('\n')}

Každý agent pracuje na své části, výsledky se kombinují do finálního projektu.`;

      const orchestrationResult = await window.AIAgents.orchestratedSession(taskDescription, {
        complexity: complexity,
        projectType: teamSuggestion.projectType,
        onProgress: (status) => {
          // Update loading status
          const statusEl = document.getElementById(`agent-status-${loadingMsgId}`);
          if (statusEl) {
            statusEl.textContent = status;
          }
        }
      });

      // Remove loading message
      loadingEl.remove();

      // Process and display results with detailed logging
      console.log('✅ Orchestrace dokončena, zpracovávám výsledky...');
      console.log('Struktura výsledků:', JSON.stringify(orchestrationResult, null, 2));

      let finalCode = '';
      let hasCode = false;

      // Extract code from results
      for (const phaseResult of orchestrationResult) {
        console.log(`Zpracovávám fázi: ${phaseResult.phase}`);

        if (phaseResult.phase === 'synthesis' && phaseResult.response) {
          const synthesisText = phaseResult.response.response || phaseResult.response;
          console.log('Synthesis odpověď:', synthesisText.substring(0, 200));

          // Try to extract code block
          const codeMatch = synthesisText.match(/```(?:html|javascript|js)?\s*\n?([\s\S]*?)```/);
          if (codeMatch) {
            finalCode = codeMatch[1].trim();
            hasCode = true;
            console.log('✅ Nalezen kód v code blocku');
          } else if (synthesisText.includes('<!DOCTYPE') || synthesisText.includes('<html')) {
            finalCode = synthesisText;
            hasCode = true;
            console.log('✅ Nalezen přímý HTML kód');
          } else {
            console.log('⚠️ Synthesis neobsahuje kód, jen text');
          }

          // Display message
          this.addChatMessage('assistant', `✅ **Orchestrator:** ${hasCode ? 'Projekt vytvořen' : 'Analýza dokončena'}`);

          if (hasCode) {
            // Validate
            const duplicates = this.detectDuplicateVariables(finalCode);
            if (duplicates.length > 0) {
              this.addChatMessage('system', `⚠️ Varování: ${duplicates.join(', ')}`);
            }

            // Display with accept/reject
            this.addChatMessageWithCode('assistant', `\`\`\`html\n${finalCode}\n\`\`\``, taskDescription);
          } else {
            // Show text response
            this.addChatMessage('assistant', synthesisText);
          }
        }

        // Also try execution phase if no code yet
        if (!hasCode && phaseResult.phase === 'execution' && phaseResult.responses) {
          console.log('Hledám kód v execution responses...');
          for (const resp of phaseResult.responses) {
            const text = resp.response || '';
            const match = text.match(/```(?:html)?\s*\n?([\s\S]*?)```/);
            if (match) {
              finalCode = match[1].trim();
              hasCode = true;
              console.log(`✅ Kód nalezen od ${resp.agent}`);
              this.addChatMessageWithCode('assistant', `\`\`\`html\n${finalCode}\n\`\`\``, taskDescription);
              break;
            }
          }
        }
      }

      if (!hasCode) {
        console.error('❌ Žádný kód nebyl nalezen v odpovědích');
        this.addChatMessage('system', '⚠️ Agenti nedokončili kód. Zkus to znovu nebo zjednoduš zadání.');
      }

      toast.show(`✨ Orchestrace dokončena! ${teamSuggestion.agents.length} agentů spolupracovalo`, 'success');
    } catch (error) {
      console.error('Error in orchestrated session:', error);

      // Remove loading if exists
      const loadingEl = this.modal.element.querySelector('[id^="loading-"]');
      if (loadingEl) loadingEl.remove();

      await this.sendMessage('Vytvoř KOMPLETNĚ NOVÝ projekt podle výše uvedených specifikací. Začni od začátku s prázdným editorem. Vygeneruj celý kód v jednom bloku.');
    }
  }

  // ============== TESTING HANDLERS ==============

  attachTestingHandlers() {
    // Start all tests button
    const startAllBtn = this.modal.element.querySelector('#startAllTestsBtn');
    if (startAllBtn) {
      startAllBtn.addEventListener('click', () => this.runAllTests());
    }

    // Stop tests button
    const stopBtn = this.modal.element.querySelector('#stopTestsBtn');
    if (stopBtn) {
      stopBtn.addEventListener('click', () => {
        this.aiTester.stop();
        toast.show('Testování zastaveno', 'info');
      });
    }

    // Export results button
    const exportBtn = this.modal.element.querySelector('#exportResultsBtn');
    if (exportBtn) {
      exportBtn.addEventListener('click', () => this.exportTestResults());
    }

    // Provider test buttons
    const providerBtns = this.modal.element.querySelectorAll('.provider-test-btn');
    providerBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const provider = btn.dataset.provider;
        this.runProviderTest(provider);
      });
    });
  }

  async runAllTests() {
    const progressDiv = this.modal.element.querySelector('#testingProgress');
    const progressFill = this.modal.element.querySelector('#testProgressFill');
    const progressText = this.modal.element.querySelector('#testProgressText');
    const progressStatus = this.modal.element.querySelector('#testProgressStatus');
    const statsDiv = this.modal.element.querySelector('#testingStats');
    const resultsDiv = this.modal.element.querySelector('#testingResults');
    const startBtn = this.modal.element.querySelector('#startAllTestsBtn');
    const stopBtn = this.modal.element.querySelector('#stopTestsBtn');
    const exportBtn = this.modal.element.querySelector('#exportResultsBtn');

    // Show progress, hide buttons
    progressDiv.style.display = 'block';
    statsDiv.style.display = 'none';
    resultsDiv.style.display = 'none';
    startBtn.style.display = 'none';
    stopBtn.style.display = 'inline-flex';
    exportBtn.style.display = 'none';

    try {
      await this.aiTester.testAllModels((progress) => {
        // Update progress bar
        progressFill.style.width = `${progress.progress}%`;
        progressText.textContent = `${progress.current} / ${progress.total} (${progress.progress}%)`;
        progressStatus.textContent = `Testování: ${progress.provider} - ${progress.model}`;
      });

      // Show results
      const stats = this.aiTester.getStats();
      this.displayTestStats(stats);
      this.displayTestResults(this.aiTester.results);

      statsDiv.style.display = 'block';
      resultsDiv.style.display = 'block';
      exportBtn.style.display = 'inline-flex';

      toast.show(`✅ Test dokončen: ${stats.success}/${stats.total} úspěšných`, 'success');
    } catch (error) {
      toast.show(`❌ Chyba při testování: ${error.message}`, 'error');
    } finally {
      stopBtn.style.display = 'none';
      startBtn.style.display = 'inline-flex';
    }
  }

  async runProviderTest(providerId) {
    const progressDiv = this.modal.element.querySelector('#testingProgress');
    const progressFill = this.modal.element.querySelector('#testProgressFill');
    const progressText = this.modal.element.querySelector('#testProgressText');
    const progressStatus = this.modal.element.querySelector('#testProgressStatus');
    const statsDiv = this.modal.element.querySelector('#testingStats');
    const resultsDiv = this.modal.element.querySelector('#testingResults');

    progressDiv.style.display = 'block';
    progressStatus.textContent = `Testování providera: ${providerId}`;

    try {
      const results = await this.aiTester.testProvider(providerId, (progress) => {
        const percent = Math.round((progress.current / progress.total) * 100);
        progressFill.style.width = `${percent}%`;
        progressText.textContent = `${progress.current} / ${progress.total} (${percent}%)`;
        progressStatus.textContent = `Testování: ${providerId} - ${progress.model}`;
      });

      // Display results
      this.displayTestResults(results);
      resultsDiv.style.display = 'block';

      const successCount = results.filter(r => r.status === 'success').length;
      toast.show(`✅ ${providerId}: ${successCount}/${results.length} úspěšných`, 'success');
    } catch (error) {
      toast.show(`❌ Chyba při testování ${providerId}: ${error.message}`, 'error');
    }
  }

  displayTestStats(stats) {
    if (!stats) return;

    this.modal.element.querySelector('#statTotal').textContent = stats.total;
    this.modal.element.querySelector('#statSuccess').textContent = stats.success;
    this.modal.element.querySelector('#statError').textContent = stats.error;
    this.modal.element.querySelector('#statNoKey').textContent = stats.noKey;
    this.modal.element.querySelector('#statAvgTime').textContent = `${stats.avgResponseTime}ms`;
  }

  displayTestResults(results) {
    const tbody = this.modal.element.querySelector('#resultsTableBody');
    if (!tbody) return;

    tbody.innerHTML = '';

    results.forEach(result => {
      const row = document.createElement('tr');
      row.className = `result-row result-${result.status}`;

      const statusIcon = {
        'success': '✅',
        'error': '❌',
        'no-key': '⚠️',
        'pending': '⏳'
      }[result.status] || '❓';

      const statusText = {
        'success': 'Úspěch',
        'error': 'Chyba',
        'no-key': 'Bez klíče',
        'pending': 'Čeká'
      }[result.status] || result.status;

      row.innerHTML = `
        <td>${result.provider}</td>
        <td>${result.model}</td>
        <td><span class="status-badge status-${result.status}">${statusIcon} ${statusText}</span></td>
        <td>${result.responseTime}ms</td>
        <td class="error-cell">${result.error || '-'}</td>
      `;

      tbody.appendChild(row);
    });
  }

  exportTestResults() {
    const data = this.aiTester.exportResults();
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ai-test-results-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);

    toast.show('📥 Výsledky exportovány', 'success');
  }

  /**
   * Show loading overlay with animation
   */
  showLoadingOverlay(message, subtitle = '') {
    // Remove existing overlay if any
    this.hideLoadingOverlay();

    const overlay = document.createElement('div');
    overlay.id = 'github-loading-overlay';
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.8);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10000;
      backdrop-filter: blur(4px);
    `;

    overlay.innerHTML = `
      <div style="
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        padding: 40px 60px;
        border-radius: 16px;
        text-align: center;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
        max-width: 500px;
      ">
        <div style="
          width: 60px;
          height: 60px;
          border: 4px solid rgba(255, 255, 255, 0.3);
          border-top-color: white;
          border-radius: 50%;
          margin: 0 auto 20px;
          animation: spin 1s linear infinite;
        "></div>
        <h2 style="color: white; margin: 0 0 10px; font-size: 24px;">${message}</h2>
        ${subtitle ? `<p style="color: rgba(255, 255, 255, 0.8); margin: 0; font-size: 16px;">${subtitle}</p>` : ''}
      </div>
      <style>
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      </style>
    `;

    document.body.appendChild(overlay);
  }

  /**
   * Hide loading overlay
   */
  hideLoadingOverlay() {
    const overlay = document.getElementById('github-loading-overlay');
    if (overlay) {
      overlay.remove();
    }
  }
}

