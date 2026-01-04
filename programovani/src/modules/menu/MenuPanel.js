/**
 * Menu Panel Module
 * Main navigation menu
 */

import { eventBus } from '../../core/events.js';

export class MenuPanel {
  constructor() {
    this.menuElement = null;
    this.isOpen = false;
    this.setupEventListeners();
  }

  setupEventListeners() {
    eventBus.on('menu:toggle', () => this.toggle());
    eventBus.on('menu:show', () => this.show());
    eventBus.on('menu:hide', () => this.hide());
  }

  toggle() {
    if (this.isOpen) {
      this.hide();
    } else {
      this.show();
    }
  }

  show() {
    if (!this.menuElement) {
      this.createMenu();
    }

    // Update open files list before showing
    this.updateOpenFilesList();

    this.menuElement.classList.add('active');
    this.isOpen = true;

    // Add backdrop
    const backdrop = document.createElement('div');
    backdrop.className = 'menu-backdrop';
    backdrop.addEventListener('click', () => this.hide());
    document.body.appendChild(backdrop);

    // Close on escape
    this.escapeHandler = (e) => {
      if (e.key === 'Escape') {
        this.hide();
      }
    };
    document.addEventListener('keydown', this.escapeHandler);
  }

  hide() {
    if (this.menuElement) {
      this.menuElement.classList.remove('active');
    }

    const backdrop = document.querySelector('.menu-backdrop');
    if (backdrop) {
      backdrop.remove();
    }

    if (this.escapeHandler) {
      document.removeEventListener('keydown', this.escapeHandler);
    }

    this.isOpen = false;
  }

  createMenu() {
    this.menuElement = document.createElement('div');
    this.menuElement.className = 'side-menu';
    this.menuElement.innerHTML = this.createMenuContent();

    document.body.appendChild(this.menuElement);
    this.attachEventHandlers();
  }

  createMenuContent() {
    return `
      <div class="menu-header">
        <h2>Menu</h2>
        <button class="menu-close" id="menuClose">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M18 6L6 18M6 6l12 12"/>
          </svg>
        </button>
      </div>

      <nav class="menu-nav">
        <div class="menu-section">
          <h3>📁 Otevřené soubory</h3>
          <div id="openFilesManager" class="open-files-list">
            <!-- Files will be dynamically added here -->
          </div>
        </div>

        <div class="menu-section">
          <h3>⚙️ Nastavení</h3>
          <button class="menu-item" data-action="aiSettings">
            <span class="menu-icon">🤖</span>
            <span>Nastavení AI</span>
          </button>
          <button class="menu-item" data-action="theme">
            <span class="menu-icon">🎨</span>
            <span>Přepnout téma</span>
          </button>
        </div>

        <div class="menu-section">
          <h3>🛠️ Pokročilé nástroje</h3>
          <button class="menu-item" data-action="gridEditor">
            <span class="menu-icon">📐</span>
            <span>CSS Grid/Flex editor</span>
          </button>
          <button class="menu-item" data-action="liveServer">
            <span class="menu-icon">🌐</span>
            <span>Živý server</span>
          </button>
          <button class="menu-item" data-action="gitignore">
            <span class="menu-icon">📝</span>
            <span>Vytvořit .gitignore</span>
          </button>
          <button class="menu-item" data-action="replace">
            <span class="menu-icon">🔄</span>
            <span>Nahradit v kódu</span>
            <span class="menu-shortcut">Ctrl+H</span>
          </button>
        </div>

        <div class="menu-section">
          <h3>📋 Obsah</h3>
          <button class="menu-item" data-action="components">
            <span class="menu-icon">🧩</span>
            <span>Komponenty</span>
          </button>
          <button class="menu-item" data-action="templates">
            <span class="menu-icon">📋</span>
            <span>Šablony</span>
          </button>
          <button class="menu-item" data-action="images">
            <span class="menu-icon">🖼️</span>
            <span>Obrázky</span>
          </button>
        </div>

        <div class="menu-section">
          <h3>🔗 Sdílení</h3>
          <button class="menu-item" data-action="share">
            <span class="menu-icon">🔗</span>
            <span>Sdílet odkaz</span>
          </button>
        </div>

        <div class="menu-section">
          <h3>🐙 GitHub</h3>
          <button class="menu-item" data-action="github-search">
            <span class="menu-icon">🔍</span>
            <span>Hledat na GitHubu</span>
          </button>
          <button class="menu-item" data-action="deploy">
            <span class="menu-icon">🚀</span>
            <span>Deploy projekt</span>
          </button>
        </div>

        <div class="menu-footer">
          <small>💡 Pro základní akce použijte <strong>logo ⚡</strong> nebo <strong>Ctrl+K</strong></small>
        </div>
      </nav>
    `;
  }

  attachEventHandlers() {
    // Close button
    const closeBtn = this.menuElement.querySelector('#menuClose');
    closeBtn.addEventListener('click', () => this.hide());

    // Menu items
    const menuItems = this.menuElement.querySelectorAll('.menu-item');
    menuItems.forEach(item => {
      item.addEventListener('click', () => {
        const action = item.dataset.action;
        this.executeAction(action);
        this.hide();
      });
    });
  }

  executeAction(action) {
    console.log('Menu action:', action);

    // Direct implementations for menu actions
    switch (action) {
      case 'gridEditor':
        this.showGridEditor();
        break;

      case 'liveServer':
        this.showLiveServer();
        break;

      case 'gitignore':
        this.createGitignore();
        break;

      case 'replace':
        this.showReplaceDialog();
        break;

      case 'components':
        this.showComponents();
        break;

      case 'templates':
        this.showTemplates();
        break;

      case 'images':
        this.showImages();
        break;

      case 'exportZip':
        this.exportAsZip();
        break;

      case 'share':
        this.shareProject();
        break;

      case 'github-search':
        this.githubSearch();
        break;

      case 'deploy':
        this.deployProject();
        break;

      case 'aiSettings':
        eventBus.emit('aiSettings:show');
        break;

      case 'theme':
        this.toggleTheme();
        break;

      default:
        // Fallback to event bus for unimplemented actions
        const actionMap = {
          newFile: 'action:newTab',
          save: 'action:save',
          download: 'action:download',
          screenshot: 'action:screenshot',
          undo: 'action:undo',
          redo: 'action:redo',
          search: 'action:search',
          format: 'action:format',
          validate: 'action:validate',
          minify: 'action:minify'
        };

        const event = actionMap[action];
        if (event) {
          eventBus.emit(event);
        }
    }
  }

  // Implementation methods
  showGridEditor() {
    alert('CSS Grid/Flex Editor - Připravujeme pro vás! 🎨\n\nTato funkce umožní vizuální editaci CSS Grid a Flexbox layoutů.');
  }

  showLiveServer() {
    alert('Živý Server - Připravujeme! 🌐\n\nSpustí lokální server pro testování vaší stránky s live reload.');
  }

  createGitignore() {
    const gitignoreContent = `# Dependencies
node_modules/
bower_components/

# IDE
.vscode/
.idea/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db

# Build
dist/
build/
*.log

# Environment
.env
.env.local`;

    // Create new file with .gitignore content
    eventBus.emit('file:create', {
      name: '.gitignore',
      content: gitignoreContent
    });

    eventBus.emit('toast:show', {
      message: '✅ .gitignore soubor vytvořen',
      type: 'success'
    });
  }

  showReplaceDialog() {
    // Create modal for replace dialog
    const modal = document.createElement('div');
    modal.className = 'modal-backdrop';
    modal.innerHTML = `
      <div class="modal-content replace-dialog">
        <div class="modal-header">
          <h3>🔄 Nahradit v kódu</h3>
          <button class="modal-close" id="replaceClose">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label>Hledat:</label>
            <input type="text" id="replaceSearch" class="form-input" placeholder="Text k nahrazení..." autofocus>
          </div>
          <div class="form-group">
            <label>Nahradit za:</label>
            <input type="text" id="replaceWith" class="form-input" placeholder="Nový text...">
          </div>
          <div class="form-group checkbox-group">
            <label>
              <input type="checkbox" id="replaceCaseSensitive">
              <span>Rozlišovat velikost písmen</span>
            </label>
            <label>
              <input type="checkbox" id="replaceRegex">
              <span>Použít regulární výraz</span>
            </label>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" id="replaceCancelBtn">Zrušit</button>
          <button class="btn btn-primary" id="replaceBtn">🔄 Nahradit vše</button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    // Event handlers
    const searchInput = modal.querySelector('#replaceSearch');
    const replaceInput = modal.querySelector('#replaceWith');
    const caseSensitive = modal.querySelector('#replaceCaseSensitive');
    const regex = modal.querySelector('#replaceRegex');
    const replaceBtn = modal.querySelector('#replaceBtn');
    const cancelBtn = modal.querySelector('#replaceCancelBtn');
    const closeBtn = modal.querySelector('#replaceClose');

    const closeModal = () => {
      modal.remove();
    };

    const doReplace = () => {
      const search = searchInput.value;
      const replace = replaceInput.value;

      if (!search) {
        eventBus.emit('toast:show', {
          message: '⚠️ Zadejte text k vyhledání',
          type: 'warning'
        });
        return;
      }

      eventBus.emit('editor:replace', {
        search,
        replace,
        options: {
          caseSensitive: caseSensitive.checked,
          regex: regex.checked
        }
      });

      closeModal();
    };

    replaceBtn.addEventListener('click', doReplace);
    cancelBtn.addEventListener('click', closeModal);
    closeBtn.addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeModal();
    });

    // Enter key to replace
    searchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        if (e.shiftKey) {
          doReplace();
        } else {
          replaceInput.focus();
        }
      }
    });

    replaceInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') doReplace();
    });

    // ESC to close
    modal.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeModal();
    });
  }

  showComponents() {
    // Create modal for components library
    const modal = document.createElement('div');
    modal.className = 'modal-backdrop';
    modal.innerHTML = `
      <div class="modal-content components-panel">
        <div class="modal-header">
          <h3>🧩 Knihovna komponent</h3>
          <button class="modal-close" id="componentsClose">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>
        <div class="modal-body components-body">
          <div class="components-grid">
            <!-- Buttons -->
            <div class="component-card" data-component="button-primary">
              <div class="component-preview">
                <button style="padding: 10px 20px; background: #00d4aa; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 500;">Primary Button</button>
              </div>
              <div class="component-info">
                <h4>Primary Button</h4>
                <p>Základní tlačítko</p>
              </div>
            </div>

            <div class="component-card" data-component="button-secondary">
              <div class="component-preview">
                <button style="padding: 10px 20px; background: transparent; color: #00d4aa; border: 2px solid #00d4aa; border-radius: 6px; cursor: pointer; font-weight: 500;">Secondary Button</button>
              </div>
              <div class="component-info">
                <h4>Secondary Button</h4>
                <p>Sekundární tlačítko</p>
              </div>
            </div>

            <!-- Card -->
            <div class="component-card" data-component="card">
              <div class="component-preview">
                <div style="background: #1a1a1d; border: 1px solid #2a2a2d; border-radius: 8px; padding: 20px; max-width: 250px;">
                  <h3 style="margin: 0 0 10px 0; color: #e8e8ea;">Card Title</h3>
                  <p style="margin: 0; color: #8a8a8f; font-size: 14px;">Card description text goes here.</p>
                </div>
              </div>
              <div class="component-info">
                <h4>Card</h4>
                <p>Kontejner s rámečkem</p>
              </div>
            </div>

            <!-- Input -->
            <div class="component-card" data-component="input">
              <div class="component-preview">
                <input type="text" placeholder="Enter text..." style="padding: 10px 12px; background: #111113; border: 1px solid #2a2a2d; border-radius: 6px; color: #e8e8ea; width: 200px;">
              </div>
              <div class="component-info">
                <h4>Input Field</h4>
                <p>Textové pole</p>
              </div>
            </div>

            <!-- Alert -->
            <div class="component-card" data-component="alert">
              <div class="component-preview">
                <div style="background: rgba(81, 207, 102, 0.1); border-left: 4px solid #51cf66; padding: 12px 16px; border-radius: 6px; max-width: 250px;">
                  <p style="margin: 0; color: #51cf66; font-size: 14px;">✅ Success message</p>
                </div>
              </div>
              <div class="component-info">
                <h4>Alert Box</h4>
                <p>Oznamovací box</p>
              </div>
            </div>

            <!-- Navigation -->
            <div class="component-card" data-component="nav">
              <div class="component-preview">
                <nav style="background: #111113; padding: 12px 20px; border-radius: 6px; display: flex; gap: 20px; max-width: 250px;">
                  <a href="#" style="color: #00d4aa; text-decoration: none; font-weight: 500;">Home</a>
                  <a href="#" style="color: #8a8a8f; text-decoration: none;">About</a>
                  <a href="#" style="color: #8a8a8f; text-decoration: none;">Contact</a>
                </nav>
              </div>
              <div class="component-info">
                <h4>Navigation</h4>
                <p>Navigační menu</p>
              </div>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <small style="color: var(--text-muted);">Klikněte na komponentu pro vložení do editoru</small>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    // Component templates
    const components = {
      'button-primary': '<button class="btn-primary">Button</button>\n\n<style>\n.btn-primary {\n  padding: 10px 20px;\n  background: #00d4aa;\n  color: white;\n  border: none;\n  border-radius: 6px;\n  cursor: pointer;\n  font-weight: 500;\n  transition: background 0.2s;\n}\n.btn-primary:hover {\n  background: #00a88a;\n}\n</style>',

      'button-secondary': '<button class="btn-secondary">Button</button>\n\n<style>\n.btn-secondary {\n  padding: 10px 20px;\n  background: transparent;\n  color: #00d4aa;\n  border: 2px solid #00d4aa;\n  border-radius: 6px;\n  cursor: pointer;\n  font-weight: 500;\n  transition: all 0.2s;\n}\n.btn-secondary:hover {\n  background: #00d4aa;\n  color: white;\n}\n</style>',

      'card': '<div class="card">\n  <h3>Card Title</h3>\n  <p>Card description text goes here.</p>\n</div>\n\n<style>\n.card {\n  background: #1a1a1d;\n  border: 1px solid #2a2a2d;\n  border-radius: 8px;\n  padding: 20px;\n  max-width: 300px;\n}\n.card h3 {\n  margin: 0 0 10px 0;\n  color: #e8e8ea;\n}\n.card p {\n  margin: 0;\n  color: #8a8a8f;\n  font-size: 14px;\n}\n</style>',

      'input': '<input type="text" class="input-field" placeholder="Enter text...">\n\n<style>\n.input-field {\n  padding: 10px 12px;\n  background: #111113;\n  border: 1px solid #2a2a2d;\n  border-radius: 6px;\n  color: #e8e8ea;\n  font-size: 14px;\n  width: 100%;\n  transition: border-color 0.2s;\n}\n.input-field:focus {\n  outline: none;\n  border-color: #00d4aa;\n}\n</style>',

      'alert': '<div class="alert alert-success">\n  <p>✅ Success message</p>\n</div>\n\n<style>\n.alert {\n  padding: 12px 16px;\n  border-radius: 6px;\n  border-left: 4px solid;\n  margin: 10px 0;\n}\n.alert p {\n  margin: 0;\n  font-size: 14px;\n}\n.alert-success {\n  background: rgba(81, 207, 102, 0.1);\n  border-color: #51cf66;\n  color: #51cf66;\n}\n</style>',

      'nav': '<nav class="navbar">\n  <a href="#">Home</a>\n  <a href="#">About</a>\n  <a href="#">Contact</a>\n</nav>\n\n<style>\n.navbar {\n  background: #111113;\n  padding: 12px 20px;\n  border-radius: 6px;\n  display: flex;\n  gap: 20px;\n}\n.navbar a {\n  color: #8a8a8f;\n  text-decoration: none;\n  transition: color 0.2s;\n}\n.navbar a:hover {\n  color: #00d4aa;\n}\n</style>'
    };

    // Close handler
    const closeModal = () => modal.remove();

    modal.querySelector('#componentsClose').addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeModal();
    });

    // Component click handlers
    modal.querySelectorAll('.component-card').forEach(card => {
      card.addEventListener('click', () => {
        const componentId = card.dataset.component;
        const code = components[componentId];

        if (code) {
          eventBus.emit('editor:insertText', { text: '\n' + code + '\n' });
          eventBus.emit('toast:show', {
            message: '✅ Komponenta vložena',
            type: 'success',
            duration: 2000
          });
          closeModal();
        }
      });
    });
  }

  showTemplates() {
    alert('Šablony - Připravujeme! 📋\n\nHotové šablony stránek (landing page, portfolio, dashboard...)');
  }

  showImages() {
    alert('Obrázky - Připravujeme! 🖼️\n\nNástroj pro správu a optimalizaci obrázků v projektu.');
  }

  exportAsZip() {
    eventBus.emit('action:exportZip');
    eventBus.emit('toast:show', {
      message: '📦 Připravuji ZIP export...',
      type: 'info'
    });
  }

  shareProject() {
    const url = window.location.href;
    navigator.clipboard.writeText(url).then(() => {
      eventBus.emit('toast:show', {
        message: '🔗 Odkaz zkopírován do schránky',
        type: 'success'
      });
    }).catch(() => {
      prompt('Sdílet projekt - zkopírujte odkaz:', url);
    });
  }

  githubSearch() {
    const query = prompt('Hledat na GitHubu:');
    if (query && query.trim()) {
      try {
        const url = `https://github.com/search?q=${encodeURIComponent(query.trim())}&type=repositories`;
        const newWindow = window.open(url, '_blank', 'noopener,noreferrer');

        if (!newWindow || newWindow.closed || typeof newWindow.closed === 'undefined') {
          // Popup was blocked
          eventBus.emit('toast:show', {
            message: '⚠️ Povolete vyskakovací okna pro tuto stránku',
            type: 'warning'
          });
          // Fallback - open in same window
          window.location.href = url;
        } else {
          eventBus.emit('toast:show', {
            message: '🔍 Otevírám GitHub search...',
            type: 'success'
          });
        }
      } catch (error) {
        console.error('GitHub search error:', error);
        eventBus.emit('toast:show', {
          message: 'Chyba při otevírání GitHub',
          type: 'error'
        });
      }
    }
  }

  deployProject() {
    alert('Deploy projekt - Připravujeme! 🚀\n\nAutomatický deploy na GitHub Pages, Netlify nebo Vercel.');
  }

  toggleTheme() {
    document.body.classList.toggle('light-theme');
    const isLight = document.body.classList.contains('light-theme');
    localStorage.setItem('theme', isLight ? 'light' : 'dark');

    eventBus.emit('toast:show', {
      message: `${isLight ? '☀️' : '🌙'} Téma změněno`,
      type: 'success'
    });
  }

  updateOpenFilesList() {
    const filesContainer = this.menuElement?.querySelector('#openFilesManager');
    if (!filesContainer) return;

    const openFiles = this.getOpenFiles();

    if (openFiles.length === 0) {
      filesContainer.innerHTML = '<div class="no-files-message">Žádné otevřené soubory</div>';
      return;
    }

    filesContainer.innerHTML = openFiles.map((file, index) => `
      <div class="open-file-item" data-index="${index}">
        <span class="file-icon">📄</span>
        <span class="file-name">${file.name}</span>
        <button class="file-close-btn" data-index="${index}" title="Zavřít">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M18 6L6 18M6 6l12 12"/>
          </svg>
        </button>
      </div>
    `).join('');

    // Attach event handlers for file items
    filesContainer.querySelectorAll('.open-file-item').forEach(item => {
      item.addEventListener('click', (e) => {
        if (!e.target.closest('.file-close-btn')) {
          const index = parseInt(item.dataset.index);
          eventBus.emit('file:switch', { index });
          this.hide();
        }
      });
    });

    // Attach event handlers for close buttons
    filesContainer.querySelectorAll('.file-close-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const index = parseInt(btn.dataset.index);
        eventBus.emit('file:close', { index });
      });
    });
  }

  getOpenFiles() {
    // This would normally come from state or tabs manager
    // For now, return a simple list
    const tabs = document.querySelectorAll('.tab');
    return Array.from(tabs).map((tab, index) => ({
      name: tab.textContent.trim() || `Soubor ${index + 1}`,
      index: index
    }));
  }
}
