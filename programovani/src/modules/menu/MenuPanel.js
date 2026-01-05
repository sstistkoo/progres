/**
 * Menu Panel Module
 * Main navigation menu
 */

import { eventBus } from '../../core/events.js';
import { AITester } from '../ai/AITester.js';
import { Modal } from '../../ui/components/Modal.js';

export class MenuPanel {
  constructor() {
    this.menuElement = null;
    this.isOpen = false;
    this.aiTester = new AITester();
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
          <button class="menu-item" data-action="ai-component">
            <span class="menu-icon">🤖</span>
            <span>AI Generátor komponent</span>
          </button>
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

        <div class="menu-section">
          <h3>🔧 Vývojářské nástroje</h3>
          <button class="menu-item" data-action="devtools">
            <span class="menu-icon">🐞</span>
            <span>Otevřít DevTools</span>
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

      case 'ai-component':
        this.showAIComponentGenerator();
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

      case 'devtools':
        this.openDevTools();
        break;

      case 'aiSettings':
        this.showAISettings();
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
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
      <div class="modal-container" style="max-width: 900px;">
        <div class="modal-header">
          <h2>📐 CSS Grid/Flex Editor</h2>
          <button class="modal-close" id="gridEditorClose">&times;</button>
        </div>
        <div class="modal-body" style="max-height: 70vh; overflow-y: auto;">
          <!-- Layout Type Selection -->
          <div class="form-group" style="margin-bottom: 20px;">
            <label style="display: block; margin-bottom: 10px; font-weight: bold;">Typ layoutu:</label>
            <div style="display: flex; gap: 10px;">
              <button id="gridTypeBtn" class="layout-type-btn active" style="flex: 1; padding: 12px; border: 2px solid var(--primary-color); border-radius: 8px; background: var(--primary-color); color: white; cursor: pointer; font-weight: bold;">
                CSS Grid
              </button>
              <button id="flexTypeBtn" class="layout-type-btn" style="flex: 1; padding: 12px; border: 2px solid var(--border-color); border-radius: 8px; background: transparent; color: var(--text-color); cursor: pointer;">
                Flexbox
              </button>
            </div>
          </div>

          <!-- Grid Settings -->
          <div id="gridSettings" class="layout-settings">
            <div class="form-group">
              <label>Sloupce (columns):</label>
              <input type="number" id="gridColumns" min="1" max="12" value="3" style="width: 100%; padding: 8px; border: 1px solid var(--border-color); border-radius: 4px; background: var(--bg-secondary); color: var(--text-color);">
            </div>
            <div class="form-group">
              <label>Řádky (rows):</label>
              <input type="number" id="gridRows" min="1" max="12" value="3" style="width: 100%; padding: 8px; border: 1px solid var(--border-color); border-radius: 4px; background: var(--bg-secondary); color: var(--text-color);">
            </div>
            <div class="form-group">
              <label>Mezera (gap):</label>
              <input type="text" id="gridGap" value="20px" placeholder="např. 20px nebo 1rem" style="width: 100%; padding: 8px; border: 1px solid var(--border-color); border-radius: 4px; background: var(--bg-secondary); color: var(--text-color);">
            </div>
            <div class="form-group">
              <label>Auto-flow:</label>
              <select id="gridAutoFlow" style="width: 100%; padding: 8px; border: 1px solid var(--border-color); border-radius: 4px; background: var(--bg-secondary); color: var(--text-color);">
                <option value="row">Row (řádky)</option>
                <option value="column">Column (sloupce)</option>
                <option value="dense">Dense (husté)</option>
              </select>
            </div>
            <div class="form-group">
              <label>Zarovnání obsahu:</label>
              <select id="gridAlign" style="width: 100%; padding: 8px; border: 1px solid var(--border-color); border-radius: 4px; background: var(--bg-secondary); color: var(--text-color);">
                <option value="start">Start</option>
                <option value="center">Center</option>
                <option value="end">End</option>
                <option value="stretch">Stretch</option>
              </select>
            </div>
          </div>

          <!-- Flexbox Settings -->
          <div id="flexSettings" class="layout-settings" style="display: none;">
            <div class="form-group">
              <label>Směr (direction):</label>
              <select id="flexDirection" style="width: 100%; padding: 8px; border: 1px solid var(--border-color); border-radius: 4px; background: var(--bg-secondary); color: var(--text-color);">
                <option value="row">Row (vodorovně)</option>
                <option value="row-reverse">Row Reverse</option>
                <option value="column">Column (svisle)</option>
                <option value="column-reverse">Column Reverse</option>
              </select>
            </div>
            <div class="form-group">
              <label>Zarovnání hlavní osy (justify-content):</label>
              <select id="flexJustify" style="width: 100%; padding: 8px; border: 1px solid var(--border-color); border-radius: 4px; background: var(--bg-secondary); color: var(--text-color);">
                <option value="flex-start">Flex Start</option>
                <option value="flex-end">Flex End</option>
                <option value="center">Center</option>
                <option value="space-between">Space Between</option>
                <option value="space-around">Space Around</option>
                <option value="space-evenly">Space Evenly</option>
              </select>
            </div>
            <div class="form-group">
              <label>Zarovnání příčné osy (align-items):</label>
              <select id="flexAlign" style="width: 100%; padding: 8px; border: 1px solid var(--border-color); border-radius: 4px; background: var(--bg-secondary); color: var(--text-color);">
                <option value="stretch">Stretch</option>
                <option value="flex-start">Flex Start</option>
                <option value="flex-end">Flex End</option>
                <option value="center">Center</option>
                <option value="baseline">Baseline</option>
              </select>
            </div>
            <div class="form-group">
              <label>Zalámání (wrap):</label>
              <select id="flexWrap" style="width: 100%; padding: 8px; border: 1px solid var(--border-color); border-radius: 4px; background: var(--bg-secondary); color: var(--text-color);">
                <option value="nowrap">No Wrap</option>
                <option value="wrap">Wrap</option>
                <option value="wrap-reverse">Wrap Reverse</option>
              </select>
            </div>
            <div class="form-group">
              <label>Mezera (gap):</label>
              <input type="text" id="flexGap" value="20px" placeholder="např. 20px nebo 1rem" style="width: 100%; padding: 8px; border: 1px solid var(--border-color); border-radius: 4px; background: var(--bg-secondary); color: var(--text-color);">
            </div>
          </div>

          <!-- Preview -->
          <div style="margin-top: 20px;">
            <label style="display: block; margin-bottom: 10px; font-weight: bold;">Náhled:</label>
            <div id="layoutPreview" style="border: 2px dashed var(--border-color); border-radius: 8px; padding: 20px; min-height: 200px; background: var(--bg-secondary);">
              <!-- Preview will be rendered here -->
            </div>
          </div>

          <!-- Generated CSS -->
          <div style="margin-top: 20px;">
            <label style="display: block; margin-bottom: 10px; font-weight: bold;">Vygenerovaný CSS kód:</label>
            <textarea id="generatedCSS" readonly style="width: 100%; height: 150px; padding: 10px; border: 1px solid var(--border-color); border-radius: 4px; background: var(--bg-secondary); color: var(--text-color); font-family: 'Courier New', monospace; font-size: 13px;"></textarea>
          </div>
        </div>
        <div class="modal-footer">
          <button id="insertLayoutBtn" class="btn-primary" style="padding: 10px 20px; background: var(--primary-color); color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: bold;">
            ✅ Vložit do editoru
          </button>
          <button id="copyLayoutBtn" class="btn-secondary" style="padding: 10px 20px; background: var(--bg-secondary); color: var(--text-color); border: 1px solid var(--border-color); border-radius: 4px; cursor: pointer; margin-left: 10px;">
            📋 Kopírovat CSS
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    // State
    let currentType = 'grid';

    // Elements
    const gridTypeBtn = modal.querySelector('#gridTypeBtn');
    const flexTypeBtn = modal.querySelector('#flexTypeBtn');
    const gridSettings = modal.querySelector('#gridSettings');
    const flexSettings = modal.querySelector('#flexSettings');
    const preview = modal.querySelector('#layoutPreview');
    const cssOutput = modal.querySelector('#generatedCSS');

    // Type switching
    const switchType = (type) => {
      currentType = type;
      if (type === 'grid') {
        gridTypeBtn.classList.add('active');
        gridTypeBtn.style.background = 'var(--primary-color)';
        gridTypeBtn.style.color = 'white';
        flexTypeBtn.classList.remove('active');
        flexTypeBtn.style.background = 'transparent';
        flexTypeBtn.style.color = 'var(--text-color)';
        gridSettings.style.display = 'block';
        flexSettings.style.display = 'none';
      } else {
        flexTypeBtn.classList.add('active');
        flexTypeBtn.style.background = 'var(--primary-color)';
        flexTypeBtn.style.color = 'white';
        gridTypeBtn.classList.remove('active');
        gridTypeBtn.style.background = 'transparent';
        gridTypeBtn.style.color = 'var(--text-color)';
        flexSettings.style.display = 'block';
        gridSettings.style.display = 'none';
      }
      updatePreview();
    };

    gridTypeBtn.addEventListener('click', () => switchType('grid'));
    flexTypeBtn.addEventListener('click', () => switchType('flex'));

    // Update preview and CSS
    const updatePreview = () => {
      if (currentType === 'grid') {
        const columns = modal.querySelector('#gridColumns').value;
        const rows = modal.querySelector('#gridRows').value;
        const gap = modal.querySelector('#gridGap').value;
        const autoFlow = modal.querySelector('#gridAutoFlow').value;
        const align = modal.querySelector('#gridAlign').value;

        // Generate preview
        const itemCount = parseInt(columns) * parseInt(rows);
        preview.style.display = 'grid';
        preview.style.gridTemplateColumns = `repeat(${columns}, 1fr)`;
        preview.style.gridTemplateRows = `repeat(${rows}, 1fr)`;
        preview.style.gap = gap;
        preview.style.gridAutoFlow = autoFlow;
        preview.style.alignItems = align;
        preview.style.justifyItems = align;

        preview.innerHTML = Array.from({ length: itemCount }, (_, i) =>
          `<div style="background: var(--primary-color); opacity: 0.7; padding: 20px; border-radius: 4px; text-align: center; color: white; font-weight: bold;">${i + 1}</div>`
        ).join('');

        // Generate CSS
        cssOutput.value = `.container {
  display: grid;
  grid-template-columns: repeat(${columns}, 1fr);
  grid-template-rows: repeat(${rows}, 1fr);
  gap: ${gap};
  grid-auto-flow: ${autoFlow};
  align-items: ${align};
  justify-items: ${align};
}

.container > * {
  /* Položka */
}`;

      } else {
        const direction = modal.querySelector('#flexDirection').value;
        const justify = modal.querySelector('#flexJustify').value;
        const align = modal.querySelector('#flexAlign').value;
        const wrap = modal.querySelector('#flexWrap').value;
        const gap = modal.querySelector('#flexGap').value;

        // Generate preview
        preview.style.display = 'flex';
        preview.style.flexDirection = direction;
        preview.style.justifyContent = justify;
        preview.style.alignItems = align;
        preview.style.flexWrap = wrap;
        preview.style.gap = gap;

        preview.innerHTML = Array.from({ length: 6 }, (_, i) =>
          `<div style="background: var(--primary-color); opacity: 0.7; padding: 20px; border-radius: 4px; text-align: center; color: white; font-weight: bold; min-width: 80px;">${i + 1}</div>`
        ).join('');

        // Generate CSS
        cssOutput.value = `.container {
  display: flex;
  flex-direction: ${direction};
  justify-content: ${justify};
  align-items: ${align};
  flex-wrap: ${wrap};
  gap: ${gap};
}

.container > * {
  /* Položka */
}`;
      }
    };

    // Add event listeners to all inputs
    modal.querySelectorAll('input, select').forEach(input => {
      input.addEventListener('input', updatePreview);
      input.addEventListener('change', updatePreview);
    });

    // Initial preview
    updatePreview();

    // Insert button
    modal.querySelector('#insertLayoutBtn').addEventListener('click', () => {
      const css = cssOutput.value;
      const html = currentType === 'grid'
        ? `<div class="container">\n  <div>Položka 1</div>\n  <div>Položka 2</div>\n  <div>Položka 3</div>\n  <!-- Přidejte více položek -->\n</div>`
        : `<div class="container">\n  <div>Položka 1</div>\n  <div>Položka 2</div>\n  <div>Položka 3</div>\n  <!-- Přidejte více položek -->\n</div>`;

      const code = `<!-- ${currentType === 'grid' ? 'CSS Grid' : 'Flexbox'} Layout -->\n<style>\n${css}\n</style>\n\n${html}`;

      eventBus.emit('editor:insertText', { text: code });
      eventBus.emit('toast:show', {
        message: '✅ Layout vložen do editoru',
        type: 'success',
        duration: 2000
      });
      modal.remove();
    });

    // Copy button
    modal.querySelector('#copyLayoutBtn').addEventListener('click', () => {
      const css = cssOutput.value;
      navigator.clipboard.writeText(css).then(() => {
        eventBus.emit('toast:show', {
          message: '📋 CSS zkopírováno',
          type: 'success',
          duration: 1500
        });
      });
    });

    // Close button
    modal.querySelector('#gridEditorClose').addEventListener('click', () => {
      modal.remove();
    });

    // Close on backdrop click
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.remove();
      }
    });
  }

  showLiveServer() {
    // Toggle auto-refresh for preview
    const currentState = localStorage.getItem('liveServer') === 'true';
    const newState = !currentState;

    localStorage.setItem('liveServer', newState);

    if (newState) {
      eventBus.emit('toast:show', {
        message: '✅ Živý server zapnut - preview se aktualizuje automaticky',
        type: 'success',
        duration: 3000
      });

      // Enable auto-refresh on editor change
      eventBus.emit('liveServer:enable');
    } else {
      eventBus.emit('toast:show', {
        message: '🚫 Živý server vypnut',
        type: 'info',
        duration: 3000
      });

      eventBus.emit('liveServer:disable');
    }
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
                <button style="padding: 10px 20px; background: var(--accent); color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 500;">Hlavní tlačítko</button>
              </div>
              <div class="component-info">
                <h4>Primary Button</h4>
                <p>Základní tlačítko</p>
              </div>
            </div>

            <div class="component-card" data-component="button-secondary">
              <div class="component-preview">
                <button style="padding: 10px 20px; background: transparent; color: var(--accent); border: 2px solid var(--accent); border-radius: 6px; cursor: pointer; font-weight: 500;">Sekundární tlačítko</button>
              </div>
              <div class="component-info">
                <h4>Secondary Button</h4>
                <p>Sekundární tlačítko</p>
              </div>
            </div>

            <!-- Card -->
            <div class="component-card" data-component="card">
              <div class="component-preview">
                <div style="background: var(--bg-tertiary); border: 1px solid var(--border); border-radius: 8px; padding: 20px; max-width: 250px;">
                  <h3 style="margin: 0 0 10px 0; color: var(--text-primary);">Titulek karty</h3>
                  <p style="margin: 0; color: var(--text-secondary); font-size: 14px;">Popis obsahu karty zde.</p>
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
                <input type="text" placeholder="Zadejte text..." style="padding: 10px 12px; background: var(--bg-secondary); border: 1px solid var(--border); border-radius: 6px; color: var(--text-primary); width: 200px;">
              </div>
              <div class="component-info">
                <h4>Textové pole</h4>
                <p>Input pro text</p>
              </div>
            </div>

            <!-- Alert -->
            <div class="component-card" data-component="alert">
              <div class="component-preview">
                <div style="background: rgba(81, 207, 102, 0.1); border-left: 4px solid var(--success); padding: 12px 16px; border-radius: 6px; max-width: 250px;">
                  <p style="margin: 0; color: var(--success); font-size: 14px;">✅ Úspěšná zpráva</p>
                </div>
              </div>
              <div class="component-info">
                <h4>Oznamovací box</h4>
                <p>Alert box</p>
              </div>
            </div>

            <!-- Navigation -->
            <div class="component-card" data-component="nav">
              <div class="component-preview">
                <nav style="background: var(--bg-secondary); padding: 12px 20px; border-radius: 6px; display: flex; gap: 20px; max-width: 250px;">
                  <a href="#" style="color: var(--accent); text-decoration: none; font-weight: 500;">Domov</a>
                  <a href="#" style="color: var(--text-secondary); text-decoration: none;">O nás</a>
                  <a href="#" style="color: var(--text-secondary); text-decoration: none;">Kontakt</a>
                </nav>
              </div>
              <div class="component-info">
                <h4>Navigace</h4>
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
      'button-primary': '<button class="btn-primary">Tlačítko</button>\n\n<style>\n.btn-primary {\n  padding: 10px 20px;\n  background: var(--accent);\n  color: white;\n  border: none;\n  border-radius: 6px;\n  cursor: pointer;\n  font-weight: 500;\n  transition: background 0.2s;\n}\n.btn-primary:hover {\n  background: var(--accent-dim);\n}\n</style>',

      'button-secondary': '<button class="btn-secondary">Tlačítko</button>\n\n<style>\n.btn-secondary {\n  padding: 10px 20px;\n  background: transparent;\n  color: var(--accent);\n  border: 2px solid var(--accent);\n  border-radius: 6px;\n  cursor: pointer;\n  font-weight: 500;\n  transition: all 0.2s;\n}\n.btn-secondary:hover {\n  background: var(--accent);\n  color: white;\n}\n</style>',

      'card': '<div class="card">\n  <h3>Titulek karty</h3>\n  <p>Popis obsahu karty zde.</p>\n</div>\n\n<style>\n.card {\n  background: var(--bg-tertiary);\n  border: 1px solid var(--border);\n  border-radius: 8px;\n  padding: 20px;\n  max-width: 300px;\n}\n.card h3 {\n  margin: 0 0 10px 0;\n  color: var(--text-primary);\n}\n.card p {\n  margin: 0;\n  color: var(--text-secondary);\n  font-size: 14px;\n}\n</style>',

      'input': '<input type="text" class="input-field" placeholder="Zadejte text...">\n\n<style>\n.input-field {\n  padding: 10px 12px;\n  background: var(--bg-secondary);\n  border: 1px solid var(--border);\n  border-radius: 6px;\n  color: var(--text-primary);\n  font-size: 14px;\n  width: 100%;\n  transition: border-color 0.2s;\n}\n.input-field:focus {\n  outline: none;\n  border-color: var(--accent);\n}\n</style>',

      'alert': '<div class="alert alert-success">\n  <p>✅ Úspěšná zpráva</p>\n</div>\n\n<style>\n.alert {\n  padding: 12px 16px;\n  border-radius: 6px;\n  border-left: 4px solid;\n  margin: 10px 0;\n}\n.alert p {\n  margin: 0;\n  font-size: 14px;\n}\n.alert-success {\n  background: rgba(81, 207, 102, 0.1);\n  border-color: var(--success);\n  color: var(--success);\n}\n</style>',

      'nav': '<nav class="navbar">\n  <a href="#">Domov</a>\n  <a href="#">O nás</a>\n  <a href="#">Kontakt</a>\n</nav>\n\n<style>\n.navbar {\n  background: var(--bg-secondary);\n  padding: 12px 20px;\n  border-radius: 6px;\n  display: flex;\n  gap: 20px;\n}\n.navbar a {\n  color: var(--text-secondary);\n  text-decoration: none;\n  transition: color 0.2s;\n}\n.navbar a:hover {\n  color: var(--accent);\n}\n</style>'
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

        console.log('Component clicked:', componentId);
        console.log('Code to insert:', code);

        if (code) {
          console.log('Emitting editor:insertText event');
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

  showAIComponentGenerator() {
    // Create modal for AI component generator
    const modal = document.createElement('div');
    modal.className = 'modal-backdrop';
    modal.innerHTML = `
      <div class="modal-content ai-generator-panel">
        <div class="modal-header">
          <h3>🤖 AI Generátor komponent</h3>
          <button class="modal-close" id="aiGenClose">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>
        <div class="modal-body">
          <div class="ai-generator-content">
            <div class="ai-gen-description">
              <p>Popište komponentu, kterou chcete vytvořit. AI vygeneruje HTML kód podle vašich požadavků.</p>
            </div>

            <div class="ai-gen-examples">
              <strong>Příklady požadavků:</strong>
              <div class="ai-gen-example-chips">
                <button class="example-chip" data-example="Vytvoř moderní kontaktní formulář s poli pro jméno, email, telefon a zprávu. Použij modrou barvu pro tlačítka.">📧 Kontaktní formulář</button>
                <button class="example-chip" data-example="Vytvoř responzivní galerii obrázků 3x3 s hover efektem a možností lightbox zobrazení.">🖼️ Galerie obrázků</button>
                <button class="example-chip" data-example="Vytvoř kartičku produktu s obrázkem, názvem, cenou a tlačítkem koupit. Použij moderní design s stíny.">🛒 Karta produktu</button>
                <button class="example-chip" data-example="Vytvoř tabulku s třemi sloupci (název, cena, množství) a možností řazení. Použij tmavý režim.">📊 Datová tabulka</button>
                <button class="example-chip" data-example="Vytvoř responzivní navigační menu s logem vlevo a odkazy vpravo. Pro mobilní zařízení přidej hamburger menu.">🧭 Navigační menu</button>
                <button class="example-chip" data-example="Vytvoř sekci s referencemi/testimonials - 3 karty vedle sebe s citací, jménem a fotkou autora.">💬 Sekce s referencemi</button>
              </div>
            </div>

            <div class="ai-gen-input-group">
              <label for="aiGenPrompt">Váš požadavek:</label>
              <textarea
                id="aiGenPrompt"
                class="ai-gen-textarea"
                placeholder="Např: Vytvoř moderní kontaktní formulář s poli pro jméno, email, telefon a zprávu..."
                rows="4"
              ></textarea>
            </div>

            <div class="ai-gen-actions">
              <button id="aiGenSubmit" class="btn-primary" disabled>
                <span class="btn-text">🚀 Vygenerovat komponentu</span>
                <span class="btn-loader" style="display: none;">⏳ Generuji...</span>
              </button>
            </div>

            <div id="aiGenResult" class="ai-gen-result" style="display: none;">
              <div class="ai-gen-result-header">
                <strong>📋 Vygenerovaný kód:</strong>
                <button id="aiGenCopy" class="btn-copy">📋 Kopírovat</button>
              </div>
              <pre><code id="aiGenCode"></code></pre>
              <div class="ai-gen-result-actions">
                <button id="aiGenInsert" class="btn-primary">✅ Vložit do editoru</button>
                <button id="aiGenRefine" class="btn-secondary">🔄 Vylepšit</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    const textarea = modal.querySelector('#aiGenPrompt');
    const submitBtn = modal.querySelector('#aiGenSubmit');
    const resultDiv = modal.querySelector('#aiGenResult');
    const codeElement = modal.querySelector('#aiGenCode');
    let generatedCode = '';

    // Enable submit button when text is entered
    textarea.addEventListener('input', () => {
      submitBtn.disabled = textarea.value.trim().length === 0;
    });

    // Example chip click handlers
    modal.querySelectorAll('.example-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        const exampleText = chip.dataset.example;
        textarea.value = exampleText;
        submitBtn.disabled = false;
        textarea.focus();
      });
    });

    // Close handler
    const closeModal = () => modal.remove();
    modal.querySelector('#aiGenClose').addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeModal();
    });

    // Generate component with AI
    submitBtn.addEventListener('click', async () => {
      const userPrompt = textarea.value.trim();
      if (!userPrompt) return;

      // Show loading state
      submitBtn.disabled = true;
      submitBtn.querySelector('.btn-text').style.display = 'none';
      submitBtn.querySelector('.btn-loader').style.display = 'inline';
      resultDiv.style.display = 'none';

      try {
        // Check if AI is available
        if (!window.AI || typeof window.AI.ask !== 'function') {
          throw new Error('AI není k dispozici. Nastavte API klíče v Nastavení AI.');
        }

        // Construct system prompt for component generation
        const systemPrompt = `Jsi expert na tvorbu moderního HTML, CSS a JavaScript kódu.
Vytvoř komponentu podle požadavků uživatele. Komponenta musí být:
- Samostatná a kompletní (HTML + CSS + případně JS v jednom bloku)
- Moderní design s použitím CSS variables pro barvy
- Responzivní pro různé velikosti obrazovek
- Čistý a dobře strukturovaný kód s komentáři
- Použij CSS custom properties: --accent, --bg-primary, --bg-secondary, --bg-tertiary, --text-primary, --text-secondary, --border

DŮLEŽITÉ: Vrať POUZE kód bez jakéhokoliv dalšího textu, vysvětlení nebo markdown syntaxe. Bez \`\`\`html nebo jiných značek.`;

        const fullPrompt = `${systemPrompt}\n\nPožadavek uživatele: ${userPrompt}`;

        // Call AI
        console.log('Calling AI with prompt:', fullPrompt);
        const response = await window.AI.ask(fullPrompt);

        console.log('AI response:', response);

        // Clean up response - remove markdown code blocks if present
        generatedCode = response
          .replace(/```html\n?/g, '')
          .replace(/```css\n?/g, '')
          .replace(/```javascript\n?/g, '')
          .replace(/```js\n?/g, '')
          .replace(/```\n?/g, '')
          .trim();

        // Display result
        codeElement.textContent = generatedCode;
        resultDiv.style.display = 'block';

        eventBus.emit('toast:show', {
          message: '✅ Komponenta vygenerována',
          type: 'success',
          duration: 3000
        });

      } catch (error) {
        console.error('AI generation error:', error);
        eventBus.emit('toast:show', {
          message: `❌ Chyba při generování: ${error.message}`,
          type: 'error',
          duration: 5000
        });
      } finally {
        // Restore button state
        submitBtn.disabled = false;
        submitBtn.querySelector('.btn-text').style.display = 'inline';
        submitBtn.querySelector('.btn-loader').style.display = 'none';
      }
    });

    // Copy to clipboard
    modal.querySelector('#aiGenCopy').addEventListener('click', () => {
      navigator.clipboard.writeText(generatedCode).then(() => {
        eventBus.emit('toast:show', {
          message: '📋 Zkopírováno do schránky',
          type: 'success',
          duration: 2000
        });
      });
    });

    // Insert into editor
    modal.querySelector('#aiGenInsert').addEventListener('click', () => {
      if (generatedCode) {
        eventBus.emit('editor:insertText', { text: '\n' + generatedCode + '\n' });
        eventBus.emit('toast:show', {
          message: '✅ Kód vložen do editoru',
          type: 'success',
          duration: 2000
        });
        closeModal();
      }
    });

    // Refine/improve button
    modal.querySelector('#aiGenRefine').addEventListener('click', () => {
      textarea.value = `Vylepši tento kód:\n\n${generatedCode}\n\nUprav podle požadavku: `;
      resultDiv.style.display = 'none';
      textarea.focus();
      // Move cursor to end
      textarea.selectionStart = textarea.selectionEnd = textarea.value.length;
    });
  }

  showTemplates() {
    // Load custom templates from localStorage
    const customTemplates = JSON.parse(localStorage.getItem('customTemplates') || '{}');

    // Create modal for templates library
    const modal = document.createElement('div');
    modal.className = 'modal-backdrop';
    modal.innerHTML = `
      <div class="modal-content components-panel">
        <div class="modal-header">
          <h3>📋 Knihovna šablon</h3>
          <button class="modal-close" id="templatesClose">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>
        <div class="modal-body" style="padding: 30px;">
          <div style="margin-bottom: 20px; display: flex; justify-content: center;">
            <button id="createNewTemplate" style="padding: 12px 24px; background: var(--accent); color: white; border: none; border-radius: 8px; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 8px; transition: all 0.2s;">
              <span style="font-size: 18px;">➕</span> Vytvořit novou šablonu
            </button>
          </div>
          <div class="templates-list" style="display: grid; gap: 10px; max-width: 700px; margin: 0 auto;">
            ${Object.keys(customTemplates).length > 0 ? `
              <div style="margin: 20px 0 10px 0; padding: 10px; background: var(--accent); color: white; border-radius: 8px; text-align: center; font-weight: 600;">Moje šablony</div>
              ${Object.entries(customTemplates).map(([id, data]) => `
                <button class="template-btn" data-template="custom-${id}" data-custom="true" style="padding: 15px 20px; background: var(--bg-secondary); border: 1px solid var(--border-color); border-radius: 8px; cursor: pointer; text-align: left; display: flex; align-items: center; gap: 15px; transition: all 0.2s; position: relative;">
                  <span style="font-size: 24px;">${data.icon || '📄'}</span>
                  <div style="flex: 1;">
                    <div style="font-weight: 600; color: var(--text-primary);">${data.name}</div>
                    <div style="font-size: 13px; color: var(--text-secondary);">${data.description || 'Vlastní šablona'}</div>
                  </div>
                  <div style="display: flex; gap: 8px;">
                    <button class="edit-template-btn" data-template-id="${id}" style="padding: 8px 12px; background: var(--accent); color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 14px;" onclick="event.stopPropagation();">✏️</button>
                    <button class="delete-template-btn" data-template-id="${id}" style="padding: 8px 12px; background: #ef4444; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 14px;" onclick="event.stopPropagation();">🗑️</button>
                  </div>
                </button>
              `).join('')}
              <div style="margin: 20px 0 10px 0; padding: 10px; background: var(--bg-tertiary); border-radius: 8px; text-align: center; font-weight: 600; color: var(--text-primary);">Vestavěné šablony</div>
            ` : ''}
            <!-- Web Pages -->
            <button class="template-btn" data-template="blank" style="padding: 15px 20px; background: var(--bg-secondary); border: 1px solid var(--border-color); border-radius: 8px; cursor: pointer; text-align: left; display: flex; align-items: center; gap: 15px; transition: all 0.2s; position: relative;">
              <span style="font-size: 24px;">🎨</span>
              <div style="flex: 1;">
                <div style="font-weight: 600; color: var(--text-primary);">Prázdná stránka</div>
                <div style="font-size: 13px; color: var(--text-secondary);">Základní HTML struktura</div>
              </div>
              <button class="edit-builtin-btn" data-template="blank" style="padding: 8px 12px; background: var(--accent); color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 14px;" onclick="event.stopPropagation();">✏️</button>
            </button>

            <button class="template-btn" data-template="landing" style="padding: 15px 20px; background: var(--bg-secondary); border: 1px solid var(--border-color); border-radius: 8px; cursor: pointer; text-align: left; display: flex; align-items: center; gap: 15px; transition: all 0.2s; position: relative;">
              <span style="font-size: 24px;">🚀</span>
              <div style="flex: 1;">
                <div style="font-weight: 600; color: var(--text-primary);">Landing Page</div>
                <div style="font-size: 13px; color: var(--text-secondary);">Moderní přistávací stránka</div>
              </div>
              <button class="edit-builtin-btn" data-template="landing" style="padding: 8px 12px; background: var(--accent); color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 14px;" onclick="event.stopPropagation();">✏️</button>
            </button>

            <button class="template-btn" data-template="portfolio" style="padding: 15px 20px; background: var(--bg-secondary); border: 1px solid var(--border-color); border-radius: 8px; cursor: pointer; text-align: left; display: flex; align-items: center; gap: 15px; transition: all 0.2s; position: relative;">
              <span style="font-size: 24px;">💼</span>
              <div style="flex: 1;">
                <div style="font-weight: 600; color: var(--text-primary);">Portfolio</div>
                <div style="font-size: 13px; color: var(--text-secondary);">Osobní portfolio stránka</div>
              </div>
              <button class="edit-builtin-btn" data-template="portfolio" style="padding: 8px 12px; background: var(--accent); color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 14px;" onclick="event.stopPropagation();">✏️</button>
            </button>

            <button class="template-btn" data-template="blog" style="padding: 15px 20px; background: var(--bg-secondary); border: 1px solid var(--border-color); border-radius: 8px; cursor: pointer; text-align: left; display: flex; align-items: center; gap: 15px; transition: all 0.2s; position: relative;">
              <span style="font-size: 24px;">✍️</span>
              <div style="flex: 1;">
                <div style="font-weight: 600; color: var(--text-primary);">Blog</div>
                <div style="font-size: 13px; color: var(--text-secondary);">Blogovací stránka</div>
              </div>
              <button class="edit-builtin-btn" data-template="blog" style="padding: 8px 12px; background: var(--accent); color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 14px;" onclick="event.stopPropagation();">✏️</button>
            </button>

            <!-- CNC Templates -->
            <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid var(--border-color);">
              <h4 style="color: var(--text-secondary); font-size: 12px; text-transform: uppercase; margin-bottom: 10px; letter-spacing: 0.5px;">CNC Výroba</h4>
            </div>

            <button class="template-btn" data-template="cnc-landing" style="padding: 15px 20px; background: var(--bg-secondary); border: 1px solid var(--border-color); border-radius: 8px; cursor: pointer; text-align: left; display: flex; align-items: center; gap: 15px; transition: all 0.2s;">
              <span style="font-size: 24px;">⚙️</span>
              <div style="flex: 1;">
                <div style="font-weight: 600; color: var(--text-primary);">CNC Landing</div>
                <div style="font-size: 13px; color: var(--text-secondary);">Landing page pro CNC obrábění</div>
              </div>
              <button class="edit-builtin-btn" data-template="cnc-landing" style="padding: 8px 12px; background: var(--accent); color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 14px;" onclick="event.stopPropagation();">✏️</button>
            </button>

            <button class="template-btn" data-template="cnc-services" style="padding: 15px 20px; background: var(--bg-secondary); border: 1px solid var(--border-color); border-radius: 8px; cursor: pointer; text-align: left; display: flex; align-items: center; gap: 15px; transition: all 0.2s;">
              <span style="font-size: 24px;">🔧</span>
              <div style="flex: 1;">
                <div style="font-weight: 600; color: var(--text-primary);">CNC Služby</div>
                <div style="font-size: 13px; color: var(--text-secondary);">Přehled CNC služeb</div>
              </div>
              <button class="edit-builtin-btn" data-template="cnc-services" style="padding: 8px 12px; background: var(--accent); color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 14px;" onclick="event.stopPropagation();">✏️</button>
            </button>

            <button class="template-btn" data-template="cnc-contact" style="padding: 15px 20px; background: var(--bg-secondary); border: 1px solid var(--border-color); border-radius: 8px; cursor: pointer; text-align: left; display: flex; align-items: center; gap: 15px; transition: all 0.2s;">
              <span style="font-size: 24px;">📨</span>
              <div style="flex: 1;">
                <div style="font-weight: 600; color: var(--text-primary);">Kontakt + Poptávka</div>
                <div style="font-size: 13px; color: var(--text-secondary);">Kontaktní formulář</div>
              </div>
              <button class="edit-builtin-btn" data-template="cnc-contact" style="padding: 8px 12px; background: var(--accent); color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 14px;" onclick="event.stopPropagation();">✏️</button>
            </button>

            <button class="template-btn" data-template="cnc-gallery" style="padding: 15px 20px; background: var(--bg-secondary); border: 1px solid var(--border-color); border-radius: 8px; cursor: pointer; text-align: left; display: flex; align-items: center; gap: 15px; transition: all 0.2s;">
              <span style="font-size: 24px;">📸</span>
              <div style="flex: 1;">
                <div style="font-weight: 600; color: var(--text-primary);">Galerie výrobků</div>
                <div style="font-size: 13px; color: var(--text-secondary);">Portfolio CNC dílů</div>
              </div>
              <button class="edit-builtin-btn" data-template="cnc-gallery" style="padding: 8px 12px; background: var(--accent); color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 14px;" onclick="event.stopPropagation();">✏️</button>
            </button>

            <!-- Calculators -->
            <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid var(--border-color);">
              <h4 style="color: var(--text-secondary); font-size: 12px; text-transform: uppercase; margin-bottom: 10px; letter-spacing: 0.5px;">Kalkulačky</h4>
            </div>

            <button class="template-btn" data-template="calc-basic" style="padding: 15px 20px; background: var(--bg-secondary); border: 1px solid var(--border-color); border-radius: 8px; cursor: pointer; text-align: left; display: flex; align-items: center; gap: 15px; transition: all 0.2s;">
              <span style="font-size: 24px;">🔢</span>
              <div style="flex: 1;">
                <div style="font-weight: 600; color: var(--text-primary);">Základní kalkulačka</div>
                <div style="font-size: 13px; color: var(--text-secondary);">Jednoduchá kalkulačka (+, -, ×, ÷)</div>
              </div>
              <button class="edit-builtin-btn" data-template="calc-basic" style="padding: 8px 12px; background: var(--accent); color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 14px;" onclick="event.stopPropagation();">✏️</button>
            </button>

            <button class="template-btn" data-template="calc-price" style="padding: 15px 20px; background: var(--bg-secondary); border: 1px solid var(--border-color); border-radius: 8px; cursor: pointer; text-align: left; display: flex; align-items: center; gap: 15px; transition: all 0.2s;">
              <span style="font-size: 24px;">💰</span>
              <div style="flex: 1;">
                <div style="font-weight: 600; color: var(--text-primary);">Cenová kalkulačka</div>
                <div style="font-size: 13px; color: var(--text-secondary);">Výpočet ceny s DPH</div>
              </div>
              <button class="edit-builtin-btn" data-template="calc-price" style="padding: 8px 12px; background: var(--accent); color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 14px;" onclick="event.stopPropagation();">✏️</button>
            </button>

            <button class="template-btn" data-template="calc-bmi" style="padding: 15px 20px; background: var(--bg-secondary); border: 1px solid var(--border-color); border-radius: 8px; cursor: pointer; text-align: left; display: flex; align-items: center; gap: 15px; transition: all 0.2s;">
              <span style="font-size: 24px;">📊</span>
              <div style="flex: 1;">
                <div style="font-weight: 600; color: var(--text-primary);">BMI kalkulačka</div>
                <div style="font-size: 13px; color: var(--text-secondary);">Výpočet tělesného indexu</div>
              </div>
              <button class="edit-builtin-btn" data-template="calc-bmi" style="padding: 8px 12px; background: var(--accent); color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 14px;" onclick="event.stopPropagation();">✏️</button>
            </button>

            <button class="template-btn" data-template="calc-loan" style="padding: 15px 20px; background: var(--bg-secondary); border: 1px solid var(--border-color); border-radius: 8px; cursor: pointer; text-align: left; display: flex; align-items: center; gap: 15px; transition: all 0.2s;">
              <span style="font-size: 24px;">🏦</span>
              <div style="flex: 1;">
                <div style="font-weight: 600; color: var(--text-primary);">Kalkulačka úvěru</div>
                <div style="font-size: 13px; color: var(--text-secondary);">Výpočet měsíčních splátek</div>
              </div>
              <button class="edit-builtin-btn" data-template="calc-loan" style="padding: 8px 12px; background: var(--accent); color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 14px;" onclick="event.stopPropagation();">✏️</button>
            </button>

            <button class="template-btn" data-template="calc-tip" style="padding: 15px 20px; background: var(--bg-secondary); border: 1px solid var(--border-color); border-radius: 8px; cursor: pointer; text-align: left; display: flex; align-items: center; gap: 15px; transition: all 0.2s;">
              <span style="font-size: 24px;">🍽️</span>
              <div style="flex: 1;">
                <div style="font-weight: 600; color: var(--text-primary);">Kalkulačka spropitného</div>
                <div style="font-size: 13px; color: var(--text-secondary);">Rozdělení účtu</div>
              </div>
              <button class="edit-builtin-btn" data-template="calc-tip" style="padding: 8px 12px; background: var(--accent); color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 14px;" onclick="event.stopPropagation();">✏️</button>
            </button>
          </div>
        </div>
        <div class="modal-footer">
          <small style="color: var(--text-muted);">Klikněte na šablonu pro vložení</small>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    // Add hover styles
    const style = document.createElement('style');
    style.textContent = `
      .template-btn:hover {
        background: var(--bg-tertiary) !important;
        border-color: var(--accent) !important;
        transform: translateX(5px);
      }
    `;
    document.head.appendChild(style);

    // Template definitions
    const templates = {
      'blank': `<!DOCTYPE html>\n<html lang="cs">\n<head>\n  <meta charset="UTF-8">\n  <meta name="viewport" content="width=device-width, initial-scale=1.0">\n  <title>Nová stránka</title>\n  <style>\n    * {\n      margin: 0;\n      padding: 0;\n      box-sizing: border-box;\n    }\n    body {\n      font-family: system-ui, sans-serif;\n      line-height: 1.6;\n      padding: 20px;\n    }\n  </style>\n</head>\n<body>\n  <h1>Vaše nová stránka</h1>\n  <p>Začněte zde s tvůj projektem...</p>\n</body>\n</html>`,

      'landing': `<!DOCTYPE html>\n<html lang="cs">\n<head>\n  <meta charset="UTF-8">\n  <meta name="viewport" content="width=device-width, initial-scale=1.0">\n  <title>Awesome App - Přistávací stránka</title>\n  <style>\n    * { margin: 0; padding: 0; box-sizing: border-box; }\n    body {\n      font-family: system-ui, sans-serif;\n      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);\n      color: white;\n      min-height: 100vh;\n      display: flex;\n      align-items: center;\n      justify-content: center;\n      text-align: center;\n      padding: 20px;\n    }\n    .hero {\n      max-width: 800px;\n    }\n    h1 {\n      font-size: 3rem;\n      margin-bottom: 1rem;\n    }\n    p {\n      font-size: 1.25rem;\n      margin-bottom: 2rem;\n      opacity: 0.9;\n    }\n    .cta-button {\n      padding: 15px 40px;\n      background: white;\n      color: #667eea;\n      border: none;\n      border-radius: 50px;\n      font-size: 1.1rem;\n      font-weight: 600;\n      cursor: pointer;\n      transition: transform 0.2s;\n    }\n    .cta-button:hover {\n      transform: scale(1.05);\n    }\n  </style>\n</head>\n<body>\n  <div class="hero">\n    <h1>Awesome App</h1>\n    <p>Moderní řešení pro vaše potřeby. Jednoduché, rychlé a efektivní.</p>\n    <button class="cta-button">Začít nyní</button>\n  </div>\n</body>\n</html>`,

      'portfolio': `<!DOCTYPE html>\n<html lang="cs">\n<head>\n  <meta charset="UTF-8">\n  <meta name="viewport" content="width=device-width, initial-scale=1.0">\n  <title>Portfolio - Jméno</title>\n  <style>\n    * { margin: 0; padding: 0; box-sizing: border-box; }\n    body {\n      font-family: system-ui, sans-serif;\n      background: #0a0a0b;\n      color: #e8e8ea;\n      line-height: 1.6;\n    }\n    header {\n      padding: 60px 20px;\n      text-align: center;\n      border-bottom: 1px solid #2a2a2d;\n    }\n    h1 { font-size: 2.5rem; margin-bottom: 0.5rem; }\n    .tagline { color: #8a8a8f; font-size: 1.1rem; }\n    .projects {\n      max-width: 1200px;\n      margin: 0 auto;\n      padding: 60px 20px;\n      display: grid;\n      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));\n      gap: 30px;\n    }\n    .project-card {\n      background: #111113;\n      border: 1px solid #2a2a2d;\n      border-radius: 12px;\n      padding: 30px;\n      transition: transform 0.2s;\n    }\n    .project-card:hover {\n      transform: translateY(-5px);\n      border-color: #00d4aa;\n    }\n    .project-card h3 {\n      margin-bottom: 10px;\n      color: #00d4aa;\n    }\n  </style>\n</head>\n<body>\n  <header>\n    <h1>Vaše Jméno</h1>\n    <p class="tagline">Web Developer & Designer</p>\n  </header>\n  <div class="projects">\n    <div class="project-card">\n      <h3>Projekt 1</h3>\n      <p>Popis projektu a použitých technologií.</p>\n    </div>\n    <div class="project-card">\n      <h3>Projekt 2</h3>\n      <p>Popis projektu a použitých technologií.</p>\n    </div>\n    <div class="project-card">\n      <h3>Projekt 3</h3>\n      <p>Popis projektu a použitých technologií.</p>\n    </div>\n  </div>\n</body>\n</html>`,

      'blog': `<!DOCTYPE html>\n<html lang="cs">\n<head>\n  <meta charset="UTF-8">\n  <meta name="viewport" content="width=device-width, initial-scale=1.0">\n  <title>Můj Blog</title>\n  <style>\n    * { margin: 0; padding: 0; box-sizing: border-box; }\n    body {\n      font-family: Georgia, serif;\n      background: #f5f5f7;\n      color: #1a1a1d;\n      line-height: 1.8;\n    }\n    header {\n      background: white;\n      padding: 40px 20px;\n      text-align: center;\n      border-bottom: 1px solid #e0e0e0;\n    }\n    h1 { font-size: 2.5rem; margin-bottom: 0.5rem; }\n    .container {\n      max-width: 800px;\n      margin: 60px auto;\n      padding: 0 20px;\n    }\n    article {\n      background: white;\n      padding: 40px;\n      margin-bottom: 30px;\n      border-radius: 8px;\n      box-shadow: 0 2px 8px rgba(0,0,0,0.1);\n    }\n    article h2 {\n      margin-bottom: 10px;\n      color: #333;\n    }\n    .meta {\n      color: #666;\n      font-size: 0.9rem;\n      margin-bottom: 20px;\n    }\n  </style>\n</head>\n<body>\n  <header>\n    <h1>Můj Blog</h1>\n    <p>Myšlenky a nápady</p>\n  </header>\n  <div class="container">\n    <article>\n      <h2>Titulek prvního článku</h2>\n      <div class="meta">4. ledna 2026 • 5 min čtení</div>\n      <p>Obsah článku zde. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.</p>\n    </article>\n    <article>\n      <h2>Titulek druhého článku</h2>\n      <div class="meta">3. ledna 2026 • 3 min čtení</div>\n      <p>Obsah článku zde. Lorem ipsum dolor sit amet, consectetur adipiscing elit.</p>\n    </article>\n  </div>\n</body>\n</html>`,

      'cnc-landing': `<!DOCTYPE html>\n<html lang="cs">\n<head>\n  <meta charset="UTF-8">\n  <meta name="viewport" content="width=device-width, initial-scale=1.0">\n  <title>CNC Obrábění - Přesné díly na míru</title>\n  <style>\n    * { margin: 0; padding: 0; box-sizing: border-box; }\n    body {\n      font-family: 'Segoe UI', system-ui, sans-serif;\n      background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%);\n      color: white;\n      min-height: 100vh;\n    }\n    header {\n      padding: 20px;\n      background: rgba(0,0,0,0.2);\n    }\n    nav {\n      max-width: 1200px;\n      margin: 0 auto;\n      display: flex;\n      justify-content: space-between;\n      align-items: center;\n    }\n    .logo { font-size: 1.5rem; font-weight: 700; }\n    .nav-links { display: flex; gap: 30px; }\n    .nav-links a { color: white; text-decoration: none; transition: opacity 0.2s; }\n    .nav-links a:hover { opacity: 0.8; }\n    .hero {\n      max-width: 1200px;\n      margin: 0 auto;\n      padding: 100px 20px;\n      text-align: center;\n    }\n    h1 {\n      font-size: 3.5rem;\n      margin-bottom: 1.5rem;\n      line-height: 1.2;\n    }\n    .subtitle {\n      font-size: 1.5rem;\n      margin-bottom: 3rem;\n      opacity: 0.9;\n    }\n    .cta-buttons {\n      display: flex;\n      gap: 20px;\n      justify-content: center;\n      flex-wrap: wrap;\n    }\n    .btn {\n      padding: 15px 40px;\n      border: none;\n      border-radius: 8px;\n      font-size: 1.1rem;\n      font-weight: 600;\n      cursor: pointer;\n      transition: all 0.3s;\n      text-decoration: none;\n      display: inline-block;\n    }\n    .btn-primary {\n      background: white;\n      color: #1e3a8a;\n    }\n    .btn-primary:hover {\n      transform: translateY(-2px);\n      box-shadow: 0 10px 25px rgba(0,0,0,0.2);\n    }\n    .btn-secondary {\n      background: transparent;\n      color: white;\n      border: 2px solid white;\n    }\n    .btn-secondary:hover {\n      background: rgba(255,255,255,0.1);\n    }\n    .features {\n      max-width: 1200px;\n      margin: 0 auto;\n      padding: 80px 20px;\n      display: grid;\n      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));\n      gap: 40px;\n    }\n    .feature {\n      text-align: center;\n    }\n    .feature-icon {\n      font-size: 3rem;\n      margin-bottom: 1rem;\n    }\n    .feature h3 {\n      margin-bottom: 1rem;\n      font-size: 1.5rem;\n    }\n    .feature p {\n      opacity: 0.9;\n      line-height: 1.6;\n    }\n  </style>\n</head>\n<body>\n  <header>\n    <nav>\n      <div class="logo">⚙️ CNC Pro</div>\n      <div class="nav-links">\n        <a href="#sluzby">Služby</a>\n        <a href="#portfolio">Portfolio</a>\n        <a href="#kontakt">Kontakt</a>\n      </div>\n    </nav>\n  </header>\n  \n  <div class="hero">\n    <h1>Přesné CNC obrábění<br>na míru</h1>\n    <p class="subtitle">Kvalitní výroba dílů s maximální přesností</p>\n    <div class="cta-buttons">\n      <a href="#kontakt" class="btn btn-primary">Nezávazná poptávka</a>\n      <a href="#sluzby" class="btn btn-secondary">Naše služby</a>\n    </div>\n  </div>\n\n  <div class="features">\n    <div class="feature">\n      <div class="feature-icon">🎯</div>\n      <h3>Přesnost</h3>\n      <p>Tolerance až 0,01 mm pro dokonalou kvalitu každého dílu</p>\n    </div>\n    <div class="feature">\n      <div class="feature-icon">⚡</div>\n      <h3>Rychlost</h3>\n      <p>Moderní CNC stroje pro efektivní a rychlou výrobu</p>\n    </div>\n    <div class="feature">\n      <div class="feature-icon">✅</div>\n      <h3>Kvalita</h3>\n      <p>Certifikovaná výroba s kontrolou každého vyrobeného kusu</p>\n    </div>\n  </div>\n</body>\n</html>`,

      'cnc-services': `<!DOCTYPE html>\n<html lang="cs">\n<head>\n  <meta charset="UTF-8">\n  <meta name="viewport" content="width=device-width, initial-scale=1.0">\n  <title>CNC Služby - Frézování, Soustružení</title>\n  <style>\n    * { margin: 0; padding: 0; box-sizing: border-box; }\n    body {\n      font-family: 'Segoe UI', system-ui, sans-serif;\n      background: #f5f5f7;\n      color: #1a1a1d;\n      line-height: 1.6;\n    }\n    header {\n      background: #1e3a8a;\n      color: white;\n      padding: 60px 20px;\n      text-align: center;\n    }\n    h1 { font-size: 3rem; margin-bottom: 1rem; }\n    .container {\n      max-width: 1200px;\n      margin: 0 auto;\n      padding: 80px 20px;\n    }\n    .services-grid {\n      display: grid;\n      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));\n      gap: 40px;\n    }\n    .service-card {\n      background: white;\n      border-radius: 12px;\n      padding: 40px;\n      box-shadow: 0 4px 20px rgba(0,0,0,0.08);\n      transition: transform 0.3s, box-shadow 0.3s;\n    }\n    .service-card:hover {\n      transform: translateY(-5px);\n      box-shadow: 0 8px 30px rgba(0,0,0,0.12);\n    }\n    .service-icon {\n      font-size: 3rem;\n      margin-bottom: 1.5rem;\n    }\n    .service-card h3 {\n      color: #1e3a8a;\n      margin-bottom: 1rem;\n      font-size: 1.5rem;\n    }\n    .service-card ul {\n      margin: 1rem 0;\n      padding-left: 20px;\n    }\n    .service-card li {\n      margin-bottom: 0.5rem;\n      color: #4b5563;\n    }\n    .cta-section {\n      text-align: center;\n      margin-top: 80px;\n      padding: 60px 20px;\n      background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%);\n      border-radius: 20px;\n      color: white;\n    }\n    .cta-section h2 {\n      font-size: 2.5rem;\n      margin-bottom: 1rem;\n    }\n    .btn {\n      display: inline-block;\n      padding: 15px 40px;\n      background: white;\n      color: #1e3a8a;\n      text-decoration: none;\n      border-radius: 8px;\n      font-weight: 600;\n      font-size: 1.1rem;\n      transition: transform 0.3s;\n      margin-top: 2rem;\n    }\n    .btn:hover {\n      transform: scale(1.05);\n    }\n  </style>\n</head>\n<body>\n  <header>\n    <h1>🔧 Naše služby</h1>\n    <p>Komplexní CNC obrábění pro vaše projekty</p>\n  </header>\n\n  <div class="container">\n    <div class="services-grid">\n      <div class="service-card">\n        <div class="service-icon">⚙️</div>\n        <h3>CNC Frézování</h3>\n        <p>Přesné frézování složitých dílů z různých materiálů</p>\n        <ul>\n          <li>3, 4 a 5-osé frézování</li>\n          <li>Ocel, hliník, plast, bronz</li>\n          <li>Tolerance až 0,01 mm</li>\n          <li>Prototypy i sériová výroba</li>\n        </ul>\n      </div>\n\n      <div class="service-card">\n        <div class="service-icon">🔩</div>\n        <h3>CNC Soustružení</h3>\n        <p>Výroba rotačních dílů s maximální přesností</p>\n        <ul>\n          <li>Klasické i CNC soustružení</li>\n          <li>Průměry od 5 do 500 mm</li>\n          <li>Vnější i vnitřní závity</li>\n          <li>Čelní i podélné obrábění</li>\n        </ul>\n      </div>\n\n      <div class="service-card">\n        <div class="service-icon">✂️</div>\n        <h3>Řezání materiálu</h3>\n        <p>Přesné dělení materiálů dle požadavků</p>\n        <ul>\n          <li>Pásová pila</li>\n          <li>Kotoučová pila</li>\n          <li>Plazma řezání</li>\n          <li>Vodní paprsek</li>\n        </ul>\n      </div>\n\n      <div class="service-card">\n        <div class="service-icon">🎨</div>\n        <h3>Povrchové úpravy</h3>\n        <p>Finální úprava pro dokonalý vzhled</p>\n        <ul>\n          <li>Galvanické pokovení</li>\n          <li>Prášková lakování</li>\n          <li>Eloxování hliníku</li>\n          <li>Broušení a leštění</li>\n        </ul>\n      </div>\n\n      <div class="service-card">\n        <div class="service-icon">📐</div>\n        <h3>Konstrukční návrhy</h3>\n        <p>Pomoc s přípravou výkresů a 3D modelů</p>\n        <ul>\n          <li>3D CAD modelování</li>\n          <li>Optimalizace pro výrobu</li>\n          <li>Technické výkresy</li>\n          <li>Výpočty pevnosti</li>\n        </ul>\n      </div>\n\n      <div class="service-card">\n        <div class="service-icon">🔍</div>\n        <h3>Kontrola kvality</h3>\n        <p>Měření a kontrola každého vyrobeného dílu</p>\n        <ul>\n          <li>3D skener</li>\n          <li>CMM souřadnicový stroj</li>\n          <li>Mikrometr, posuvné měřítko</li>\n          <li>Certifikáty a protokoly</li>\n        </ul>\n      </div>\n    </div>\n\n    <div class="cta-section">\n      <h2>Potřebujete cenovou nabídku?</h2>\n      <p style="font-size: 1.2rem;">Zašlete nám výkres nebo 3D model a my vám připravíme nezávaznou nabídku</p>\n      <a href="#" class="btn">Poslat poptávku</a>\n    </div>\n  </div>\n</body>\n</html>`,

      'cnc-contact': `<!DOCTYPE html>\n<html lang="cs">\n<head>\n  <meta charset="UTF-8">\n  <meta name="viewport" content="width=device-width, initial-scale=1.0">\n  <title>Kontakt - CNC Obrábění</title>\n  <style>\n    * { margin: 0; padding: 0; box-sizing: border-box; }\n    body {\n      font-family: 'Segoe UI', system-ui, sans-serif;\n      background: #f5f5f7;\n      color: #1a1a1d;\n      line-height: 1.6;\n    }\n    .container {\n      max-width: 1200px;\n      margin: 0 auto;\n      padding: 80px 20px;\n    }\n    .header {\n      text-align: center;\n      margin-bottom: 60px;\n    }\n    .header h1 {\n      font-size: 3rem;\n      color: #1e3a8a;\n      margin-bottom: 1rem;\n    }\n    .content-grid {\n      display: grid;\n      grid-template-columns: 1fr 1.5fr;\n      gap: 60px;\n    }\n    .contact-info {\n      background: white;\n      padding: 40px;\n      border-radius: 12px;\n      box-shadow: 0 4px 20px rgba(0,0,0,0.08);\n    }\n    .contact-info h2 {\n      color: #1e3a8a;\n      margin-bottom: 2rem;\n    }\n    .info-item {\n      margin-bottom: 2rem;\n    }\n    .info-item h3 {\n      color: #3b82f6;\n      margin-bottom: 0.5rem;\n      font-size: 1.1rem;\n    }\n    .info-item p {\n      color: #4b5563;\n    }\n    .quote-form {\n      background: white;\n      padding: 40px;\n      border-radius: 12px;\n      box-shadow: 0 4px 20px rgba(0,0,0,0.08);\n    }\n    .quote-form h2 {\n      color: #1e3a8a;\n      margin-bottom: 1.5rem;\n    }\n    .form-group {\n      margin-bottom: 1.5rem;\n    }\n    .form-group label {\n      display: block;\n      margin-bottom: 0.5rem;\n      color: #374151;\n      font-weight: 500;\n    }\n    .form-group input,\n    .form-group textarea,\n    .form-group select {\n      width: 100%;\n      padding: 12px;\n      border: 1px solid #d1d5db;\n      border-radius: 8px;\n      font-size: 1rem;\n      font-family: inherit;\n      transition: border-color 0.2s;\n    }\n    .form-group input:focus,\n    .form-group textarea:focus,\n    .form-group select:focus {\n      outline: none;\n      border-color: #3b82f6;\n    }\n    .form-group textarea {\n      min-height: 120px;\n      resize: vertical;\n    }\n    .form-file {\n      border: 2px dashed #d1d5db;\n      padding: 30px;\n      text-align: center;\n      border-radius: 8px;\n      cursor: pointer;\n      transition: border-color 0.2s;\n    }\n    .form-file:hover {\n      border-color: #3b82f6;\n      background: #f9fafb;\n    }\n    .submit-btn {\n      width: 100%;\n      padding: 15px;\n      background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%);\n      color: white;\n      border: none;\n      border-radius: 8px;\n      font-size: 1.1rem;\n      font-weight: 600;\n      cursor: pointer;\n      transition: transform 0.2s;\n    }\n    .submit-btn:hover {\n      transform: translateY(-2px);\n    }\n    @media (max-width: 768px) {\n      .content-grid {\n        grid-template-columns: 1fr;\n      }\n    }\n  </style>\n</head>\n<body>\n  <div class="container">\n    <div class="header">\n      <h1>📨 Kontaktujte nás</h1>\n      <p style="font-size: 1.2rem; color: #4b5563;">Rádi zodpovíme vaše dotazy a připravíme cenovou nabídku</p>\n    </div>\n\n    <div class="content-grid">\n      <div class="contact-info">\n        <h2>Kontaktní údaje</h2>\n        \n        <div class="info-item">\n          <h3>📍 Adresa</h3>\n          <p>Průmyslová 123<br>123 45 Praha 4</p>\n        </div>\n\n        <div class="info-item">\n          <h3>📞 Telefon</h3>\n          <p>+420 123 456 789</p>\n        </div>\n\n        <div class="info-item">\n          <h3>📧 Email</h3>\n          <p>info@cnc-obrabeni.cz</p>\n        </div>\n\n        <div class="info-item">\n          <h3>⏰ Otevírací doba</h3>\n          <p>Po - Pá: 7:00 - 16:00<br>So - Ne: Zavřeno</p>\n        </div>\n\n        <div class="info-item">\n          <h3>💼 IČO / DIČ</h3>\n          <p>IČO: 12345678<br>DIČ: CZ12345678</p>\n        </div>\n      </div>\n\n      <div class="quote-form">\n        <h2>Poptávkový formulář</h2>\n        <form>\n          <div class="form-group">\n            <label for="name">Jméno a příjmení *</label>\n            <input type="text" id="name" required>\n          </div>\n\n          <div class="form-group">\n            <label for="email">Email *</label>\n            <input type="email" id="email" required>\n          </div>\n\n          <div class="form-group">\n            <label for="phone">Telefon</label>\n            <input type="tel" id="phone">\n          </div>\n\n          <div class="form-group">\n            <label for="company">Firma</label>\n            <input type="text" id="company">\n          </div>\n\n          <div class="form-group">\n            <label for="service">Požadovaná služba</label>\n            <select id="service">\n              <option>CNC Frézování</option>\n              <option>CNC Soustružení</option>\n              <option>Řezání materiálu</option>\n              <option>Povrchové úpravy</option>\n              <option>Jiná služba</option>\n            </select>\n          </div>\n\n          <div class="form-group">\n            <label for="message">Popis zakázky *</label>\n            <textarea id="message" placeholder="Uveďte počet kusů, materiál, rozměry..." required></textarea>\n          </div>\n\n          <div class="form-group">\n            <label>Příloha (výkres, 3D model)</label>\n            <div class="form-file">\n              <p>📎 Přetáhněte soubor nebo klikněte pro výběr</p>\n              <p style="font-size: 0.9rem; color: #6b7280; margin-top: 10px;">STEP, IGES, DWG, PDF (max 10 MB)</p>\n              <input type="file" style="display: none;">\n            </div>\n          </div>\n\n          <button type="submit" class="submit-btn">Odeslat poptávku</button>\n        </form>\n      </div>\n    </div>\n  </div>\n</body>\n</html>`,

      'cnc-gallery': `<!DOCTYPE html>\n<html lang="cs">\n<head>\n  <meta charset="UTF-8">\n  <meta name="viewport" content="width=device-width, initial-scale=1.0">\n  <title>Portfolio - Naše výrobky</title>\n  <style>\n    * { margin: 0; padding: 0; box-sizing: border-box; }\n    body {\n      font-family: 'Segoe UI', system-ui, sans-serif;\n      background: #0a0a0b;\n      color: #e8e8ea;\n      line-height: 1.6;\n    }\n    header {\n      padding: 80px 20px;\n      text-align: center;\n      background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%);\n    }\n    h1 {\n      font-size: 3rem;\n      margin-bottom: 1rem;\n    }\n    .tagline {\n      font-size: 1.2rem;\n      opacity: 0.9;\n    }\n    .container {\n      max-width: 1400px;\n      margin: 0 auto;\n      padding: 80px 20px;\n    }\n    .categories {\n      display: flex;\n      gap: 15px;\n      justify-content: center;\n      margin-bottom: 60px;\n      flex-wrap: wrap;\n    }\n    .category-btn {\n      padding: 12px 24px;\n      background: #1a1a1d;\n      border: 1px solid #2a2a2d;\n      border-radius: 8px;\n      color: #e8e8ea;\n      cursor: pointer;\n      transition: all 0.2s;\n    }\n    .category-btn:hover,\n    .category-btn.active {\n      background: #3b82f6;\n      border-color: #3b82f6;\n    }\n    .gallery {\n      display: grid;\n      grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));\n      gap: 30px;\n    }\n    .gallery-item {\n      background: #111113;\n      border: 1px solid #2a2a2d;\n      border-radius: 12px;\n      overflow: hidden;\n      transition: all 0.3s;\n      cursor: pointer;\n    }\n    .gallery-item:hover {\n      transform: translateY(-5px);\n      border-color: #3b82f6;\n      box-shadow: 0 10px 40px rgba(59, 130, 246, 0.3);\n    }\n    .image-container {\n      width: 100%;\n      height: 250px;\n      background: #1a1a1d;\n      display: flex;\n      align-items: center;\n      justify-content: center;\n      font-size: 4rem;\n      color: #3b82f6;\n    }\n    .item-info {\n      padding: 25px;\n    }\n    .item-info h3 {\n      color: #3b82f6;\n      margin-bottom: 0.5rem;\n      font-size: 1.3rem;\n    }\n    .item-info p {\n      color: #8a8a8f;\n      margin-bottom: 1rem;\n    }\n    .specs {\n      display: flex;\n      gap: 15px;\n      flex-wrap: wrap;\n    }\n    .spec-tag {\n      padding: 6px 12px;\n      background: #1a1a1d;\n      border: 1px solid #2a2a2d;\n      border-radius: 6px;\n      font-size: 0.85rem;\n      color: #b8b8bf;\n    }\n  </style>\n</head>\n<body>\n  <header>\n    <h1>📸 Portfolio výrobků</h1>\n    <p class="tagline">Ukázky našich realizovaných zakázek</p>\n  </header>\n\n  <div class="container">\n    <div class="categories">\n      <button class="category-btn active">Vše</button>\n      <button class="category-btn">Frézování</button>\n      <button class="category-btn">Soustružení</button>\n      <button class="category-btn">Složité díly</button>\n      <button class="category-btn">Prototypy</button>\n    </div>\n\n    <div class="gallery">\n      <div class="gallery-item">\n        <div class="image-container">⚙️</div>\n        <div class="item-info">\n          <h3>Příruba ložiska</h3>\n          <p>CNC frézovaná příruba pro průmyslové ložisko</p>\n          <div class="specs">\n            <span class="spec-tag">Hliník 7075</span>\n            <span class="spec-tag">5-osé frézování</span>\n            <span class="spec-tag">50 ks</span>\n          </div>\n        </div>\n      </div>\n\n      <div class="gallery-item">\n        <div class="image-container">🔩</div>\n        <div class="item-info">\n          <h3>Hřídel převodovky</h3>\n          <p>Precizně soustružená hřídel s drážkami</p>\n          <div class="specs">\n            <span class="spec-tag">Ocel 42CrMo4</span>\n            <span class="spec-tag">Kaleno</span>\n            <span class="spec-tag">200 ks</span>\n          </div>\n        </div>\n      </div>\n\n      <div class="gallery-item">\n        <div class="image-container">🎯</div>\n        <div class="item-info">\n          <h3>Těleso ventilu</h3>\n          <p>Složitý díl s vnitřními kanály</p>\n          <div class="specs">\n            <span class="spec-tag">Mosaz</span>\n            <span class="spec-tag">4-osé frézování</span>\n            <span class="spec-tag">Prototyp</span>\n          </div>\n        </div>\n      </div>\n\n      <div class="gallery-item">\n        <div class="image-container">✂️</div>\n        <div class="item-info">\n          <h3>Adaptér motoru</h3>\n          <p>Adaptérová deska s přesným vrtáním</p>\n          <div class="specs">\n            <span class="spec-tag">Hliník 6061</span>\n            <span class="spec-tag">Eloxováno</span>\n            <span class="spec-tag">30 ks</span>\n          </div>\n        </div>\n      </div>\n\n      <div class="gallery-item">\n        <div class="image-container">🔧</div>\n        <div class="item-info">\n          <h3>Ozubené kolo</h3>\n          <p>Ozubené kolo modulu 3 s 45 zuby</p>\n          <div class="specs">\n            <span class="spec-tag">Ocel C45</span>\n            <span class="spec-tag">Frézování</span>\n            <span class="spec-tag">100 ks</span>\n          </div>\n        </div>\n      </div>\n\n      <div class="gallery-item">\n        <div class="image-container">⚡</div>\n        <div class="item-info">\n          <h3>Kryt elektroniky</h3>\n          <p>Lehký kryt s chladícími žebry</p>\n          <div class="specs">\n            <span class="spec-tag">Hliník</span>\n            <span class="spec-tag">3-osé frézování</span>\n            <span class="spec-tag">Lakováno</span>\n          </div>\n        </div>\n      </div>\n    </div>\n  </div>\n</body>\n</html>`,

      'calc-basic': `<!DOCTYPE html>\n<html lang="cs">\n<head>\n  <meta charset="UTF-8">\n  <meta name="viewport" content="width=device-width, initial-scale=1.0">\n  <title>Kalkulačka</title>\n  <style>\n    * { margin: 0; padding: 0; box-sizing: border-box; }\n    body {\n      font-family: system-ui, sans-serif;\n      background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);\n      min-height: 100vh;\n      display: flex;\n      align-items: center;\n      justify-content: center;\n      padding: 20px;\n    }\n    .calculator {\n      background: white;\n      border-radius: 20px;\n      box-shadow: 0 20px 60px rgba(0,0,0,0.3);\n      padding: 30px;\n      max-width: 400px;\n      width: 100%;\n    }\n    .display {\n      background: #f3f4f6;\n      border: 2px solid #e5e7eb;\n      border-radius: 10px;\n      padding: 20px;\n      margin-bottom: 20px;\n      text-align: right;\n      font-size: 2.5rem;\n      font-weight: 600;\n      color: #1f2937;\n      min-height: 80px;\n      word-break: break-all;\n    }\n    .buttons {\n      display: grid;\n      grid-template-columns: repeat(4, 1fr);\n      gap: 10px;\n    }\n    button {\n      padding: 20px;\n      border: none;\n      border-radius: 10px;\n      font-size: 1.5rem;\n      font-weight: 600;\n      cursor: pointer;\n      transition: all 0.2s;\n    }\n    .num, .decimal {\n      background: #f3f4f6;\n      color: #1f2937;\n    }\n    .num:hover, .decimal:hover {\n      background: #e5e7eb;\n    }\n    .operator {\n      background: #6366f1;\n      color: white;\n    }\n    .operator:hover {\n      background: #5558e3;\n    }\n    .equals {\n      background: #8b5cf6;\n      color: white;\n    }\n    .equals:hover {\n      background: #7c3aed;\n    }\n    .clear {\n      background: #ef4444;\n      color: white;\n    }\n    .clear:hover {\n      background: #dc2626;\n    }\n    .zero {\n      grid-column: span 2;\n    }\n  </style>\n</head>\n<body>\n  <div class="calculator">\n    <div class="display" id="display">0</div>\n    <div class="buttons">\n      <button class="clear" onclick="clearDisplay()">C</button>\n      <button class="operator" onclick="appendOperator('/')">&divide;</button>\n      <button class="operator" onclick="appendOperator('*')">&times;</button>\n      \n      <button class="num" onclick="appendNumber('7')">7</button>\n      <button class="num" onclick="appendNumber('8')">8</button>\n      <button class="num" onclick="appendNumber('9')">9</button>\n      <button class="operator" onclick="appendOperator('-')">-</button>\n      \n      <button class="num" onclick="appendNumber('4')">4</button>\n      <button class="num" onclick="appendNumber('5')">5</button>\n      <button class="num" onclick="appendNumber('6')">6</button>\n      <button class="operator" onclick="appendOperator('+')">+</button>\n      \n      <button class="num" onclick="appendNumber('1')">1</button>\n      <button class="num" onclick="appendNumber('2')">2</button>\n      <button class="num" onclick="appendNumber('3')">3</button>\n      <button class="equals" onclick="calculate()" style="grid-row: span 2;">=</button>\n      \n      <button class="num zero" onclick="appendNumber('0')">0</button>\n      <button class="decimal" onclick="appendDecimal()">.</button>\n    </div>\n  </div>\n\n  <script>\n    let display = document.getElementById('display');\n    let currentValue = '0';\n    let previousValue = '';\n    let operator = '';\n    let shouldResetDisplay = false;\n\n    function updateDisplay() {\n      display.textContent = currentValue;\n    }\n\n    function clearDisplay() {\n      currentValue = '0';\n      previousValue = '';\n      operator = '';\n      shouldResetDisplay = false;\n      updateDisplay();\n    }\n\n    function appendNumber(num) {\n      if (shouldResetDisplay) {\n        currentValue = num;\n        shouldResetDisplay = false;\n      } else {\n        currentValue = currentValue === '0' ? num : currentValue + num;\n      }\n      updateDisplay();\n    }\n\n    function appendDecimal() {\n      if (shouldResetDisplay) {\n        currentValue = '0.';\n        shouldResetDisplay = false;\n      } else if (!currentValue.includes('.')) {\n        currentValue += '.';\n      }\n      updateDisplay();\n    }\n\n    function appendOperator(op) {\n      if (operator && !shouldResetDisplay) {\n        calculate();\n      }\n      previousValue = currentValue;\n      operator = op;\n      shouldResetDisplay = true;\n    }\n\n    function calculate() {\n      if (!operator || !previousValue) return;\n      \n      const prev = parseFloat(previousValue);\n      const current = parseFloat(currentValue);\n      let result = 0;\n\n      switch (operator) {\n        case '+':\n          result = prev + current;\n          break;\n        case '-':\n          result = prev - current;\n          break;\n        case '*':\n          result = prev * current;\n          break;\n        case '/':\n          result = current !== 0 ? prev / current : 'Chyba';\n          break;\n      }\n\n      currentValue = result.toString();\n      operator = '';\n      previousValue = '';\n      shouldResetDisplay = true;\n      updateDisplay();\n    }\n  </script>\n</body>\n</html>`,

      'calc-price': `<!DOCTYPE html>\n<html lang="cs">\n<head>\n  <meta charset="UTF-8">\n  <meta name="viewport" content="width=device-width, initial-scale=1.0">\n  <title>Cenová kalkulačka - DPH</title>\n  <style>\n    * { margin: 0; padding: 0; box-sizing: border-box; }\n    body {\n      font-family: system-ui, sans-serif;\n      background: linear-gradient(135deg, #10b981 0%, #059669 100%);\n      min-height: 100vh;\n      display: flex;\n      align-items: center;\n      justify-content: center;\n      padding: 20px;\n    }\n    .calculator {\n      background: white;\n      border-radius: 20px;\n      box-shadow: 0 20px 60px rgba(0,0,0,0.3);\n      padding: 40px;\n      max-width: 500px;\n      width: 100%;\n    }\n    h1 {\n      color: #059669;\n      margin-bottom: 30px;\n      text-align: center;\n      font-size: 2rem;\n    }\n    .input-group {\n      margin-bottom: 25px;\n    }\n    label {\n      display: block;\n      margin-bottom: 8px;\n      color: #374151;\n      font-weight: 500;\n    }\n    input, select {\n      width: 100%;\n      padding: 15px;\n      border: 2px solid #d1d5db;\n      border-radius: 10px;\n      font-size: 1.1rem;\n      transition: border-color 0.2s;\n    }\n    input:focus, select:focus {\n      outline: none;\n      border-color: #10b981;\n    }\n    .result {\n      background: #f0fdf4;\n      border: 2px solid #10b981;\n      border-radius: 10px;\n      padding: 20px;\n      margin-top: 30px;\n      text-align: center;\n    }\n    .result-label {\n      color: #059669;\n      font-size: 0.9rem;\n      margin-bottom: 5px;\n    }\n    .result-value {\n      color: #047857;\n      font-size: 2.5rem;\n      font-weight: 700;\n    }\n    .breakdown {\n      margin-top: 20px;\n      padding-top: 20px;\n      border-top: 1px solid #d1fae5;\n      display: grid;\n      gap: 10px;\n    }\n    .breakdown-item {\n      display: flex;\n      justify-content: space-between;\n      color: #6b7280;\n      font-size: 0.95rem;\n    }\n    .breakdown-item strong {\n      color: #374151;\n    }\n  </style>\n</head>\n<body>\n  <div class="calculator">\n    <h1>💰 Cenová kalkulačka</h1>\n    \n    <div class="input-group">\n      <label for="price">Cena bez DPH (Kč)</label>\n      <input type="number" id="price" placeholder="0" value="1000" step="0.01">\n    </div>\n\n    <div class="input-group">\n      <label for="vat">Sazba DPH</label>\n      <select id="vat">\n        <option value="21">21% (základní)</option>\n        <option value="12">12% (snížená)</option>\n        <option value="0">0% (osvobozeno)</option>\n      </select>\n    </div>\n\n    <div class="result">\n      <div class="result-label">Cena s DPH</div>\n      <div class="result-value" id="totalPrice">1 210 Kč</div>\n      \n      <div class="breakdown">\n        <div class="breakdown-item">\n          <span>Cena bez DPH:</span>\n          <strong id="priceNoDPH">1 000 Kč</strong>\n        </div>\n        <div class="breakdown-item">\n          <span>DPH (<span id="vatPercent">21</span>%):</span>\n          <strong id="vatAmount">210 Kč</strong>\n        </div>\n      </div>\n    </div>\n  </div>\n\n  <script>\n    const priceInput = document.getElementById('price');\n    const vatSelect = document.getElementById('vat');\n    const totalPriceEl = document.getElementById('totalPrice');\n    const priceNoDPHEl = document.getElementById('priceNoDPH');\n    const vatAmountEl = document.getElementById('vatAmount');\n    const vatPercentEl = document.getElementById('vatPercent');\n\n    function calculate() {\n      const price = parseFloat(priceInput.value) || 0;\n      const vatRate = parseFloat(vatSelect.value) / 100;\n      \n      const vatAmount = price * vatRate;\n      const totalPrice = price + vatAmount;\n\n      priceNoDPHEl.textContent = price.toLocaleString('cs-CZ') + ' Kč';\n      vatAmountEl.textContent = vatAmount.toLocaleString('cs-CZ') + ' Kč';\n      totalPriceEl.textContent = totalPrice.toLocaleString('cs-CZ') + ' Kč';\n      vatPercentEl.textContent = vatSelect.value;\n    }\n\n    priceInput.addEventListener('input', calculate);\n    vatSelect.addEventListener('change', calculate);\n    calculate();\n  </script>\n</body>\n</html>`,

      'calc-bmi': `<!DOCTYPE html>\n<html lang="cs">\n<head>\n  <meta charset="UTF-8">\n  <meta name="viewport" content="width=device-width, initial-scale=1.0">\n  <title>BMI Kalkulačka</title>\n  <style>\n    * { margin: 0; padding: 0; box-sizing: border-box; }\n    body {\n      font-family: system-ui, sans-serif;\n      background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);\n      min-height: 100vh;\n      display: flex;\n      align-items: center;\n      justify-content: center;\n      padding: 20px;\n    }\n    .calculator {\n      background: white;\n      border-radius: 20px;\n      box-shadow: 0 20px 60px rgba(0,0,0,0.3);\n      padding: 40px;\n      max-width: 500px;\n      width: 100%;\n    }\n    h1 {\n      color: #d97706;\n      margin-bottom: 30px;\n      text-align: center;\n      font-size: 2rem;\n    }\n    .input-group {\n      margin-bottom: 25px;\n    }\n    label {\n      display: block;\n      margin-bottom: 8px;\n      color: #374151;\n      font-weight: 500;\n    }\n    input {\n      width: 100%;\n      padding: 15px;\n      border: 2px solid #d1d5db;\n      border-radius: 10px;\n      font-size: 1.1rem;\n      transition: border-color 0.2s;\n    }\n    input:focus {\n      outline: none;\n      border-color: #f59e0b;\n    }\n    .result {\n      margin-top: 30px;\n      text-align: center;\n    }\n    .bmi-value {\n      font-size: 3rem;\n      font-weight: 700;\n      margin: 20px 0;\n    }\n    .bmi-category {\n      font-size: 1.5rem;\n      font-weight: 600;\n      margin-bottom: 10px;\n    }\n    .bmi-desc {\n      color: #6b7280;\n      margin-bottom: 30px;\n    }\n    .scale {\n      background: #f3f4f6;\n      padding: 20px;\n      border-radius: 10px;\n    }\n    .scale-item {\n      display: flex;\n      justify-content: space-between;\n      padding: 8px 0;\n      border-bottom: 1px solid #e5e7eb;\n    }\n    .scale-item:last-child {\n      border-bottom: none;\n    }\n  </style>\n</head>\n<body>\n  <div class="calculator">\n    <h1>📊 BMI Kalkulačka</h1>\n    \n    <div class="input-group">\n      <label for="weight">Váha (kg)</label>\n      <input type="number" id="weight" placeholder="70" step="0.1">\n    </div>\n\n    <div class="input-group">\n      <label for="height">Výška (cm)</label>\n      <input type="number" id="height" placeholder="175" step="1">\n    </div>\n\n    <div class="result" id="result" style="display: none;">\n      <div class="bmi-value" id="bmiValue"></div>\n      <div class="bmi-category" id="bmiCategory"></div>\n      <div class="bmi-desc" id="bmiDesc"></div>\n      \n      <div class="scale">\n        <div class="scale-item" style="color: #3b82f6;">\n          <span>Podváha</span>\n          <span>&lt; 18.5</span>\n        </div>\n        <div class="scale-item" style="color: #10b981;">\n          <span>Normální váha</span>\n          <span>18.5 - 24.9</span>\n        </div>\n        <div class="scale-item" style="color: #f59e0b;">\n          <span>Nadváha</span>\n          <span>25 - 29.9</span>\n        </div>\n        <div class="scale-item" style="color: #ef4444;">\n          <span>Obezita</span>\n          <span>&gt;= 30</span>\n        </div>\n      </div>\n    </div>\n  </div>\n\n  <script>\n    const weightInput = document.getElementById('weight');\n    const heightInput = document.getElementById('height');\n    const resultDiv = document.getElementById('result');\n    const bmiValueEl = document.getElementById('bmiValue');\n    const bmiCategoryEl = document.getElementById('bmiCategory');\n    const bmiDescEl = document.getElementById('bmiDesc');\n\n    function calculate() {\n      const weight = parseFloat(weightInput.value);\n      const height = parseFloat(heightInput.value) / 100;\n      \n      if (weight > 0 && height > 0) {\n        const bmi = weight / (height * height);\n        \n        let category, desc, color;\n        if (bmi < 18.5) {\n          category = 'Podváha';\n          desc = 'Vaše BMI je pod normálem';\n          color = '#3b82f6';\n        } else if (bmi < 25) {\n          category = 'Normální váha';\n          desc = 'Vaše BMI je v normálním rozmezí';\n          color = '#10b981';\n        } else if (bmi < 30) {\n          category = 'Nadváha';\n          desc = 'Vaše BMI je nad normálem';\n          color = '#f59e0b';\n        } else {\n          category = 'Obezita';\n          desc = 'Vaše BMI značí obezitu';\n          color = '#ef4444';\n        }\n        \n        bmiValueEl.textContent = bmi.toFixed(1);\n        bmiValueEl.style.color = color;\n        bmiCategoryEl.textContent = category;\n        bmiCategoryEl.style.color = color;\n        bmiDescEl.textContent = desc;\n        resultDiv.style.display = 'block';\n      } else {\n        resultDiv.style.display = 'none';\n      }\n    }\n\n    weightInput.addEventListener('input', calculate);\n    heightInput.addEventListener('input', calculate);\n  </script>\n</body>\n</html>`,

      'calc-loan': `<!DOCTYPE html>\n<html lang="cs">\n<head>\n  <meta charset="UTF-8">\n  <meta name="viewport" content="width=device-width, initial-scale=1.0">\n  <title>Kalkulačka úvěru</title>\n  <style>\n    * { margin: 0; padding: 0; box-sizing: border-box; }\n    body {\n      font-family: system-ui, sans-serif;\n      background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);\n      min-height: 100vh;\n      display: flex;\n      align-items: center;\n      justify-content: center;\n      padding: 20px;\n    }\n    .calculator {\n      background: white;\n      border-radius: 20px;\n      box-shadow: 0 20px 60px rgba(0,0,0,0.3);\n      padding: 40px;\n      max-width: 500px;\n      width: 100%;\n    }\n    h1 {\n      color: #7c3aed;\n      margin-bottom: 30px;\n      text-align: center;\n      font-size: 2rem;\n    }\n    .input-group {\n      margin-bottom: 25px;\n    }\n    label {\n      display: block;\n      margin-bottom: 8px;\n      color: #374151;\n      font-weight: 500;\n    }\n    input {\n      width: 100%;\n      padding: 15px;\n      border: 2px solid #d1d5db;\n      border-radius: 10px;\n      font-size: 1.1rem;\n      transition: border-color 0.2s;\n    }\n    input:focus {\n      outline: none;\n      border-color: #8b5cf6;\n    }\n    .result {\n      background: #f5f3ff;\n      border: 2px solid #8b5cf6;\n      border-radius: 10px;\n      padding: 20px;\n      margin-top: 30px;\n      text-align: center;\n    }\n    .result-label {\n      color: #7c3aed;\n      font-size: 0.9rem;\n      margin-bottom: 5px;\n    }\n    .result-value {\n      color: #6d28d9;\n      font-size: 2.5rem;\n      font-weight: 700;\n    }\n    .breakdown {\n      margin-top: 20px;\n      padding-top: 20px;\n      border-top: 1px solid #ddd6fe;\n      display: grid;\n      gap: 10px;\n    }\n    .breakdown-item {\n      display: flex;\n      justify-content: space-between;\n      color: #6b7280;\n      font-size: 0.95rem;\n    }\n    .breakdown-item strong {\n      color: #374151;\n    }\n  </style>\n</head>\n<body>\n  <div class="calculator">\n    <h1>🏦 Kalkulačka úvěru</h1>\n    \n    <div class="input-group">\n      <label for="amount">Výše úvěru (Kč)</label>\n      <input type="number" id="amount" placeholder="300000" value="300000" step="1000">\n    </div>\n\n    <div class="input-group">\n      <label for="rate">Úroková sazba (% p.a.)</label>\n      <input type="number" id="rate" placeholder="5.5" value="5.5" step="0.1">\n    </div>\n\n    <div class="input-group">\n      <label for="years">Doba splatnosti (roky)</label>\n      <input type="number" id="years" placeholder="5" value="5" step="1">\n    </div>\n\n    <div class="result">\n      <div class="result-label">Měsíční splátka</div>\n      <div class="result-value" id="monthlyPayment"></div>\n      \n      <div class="breakdown">\n        <div class="breakdown-item">\n          <span>Celkem zaplatíte:</span>\n          <strong id="totalPayment"></strong>\n        </div>\n        <div class="breakdown-item">\n          <span>Z toho úroky:</span>\n          <strong id="totalInterest"></strong>\n        </div>\n      </div>\n    </div>\n  </div>\n\n  <script>\n    const amountInput = document.getElementById('amount');\n    const rateInput = document.getElementById('rate');\n    const yearsInput = document.getElementById('years');\n    const monthlyPaymentEl = document.getElementById('monthlyPayment');\n    const totalPaymentEl = document.getElementById('totalPayment');\n    const totalInterestEl = document.getElementById('totalInterest');\n\n    function calculate() {\n      const P = parseFloat(amountInput.value) || 0;\n      const annualRate = parseFloat(rateInput.value) || 0;\n      const years = parseFloat(yearsInput.value) || 0;\n      \n      const monthlyRate = annualRate / 100 / 12;\n      const months = years * 12;\n      \n      if (P > 0 && monthlyRate > 0 && months > 0) {\n        const monthlyPayment = P * (monthlyRate * Math.pow(1 + monthlyRate, months)) / (Math.pow(1 + monthlyRate, months) - 1);\n        const totalPayment = monthlyPayment * months;\n        const totalInterest = totalPayment - P;\n        \n        monthlyPaymentEl.textContent = monthlyPayment.toLocaleString('cs-CZ', {maximumFractionDigits: 0}) + ' Kč';\n        totalPaymentEl.textContent = totalPayment.toLocaleString('cs-CZ', {maximumFractionDigits: 0}) + ' Kč';\n        totalInterestEl.textContent = totalInterest.toLocaleString('cs-CZ', {maximumFractionDigits: 0}) + ' Kč';\n      }\n    }\n\n    amountInput.addEventListener('input', calculate);\n    rateInput.addEventListener('input', calculate);\n    yearsInput.addEventListener('input', calculate);\n    calculate();\n  </script>\n</body>\n</html>`,

      'calc-tip': `<!DOCTYPE html>\n<html lang="cs">\n<head>\n  <meta charset="UTF-8">\n  <meta name="viewport" content="width=device-width, initial-scale=1.0">\n  <title>Kalkulačka spropitného</title>\n  <style>\n    * { margin: 0; padding: 0; box-sizing: border-box; }\n    body {\n      font-family: system-ui, sans-serif;\n      background: linear-gradient(135deg, #ec4899 0%, #db2777 100%);\n      min-height: 100vh;\n      display: flex;\n      align-items: center;\n      justify-content: center;\n      padding: 20px;\n    }\n    .calculator {\n      background: white;\n      border-radius: 20px;\n      box-shadow: 0 20px 60px rgba(0,0,0,0.3);\n      padding: 40px;\n      max-width: 500px;\n      width: 100%;\n    }\n    h1 {\n      color: #db2777;\n      margin-bottom: 30px;\n      text-align: center;\n      font-size: 2rem;\n    }\n    .input-group {\n      margin-bottom: 25px;\n    }\n    label {\n      display: block;\n      margin-bottom: 8px;\n      color: #374151;\n      font-weight: 500;\n    }\n    input {\n      width: 100%;\n      padding: 15px;\n      border: 2px solid #d1d5db;\n      border-radius: 10px;\n      font-size: 1.1rem;\n      transition: border-color 0.2s;\n    }\n    input:focus {\n      outline: none;\n      border-color: #ec4899;\n    }\n    .tip-options {\n      display: grid;\n      grid-template-columns: repeat(3, 1fr);\n      gap: 10px;\n      margin-bottom: 25px;\n    }\n    .tip-btn {\n      padding: 15px;\n      border: 2px solid #d1d5db;\n      border-radius: 10px;\n      background: white;\n      cursor: pointer;\n      font-size: 1rem;\n      font-weight: 600;\n      transition: all 0.2s;\n    }\n    .tip-btn:hover {\n      border-color: #ec4899;\n    }\n    .tip-btn.active {\n      background: #ec4899;\n      color: white;\n      border-color: #ec4899;\n    }\n    .result {\n      background: #fdf2f8;\n      border: 2px solid #ec4899;\n      border-radius: 10px;\n      padding: 20px;\n      margin-top: 30px;\n    }\n    .result-row {\n      display: flex;\n      justify-content: space-between;\n      padding: 12px 0;\n      border-bottom: 1px solid #fce7f3;\n    }\n    .result-row:last-child {\n      border-bottom: none;\n      font-weight: 700;\n      font-size: 1.2rem;\n      color: #be185d;\n    }\n  </style>\n</head>\n<body>\n  <div class="calculator">\n    <h1>🍽️ Kalkulačka spropitného</h1>\n    \n    <div class="input-group">\n      <label for="bill">Částka účtu (Kč)</label>\n      <input type="number" id="bill" placeholder="500" value="500" step="10">\n    </div>\n\n    <label style="margin-bottom: 10px; display: block;">Spropitné (%)</label>\n    <div class="tip-options">\n      <button class="tip-btn" data-tip="10">10%</button>\n      <button class="tip-btn active" data-tip="15">15%</button>\n      <button class="tip-btn" data-tip="20">20%</button>\n    </div>\n\n    <div class="input-group">\n      <label for="people">Počet osob</label>\n      <input type="number" id="people" placeholder="1" value="1" step="1" min="1">\n    </div>\n\n    <div class="result">\n      <div class="result-row">\n        <span>Účet:</span>\n        <strong id="billAmount">500 Kč</strong>\n      </div>\n      <div class="result-row">\n        <span>Spropitné (<span id="tipPercent">15</span>%):</span>\n        <strong id="tipAmount">75 Kč</strong>\n      </div>\n      <div class="result-row">\n        <span>Celkem:</span>\n        <strong id="totalAmount">575 Kč</strong>\n      </div>\n      <div class="result-row" style="padding-top: 20px; margin-top: 10px; border-top: 2px solid #ec4899;">\n        <span>Na osobu:</span>\n        <strong id="perPerson">575 Kč</strong>\n      </div>\n    </div>\n  </div>\n\n  <script>\n    const billInput = document.getElementById('bill');\n    const peopleInput = document.getElementById('people');\n    const tipBtns = document.querySelectorAll('.tip-btn');\n    \n    let currentTip = 15;\n\n    tipBtns.forEach(btn => {\n      btn.addEventListener('click', () => {\n        tipBtns.forEach(b => b.classList.remove('active'));\n        btn.classList.add('active');\n        currentTip = parseInt(btn.dataset.tip);\n        calculate();\n      });\n    });\n\n    function calculate() {\n      const bill = parseFloat(billInput.value) || 0;\n      const people = parseInt(peopleInput.value) || 1;\n      const tip = bill * (currentTip / 100);\n      const total = bill + tip;\n      const perPerson = total / people;\n\n      document.getElementById('billAmount').textContent = bill.toLocaleString('cs-CZ') + ' Kč';\n      document.getElementById('tipPercent').textContent = currentTip;\n      document.getElementById('tipAmount').textContent = tip.toLocaleString('cs-CZ') + ' Kč';\n      document.getElementById('totalAmount').textContent = total.toLocaleString('cs-CZ') + ' Kč';\n      document.getElementById('perPerson').textContent = perPerson.toLocaleString('cs-CZ') + ' Kč';\n    }\n\n    billInput.addEventListener('input', calculate);\n    peopleInput.addEventListener('input', calculate);\n    calculate();\n  </script>\n</body>\n</html>`
    };

    // Close handler
    const closeModal = () => modal.remove();

    modal.querySelector('#templatesClose').addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeModal();
    });

    // Create new template handler
    modal.querySelector('#createNewTemplate').addEventListener('click', () => {
      this.showCreateTemplateDialog();
      closeModal();
    });

    // Edit custom template handlers
    modal.querySelectorAll('.edit-template-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const templateId = btn.dataset.templateId;
        this.showEditTemplateDialog(templateId, customTemplates[templateId]);
        closeModal();
      });
    });

    // Delete custom template handlers
    modal.querySelectorAll('.delete-template-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const templateId = btn.dataset.templateId;
        if (confirm(`Opravdu chcete smazat šablonu "${customTemplates[templateId].name}"?`)) {
          delete customTemplates[templateId];
          localStorage.setItem('customTemplates', JSON.stringify(customTemplates));
          eventBus.emit('toast:show', {
            message: '🗑️ Šablona smazána',
            type: 'success',
            duration: 2000
          });
          closeModal();
          this.showTemplates(); // Refresh
        }
      });
    });

    // Edit built-in template (save as custom)
    modal.querySelectorAll('.edit-builtin-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const templateId = btn.dataset.template;
        const code = templates[templateId];
        this.showEditTemplateDialog(null, { name: templateId, code: code }, true);
        closeModal();
      });
    });

    // Template click handlers
    modal.querySelectorAll('.template-btn').forEach(card => {
      card.addEventListener('click', () => {
        const templateId = card.dataset.template;
        const isCustom = card.dataset.custom === 'true';

        let code;
        if (isCustom) {
          const customId = templateId.replace('custom-', '');
          code = customTemplates[customId]?.code;
        } else {
          code = templates[templateId];
        }

        console.log('Template clicked:', templateId);

        if (code) {
          console.log('Creating new file with template');
          eventBus.emit('file:create', {
            name: `${templateId}.html`,
            content: code
          });
          eventBus.emit('toast:show', {
            message: '✅ Šablona vložena',
            type: 'success',
            duration: 2000
          });
          closeModal();
        }
      });
    });
  }

  showCreateTemplateDialog() {
    const modal = document.createElement('div');
    modal.className = 'modal-backdrop';
    modal.innerHTML = `
      <div class="modal-content" style="max-width: 900px;">
        <div class="modal-header">
          <h3>➕ Vytvořit novou šablonu</h3>
          <button class="modal-close" id="createTemplateClose">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>
        <div class="modal-body" style="padding: 30px;">
          <div style="display: grid; gap: 20px;">
            <div>
              <label style="display: block; margin-bottom: 8px; font-weight: 600;">Název šablony</label>
              <input type="text" id="templateName" placeholder="Např. Moje landing page" style="width: 100%; padding: 12px; border: 1px solid var(--border-color); border-radius: 8px; font-size: 14px;">
            </div>
            <div>
              <label style="display: block; margin-bottom: 8px; font-weight: 600;">Popis</label>
              <input type="text" id="templateDesc" placeholder="Stručný popis šablony" style="width: 100%; padding: 12px; border: 1px solid var(--border-color); border-radius: 8px; font-size: 14px;">
            </div>
            <div>
              <label style="display: block; margin-bottom: 8px; font-weight: 600;">Ikona (emoji)</label>
              <input type="text" id="templateIcon" placeholder="📄" maxlength="2" style="width: 100px; padding: 12px; border: 1px solid var(--border-color); border-radius: 8px; font-size: 20px; text-align: center;">
            </div>
            <div>
              <label style="display: block; margin-bottom: 8px; font-weight: 600;">HTML kód</label>
              <textarea id="templateCode" placeholder="Vložte zde kompletní HTML kód šablony..." style="width: 100%; min-height: 300px; padding: 12px; border: 1px solid var(--border-color); border-radius: 8px; font-family: 'Consolas', monospace; font-size: 13px; line-height: 1.6;"></textarea>
            </div>
          </div>
          <div style="margin-top: 20px; display: flex; gap: 10px; justify-content: flex-end;">
            <button id="cancelCreateTemplate" style="padding: 12px 24px; background: var(--bg-secondary); border: 1px solid var(--border-color); border-radius: 8px; cursor: pointer; font-weight: 600;">Zrušit</button>
            <button id="saveTemplate" style="padding: 12px 24px; background: var(--accent); color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: 600;">Uložit šablonu</button>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    const closeModal = () => modal.remove();

    modal.querySelector('#createTemplateClose').addEventListener('click', closeModal);
    modal.querySelector('#cancelCreateTemplate').addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeModal();
    });

    modal.querySelector('#saveTemplate').addEventListener('click', () => {
      const name = modal.querySelector('#templateName').value.trim();
      const description = modal.querySelector('#templateDesc').value.trim();
      const icon = modal.querySelector('#templateIcon').value.trim() || '📄';
      const code = modal.querySelector('#templateCode').value.trim();

      if (!name) {
        alert('Zadejte prosím název šablony');
        return;
      }

      if (!code) {
        alert('Zadejte prosím HTML kód šablony');
        return;
      }

      const customTemplates = JSON.parse(localStorage.getItem('customTemplates') || '{}');
      const templateId = Date.now().toString();

      customTemplates[templateId] = {
        name,
        description,
        icon,
        code
      };

      localStorage.setItem('customTemplates', JSON.stringify(customTemplates));

      eventBus.emit('toast:show', {
        message: '✅ Šablona vytvořena',
        type: 'success',
        duration: 2000
      });

      closeModal();
      this.showTemplates();
    });
  }

  showEditTemplateDialog(templateId, templateData, isBuiltIn = false) {
    const modal = document.createElement('div');
    modal.className = 'modal-backdrop';
    modal.innerHTML = `
      <div class="modal-content" style="max-width: 900px;">
        <div class="modal-header">
          <h3>✏️ ${isBuiltIn ? 'Upravit šablonu (uloží se jako vlastní)' : 'Upravit šablonu'}</h3>
          <button class="modal-close" id="editTemplateClose">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>
        <div class="modal-body" style="padding: 30px;">
          <div style="display: grid; gap: 20px;">
            <div>
              <label style="display: block; margin-bottom: 8px; font-weight: 600;">Název šablony</label>
              <input type="text" id="templateName" value="${this.escapeHtml(templateData.name || '')}" placeholder="Např. Moje landing page" style="width: 100%; padding: 12px; border: 1px solid var(--border-color); border-radius: 8px; font-size: 14px;">
            </div>
            <div>
              <label style="display: block; margin-bottom: 8px; font-weight: 600;">Popis</label>
              <input type="text" id="templateDesc" value="${this.escapeHtml(templateData.description || '')}" placeholder="Stručný popis šablony" style="width: 100%; padding: 12px; border: 1px solid var(--border-color); border-radius: 8px; font-size: 14px;">
            </div>
            <div>
              <label style="display: block; margin-bottom: 8px; font-weight: 600;">Ikona (emoji)</label>
              <input type="text" id="templateIcon" value="${templateData.icon || '📄'}" maxlength="2" style="width: 100px; padding: 12px; border: 1px solid var(--border-color); border-radius: 8px; font-size: 20px; text-align: center;">
            </div>
            <div>
              <label style="display: block; margin-bottom: 8px; font-weight: 600;">HTML kód</label>
              <textarea id="templateCode" style="width: 100%; min-height: 300px; padding: 12px; border: 1px solid var(--border-color); border-radius: 8px; font-family: 'Consolas', monospace; font-size: 13px; line-height: 1.6;">${this.escapeHtml(templateData.code || '')}</textarea>
            </div>
          </div>
          <div style="margin-top: 20px; display: flex; gap: 10px; justify-content: flex-end;">
            <button id="cancelEditTemplate" style="padding: 12px 24px; background: var(--bg-secondary); border: 1px solid var(--border-color); border-radius: 8px; cursor: pointer; font-weight: 600;">Zrušit</button>
            <button id="updateTemplate" style="padding: 12px 24px; background: var(--accent); color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: 600;">Uložit změny</button>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    const closeModal = () => modal.remove();

    modal.querySelector('#editTemplateClose').addEventListener('click', closeModal);
    modal.querySelector('#cancelEditTemplate').addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeModal();
    });

    modal.querySelector('#updateTemplate').addEventListener('click', () => {
      const name = modal.querySelector('#templateName').value.trim();
      const description = modal.querySelector('#templateDesc').value.trim();
      const icon = modal.querySelector('#templateIcon').value.trim() || '📄';
      const code = modal.querySelector('#templateCode').value.trim();

      if (!name) {
        alert('Zadejte prosím název šablony');
        return;
      }

      if (!code) {
        alert('Zadejte prosím HTML kód šablony');
        return;
      }

      const customTemplates = JSON.parse(localStorage.getItem('customTemplates') || '{}');

      // If editing built-in template, create new custom template
      const finalTemplateId = isBuiltIn ? Date.now().toString() : templateId;

      customTemplates[finalTemplateId] = {
        name,
        description,
        icon,
        code
      };

      localStorage.setItem('customTemplates', JSON.stringify(customTemplates));

      eventBus.emit('toast:show', {
        message: isBuiltIn ? '✅ Šablona uložena jako vlastní' : '✅ Šablona upravena',
        type: 'success',
        duration: 2000
      });

      closeModal();
      this.showTemplates();
    });
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  showImages() {
    // Create modal for image upload
    const modal = document.createElement('div');
    modal.className = 'modal-backdrop';
    modal.innerHTML = `
      <div class="modal-content replace-dialog">
        <div class="modal-header">
          <h3>🖼️ Správa obrázků</h3>
          <button class="modal-close" id="imagesClose">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label>Vyberte obrázek:</label>
            <input type="file" id="imageUpload" accept="image/*" class="form-input" style="padding: 10px;">
          </div>
          <div id="imagePreview" style="margin-top: 20px; display: none;">
            <label>Náhled:</label>
            <img id="previewImg" style="max-width: 100%; border-radius: 8px; margin-top: 10px;" />
            <div style="margin-top: 15px;">
              <label>HTML kód:</label>
              <textarea id="imageCode" readonly class="form-input" rows="3" style="font-family: monospace; font-size: 12px; margin-top: 8px;"></textarea>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" id="imagesCancelBtn">Zavřít</button>
          <button class="btn btn-primary" id="imageInsertBtn" style="display: none;">Vložit do editoru</button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    const fileInput = modal.querySelector('#imageUpload');
    const previewDiv = modal.querySelector('#imagePreview');
    const previewImg = modal.querySelector('#previewImg');
    const imageCode = modal.querySelector('#imageCode');
    const insertBtn = modal.querySelector('#imageInsertBtn');
    const cancelBtn = modal.querySelector('#imagesCancelBtn');
    const closeBtn = modal.querySelector('#imagesClose');

    let currentImageCode = '';

    const closeModal = () => {
      modal.remove();
    };

    // File upload handler
    fileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;

      if (!file.type.startsWith('image/')) {
        eventBus.emit('toast:show', {
          message: '⚠️ Vyberte obrázkový soubor',
          type: 'warning'
        });
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        const base64 = event.target.result;

        // Show preview
        previewImg.src = base64;
        previewDiv.style.display = 'block';

        // Generate HTML code
        currentImageCode = `<img src="${base64}" alt="Obrázek" style="max-width: 100%; height: auto;">`;
        imageCode.value = currentImageCode;

        insertBtn.style.display = 'inline-flex';

        eventBus.emit('toast:show', {
          message: '✅ Obrázek načten',
          type: 'success',
          duration: 2000
        });
      };
      reader.readAsDataURL(file);
    });

    // Insert button
    insertBtn.addEventListener('click', () => {
      if (currentImageCode) {
        eventBus.emit('editor:insertText', { text: '\n' + currentImageCode + '\n' });
        eventBus.emit('toast:show', {
          message: '✅ Obrázek vložen',
          type: 'success',
          duration: 2000
        });
        closeModal();
      }
    });

    cancelBtn.addEventListener('click', closeModal);
    closeBtn.addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeModal();
    });
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
    const modal = document.createElement('div');
    modal.className = 'modal-backdrop';
    modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.7);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10000;
      backdrop-filter: blur(4px);
    `;
    modal.innerHTML = `
      <div class="modal-content" style="max-width: 800px; background: var(--bg-primary, #1e1e1e); border-radius: 16px; box-shadow: 0 8px 32px rgba(0,0,0,0.3); overflow: hidden;">
        <div class="modal-header" style="padding: 24px 30px; background: var(--bg-secondary, #2d2d2d); border-bottom: 1px solid var(--border-color, #444); display: flex; justify-content: space-between; align-items: center;">
          <h3 style="margin: 0; color: var(--text-primary, #fff); font-size: 20px;">🔍 Hledat HTML repozitáře na GitHub</h3>
          <button class="modal-close" id="githubSearchClose" style="background: transparent; border: none; color: var(--text-primary, #fff); font-size: 24px; cursor: pointer; padding: 4px 8px; opacity: 0.7; transition: opacity 0.2s;">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 24px; height: 24px;">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>
        <div class="modal-body" style="padding: 30px; background: var(--bg-primary, #1e1e1e);">
          <div style="margin-bottom: 20px;">
            <label style="display: block; margin-bottom: 8px; font-weight: 600; color: var(--text-primary, #fff);">Co hledáte?</label>
            <input type="text" id="githubSearchQuery" placeholder="Např. calculator, landing page, portfolio (česky i anglicky)" style="width: 100%; padding: 12px; border: 1px solid var(--border-color, #444); border-radius: 8px; font-size: 14px; background: var(--bg-secondary, #2d2d2d); color: var(--text-primary, #fff); box-sizing: border-box;">
            <p style="font-size: 12px; color: var(--text-secondary, #999); margin-top: 8px;">
              💡 Tip: Můžete hledat česky i anglicky. Výsledky jsou seřazeny podle popularity.
            </p>
          </div>
          <button id="startGithubSearch" style="width: 100%; padding: 14px; background: var(--accent, #007acc); color: white; border: none; border-radius: 8px; font-weight: 600; cursor: pointer; font-size: 15px; transition: opacity 0.2s;">
            🔍 Hledat
          </button>
          <div id="githubSearchResults" style="margin-top: 30px; display: none;">
            <h4 style="margin-bottom: 15px; color: var(--text-primary, #fff);">Výsledky hledání:</h4>
            <div id="githubResultsList" style="display: grid; gap: 10px; max-height: 400px; overflow-y: auto;"></div>
          </div>
          <div id="githubSearchLoading" style="display: none; text-align: center; padding: 40px;">
            <div style="display: inline-block; width: 40px; height: 40px; border: 4px solid var(--border-color, #444); border-top-color: var(--accent, #007acc); border-radius: 50%; animation: spin 1s linear infinite;"></div>
            <p style="margin-top: 15px; color: var(--text-secondary, #999);">Hledání na GitHub...</p>
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
        // Hledat GitHub repozitáře
        const allResults = await this.searchGitHubRepos(query);
        allResults.forEach(r => r.source = 'GitHub');

        loadingDiv.style.display = 'none';
        resultsDiv.style.display = 'block';

        if (allResults.length === 0) {
          resultsList.innerHTML = '<p style="text-align: center; color: var(--text-secondary); padding: 20px;">Nenalezeny žádné výsledky</p>';
          return;
        }

        allResults.forEach(result => {
          const resultCard = document.createElement('div');
          resultCard.style.cssText = 'padding: 15px; background: var(--bg-secondary, #2d2d2d); border: 1px solid var(--border-color, #444); border-radius: 8px; transition: all 0.2s;';

          const sourceIcon = result.source === 'GitHub' ? '🐙' : result.source === 'CodePen' ? '✏️' : '📝';
          const sourceLabel = result.source;

          resultCard.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: start; gap: 15px;">
              <div style="flex: 1;">
                <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 5px;">
                  <h5 style="margin: 0; color: var(--accent, #007acc); font-size: 14px;">${result.name}</h5>
                  <a href="${result.url}" target="_blank" rel="noopener noreferrer" style="color: var(--text-secondary, #999); text-decoration: none; font-size: 12px; display: inline-flex; align-items: center; gap: 4px; padding: 2px 6px; background: var(--bg-tertiary, #3d3d3d); border-radius: 4px; transition: all 0.2s;" title="Otevřít na ${sourceLabel}">
                    ${sourceIcon} ${sourceLabel}
                  </a>
                </div>
                <p style="margin: 0 0 8px 0; font-size: 12px; color: var(--text-secondary, #999);">${result.description || 'Bez popisu'}</p>
                <div style="display: flex; gap: 15px; font-size: 11px; color: var(--text-secondary, #999);">
                  <span>⭐ ${result.stars || 0}</span>
                  <span>🍴 ${result.forks || 0}</span>
                </div>
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
              await this.loadGitHubCode(result.url, result.name, false, result.downloadUrl);
              closeModal();
              eventBus.emit('toast:show', {
                message: '✅ Kód načten z GitHub',
                type: 'success',
                duration: 2000
              });
            } catch (error) {
              alert('Chyba při načítání kódu: ' + error.message);
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
    // Hledat HTML, CSS a JS soubory
    const searchQuery = encodeURIComponent(`${query} extension:html OR extension:css OR extension:js`);
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

  async loadGitHubCode(url, name, isSingleFile, downloadUrl) {
    if (isSingleFile && downloadUrl) {
      // Načíst obsah souboru přímo z downloadUrl
      const response = await fetch(downloadUrl);
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
      // Pro repozitář - stáhnout celý projekt se všemi závislostmi
      const match = url.match(/github\.com\/([^/]+)\/([^/]+)/);
      if (!match) {
        throw new Error('Neplatná URL GitHub repozitáře');
      }

      const [, owner, repo] = match;

      // Získat informace o repozitáři
      const repoInfo = await fetch(`https://api.github.com/repos/${owner}/${repo}`);
      if (!repoInfo.ok) {
        throw new Error('Nepodařilo se načíst informace o repozitáři');
      }
      const repoData = await repoInfo.json();
      const defaultBranch = repoData.default_branch || 'main';

      // Najít hlavní HTML soubor
      const possibleFiles = ['index.html', 'index.htm', 'home.html', 'main.html'];
      let mainHtmlFile = null;
      let mainHtmlContent = null;

      for (const file of possibleFiles) {
        try {
          const rawUrl = `https://raw.githubusercontent.com/${owner}/${repo}/${defaultBranch}/${file}`;
          const response = await fetch(rawUrl);
          if (response.ok) {
            mainHtmlFile = file;
            mainHtmlContent = await response.text();
            break;
          }
        } catch (e) {
          continue;
        }
      }

      if (!mainHtmlContent) {
        throw new Error('Nenalezen žádný HTML soubor v repozitáři.');
      }

      // Analyzovat HTML a najít všechny závislosti
      const dependencies = this.parseHtmlDependencies(mainHtmlContent);

      // Stáhnout všechny soubory
      const filesToCreate = [
        { name: mainHtmlFile, content: mainHtmlContent }
      ];

      // Stáhnout CSS soubory
      for (const cssPath of dependencies.css) {
        try {
          const rawUrl = `https://raw.githubusercontent.com/${owner}/${repo}/${defaultBranch}/${cssPath}`;
          const response = await fetch(rawUrl);
          if (response.ok) {
            const content = await response.text();
            filesToCreate.push({ name: cssPath, content });
          }
        } catch (e) {
          console.warn(`Nepodařilo se načíst CSS: ${cssPath}`);
        }
      }

      // Stáhnout JS soubory
      for (const jsPath of dependencies.js) {
        try {
          const rawUrl = `https://raw.githubusercontent.com/${owner}/${repo}/${defaultBranch}/${jsPath}`;
          const response = await fetch(rawUrl);
          if (response.ok) {
            const content = await response.text();
            filesToCreate.push({ name: jsPath, content });
          }
        } catch (e) {
          console.warn(`Nepodařilo se načíst JS: ${jsPath}`);
        }
      }

      // Vytvořit všechny soubory najednou
      eventBus.emit('github:project:loaded', {
        name: name,
        files: filesToCreate
      });
    }
  }

  parseHtmlDependencies(html) {
    const dependencies = {
      css: [],
      js: [],
      images: []
    };

    // Najít CSS linky
    const cssRegex = /<link[^>]*href=["']([^"']+\.css)["'][^>]*>/gi;
    let match;
    while ((match = cssRegex.exec(html)) !== null) {
      const path = match[1];
      // Jen lokální soubory (ne CDN)
      if (!path.startsWith('http') && !path.startsWith('//')) {
        dependencies.css.push(path.replace(/^\.?\//, ''));
      }
    }

    // Najít JS scripty
    const jsRegex = /<script[^>]*src=["']([^"']+\.js)["'][^>]*>/gi;
    while ((match = jsRegex.exec(html)) !== null) {
      const path = match[1];
      if (!path.startsWith('http') && !path.startsWith('//')) {
        dependencies.js.push(path.replace(/^\.?\//, ''));
      }
    }

    // Najít obrázky
    const imgRegex = /<img[^>]*src=["']([^"']+)["'][^>]*>/gi;
    while ((match = imgRegex.exec(html)) !== null) {
      const path = match[1];
      if (!path.startsWith('http') && !path.startsWith('//') && !path.startsWith('data:')) {
        dependencies.images.push(path.replace(/^\.?\//, ''));
      }
    }

    return dependencies;
  }

  async searchGist(query) {
    try {
      // Použít GitHub Code Search a filtrovat gist výsledky
      // GitHub Gist nemá přímé search API, ale můžeme hledat přes code search
      const searchQuery = encodeURIComponent(`${query} (extension:html OR extension:css OR extension:js)`);
      const response = await fetch(`https://api.github.com/search/code?q=${searchQuery}&per_page=30`);

      if (!response.ok) {
        console.warn('GitHub API nedostupné pro Gist search');
        return [];
      }

      const data = await response.json();

      // Filtrovat pouze Gist výsledky (repository obsahuje /gist:)
      const gistItems = data.items.filter(item =>
        item.repository && item.repository.full_name &&
        (item.repository.full_name.includes('/gist:') || item.repository.owner.type === 'User' && item.path.includes('.'))
      ).slice(0, 10);

      if (gistItems.length === 0) {
        console.info('Gist: Žádné výsledky nalezeny');
        return [];
      }

      return gistItems.map(item => ({
        name: item.name,
        description: item.repository.description || 'GitHub snippet',
        url: item.html_url,
        path: item.path,
        downloadUrl: item.html_url.replace('github.com', 'raw.githubusercontent.com').replace('/blob/', '/'),
        size: item.size || 0
      }));
    } catch (error) {
      console.warn('Gist search error:', error);
      return [];
    }
  }

  async loadCodePenCode(result) {
    try {
      // Pro CodePen musíme získat HTML/CSS/JS z jejich editoru
      // Použijeme export URL nebo API
      const penId = result.id || result.url.split('/').pop();

      // Pokusit se získat data z CodePen
      const response = await fetch(`https://cpv2api.com/pens/${penId}`);

      if (!response.ok) {
        throw new Error('Nepodařilo se načíst CodePen projekt');
      }

      const data = await response.json();
      const pen = data.data;

      // Složit HTML dokument z HTML, CSS a JS
      const html = `<!DOCTYPE html>
<html lang="cs">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${pen.title || 'CodePen Import'}</title>
  <style>
${pen.css || '/* No CSS */'}
  </style>
</head>
<body>
${pen.html || '<!-- No HTML -->'}

  <script>
${pen.js || '// No JavaScript'}
  </script>
</body>
</html>`;

      // Vytvořit nový soubor
      eventBus.emit('file:create', {
        name: `${result.name || 'codepen'}.html`,
        content: html
      });
    } catch (error) {
      throw new Error('CodePen: ' + error.message);
    }
  }

  async loadGistCode(result) {
    try {
      // Načíst HTML obsah z Gist
      let url = result.downloadUrl;

      // Pokud není downloadUrl, zkusit konstruovat raw URL
      if (!url) {
        // Gist raw URL formát: https://gist.githubusercontent.com/user/gistId/raw/filename
        const gistMatch = result.url.match(/gist\.github\.com\/([^/]+)\/([^/]+)/);
        if (gistMatch) {
          const [, user, gistId] = gistMatch;
          url = `https://gist.githubusercontent.com/${user}/${gistId}/raw/${result.name}`;
        }
      }

      if (!url) {
        throw new Error('Nepodařilo se získat URL souboru');
      }

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error('Nepodařilo se načíst soubor z Gist');
      }

      const code = await response.text();

      // Vytvořit nový soubor
      eventBus.emit('file:create', {
        name: result.name,
        content: code
      });
    } catch (error) {
      throw new Error('Gist: ' + error.message);
    }
  }

  deployProject() {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
      <div class="modal-container" style="max-width: 700px;">
        <div class="modal-header">
          <h2>🚀 Deploy projekt</h2>
          <button class="modal-close" id="deployClose">&times;</button>
        </div>
        <div class="modal-body">
          <p style="margin-bottom: 20px; color: var(--text-secondary);">
            Vyberte platformu pro nasazení vašeho projektu:
          </p>

          <!-- GitHub Pages -->
          <div class="deploy-option" style="border: 2px solid var(--border-color); border-radius: 8px; padding: 20px; margin-bottom: 15px; cursor: pointer; transition: all 0.2s;" data-platform="github">
            <div style="display: flex; align-items: center; gap: 15px;">
              <div style="font-size: 40px;">🐙</div>
              <div style="flex: 1;">
                <h3 style="margin: 0 0 5px 0;">GitHub Pages</h3>
                <p style="margin: 0; color: var(--text-secondary); font-size: 14px;">
                  Hostování zdarma přímo z GitHub repozitáře
                </p>
              </div>
              <div style="color: var(--primary-color); font-weight: bold;">→</div>
            </div>
          </div>

          <!-- Netlify -->
          <div class="deploy-option" style="border: 2px solid var(--border-color); border-radius: 8px; padding: 20px; margin-bottom: 15px; cursor: pointer; transition: all 0.2s;" data-platform="netlify">
            <div style="display: flex; align-items: center; gap: 15px;">
              <div style="font-size: 40px;">🌐</div>
              <div style="flex: 1;">
                <h3 style="margin: 0 0 5px 0;">Netlify</h3>
                <p style="margin: 0; color: var(--text-secondary); font-size: 14px;">
                  Rychlý deploy s automatickým SSL a CDN
                </p>
              </div>
              <div style="color: var(--primary-color); font-weight: bold;">→</div>
            </div>
          </div>

          <!-- Vercel -->
          <div class="deploy-option" style="border: 2px solid var(--border-color); border-radius: 8px; padding: 20px; margin-bottom: 15px; cursor: pointer; transition: all 0.2s;" data-platform="vercel">
            <div style="display: flex; align-items: center; gap: 15px;">
              <div style="font-size: 40px;">▲</div>
              <div style="flex: 1;">
                <h3 style="margin: 0 0 5px 0;">Vercel</h3>
                <p style="margin: 0; color: var(--text-secondary); font-size: 14px;">
                  Optimalizováno pro Next.js a moderní frameworky
                </p>
              </div>
              <div style="color: var(--primary-color); font-weight: bold;">→</div>
            </div>
          </div>

          <!-- Manual Deploy -->
          <div class="deploy-option" style="border: 2px solid var(--border-color); border-radius: 8px; padding: 20px; cursor: pointer; transition: all 0.2s;" data-platform="manual">
            <div style="display: flex; align-items: center; gap: 15px;">
              <div style="font-size: 40px;">📦</div>
              <div style="flex: 1;">
                <h3 style="margin: 0 0 5px 0;">Manuální deploy</h3>
                <p style="margin: 0; color: var(--text-secondary); font-size: 14px;">
                  Stáhněte ZIP a nahrajte na vlastní hosting
                </p>
              </div>
              <div style="color: var(--primary-color); font-weight: bold;">→</div>
            </div>
          </div>

          <div style="margin-top: 20px; padding: 15px; background: var(--bg-secondary); border-radius: 8px; font-size: 13px; color: var(--text-secondary);">
            <strong>💡 Tip:</strong> Před deployem se ujistěte, že váš projekt je kompletní a otestovaný.
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    // Add hover effects
    const options = modal.querySelectorAll('.deploy-option');
    options.forEach(option => {
      option.addEventListener('mouseenter', () => {
        option.style.borderColor = 'var(--primary-color)';
        option.style.background = 'var(--bg-secondary)';
      });
      option.addEventListener('mouseleave', () => {
        option.style.borderColor = 'var(--border-color)';
        option.style.background = 'transparent';
      });
      option.addEventListener('click', () => {
        const platform = option.dataset.platform;
        this.handleDeploy(platform);
        modal.remove();
      });
    });

    // Close button
    modal.querySelector('#deployClose').addEventListener('click', () => {
      modal.remove();
    });

    // Close on backdrop click
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.remove();
      }
    });
  }

  handleDeploy(platform) {
    switch (platform) {
      case 'github':
        this.deployToGitHub();
        break;
      case 'netlify':
        this.deployToNetlify();
        break;
      case 'vercel':
        this.deployToVercel();
        break;
      case 'manual':
        this.manualDeploy();
        break;
    }
  }

  deployToGitHub() {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
      <div class="modal-container" style="max-width: 600px;">
        <div class="modal-header">
          <h2>🐙 GitHub Pages Deploy</h2>
          <button class="modal-close" id="ghDeployClose">&times;</button>
        </div>
        <div class="modal-body">
          <div style="margin-bottom: 20px;">
            <h3 style="margin-bottom: 10px;">Krok 1: Vytvořte GitHub repozitář</h3>
            <ol style="line-height: 1.8; color: var(--text-secondary);">
              <li>Přejděte na <a href="https://github.com/new" target="_blank" style="color: var(--primary-color);">github.com/new</a></li>
              <li>Vytvořte nový repozitář (může být public nebo private)</li>
              <li>Neklikejte na "Initialize repository"</li>
            </ol>
          </div>

          <div style="margin-bottom: 20px;">
            <h3 style="margin-bottom: 10px;">Krok 2: Nahrajte soubory</h3>
            <button id="downloadForGH" class="btn-primary" style="width: 100%; padding: 12px; background: var(--primary-color); color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: bold; margin-bottom: 10px;">
              📦 Stáhnout projekt jako ZIP
            </button>
            <p style="font-size: 14px; color: var(--text-secondary);">
              Rozbalte ZIP a nahrajte soubory do vašeho repozitáře přes "Upload files"
            </p>
          </div>

          <div style="margin-bottom: 20px;">
            <h3 style="margin-bottom: 10px;">Krok 3: Aktivujte GitHub Pages</h3>
            <ol style="line-height: 1.8; color: var(--text-secondary);">
              <li>Jděte do Settings > Pages</li>
              <li>V "Source" vyberte "main" branch</li>
              <li>Klikněte na Save</li>
              <li>Za chvíli bude vaše stránka dostupná na URL, která se zobrazí</li>
            </ol>
          </div>

          <div style="padding: 15px; background: var(--bg-secondary); border-radius: 8px; font-size: 13px;">
            <strong>💡 Tip:</strong> GitHub Pages může trvat 1-2 minuty, než se stránka publikuje.
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    modal.querySelector('#ghDeployClose').addEventListener('click', () => modal.remove());
    modal.querySelector('#downloadForGH').addEventListener('click', () => {
      this.exportAsZip();
      modal.remove();
    });
    modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.remove();
    });
  }

  deployToNetlify() {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
      <div class="modal-container" style="max-width: 600px;">
        <div class="modal-header">
          <h2>🌐 Netlify Deploy</h2>
          <button class="modal-close" id="netlifyDeployClose">&times;</button>
        </div>
        <div class="modal-body">
          <div style="margin-bottom: 20px;">
            <h3 style="margin-bottom: 10px;">Metoda 1: Drag & Drop (Nejjednodušší)</h3>
            <ol style="line-height: 1.8; color: var(--text-secondary);">
              <li>Stáhněte projekt jako ZIP (tlačítko níže)</li>
              <li>Rozbalte ZIP složku</li>
              <li>Jděte na <a href="https://app.netlify.com/drop" target="_blank" style="color: var(--primary-color);">app.netlify.com/drop</a></li>
              <li>Přetáhněte rozbalenou složku do okna prohlížeče</li>
              <li>Váš web je okamžitě online! 🎉</li>
            </ol>
            <button id="downloadForNetlify" class="btn-primary" style="width: 100%; padding: 12px; background: var(--primary-color); color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: bold; margin-top: 10px;">
              📦 Stáhnout projekt jako ZIP
            </button>
          </div>

          <div style="margin-bottom: 20px; padding-top: 20px; border-top: 1px solid var(--border-color);">
            <h3 style="margin-bottom: 10px;">Metoda 2: Z GitHub repozitáře</h3>
            <ol style="line-height: 1.8; color: var(--text-secondary);">
              <li>Nahrajte projekt na GitHub</li>
              <li>Přihlaste se na <a href="https://app.netlify.com" target="_blank" style="color: var(--primary-color);">Netlify</a></li>
              <li>Klikněte na "New site from Git"</li>
              <li>Propojte GitHub a vyberte repozitář</li>
              <li>Deploy proběhne automaticky při každém commitu</li>
            </ol>
          </div>

          <div style="padding: 15px; background: var(--bg-secondary); border-radius: 8px; font-size: 13px;">
            <strong>💡 Výhody Netlify:</strong> Automatické HTTPS, globální CDN, okamžitý deploy
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    modal.querySelector('#netlifyDeployClose').addEventListener('click', () => modal.remove());
    modal.querySelector('#downloadForNetlify').addEventListener('click', () => {
      this.exportAsZip();
      eventBus.emit('toast:show', {
        message: '📦 Otevírám Netlify Drop...',
        type: 'info',
        duration: 2000
      });
      setTimeout(() => {
        window.open('https://app.netlify.com/drop', '_blank');
      }, 1000);
      modal.remove();
    });
    modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.remove();
    });
  }

  deployToVercel() {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
      <div class="modal-container" style="max-width: 600px;">
        <div class="modal-header">
          <h2>▲ Vercel Deploy</h2>
          <button class="modal-close" id="vercelDeployClose">&times;</button>
        </div>
        <div class="modal-body">
          <div style="margin-bottom: 20px;">
            <h3 style="margin-bottom: 10px;">Deploy pomocí Vercel CLI</h3>
            <ol style="line-height: 1.8; color: var(--text-secondary);">
              <li>Stáhněte projekt jako ZIP a rozbalte ho</li>
              <li>Nainstalujte Vercel CLI:
                <pre style="background: var(--bg-secondary); padding: 10px; border-radius: 4px; margin: 10px 0; overflow-x: auto;"><code>npm i -g vercel</code></pre>
              </li>
              <li>V terminálu přejděte do složky projektu</li>
              <li>Spusťte:
                <pre style="background: var(--bg-secondary); padding: 10px; border-radius: 4px; margin: 10px 0; overflow-x: auto;"><code>vercel</code></pre>
              </li>
              <li>Postupujte podle instrukcí v terminálu</li>
            </ol>
            <button id="downloadForVercel" class="btn-primary" style="width: 100%; padding: 12px; background: var(--primary-color); color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: bold; margin-top: 10px;">
              📦 Stáhnout projekt jako ZIP
            </button>
          </div>

          <div style="margin-bottom: 20px; padding-top: 20px; border-top: 1px solid var(--border-color);">
            <h3 style="margin-bottom: 10px;">Deploy z GitHub</h3>
            <ol style="line-height: 1.8; color: var(--text-secondary);">
              <li>Nahrajte projekt na GitHub</li>
              <li>Přihlaste se na <a href="https://vercel.com/new" target="_blank" style="color: var(--primary-color);">vercel.com/new</a></li>
              <li>Importujte GitHub repozitář</li>
              <li>Vercel automaticky detekuje nastavení</li>
              <li>Klikněte na Deploy</li>
            </ol>
          </div>

          <div style="padding: 15px; background: var(--bg-secondary); border-radius: 8px; font-size: 13px;">
            <strong>💡 Vercel je ideální pro:</strong> Next.js, React, Vue, Svelte a další moderní frameworky
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    modal.querySelector('#vercelDeployClose').addEventListener('click', () => modal.remove());
    modal.querySelector('#downloadForVercel').addEventListener('click', () => {
      this.exportAsZip();
      modal.remove();
    });
    modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.remove();
    });
  }

  manualDeploy() {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
      <div class="modal-container" style="max-width: 600px;">
        <div class="modal-header">
          <h2>📦 Manuální Deploy</h2>
          <button class="modal-close" id="manualDeployClose">&times;</button>
        </div>
        <div class="modal-body">
          <div style="margin-bottom: 20px;">
            <h3 style="margin-bottom: 10px;">Postup:</h3>
            <ol style="line-height: 1.8; color: var(--text-secondary);">
              <li>Stáhněte projekt jako ZIP (tlačítko níže)</li>
              <li>Rozbalte ZIP složku</li>
              <li>Nahrajte soubory na váš hosting pomocí FTP/SFTP</li>
              <li>Nebo použijte cPanel File Manager</li>
            </ol>
          </div>

          <button id="downloadManual" class="btn-primary" style="width: 100%; padding: 12px; background: var(--primary-color); color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: bold; margin-bottom: 20px;">
            📦 Stáhnout projekt jako ZIP
          </button>

          <div style="padding-top: 20px; border-top: 1px solid var(--border-color);">
            <h3 style="margin-bottom: 10px;">Oblíbené FTP klienty:</h3>
            <ul style="line-height: 1.8; color: var(--text-secondary);">
              <li><strong>FileZilla</strong> - zdarma pro Windows/Mac/Linux</li>
              <li><strong>Cyberduck</strong> - zdarma pro Mac/Windows</li>
              <li><strong>WinSCP</strong> - zdarma pro Windows</li>
            </ul>
          </div>

          <div style="margin-top: 20px; padding: 15px; background: var(--bg-secondary); border-radius: 8px; font-size: 13px;">
            <strong>💡 Tip:</strong> Ujistěte se, že nahráváte soubory do správné složky (obvykle <code>public_html</code> nebo <code>www</code>)
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    modal.querySelector('#manualDeployClose').addEventListener('click', () => modal.remove());
    modal.querySelector('#downloadManual').addEventListener('click', () => {
      this.exportAsZip();
      modal.remove();
    });
    modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.remove();
    });
  }

  showAISettings() {
    const modal = document.createElement('div');
    modal.className = 'modal-backdrop';
    modal.style.opacity = '1';
    modal.innerHTML = `
      <div class="modal-container" style="max-width: 1100px; max-height: 90vh; overflow-y: auto; background: var(--bg-primary); border: 1px solid var(--border-color); border-radius: 16px;">
        <div class="modal-header" style="background: var(--bg-secondary); border-bottom: 1px solid var(--border-color);">
          <h2 style="color: var(--text-primary);">🤖 Nastavení AI</h2>
          <button class="modal-close" id="aiSettingsClose" style="color: var(--text-primary);">&times;</button>
        </div>
        <div class="modal-body" style="padding: 24px;">

          <!-- Provider tabs -->
          <div class="ai-settings-card" style="background: var(--bg-secondary); border-radius: 16px; padding: 20px; margin-bottom: 20px; border: 1px solid var(--border-color);">
            <div style="font-size: 14px; color: var(--text-secondary); margin-bottom: 16px; display: flex; align-items: center; gap: 8px;">
              <span style="font-size: 18px;">🔧</span>
              <span>Vyber AI Providera</span>
            </div>

            <div class="provider-tabs" style="display: flex; gap: 8px; margin-bottom: 20px; flex-wrap: wrap;">
              <button class="provider-tab active" data-provider="gemini" style="padding: 12px 20px; background: linear-gradient(135deg, #3b82f6, #8b5cf6); border: 1px solid transparent; border-radius: 12px; cursor: pointer; font-size: 14px; display: flex; align-items: center; gap: 8px; color: white; transition: all 0.2s;">
                <span style="font-size: 18px;">💎</span> Google Gemini
              </button>
              <button class="provider-tab" data-provider="groq" style="padding: 12px 20px; background: var(--bg-tertiary); border: 1px solid var(--border-color); border-radius: 12px; cursor: pointer; font-size: 14px; display: flex; align-items: center; gap: 8px; color: var(--text-primary); transition: all 0.2s;">
                <span style="font-size: 18px;">⚡</span> Groq
              </button>
              <button class="provider-tab" data-provider="openrouter" style="padding: 12px 20px; background: var(--bg-tertiary); border: 1px solid var(--border-color); border-radius: 12px; cursor: pointer; font-size: 14px; display: flex; align-items: center; gap: 8px; color: var(--text-primary); transition: all 0.2s;">
                <span style="font-size: 18px;">🌐</span> OpenRouter
              </button>
              <button class="provider-tab" data-provider="mistral" style="padding: 12px 20px; background: var(--bg-tertiary); border: 1px solid var(--border-color); border-radius: 12px; cursor: pointer; font-size: 14px; display: flex; align-items: center; gap: 8px; color: var(--text-primary); transition: all 0.2s;">
                <span style="font-size: 18px;">🔥</span> Mistral
              </button>
              <button class="provider-tab" data-provider="cohere" style="padding: 12px 20px; background: var(--bg-tertiary); border: 1px solid var(--border-color); border-radius: 12px; cursor: pointer; font-size: 14px; display: flex; align-items: center; gap: 8px; color: var(--text-primary); transition: all 0.2s;">
                <span style="font-size: 18px;">🧬</span> Cohere
              </button>
              <button class="provider-tab" data-provider="huggingface" style="padding: 12px 20px; background: var(--bg-tertiary); border: 1px solid var(--border-color); border-radius: 12px; cursor: pointer; font-size: 14px; display: flex; align-items: center; gap: 8px; color: var(--text-primary); transition: all 0.2s;">
                <span style="font-size: 18px;">🤗</span> HuggingFace
              </button>
            </div>

            <!-- Model selection -->
            <div class="model-section" style="display: grid; grid-template-columns: 1fr auto; gap: 15px; align-items: end; margin-bottom: 20px;">
              <div>
                <label style="display: block; font-size: 12px; color: var(--text-secondary); margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600;">Model</label>
                <select id="aiModelSelect" style="width: 100%; padding: 12px 14px; border: 1px solid var(--border-color); border-radius: 10px; font-size: 14px;">
                  <option value="">Načítání...</option>
                </select>
              </div>
              <div class="model-info" style="background: rgba(59, 130, 246, 0.1); border: 1px solid rgba(59, 130, 246, 0.3); border-radius: 10px; padding: 12px 16px; font-size: 12px; color: #3b82f6; white-space: nowrap;">
                <div style="font-size: 20px; font-weight: bold; color: #3b82f6;" id="modelRPM">15 RPM</div>
                <div>Rychlost</div>
              </div>
            </div>

            <!-- API Keys section -->
            <div style="margin-bottom: 16px;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                <label style="display: block; font-size: 12px; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600;">API Klíče (všichni provideři)</label>
              </div>
              <div class="keys-grid" id="keysGridAll" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 10px; margin-bottom: 16px;">
                <div class="key-input-group">
                  <label style="display: block; font-size: 12px; color: var(--text-secondary); margin-bottom: 4px;">💎 Gemini</label>
                  <div style="display: flex; gap: 4px;">
                    <input type="password" id="keyGemini" placeholder="AIza..." style="flex: 1; padding: 10px 36px 10px 12px; background: var(--bg-tertiary); border: 1px solid var(--border-color); border-radius: 8px; color: var(--text-primary); font-size: 13px;">
                    <button class="key-library-btn" data-provider="gemini" title="Knihovna klíčů" style="width: 36px; height: 36px; padding: 0; background: var(--bg-tertiary); border: 1px solid var(--border-color); border-radius: 8px; cursor: pointer; font-size: 16px; transition: all 0.2s;">📚</button>
                  </div>
                  <span class="key-status" id="statusGemini" style="position: absolute; right: 48px; top: 32px; font-size: 16px;">○</span>
                </div>
                <div class="key-input-group">
                  <label style="display: block; font-size: 12px; color: var(--text-secondary); margin-bottom: 4px;">⚡ Groq</label>
                  <div style="display: flex; gap: 4px;">
                    <input type="password" id="keyGroq" placeholder="gsk_..." style="flex: 1; padding: 10px 36px 10px 12px; background: var(--bg-tertiary); border: 1px solid var(--border-color); border-radius: 8px; color: var(--text-primary); font-size: 13px;">
                    <button class="key-library-btn" data-provider="groq" title="Knihovna klíčů" style="width: 36px; height: 36px; padding: 0; background: var(--bg-tertiary); border: 1px solid var(--border-color); border-radius: 8px; cursor: pointer; font-size: 16px; transition: all 0.2s;">📚</button>
                  </div>
                  <span class="key-status" id="statusGroq" style="position: absolute; right: 48px; top: 32px; font-size: 16px;">○</span>
                </div>
                <div class="key-input-group">
                  <label style="display: block; font-size: 12px; color: var(--text-secondary); margin-bottom: 4px;">🌐 OpenRouter</label>
                  <div style="display: flex; gap: 4px;">
                    <input type="password" id="keyOpenRouter" placeholder="sk-or-..." style="flex: 1; padding: 10px 36px 10px 12px; background: var(--bg-tertiary); border: 1px solid var(--border-color); border-radius: 8px; color: var(--text-primary); font-size: 13px;">
                    <button class="key-library-btn" data-provider="openrouter" title="Knihovna klíčů" style="width: 36px; height: 36px; padding: 0; background: var(--bg-tertiary); border: 1px solid var(--border-color); border-radius: 8px; cursor: pointer; font-size: 16px; transition: all 0.2s;">📚</button>
                  </div>
                  <span class="key-status" id="statusOpenRouter" style="position: absolute; right: 48px; top: 32px; font-size: 16px;">○</span>
                </div>
                <div class="key-input-group">
                  <label style="display: block; font-size: 12px; color: var(--text-secondary); margin-bottom: 4px;">🔥 Mistral</label>
                  <div style="display: flex; gap: 4px;">
                    <input type="password" id="keyMistral" placeholder="..." style="flex: 1; padding: 10px 36px 10px 12px; background: var(--bg-tertiary); border: 1px solid var(--border-color); border-radius: 8px; color: var(--text-primary); font-size: 13px;">
                    <button class="key-library-btn" data-provider="mistral" title="Knihovna klíčů" style="width: 36px; height: 36px; padding: 0; background: var(--bg-tertiary); border: 1px solid var(--border-color); border-radius: 8px; cursor: pointer; font-size: 16px; transition: all 0.2s;">📚</button>
                  </div>
                  <span class="key-status" id="statusMistral" style="position: absolute; right: 48px; top: 32px; font-size: 16px;">○</span>
                </div>
                <div class="key-input-group">
                  <label style="display: block; font-size: 12px; color: var(--text-secondary); margin-bottom: 4px;">🧬 Cohere</label>
                  <div style="display: flex; gap: 4px;">
                    <input type="password" id="keyCohere" placeholder="..." style="flex: 1; padding: 10px 36px 10px 12px; background: var(--bg-tertiary); border: 1px solid var(--border-color); border-radius: 8px; color: var(--text-primary); font-size: 13px;">
                    <button class="key-library-btn" data-provider="cohere" title="Knihovna klíčů" style="width: 36px; height: 36px; padding: 0; background: var(--bg-tertiary); border: 1px solid var(--border-color); border-radius: 8px; cursor: pointer; font-size: 16px; transition: all 0.2s;">📚</button>
                  </div>
                  <span class="key-status" id="statusCohere" style="position: absolute; right: 48px; top: 32px; font-size: 16px;">○</span>
                </div>
                <div class="key-input-group">
                  <label style="display: block; font-size: 12px; color: var(--text-secondary); margin-bottom: 4px;">🤗 HuggingFace</label>
                  <div style="display: flex; gap: 4px;">
                    <input type="password" id="keyHuggingFace" placeholder="hf_..." style="flex: 1; padding: 10px 36px 10px 12px; background: var(--bg-tertiary); border: 1px solid var(--border-color); border-radius: 8px; color: var(--text-primary); font-size: 13px;">
                    <button class="key-library-btn" data-provider="huggingface" title="Knihovna klíčů" style="width: 36px; height: 36px; padding: 0; background: var(--bg-tertiary); border: 1px solid var(--border-color); border-radius: 8px; cursor: pointer; font-size: 16px; transition: all 0.2s;">📚</button>
                  </div>
                  <span class="key-status" id="statusHuggingFace" style="position: absolute; right: 48px; top: 32px; font-size: 16px;">○</span>
                </div>
              </div>
              <div style="margin-bottom: 12px; font-size: 11px; color: var(--text-secondary);">
                ■ = vlastní klíč | △ = demo klíč | ○ = žádný klíč
              </div>
              <!-- API Keys Summary -->
              <div id="keySummary" style="margin-bottom: 12px; padding: 8px 12px; background: rgba(245, 158, 11, 0.1); border: 1px solid rgba(245, 158, 11, 0.3); border-radius: 8px; font-size: 12px; color: var(--text-primary); display: none;">
                <span id="keySummaryText"></span>
              </div>
              <div style="display: flex; gap: 10px; flex-wrap: wrap;">
                <button id="saveKeysBtn" style="padding: 10px 20px; background: linear-gradient(135deg, #22c55e, #16a34a); color: white; border: none; border-radius: 10px; cursor: pointer; font-size: 14px; font-weight: 500; transition: all 0.2s;">
                  💾 Uložit klíče
                </button>
                <button id="loadAllDemoKeysBtn" style="padding: 10px 20px; background: linear-gradient(135deg, #f59e0b, #d97706); color: white; border: none; border-radius: 10px; cursor: pointer; font-size: 14px; font-weight: 500; transition: all 0.2s;">
                  🔄 Obnovit demo klíče
                </button>
                <button id="exportTxtBtn" style="padding: 10px 20px; background: var(--bg-tertiary); color: var(--text-primary); border: 1px solid var(--border-color); border-radius: 10px; cursor: pointer; font-size: 14px; transition: all 0.2s;">
                  📄 Export TXT
                </button>
                <button id="importTxtBtn" style="padding: 10px 20px; background: var(--bg-tertiary); color: var(--text-primary); border: 1px solid var(--border-color); border-radius: 10px; cursor: pointer; font-size: 14px; transition: all 0.2s;">
                  📂 Import TXT
                </button>
                <button id="exportKeysBtn" style="padding: 10px 20px; background: var(--bg-tertiary); color: var(--text-primary); border: 1px solid var(--border-color); border-radius: 10px; cursor: pointer; font-size: 14px; transition: all 0.2s;">
                  📥 Export JSON
                </button>
                <button id="apiHelpBtn" style="padding: 10px 20px; background: linear-gradient(135deg, #3b82f6, #8b5cf6); color: white; border: 1px solid transparent; border-radius: 10px; cursor: pointer; font-size: 14px; transition: all 0.2s; box-shadow: 0 2px 8px rgba(59, 130, 246, 0.3);">
                  ❓ Nápověda API
                </button>
              </div>
              <input type="file" id="importTxtInput" accept=".txt" style="display: none;">
            </div>
          </div>

          <!-- Chat Box -->
          <div class="ai-settings-card" style="background: var(--bg-secondary); border-radius: 16px; padding: 20px; margin-bottom: 20px; border: 1px solid var(--border-color);">
            <div style="font-size: 14px; color: var(--text-secondary); margin-bottom: 16px; display: flex; align-items: center; gap: 8px;">
              <span style="font-size: 18px;">💬</span>
              <span>Test Chat</span>
            </div>

            <div id="chatMessages" style="background: var(--bg-tertiary); border-radius: 10px; padding: 15px; min-height: 200px; max-height: 300px; overflow-y: auto; margin-bottom: 12px; font-size: 13px; line-height: 1.6;">
              <div style="text-align: center; color: var(--text-secondary); padding: 40px; font-style: italic;">
                Začni konverzaci...
              </div>
            </div>

            <div style="display: flex; gap: 10px;">
              <textarea id="chatInput" placeholder="Napiš zprávu..." style="flex: 1; min-height: 60px; max-height: 120px; resize: vertical; padding: 12px; background: var(--bg-tertiary); border: 1px solid var(--border-color); border-radius: 10px; color: var(--text-primary); font-size: 14px; font-family: inherit;"></textarea>
              <button id="chatSendBtn" style="padding: 0 24px; background: linear-gradient(135deg, #3b82f6, #2563eb); color: white; border: none; border-radius: 10px; cursor: pointer; font-size: 20px; transition: all 0.2s;">
                📤
              </button>
            </div>

            <!-- Chat controls -->
            <div style="display: flex; gap: 8px; margin-top: 10px; flex-wrap: wrap;">
              <button id="streamModeBtn" style="padding: 6px 12px; background: var(--bg-tertiary); border: 1px solid var(--border-color); border-radius: 8px; cursor: pointer; font-size: 12px; color: var(--text-primary); transition: all 0.2s;">
                📡 Stream
              </button>
              <button id="retryBtn" style="padding: 6px 12px; background: var(--bg-tertiary); border: 1px solid var(--border-color); border-radius: 8px; cursor: pointer; font-size: 12px; color: var(--text-primary); transition: all 0.2s;">
                🔄 Retry
              </button>
              <button id="clearChatBtn" style="padding: 6px 12px; background: rgba(239, 68, 68, 0.2); color: #ef4444; border: 1px solid rgba(239, 68, 68, 0.3); border-radius: 8px; cursor: pointer; font-size: 12px; transition: all 0.2s;">
                🧹 Vyčistit
              </button>
              <button id="uploadFileBtn" style="padding: 6px 12px; background: var(--bg-tertiary); border: 1px solid var(--border-color); border-radius: 8px; cursor: pointer; font-size: 12px; color: var(--text-primary); transition: all 0.2s;">
                📎 Přiložit soubor
              </button>
            </div>

            <!-- Token counter -->
            <div style="margin-top: 8px; font-size: 11px; color: var(--text-secondary); display: flex; justify-content: space-between; align-items: center;">
              <span id="tokenCount">~0 tokenů</span>
              <span id="chatStatus" style="color: #22c55e;">● Připraven</span>
            </div>

            <!-- File upload (hidden) -->
            <input type="file" id="fileUploadInput" style="display: none;" accept="image/*,text/*,.json,.md,.csv,.txt">

            <!-- File preview -->
            <div id="filePreview" style="display: none; margin-top: 10px; background: rgba(139, 92, 246, 0.1); border: 1px solid rgba(139, 92, 246, 0.3); border-radius: 8px; padding: 10px;">
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <div style="display: flex; align-items: center; gap: 8px;">
                  <span id="fileIcon" style="font-size: 20px;">📎</span>
                  <div>
                    <div id="fileName" style="font-size: 12px; color: var(--text-primary);"></div>
                    <div id="fileSize" style="font-size: 10px; color: var(--text-secondary);"></div>
                  </div>
                </div>
                <button id="removeFileBtn" style="padding: 4px 8px; background: rgba(239, 68, 68, 0.2); border: 1px solid rgba(239, 68, 68, 0.3); border-radius: 6px; cursor: pointer; font-size: 11px; color: #ef4444;">
                  ✕ Odebrat
                </button>
              </div>
              <img id="filePreviewImg" style="display: none; max-width: 200px; max-height: 150px; border-radius: 6px; margin-top: 8px;">
            </div>
          </div>

          <!-- Historie chatu -->
          <div class="ai-settings-card" style="background: var(--bg-secondary); border-radius: 16px; padding: 20px; border: 1px solid var(--border-color);">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; cursor: pointer;" id="historyToggleHeader">
              <div style="font-size: 14px; color: var(--text-secondary); display: flex; align-items: center; gap: 8px;">
                <span style="font-size: 18px;">📜</span>
                <span>Historie chatu</span>
              </div>
              <span style="transition: transform 0.3s;" id="historyArrow">▼</span>
            </div>

            <div id="historyContent" style="max-height: 0; overflow: hidden; transition: max-height 0.3s ease;">
              <div id="chatHistory" style="max-height: 300px; overflow-y: auto; margin-bottom: 12px;">
                <div style="text-align: center; color: var(--text-secondary); padding: 20px; font-style: italic;">
                  Zatím žádná historie...
                </div>
              </div>
              <div style="display: flex; gap: 10px; flex-wrap: wrap;">
                <button id="clearHistoryBtn" style="padding: 8px 16px; background: rgba(239, 68, 68, 0.2); color: #ef4444; border: 1px solid rgba(239, 68, 68, 0.3); border-radius: 8px; cursor: pointer; font-size: 13px; transition: all 0.2s;">
                  🗑️ Smazat historii
                </button>
                <button id="exportHistoryBtn" style="padding: 8px 16px; background: var(--bg-tertiary); color: var(--text-primary); border: 1px solid var(--border-color); border-radius: 8px; cursor: pointer; font-size: 13px; transition: all 0.2s;">
                  📥 Export
                </button>
              </div>
            </div>
          </div>

          <!-- Model Ranking Card -->
          <div class="ai-settings-card" style="background: var(--bg-secondary); border-radius: 16px; padding: 20px; margin-bottom: 20px; border: 1px solid var(--border-color);">
            <div style="font-size: 14px; color: var(--text-secondary); margin-bottom: 16px; display: flex; align-items: center; gap: 8px; justify-content: space-between;">
              <div style="display: flex; align-items: center; gap: 8px;">
                <span style="font-size: 18px;">🏆</span>
                <span>Pořadí AI Modelů (od nejlepších)</span>
              </div>
              <button id="editRankingBtn" style="padding: 6px 12px; background: var(--bg-tertiary); border: 1px solid var(--border-color); border-radius: 8px; cursor: pointer; font-size: 12px; color: var(--text-primary); transition: all 0.2s;">
                ✏️ Upravit
              </button>
            </div>

            <div id="rankingDisplay" style="background: var(--bg-tertiary); border-radius: 10px; padding: 16px; max-height: 400px; overflow-y: auto;">
              <!-- Ranking list will be rendered here -->
            </div>

            <!-- Edit modal for ranking -->
            <div id="rankingEditModal" style="display: none; margin-top: 16px; background: var(--bg-tertiary); border-radius: 10px; padding: 16px; border: 2px solid #3b82f6;">
              <div style="font-size: 13px; color: var(--text-secondary); margin-bottom: 12px;">
                Upravte pořadí modelů přetažením nebo použijte tlačítka ▲▼. Modely nahoře jsou považovány za nejlepší.
              </div>
              <div id="rankingEditList" style="max-height: 300px; overflow-y: auto;">
                <!-- Editable ranking list -->
              </div>
              <div style="display: flex; gap: 10px; margin-top: 12px;">
                <button id="saveRankingBtn" style="padding: 8px 16px; background: linear-gradient(135deg, #22c55e, #16a34a); color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 13px; font-weight: 500;">
                  💾 Uložit pořadí
                </button>
                <button id="resetRankingBtn" style="padding: 8px 16px; background: rgba(239, 68, 68, 0.2); color: #ef4444; border: 1px solid rgba(239, 68, 68, 0.3); border-radius: 8px; cursor: pointer; font-size: 13px;">
                  🔄 Reset na výchozí
                </button>
                <button id="cancelRankingBtn" style="padding: 8px 16px; background: var(--bg-secondary); color: var(--text-primary); border: 1px solid var(--border-color); border-radius: 8px; cursor: pointer; font-size: 13px;">
                  ✖️ Zrušit
                </button>
              </div>
            </div>
          </div>

          <!-- Advanced Testing Card -->
          <div class="ai-settings-card" style="background: var(--bg-secondary); border-radius: 16px; padding: 20px; margin-bottom: 20px; border: 1px solid var(--border-color);">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; cursor: pointer;" id="advancedToggleHeader">
              <div style="font-size: 14px; color: var(--text-secondary); display: flex; align-items: center; gap: 8px;">
                <span style="font-size: 18px;">🔧</span>
                <span>Pokročilé testování</span>
              </div>
              <span style="transition: transform 0.3s;" id="advancedArrow">▼</span>
            </div>

            <div id="advancedContent" style="max-height: 0; overflow: hidden; transition: max-height 0.3s ease;">
              <div style="display: flex; gap: 10px; flex-wrap: wrap; margin-bottom: 12px;">
                <button id="testFallbackBtn" style="padding: 10px 16px; background: var(--bg-tertiary); border: 1px solid var(--border-color); border-radius: 8px; cursor: pointer; font-size: 13px; color: var(--text-primary); transition: all 0.2s;">
                  🎯 Test Fallback
                </button>
                <button id="testAllModelsBtn" style="padding: 10px 16px; background: var(--bg-tertiary); border: 1px solid var(--border-color); border-radius: 8px; cursor: pointer; font-size: 13px; color: var(--text-primary); transition: all 0.2s;">
                  🧪 Test všech modelů
                </button>
                <button id="compareModelsBtn" style="padding: 10px 16px; background: var(--bg-tertiary); border: 1px solid var(--border-color); border-radius: 8px; cursor: pointer; font-size: 13px; color: var(--text-primary); transition: all 0.2s;">
                  ⚖️ Porovnat modely
                </button>
                <button id="fetchModelsBtn" style="padding: 10px 16px; background: var(--bg-tertiary); border: 1px solid var(--border-color); border-radius: 8px; cursor: pointer; font-size: 13px; color: var(--text-primary); transition: all 0.2s;">
                  🔍 Zjistit dostupné modely
                </button>
              </div>

              <div style="font-size: 11px; color: var(--text-secondary); line-height: 1.6;">
                <strong>Fallback:</strong> Zkouší všechny providery dokud nenajde funkční<br>
                <strong>Test všech:</strong> Otestuje všechny modely s daným promptem<br>
                <strong>Porovnat:</strong> Paralelní porovnání vybraných modelů<br>
                <strong>Zjistit:</strong> Načte nové modely z API providerů
              </div>
            </div>
          </div>

          <!-- Info card -->
          <div style="background: rgba(59, 130, 246, 0.1); border: 1px solid rgba(59, 130, 246, 0.3); border-radius: 12px; padding: 16px; font-size: 13px; color: var(--text-primary); margin-top: 20px;">
            <div style="font-weight: bold; margin-bottom: 8px; color: var(--text-primary);">💡 Tipy:</div>
            <ul style="margin: 0; padding-left: 20px; line-height: 1.8; color: var(--text-primary);">
              <li>API klíče jsou uloženy lokálně ve vašem prohlížeči</li>
              <li>Pro Gemini získáte klíč zdarma na <a href="https://makersuite.google.com/app/apikey" target="_blank" style="color: #3b82f6; text-decoration: underline;">Google AI Studio</a></li>
              <li>Demo klíče jsou určené pouze pro testování a mají omezený počet volání</li>
              <li>Test chat používá aktuálně vybraný provider a model</li>
              <li>Pořadí modelů určuje, které budou upřednostňovány při automatickém výběru</li>
              <li>Stream mode zobrazuje odpověď průběžně, Retry opakuje poslední dotaz</li>
              <li>Můžete přikládat obrázky (Vision modely) a textové soubory</li>
            </ul>
          </div>

        </div>
      </div>
    `;

    document.body.appendChild(modal);

    // State
    let currentProvider = 'gemini';
    let providers = {};
    let chatHistory = JSON.parse(localStorage.getItem('ai_chat_history') || '[]');
    let currentConversation = [];

    // DEMO KEYS from AI module (rozdělené pro GitHub)
    const DEMO_KEYS = {
      gemini: "AIzaSyCXuMvhO_senLS" + "oA_idEuBk_EwnMmIPIhg",
      groq: "gsk_0uZbn9KqiBa3Zsl11ACX" + "WGdyb3FYZddvc6oPIn9HTvJpGgoBbYrJ",
      openrouter: "sk-or-v1-bff66ee4a0845f88" + "428b75d91a35aea63e355a52dc31e6427fcc1f9536c2a8a3",
      mistral: "Tvwm0qcQk71vsUDw" + "VfAAAY5GPKdbvlHj",
      cohere: "PeJo8cQwftoZI1Dob0qK" + "1lN445FlOjrfFA3piEuh",
      huggingface: "hf_UhezIpnumnYWSacKLtja" + "VPfXMxbFemUyMv"
    };

    // Default Model Ranking (od nejlepších k nejhorším)
    const DEFAULT_MODEL_RANKING = [
      // Premium tier


      // Best FREE models
      'gemini/gemini-2.5-pro',
      'gemini/gemini-2.5-flash',
      'groq/llama-3.3-70b-versatile',
      'openrouter/deepseek/deepseek-r1-0528:free',
      'openrouter/xiaomi/mimo-v2-flash:free',

      // Coding specialists
      'openrouter/mistralai/devstral-2512:free',
      'openrouter/qwen/qwen3-coder:free',
      'mistral/codestral-latest',

      // Good general purpose FREE
      'groq/llama-3.1-8b-instant',
      'gemini/gemini-2.0-flash',
      'openrouter/meta-llama/llama-3.3-70b-instruct:free',
      'cohere/command-r-plus',

      // Multimodal
      'gemini/gemini-3-flash-preview',
      'openrouter/nvidia/nemotron-nano-12b-v2-vl:free',

      // Specialized
      'groq/whisper-large-v3-turbo',
      'cohere/embed-multilingual-v3.0',

      // Budget options
      'groq/mixtral-8x7b-32768',
      'mistral/open-mistral-7b',
      'huggingface/meta-llama/Llama-3.2-3B-Instruct'
    ];

    // Load or initialize model ranking
    let modelRanking = JSON.parse(localStorage.getItem('ai_model_ranking') || 'null') || [...DEFAULT_MODEL_RANKING];

    // ⚠️ DŮLEŽITÉ: Vždy používat data z AI modulu (single source of truth)
    // Pokud AI modul není načten, zobrazit chybu
    if (typeof window.AI === 'undefined' || !window.AI.getAllProvidersWithModels) {
      console.error('❌ AI modul není načten! Zkontrolujte, zda je ai_module.js správně načten v HTML.');
      eventBus.emit('toast:show', {
        message: '⚠️ AI modul není načten. Obnovte stránku.',
        type: 'error',
        duration: 5000
      });
      return;
    }

    // Načíst providery a modely z AI modulu
    providers = window.AI.getAllProvidersWithModels();

    // Get elements
    const providerTabs = modal.querySelectorAll('.provider-tab');
    const modelSelect = modal.querySelector('#aiModelSelect');
    const modelRPM = modal.querySelector('#modelRPM');
    const chatMessages = modal.querySelector('#chatMessages');
    const chatInput = modal.querySelector('#chatInput');
    const chatSendBtn = modal.querySelector('#chatSendBtn');
    const historyContent = modal.querySelector('#historyContent');
    const historyArrow = modal.querySelector('#historyArrow');
    const chatHistoryEl = modal.querySelector('#chatHistory');

    // New control elements
    const streamModeBtn = modal.querySelector('#streamModeBtn');
    const retryBtn = modal.querySelector('#retryBtn');
    const clearChatBtn = modal.querySelector('#clearChatBtn');
    const uploadFileBtn = modal.querySelector('#uploadFileBtn');
    const removeFileBtn = modal.querySelector('#removeFileBtn');
    const fileUploadInput = modal.querySelector('#fileUploadInput');
    const filePreview = modal.querySelector('#filePreview');
    const tokenCount = modal.querySelector('#tokenCount');
    const chatStatus = modal.querySelector('#chatStatus');

    // Advanced testing elements
    const advancedToggleHeader = modal.querySelector('#advancedToggleHeader');
    const advancedContent = modal.querySelector('#advancedContent');
    const advancedArrow = modal.querySelector('#advancedArrow');
    const testFallbackBtn = modal.querySelector('#testFallbackBtn');
    const testAllModelsBtn = modal.querySelector('#testAllModelsBtn');
    const compareModelsBtn = modal.querySelector('#compareModelsBtn');
    const fetchModelsBtn = modal.querySelector('#fetchModelsBtn');

    // Provider tab switching
    const switchProvider = async (provider) => {
      currentProvider = provider;

      // Update tab styles
      providerTabs.forEach(tab => {
        if (tab.dataset.provider === provider) {
          tab.style.background = 'linear-gradient(135deg, #3b82f6, #8b5cf6)';
          tab.style.borderColor = 'transparent';
          tab.style.color = 'white';
          tab.classList.add('active');
        } else {
          tab.style.background = 'var(--bg-tertiary)';
          tab.style.borderColor = 'var(--border-color)';
          tab.style.color = 'var(--text-primary)';
          tab.classList.remove('active');
        }
      });

      // Update models (with async RPM check)
      await updateModels();
    };

    const updateModels = async () => {
      const providerData = providers[currentProvider];
      if (providerData && providerData.models) {
        // Get current theme colors
        const isLightTheme = document.body.classList.contains('light-theme');
        const selectBg = isLightTheme ? '#ffffff' : '#1a1a1d';
        const selectColor = isLightTheme ? '#1a1a1d' : '#e8e8ea';

        // Update select element colors
        modelSelect.style.background = selectBg;
        modelSelect.style.color = selectColor;

        modelSelect.innerHTML = providerData.models.map(m => {
          const freeLabel = m.free ? '🟢 FREE' : '💰 Paid';
          return `<option value="${m.value}" data-rpm="${m.rpm}">${m.label} (${freeLabel} | ${m.rpm} RPM)</option>`;
        }).join('');

        // Load saved model or use first
        const savedModel = localStorage.getItem(`ai_model_${currentProvider}`);
        if (savedModel && modelSelect.querySelector(`option[value="${savedModel}"]`)) {
          modelSelect.value = savedModel;
        }

        // Update RPM display (async)
        await updateModelRPM();
      }
    };

    const updateModelRPM = async () => {
      const selectedOption = modelSelect.options[modelSelect.selectedIndex];
      const rpm = selectedOption?.dataset.rpm;

      // Pro OpenRouter zkontroluj tier
      if (currentProvider === 'openrouter' && window.AI && typeof window.AI.checkOpenRouterTier === 'function') {
        try {
          const tierInfo = await window.AI.checkOpenRouterTier();
          const tierLabel = tierInfo.isFreeTier ? 'Free Tier' : 'Paid Tier';
          const rpdDisplay = tierInfo.rpd;
          modelRPM.innerHTML = `${rpm} RPM <span style="font-size: 14px; color: ${tierInfo.isFreeTier ? '#f59e0b' : '#10b981'};">(${tierLabel}: ${rpdDisplay} RPD)</span>`;
          modelRPM.title = `Daily usage: ${tierInfo.usageDaily}/${rpdDisplay}\nTotal usage: ${tierInfo.usage}`;
        } catch (error) {
          console.warn('Nepodařilo se načíst OpenRouter tier info:', error);
          modelRPM.textContent = `${rpm} RPM`;
        }
      } else if (rpm) {
        modelRPM.textContent = `${rpm} RPM`;
      }
    };

    const getKeyStatus = (key, provider) => {
      if (!key || key.length < 10) {
        return { icon: '○', class: 'none', title: 'Žádný klíč' };
      }
      const isDemoKey = DEMO_KEYS[provider] && key === DEMO_KEYS[provider];
      if (isDemoKey) {
        return { icon: '△', class: 'demo', title: 'Demo klíč' };
      }
      return { icon: '■', class: 'ok', title: 'Vlastní klíč' };
    };

    const loadAllKeys = () => {
      const allKeys = JSON.parse(localStorage.getItem('ai_all_keys') || '{}');
      const hasAnyKey = Object.values(allKeys).some(key => key && key.length > 10);

      // Auto-load demo keys if no keys are set
      if (!hasAnyKey && Object.keys(allKeys).length === 0) {
        // First time - load demo keys automatically for ALL providers
        Object.entries(DEMO_KEYS).forEach(([provider, key]) => {
          if (key && !key.includes('placeholder')) {
            allKeys[provider] = key;
          }
        });
        localStorage.setItem('ai_all_keys', JSON.stringify(allKeys));
        console.log(`✅ Načteno ${Object.keys(allKeys).length} demo API klíčů:`, Object.keys(allKeys));
      } else if (Object.keys(allKeys).length > 0) {
        // Ensure all providers are present (add missing demo keys)
        let added = 0;
        Object.entries(DEMO_KEYS).forEach(([provider, key]) => {
          if (!allKeys[provider]) {
            allKeys[provider] = key;
            added++;
          }
        });
        if (added > 0) {
          localStorage.setItem('ai_all_keys', JSON.stringify(allKeys));
          console.log(`✅ Doplněno ${added} chybějících demo klíčů`);
        }
      }

      // Provider input ID mapping
      const providerInputMap = {
        gemini: 'keyGemini',
        groq: 'keyGroq',
        openrouter: 'keyOpenRouter',
        mistral: 'keyMistral',
        cohere: 'keyCohere',
        huggingface: 'keyHuggingFace'
      };

      // Load all provider keys
      Object.entries(providerInputMap).forEach(([provider, inputId]) => {
        const input = modal.querySelector(`#${inputId}`);
        const statusId = inputId.replace('key', 'status');
        const statusEl = modal.querySelector(`#${statusId}`);

        if (input && statusEl) {
          const key = allKeys[provider] || '';
          input.value = key;

          const status = getKeyStatus(key, provider);
          statusEl.textContent = status.icon;
          statusEl.className = `key-status ${status.class}`;
          statusEl.title = status.title;
        }
      });

      // Update key summary
      updateKeySummary();
    };

    const updateKeySummary = () => {
      const allKeys = JSON.parse(localStorage.getItem('ai_all_keys') || '{}');
      const keySummaryEl = modal.querySelector('#keySummary');
      const keySummaryTextEl = modal.querySelector('#keySummaryText');

      if (!keySummaryEl || !keySummaryTextEl) return;

      let demoCount = 0;
      let customCount = 0;
      let emptyCount = 0;

      // Count all providers, not just those in localStorage
      Object.keys(DEMO_KEYS).forEach((provider) => {
        const key = allKeys[provider] || '';
        if (!key || key.length < 10) {
          emptyCount++;
        } else if (DEMO_KEYS[provider] && key === DEMO_KEYS[provider]) {
          demoCount++;
        } else {
          customCount++;
        }
      });

      const totalProviders = Object.keys(DEMO_KEYS).length;
      const hasKeys = demoCount > 0 || customCount > 0;

      if (hasKeys) {
        keySummaryEl.style.display = 'block';
        const parts = [];
        if (demoCount > 0) parts.push(`${demoCount}× demo klíč`);
        if (customCount > 0) parts.push(`${customCount}× vlastní klíč`);
        if (emptyCount > 0) parts.push(`${emptyCount}× bez klíče`);

        keySummaryTextEl.textContent = `📊 Stav klíčů: ${parts.join(' | ')} (celkem ${totalProviders} providerů)`;
      } else {
        keySummaryEl.style.display = 'none';
      }
    };

    const saveAllKeys = () => {
      const allKeys = {
        gemini: modal.querySelector('#keyGemini')?.value.trim() || '',
        groq: modal.querySelector('#keyGroq')?.value.trim() || '',
        openrouter: modal.querySelector('#keyOpenRouter')?.value.trim() || '',
        mistral: modal.querySelector('#keyMistral')?.value.trim() || '',

        cohere: modal.querySelector('#keyCohere')?.value.trim() || '',
        huggingface: modal.querySelector('#keyHuggingFace')?.value.trim() || ''
      };

      localStorage.setItem('ai_all_keys', JSON.stringify(allKeys));
      localStorage.setItem(`ai_model_${currentProvider}`, modelSelect.value);

      // Update AI module if available
      if (typeof window.AI !== 'undefined') {
        Object.entries(allKeys).forEach(([provider, key]) => {
          if (key) {
            window.AI.setKey(provider, key);
          }
        });
      }

      eventBus.emit('toast:show', {
        message: '✅ Všechny klíče uloženy',
        type: 'success',
        duration: 2000
      });

      loadAllKeys(); // Refresh status icons
      updateKeySummary(); // Update key summary
    };

    const exportKeys = () => {
      const allKeys = JSON.parse(localStorage.getItem('ai_all_keys') || '{}');
      const settings = {
        version: '1.0',
        exportDate: new Date().toISOString(),
        keys: allKeys
      };

      const blob = new Blob([JSON.stringify(settings, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ai-keys-backup-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);

      eventBus.emit('toast:show', {
        message: '📥 Klíče exportovány',
        type: 'success',
        duration: 2000
      });
    };

    // Chat functions
    const addChatMessage = (role, content, loading = false) => {
      if (chatMessages.querySelector('.chat-empty')) {
        chatMessages.innerHTML = '';
      }

      const messageDiv = document.createElement('div');
      messageDiv.style.cssText = `
        display: flex;
        margin-bottom: 12px;
        animation: fadeIn 0.3s ease;
        justify-content: ${role === 'user' ? 'flex-end' : 'flex-start'};
      `;

      const bubbleDiv = document.createElement('div');
      bubbleDiv.style.cssText = `
        max-width: 80%;
        padding: 12px 16px;
        border-radius: 16px;
        font-size: 14px;
        line-height: 1.5;
        white-space: pre-wrap;
        word-wrap: break-word;
        ${role === 'user'
          ? 'background: linear-gradient(135deg, #3b82f6, #2563eb); color: white; border-bottom-right-radius: 4px;'
          : role === 'system'
          ? 'background: rgba(245, 158, 11, 0.2); color: var(--text-primary); border: 1px solid rgba(245, 158, 11, 0.3); border-radius: 12px;'
          : 'background: var(--bg-tertiary); color: var(--text-primary); border-bottom-left-radius: 4px;'}
        ${loading ? 'font-style: italic; opacity: 0.7;' : ''}
      `;
      bubbleDiv.textContent = content;

      messageDiv.appendChild(bubbleDiv);
      chatMessages.appendChild(messageDiv);
      chatMessages.scrollTop = chatMessages.scrollHeight;

      return messageDiv;
    };

    // Advanced testing functions
    const testFallback = async () => {
      if (typeof window.AI?.askWithFallback !== 'function') {
        eventBus.emit('toast:show', {
          message: '⚠️ Fallback funkce není dostupná',
          type: 'warning',
          duration: 3000
        });
        return;
      }

      const testPrompt = 'Řekni krátký vtip o programování.';
      updateChatStatus('Testuji fallback...', '#f59e0b');

      // Dočasně nastavit maxRetries = 1 pro rychlé testování (přeskočit rate limit waits)
      const originalMaxRetries = window.AI.config.maxRetries;
      window.AI.config.maxRetries = 1;

      try {
        const allKeys = JSON.parse(localStorage.getItem('ai_all_keys') || '{}');
        Object.entries(allKeys).forEach(([provider, key]) => {
          if (key) window.AI.setKey(provider, key);
        });

        const result = await window.AI.askWithFallback(testPrompt);

        addChatMessage('system', `✅ Fallback test úspěšný!\n\nPoužitý model: ${result.model}\nProvider: ${result.provider}\n\nOdpověď: ${result.response}`);
        updateChatStatus('Hotovo', '#22c55e');

      } catch (error) {
        addChatMessage('system', `❌ Fallback test selhal: ${error.message}`);
        updateChatStatus('Chyba', '#ef4444');
      } finally {
        // Obnovit původní maxRetries
        window.AI.config.maxRetries = originalMaxRetries;
      }
    };

    const testAllModels = async () => {
      // Close AI Settings modal first
      const aiSettingsModal = document.querySelector('.modal-backdrop');
      if (aiSettingsModal) {
        aiSettingsModal.remove();
      }

      // Create test results modal
      const testModal = new Modal({
        title: '🧪 Testování AI Modelů',
        closeOnOverlay: false,
        closeOnEscape: false,
        content: `
          <div class="testing-container" style="padding: 20px;">
            <!-- Loading Spinner + Status -->
            <div id="testLoadingSection" style="display: flex; align-items: center; gap: 12px; margin-bottom: 20px; padding: 16px; background: var(--bg-tertiary); border-radius: 12px;">
              <div class="spinner" style="width: 40px; height: 40px; border: 3px solid var(--bg-primary); border-top: 3px solid var(--accent-color); border-radius: 50%; animation: spin 1s linear infinite;"></div>
              <div style="flex: 1;">
                <div id="testCurrentModel" style="font-size: 14px; font-weight: 600; color: var(--text-primary); margin-bottom: 4px;">Připravuji test...</div>
                <div id="testCurrentProvider" style="font-size: 12px; color: var(--text-secondary);">Načítám modely...</div>
              </div>
            </div>

            <!-- Progress Bar -->
            <div class="testing-progress" style="margin-bottom: 20px;">
              <div style="display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 13px; color: var(--text-secondary);">
                <span id="testProgressText">Připravuji test...</span>
                <span id="testProgressPercent">0%</span>
              </div>
              <div style="width: 100%; height: 8px; background: var(--bg-tertiary); border-radius: 4px; overflow: hidden; position: relative;">
                <div id="testProgressBar" style="width: 0%; height: 100%; background: linear-gradient(90deg, var(--accent-color), var(--success-color)); transition: width 0.3s ease-out;"></div>
                <div style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent); animation: shimmer 2s infinite;"></div>
              </div>
            </div>

            <!-- Stats Grid -->
            <div class="stats-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 12px; margin-bottom: 20px;">
              <div style="padding: 12px; background: var(--bg-tertiary); border-radius: 8px; border: 2px solid var(--success-color); transition: transform 0.2s;">
                <div style="font-size: 24px; font-weight: 600; color: var(--success-color);" id="testStatsSuccess">0</div>
                <div style="font-size: 12px; color: var(--text-secondary); margin-top: 4px;">Úspěšné</div>
              </div>
              <div style="padding: 12px; background: var(--bg-tertiary); border-radius: 8px; border: 2px solid var(--error-color); transition: transform 0.2s;">
                <div style="font-size: 24px; font-weight: 600; color: var(--error-color);" id="testStatsError">0</div>
                <div style="font-size: 12px; color: var(--text-secondary); margin-top: 4px;">Chyby</div>
              </div>
              <div style="padding: 12px; background: var(--bg-tertiary); border-radius: 8px; border: 2px solid var(--warning-color); transition: transform 0.2s;">
                <div style="font-size: 24px; font-weight: 600; color: var(--warning-color);" id="testStatsNoKey">0</div>
                <div style="font-size: 12px; color: var(--text-secondary); margin-top: 4px;">Bez klíče</div>
              </div>
              <div style="padding: 12px; background: var(--bg-tertiary); border-radius: 8px; border: 2px solid var(--info-color); transition: transform 0.2s;">
                <div style="font-size: 24px; font-weight: 600; color: var(--info-color);" id="testStatsTime">0ms</div>
                <div style="font-size: 12px; color: var(--text-secondary); margin-top: 4px;">Průměrný čas</div>
              </div>
            </div>

            <div id="testResultsContainer" style="max-height: 400px; overflow-y: auto;"></div>

            <!-- Control Buttons -->
            <div id="testControls" style="margin-top: 20px; display: flex; gap: 12px; justify-content: center;">
              <button id="stopTestBtn" style="padding: 10px 20px; background: var(--error-color); color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 14px; font-weight: 500; display: flex; align-items: center; gap: 8px;">
                ⏹️ Ukončit test
              </button>
            </div>

            <div id="testActions" style="display: none; margin-top: 20px; text-align: center;">
              <button id="exportTestResults" style="padding: 10px 20px; background: var(--accent-color); color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 14px; font-weight: 500;">
                📥 Exportovat výsledky (JSON)
              </button>
            </div>
          </div>

          <style>
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
            @keyframes shimmer {
              0% { transform: translateX(-100%); }
              100% { transform: translateX(100%); }
            }
            @keyframes pulse {
              0%, 100% { opacity: 1; }
              50% { opacity: 0.5; }
            }
            .stats-grid > div:hover {
              transform: scale(1.05);
            }
          </style>
        `,
        width: '800px',
        height: 'auto'
      });

      testModal.open();

      const progressBar = testModal.element.querySelector('#testProgressBar');
      const progressText = testModal.element.querySelector('#testProgressText');
      const progressPercent = testModal.element.querySelector('#testProgressPercent');
      const statsSuccess = testModal.element.querySelector('#testStatsSuccess');
      const statsError = testModal.element.querySelector('#testStatsError');
      const statsNoKey = testModal.element.querySelector('#testStatsNoKey');
      const statsTime = testModal.element.querySelector('#testStatsTime');
      const resultsContainer = testModal.element.querySelector('#testResultsContainer');
      const testActions = testModal.element.querySelector('#testActions');
      const testControls = testModal.element.querySelector('#testControls');
      const stopTestBtn = testModal.element.querySelector('#stopTestBtn');
      const exportBtn = testModal.element.querySelector('#exportTestResults');
      const loadingSection = testModal.element.querySelector('#testLoadingSection');
      const currentModel = testModal.element.querySelector('#testCurrentModel');
      const currentProvider = testModal.element.querySelector('#testCurrentProvider');

      // Stop button handler
      stopTestBtn.addEventListener('click', () => {
        this.aiTester.stop();
        stopTestBtn.disabled = true;
        stopTestBtn.textContent = '⏸️ Zastavuji...';
        stopTestBtn.style.opacity = '0.6';
      });

      // Load API keys
      const allKeys = JSON.parse(localStorage.getItem('ai_all_keys') || '{}');
      Object.entries(allKeys).forEach(([provider, key]) => {
        if (key) window.AI.setKey(provider, key);
      });

      // Start testing
      try {
        await this.aiTester.testAllModels((progress) => {
          // Update spinner section
          currentModel.textContent = `🔄 Testuji: ${progress.model}`;
          currentProvider.textContent = `Provider: ${progress.provider} | Model ${progress.current}/${progress.total}`;

          // Update progress bar
          progressBar.style.width = `${progress.progress}%`;
          progressPercent.textContent = `${progress.progress}%`;
          progressText.textContent = `${progress.current}/${progress.total} modelů`;

          // Update stats with animation
          const stats = this.aiTester.getStats();
          if (stats) {
            const updateStat = (element, newValue) => {
              if (element.textContent !== String(newValue)) {
                element.style.animation = 'pulse 0.3s ease-in-out';
                element.textContent = newValue;
                setTimeout(() => element.style.animation = '', 300);
              }
            };

            updateStat(statsSuccess, stats.success);
            updateStat(statsError, stats.error);
            updateStat(statsNoKey, stats.noKey);

            // Calculate average time across providers
            let totalTime = 0;
            let count = 0;
            Object.values(stats.providers || {}).forEach(provider => {
              if (provider.avgResponseTime > 0) {
                totalTime += provider.avgResponseTime;
                count++;
              }
            });
            const avgTime = count > 0 ? Math.round(totalTime / count) : 0;
            updateStat(statsTime, `${avgTime}ms`);
          }
        });

        // Hide loading spinner and stop button
        loadingSection.style.display = 'none';
        testControls.style.display = 'none';

        // Display results
        const results = this.aiTester.results;
        const stats = this.aiTester.getStats();

        if (!stats) {
          throw new Error('Nelze získat statistiky testování');
        }

        // Update final stats
        let totalTime = 0;
        let count = 0;
        Object.values(stats.providers || {}).forEach(provider => {
          if (provider.avgResponseTime > 0) {
            totalTime += provider.avgResponseTime;
            count++;
          }
        });
        const avgTime = count > 0 ? Math.round(totalTime / count) : 0;
        statsTime.textContent = `${avgTime}ms`;

        progressText.textContent = '✅ Test dokončen!';
        progressText.style.color = 'var(--success-color)';
        progressText.style.fontWeight = '600';

        // Group results by provider
        const groupedResults = {};
        results.forEach(result => {
          if (!groupedResults[result.provider]) {
            groupedResults[result.provider] = [];
          }
          groupedResults[result.provider].push(result);
        });

        // Display results by provider
        let resultsHTML = '';
        Object.entries(groupedResults).forEach(([provider, providerResults]) => {
          const successCount = providerResults.filter(r => r.status === 'success').length;
          const totalCount = providerResults.length;

          resultsHTML += `
            <div style="margin-bottom: 20px;">
              <h3 style="font-size: 16px; font-weight: 600; margin-bottom: 12px; color: var(--text-primary);">
                ${provider} (${successCount}/${totalCount})
              </h3>
              <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
                <thead>
                  <tr style="background: var(--bg-tertiary); text-align: left;">
                    <th style="padding: 8px; border: 1px solid var(--border-color);">Model</th>
                    <th style="padding: 8px; border: 1px solid var(--border-color);">Status</th>
                    <th style="padding: 8px; border: 1px solid var(--border-color);">Čas</th>
                    <th style="padding: 8px; border: 1px solid var(--border-color);">Odpověď</th>
                  </tr>
                </thead>
                <tbody>
          `;

          providerResults.forEach(result => {
            const statusBadge = result.status === 'success'
              ? '<span style="padding: 2px 8px; background: var(--success-color); color: white; border-radius: 4px; font-size: 11px;">✓ OK</span>'
              : result.status === 'error'
              ? '<span style="padding: 2px 8px; background: var(--error-color); color: white; border-radius: 4px; font-size: 11px;">✗ Chyba</span>'
              : '<span style="padding: 2px 8px; background: var(--warning-color); color: white; border-radius: 4px; font-size: 11px;">⚠ Bez klíče</span>';

            const response = result.status === 'success'
              ? (result.response?.substring(0, 50) || '') + '...'
              : result.error || 'Bez API klíče';

            resultsHTML += `
              <tr>
                <td style="padding: 8px; border: 1px solid var(--border-color);">${result.model}</td>
                <td style="padding: 8px; border: 1px solid var(--border-color);">${statusBadge}</td>
                <td style="padding: 8px; border: 1px solid var(--border-color);">${result.responseTime}ms</td>
                <td style="padding: 8px; border: 1px solid var(--border-color); max-width: 300px; overflow: hidden; text-overflow: ellipsis;">${response}</td>
              </tr>
            `;
          });

          resultsHTML += `
                </tbody>
              </table>
            </div>
          `;
        });

        resultsContainer.innerHTML = resultsHTML;
        testActions.style.display = 'block';

        // Export handler
        exportBtn.addEventListener('click', () => {
          const exportData = this.aiTester.exportResults();
          const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `ai-test-results-${new Date().toISOString().split('T')[0]}.json`;
          a.click();
          URL.revokeObjectURL(url);

          eventBus.emit('toast:show', {
            message: '✅ Výsledky exportovány',
            type: 'success',
            duration: 2000
          });
        });

      } catch (error) {
        progressText.textContent = 'Chyba při testování';
        progressText.style.color = 'var(--error-color)';
        resultsContainer.innerHTML = `
          <div style="padding: 20px; text-align: center; color: var(--error-color);">
            ❌ Chyba: ${error.message}
          </div>
        `;
      }
    };

    const compareModels = async () => {
      const model1 = modelSelect.value;
      const model2 = modelRanking[1] || modelRanking[0];

      if (!model2 || model1 === model2) {
        eventBus.emit('toast:show', {
          message: '⚠️ Nejsou dostupné 2 různé modely k porovnání',
          type: 'warning',
          duration: 3000
        });
        return;
      }

      const testPrompt = 'Vysvětli jednoduchým způsobem co je umělá inteligence.';
      addChatMessage('system', `🔄 Porovnávám: ${model1} vs ${model2}`);
      updateChatStatus('Porovnávám...', '#f59e0b');

      // Dočasně nastavit maxRetries = 1 pro rychlé testování (přeskočit rate limit waits)
      const originalMaxRetries = window.AI.config.maxRetries;
      window.AI.config.maxRetries = 1;

      try {
        const allKeys = JSON.parse(localStorage.getItem('ai_all_keys') || '{}');
        Object.entries(allKeys).forEach(([provider, key]) => {
          if (key) window.AI.setKey(provider, key);
        });

        const [result1, result2] = await Promise.all([
          window.AI.ask(testPrompt, { model: model1 }).catch(e => ({ error: e.message })),
          window.AI.ask(testPrompt, { model: model2 }).catch(e => ({ error: e.message }))
        ]);

        const comparison = `
📊 Porovnání modelů:

🔹 ${model1}:
${result1.error ? `❌ Chyba: ${result1.error}` : result1}

🔹 ${model2}:
${result2.error ? `❌ Chyba: ${result2.error}` : result2}
        `;

        addChatMessage('system', comparison);
        updateChatStatus('Hotovo', '#22c55e');

      } catch (error) {
        addChatMessage('system', `❌ Chyba při porovnávání: ${error.message}`);
        updateChatStatus('Chyba', '#ef4444');
      } finally {
        // Obnovit původní maxRetries
        window.AI.config.maxRetries = originalMaxRetries;
      }
    };

    const fetchAvailableModels = async () => {
      addChatMessage('system', '⏳ Načítám dostupné modely...');
      updateChatStatus('Načítám...', '#f59e0b');

      try {
        const allKeys = JSON.parse(localStorage.getItem('ai_all_keys') || '{}');
        const providers = Object.keys(allKeys).filter(p => allKeys[p]);

        if (providers.length === 0) {
          throw new Error('Nejsou nastaveny žádné API klíče');
        }

        const allModels = window.AI?.MODELS ? Object.keys(window.AI.MODELS) : [];
        const modelsByProvider = {};

        providers.forEach(provider => {
          modelsByProvider[provider] = allModels.filter(m => m.startsWith(provider + '/')).length;
        });

        const summary = Object.entries(modelsByProvider)
          .map(([provider, count]) => `  ${provider}: ${count} modelů`)
          .join('\n');

        addChatMessage('system', `📋 Dostupné modely:\n\n${summary}\n\nCelkem: ${allModels.length} modelů`);
        updateChatStatus('Hotovo', '#22c55e');

      } catch (error) {
        addChatMessage('system', `❌ Chyba: ${error.message}`);
        updateChatStatus('Chyba', '#ef4444');
      }
    };

    // Token estimation
    const estimateTokens = (text) => {
      if (!text) return 0;
      const words = text.split(/\s+/).filter(w => w.length > 0);
      const chars = text.length;
      return Math.ceil((chars / 3.5 + words.length) / 2);
    };

    const updateTokenCount = () => {
      const message = chatInput?.value || '';
      const tokens = estimateTokens(message);
      const tokenCountEl = modal.querySelector('#tokenCount');
      if (tokenCountEl) {
        tokenCountEl.textContent = `~${tokens} tokenů`;
      }
    };

    const updateChatStatus = (text, color = '#22c55e') => {
      const statusEl = modal.querySelector('#chatStatus');
      if (statusEl) {
        statusEl.textContent = `● ${text}`;
        statusEl.style.color = color;
      }
    };

    // File upload handling
    let uploadedFile = null;
    let lastRequest = null;

    const handleFileUpload = (event) => {
      const file = event.target.files?.[0];
      if (!file) return;

      if (file.size > 20 * 1024 * 1024) {
        eventBus.emit('toast:show', {
          message: '⚠️ Soubor je příliš velký (max 20MB)',
          type: 'warning',
          duration: 3000
        });
        return;
      }

      const isImage = file.type.startsWith('image/');
      const isText = file.type.startsWith('text/') ||
                     file.name.endsWith('.json') ||
                     file.name.endsWith('.md') ||
                     file.name.endsWith('.csv');

      const reader = new FileReader();

      if (isImage) {
        reader.onload = (e) => {
          const base64Full = e.target.result;
          const base64 = base64Full.split(',')[1];

          uploadedFile = {
            type: 'image',
            name: file.name,
            size: file.size,
            base64: base64,
            mimeType: file.type,
            dataUrl: base64Full
          };

          showFilePreview(file, base64Full);
        };
        reader.readAsDataURL(file);
      } else if (isText) {
        reader.onload = (e) => {
          uploadedFile = {
            type: 'text',
            name: file.name,
            size: file.size,
            content: e.target.result
          };

          showFilePreview(file);
        };
        reader.readAsText(file);
      } else {
        eventBus.emit('toast:show', {
          message: '⚠️ Nepodporovaný typ souboru',
          type: 'warning',
          duration: 3000
        });
      }
    };

    const showFilePreview = (file, dataUrl = null) => {
      const previewEl = modal.querySelector('#filePreview');
      const fileNameEl = modal.querySelector('#fileName');
      const fileSizeEl = modal.querySelector('#fileSize');
      const fileIconEl = modal.querySelector('#fileIcon');
      const fileImgEl = modal.querySelector('#filePreviewImg');

      if (previewEl) previewEl.style.display = 'block';
      if (fileNameEl) fileNameEl.textContent = file.name;
      if (fileSizeEl) fileSizeEl.textContent = `${(file.size / 1024).toFixed(1)} KB`;

      if (dataUrl && fileImgEl) {
        fileImgEl.src = dataUrl;
        fileImgEl.style.display = 'block';
        if (fileIconEl) fileIconEl.textContent = '🖼️';
      } else {
        if (fileImgEl) fileImgEl.style.display = 'none';
        if (fileIconEl) fileIconEl.textContent = '📄';
      }
    };

    const removeFile = () => {
      uploadedFile = null;
      const previewEl = modal.querySelector('#filePreview');
      const fileInputEl = modal.querySelector('#fileUploadInput');
      if (previewEl) previewEl.style.display = 'none';
      if (fileInputEl) fileInputEl.value = '';
    };

    // Stream mode
    const sendStreamMessage = async () => {
      const message = chatInput.value.trim();
      if (!message && !uploadedFile) return;

      if (typeof window.AI === 'undefined') {
        eventBus.emit('toast:show', {
          message: '⚠️ AI modul není načten',
          type: 'warning',
          duration: 3000
        });
        return;
      }

      let finalPrompt = message;

      // Handle file
      if (uploadedFile?.type === 'text') {
        const fileContent = uploadedFile.content.substring(0, 10000);
        finalPrompt = message
          ? `${message}\n\nObsah souboru "${uploadedFile.name}":\n\`\`\`\n${fileContent}\n\`\`\``
          : `Analyzuj tento soubor "${uploadedFile.name}":\n\`\`\`\n${fileContent}\n\`\`\``;
      } else if (uploadedFile?.type === 'image' && !message) {
        finalPrompt = 'Co vidíš na tomto obrázku? Popiš ho.';
      }

      addChatMessage('user', message || finalPrompt);
      lastRequest = { message: finalPrompt, provider: currentProvider, model: modelSelect.value };
      chatInput.value = '';
      removeFile();
      updateTokenCount();
      updateChatStatus('Streamuji...', '#f59e0b');

      const streamBubble = addChatMessage('assistant', '', true);
      let fullResponse = '';

      try {
        const allKeys = JSON.parse(localStorage.getItem('ai_all_keys') || '{}');
        let apiKey = allKeys[currentProvider] || null;

        if (!apiKey) {
          throw new Error(`Není nastaven API klíč pro ${currentProvider}`);
        }

        window.AI.setKey(currentProvider, apiKey);

        const options = {
          provider: currentProvider,
          model: modelSelect.value
        };

        if (uploadedFile?.type === 'image' && window.AI.supportsVision?.(modelSelect.value)) {
          options.imageBase64 = uploadedFile.base64;
          options.imageMimeType = uploadedFile.mimeType;
        }

        for await (const chunk of window.AI.askStream(finalPrompt, options)) {
          fullResponse += chunk;
          streamBubble.querySelector('.chat-bubble').textContent = fullResponse;
          streamBubble.querySelector('.chat-bubble').classList.remove('loading');
          chatMessages.scrollTop = chatMessages.scrollHeight;
        }

        currentConversation.push({ role: 'assistant', content: fullResponse });
        updateChatStatus('Hotovo', '#22c55e');

        chatHistory.unshift({
          id: Date.now(),
          provider: currentProvider,
          model: modelSelect.value,
          prompt: message,
          response: fullResponse,
          timestamp: new Date().toISOString()
        });
        if (chatHistory.length > 50) chatHistory = chatHistory.slice(0, 50);
        localStorage.setItem('ai_chat_history', JSON.stringify(chatHistory));
        renderHistory();

      } catch (error) {
        streamBubble.querySelector('.chat-bubble').textContent = `❌ Chyba: ${error.message}`;
        streamBubble.querySelector('.chat-bubble').classList.add('error');
        updateChatStatus('Chyba', '#ef4444');
      }
    };

    // Retry last request
    const retryLastRequest = async () => {
      if (!lastRequest) {
        eventBus.emit('toast:show', {
          message: '⚠️ Žádný předchozí dotaz k opakování',
          type: 'warning',
          duration: 2000
        });
        return;
      }

      chatInput.value = lastRequest.message;
      await sendChatMessage();
    };

    // Clear chat
    const clearChat = () => {
      chatMessages.innerHTML = '<div style="text-align: center; color: var(--text-secondary); padding: 40px; font-style: italic;">Začni konverzaci...</div>';
      currentConversation = [];
      updateChatStatus('Připraven', '#22c55e');
    };

    const sendChatMessage = async () => {
      let message = chatInput.value.trim();
      if (!message && !uploadedFile) return;

      // Check if AI module is available
      if (typeof window.AI === 'undefined') {
        eventBus.emit('toast:show', {
          message: '⚠️ AI modul není načten',
          type: 'warning',
          duration: 3000
        });
        return;
      }

      let finalPrompt = message;

      // Handle file
      if (uploadedFile?.type === 'text') {
        const fileContent = uploadedFile.content.substring(0, 10000);
        finalPrompt = message
          ? `${message}\n\nObsah souboru "${uploadedFile.name}":\n\`\`\`\n${fileContent}\n\`\`\``
          : `Analyzuj tento soubor "${uploadedFile.name}":\n\`\`\`\n${fileContent}\n\`\`\``;
      } else if (uploadedFile?.type === 'image' && !message) {
        finalPrompt = 'Co vidíš na tomto obrázku? Popiš ho.';
      }

      // Add user message
      addChatMessage('user', message || finalPrompt);
      currentConversation.push({ role: 'user', content: finalPrompt });

      // Save for retry
      lastRequest = { message: finalPrompt, provider: currentProvider, model: modelSelect.value };

      chatInput.value = '';
      const fileToProcess = uploadedFile;
      removeFile();
      updateTokenCount();
      chatSendBtn.disabled = true;
      updateChatStatus('Odesílám...', '#f59e0b');

      // Add loading message
      const loadingMsg = addChatMessage('assistant', 'Přemýšlím...', true);

      const startTime = Date.now();

      try {
        // Get API key for current provider
        const allKeys = JSON.parse(localStorage.getItem('ai_all_keys') || '{}');
        let apiKey = allKeys[currentProvider] || null;

        if (!apiKey) {
          throw new Error(`Není nastaven API klíč pro ${currentProvider}`);
        }

        // Set key in AI module
        window.AI.setKey(currentProvider, apiKey);

        // Send request
        const options = {
          provider: currentProvider,
          model: modelSelect.value
        };

        // Add image if uploaded and model supports vision
        if (fileToProcess?.type === 'image' && window.AI.supportsVision?.(modelSelect.value)) {
          options.imageBase64 = fileToProcess.base64;
          options.imageMimeType = fileToProcess.mimeType;
        }

        const response = await window.AI.ask(finalPrompt, options);
        const duration = ((Date.now() - startTime) / 1000).toFixed(2);

        // Remove loading, add response
        loadingMsg.remove();
        addChatMessage('assistant', response);
        currentConversation.push({ role: 'assistant', content: response });
        updateChatStatus('Hotovo', '#22c55e');

        // Add to history
        chatHistory.unshift({
          id: Date.now(),
          provider: currentProvider,
          model: modelSelect.value,
          prompt: message || finalPrompt,
          response: response,
          time: duration,
          timestamp: new Date().toISOString()
        });

        // Keep only last 50
        if (chatHistory.length > 50) {
          chatHistory = chatHistory.slice(0, 50);
        }

        localStorage.setItem('ai_chat_history', JSON.stringify(chatHistory));
        renderHistory();

      } catch (error) {
        loadingMsg.remove();
        addChatMessage('assistant', `❌ Chyba: ${error.message}`);
        updateChatStatus('Chyba', '#ef4444');
        eventBus.emit('toast:show', {
          message: `❌ ${error.message}`,
          type: 'error',
          duration: 4000
        });
      } finally {
        chatSendBtn.disabled = false;
        chatInput.focus();
      }
    };

    const renderHistory = () => {
      if (chatHistory.length === 0) {
        chatHistoryEl.innerHTML = '<div style="text-align: center; color: var(--text-secondary); padding: 20px; font-style: italic;">Zatím žádná historie...</div>';
        return;
      }

      chatHistoryEl.innerHTML = chatHistory.map(item => {
        const date = new Date(item.timestamp);
        const timeStr = date.toLocaleString('cs-CZ');
        const shortResponse = item.response.length > 150
          ? item.response.substring(0, 150) + '...'
          : item.response;

        return `
          <div style="background: var(--bg-tertiary); border-radius: 10px; padding: 12px; margin-bottom: 10px; border-left: 3px solid #3b82f6;">
            <div style="display: flex; justify-content: space-between; font-size: 11px; color: var(--text-secondary); margin-bottom: 8px;">
              <span>${item.provider}/${item.model.split('/').pop()}</span>
              <span>${timeStr} • ${item.time}s</span>
            </div>
            <div style="color: #93c5fd; font-size: 13px; margin-bottom: 8px; padding-bottom: 8px; border-bottom: 1px solid var(--border-color);">
              💬 ${item.prompt.replace(/</g, '&lt;').replace(/>/g, '&gt;')}
            </div>
            <div style="color: var(--text-primary); font-size: 13px; white-space: pre-wrap;">
              ${shortResponse.replace(/</g, '&lt;').replace(/>/g, '&gt;')}
            </div>
            <div style="margin-top: 8px; display: flex; gap: 6px;">
              <button onclick="this.closest('.modal-backdrop').querySelector('#chatInput').value = \`${item.prompt.replace(/`/g, '\\`').replace(/\$/g, '\\$')}\`" style="padding: 4px 10px; font-size: 11px; background: var(--bg-secondary); border: 1px solid var(--border-color); border-radius: 6px; color: var(--text-primary); cursor: pointer;">🔄 Znovu</button>
            </div>
          </div>
        `;
      }).join('');
    };

    // Export keys to TXT
    const exportKeysToTxt = () => {
      const allKeys = JSON.parse(localStorage.getItem('ai_all_keys') || '{}');

      let txtContent = '# AI API Keys Export\n';
      txtContent += `# Export Date: ${new Date().toLocaleString('cs-CZ')}\n\n`;

      const providers = ['gemini', 'groq', 'openrouter', 'mistral', 'cohere', 'huggingface'];
      providers.forEach(provider => {
        const key = allKeys[provider] || '';
        const providerName = provider.toUpperCase();
        txtContent += `${providerName}: ${key}\n`;
      });

      const blob = new Blob([txtContent], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ai-keys-${Date.now()}.txt`;
      a.click();
      URL.revokeObjectURL(url);

      eventBus.emit('toast:show', {
        message: '📄 Klíče exportovány do TXT',
        type: 'success',
        duration: 3000
      });
    };

    // Import keys from TXT
    const importKeysFromTxt = (fileContent) => {
      try {
        const lines = fileContent.split('\n');
        const newKeys = {};

        lines.forEach(line => {
          line = line.trim();
          if (!line || line.startsWith('#')) return;

          const match = line.match(/^([A-Z]+):\s*(.+)$/);
          if (match) {
            const provider = match[1].toLowerCase();
            const key = match[2].trim();
            if (['gemini', 'groq', 'openrouter', 'mistral', 'cohere', 'huggingface'].includes(provider)) {
              newKeys[provider] = key;
            }
          }
        });

        if (Object.keys(newKeys).length === 0) {
          throw new Error('Nenalezeny žádné platné klíče v souboru');
        }

        // Merge with existing keys
        const allKeys = JSON.parse(localStorage.getItem('ai_all_keys') || '{}');
        Object.assign(allKeys, newKeys);
        localStorage.setItem('ai_all_keys', JSON.stringify(allKeys));

        loadAllKeys();

        eventBus.emit('toast:show', {
          message: `📂 Importováno ${Object.keys(newKeys).length} klíčů z TXT`,
          type: 'success',
          duration: 3000
        });
      } catch (error) {
        eventBus.emit('toast:show', {
          message: `❌ Chyba importu: ${error.message}`,
          type: 'error',
          duration: 4000
        });
      }
    };

    // Key library management
    const getKeyLibrary = (provider) => {
      const libraryKey = `ai_keys_library_${provider}`;
      return JSON.parse(localStorage.getItem(libraryKey) || '[]');
    };

    const saveKeyToLibrary = (provider, key, name = null) => {
      if (!key || key.length < 10) return;

      const library = getKeyLibrary(provider);
      const keyName = name || `Key ${library.length + 1}`;

      // Check if key already exists
      if (!library.find(item => item.key === key)) {
        library.push({ name: keyName, key, timestamp: Date.now() });
        localStorage.setItem(`ai_keys_library_${provider}`, JSON.stringify(library));
      }
    };

    const showKeyLibrary = (provider) => {
      const library = getKeyLibrary(provider);

      // Provider input ID mapping
      const providerInputMap = {
        gemini: 'keyGemini',
        groq: 'keyGroq',
        openrouter: 'keyOpenRouter',
        mistral: 'keyMistral',
        cohere: 'keyCohere',
        huggingface: 'keyHuggingFace'
      };

      const input = document.getElementById(providerInputMap[provider]);

      if (!input) {
        console.error(`Input not found for provider: ${provider}`);
        return;
      }

      // Create dropdown menu
      const existingMenu = document.querySelector('.key-library-menu');
      if (existingMenu) existingMenu.remove();

      const menu = document.createElement('div');
      menu.className = 'key-library-menu';
      menu.style.cssText = `
        position: fixed;
        background: var(--bg-secondary);
        border: 1px solid var(--border-color);
        border-radius: 10px;
        padding: 8px;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
        z-index: 100003;
        min-width: 250px;
        max-height: 300px;
        overflow-y: auto;
      `;

      // Add demo key option
      const demoKey = DEMO_KEYS[provider];
      if (demoKey) {
        const demoOption = document.createElement('div');
        demoOption.style.cssText = `
          padding: 8px 12px;
          cursor: pointer;
          border-radius: 6px;
          font-size: 13px;
          color: var(--text-primary);
          transition: all 0.2s;
          display: flex;
          justify-content: space-between;
          align-items: center;
        `;
        demoOption.innerHTML = `
          <span>△ Demo klíč</span>
          <span style="font-family: monospace; color: var(--text-secondary);">••••••</span>
        `;
        demoOption.addEventListener('mouseenter', () => {
          demoOption.style.background = 'rgba(245, 158, 11, 0.2)';
        });
        demoOption.addEventListener('mouseleave', () => {
          demoOption.style.background = 'transparent';
        });
        demoOption.addEventListener('click', () => {
          input.value = demoKey;
          input.dispatchEvent(new Event('input'));
          menu.remove();
        });
        menu.appendChild(demoOption);
      }

      // Add saved keys
      library.forEach((item, index) => {
        const option = document.createElement('div');
        option.style.cssText = `
          padding: 8px 12px;
          cursor: pointer;
          border-radius: 6px;
          font-size: 13px;
          color: var(--text-primary);
          transition: all 0.2s;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 8px;
        `;

        const keyPreview = item.key.length > 20 ? item.key.substring(0, 20) + '...' : item.key;
        option.innerHTML = `
          <span style="flex: 1;">■ ${item.name}</span>
          <span style="font-family: monospace; color: var(--text-secondary); font-size: 11px;">${keyPreview}</span>
          <button class="delete-key-btn" data-index="${index}" style="padding: 2px 6px; background: rgba(239, 68, 68, 0.2); border: 1px solid rgba(239, 68, 68, 0.3); border-radius: 4px; color: #ef4444; cursor: pointer; font-size: 11px;">🗑️</button>
        `;

        option.addEventListener('mouseenter', () => {
          option.style.background = 'rgba(59, 130, 246, 0.2)';
        });
        option.addEventListener('mouseleave', () => {
          option.style.background = 'transparent';
        });

        option.addEventListener('click', (e) => {
          if (!e.target.classList.contains('delete-key-btn')) {
            input.value = item.key;
            input.dispatchEvent(new Event('input'));
            menu.remove();
          }
        });

        // Delete button
        const deleteBtn = option.querySelector('.delete-key-btn');
        deleteBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          if (confirm(`Smazat klíč "${item.name}"?`)) {
            library.splice(index, 1);
            localStorage.setItem(`ai_keys_library_${provider}`, JSON.stringify(library));
            showKeyLibrary(provider);
          }
        });

        menu.appendChild(option);
      });

      // Add "Save current" option if input has value
      if (input.value && input.value.length > 10 && !library.find(item => item.key === input.value) && input.value !== demoKey) {
        const separator = document.createElement('div');
        separator.style.cssText = 'border-top: 1px solid var(--border-color); margin: 8px 0;';
        menu.appendChild(separator);

        const saveOption = document.createElement('div');
        saveOption.style.cssText = `
          padding: 8px 12px;
          cursor: pointer;
          border-radius: 6px;
          font-size: 13px;
          color: #22c55e;
          transition: all 0.2s;
        `;
        saveOption.textContent = '💾 Uložit aktuální klíč';
        saveOption.addEventListener('mouseenter', () => {
          saveOption.style.background = 'rgba(34, 197, 94, 0.2)';
        });
        saveOption.addEventListener('mouseleave', () => {
          saveOption.style.background = 'transparent';
        });
        saveOption.addEventListener('click', () => {
          const name = prompt('Název klíče:', `Key ${library.length + 1}`);
          if (name) {
            saveKeyToLibrary(provider, input.value, name);
            menu.remove();
            eventBus.emit('toast:show', {
              message: '💾 Klíč uložen do knihovny',
              type: 'success',
              duration: 2000
            });
          }
        });
        menu.appendChild(saveOption);
      }

      if (library.length === 0 && !demoKey) {
        menu.innerHTML = '<div style="padding: 12px; text-align: center; color: var(--text-secondary); font-style: italic;">Žádné uložené klíče</div>';
      }

      // Position menu near button
      const btn = document.querySelector(`[data-provider="${provider}"]`);
      const rect = btn.getBoundingClientRect();
      menu.style.top = (rect.bottom + 5) + 'px';
      menu.style.left = (rect.left - 200) + 'px';

      document.body.appendChild(menu);

      // Close on click outside
      setTimeout(() => {
        const closeMenu = (e) => {
          if (!menu.contains(e.target) && !btn.contains(e.target)) {
            menu.remove();
            document.removeEventListener('click', closeMenu);
          }
        };
        document.addEventListener('click', closeMenu);
      }, 100);
    };

    // Model Ranking functions
    const getModelName = (provider, modelValue) => {
      const providerData = providers[provider];
      if (!providerData) return modelValue;
      const model = providerData.models.find(m => m.value === modelValue);
      return model ? model.label : modelValue;
    };

    const getTierBadge = (tier) => {
      const badges = {
        premium: '<span style="background: linear-gradient(135deg, #fbbf24, #f59e0b); color: white; padding: 2px 8px; border-radius: 12px; font-size: 10px; font-weight: 600;">👑 PREMIUM</span>',
        standard: '<span style="background: rgba(59, 130, 246, 0.2); color: #60a5fa; padding: 2px 8px; border-radius: 12px; font-size: 10px; font-weight: 600;">💎 STANDARD</span>',
        free: '<span style="background: rgba(34, 197, 94, 0.2); color: #4ade80; padding: 2px 8px; border-radius: 12px; font-size: 10px; font-weight: 600;">🆓 FREE</span>'
      };
      return badges[tier] || '';
    };

    const getProviderIcon = (provider) => {
      const icons = {
        gemini: '💎',
        openai: '🧠',
        claude: '🎭',
        groq: '⚡',
        openrouter: '🌐',
        mistral: '🔥'
      };
      return icons[provider] || '🤖';
    };

    const renderModelRanking = () => {
      const rankingDisplay = modal.querySelector('#rankingDisplay');
      if (!rankingDisplay) return;

      // Check for missing or invalid models
      const validModels = [];
      const invalidModels = [];
      const availableModels = [];

      // Collect all available models from AI module
      const allAvailableModels = [];
      Object.keys(providers).forEach(provider => {
        if (providers[provider].models) {
          providers[provider].models.forEach(model => {
            allAvailableModels.push({
              provider,
              model: model.value,
              name: model.label,
              tier: model.free ? 'free' : 'standard'
            });
          });
        }
      });

      // Check each ranking item - parse 'provider/model' format
      modelRanking.forEach(itemString => {
        // Parse format: 'provider/model' or 'provider/namespace/model'
        const parts = itemString.split('/');
        let provider, model;

        if (parts.length >= 2) {
          provider = parts[0];
          model = parts.slice(1).join('/'); // Join back for models like 'openrouter/xiaomi/mimo'
        } else {
          // Invalid format
          invalidModels.push({ provider: 'unknown', model: itemString, string: itemString });
          return;
        }

        const providerExists = providers[provider];
        const modelExists = providerExists && providers[provider].models?.find(m => m.value === model);

        if (providerExists && modelExists) {
          validModels.push({
            provider,
            model,
            name: modelExists.label,
            tier: modelExists.free ? 'free' : 'standard',
            string: itemString
          });
        } else {
          invalidModels.push({ provider, model, string: itemString });
        }
      });

      // Find models that exist in AI module but not in ranking
      allAvailableModels.forEach(availableModel => {
        const modelString = `${availableModel.provider}/${availableModel.model}`;
        const existsInRanking = modelRanking.includes(modelString);
        if (!existsInRanking) {
          availableModels.push(availableModel);
        }
      });

      let html = '<div style="display: flex; flex-direction: column; gap: 8px;">';

      // Show invalid models warning
      if (invalidModels.length > 0) {
        html += `
          <div style="background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.3); border-radius: 8px; padding: 12px; margin-bottom: 8px;">
            <div style="font-weight: 600; color: #ef4444; margin-bottom: 8px; display: flex; align-items: center; gap: 8px;">
              ⚠️ Chybějící modely v seznamu (${invalidModels.length})
            </div>
            <div style="font-size: 12px; color: var(--text-secondary); margin-bottom: 8px;">
              Tyto modely nejsou k dispozici v AI modulu:
            </div>
        `;

        invalidModels.forEach(item => {
          const icon = getProviderIcon(item.provider);
          html += `
            <div style="background: var(--bg-primary); border-radius: 6px; padding: 8px; margin-bottom: 4px; display: flex; justify-content: space-between; align-items: center; border: 1px solid rgba(239, 68, 68, 0.3);">
              <div>
                <div style="font-size: 12px; color: var(--text-primary);">${icon} ${item.provider} - ${item.model}</div>
              </div>
              <button class="remove-invalid-btn" data-provider="${item.provider}" data-model="${item.model}" style="padding: 4px 10px; background: rgba(239, 68, 68, 0.2); border: 1px solid rgba(239, 68, 68, 0.3); border-radius: 6px; cursor: pointer; font-size: 11px; color: #ef4444;">Odebrat</button>
            </div>
          `;
        });

        html += '</div>';
      }

      // Show available models to add
      if (availableModels.length > 0) {
        html += `
          <div style="background: rgba(59, 130, 246, 0.1); border: 1px solid rgba(59, 130, 246, 0.3); border-radius: 8px; padding: 12px; margin-bottom: 8px;">
            <div style="font-weight: 600; color: #3b82f6; margin-bottom: 8px; display: flex; align-items: center; gap: 8px;">
              ➕ Dostupné modely k přidání (${availableModels.length})
            </div>
            <div style="font-size: 12px; color: var(--text-secondary); margin-bottom: 8px;">
              Tyto modely můžete přidat do seznamu:
            </div>
            <div style="max-height: 200px; overflow-y: auto;">
        `;

        availableModels.slice(0, 20).forEach(item => {
          const icon = getProviderIcon(item.provider);
          const badge = getTierBadge(item.tier);
          const providerName = providers[item.provider]?.name || item.provider;
          html += `
            <div style="background: var(--bg-primary); border-radius: 6px; padding: 8px; margin-bottom: 4px; display: flex; justify-content: space-between; align-items: center; border: 1px solid rgba(59, 130, 246, 0.3);">
              <div style="flex: 1;">
                <div style="font-size: 12px; color: var(--text-primary); margin-bottom: 2px;">${icon} ${item.name}</div>
                <div style="font-size: 10px; color: var(--text-secondary);">${providerName} • ${item.model}</div>
              </div>
              <div style="margin: 0 8px;">${badge}</div>
              <button class="add-model-btn" data-provider="${item.provider}" data-model="${item.model}" data-name="${item.name}" data-tier="${item.tier}" style="padding: 4px 10px; background: rgba(59, 130, 246, 0.2); border: 1px solid rgba(59, 130, 246, 0.3); border-radius: 6px; cursor: pointer; font-size: 11px; color: #3b82f6;">Přidat</button>
            </div>
          `;
        });

        if (availableModels.length > 20) {
          html += `<div style="text-align: center; color: var(--text-secondary); font-size: 11px; padding: 8px;">... a ${availableModels.length - 20} dalších</div>`;
        }

        html += '</div></div>';
      }

      // Show valid models
      validModels.forEach((item, index) => {
        const modelName = getModelName(item.provider, item.model);
        const providerName = providers[item.provider]?.name || item.provider;
        const icon = getProviderIcon(item.provider);
        const badge = getTierBadge(item.tier);

        // Medal for top 3
        let medal = '';
        const actualIndex = modelRanking.indexOf(item.string);
        if (actualIndex === 0) medal = '🥇';
        else if (actualIndex === 1) medal = '🥈';
        else if (actualIndex === 2) medal = '🥉';

        html += `
          <div style="background: var(--bg-primary); border-radius: 8px; padding: 12px; display: flex; align-items: center; gap: 12px; border: 1px solid var(--border-color); transition: all 0.2s;">
            <div style="font-size: 20px; min-width: 32px; text-align: center;">${medal || (actualIndex + 1)}</div>
            <div style="flex: 1;">
              <div style="font-weight: 500; color: var(--text-primary); font-size: 14px; margin-bottom: 4px;">
                ${icon} ${modelName}
              </div>
              <div style="font-size: 11px; color: var(--text-secondary);">
                ${providerName} • ${item.model}
              </div>
            </div>
            <div>
              ${badge}
            </div>
          </div>
        `;
      });

      html += '</div>';
      rankingDisplay.innerHTML = html;

      // Add event listeners for remove invalid buttons
      rankingDisplay.querySelectorAll('.remove-invalid-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const provider = btn.dataset.provider;
          const model = btn.dataset.model;
          const modelString = `${provider}/${model}`;
          modelRanking = modelRanking.filter(item => item !== modelString);
          localStorage.setItem('ai_model_ranking', JSON.stringify(modelRanking));
          renderModelRanking();
          eventBus.emit('toast:show', {
            message: '🗑️ Model odebrán ze seznamu',
            type: 'success',
            duration: 2000
          });
        });
      });

      // Add event listeners for add model buttons
      rankingDisplay.querySelectorAll('.add-model-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const provider = btn.dataset.provider;
          const model = btn.dataset.model;
          const name = btn.dataset.name;

          const modelString = `${provider}/${model}`;
          modelRanking.push(modelString);
          localStorage.setItem('ai_model_ranking', JSON.stringify(modelRanking));
          renderModelRanking();
          eventBus.emit('toast:show', {
            message: `✅ ${name} přidán do seznamu`,
            type: 'success',
            duration: 2000
          });
        });
      });
    };

    const renderEditableRanking = () => {
      const rankingEditList = modal.querySelector('#rankingEditList');
      if (!rankingEditList) return;

      let html = '<div style="display: flex; flex-direction: column; gap: 6px;">';

      modelRanking.forEach((itemString, index) => {
        // Parse 'provider/model' format
        const parts = itemString.split('/');
        const provider = parts[0];
        const model = parts.slice(1).join('/');

        const providerData = providers[provider];
        const modelData = providerData?.models?.find(m => m.value === model);

        if (!providerData || !modelData) {
          // Skip invalid models
          return;
        }

        const modelName = modelData.label;
        const providerName = providerData.name;
        const icon = getProviderIcon(provider);
        const badge = getTierBadge(modelData.free ? 'free' : 'standard');

        html += `
          <div class="ranking-item" data-index="${index}" draggable="true" style="background: var(--bg-primary); border-radius: 8px; padding: 10px; display: flex; align-items: center; gap: 10px; border: 1px solid var(--border-color); cursor: move; transition: all 0.2s;">
            <div style="font-size: 16px; min-width: 28px; text-align: center; color: var(--text-secondary);">${index + 1}</div>
            <div style="flex: 1;">
              <div style="font-weight: 500; color: var(--text-primary); font-size: 13px; margin-bottom: 2px;">
                ${icon} ${modelName}
              </div>
              <div style="font-size: 10px; color: var(--text-secondary);">
                ${providerName} • ${model}
              </div>
            </div>
            <div>
              ${badge}
            </div>
            <div style="display: flex; flex-direction: column; gap: 2px;">
              <button class="move-up-btn" data-index="${index}" ${index === 0 ? 'disabled' : ''} style="padding: 2px 8px; background: var(--bg-tertiary); border: 1px solid var(--border-color); border-radius: 4px; cursor: pointer; font-size: 12px; ${index === 0 ? 'opacity: 0.3; cursor: not-allowed;' : ''}">▲</button>
              <button class="move-down-btn" data-index="${index}" ${index === modelRanking.length - 1 ? 'disabled' : ''} style="padding: 2px 8px; background: var(--bg-tertiary); border: 1px solid var(--border-color); border-radius: 4px; cursor: pointer; font-size: 12px; ${index === modelRanking.length - 1 ? 'opacity: 0.3; cursor: not-allowed;' : ''}">▼</button>
            </div>
            <button class="remove-item-btn" data-index="${index}" style="padding: 4px 8px; background: rgba(239, 68, 68, 0.2); border: 1px solid rgba(239, 68, 68, 0.3); border-radius: 4px; cursor: pointer; font-size: 11px; color: #ef4444;">🗑️</button>
          </div>
        `;
      });

      html += '</div>';
      rankingEditList.innerHTML = html;

      // Add drag and drop event listeners
      const items = rankingEditList.querySelectorAll('.ranking-item');
      items.forEach(item => {
        item.addEventListener('dragstart', handleDragStart);
        item.addEventListener('dragover', handleDragOver);
        item.addEventListener('dragenter', handleDragEnter);
        item.addEventListener('dragleave', handleDragLeave);
        item.addEventListener('drop', handleDrop);
        item.addEventListener('dragend', handleDragEnd);
      });

      // Add move button listeners
      rankingEditList.querySelectorAll('.move-up-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const index = parseInt(e.target.dataset.index);
          if (index > 0) {
            [modelRanking[index], modelRanking[index - 1]] = [modelRanking[index - 1], modelRanking[index]];
            renderEditableRanking();
          }
        });
      });

      rankingEditList.querySelectorAll('.move-down-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const index = parseInt(e.target.dataset.index);
          if (index < modelRanking.length - 1) {
            [modelRanking[index], modelRanking[index + 1]] = [modelRanking[index + 1], modelRanking[index]];
            renderEditableRanking();
          }
        });
      });

      rankingEditList.querySelectorAll('.remove-item-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const index = parseInt(e.target.dataset.index);
          const itemString = modelRanking[index];
          const parts = itemString.split('/');
          const provider = parts[0];
          const model = parts.slice(1).join('/');
          const modelData = providers[provider]?.models?.find(m => m.value === model);
          const modelName = modelData?.label || model;

          if (confirm(`Odebrat model "${modelName}" ze seznamu?`)) {
            modelRanking.splice(index, 1);
            renderEditableRanking();
          }
        });
      });
    };

    // Drag and drop handlers
    let draggedIndex = null;

    const handleDragStart = (e) => {
      draggedIndex = parseInt(e.currentTarget.dataset.index);
      e.currentTarget.style.opacity = '0.5';
      e.currentTarget.style.cursor = 'grabbing';
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/html', e.currentTarget.innerHTML);
    };

    const handleDragOver = (e) => {
      if (e.preventDefault) {
        e.preventDefault();
      }
      e.dataTransfer.dropEffect = 'move';
      return false;
    };

    const handleDragEnter = (e) => {
      e.currentTarget.classList.add('drag-over');
    };

    const handleDragLeave = (e) => {
      e.currentTarget.classList.remove('drag-over');
    };

    const handleDrop = (e) => {
      if (e.stopPropagation) {
        e.stopPropagation();
      }
      e.preventDefault();
      e.currentTarget.classList.remove('drag-over');
      const dropIndex = parseInt(e.currentTarget.dataset.index);

      if (draggedIndex !== null && draggedIndex !== dropIndex) {
        const [removed] = modelRanking.splice(draggedIndex, 1);
        modelRanking.splice(dropIndex, 0, removed);
        renderEditableRanking();
      }
      return false;
    };

    const handleDragEnd = (e) => {
      e.currentTarget.style.opacity = '1';
      e.currentTarget.style.cursor = 'move';
      draggedIndex = null;
      modal.querySelectorAll('.ranking-item').forEach(item => {
        item.classList.remove('drag-over');
      });
    };

    const saveModelRanking = () => {
      localStorage.setItem('ai_model_ranking', JSON.stringify(modelRanking));
      renderModelRanking();
      modal.querySelector('#rankingEditModal').style.display = 'none';
      eventBus.emit('toast:show', {
        message: '🏆 Pořadí modelů uloženo',
        type: 'success',
        duration: 2000
      });
    };

    const resetModelRanking = () => {
      if (confirm('Opravdu resetovat pořadí modelů na výchozí?')) {
        modelRanking = [...DEFAULT_MODEL_RANKING];
        renderEditableRanking();
      }
    };

    // Event listeners
    providerTabs.forEach(tab => {
      tab.addEventListener('click', async () => {
        await switchProvider(tab.dataset.provider);
      });

      // Hover effects
      tab.addEventListener('mouseenter', function() {
        if (!this.classList.contains('active')) {
          this.style.opacity = '0.8';
        }
      });
      tab.addEventListener('mouseleave', function() {
        if (!this.classList.contains('active')) {
          this.style.opacity = '1';
        }
      });
    });

    modelSelect.addEventListener('change', async () => {
      await updateModelRPM();
    });

    // Keys buttons
    modal.querySelector('#saveKeysBtn').addEventListener('click', saveAllKeys);
    modal.querySelector('#loadAllDemoKeysBtn').addEventListener('click', () => {
      const allKeys = JSON.parse(localStorage.getItem('ai_all_keys') || '{}');
      let loaded = 0;

      // Load all demo keys (overwrite existing)
      Object.entries(DEMO_KEYS).forEach(([provider, key]) => {
        if (key && !key.includes('placeholder')) {
          allKeys[provider] = key;
          loaded++;
        }
      });

      localStorage.setItem('ai_all_keys', JSON.stringify(allKeys));
      loadAllKeys();

      eventBus.emit('toast:show', {
        message: `✅ Načteno ${loaded} demo API klíčů`,
        type: 'success',
        duration: 2000
      });
    });
    modal.querySelector('#exportKeysBtn').addEventListener('click', exportKeys);
    modal.querySelector('#exportTxtBtn').addEventListener('click', exportKeysToTxt);
    modal.querySelector('#apiHelpBtn').addEventListener('click', () => {
      if (typeof window.AI !== 'undefined' && typeof window.AI.showApiHelp === 'function') {
        window.AI.showApiHelp();
      } else {
        alert('⚠️ AI modul není načten');
      }
    });

    // Import TXT button
    const importTxtBtn = modal.querySelector('#importTxtBtn');
    const importTxtInput = modal.querySelector('#importTxtInput');

    importTxtBtn.addEventListener('click', () => {
      importTxtInput.click();
    });

    importTxtInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          importKeysFromTxt(event.target.result);
        };
        reader.readAsText(file);
      }
      importTxtInput.value = ''; // Reset input
    });

    // Key library buttons
    modal.querySelectorAll('.key-library-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const provider = btn.dataset.provider;
        showKeyLibrary(provider);
      });

      // Hover effects
      btn.addEventListener('mouseenter', function() {
        this.style.background = 'rgba(59, 130, 246, 0.2)';
        this.style.borderColor = '#3b82f6';
      });
      btn.addEventListener('mouseleave', function() {
        this.style.background = 'var(--bg-tertiary)';
        this.style.borderColor = 'var(--border-color)';
      });
    });

    // Model Ranking buttons
    modal.querySelector('#editRankingBtn').addEventListener('click', () => {
      const editModal = modal.querySelector('#rankingEditModal');
      editModal.style.display = editModal.style.display === 'none' ? 'block' : 'none';
      if (editModal.style.display === 'block') {
        renderEditableRanking();
      }
    });

    modal.querySelector('#saveRankingBtn').addEventListener('click', saveModelRanking);
    modal.querySelector('#resetRankingBtn').addEventListener('click', resetModelRanking);
    modal.querySelector('#cancelRankingBtn').addEventListener('click', () => {
      modelRanking = JSON.parse(localStorage.getItem('ai_model_ranking') || 'null') || [...DEFAULT_MODEL_RANKING];
      modal.querySelector('#rankingEditModal').style.display = 'none';
    });

    // Chat listeners
    chatSendBtn.addEventListener('click', sendChatMessage);
    chatInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendChatMessage();
      }
    });

    // New chat control listeners
    streamModeBtn.addEventListener('click', sendStreamMessage);
    retryBtn.addEventListener('click', retryLastRequest);
    clearChatBtn.addEventListener('click', clearChat);
    uploadFileBtn.addEventListener('click', () => fileUploadInput.click());
    removeFileBtn.addEventListener('click', removeFile);
    fileUploadInput.addEventListener('change', handleFileUpload);
    chatInput.addEventListener('input', updateTokenCount);

    // Advanced testing listeners
    advancedToggleHeader.addEventListener('click', () => {
      const isOpen = advancedContent.style.maxHeight !== '0px' && advancedContent.style.maxHeight !== '';
      advancedContent.style.maxHeight = isOpen ? '0' : '300px';
      advancedArrow.style.transform = isOpen ? '' : 'rotate(180deg)';
    });

    testFallbackBtn.addEventListener('click', testFallback);
    testAllModelsBtn.addEventListener('click', testAllModels);
    compareModelsBtn.addEventListener('click', compareModels);
    fetchModelsBtn.addEventListener('click', fetchAvailableModels);

    // History toggle
    modal.querySelector('#historyToggleHeader').addEventListener('click', () => {
      const isOpen = historyContent.style.maxHeight !== '0px' && historyContent.style.maxHeight !== '';
      historyContent.style.maxHeight = isOpen ? '0' : '400px';
      historyArrow.style.transform = isOpen ? '' : 'rotate(180deg)';
    });

    modal.querySelector('#clearHistoryBtn').addEventListener('click', () => {
      if (confirm('Opravdu smazat celou historii?')) {
        chatHistory = [];
        localStorage.removeItem('ai_chat_history');
        renderHistory();
        eventBus.emit('toast:show', {
          message: '🗑️ Historie smazána',
          type: 'info',
          duration: 2000
        });
      }
    });

    modal.querySelector('#exportHistoryBtn').addEventListener('click', () => {
      if (chatHistory.length === 0) {
        eventBus.emit('toast:show', {
          message: '⚠️ Historie je prázdná',
          type: 'warning',
          duration: 2000
        });
        return;
      }

      let text = '# AI Chat Historie\n\n';
      chatHistory.forEach(item => {
        const date = new Date(item.timestamp).toLocaleString('cs-CZ');
        text += `## ${date}\n`;
        text += `**Model:** ${item.provider}/${item.model}\n`;
        text += `**Čas:** ${item.time}s\n\n`;
        text += `**Dotaz:**\n${item.prompt}\n\n`;
        text += `**Odpověď:**\n${item.response}\n\n`;
        text += '---\n\n';
      });

      const blob = new Blob([text], { type: 'text/markdown' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ai-chat-history-${new Date().toISOString().split('T')[0]}.md`;
      a.click();
      URL.revokeObjectURL(url);

      eventBus.emit('toast:show', {
        message: '📥 Historie exportována',
        type: 'success',
        duration: 2000
      });
    });

    modal.querySelector('#aiSettingsClose').addEventListener('click', () => modal.remove());
    modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.remove();
    });

    // Initialize (async operations)
    (async () => {
      await updateModels();
      loadAllKeys();
      renderHistory();
      renderModelRanking();
    })();
  }

  openDevTools() {
    // Check if Eruda is available
    if (typeof eruda !== 'undefined') {
      if (eruda._isInit) {
        // Toggle Eruda (show/hide)
        const erudaElement = document.querySelector('#eruda');
        if (erudaElement) {
          const isVisible = erudaElement.style.display !== 'none';
          erudaElement.style.display = isVisible ? 'none' : 'block';

          // Update button text
          this.updateDevToolsButtonText(!isVisible);

          eventBus.emit('toast:show', {
            message: isVisible ? '🚫 DevTools skryty' : '🐞 DevTools otevřeny',
            type: 'info',
            duration: 2000
          });
        } else {
          eruda.show();
          this.updateDevToolsButtonText(true);
        }
      } else {
        // Initialize Eruda if not already
        eruda.init();
        this.updateDevToolsButtonText(true);
        eventBus.emit('toast:show', {
          message: '🐞 DevTools inicializovány',
          type: 'success',
          duration: 2000
        });
      }
    } else {
      eventBus.emit('toast:show', {
        message: '⚠️ DevTools nejsou dostupné',
        type: 'warning',
        duration: 3000
      });
    }
  }

  updateDevToolsButtonText(isOpen) {
    const devtoolsBtn = this.menuElement?.querySelector('[data-action="devtools"] span:last-child');
    if (devtoolsBtn) {
      devtoolsBtn.textContent = isOpen ? 'Zavřít DevTools' : 'Otevřít DevTools';
    }
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
    if (!filesContainer) {
      console.warn('📁 Open files container not found');
      return;
    }

    const openFiles = this.getOpenFiles();
    console.log('📁 Open files:', openFiles.length, openFiles);

    if (openFiles.length === 0) {
      filesContainer.innerHTML = '<div class="no-files-message">Žádné otevřené soubory</div>';
      return;
    }

    filesContainer.innerHTML = openFiles.map((file, index) => `
      <div class="open-file-item" data-tab-id="${file.id}" data-index="${index}" style="display: flex; align-items: center; gap: 8px; padding: 10px 12px; background: var(--bg-tertiary); border-radius: 4px; cursor: pointer; margin-bottom: 4px;">
        <span class="file-icon" style="font-size: 1.2em; flex-shrink: 0;">📄</span>
        <span class="file-name" style="flex: 1; font-size: 0.9em; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${file.name}</span>
        <button class="file-close-btn" data-tab-id="${file.id}" title="Zavřít" style="width: 20px; height: 20px; padding: 3px; background: rgba(239, 68, 68, 0.2); border: 1px solid rgba(239, 68, 68, 0.3); border-radius: 4px; cursor: pointer; opacity: 0.8; flex-shrink: 0; display: flex; align-items: center; justify-content: center; transition: all 0.2s;" onmouseover="this.style.opacity='1'; this.style.background='rgba(239, 68, 68, 0.4)';" onmouseout="this.style.opacity='0.8'; this.style.background='rgba(239, 68, 68, 0.2)';">
          <svg viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2.5" style="width: 12px; height: 12px;">
            <path d="M18 6L6 18M6 6l12 12"/>
          </svg>
        </button>
      </div>
    `).join('');

    // Attach event handlers for file items
    filesContainer.querySelectorAll('.open-file-item').forEach(item => {
      item.addEventListener('click', (e) => {
        if (!e.target.closest('.file-close-btn')) {
          const tabId = item.dataset.tabId;
          // Find the tab element and trigger click (Editor handles switching)
          const tabElement = document.querySelector(`.editor-tab[data-tab-id="${tabId}"]`);
          if (tabElement) {
            tabElement.click();
          }
          this.hide();
        }
      });
    });

    // Attach event handlers for close buttons
    filesContainer.querySelectorAll('.file-close-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const tabId = btn.dataset.tabId;
        // Find the close button in the tab and trigger click
        const tabElement = document.querySelector(`.editor-tab[data-tab-id="${tabId}"]`);
        if (tabElement) {
          const closeBtn = tabElement.querySelector('.editor-tab-close');
          if (closeBtn) {
            closeBtn.click();
            // Update the list after short delay
            setTimeout(() => this.updateOpenFilesList(), 100);
          }
        }
      });
    });
  }

  getOpenFiles() {
    // Get open files from editor tabs
    const tabs = document.querySelectorAll('.editor-tab');
    return Array.from(tabs).map((tab, index) => {
      const nameSpan = tab.querySelector('.editor-tab-name');
      const name = nameSpan ? nameSpan.textContent.trim() : `Soubor ${index + 1}`;
      return {
        name: name,
        index: index,
        id: tab.dataset.tabId
      };
    });
  }
}
