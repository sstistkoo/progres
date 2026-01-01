/**
 * Sidebar Module - VS Code style sidebar
 * Files explorer and GitHub repository manager
 */

import { eventBus } from '@core/events.js';
import { state } from '@core/state.js';
import toast from '@ui/components/Toast.js';

export class Sidebar {
  constructor() {
    this.isVisible = false;
    this.activeTab = 'files'; // 'files' or 'github'
    this.sidebarElement = null;
    this.init();
  }

  init() {
    this.createSidebar();
    this.setupEventListeners();
  }

  setupEventListeners() {
    eventBus.on('sidebar:toggle', () => this.toggle());
    eventBus.on('sidebar:show', () => this.show());
    eventBus.on('sidebar:hide', () => this.hide());
    eventBus.on('tabs:updated', () => this.updateFilesList());
  }

  createSidebar() {
    // Remove existing sidebar if any
    const existing = document.getElementById('appSidebar');
    if (existing) existing.remove();

    // Create sidebar structure
    const sidebar = document.createElement('div');
    sidebar.id = 'appSidebar';
    sidebar.className = 'app-sidebar';
    sidebar.innerHTML = this.createSidebarHTML();

    // Insert into DOM
    document.body.appendChild(sidebar);
    this.sidebarElement = sidebar;

    // Attach event handlers
    this.attachEventHandlers();
  }

  createSidebarHTML() {
    return `
      <!-- Sidebar Header -->
      <div class="sidebar-header">
        <div class="sidebar-tabs">
          <button class="sidebar-tab active" data-tab="files" title="Soubory">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/>
              <path d="M13 2v7h7"/>
            </svg>
            <span>Soubory</span>
          </button>
          <button class="sidebar-tab" data-tab="github" title="GitHub">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"/>
            </svg>
            <span>GitHub</span>
          </button>
        </div>
        <button class="sidebar-close" id="sidebarClose" title="Zavřít (Escape)">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M18 6L6 18M6 6l12 12"/>
          </svg>
        </button>
      </div>

      <!-- Sidebar Content -->
      <div class="sidebar-content">
        <!-- Files Tab -->
        <div class="sidebar-panel active" data-panel="files">
          <div class="panel-section">
            <div class="section-header">
              <h3>📂 Otevřené soubory</h3>
              <span class="file-count">0</span>
            </div>
            <div class="files-list" id="openFilesList">
              <div class="empty-state">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/>
                  <path d="M13 2v7h7"/>
                </svg>
                <p>Žádné otevřené soubory</p>
                <small>Vytvořte nový soubor nebo otevřete existující</small>
              </div>
            </div>
          </div>

          <div class="panel-section">
            <div class="section-header">
              <h3>⚡ Rychlé akce</h3>
            </div>
            <div class="quick-actions">
              <button class="action-btn" data-action="newFile">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <path d="M14 2v6h6M12 18v-6m-3 3h6"/>
                </svg>
                <span>Nový soubor</span>
              </button>
              <button class="action-btn" data-action="save">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
                  <path d="M17 21v-8H7v8M7 3v5h8"/>
                </svg>
                <span>Uložit</span>
              </button>
              <button class="action-btn" data-action="download">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <path d="M7 10l5 5 5-5M12 15V3"/>
                </svg>
                <span>Stáhnout</span>
              </button>
            </div>
          </div>
        </div>

        <!-- GitHub Tab -->
        <div class="sidebar-panel" data-panel="github">
          <div class="panel-section">
            <div class="github-status" id="githubStatus">
              <div class="status-badge disconnected">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="10"/>
                  <path d="M15 9l-6 6M9 9l6 6"/>
                </svg>
                <span>Nepřipojeno</span>
              </div>
            </div>
          </div>

          <div class="panel-section">
            <div class="section-header">
              <h3>🔐 Přihlášení</h3>
            </div>
            <button class="github-login-btn" id="githubLoginBtn">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"/>
              </svg>
              <span>Přihlásit se na GitHub</span>
            </button>
          </div>

          <div class="panel-section" id="githubRepoSection" style="display: none;">
            <div class="section-header">
              <h3>📦 Repozitář</h3>
            </div>
            <div class="repo-info" id="repoInfo">
              <!-- Repo info will be populated here -->
            </div>
          </div>

          <div class="panel-section">
            <div class="section-header">
              <h3>📘 GitHub Pages</h3>
            </div>
            <div class="github-pages-info">
              <p class="info-text">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="10"/>
                  <path d="M12 16v-4M12 8h.01"/>
                </svg>
                Pro použití GitHub Pages se přihlaste a připojte repozitář
              </p>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  attachEventHandlers() {
    // Close button
    const closeBtn = this.sidebarElement.querySelector('#sidebarClose');
    closeBtn?.addEventListener('click', () => this.hide());

    // Tab switching
    const tabs = this.sidebarElement.querySelectorAll('.sidebar-tab');
    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        const tabName = tab.dataset.tab;
        this.switchTab(tabName);
      });
    });

    // Quick actions
    const actionBtns = this.sidebarElement.querySelectorAll('.action-btn');
    actionBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const action = btn.dataset.action;
        this.handleQuickAction(action);
      });
    });

    // GitHub login
    const loginBtn = this.sidebarElement.querySelector('#githubLoginBtn');
    loginBtn?.addEventListener('click', () => this.showGitHubLoginModal());

    // Close on Escape
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isVisible) {
        this.hide();
      }
    });

    // Close on overlay click
    this.sidebarElement.addEventListener('click', (e) => {
      if (e.target === this.sidebarElement) {
        this.hide();
      }
    });
  }

  switchTab(tabName) {
    this.activeTab = tabName;

    // Update tab buttons
    const tabs = this.sidebarElement.querySelectorAll('.sidebar-tab');
    tabs.forEach(tab => {
      if (tab.dataset.tab === tabName) {
        tab.classList.add('active');
      } else {
        tab.classList.remove('active');
      }
    });

    // Update panels
    const panels = this.sidebarElement.querySelectorAll('.sidebar-panel');
    panels.forEach(panel => {
      if (panel.dataset.panel === tabName) {
        panel.classList.add('active');
      } else {
        panel.classList.remove('active');
      }
    });

    // Update content if needed
    if (tabName === 'files') {
      this.updateFilesList();
    } else if (tabName === 'github') {
      this.updateGitHubStatus();
    }
  }

  handleQuickAction(action) {
    eventBus.emit(`action:${action}`);

    // Don't auto-close for certain actions
    if (action !== 'newFile') {
      setTimeout(() => this.hide(), 300);
    }
  }

  updateFilesList() {
    const filesList = this.sidebarElement?.querySelector('#openFilesList');
    if (!filesList) return;

    // Get tabs from state
    const tabs = state.get('tabs.list') || [];
    const activeIndex = state.get('tabs.activeIndex') || 0;

    // Update count
    const countElement = this.sidebarElement.querySelector('.file-count');
    if (countElement) {
      countElement.textContent = tabs.length;
    }

    if (tabs.length === 0) {
      filesList.innerHTML = `
        <div class="empty-state">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/>
            <path d="M13 2v7h7"/>
          </svg>
          <p>Žádné otevřené soubory</p>
          <small>Vytvořte nový soubor nebo otevřete existující</small>
        </div>
      `;
      return;
    }

    filesList.innerHTML = tabs.map((tab, index) => {
      const isActive = index === activeIndex;
      const icon = tab.language === 'html' ? '📄' :
                   tab.language === 'css' ? '🎨' :
                   tab.language === 'javascript' ? '⚡' : '📝';

      return `
        <div class="file-item ${isActive ? 'active' : ''}" data-index="${index}">
          <span class="file-icon">${icon}</span>
          <span class="file-name">${tab.name || 'Bez názvu'}</span>
          <button class="file-close" data-index="${index}" title="Zavřít">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>
      `;
    }).join('');

    // Attach file click handlers
    filesList.querySelectorAll('.file-item').forEach(item => {
      item.addEventListener('click', (e) => {
        if (!e.target.closest('.file-close')) {
          const index = parseInt(item.dataset.index);
          eventBus.emit('tabs:switch', { index });
          this.hide();
        }
      });
    });

    // Attach close handlers
    filesList.querySelectorAll('.file-close').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const index = parseInt(btn.dataset.index);
        eventBus.emit('tabs:close', { index });
      });
    });
  }

  updateGitHubStatus() {
    const username = localStorage.getItem('github_username');
    const statusElement = this.sidebarElement?.querySelector('#githubStatus');
    const repoSection = this.sidebarElement?.querySelector('#githubRepoSection');

    if (!statusElement) return;

    if (username) {
      statusElement.innerHTML = `
        <div class="status-badge connected">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"/>
            <path d="M9 12l2 2 4-4"/>
          </svg>
          <span>Připojeno jako @${username}</span>
        </div>
      `;

      if (repoSection) {
        repoSection.style.display = 'block';
      }
    } else {
      statusElement.innerHTML = `
        <div class="status-badge disconnected">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"/>
            <path d="M15 9l-6 6M9 9l6 6"/>
          </svg>
          <span>Nepřipojeno</span>
        </div>
      `;

      if (repoSection) {
        repoSection.style.display = 'none';
      }
    }
  }

  showGitHubLoginModal() {
    // Create login modal
    const modal = document.createElement('div');
    modal.className = 'github-login-modal';
    modal.innerHTML = `
      <div class="modal-overlay"></div>
      <div class="modal-content">
        <div class="modal-header">
          <h2>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"/>
            </svg>
            Přihlášení na GitHub
          </h2>
          <button class="modal-close">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>
        <div class="modal-body">
          <p class="info-message">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"/>
              <path d="M12 16v-4M12 8h.01"/>
            </svg>
            V produkční verzi by se zde otevřelo OAuth okno od GitHubu. Pro demo zadejte své GitHub uživatelské jméno:
          </p>
          <div class="form-group">
            <label for="githubUsername">GitHub uživatelské jméno</label>
            <input
              type="text"
              id="githubUsername"
              placeholder="např. octocat"
              class="github-input"
            />
          </div>
          <div class="form-group">
            <label for="githubToken">Personal Access Token (volitelné)</label>
            <input
              type="password"
              id="githubToken"
              placeholder="ghp_..."
              class="github-input"
            />
            <small class="help-text">
              Pro plný přístup k API vytvořte token na
              <a href="https://github.com/settings/tokens" target="_blank">github.com/settings/tokens</a>
            </small>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn-secondary" data-action="cancel">Zrušit</button>
          <button class="btn-primary" data-action="login">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4M10 17l5-5-5-5M13.8 12H3"/>
            </svg>
            Přihlásit se
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    // Focus input
    setTimeout(() => {
      modal.querySelector('#githubUsername')?.focus();
    }, 100);

    // Handle modal actions
    const closeModal = () => {
      modal.classList.add('closing');
      setTimeout(() => modal.remove(), 300);
    };

    modal.querySelector('.modal-close')?.addEventListener('click', closeModal);
    modal.querySelector('.modal-overlay')?.addEventListener('click', closeModal);
    modal.querySelector('[data-action="cancel"]')?.addEventListener('click', closeModal);

    modal.querySelector('[data-action="login"]')?.addEventListener('click', () => {
      const username = modal.querySelector('#githubUsername').value.trim();
      const token = modal.querySelector('#githubToken').value.trim();

      if (!username) {
        toast.error('Zadejte uživatelské jméno');
        return;
      }

      // Store credentials
      localStorage.setItem('github_username', username);
      if (token) {
        localStorage.setItem('github_token', token);
      }

      toast.success(`Připojeno jako @${username}`);
      this.updateGitHubStatus();
      closeModal();
    });

    // Enter to submit
    modal.querySelectorAll('.github-input').forEach(input => {
      input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          modal.querySelector('[data-action="login"]')?.click();
        }
      });
    });

    // Escape to close
    const escapeHandler = (e) => {
      if (e.key === 'Escape') {
        closeModal();
        document.removeEventListener('keydown', escapeHandler);
      }
    };
    document.addEventListener('keydown', escapeHandler);

    // Show modal
    setTimeout(() => modal.classList.add('show'), 10);
  }

  show() {
    if (this.isVisible) return;

    this.sidebarElement.classList.add('visible');
    this.isVisible = true;

    // Update content
    if (this.activeTab === 'files') {
      this.updateFilesList();
    } else if (this.activeTab === 'github') {
      this.updateGitHubStatus();
    }

    // Add body class
    document.body.classList.add('sidebar-open');
  }

  hide() {
    if (!this.isVisible) return;

    this.sidebarElement.classList.remove('visible');
    this.isVisible = false;
    document.body.classList.remove('sidebar-open');
  }

  toggle() {
    if (this.isVisible) {
      this.hide();
    } else {
      this.show();
    }
  }
}
