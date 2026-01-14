/**
 * AI Panel Module
 * Provides AI assistant interface with chat, templates, and quick actions
 */

import { eventBus } from '../../core/events.js';
import { state } from '../../core/state.js';
import { SafeOps } from '../../core/safeOps.js';
import { Modal } from '../../ui/components/Modal.js';
import { toast } from '../../ui/components/Toast.js';
import { AITester } from './AITester.js';
import { toolSystem } from './tools/ToolSystem.js';
import { initializeTools } from './tools/index.js';
import { GitHubService } from './services/GitHubService.js';
import { CodeEditorService } from './services/CodeEditorService.js';
import { TemplatesService } from './services/TemplatesService.js';
import { FileAttachmentService } from './services/FileAttachmentService.js';
import { AgentsService } from './services/AgentsService.js';
import { ChatHistoryService } from './services/ChatHistoryService.js';
import { ChatService } from './services/ChatService.js';
import { PromptBuilder } from './services/PromptBuilder.js';
import { MESSAGES, ICONS } from './constants/Messages.js';
import { UIRenderingService } from './services/UIRenderingService.js';
import { ActionsService } from './services/ActionsService.js';
import { TestingService } from './services/TestingService.js';
import { PokecChatService } from './services/PokecChatService.js';
import { ChangedFilesService } from './services/ChangedFilesService.js';

export class AIPanel {
  constructor() {
    this.modal = null;
    this.chatService = new ChatService();
    this.promptBuilder = new PromptBuilder(this);
    this.chatHistory = this.chatService.getHistory();
    this.pendingChanges = new Map(); // Store pending changes for accept/reject
    this.originalCode = null; // Store original code before changes
    this.aiTester = new AITester();
    this.isProcessing = false; // Race condition protection
    this.eventListeners = []; // Track event listeners for cleanup
    this.toolSystem = toolSystem; // Tool System pro VS Code Mode
    this.formatCache = new Map(); // Cache for formatted messages
    this.githubService = new GitHubService(this); // GitHub integration service
    this.codeEditorService = new CodeEditorService(this); // Code editing service
    this.templatesService = new TemplatesService(this); // Templates and prompts service
    this.fileAttachmentService = new FileAttachmentService(this); // File attachment service
    this.agentsService = new AgentsService(this); // AI agents and orchestration service
    this.chatHistoryService = new ChatHistoryService(this); // Chat history management service
    this.uiRenderingService = new UIRenderingService(this); // UI rendering service
    this.actionsService = new ActionsService(this); // Quick actions service
    this.testingService = new TestingService(this); // Testing service
    this.pokecChatService = new PokecChatService(this); // Pokec chat service
    this.changedFilesService = new ChangedFilesService(this); // Changed files tracking
    this.lastTokenUsage = null; // Store last request token usage

    // Režim práce (continue = pokračovat, new-project = nový projekt)
    this.workMode = 'continue';

    // Režim konverzace (code = práce s kódem, chat = obecný pokeč)
    this.conversationMode = 'code';

    // Inicializuj tools
    initializeTools();

    // Poslouchej AI request:complete pro zobrazení token usage
    if (window.AI) {
      window.AI.on('request:complete', (data) => {
        this.lastTokenUsage = data;
        console.log('📊 Token usage:', `${data.tokensIn}→${data.tokensOut} (${data.duration}ms)`);
      });
    }

    this.setupEventListeners();
  }

  setupEventListeners() {
    // Track listeners for cleanup
    const listeners = [
      { event: 'ai:show', handler: () => this.show() },
      { event: 'ai:hide', handler: () => this.hide() },
      { event: 'ai:sendMessage', handler: (data) => this.sendMessage(data.message) },
      { event: 'aiSettings:show', handler: () => this.showSettings() },
      { event: 'console:errorCountChanged', handler: (data) => this.updateErrorIndicator(data.count) },
      { event: 'ai:github-search', handler: () => this.showGitHubSearchDialog() },
      {
        event: 'github:showLoginModal',
        handler: async ({ callback }) => {
          try {
            const result = await this.showGitHubLoginModal();
            if (result && callback) {
              callback(result);
            }
          } catch (error) {
            console.error('GitHub login modal error:', error);
          }
        }
      }
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
    this.chatHistoryService.restoreChatMessages();
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
        <button class="ai-menu-btn" id="aiMenuBtn" title="Hlavní menu">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 16px; height: 16px;">
            <path d="M3 12h18M3 6h18M3 18h18"/>
          </svg>
          <span>Menu</span>
        </button>
        <div class="ai-menu-dropdown hidden" id="aiMenuDropdown">
          <button class="ai-menu-item" data-tab="chat">◆ Kód</button>
          <button class="ai-menu-item" data-tab="pokec">💬 Pokeč</button>
          <button class="ai-menu-item" data-tab="agents">🤖 Agenti</button>
          <button class="ai-menu-item" data-tab="editor">📝 Editor</button>
          <button class="ai-menu-item" data-tab="actions">⚡ Akce</button>
          <button class="ai-menu-item" data-tab="prompts">📝 Prompty</button>
          <button class="ai-menu-item" data-tab="testing">🧪 Testing</button>
          <button class="ai-menu-item" data-tab="github">🔗 GitHub</button>
          <div class="ai-menu-divider"></div>
          <button class="ai-menu-item" data-action="export">📥 Export chatu</button>
          <button class="ai-menu-item" data-action="clear">🗑️ Vymazat historii</button>
        </div>
        <div class="ai-settings-header" id="aiSettingsHeader">
          <button class="ai-settings-toggle" type="button">AI <span class="toggle-arrow">▼</span></button>
          <div class="ai-header-settings hidden">
            <div class="auto-ai-container">
              <label class="auto-ai-label">
                <input type="checkbox" id="autoAI" class="auto-ai-checkbox" checked>
                <span class="auto-ai-text">🤖 Auto AI</span>
              </label>
            </div>
            <div class="ai-provider-selector">
              <label for="aiProvider">Provider:</label>
              <select id="aiProvider" class="ai-select" disabled>
                ${this.generateProviderOptions()}
              </select>
            </div>
            <div class="ai-model-selector">
              <label for="aiModel">Model:</label>
              <select id="aiModel" class="ai-select" disabled>
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

    // Initialize Auto AI state
    const autoAICheckbox = this.modal.element.querySelector('#autoAI');
    const savedAutoAI = localStorage.getItem('autoAI');
    if (savedAutoAI !== null) {
      autoAICheckbox.checked = savedAutoAI === 'true';
    }

    // Initialize provider/model after DOM is ready
    const providerSelect = this.modal.element.querySelector('#aiProvider');
    if (providerSelect) {
      this.updateModels(providerSelect.value);
    }

    // Update provider/model enabled state based on Auto AI
    this.updateAutoAIState();

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
              <button class="ai-mode-toggle" id="aiModeToggle" title="Přepnout režim práce">
                <span class="mode-icon">📝</span>
                <span class="mode-text">Pokračovat</span>
              </button>
            </div>
            <div class="ai-chat-messages" id="aiChatMessages">
              <div class="ai-message system">
                <p>Ahoj! Jsem tvůj AI asistent. Můžu ti pomoct s kódem, vysvětlit koncepty, nebo vytvořit šablony. Co potřebuješ?</p>
              </div>
            </div>
            <!-- Fixní spodní část - vždy viditelná -->
            <div class="ai-chat-footer">
              <!-- Panel změněných souborů (VS Code style) -->
              <div class="ai-changed-files" id="aiChangedFiles" style="display: none;">
                <div class="changed-files-header">
                  <span class="changed-files-count">0 souborů změněno</span>
                  <div class="changed-files-actions">
                    <button class="keep-changes-btn" title="Nechat všechny změny">Nechat</button>
                    <button class="revert-changes-btn" title="Vrátit všechny změny zpět">Vrátit zpět</button>
                  </div>
                </div>
                <div class="changed-files-list" id="changedFilesList"></div>
              </div>
              <!-- Input oblast -->
              <div class="ai-chat-input">
              <div class="token-counter" id="tokenCounter">
                <span class="token-count">0</span> tokenů zpráva / <span class="total-token-count">~0</span> celkem (se systémem)
              </div>
              <div class="ai-attached-files" id="aiAttachedFiles" style="display: none; margin-bottom: 10px;"></div>
              <textarea
                id="aiChatInput"
                placeholder="Napiš zprávu... (Shift+Enter pro nový řádek)"
                rows="3"
              ></textarea>
              <div class="ai-chat-buttons">
                <button class="ai-error-indicator compact" id="aiErrorIndicator" title="Počet chyb v kódu">
                  <span class="error-count">0</span>
                </button>
                <button class="ai-attach-btn compact" id="aiAttachBtn" title="Přidat soubor">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48"/>
                  </svg>
                </button>
                <button class="ai-send-btn compact" id="aiSendBtn" title="Odeslat zprávu">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/>
                  </svg>
                </button>
                <button class="ai-cancel-btn-original compact" style="display: none;" title="Zrušit">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M18 6L6 18M6 6l12 12"/>
                  </svg>
                </button>
                <button class="ai-orchestrator-btn compact" id="aiOrchestratorBtn" title="Orchestrator">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M12 2L2 7l10 5 10-5-10-5z"/>
                    <path d="M2 17l10 5 10-5"/>
                    <path d="M2 12l10 5 10-5"/>
                  </svg>
                </button>
              </div>
            </div>
            </div> <!-- /ai-chat-footer -->
          </div>
        </div>

        <!-- Pokec Tab Content (separate chat for general conversation) -->
        <div class="ai-tab-content" data-content="pokec">
          <div class="ai-chat-container">
            <div class="ai-chat-header">
              <h3>💬 Pokeč s AI</h3>
              <p style="font-size: 12px; color: var(--text-secondary); margin: 4px 0 0 0;">Obecná konverzace - diskutuj o čemkoliv!</p>
            </div>
            <div class="ai-chat-messages" id="aiPokecMessages">
              <div class="ai-message system">
                <p>👋 Ahoj! Jsem v režimu volné konverzace. Můžeme si pokecát o programování, technologiích, algoritmech, nebo čemkoliv jiném. Ptej se na co chceš!</p>
              </div>
            </div>
            <div class="ai-chat-input">
              <div class="token-counter" id="pokecTokenCounter">
                <span class="token-count">0</span> tokenů zpráva / <span class="total-token-count">~0</span> celkem
              </div>
              <textarea
                id="aiPokecInput"
                placeholder="Zeptej se na cokoliv... (Shift+Enter pro nový řádek)"
                rows="3"
              ></textarea>
              <div class="ai-chat-buttons">
                <div class="pokec-prompt-dropdown">
                  <button class="pokec-prompt-btn" id="pokecPromptBtn" title="Rychlé prompty">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 18px; height: 18px;">
                      <path d="M12 5v14M5 12h14"/>
                    </svg>
                    <span>Prompty</span>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 14px; height: 14px; margin-left: 4px;">
                      <path d="M6 9l6 6 6-6"/>
                    </svg>
                  </button>
                  <div class="pokec-prompt-menu" id="pokecPromptMenu" style="display: none;">
                    <div class="prompt-item" data-prompt="search-code">
                      🔍 Hledat kód
                    </div>
                    <div class="prompt-item" data-prompt="explain-concept">
                      💡 Vysvětli koncept
                    </div>
                    <div class="prompt-item" data-prompt="best-practices">
                      ⭐ Best practices
                    </div>
                    <div class="prompt-item" data-prompt="debug-help">
                      🐛 Pomoct s debuggingem
                    </div>
                  </div>
                </div>
                <button class="ai-send-btn" id="aiPokecSendBtn">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/>
                  </svg>
                  <span>Odeslat</span>
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

        ${this.actionsService.getActionsTabHTML()}

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

        ${this.testingService.getTestingTabHTML()}

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
      errorBtn.addEventListener('click', () => {
        // Pokud je 0 chyb (zelené), otevři DevTools
        if (errorBtn.classList.contains('success')) {
          if (typeof eruda !== 'undefined') {
            eruda.init();
            eruda.show();
          } else {
            eventBus.emit('toast:show', {
              message: '🔧 DevTools nejsou k dispozici',
              type: 'warning',
              duration: 2000
            });
          }
        } else {
          // Jinak pošli chyby AI
          this.sendAllErrorsToAI();
        }
      });
    }
    // Initialize with current error count
    this.updateErrorIndicator(0);
  }

  updateErrorIndicator(errorCount) {
    const errorBtn = this.modal?.element?.querySelector('#aiErrorIndicator');
    if (!errorBtn) return;

    const countText = errorBtn.querySelector('.error-count');

    if (errorCount === 0) {
      errorBtn.className = 'ai-error-indicator compact success';
      countText.textContent = '0';
      errorBtn.title = 'Žádné chyby v konzoli';
    } else {
      errorBtn.className = 'ai-error-indicator compact error';
      countText.textContent = `${errorCount}`;
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
    // Deprecated: Use escapeHtml instead
    return this.escapeHtml(text);
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

      // Spočítej celkový počet tokenů včetně system promptu a přiložených souborů
      const currentCode = state.get('editor.code') || '';
      const attachedFiles = this.fileAttachmentService.getAttachedFiles();

      // Odhad system promptu (průměrně ~2000-3000 tokenů)
      let systemPromptTokens = 2000;
      const isDescriptionRequest = text.toLowerCase().match(/popi[šs]|popis|vysv[ěe]tli|co d[ěe]l[áa]|jak funguje/);
      if (isDescriptionRequest) {
        systemPromptTokens = 500; // Krátký prompt pro popis
      }

      // Tokeny z kódu v editoru
      const codeTokens = Math.ceil(currentCode.length / 4);

      // Tokeny z přiložených souborů
      let attachedFilesTokens = 0;
      if (attachedFiles && attachedFiles.length > 0) {
        attachedFiles.forEach(file => {
          attachedFilesTokens += Math.ceil(file.content.length / 4);
        });
      }

      // Celkový odhad
      const totalTokens = tokenCount + systemPromptTokens + codeTokens + attachedFilesTokens;

      tokenCounter.querySelector('.token-count').textContent = tokenCount;
      const totalCountSpan = tokenCounter.querySelector('.total-token-count');
      if (totalCountSpan) {
        totalCountSpan.textContent = `~${totalTokens.toLocaleString()}`;
      }

      // Color coding na základě celkového počtu
      if (totalTokens > 100000) {
        tokenCounter.style.color = '#ef4444';
      } else if (totalTokens > 50000) {
        tokenCounter.style.color = '#f59e0b';
      } else {
        tokenCounter.style.color = 'var(--text-secondary)';
      }
    });
  }

  attachEventHandlers() {
    // Menu Button and Dropdown
    const menuBtn = this.modal.element.querySelector('#aiMenuBtn');
    const menuDropdown = this.modal.element.querySelector('#aiMenuDropdown');
    const tabContents = this.modal.element.querySelectorAll('.ai-tab-content');

    if (menuBtn && menuDropdown) {
      // Toggle dropdown on click
      menuBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        menuDropdown.classList.toggle('hidden');
      });

      // Close dropdown when clicking outside
      document.addEventListener('click', (e) => {
        if (!menuBtn.contains(e.target) && !menuDropdown.contains(e.target)) {
          menuDropdown.classList.add('hidden');
        }
      });

      // Handle menu item clicks
      menuDropdown.querySelectorAll('.ai-menu-item').forEach(item => {
        item.addEventListener('click', (e) => {
          const tabName = item.dataset.tab;
          const action = item.dataset.action;
          menuDropdown.classList.add('hidden');

          if (action === 'export') {
            this.showExportDialog();
            return;
          }
          if (action === 'clear') {
            if (this.conversationMode === 'chat') {
              if (confirm('Opravdu chceš vymazat historii pokec chatu?')) {
                this.pokecChatService.clearHistory();
                toast.show('🗑️ Historie pokec chatu vymazána', 'success');
              }
            } else {
              this.chatHistoryService.clearChatHistory();
            }
            return;
          }

          // Handle conversation mode switch
          if (tabName === 'chat') {
            this.conversationMode = 'code';
            toast.show('💻 Režim: Práce s kódem', 'info');
            tabContents.forEach(c => c.classList.remove('active'));
            const chatContent = this.modal.element.querySelector('[data-content="chat"]');
            if (chatContent) chatContent.classList.add('active');
            return;
          }
          if (tabName === 'pokec') {
            this.conversationMode = 'chat';
            toast.show('💬 Režim: Obecná konverzace', 'info');
            tabContents.forEach(c => c.classList.remove('active'));
            const pokecContent = this.modal.element.querySelector('[data-content="pokec"]');
            if (pokecContent) pokecContent.classList.add('active');
            const pokecInput = this.modal.element.querySelector('#aiPokecInput');
            if (pokecInput) setTimeout(() => pokecInput.focus(), 100);
            return;
          }

          // Special handling for editor tab
          if (tabName === 'editor') {
            this.modal.close();
            const editorTextarea = document.querySelector('#editor');
            if (editorTextarea) editorTextarea.focus();
            toast.show('📝 Přepnuto na editor', 'info');
            return;
          }

          // Remove active class from all contents
          tabContents.forEach(c => c.classList.remove('active'));
          // Add active class to corresponding content
          const content = this.modal.element.querySelector(`[data-content="${tabName}"]`);
          if (content) content.classList.add('active');
        });
      });
    }

    // Chat Input & Send
    const chatInput = this.modal.element.querySelector('#aiChatInput');
    const sendBtn = this.modal.element.querySelector('#aiSendBtn');
    const attachBtn = this.modal.element.querySelector('#aiAttachBtn');

    // Pokec Input & Send
    const pokecInput = this.modal.element.querySelector('#aiPokecInput');
    const pokecSendBtn = this.modal.element.querySelector('#aiPokecSendBtn');

    // File attachment button
    if (attachBtn) {
      attachBtn.addEventListener('click', () => this.fileAttachmentService.showFileAttachmentModal());
    }

    if (chatInput && sendBtn) {
      const sendMessage = () => {
        const message = chatInput.value.trim();
        if (message) {
          this.sendMessage(message);
          chatInput.value = '';
          chatInput.style.height = 'auto';
          // Clear attached files after sending
          this.fileAttachmentService.clearAttachedFiles();
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

    // Pokec chat handlers - delegated to PokecChatService
    this.pokecChatService.attachHandlers();

    // AI Mode Toggle Button
    const modeToggleBtn = this.modal.element.querySelector('#aiModeToggle');
    if (modeToggleBtn) {
      modeToggleBtn.addEventListener('click', () => {
        // Simple toggle - no dialog here
        // Dialog will show when AI sends code to insert
        if (this.workMode === 'continue') {
          this.workMode = 'new-project';
          modeToggleBtn.querySelector('.mode-icon').textContent = '🆕';
          modeToggleBtn.querySelector('.mode-text').textContent = 'Nový projekt';
          modeToggleBtn.classList.add('new-project-mode');
          modeToggleBtn.title = 'Začít nový projekt (smaže současný kód)';
          console.log('[AIPanel] Režim změněn na: Nový projekt');
        } else {
          this.workMode = 'continue';
          modeToggleBtn.querySelector('.mode-icon').textContent = '📝';
          modeToggleBtn.querySelector('.mode-text').textContent = 'Pokračovat';
          modeToggleBtn.classList.remove('new-project-mode');
          modeToggleBtn.title = 'Přidávat kód k existujícímu projektu';
          console.log('[AIPanel] Režim změněn na: Pokračovat');
        }
      });
    }

    // Update history info
    this.chatHistoryService.updateHistoryInfo();

    // Quick actions - delegated to ActionsService
    this.actionsService.attachHandlers();

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
        this.githubService.handleGitHubAction(action);
      });
    });

    // GitHub token save button
    const saveGithubToken = this.modal.element.querySelector('#saveGithubToken');
    if (saveGithubToken) {
      saveGithubToken.addEventListener('click', () => this.githubService.saveGitHubToken(this.modal));
    }

    // GitHub OAuth login
    const githubOAuthLogin = this.modal.element.querySelector('#githubOAuthLogin');
    if (githubOAuthLogin) {
      githubOAuthLogin.addEventListener('click', () => this.githubService.initiateGitHubOAuth());
    }

    // Check token on load
    this.githubService.checkGitHubConnection(this.modal);

    // New project button
    const newProjectBtn = this.modal.element.querySelector('#aiNewProjectBtn');
    if (newProjectBtn) {
      newProjectBtn.addEventListener('click', () => this.startNewProject());
    }

    // AI Agents handlers
    this.agentsService.attachAgentsHandlers();

    // Provider change
    const providerSelect = this.modal.element.querySelector('#aiProvider');
    if (providerSelect) {
      providerSelect.addEventListener('change', (e) => {
        this.updateModels(e.target.value);
      });

      // Initialize models for default provider
      this.updateModels(providerSelect.value);
    }

    // Auto AI checkbox handler
    const autoAICheckbox = this.modal.element.querySelector('#autoAI');
    if (autoAICheckbox) {
      autoAICheckbox.addEventListener('change', () => {
        localStorage.setItem('autoAI', autoAICheckbox.checked);
        this.updateAutoAIState();

        if (autoAICheckbox.checked) {
          toast.success('🤖 Auto AI zapnuto - automatický výběr nejlepšího modelu', 2000);
        } else {
          toast.info('👤 Manuální režim - vyberte si providera a model', 2000);
        }
      });
    }

    // Model change - auto-update provider if model from different provider is selected
    const modelSelect = this.modal.element.querySelector('#aiModel');
    if (modelSelect && providerSelect) {
      modelSelect.addEventListener('change', (e) => {
        const selectedOption = e.target.options[e.target.selectedIndex];
        const modelProvider = selectedOption?.dataset?.provider;

        // If selected model is from different provider, update provider select
        if (modelProvider && modelProvider !== providerSelect.value) {
          providerSelect.value = modelProvider;
          // No need to update models - they're already loaded
        }
      });
    }

    // Tool System je vždy aktivní (VS Code style)
    this.toolSystem.setEnabled(true);
    console.log('🛠️ Tool System: Vždy aktivní (VS Code style)');

    // Testing tab handlers - delegated to TestingService
    this.testingService.attachHandlers();
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
      toast.warning('⏳ Čekám na dokončení předchozího požadavku...', 2000);
      return;
    }

    this.isProcessing = true;

    // Show cancel button
    const cancelBtn = this.modal.element.querySelector('.ai-cancel-btn');
    if (cancelBtn) {
      cancelBtn.style.display = 'flex';
      cancelBtn.onclick = () => {
        this.cancelRequest();
      };
    }

    // Add user message to chat (with attached files indicator)
    let displayMessage = message;
    const attachedFiles = this.fileAttachmentService.getAttachedFiles();
    if (attachedFiles && attachedFiles.length > 0) {
      displayMessage += `\n\n📎 Přiložené soubory (${attachedFiles.length}): ${attachedFiles.map(f => f.name).join(', ')}`;
    }
    this.addChatMessage('user', displayMessage);

    // Get current code for loading text detection
    const currentCode = state.get('editor.code') || '';

    // Detekuj typ požadavku pro správný loading text
    const loadingText = this.getLoadingTextForRequest(message, currentCode);

    // Přidat loading animaci
    const loadingId = 'ai-loading-' + Date.now();
    const messagesContainer = this.modal.element.querySelector('#aiChatMessages');
    const loadingMsg = document.createElement('div');
    loadingMsg.className = 'ai-message assistant loading';
    loadingMsg.id = loadingId;
    loadingMsg.innerHTML = `
      <div class="ai-thinking" style="display: flex; align-items: center; justify-content: space-between; width: 100%;">
        <div style="display: flex; align-items: center; gap: 12px;">
          <div class="thinking-dots">
            <span></span><span></span><span></span>
          </div>
          <p style="margin: 0;">${loadingText}</p>
        </div>
        <button class="ai-cancel-btn" style="padding: 8px 12px; background: #ef4444; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 600; font-size: 13px; display: flex; align-items: center; gap: 6px; transition: all 0.2s;">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 16px; height: 16px;">
            <path d="M18 6L6 18M6 6l12 12"/>
          </svg>
          <span>Zrušit</span>
        </button>
      </div>
    `;
    messagesContainer.appendChild(loadingMsg);

    // Přidat event listener na nové tlačítko v loading zprávě
    const loadingCancelBtn = loadingMsg.querySelector('.ai-cancel-btn');
    if (loadingCancelBtn) {
      loadingCancelBtn.onclick = () => {
        this.cancelRequest();
      };
    }
    messagesContainer.scrollTop = messagesContainer.scrollHeight;

    // Add to history
    this.chatService.addToHistory('user', message);
    this.chatHistory = this.chatService.getHistory();
    this.chatHistoryService.updateHistoryInfo();

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

      // Build system prompt using PromptBuilder with conversation mode
      let systemPrompt = this.promptBuilder.buildSystemPrompt(
        message,
        currentCode,
        openFiles,
        activeFileId,
        this.conversationMode // Pass conversation mode to PromptBuilder
      );

      // Get provider and model from UI
      let provider = this.modal.element.querySelector('#aiProvider')?.value;
      let model = this.modal.element.querySelector('#aiModel')?.value;
      const autoAI = this.modal.element.querySelector('#autoAI')?.checked;

      // If Auto AI is enabled, use intelligent model selection
      if (autoAI) {
        const bestModel = window.AI.selectBestCodingModel();
        provider = bestModel.provider;
        model = bestModel.model;
        console.log(`🤖 Auto AI: ${provider}/${model} (kvalita: ${bestModel.quality})`);
      } else if (!model || model === 'null' || model === '') {
        // Manual mode but no model selected - use best available
        const bestModel = window.AI.selectBestModel();
        provider = bestModel.provider;
        model = bestModel.model;
        console.log(MESSAGES.AUTO_SELECT_MODEL(provider, model));
      } else {
        // Manual mode with specific model selected
        // Get provider from selected model's data-attribute (in case user selected model from different provider)
        const modelSelect = this.modal.element.querySelector('#aiModel');
        const selectedOption = modelSelect?.options[modelSelect.selectedIndex];
        const modelProvider = selectedOption?.dataset?.provider;
        if (modelProvider) {
          provider = modelProvider;
        }
      }

      // 🚨 PŘIDEJ KRITICKÁ PRAVIDLA - ALE JEN PRO REŽIM POKRAČOVÁNÍ (ne pro nový projekt!)
      // V režimu "Nový projekt" nechceme SEARCH/REPLACE, ale kompletní nový kód
      const isNewProjectMode = this.workMode === 'new-project';

      if (!isNewProjectMode && currentCode && currentCode.trim().length > 100) {
        const CRITICAL_EDIT_RULES = `

═══════════════════════════════════════════════════════════
🚨🚨🚨 PREFEROVANÝ FORMÁT: SEARCH/REPLACE (VS Code style) 🚨🚨🚨
═══════════════════════════════════════════════════════════

KDYŽ MĚNÍŠ KÓD, POUŽIJ **SEARCH/REPLACE FORMÁT** (spolehlivější):

\`\`\`SEARCH
[přesný kód který chceš najít a nahradit]
\`\`\`
\`\`\`REPLACE
[nový kód]
\`\`\`

✅ VÝHODY SEARCH/REPLACE:
✅ Nemusíš znát čísla řádků
✅ Automaticky najde správné místo v kódu
✅ Funguje i když se kód změnil
✅ Stejný princip jako VS Code (najdi a nahraď)

💡 PŘÍKLAD:
\`\`\`SEARCH
.button {
  background: blue;
  color: white;
}
\`\`\`
\`\`\`REPLACE
.button {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  transition: transform 0.3s;
}
\`\`\`

⚠️ DŮLEŽITÉ PRO SEARCH BLOK:
• Zkopíruj PŘESNĚ kód který vidíš v editoru
• Včetně všech whitespace a odsazení
• Nesmí obsahovat "..." nebo jiné zkratky
• Měl by být dostatečně unikátní (ne moc krátký)

🔄 Můžeš použít více SEARCH/REPLACE bloků najednou:
\`\`\`SEARCH
const x = 1;
\`\`\`
\`\`\`REPLACE
const x = 2;
\`\`\`
\`\`\`SEARCH
const y = 3;
\`\`\`
\`\`\`REPLACE
const y = 4;
\`\`\`

💡 TIP: Raději použij více menších SEARCH/REPLACE bloků než jeden velký!

═══════════════════════════════════════════════════════════
`;
        systemPrompt = CRITICAL_EDIT_RULES + systemPrompt;
      } else if (isNewProjectMode) {
        // 🆕 PRO NOVÝ PROJEKT - jasné instrukce na vytvoření kompletního kódu
        const NEW_PROJECT_HEADER = `
🚨🚨🚨 REŽIM: NOVÝ PROJEKT 🚨🚨🚨
═══════════════════════════════════════════════════════════

IGNORUJ jakýkoliv existující kód v editoru!
VYTVOŘ ZCELA NOVÝ, KOMPLETNÍ kód podle požadavku uživatele!

✅ CO MUSÍŠ UDĚLAT:
1. OKAMŽITĚ vytvoř kompletní HTML soubor
2. Začni od <!DOCTYPE html> a skonči </html>
3. Vlož vše do JEDNOHO \`\`\`html bloku
4. Kód MUSÍ být kompletní a funkční

❌ CO NESMÍŠ DĚLAT:
- NEŽÁDEJ o zobrazení kódu
- NEPTEJ SE na další detaily
- NEPOUŽÍVEJ SEARCH/REPLACE
- NEODKAZUJ na existující kód

PROSTĚ VYTVOŘ NOVÝ KÓD HNED TEĎ!

═══════════════════════════════════════════════════════════
`;
        systemPrompt = NEW_PROJECT_HEADER + systemPrompt;
        console.log('[AIPanel] 🆕 Režim NOVÝ PROJEKT - přidána hlavička');
      }

      // Přidej Tool System prompt (vždy aktivní - VS Code style)
      systemPrompt += this.toolSystem.getToolSystemPrompt();
      console.log('🛠️ Tool System aktivní (VS Code style)');

      let response = await window.AI.ask(message, {
        provider: provider,
        model: model,
        system: systemPrompt,
        temperature: 0.7,
        autoFallback: true,  // Auto-switch on rate limit
        history: this.chatHistory.slice(-10) // Send last 10 messages as context
      });

      // Zpracuj tool calls (Tool System je vždy aktivní)
      let toolCallIteration = 0;
      const maxIterations = 5;

      while (toolCallIteration < maxIterations) {
        const toolProcessing = await this.toolSystem.processResponse(response);

        if (!toolProcessing.hasToolCalls) {
          // Žádné tool calls - pokračuj normálně
          response = toolProcessing.cleanedContent;
          break;
        }

        // Zobraz tool calls info
        console.log(`🔧 Tool call ${toolCallIteration + 1}:`, toolProcessing.toolResults);

        // Přidej info o tool calls do chatu
        const toolInfo = toolProcessing.toolResults.map(tr =>
          `🔧 **${tr.tool}**: ${tr.result.success ? '✅ Úspěch' : '❌ Chyba'}`
        ).join('\n');

        this.addChatMessage('system', `Tool System:\n${toolInfo}`);

        // Pošli výsledky zpět AI pro další response
        const toolResultsText = this.toolSystem.formatToolResults(toolProcessing.toolResults);

        response = await window.AI.ask(
          `${toolProcessing.cleanedContent}\n\n${toolResultsText}\n\nNa základě těchto výsledků odpověz uživateli.`,
          {
            provider: provider,
            model: model,
            system: systemPrompt,
            temperature: 0.7,
            history: this.chatHistory.slice(-10)
          }
        );

        toolCallIteration++;
      }

      if (toolCallIteration >= maxIterations) {
        response += '\n\n⚠️ Maximum tool iterations reached';
      }

      // Add to history
      this.chatService.addToHistory('assistant', response);
      this.chatHistory = this.chatService.getHistory();
      this.chatHistoryService.updateHistoryInfo();

      // Odstranit loading animaci
      const loadingElement = document.getElementById(loadingId);
      if (loadingElement) loadingElement.remove();

      // Try SEARCH/REPLACE (VS Code style - preferred and only supported format)
      const searchReplaceEdits = this.parseSearchReplaceInstructions(response);

      if (searchReplaceEdits.length > 0) {
        console.log(`🔧 Detekované ${searchReplaceEdits.length} SEARCH/REPLACE instrukcí`);

        // Uložit původní kód PŘED aplikací změn
        const originalCode = state.get('editor.code') || '';

        // Aplikovat změny ROVNOU (bez confirmation dialogu - VS Code style)
        const result = this.codeEditorService.applySearchReplaceEdits(searchReplaceEdits);

        // Získat nový kód PO aplikaci
        const newCode = state.get('editor.code') || '';

        // 🎨 Copilot-style: Zobrazit vizuální diff místo prostého textu
        this.addChatMessage('assistant', response);

        // Přidat Copilot-style diff zprávu s undo možností
        this.uiRenderingService.addDiffMessage(
          originalCode,
          newCode,
          searchReplaceEdits,
          (codeToRestore) => {
            // Undo callback - vrátit původní kód
            eventBus.emit('editor:setCode', { code: codeToRestore });
            toast.success('↩️ Změny vráceny', 2000);
          }
        );

        if (result.success) {
          toast.success(`✅ Aplikováno ${searchReplaceEdits.length} změn`, 3000);
        } else {
          toast.error('⚠️ Některé změny selhaly - viz konzole', 5000);
        }
        return; // Exit after handling changes
      } else if (response.includes('SEARCH')) {
        // SEARCH bloky byly detekovány ale ignorovány kvůli prázdným blokům

        // Zobraz AI response v chatu, aby uživatel viděl co AI poslala
        this.addChatMessage('assistant', response);

        // Zobraz error toast
        toast.error(
          `❌ AI použila ZAKÁZANÉ zkratky v SEARCH blocích!\n\n` +
          `🚨 SEARCH blok MUSÍ obsahovat PŘESNÝ kód z editoru!\n` +
          `❌ ZAKÁZÁNO: "...", "// ...", "/* ... */", "zkráceno"\n\n` +
          `💡 Zkus požádat AI znovu - například:\n` +
          `"Změň tento kód - použij PŘESNÝ kód v SEARCH bloku"`,
          10000
        );
        console.error('❌ SEARCH bloky ignorovány - obsahují prázdné nebo zkrácené bloky');
        console.error('📄 Zobrazuji AI response v chatu pro debugging...');
        return;
      }

      // Check if this is modification of existing code (has history and code)
      const isModification = this.chatHistory.length > 3 && currentCode.trim().length > 100;

      // Add assistant message with formatted code (fallback for full code)
      this.addChatMessageWithCode('assistant', response, message, isModification);

      // Zobraz token usage pokud je k dispozici
      if (this.lastTokenUsage) {
        const { tokensIn, tokensOut, duration, provider, model } = this.lastTokenUsage;
        const total = tokensIn + tokensOut;
        this.addChatMessage('system',
          `📊 Použito ${total.toLocaleString()} tokenů (${tokensIn.toLocaleString()}→${tokensOut.toLocaleString()}) • ${duration}ms • ${provider}/${model}`
        );
        this.lastTokenUsage = null; // Reset
      }
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

      // Hide cancel button
      const cancelBtn = this.modal.element.querySelector('.ai-cancel-btn');
      if (cancelBtn) {
        cancelBtn.style.display = 'none';
      }
    }
  }

  /**
   * Cancel current AI request
   */
  cancelRequest() {
    console.log('❌ Uživatel zrušil AI request');

    // Reset processing flag
    this.isProcessing = false;

    // Hide cancel button
    const cancelBtn = this.modal.element.querySelector('.ai-cancel-btn');
    if (cancelBtn) {
      cancelBtn.style.display = 'none';
    }

    // Remove loading animations
    const loadingElements = this.modal.element.querySelectorAll('.ai-message.loading');
    loadingElements.forEach(el => el.remove());

    // Add cancellation message
    this.addChatMessage('system', '❌ Operace zrušena uživatelem');

    toast.warning('Operace zrušena', 2000);
  }

  /**
   * Detects request type and returns appropriate loading text
   * @param {string} message - User's request
   * @param {string} currentCode - Current editor code
   * @returns {string} Context-aware loading message
   */
  getLoadingTextForRequest(message, currentCode = '') {
    const msg = message.toLowerCase();
    const hasCode = currentCode && currentCode.trim().length > 100;

    // Popis / vysvětlení
    if (msg.match(/popi[šs]|popis|vysv[ěe]tli|co d[ěe]l[áa]|jak funguje/)) {
      return 'AI analyzuje a popisuje stránku...';
    }

    // Analýza
    if (msg.match(/analyzuj|analýza|zkontroluj|review/)) {
      return 'AI analyzuje kód a hledá problémy...';
    }

    // Optimalizace
    if (msg.match(/optimalizuj|zrychli|zlepši|optimiz/)) {
      return 'AI hledá možnosti optimalizace...';
    }

    // Oprava chyb
    if (msg.match(/oprav|fix|bug|chyba|nefunguje/)) {
      return 'AI hledá a opravuje chyby...';
    }

    // Přidání funkce
    if (msg.match(/přidej|přidat|vytvoř|vytvořit|add/) && hasCode) {
      return 'AI přemýšlí a rozšiřuje kód...';
    }

    // Nový projekt/stránka
    if (msg.match(/nový|nová|vytvoř|create|new/) && !hasCode) {
      return 'AI přemýšlí a vytváří projekt...';
    }

    // Úprava existujícího
    if (msg.match(/uprav|změň|modify|update/) && hasCode) {
      return 'AI přemýšlí a upravuje kód...';
    }

    // Refaktoring
    if (msg.match(/refaktor|přepiš|rewrite|reorganizuj/)) {
      return 'AI refaktoruje kód...';
    }

    // Dokumentace
    if (msg.match(/dokumentuj|komentář|comment|doc/)) {
      return 'AI generuje dokumentaci...';
    }

    // Testy
    if (msg.match(/test|otestuj/)) {
      return 'AI vytváří testy...';
    }

    // Default podle kontextu
    if (hasCode) {
      return 'AI přemýšlí a upravuje kód...';
    } else {
      return 'AI přemýšlí a generuje kód...';
    }
  }

  addChatMessage(role, content, messageId = null) {
    return this.uiRenderingService.addChatMessage(role, content, messageId);
  }

  /**
   * Create a preview of content for collapsible summary
   */
  createContentPreview(content) {
    return this.uiRenderingService.createContentPreview(content);
  }

  addChatMessageWithCode(role, content, originalMessage = '', isModification = false, codeStatus = {}) {
    return this.uiRenderingService.addChatMessageWithCode(role, content, originalMessage, isModification, codeStatus);
  }

  acceptChange(changeId, actionsContainer, _isAuto = false, isModification = false) {
    const change = this.pendingChanges.get(changeId);
    if (!change) return;

    // Clear countdown if exists
    if (change.countdownInterval) {
      clearInterval(change.countdownInterval);
    }

    // Always update current editor (don't create new files)
    this.insertCodeToEditor(change.code, change.fullResponse || '');

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
    return this.templatesService.getPromptSelectionMetaPrompt(userMessage, codeLength, lineCount);
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
    return this.templatesService.selectPromptByContext(userMessage, hasCode, hasHistory, currentCode);
  }

  /**
   * Parse SEARCH/REPLACE instructions from AI response (VS Code style - PREFERRED)
   * More reliable than line numbers - finds code by content
   *
   * Format:
   * ```SEARCH
   * <exact code to find>
   * ```
   * ```REPLACE
   * <new code to replace with>
   * ```
   *
   * @param {string} response - AI response text
   * @returns {Array} Array of {searchCode, replaceCode, type: 'search-replace'} objects
   */
  parseSearchReplaceInstructions(response) {
    return this.codeEditorService.parseSearchReplaceInstructions(response);
  }

  /**
   * Apply line-based edits to current editor code
   * Validates OLD code matches before applying NEW code
   * Sorts edits in reverse order to prevent line number shifts
   *
   * @param {Array} edits - Array of {startLine, endLine, oldCode, newCode}
   * @returns {boolean} True if at least one edit was applied
   */

  /**
   * Show confirmation dialog for code changes
   */
  async showChangeConfirmation(editInstructions, fullResponse) {
    console.log(`💬 Zobrazuji confirmation dialog pro ${editInstructions.length} změn`);

    const messagesContainer = this.modal.element.querySelector('#aiChatMessages');

    // Remove any existing confirmation dialogs first (from previous attempts)
    const existingConfirmations = messagesContainer.querySelectorAll('.ai-confirmation-dialog');
    existingConfirmations.forEach(el => el.remove());
    console.log(`🧹 Odstraněno ${existingConfirmations.length} starých confirmation dialogů`);

    // Create confirmation UI
    const confirmationEl = document.createElement('div');
    confirmationEl.className = 'ai-message assistant ai-confirmation-dialog'; // Added class for cleanup
    confirmationEl.innerHTML = `
      <strong>🔍 Náhled navrhovaných změn (${editInstructions.length})</strong>
      <div style="margin-top: 10px; max-height: 400px; overflow-y: auto;">
        ${editInstructions.map((e, i) => {
          if (e.type === 'search-replace') {
            // SEARCH/REPLACE format
            return `
              <div style="margin-bottom: 15px; padding: 10px; background: rgba(0,0,0,0.2); border-radius: 6px;">
                <div style="font-weight: bold; margin-bottom: 5px;">
                  ${i + 1}. SEARCH/REPLACE (VS Code style)
                </div>
                <div style="margin: 5px 0; color: #3b82f6;">
                  <strong>🔍 Hledám:</strong>
                  <pre style="background: rgba(59,130,246,0.1); padding: 8px; border-radius: 4px; margin: 5px 0; overflow-x: auto; font-size: 0.85em;">${this.escapeHtml(e.searchCode.substring(0, 200))}${e.searchCode.length > 200 ? '...' : ''}</pre>
                </div>
                <div style="margin: 5px 0; color: #10b981;">
                  <strong>✅ Nahradím:</strong>
                  <pre style="background: rgba(16,185,129,0.1); padding: 8px; border-radius: 4px; margin: 5px 0; overflow-x: auto; font-size: 0.85em;">${this.escapeHtml(e.replaceCode.substring(0, 200))}${e.replaceCode.length > 200 ? '...' : ''}</pre>
                </div>
              </div>
            `;
          } else {
            // EDIT:LINES format (legacy)
            return `
              <div style="margin-bottom: 15px; padding: 10px; background: rgba(0,0,0,0.2); border-radius: 6px;">
                <div style="font-weight: bold; margin-bottom: 5px;">
                  ${i + 1}. Řádky ${e.startLine}-${e.endLine}
                </div>
                <div style="margin: 5px 0; color: #ef4444;">
                  <strong>❌ Původní:</strong>
                  <pre style="background: rgba(239,68,68,0.1); padding: 8px; border-radius: 4px; margin: 5px 0; overflow-x: auto; font-size: 0.85em;">${this.escapeHtml(e.oldCode.substring(0, 200))}${e.oldCode.length > 200 ? '...' : ''}</pre>
                </div>
                <div style="margin: 5px 0; color: #10b981;">
                  <strong>✅ Nový:</strong>
                  <pre style="background: rgba(16,185,129,0.1); padding: 8px; border-radius: 4px; margin: 5px 0; overflow-x: auto; font-size: 0.85em;">${this.escapeHtml(e.newCode.substring(0, 200))}${e.newCode.length > 200 ? '...' : ''}</pre>
                </div>
              </div>
            `;
          }
        }).join('')}
      </div>
      <div style="margin-top: 15px; display: flex; gap: 10px;">
        <button class="confirm-changes-btn" style="flex: 1; padding: 14px; background: #10b981; color: white; border: 2px solid #059669; border-radius: 8px; cursor: pointer; font-size: 1.1em; font-weight: 700; box-shadow: 0 4px 6px rgba(16,185,129,0.4); transition: all 0.2s;">
          ✅ Potvrdit a aplikovat
        </button>
        <button class="reject-changes-btn" style="flex: 1; padding: 14px; background: #ef4444; color: white; border: 2px solid #dc2626; border-radius: 8px; cursor: pointer; font-size: 1.1em; font-weight: 700; box-shadow: 0 4px 6px rgba(239,68,68,0.4); transition: all 0.2s;">
          ❌ Zamítnout
        </button>
      </div>
    `;

    messagesContainer.appendChild(confirmationEl);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;

    // Wait for user decision
    return new Promise((resolve) => {
      const confirmBtn = confirmationEl.querySelector('.confirm-changes-btn');
      const rejectBtn = confirmationEl.querySelector('.reject-changes-btn');

      confirmBtn.addEventListener('click', async () => {
        console.log('✅ Uživatel potvrdil změny');
        confirmationEl.remove();

        // Apply changes - detect format type
        let applied;
        if (editInstructions.length > 0 && editInstructions[0].type === 'search-replace') {
          // SEARCH/REPLACE format (VS Code style)
          applied = this.applySearchReplaceEdits(editInstructions);
        } else {
          // EDIT:LINES format (legacy)
          applied = this.applyLineEdits(editInstructions);
        }

        if (applied) {
          const summary = editInstructions.map((e, i) => {
            if (e.type === 'search-replace') {
              return `${i + 1}. SEARCH/REPLACE: ✅`;
            } else {
              return `${i + 1}. Řádky ${e.startLine}-${e.endLine}: ✅`;
            }
          }).join('\n');

          this.addChatMessage('assistant', `✅ Změny aplikovány (${editInstructions.length}x):\n\n${summary}`);
          toast.success(`✅ Aplikováno ${editInstructions.length} změn`, 3000);
        } else {
          toast.error('⚠️ Některé změny selhaly - viz konzole', 5000);
        }
        resolve();
      });

      rejectBtn.addEventListener('click', () => {
        console.log('❌ Uživatel zamítl změny');
        confirmationEl.remove();
        this.addChatMessage('assistant', '❌ Změny zamítnuty uživatelem.\n\nMůžete zadat nový požadavek.');
        resolve();
      });
    });
  }

  applyLineEdits(edits) {
    return this.codeEditorService.applyLineEdits(edits);
  }

  /**
   * Apply SEARCH/REPLACE edits (VS Code style)
   * @param {Array} edits - Array of {searchCode, replaceCode, type: 'search-replace'}
   * @returns {boolean} - True if all edits applied successfully
   */
  applySearchReplaceEdits(edits) {
    return this.codeEditorService.applySearchReplaceEdits(edits);
  }

  /**
   * Fuzzy search with whitespace normalization
   * @param {string} code - Code to search in
   * @param {string} search - Text to find
   * @returns {{found: boolean, index: number}} - Result with position
   */
  fuzzySearchCode(code, search) {
    return this.codeEditorService.fuzzySearchCode(code, search);
  }

  /**
   * Find similar code using basic similarity matching
   * @param {string} code - Code to search in
   * @param {string} search - Text to find
   * @returns {string|null} - Most similar code snippet or null
   */
  findSimilarCode(code, search) {
    return this.codeEditorService.findSimilarCode(code, search);
  }

  /**
   * Count occurrences of text in code
   * @param {string} code - Code to search in
   * @param {string} search - Text to find
   * @returns {number} - Number of occurrences
   */
  countOccurrences(code, search) {
    return this.codeEditorService.countOccurrences(code, search);
  }

  /**
   * Detect overlapping edits (conflicts)
   * @param {Array} edits - Validated edits with index positions
   * @returns {Array} - Array of conflicts
   */
  detectEditConflicts(edits) {
    return this.codeEditorService.detectEditConflicts(edits);
  }

  /**
   * Show validation errors with suggestions
   * @param {Array} errors - Validation errors
   */
  showValidationErrors(errors) {
    return this.codeEditorService.showValidationErrors(errors, this.addChatMessage.bind(this));
  }

  addLineNumbers(code, metadata = null) {
    return this.codeEditorService.addLineNumbers(code, metadata);
  }

  /**
   * Truncate code intelligently - show beginning, end, and indicate middle is truncated
   * Returns object with code and metadata about line numbers
   */
  truncateCodeIntelligently(code, maxChars = 3000) {
    return this.codeEditorService.truncateCodeIntelligently(code, maxChars);
  }

  insertCodeToEditor(code, fullResponse = '') {
    return this.codeEditorService.insertCodeToEditor(code, fullResponse);
  }

  detectDuplicateVariables(code) {
    return this.codeEditorService.detectDuplicateVariables(code);
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
    this.chatHistoryService.clearChatHistory();

    toast.show('✨ Nový projekt vytvořen!', 'success');
  }

  removeChatMessage(messageId) {
    const message = this.modal.element.querySelector(`#${messageId}`);
    if (message) {
      message.remove();
    }
  }

  escapeHtml(text) {
    return this.uiRenderingService.escapeHtml(text);
  }

  unescapeHtml(text) {
    const div = document.createElement('div');
    div.innerHTML = text;
    return div.textContent;
  }

  /**
   * Create action bar HTML with undo/redo buttons
   * @param {string} originalCode - Original code before changes
   * @param {string} newCode - New code after changes
   * @returns {string} - HTML string for action bar
   */
  createActionBarHTML(originalCode, newCode) {
    // Escape HTML pro bezpečné vložení do data atributů
    const originalCodeEncoded = encodeURIComponent(originalCode);
    const newCodeEncoded = encodeURIComponent(newCode);

    return `
<div class="code-action-bar" data-original="${originalCodeEncoded}" data-new="${newCodeEncoded}">
  <div class="action-bar-content">
    <span class="action-bar-label">Změny aplikovány</span>
    <div class="action-bar-buttons">
      <button class="action-btn undo-btn" onclick="window.aiPanel.undoCodeChange(this)">
        <span class="btn-icon">↶</span>
        <span class="btn-text">Vrátit zpět</span>
      </button>
      <button class="action-btn keep-btn" onclick="window.aiPanel.keepCodeChange(this)">
        <span class="btn-icon">✓</span>
        <span class="btn-text">Zachovat</span>
      </button>
    </div>
  </div>
</div>`;
  }

  /**
   * Undo code change from action bar button
   */
  undoCodeChange(button) {
    const actionBar = button.closest('.code-action-bar');
    const originalCode = decodeURIComponent(actionBar.dataset.original);

    eventBus.emit('editor:setCode', { code: originalCode });
    actionBar.innerHTML = '<div class="action-bar-result undo">↶ Změny vráceny zpět</div>';
    toast.show('↶ Změny vráceny zpět', 'info');
  }

  /**
   * Keep code change from action bar button
   */
  keepCodeChange(button) {
    const actionBar = button.closest('.code-action-bar');
    actionBar.innerHTML = '<div class="action-bar-result keep">✓ Změny zachovány</div>';
    toast.show('✓ Změny zachovány', 'success');

    // Zavřít AI panel po potvrzení
    setTimeout(() => {
      const aiPanel = document.getElementById('aiPanel');
      if (aiPanel && aiPanel.classList.contains('active')) {
        aiPanel.classList.remove('active');
      }
    }, 800);
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
          return `<option value="${m.value}" title="${m.description || ''}" data-favorite="${isFavorite}" data-provider="${provider}">${star}${m.label} (${info})</option>`;
        })
        .join('');

      // Add double-click handler for favoriting
      modelSelect.addEventListener('dblclick', () => {
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

  /**
   * Update Auto AI state - enable/disable provider and model selects
   */
  updateAutoAIState() {
    const autoAICheckbox = this.modal.element.querySelector('#autoAI');
    const providerSelect = this.modal.element.querySelector('#aiProvider');
    const modelSelect = this.modal.element.querySelector('#aiModel');

    if (!autoAICheckbox) return;

    const isAutoMode = autoAICheckbox.checked;

    // Disable provider/model selects when Auto AI is enabled
    if (providerSelect) {
      providerSelect.disabled = isAutoMode;
      providerSelect.style.opacity = isAutoMode ? '0.6' : '1';
      providerSelect.style.cursor = isAutoMode ? 'not-allowed' : 'pointer';
    }

    if (modelSelect) {
      modelSelect.disabled = isAutoMode;
      modelSelect.style.opacity = isAutoMode ? '0.6' : '1';
      modelSelect.style.cursor = isAutoMode ? 'not-allowed' : 'pointer';
    }

    // Update visual feedback
    if (isAutoMode) {
      providerSelect?.setAttribute('title', '🤖 Auto AI aktivní - provider se vybírá automaticky');
      modelSelect?.setAttribute('title', '🤖 Auto AI aktivní - model se vybírá automaticky podle kvality pro kódování');
    } else {
      providerSelect?.setAttribute('title', 'Vyberte AI providera');
      modelSelect?.setAttribute('title', 'Vyberte AI model');
    }
  }

  // Template generators
  getBlankTemplate() {
    return this.templatesService.getBlankTemplate();
  }

  getLandingTemplate() {
    return this.templatesService.getLandingTemplate();
  }

  getFormTemplate() {
    return this.templatesService.getFormTemplate();
  }

  getDashboardTemplate() {
    return this.templatesService.getDashboardTemplate();
  }

  getPortfolioTemplate() {
    return this.templatesService.getPortfolioTemplate();
  }

  // Prompt management
  usePrompt(promptId) {
    return this.templatesService.usePrompt(promptId);
  }

  addCustomPrompt() {
    return this.templatesService.addCustomPrompt();
  }

  // GitHub integration - Delegated to GitHubService
  handleGitHubAction(action) {
    return this.githubService.handleGitHubAction(action);
  }

  showGitHubSearchDialog() {
    return this.githubService.showGitHubSearchDialog();
  }

  createPaginationHTML(page, maxPages) {
    return this.githubService.createPaginationHTML(page, maxPages);
  }

  async searchGitHubCode(query, language, page = 1, token = null) {
    return this.githubService.searchGitHubCode(query, language, page, token);
  }

  async searchGitHubRepos(query, language, page = 1, token = null) {
    return this.githubService.searchGitHubRepos(query, language, page, token);
  }

  async loadGitHubRepo(fullName, repoName) {
    return this.githubService.loadGitHubRepo(fullName, repoName);
  }

  showRepoLoadOptions(repoName, allFiles) {
    return this.githubService.showRepoLoadOptions(repoName, allFiles);
  }

  getFileType(fileName) {
    return this.githubService.getFileType(fileName);
  }

  isTextFile(fileName) {
    return this.githubService.isTextFile(fileName);
  }

  showRepoFileSelector(fullName, branch, files, repoName) {
    // This method is not yet migrated to GitHubService
    // Keep original implementation for now
    const modal = document.createElement('div');
    modal.className = 'modal-backdrop';
    modal.style.cssText = 'position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0, 0, 0, 0.7); display: flex; align-items: center; justify-content: center; z-index: 10000;';
    modal.innerHTML = `
      <div class="modal-content" style="max-width: 850px; background: #1a1a1a; border: 1px solid #333; border-radius: 12px; max-height: 90vh; overflow: hidden; display: flex; flex-direction: column;">
        <div class="modal-header" style="padding: 20px; border-bottom: 1px solid #333; display: flex; justify-content: space-between; align-items: center;">
          <h3 style="margin: 0; color: #ffffff; font-size: 18px;">🔍 Hledat na GitHub</h3>
          <button class="modal-close" id="githubSearchClose" style="background: #333; border: none; color: #ffffff; width: 32px; height: 32px; border-radius: 6px; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: background 0.2s;">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 18px; height: 18px;">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>
        <div class="modal-body" style="padding: 0; overflow-y: auto;">

          <!-- Rozbalovací formulář -->
          <div id="searchFormSection" style="border-bottom: 1px solid #333;">
            <button id="toggleSearchForm" style="width: 100%; padding: 15px 25px; background: transparent; border: none; color: #ffffff; cursor: pointer; display: flex; justify-content: space-between; align-items: center; font-weight: 600; font-size: 14px; transition: background 0.2s;">
              <span>⚙️ Nastavení vyhledávání</span>
              <span id="toggleIcon" style="font-size: 18px; transition: transform 0.3s;">▼</span>
            </button>

            <div id="searchFormContent" style="padding: 0 25px 25px 25px;">
              <div style="margin-bottom: 12px;">
                <label style="display: block; margin-bottom: 6px; font-weight: 600; font-size: 13px; color: #cccccc;">GitHub Token (volitelné pro více výsledků)</label>
                <input type="password" id="githubToken" placeholder="ghp_..." value="${localStorage.getItem('github_token') || ''}" style="width: 100%; padding: 10px; border: 1px solid #333; border-radius: 6px; font-size: 13px; background: #0d0d0d; color: #ffffff;">
                <p style="font-size: 11px; color: #888888; margin-top: 4px;">
                  Token se uloží do prohlížeče. <a href="https://github.com/settings/tokens" target="_blank" style="color: #0066cc;">Vytvořit token</a>
                </p>
              </div>
              <div style="margin-bottom: 16px;">
                <label style="display: block; margin-bottom: 6px; font-weight: 600; font-size: 13px; color: #cccccc;">Co hledáte?</label>
                <input type="text" id="githubSearchQuery" placeholder="Např. landing page, portfolio, navbar..." style="width: 100%; padding: 12px; border: 1px solid #333; border-radius: 8px; font-size: 14px; background: #0d0d0d; color: #ffffff;">
              </div>
              <div style="margin-bottom: 16px;">
                <label style="display: block; margin-bottom: 6px; font-weight: 600; font-size: 13px; color: #cccccc;">Jazyk (volitelné)</label>
                <select id="githubLanguage" style="width: 100%; padding: 10px; border: 1px solid #333; border-radius: 6px; font-size: 13px; background: #0d0d0d; color: #ffffff;">
                  <option value="">Všechny jazyky</option>
                  <option value="html">HTML</option>
                  <option value="css">CSS</option>
                  <option value="javascript">JavaScript</option>
                  <option value="typescript">TypeScript</option>
                  <option value="python">Python</option>
                  <option value="java">Java</option>
                  <option value="php">PHP</option>
                  <option value="ruby">Ruby</option>
                </select>
              </div>
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
                <button id="searchRepos" style="padding: 14px; background: #0066cc; color: #ffffff; border: none; border-radius: 8px; font-weight: 600; cursor: pointer; font-size: 15px; transition: all 0.2s;">
                  📦 Hledat repozitáře
                </button>
                <button id="searchCode" style="padding: 14px; background: #333; color: #ffffff; border: 1px solid #555; border-radius: 8px; font-weight: 600; cursor: pointer; font-size: 15px; transition: all 0.2s;">
                  📄 Hledat kód
                </button>
              </div>
            </div>
          </div>

          <!-- Výsledky a loading -->
          <div style="padding: 25px;">
            <div id="githubSearchResults" style="display: none;">
              <div id="githubResultsHeader" style="margin-bottom: 12px;"></div>
              <div id="githubResultsList" style="display: grid; gap: 10px; max-height: 450px; overflow-y: auto;"></div>
              <div id="githubPagination" style="margin-top: 16px;"></div>
            </div>
            <div id="githubSearchLoading" style="display: none; text-align: center; padding: 40px;">
              <div style="display: inline-block; width: 40px; height: 40px; border: 4px solid #333; border-top-color: #0066cc; border-radius: 50%; animation: spin 1s linear infinite;"></div>
              <p style="margin-top: 15px; color: #888888;">Hledání na GitHub...</p>
            </div>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    let currentPage = 1;
    let totalCount = 0;
    let formCollapsed = false;

    const closeModal = () => modal.remove();
    modal.querySelector('#githubSearchClose').addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeModal();
    });

    // Toggle formuláře
    const toggleBtn = modal.querySelector('#toggleSearchForm');
    const toggleIcon = modal.querySelector('#toggleIcon');
    const formContent = modal.querySelector('#searchFormContent');

    toggleBtn.addEventListener('click', () => {
      formCollapsed = !formCollapsed;
      if (formCollapsed) {
        formContent.style.display = 'none';
        toggleIcon.textContent = '▶';
        toggleIcon.style.transform = 'rotate(0deg)';
      } else {
        formContent.style.display = 'block';
        toggleIcon.textContent = '▼';
        toggleIcon.style.transform = 'rotate(0deg)';
      }
    });

    let lastSearchType = 'repositories'; // Výchozí hledání repozitářů

    const performSearch = async (searchType, page = 1) => {
      currentPage = page;
      const query = modal.querySelector('#githubSearchQuery').value.trim();
      const language = modal.querySelector('#githubLanguage').value;
      const token = modal.querySelector('#githubToken').value.trim();

      lastSearchType = searchType; // Ulož pro použití ve výsledcích

      if (!query) {
        eventBus.emit('toast:show', {
          message: 'Zadejte hledaný výraz',
          type: 'warning'
        });
        return;
      }

      // Po zahájení hledání sbal formulář
      if (!formCollapsed && page === 1) {
        formCollapsed = true;
        formContent.style.display = 'none';
        toggleIcon.textContent = '▶';
      }

      // Ulož token
      if (token) {
        localStorage.setItem('github_token', token);
      }

      const loadingDiv = modal.querySelector('#githubSearchLoading');
      const resultsDiv = modal.querySelector('#githubSearchResults');
      const resultsList = modal.querySelector('#githubResultsList');
      const resultsHeader = modal.querySelector('#githubResultsHeader');
      const paginationDiv = modal.querySelector('#githubPagination');

      loadingDiv.style.display = 'block';
      resultsDiv.style.display = 'none';
      resultsList.innerHTML = '';
      resultsHeader.innerHTML = '';
      paginationDiv.innerHTML = '';

      try {
        let results;
        const searchQuery = language ? `${query}+language:${language}` : query;

        if (searchType === 'repositories') {
          results = await this.searchGitHubRepos(query, language, page, token);
        } else {
          results = await this.searchGitHubCode(query, language, page, token);
        }

        loadingDiv.style.display = 'none';
        resultsDiv.style.display = 'block';

        if (results.items.length === 0) {
          resultsList.innerHTML = '<p style="text-align: center; color: var(--text-secondary); padding: 20px;">Nenalezeny žádné výsledky</p>';
          return;
        }

        totalCount = results.total_count;

        // Header s počtem výsledků
        const githubSearchUrl = `https://github.com/search?q=${encodeURIComponent(query)}${language ? `+language:${language}` : ''}&type=${searchType === 'repositories' ? 'repositories' : 'code'}`;
        resultsHeader.innerHTML = `
          <div style="padding: 12px; background: var(--bg-secondary); border-radius: 6px; text-align: center;">
            <div style="font-weight: 600; margin-bottom: 6px; color: var(--accent);">
              📊 Nalezeno ${totalCount.toLocaleString('cs-CZ')} výsledků | Stránka ${page}
            </div>
            <a href="${githubSearchUrl}" target="_blank" style="color: var(--accent); text-decoration: none; font-size: 13px;">
              🔗 Otevřít na GitHubu
            </a>
          </div>
        `;

        results.items.forEach(result => {
          const resultCard = document.createElement('div');
          resultCard.style.cssText = 'padding: 15px; background: #242424; border: 1px solid #333; border-radius: 8px; transition: all 0.2s;';

          if (lastSearchType === 'repositories') {
            resultCard.innerHTML = `
              <div style="display: flex; justify-content: space-between; align-items: start; gap: 15px;">
                <div style="flex: 1;">
                  <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 5px;">
                    <h5 style="margin: 0; color: #0066cc; font-size: 14px;">${result.name}</h5>
                    <a href="${result.html_url}" target="_blank" style="color: #888888; text-decoration: none; font-size: 11px;">🔗</a>
                  </div>
                  <p style="margin: 0 0 8px 0; font-size: 12px; color: #cccccc;">${result.description || 'Bez popisu'}</p>
                  <div style="display: flex; gap: 15px; font-size: 11px; color: #888888;">
                    <span>⭐ ${result.stargazers_count}</span>
                    <span>🍴 ${result.forks_count}</span>
                  </div>
                </div>
                <button class="load-github-repo" data-fullname="${result.full_name}" data-name="${result.name}" style="padding: 8px 16px; background: #0066cc; color: #ffffff; border: none; border-radius: 6px; font-size: 12px; font-weight: 600; cursor: pointer; white-space: nowrap;">
                  📥 Načíst
                </button>
              </div>
            `;
          } else {
            resultCard.innerHTML = `
              <div style="display: flex; justify-content: space-between; align-items: start; gap: 15px;">
                <div style="flex: 1;">
                  <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 5px;">
                    <h5 style="margin: 0; color: #0066cc; font-size: 14px;">${result.name}</h5>
                    <a href="${result.html_url}" target="_blank" style="color: #888888; text-decoration: none; font-size: 11px;">🔗</a>
                  </div>
                  <p style="margin: 0 0 6px 0; font-size: 11px; color: #cccccc;">📦 ${result.repository.full_name}</p>
                  <p style="margin: 0; font-size: 11px; color: #888888;">📄 ${result.path}</p>
                </div>
                <button class="load-github-file" data-url="${result.html_url}" data-name="${result.name}" style="padding: 8px 16px; background: #0066cc; color: #ffffff; border: none; border-radius: 6px; font-size: 12px; font-weight: 600; cursor: pointer; white-space: nowrap;">
                  📥 Načíst
                </button>
              </div>
            `;
          }

          // Event listeners pro načtení
          const loadBtn = resultCard.querySelector('.load-github-repo, .load-github-file');
          loadBtn?.addEventListener('click', async (e) => {
            e.stopPropagation();
            const btn = e.currentTarget;
            btn.disabled = true;
            btn.textContent = '⏳ Načítání...';

            try {
              closeModal();
              this.showLoadingOverlay('📥 Načítám z GitHub...');

              if (lastSearchType === 'repositories') {
                const fullName = btn.dataset.fullname;
                await this.loadGitHubRepo(fullName, btn.dataset.name);
              } else {
                await this.loadGitHubCode(result.html_url, result.name, true);
              }

              this.hideLoadingOverlay();
              eventBus.emit('toast:show', {
                message: '✅ Kód načten z GitHub',
                type: 'success'
              });
            } catch (error) {
              this.hideLoadingOverlay();
              eventBus.emit('toast:show', {
                message: '❌ ' + error.message,
                type: 'error'
              });
              btn.disabled = false;
              btn.textContent = '📥 Načíst';
            }
          });

          resultsList.appendChild(resultCard);
        });

        // Pagination
        const maxPages = Math.min(Math.ceil(totalCount / 10), 100);
        if (maxPages > 1) {
          const paginationHTML = this.createPaginationHTML(page, maxPages);
          paginationDiv.innerHTML = paginationHTML;

          // Bind pagination clicks
          paginationDiv.querySelectorAll('[data-page]').forEach(btn => {
            btn.addEventListener('click', () => {
              const newPage = parseInt(btn.dataset.page);
              performSearch(lastSearchType, newPage);
            });
          });
        }

      } catch (error) {
        loadingDiv.style.display = 'none';
        resultsDiv.style.display = 'block';
        resultsList.innerHTML = `<p style="text-align: center; color: #ff6b6b; padding: 20px;">❌ ${error.message}</p>`;
      }
    };

    // Tlačítko pro hledání repozitářů
    modal.querySelector('#searchRepos').addEventListener('click', () => performSearch('repositories', 1));

    // Tlačítko pro hledání kódu
    modal.querySelector('#searchCode').addEventListener('click', () => performSearch('code', 1));

    // Enter pro hledání repozitářů (výchozí)
    modal.querySelector('#githubSearchQuery').addEventListener('keydown', (e) => {
      if (e.key === 'Enter') performSearch('repositories', 1);
    });
  }

  async loadGitHubRepo(fullName, repoName) {
    try {
      this.showLoadingOverlay('📥 Načítám repozitář...');

      // Nejdřív zkus získat strukturu repozitáře
      const token = localStorage.getItem('github_token');
      const headers = { 'Accept': 'application/vnd.github+json' };

      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
        headers['X-GitHub-Api-Version'] = '2022-11-28';
      }

      // Získej obsah root složky
      let branch = 'main';
      let response = await fetch(`https://api.github.com/repos/${fullName}/contents?ref=main`, { headers });

      if (!response.ok) {
        // Zkus master větev
        branch = 'master';
        response = await fetch(`https://api.github.com/repos/${fullName}/contents?ref=master`, { headers });
      }

      if (!response.ok) {
        this.hideLoadingOverlay();
        throw new Error('Nepodařilo se načíst obsah repozitáře');
      }

      const rootFiles = await response.json();

      // Načti obsah všech souborů z root složky
      const allFiles = [];

      for (const file of rootFiles) {
        if (file.type === 'file' && !file.name.startsWith('.')) {
          // Načti pouze textové soubory
          if (this.isTextFile(file.name)) {
            try {
              const contentResponse = await fetch(file.download_url);
              if (contentResponse.ok) {
                const content = await contentResponse.text();
                allFiles.push({
                  name: file.name,
                  content: content,
                  path: file.path
                });
              }
            } catch (err) {
              console.warn(`⚠️ Nepodařilo se načíst soubor ${file.name}:`, err);
            }
          }
        }
      }

      this.hideLoadingOverlay();

      if (allFiles.length === 0) {
        throw new Error('V repozitáři nejsou žádné načitatelné soubory');
      }

      console.log(`📦 Načteno ${allFiles.length} souborů z ${repoName}`);

      // Zkontroluj jestli už jsou nějaké otevřené soubory
      const existingTabs = state.get('files.tabs') || [];
      const hasExistingFiles = existingTabs.length > 0;

      if (hasExistingFiles) {
        // Zobraz dialog s volbami
        this.showRepoLoadOptions(repoName, allFiles);
      } else {
        // Prázdný projekt - načti rovnou
        eventBus.emit('github:project:loaded', {
          name: repoName,
          files: allFiles
        });

        eventBus.emit('toast:show', {
          message: `✅ Načten repozitář ${repoName} (${allFiles.length} souborů)`,
          type: 'success',
          duration: 3000
        });
      }

    } catch (error) {
      this.hideLoadingOverlay();
      throw new Error('Nepodařilo se načíst repozitář: ' + error.message);
    }
  }

  showRepoLoadOptions(repoName, allFiles) {
    const modal = document.createElement('div');
    modal.className = 'modal-backdrop';
    modal.style.cssText = 'position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0, 0, 0, 0.7); display: flex; align-items: center; justify-content: center; z-index: 10000;';
    modal.innerHTML = `
      <div class="modal-content" style="max-width: 500px; background: #1a1a1a; border: 1px solid #333; border-radius: 12px; overflow: hidden;">
        <div class="modal-header" style="padding: 20px; border-bottom: 1px solid #333;">
          <h3 style="margin: 0; color: #ffffff; font-size: 18px;">📥 Načíst repozitář ${repoName}</h3>
        </div>
        <div class="modal-body" style="padding: 25px;">
          <p style="margin-bottom: 20px; color: #cccccc; line-height: 1.6;">
            Načteno <strong>${allFiles.length} souborů</strong>. Už máte otevřené soubory. Co chcete udělat?
          </p>
          <div style="display: grid; gap: 12px;">
            <button id="replaceAllFiles" style="padding: 14px; background: #0066cc; color: #ffffff; border: none; border-radius: 8px; font-weight: 600; cursor: pointer; font-size: 14px;">
              🔄 Nahradit všechny soubory
            </button>
            <button id="addToExisting" style="padding: 14px; background: #242424; color: #ffffff; border: 2px solid #333; border-radius: 8px; font-weight: 600; cursor: pointer; font-size: 14px;">
              ➕ Přidat k existujícím
            </button>
            <button id="cancelRepoLoad" style="padding: 14px; background: transparent; color: #888888; border: 1px solid #333; border-radius: 8px; font-weight: 600; cursor: pointer; font-size: 14px;">
              ❌ Zrušit
            </button>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    const closeModal = () => {
      modal.remove();
    };

    modal.querySelector('#replaceAllFiles').addEventListener('click', async () => {
      // Nahraď všechny soubory pomocí safe batch update
      const success = await SafeOps.safeBatch(async () => {
        eventBus.emit('github:project:loaded', {
          name: repoName,
          files: allFiles
        });
      }, 'Replace all GitHub files');

      if (success) {
        eventBus.emit('toast:show', {
          message: `✅ Nahrazeno ${allFiles.length} souborů z ${repoName}`,
          type: 'success',
          duration: 3000
        });
      } else {
        eventBus.emit('toast:show', {
          message: `❌ Chyba při nahrávání souborů`,
          type: 'error',
          duration: 3000
        });
      }
      closeModal();
    });

    modal.querySelector('#addToExisting').addEventListener('click', async () => {
      // Přidej k existujícím souborům pomocí safe transaction
      const success = await SafeOps.safeTransaction(async () => {
        const existingTabs = state.get('files.tabs') || [];
        let nextId = state.get('files.nextId') || 1;

        const newTabs = [];
        allFiles.forEach(file => {
          newTabs.push({
            id: nextId++,
            name: file.name,
            content: file.content,
            modified: false,
            type: this.getFileType(file.name),
            path: file.path
          });
        });

        // Slouč existující a nové taby
        const allTabs = [...existingTabs, ...newTabs];
        state.set('files.tabs', allTabs);
        state.set('files.nextId', nextId);

        // Nastav první nový soubor jako aktivní
        if (newTabs.length > 0) {
          state.set('files.active', newTabs[0].id);
          // Použij event místo přímého volání
          eventBus.emit('editor:setCode', {
            code: newTabs[0].content,
            skipStateUpdate: false,
            force: true
          });
        }
      }, 'Add GitHub files to existing');

      if (success) {
        eventBus.emit('sidebar:show');
        eventBus.emit('files:changed');

        eventBus.emit('toast:show', {
          message: `✅ Přidáno ${allFiles.length} souborů z ${repoName}`,
          type: 'success',
          duration: 3000
        });
      } else {
        eventBus.emit('toast:show', {
          message: `❌ Chyba při přidávání souborů`,
          type: 'error',
          duration: 3000
        });
      }
      closeModal();
    });

    modal.querySelector('#cancelRepoLoad').addEventListener('click', closeModal);

    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeModal();
    });
  }

  getFileType(fileName) {
    const ext = fileName.split('.').pop().toLowerCase();
    const types = {
      html: 'html', htm: 'html',
      css: 'css',
      js: 'javascript', jsx: 'javascript',
      ts: 'typescript', tsx: 'typescript',
      json: 'json',
      md: 'markdown',
      py: 'python',
      java: 'java',
      php: 'php',
      rb: 'ruby',
      go: 'go',
      rs: 'rust',
      c: 'c', cpp: 'cpp', h: 'c'
    };
    return types[ext] || 'text';
  }

  isTextFile(fileName) {
    const textExtensions = [
      '.html', '.htm', '.css', '.js', '.json', '.txt', '.md',
      '.xml', '.svg', '.py', '.java', '.c', '.cpp', '.h',
      '.php', '.rb', '.go', '.rs', '.ts', '.jsx', '.tsx',
      '.vue', '.yml', '.yaml', '.toml', '.ini', '.cfg'
    ];
    return textExtensions.some(ext => fileName.toLowerCase().endsWith(ext));
  }

  showRepoFileSelector(fullName, branch, files, repoName) {
    const modal = document.createElement('div');
    modal.className = 'modal-backdrop';
    modal.style.cssText = 'position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0, 0, 0, 0.7); display: flex; align-items: center; justify-content: center; z-index: 10000;';
    modal.innerHTML = `
      <div class="modal-content" style="max-width: 600px; background: #1a1a1a; border: 1px solid #333; border-radius: 12px; max-height: 80vh; overflow: hidden; display: flex; flex-direction: column;">
        <div class="modal-header" style="padding: 20px; border-bottom: 1px solid #333; display: flex; justify-content: space-between; align-items: center;">
          <h3 style="margin: 0; color: #ffffff; font-size: 18px;">📦 Vyberte soubor z ${repoName}</h3>
          <button id="closeFileSelector" style="background: #333; border: none; color: #ffffff; width: 32px; height: 32px; border-radius: 6px; cursor: pointer; display: flex; align-items: center; justify-content: center;">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 18px; height: 18px;">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>
        <div class="modal-body" style="padding: 20px; overflow-y: auto;">
          <p style="margin-bottom: 15px; color: #cccccc;">Nebyl nalezen automaticky detekovatelný hlavní soubor. Vyberte soubor, který chcete načíst:</p>
          <div id="fileList" style="display: grid; gap: 8px;"></div>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    const fileList = modal.querySelector('#fileList');
    const codeFiles = files.filter(f =>
      f.type === 'file' &&
      !f.name.startsWith('.') &&
      (f.name.endsWith('.html') || f.name.endsWith('.htm') ||
       f.name.endsWith('.js') || f.name.endsWith('.py') ||
       f.name.endsWith('.css') || f.name.endsWith('.json') ||
       f.name.endsWith('.md') || f.name.endsWith('.txt'))
    );

    if (codeFiles.length === 0) {
      fileList.innerHTML = '<p style="color: #888888; text-align: center; padding: 20px;">Žádné načitatelné soubory nenalezeny</p>';
    } else {
      codeFiles.forEach(file => {
        const btn = document.createElement('button');
        btn.style.cssText = 'padding: 12px; background: #242424; color: #ffffff; border: 1px solid #333; border-radius: 6px; cursor: pointer; text-align: left; transition: all 0.2s; display: flex; align-items: center; gap: 10px;';

        const icon = this.getFileIcon(file.name);
        btn.innerHTML = `
          <span style="font-size: 20px;">${icon}</span>
          <span style="flex: 1;">${file.name}</span>
          <span style="font-size: 11px; color: #888888;">${this.formatBytes(file.size)}</span>
        `;

        btn.addEventListener('mouseenter', () => {
          btn.style.background = '#333';
          btn.style.borderColor = '#0066cc';
        });

        btn.addEventListener('mouseleave', () => {
          btn.style.background = '#242424';
          btn.style.borderColor = '#333';
        });

        btn.addEventListener('click', async () => {
          modal.remove();
          this.showLoadingOverlay('📥 Načítám soubor...');

          try {
            const response = await fetch(file.download_url);
            if (!response.ok) throw new Error('Nepodařilo se načíst soubor');

            const code = await response.text();
            this.hideLoadingOverlay();
            await this.handleGitHubCodeLoad(code, file.name);
          } catch (error) {
            this.hideLoadingOverlay();
            eventBus.emit('toast:show', {
              message: '❌ ' + error.message,
              type: 'error'
            });
          }
        });

        fileList.appendChild(btn);
      });
    }

    modal.querySelector('#closeFileSelector').addEventListener('click', () => modal.remove());
    modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.remove();
    });
  }

  getFileIcon(fileName) {
    const ext = fileName.split('.').pop().toLowerCase();
    const icons = {
      'html': ICONS.PAGE,
      'htm': ICONS.PAGE,
      'css': '🎨',
      'js': ICONS.MEMO,
      'json': ICONS.MEMO,
      'py': '🐍',
      'md': ICONS.MEMO,
      'txt': ICONS.MEMO
    };
    return icons[ext] || ICONS.PAGE;
  }

  formatBytes(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }

  async loadGitHubCode(url, name, isSingleFile) {
    return this.githubService.loadGitHubCode(url, name, isSingleFile);
  }

  async handleGitHubCodeLoad(code, fileName) {
    return this.githubService.handleGitHubCodeLoad(code, fileName);
  }

  cloneRepo() {
    return this.githubService.cloneRepo();
  }

  createGist() {
    return this.githubService.createGist();
  }

  // GitHub token management - Delegated to GitHubService
  getStoredToken() {
    return this.githubService.getStoredToken();
  }

  saveGitHubToken() {
    return this.githubService.saveGitHubToken(this.modal);
  }

  checkGitHubConnection() {
    return this.githubService.checkGitHubConnection(this.modal);
  }

  async initiateGitHubOAuth() {
    return this.githubService.initiateGitHubOAuth();
  }

  showGitHubLoginModal() {
    return this.githubService.showGitHubLoginModal();
  }

  async showRepoManager() {
    return this.githubService.showRepoManager();
  }

  // Keep repository manager methods as they're complex and will be refactored later

  // Keep repository manager methods as they're complex and will be refactored later
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

  getMockRepositories(_username) {
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

  async loadCrewAIAgents(agentsGrid) {
    if (!window.CrewAI || !window.CrewAI.isAvailable) {
      agentsGrid.innerHTML = `
        <div class="crewai-warning">
          <h4>🤖 CrewAI Python agenti</h4>
          <p style="margin: 10px 0;">Server není spuštěný, ale můžeš ho snadno spustit:</p>

          <div style="background: #2a2a2a; padding: 15px; border-radius: 8px; margin: 15px 0;">
            <p style="margin: 5px 0; font-weight: bold; color: #4EC9B0;">📦 Nejjednodušší způsob:</p>
            <p style="margin: 5px 0;">Dvojklik na soubor:</p>
            <code style="display: block; background: #1e1e1e; padding: 8px; border-radius: 4px; margin: 5px 0;">start-crewai.bat</code>
          </div>

          <details style="margin: 15px 0; cursor: pointer;">
            <summary style="font-weight: bold; color: #4EC9B0; padding: 5px 0;">🔧 Další možnosti spuštění</summary>
            <div style="padding: 10px 0;">
              <p><strong>NPM příkaz:</strong></p>
              <code style="display: block; background: #1e1e1e; padding: 8px; border-radius: 4px; margin: 5px 0;">npm run crewai:start</code>

              <p style="margin-top: 10px;"><strong>Nebo ručně:</strong></p>
              <code style="display: block; background: #1e1e1e; padding: 8px; border-radius: 4px; margin: 5px 0;">python python/crewai_api.py</code>
            </div>
          </details>

          <button class="btn btn-primary" id="retryCrewAIConnection" style="width: 100%; margin-top: 10px;">
            🔄 Zkontrolovat připojení
          </button>

          <p style="margin-top: 15px; font-size: 0.9em; color: #999;">
            💡 Po spuštění serveru klikni na "Zkontrolovat připojení"
          </p>
        </div>
      `;

      // Přidej handler pro retry button
      const retryBtn = agentsGrid.querySelector('#retryCrewAIConnection');
      if (retryBtn) {
        retryBtn.addEventListener('click', async () => {
          retryBtn.disabled = true;
          retryBtn.textContent = '⏳ Kontroluji...';

          await window.CrewAI.checkConnection();

          if (window.CrewAI.isAvailable) {
            toast.show('✅ CrewAI server připojen!', 'success');
            this.loadCrewAIAgents(agentsGrid);
          } else {
            toast.show('⚠️ Server stále není dostupný', 'warning');
            retryBtn.disabled = false;
            retryBtn.textContent = '🔄 Zkontrolovat připojení';
          }
        });
      }

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

    let loadingMsg = null;

    if (messagesContainer) {
      // Add user message
      const userMsg = document.createElement('div');
      userMsg.className = 'agent-message user';
      userMsg.innerHTML = '<strong>Ty:</strong><p>' + this.escapeHtml(task) + '</p>';
      messagesContainer.appendChild(userMsg);

      // Add loading message
      loadingMsg = document.createElement('div');
      loadingMsg.className = 'agent-message assistant loading';
      loadingMsg.innerHTML = '<strong>CrewAI:</strong><p>Zpracovávám úkol...</p>';
      messagesContainer.appendChild(loadingMsg);
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    try {
      const result = await window.CrewAI.runSingleAgent(agentId, task);

      if (messagesContainer && loadingMsg) {
        loadingMsg.remove();

        const responseMsg = document.createElement('div');
        responseMsg.className = 'agent-message assistant';
        responseMsg.innerHTML = '<strong>CrewAI:</strong><p>' + this.escapeHtml(result.result) + '</p>';
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

⚠️ KRITICKÉ PRAVIDLO PRO ÚPRAVY EXISTUJÍCÍCH PROJEKTŮ:
${currentCode ? `
**PROJEKT UŽ EXISTUJE! NEPOUŽÍVEJ komplettní kód - použij SEARCH/REPLACE!**

Použij tento formát pro úpravu existujícího kódu:

\`\`\`SEARCH
[přesný kód který chceš najít a nahradit]
\`\`\`
\`\`\`REPLACE
[nový kód]
\`\`\`

Můžeš použít více SEARCH/REPLACE bloků najednou.
**NIKDY nepoužívej komplettní kód - jen SEARCH/REPLACE bloky!**
` : `
**NOVÝ PROJEKT - použij komplettní kód:**
\`\`\`html
[zde vlož KOMPLETNÍ fungující kód s UNIKÁTNÍMI názvy proměnných]
\`\`\`
`}

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

      // Check for SEARCH/REPLACE format (for existing projects)
      const searchReplaceEdits = this.parseSearchReplaceInstructions(response);

      if (searchReplaceEdits.length > 0) {
        console.log(`🔧 Orchestrator použil SEARCH/REPLACE - aplikuji ${searchReplaceEdits.length} změn`);

        // Extract description (before first SEARCH block)
        const descriptionMatch = response.match(/([\s\S]*?)```\s*SEARCH/);
        const description = descriptionMatch ? descriptionMatch[1].trim() : '✅ Orchestrator provedl změny.';

        // Add description to chat
        this.addChatMessage('ai', description);

        // Show confirmation for changes
        await this.showChangeConfirmation(searchReplaceEdits);

        return;
      }

      // Extract and apply code if present (for new projects)
      const codeMatch = response.match(/```(?:html)?\n([\s\S]*?)```/);
      if (codeMatch && codeMatch[1]) {
        const code = codeMatch[1].trim();

        // Extract only the description/plan part (before the code)
        const descriptionMatch = response.match(/([\s\S]*?)```/);
        const description = descriptionMatch ? descriptionMatch[1].trim() : '✅ Kód byl vygenerován a vložen do editoru.';

        // Add only description to chat, not the full code
        this.addChatMessage('ai', description);

        // Add to history (without full code)
        this.chatService.addToHistory('assistant', description);
        this.chatHistory = this.chatService.getHistory();
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
        this.chatService.addToHistory('assistant', response);
        this.chatHistory = this.chatService.getHistory();
      }

      // Update history counter
      this.chatHistoryService.updateHistoryInfo();

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

    let loadingMsg = null;

    if (messagesContainer) {
      messagesContainer.innerHTML = '<div class="agent-message system">🐍 Spouštím CrewAI tým...</div>';

      loadingMsg = document.createElement('div');
      loadingMsg.className = 'agent-message assistant loading';
      loadingMsg.innerHTML = '<strong>CrewAI:</strong><p>Agenti pracují na úkolu (může trvat několik minut)...</p>';
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
    this.chatHistoryService.updateHistoryInfo();

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
    this.chatService.addToHistory('system', orchestratorPrompt);
    this.chatHistory = this.chatService.getHistory();
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

  /**
   * Debounce utility for performance optimization
   */
  debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  /**
   * Clear formatting cache to free memory
   */
  clearFormatCache() {
    if (this.formatCache.size > 50) {
      // Keep only last 20 entries
      const entries = Array.from(this.formatCache.entries());
      this.formatCache.clear();
      entries.slice(-20).forEach(([key, value]) => {
        this.formatCache.set(key, value);
      });
    }
  }

  /**
   * Zobrazí dialog pro export chatu s lepší čitelností
   */
  showExportDialog() {
    if (this.chatHistory.length === 0) {
      toast.show('⚠️ Žádná konverzace k exportu', 'warning');
      return;
    }

    const messageCount = this.chatHistory.length;
    const modal = document.createElement('div');
    modal.className = 'export-dialog-overlay';
    modal.innerHTML = `
      <div class="export-dialog-content">
        <div class="export-dialog-header">
          <h3>Export konverzace</h3>
          <button class="export-dialog-close" aria-label="Zavřít">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
        <div class="export-dialog-body">
          <p class="export-info">Historie obsahuje <strong>${messageCount}</strong> ${messageCount === 1 ? 'zprávu' : messageCount < 5 ? 'zprávy' : 'zpráv'}.</p>
          <p class="export-question">Vyberte formát pro export:</p>
          <div class="export-options">
            <button class="export-option-btn json-export" data-format="json">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="24" height="24">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <polyline points="14 2 14 8 20 8"></polyline>
                <path d="M10 12h4"></path>
                <path d="M10 16h4"></path>
              </svg>
              <span>JSON</span>
              <small>Strukturovaný datový formát</small>
            </button>
            <button class="export-option-btn md-export" data-format="markdown">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="24" height="24">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <polyline points="14 2 14 8 20 8"></polyline>
                <line x1="16" y1="13" x2="8" y2="13"></line>
                <line x1="16" y1="17" x2="8" y2="17"></line>
              </svg>
              <span>Markdown</span>
              <small>Čitelný textový formát</small>
            </button>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    // Close handlers
    const closeDialog = () => {
      modal.classList.add('closing');
      setTimeout(() => modal.remove(), 200);
    };

    modal.querySelector('.export-dialog-close').addEventListener('click', closeDialog);
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeDialog();
    });

    // Export handlers
    modal.querySelector('.json-export').addEventListener('click', () => {
      this.chatHistoryService.exportChatHistory();
      closeDialog();
    });

    modal.querySelector('.md-export').addEventListener('click', () => {
      this.chatHistoryService.exportChatAsMarkdown();
      closeDialog();
    });

    // Animate in
    requestAnimationFrame(() => modal.classList.add('show'));
  }
}