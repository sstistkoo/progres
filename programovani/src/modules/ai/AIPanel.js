/**
 * AI Panel Module
 * Provides AI assistant interface with chat, templates, and quick actions
 */

import { eventBus } from '../../core/events.js';
import { state } from '../../core/state.js';
// SafeOps is used indirectly by services
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
import { MESSAGES } from './constants/Messages.js';
import { UIRenderingService } from './services/UIRenderingService.js';
import { ActionsService } from './services/ActionsService.js';
import { TestingService } from './services/TestingService.js';
import { PokecChatService } from './services/PokecChatService.js';
import { ChangedFilesService } from './services/ChangedFilesService.js';
// NEW: Refactored services for modular architecture
import { ProviderService } from './services/ProviderService.js';
import { ErrorHandlingService } from './services/ErrorHandlingService.js';
import { ModalBuilderService } from './services/ModalBuilderService.js';
import { MessageProcessingService } from './services/MessageProcessingService.js';

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

    // NEW: Initialize refactored services
    this.providerService = new ProviderService(this);
    this.errorHandlingService = new ErrorHandlingService(this);
    this.modalBuilderService = new ModalBuilderService(this);
    this.messageProcessingService = new MessageProcessingService(this);

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
          <button class="ai-menu-item" data-tab="pokec">💬 Pokec</button>
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
                  <span class="error-label">chyb</span>
                </button>
                <button class="ai-attach-btn compact" id="aiAttachBtn" title="Přidat soubor">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48"/>
                  </svg>
                </button>
                <button class="ai-send-btn" id="aiSendBtn" title="Odeslat zprávu">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/>
                  </svg>
                  <span>Odeslat</span>
                </button>
                <button class="ai-cancel-btn-original compact" style="display: none;" title="Zrušit">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M18 6L6 18M6 6l12 12"/>
                  </svg>
                </button>
                <button class="ai-orchestrator-btn" id="aiOrchestratorBtn" title="Orchestrator">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M12 2L2 7l10 5 10-5-10-5z"/>
                    <path d="M2 17l10 5 10-5"/>
                    <path d="M2 12l10 5 10-5"/>
                  </svg>
                  <span>Tým</span>
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
              <h3>💬 Pokec s AI</h3>
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
    // Delegováno na ErrorHandlingService
    this.errorHandlingService.setupErrorIndicator();
  }

  updateErrorIndicator(errorCount) {
    // Delegováno na ErrorHandlingService
    this.errorHandlingService.updateErrorIndicator(errorCount);
  }

  sendAllErrorsToAI() {
    // Delegováno na ErrorHandlingService
    this.errorHandlingService.sendAllErrorsToAI();
  }

  isErrorIgnored(errorText) {
    return this.errorHandlingService.isErrorIgnored(errorText);
  }

  ignoreErrors(errors) {
    this.errorHandlingService.ignoreErrors(errors);
  }

  showErrorSelectionModal(errorMessages) {
    this.errorHandlingService.showErrorSelectionModal(errorMessages);
  }

  showIgnoredErrorsModal() {
    this.errorHandlingService.showIgnoredErrorsModal();
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
        item.addEventListener('click', () => {
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
╔═══════════════════════════════════════════════════════════╗
║  🚨🚨🚨 KRITICKÝ REŽIM: NOVÝ PROJEKT 🚨🚨🚨              ║
╚═══════════════════════════════════════════════════════════╝

⚠️⚠️⚠️ ABSOLUTNĚ ZAKÁZÁNO POUŽÍVAT SEARCH/REPLACE! ⚠️⚠️⚠️

Editor je PRÁZDNÝ. Neexistuje žádný kód k úpravě.
SEARCH/REPLACE NEBUDE FUNGOVAT - editor je prázdný!

✅ MUSÍŠ UDĚLAT PŘESNĚ TOTO:
1. Okamžitě vytvoř KOMPLETNÍ HTML soubor
2. Začni: <!DOCTYPE html>
3. Skonči: </html>
4. Vše v JEDNOM \`\`\`html bloku
5. Kód MUSÍ být 100% funkční a kompletní

❌ ZAKÁZANÉ FORMÁTY (NEBUDOU FUNGOVAT!):
- \`\`\`SEARCH ... \`\`\`REPLACE - ZAKÁZÁNO!
- Jakékoliv diff/patch formáty - ZAKÁZÁNO!
- Částečný kód - ZAKÁZÁNO!

📝 SPRÁVNÝ FORMÁT ODPOVĚDI:
\`\`\`html
<!DOCTYPE html>
<html lang="cs">
<head>...</head>
<body>...</body>
</html>
\`\`\`

VYTVOŘ KOMPLETNÍ KÓD NYNÍ!
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
      // 🆕 ALE POUZE pokud NEJSME v režimu nového projektu!
      const searchReplaceEdits = this.parseSearchReplaceInstructions(response);

      // V režimu nového projektu ignorujeme SEARCH/REPLACE a extrahujeme kompletní kód
      if (isNewProjectMode && searchReplaceEdits.length > 0) {
        console.log('[AIPanel] 🆕 Režim nový projekt - ignoruji SEARCH/REPLACE, hledám kompletní kód');
        // Zkusíme extrahovat kompletní HTML kód z odpovědi
        const htmlMatch = response.match(/```html\n([\s\S]*?)```/);
        if (htmlMatch && htmlMatch[1]) {
          const completeCode = htmlMatch[1].trim();
          console.log('[AIPanel] ✅ Nalezen kompletní HTML kód v odpovědi');
          this.addChatMessage('assistant', response);
          this.insertCodeToEditor(completeCode, false);
          toast.success('✅ Nový projekt vytvořen!', 3000);
          return;
        }
        // Pokud není ```html blok, zkusíme najít jakýkoliv kód
        const anyCodeMatch = response.match(/```(?:html|javascript|js)?\n([\s\S]*?)```/);
        if (anyCodeMatch && anyCodeMatch[1] && anyCodeMatch[1].includes('<!DOCTYPE')) {
          const completeCode = anyCodeMatch[1].trim();
          console.log('[AIPanel] ✅ Nalezen kompletní kód (alternativní match)');
          this.addChatMessage('assistant', response);
          this.insertCodeToEditor(completeCode, false);
          toast.success('✅ Nový projekt vytvořen!', 3000);
          return;
        }
        console.warn('[AIPanel] ⚠️ AI vrátila SEARCH/REPLACE v režimu nového projektu, ale nenalezen kompletní kód');
        // Pokračuj normálně - zobraz odpověď
      }

      if (searchReplaceEdits.length > 0 && !isNewProjectMode) {
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
      } else if (response.includes('SEARCH') || response.includes('```search')) {
        // SEARCH bloky byly detekovány ale neparsovány správně

        // Zobraz AI response v chatu, aby uživatel viděl co AI poslala
        this.addChatMessage('assistant', response);

        // Zkus zjistit důvod - debug info
        const hasSearchBlock = /```\s*SEARCH/i.test(response);
        const hasReplaceBlock = /```\s*REPLACE/i.test(response);

        let errorDetail = '';
        if (!hasSearchBlock) {
          errorDetail = '❓ Nenalezen ```SEARCH blok';
        } else if (!hasReplaceBlock) {
          errorDetail = '❓ Nenalezen ```REPLACE blok';
        } else {
          errorDetail = '⚠️ Bloky nalezeny, ale obsahují neplatný obsah (zkratky, placeholdery)';
        }

        console.error('❌ SEARCH/REPLACE parsing failed:', errorDetail);
        console.error('Response preview:', response.substring(0, 500));

        // Zobraz error toast s konkrétním důvodem
        toast.error(
          '❌ SEARCH/REPLACE bloky se nepodařilo zpracovat\n\n' +
          errorDetail + '\n\n' +
          '💡 Tip: Požádej AI znovu s upřesněním:\n' +
          'Uprav kód pomocí SEARCH/REPLACE - použij PŘESNÝ kód',
          8000
        );
        console.error('❌ SEARCH bloky ignorovány - viz konzole pro detaily');
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

  acceptChange(changeId, actionsContainer) {
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
  async showChangeConfirmation(editInstructions) {
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
          }
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
    return this.messageProcessingService.handleNewProjectStart();
  }

  resetToNewProject() {
    return this.messageProcessingService.resetToNewProject();
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
    // Delegováno na ProviderService
    return this.providerService.generateProviderOptions();
  }

  updateModels(provider) {
    // Delegováno na ProviderService
    this.providerService.updateModels(provider);
  }

  toggleModelFavorite(provider, modelValue) {
    // Delegováno na ProviderService
    this.providerService.toggleModelFavorite(provider, modelValue);
  }

  /**
   * Update Auto AI state - enable/disable provider and model selects
   */
  updateAutoAIState() {
    // Delegováno na ProviderService
    this.providerService.updateAutoAIState();
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
    return this.githubService.showRepoFileSelector(fullName, branch, files, repoName);
  }

  getFileIcon(fileName) {
    return this.githubService.getFileIcon(fileName);
  }

  formatBytes(bytes) {
    return this.githubService.formatBytes(bytes);
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

  // Repository manager methods - Delegated to GitHubService
  createRepoManagerContent() {
    return this.githubService.createRepoManagerContent();
  }

  attachRepoManagerHandlers(repoModal) {
    return this.githubService.attachRepoManagerHandlers(repoModal);
  }

  async loadRepositories(repoModal) {
    return this.githubService.loadRepositories(repoModal);
  }

  getMockRepositories(_username) {
    return this.githubService.getMockRepositories(_username);
  }

  createRepoItem(repo) {
    return this.githubService.createRepoItem(repo);
  }

  async createRepository(repoModal) {
    return this.githubService.createRepository(repoModal);
  }

  async deleteRepository(repoName, repoModal) {
    return this.githubService.deleteRepository(repoName, repoModal);
  }

  // Undo/Redo History Management - Delegated to GitHubService
  getUndoHistory() {
    return this.githubService.getUndoHistory();
  }

  getRedoHistory() {
    return this.githubService.getRedoHistory();
  }

  storeUndoAction(action, data) {
    return this.githubService.storeUndoAction(action, data);
  }

  async undoLastRepoAction(repoModal) {
    return this.githubService.undoLastRepoAction(repoModal);
  }

  async redoRepoAction(repoModal) {
    return this.githubService.redoRepoAction(repoModal);
  }

  updateHistoryButtons(repoModal) {
    return this.githubService.updateHistoryButtons(repoModal);
  }

  filterRepositories(query, repoModal) {
    return this.githubService.filterRepositories(query, repoModal);
  }

  openRepository(repoName) {
    return this.githubService.openRepository(repoName);
  }

  // Agent methods - Delegated to AgentsService
  async loadCrewAIAgents(agentsGrid) {
    return this.agentsService.loadCrewAIAgents(agentsGrid);
  }

  async useCrewAIAgent(agentId) {
    return this.agentsService.useCrewAIAgent(agentId);
  }

  toggleAgent(agentId) {
    return this.agentsService.toggleAgent(agentId);
  }

  updateActiveAgentsList() {
    return this.agentsService.updateActiveAgentsList();
  }

  openAgentChat(agentId) {
    return this.agentsService.openAgentChat(agentId);
  }

  async sendToOrchestrator(message) {
    // Add user message to chat
    this.addChatMessage('user', message);

    // Show thinking message
    const thinkingId = 'orchestrator-thinking-' + Date.now();
    this.addChatMessage('ai', '🎭 Orchestrator připravuje úkoly pro agenty...', thinkingId);

    try {
      // Get current code for context (limit to 15000 chars to avoid context overflow)
      let currentCode = state.get('editor.code') || '';
      const maxCodeLength = 15000;
      if (currentCode.length > maxCodeLength) {
        console.log(`[AIPanel] Kód je příliš dlouhý (${currentCode.length}), ořezávám na ${maxCodeLength} znaků`);
        currentCode = currentCode.substring(0, maxCodeLength) + '\n... (kód zkrácen) ...';
      }

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

📄 **AKTUÁLNÍ KÓD V EDITORU (musíš použít PŘESNĚ tento kód v SEARCH blocích):**
\`\`\`html
${currentCode}
\`\`\`

Použij tento formát pro úpravu existujícího kódu:

\`\`\`SEARCH
[PŘESNĚ zkopíruj část kódu z výše uvedeného - VČETNĚ MEZER A ODSAZENÍ]
\`\`\`
\`\`\`REPLACE
[nový kód který nahradí SEARCH blok]
\`\`\`

Můžeš použít více SEARCH/REPLACE bloků najednou.
**KRITICKÉ: SEARCH blok MUSÍ být PŘESNÁ kopie z aktuálního kódu výše! Včetně všech mezer!**
**NIKDY nepoužívej komplettní kód - jen SEARCH/REPLACE bloky!**

ODPOVĚZ VE FORMÁTU:
📋 **Analýza požadavku:**
[Krátká analýza co uživatel chce]

🎯 **Plán úkolů:**
[Seznam konkrétních změn pro jednotlivé části kódu]

**Změny:**
[Použij SEARCH/REPLACE bloky pro každou změnu]
` : `
**NOVÝ PROJEKT - použij komplettní kód:**
\`\`\`html
[zde vlož KOMPLETNÍ fungující kód s UNIKÁTNÍMI názvy proměnných]
\`\`\`

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

⚠️ KRITICKÉ PRAVIDLO: KAŽDÁ PROMĚNNÁ MUSÍ MÍT UNIKÁTNÍ NÁZEV!
`}`;

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

        // Kontrola, že kód je dostatečně dlouhý a vypadá jako HTML
        const isValidHtml = code.length > 50 && (
          code.includes('<!DOCTYPE') ||
          code.includes('<html') ||
          code.includes('<body') ||
          code.includes('<div') ||
          code.includes('<head')
        );

        if (!isValidHtml) {
          console.warn('[AIPanel] Orchestrator vrátil příliš krátký nebo nevalidní kód, zobrazuji odpověď');
          this.addChatMessage('ai', response);
          this.chatService.addToHistory('assistant', response);
          this.chatHistory = this.chatService.getHistory();
          return;
        }

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
    return this.agentsService.clearAgentsHistory();
  }

  prefillPromptForAgent(agentId) {
    return this.agentsService.prefillPromptForAgent(agentId);
  }

  // ========================================
  // ORCHESTRATOR METHODS - Delegated to AgentsService
  // ========================================

  openOrchestratorPromptBuilder() {
    return this.agentsService.openOrchestratorPromptBuilder();
  }

  createOrchestratorBuilderContent() {
    return this.agentsService.createOrchestratorBuilderContent();
  }

  attachOrchestratorBuilderHandlers(modal) {
    return this.agentsService.attachOrchestratorBuilderHandlers(modal);
  }

  addOrchestratorMessage(role, content) {
    return this.agentsService.addOrchestratorMessage?.(role, content);
  }

  async analyzeProjectAndSuggestTeam(projectDescription) {
    return this.agentsService.analyzeProjectAndSuggestTeam(projectDescription, this.selectedComplexity || 1);
  }

  displayTeamPreview(teamSuggestion) {
    return this.agentsService.displayTeamPreview(teamSuggestion);
  }

  async activateOrchestratedTeam(teamSuggestion, projectDescription, forceNew = false) {
    return this.agentsService.activateOrchestratedTeam(teamSuggestion, projectDescription, forceNew);
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
