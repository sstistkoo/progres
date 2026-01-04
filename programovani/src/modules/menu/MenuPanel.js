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
                <button style="padding: 10px 20px; background: #00d4aa; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 500;">Hlavní tlačítko</button>
              </div>
              <div class="component-info">
                <h4>Primary Button</h4>
                <p>Základní tlačítko</p>
              </div>
            </div>

            <div class="component-card" data-component="button-secondary">
              <div class="component-preview">
                <button style="padding: 10px 20px; background: transparent; color: #00d4aa; border: 2px solid #00d4aa; border-radius: 6px; cursor: pointer; font-weight: 500;">Sekundární tlačítko</button>
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
                  <h3 style="margin: 0 0 10px 0; color: #e8e8ea;">Titulek karty</h3>
                  <p style="margin: 0; color: #8a8a8f; font-size: 14px;">Popis obsahu karty zde.</p>
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
                <input type="text" placeholder="Zadejte text..." style="padding: 10px 12px; background: #111113; border: 1px solid #2a2a2d; border-radius: 6px; color: #e8e8ea; width: 200px;">
              </div>
              <div class="component-info">
                <h4>Textové pole</h4>
                <p>Input pro text</p>
              </div>
            </div>

            <!-- Alert -->
            <div class="component-card" data-component="alert">
              <div class="component-preview">
                <div style="background: rgba(81, 207, 102, 0.1); border-left: 4px solid #51cf66; padding: 12px 16px; border-radius: 6px; max-width: 250px;">
                  <p style="margin: 0; color: #51cf66; font-size: 14px;">✅ Úspěšná zpráva</p>
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
                <nav style="background: #111113; padding: 12px 20px; border-radius: 6px; display: flex; gap: 20px; max-width: 250px;">
                  <a href="#" style="color: #00d4aa; text-decoration: none; font-weight: 500;">Domov</a>
                  <a href="#" style="color: #8a8a8f; text-decoration: none;">O nás</a>
                  <a href="#" style="color: #8a8a8f; text-decoration: none;">Kontakt</a>
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
      'button-primary': '<button class="btn-primary">Tlačítko</button>\n\n<style>\n.btn-primary {\n  padding: 10px 20px;\n  background: #00d4aa;\n  color: white;\n  border: none;\n  border-radius: 6px;\n  cursor: pointer;\n  font-weight: 500;\n  transition: background 0.2s;\n}\n.btn-primary:hover {\n  background: #00a88a;\n}\n</style>',

      'button-secondary': '<button class="btn-secondary">Tlačítko</button>\n\n<style>\n.btn-secondary {\n  padding: 10px 20px;\n  background: transparent;\n  color: #00d4aa;\n  border: 2px solid #00d4aa;\n  border-radius: 6px;\n  cursor: pointer;\n  font-weight: 500;\n  transition: all 0.2s;\n}\n.btn-secondary:hover {\n  background: #00d4aa;\n  color: white;\n}\n</style>',

      'card': '<div class="card">\n  <h3>Titulek karty</h3>\n  <p>Popis obsahu karty zde.</p>\n</div>\n\n<style>\n.card {\n  background: #1a1a1d;\n  border: 1px solid #2a2a2d;\n  border-radius: 8px;\n  padding: 20px;\n  max-width: 300px;\n}\n.card h3 {\n  margin: 0 0 10px 0;\n  color: #e8e8ea;\n}\n.card p {\n  margin: 0;\n  color: #8a8a8f;\n  font-size: 14px;\n}\n</style>',

      'input': '<input type="text" class="input-field" placeholder="Zadejte text...">\n\n<style>\n.input-field {\n  padding: 10px 12px;\n  background: #111113;\n  border: 1px solid #2a2a2d;\n  border-radius: 6px;\n  color: #e8e8ea;\n  font-size: 14px;\n  width: 100%;\n  transition: border-color 0.2s;\n}\n.input-field:focus {\n  outline: none;\n  border-color: #00d4aa;\n}\n</style>',

      'alert': '<div class="alert alert-success">\n  <p>✅ Úspěšná zpráva</p>\n</div>\n\n<style>\n.alert {\n  padding: 12px 16px;\n  border-radius: 6px;\n  border-left: 4px solid;\n  margin: 10px 0;\n}\n.alert p {\n  margin: 0;\n  font-size: 14px;\n}\n.alert-success {\n  background: rgba(81, 207, 102, 0.1);\n  border-color: #51cf66;\n  color: #51cf66;\n}\n</style>',

      'nav': '<nav class="navbar">\n  <a href="#">Domov</a>\n  <a href="#">O nás</a>\n  <a href="#">Kontakt</a>\n</nav>\n\n<style>\n.navbar {\n  background: #111113;\n  padding: 12px 20px;\n  border-radius: 6px;\n  display: flex;\n  gap: 20px;\n}\n.navbar a {\n  color: #8a8a8f;\n  text-decoration: none;\n  transition: color 0.2s;\n}\n.navbar a:hover {\n  color: #00d4aa;\n}\n</style>'
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

  showTemplates() {
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
        <div class="modal-body components-body">
          <div class="components-grid">
            <!-- Blank -->
            <div class="component-card" data-template="blank">
              <div class="component-preview" style="background: white; color: #333;">
                <div style="text-align: center; padding: 20px;">
                  <h3>🎨</h3>
                  <p>Prázdná stránka</p>
                </div>
              </div>
              <div class="component-info">
                <h4>Prázdná stránka</h4>
                <p>Základní HTML struktura</p>
              </div>
            </div>

            <!-- Landing Page -->
            <div class="component-card" data-template="landing">
              <div class="component-preview" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white;">
                <div style="text-align: center; padding: 20px; font-size: 10px;">
                  <h3 style="margin: 0 0 5px 0;">Awesome App</h3>
                  <p style="margin: 0; font-size: 8px;">Modern landing page</p>
                </div>
              </div>
              <div class="component-info">
                <h4>Landing Page</h4>
                <p>Moderní přistávací stránka</p>
              </div>
            </div>

            <!-- Portfolio -->
            <div class="component-card" data-template="portfolio">
              <div class="component-preview" style="background: #1a1a1d; color: white;">
                <div style="padding: 20px; font-size: 10px;">
                  <h3 style="margin: 0 0 5px 0;">💼 Portfolio</h3>
                  <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 5px; font-size: 8px;">
                    <div style="background: #2a2a2d; padding: 5px;">Project 1</div>
                    <div style="background: #2a2a2d; padding: 5px;">Project 2</div>
                  </div>
                </div>
              </div>
              <div class="component-info">
                <h4>Portfolio</h4>
                <p>Osobní portfolio stránka</p>
              </div>
            </div>

            <!-- Blog -->
            <div class="component-card" data-template="blog">
              <div class="component-preview" style="background: #f5f5f7; color: #333;">
                <div style="padding: 20px; font-size: 10px;">
                  <h3 style="margin: 0 0 5px 0;">✍️ Blog</h3>
                  <div style="font-size: 8px; line-height: 1.3;">
                    <p style="margin: 0 0 5px 0;"><strong>Titulek článku</strong></p>
                    <p style="margin: 0; color: #666;">Přehled článku...</p>
                  </div>
                </div>
              </div>
              <div class="component-info">
                <h4>Blog</h4>
                <p>Blogovací stránka</p>
              </div>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <small style="color: var(--text-muted);">Klikněte na šablonu pro vložení</small>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    // Template definitions
    const templates = {
      'blank': `<!DOCTYPE html>\n<html lang="cs">\n<head>\n  <meta charset="UTF-8">\n  <meta name="viewport" content="width=device-width, initial-scale=1.0">\n  <title>Nová stránka</title>\n  <style>\n    * {\n      margin: 0;\n      padding: 0;\n      box-sizing: border-box;\n    }\n    body {\n      font-family: system-ui, sans-serif;\n      line-height: 1.6;\n      padding: 20px;\n    }\n  </style>\n</head>\n<body>\n  <h1>Vaše nová stránka</h1>\n  <p>Začněte zde s tvůj projektem...</p>\n</body>\n</html>`,

      'landing': `<!DOCTYPE html>\n<html lang="cs">\n<head>\n  <meta charset="UTF-8">\n  <meta name="viewport" content="width=device-width, initial-scale=1.0">\n  <title>Awesome App - Přistávací stránka</title>\n  <style>\n    * { margin: 0; padding: 0; box-sizing: border-box; }\n    body {\n      font-family: system-ui, sans-serif;\n      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);\n      color: white;\n      min-height: 100vh;\n      display: flex;\n      align-items: center;\n      justify-content: center;\n      text-align: center;\n      padding: 20px;\n    }\n    .hero {\n      max-width: 800px;\n    }\n    h1 {\n      font-size: 3rem;\n      margin-bottom: 1rem;\n    }\n    p {\n      font-size: 1.25rem;\n      margin-bottom: 2rem;\n      opacity: 0.9;\n    }\n    .cta-button {\n      padding: 15px 40px;\n      background: white;\n      color: #667eea;\n      border: none;\n      border-radius: 50px;\n      font-size: 1.1rem;\n      font-weight: 600;\n      cursor: pointer;\n      transition: transform 0.2s;\n    }\n    .cta-button:hover {\n      transform: scale(1.05);\n    }\n  </style>\n</head>\n<body>\n  <div class="hero">\n    <h1>Awesome App</h1>\n    <p>Moderní řešení pro vaše potřeby. Jednoduché, rychlé a efektivní.</p>\n    <button class="cta-button">Začít nyní</button>\n  </div>\n</body>\n</html>`,

      'portfolio': `<!DOCTYPE html>\n<html lang="cs">\n<head>\n  <meta charset="UTF-8">\n  <meta name="viewport" content="width=device-width, initial-scale=1.0">\n  <title>Portfolio - Jméno</title>\n  <style>\n    * { margin: 0; padding: 0; box-sizing: border-box; }\n    body {\n      font-family: system-ui, sans-serif;\n      background: #0a0a0b;\n      color: #e8e8ea;\n      line-height: 1.6;\n    }\n    header {\n      padding: 60px 20px;\n      text-align: center;\n      border-bottom: 1px solid #2a2a2d;\n    }\n    h1 { font-size: 2.5rem; margin-bottom: 0.5rem; }\n    .tagline { color: #8a8a8f; font-size: 1.1rem; }\n    .projects {\n      max-width: 1200px;\n      margin: 0 auto;\n      padding: 60px 20px;\n      display: grid;\n      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));\n      gap: 30px;\n    }\n    .project-card {\n      background: #111113;\n      border: 1px solid #2a2a2d;\n      border-radius: 12px;\n      padding: 30px;\n      transition: transform 0.2s;\n    }\n    .project-card:hover {\n      transform: translateY(-5px);\n      border-color: #00d4aa;\n    }\n    .project-card h3 {\n      margin-bottom: 10px;\n      color: #00d4aa;\n    }\n  </style>\n</head>\n<body>\n  <header>\n    <h1>Vaše Jméno</h1>\n    <p class="tagline">Web Developer & Designer</p>\n  </header>\n  <div class="projects">\n    <div class="project-card">\n      <h3>Projekt 1</h3>\n      <p>Popis projektu a použitých technologií.</p>\n    </div>\n    <div class="project-card">\n      <h3>Projekt 2</h3>\n      <p>Popis projektu a použitých technologií.</p>\n    </div>\n    <div class="project-card">\n      <h3>Projekt 3</h3>\n      <p>Popis projektu a použitých technologií.</p>\n    </div>\n  </div>\n</body>\n</html>`,

      'blog': `<!DOCTYPE html>\n<html lang="cs">\n<head>\n  <meta charset="UTF-8">\n  <meta name="viewport" content="width=device-width, initial-scale=1.0">\n  <title>Můj Blog</title>\n  <style>\n    * { margin: 0; padding: 0; box-sizing: border-box; }\n    body {\n      font-family: Georgia, serif;\n      background: #f5f5f7;\n      color: #1a1a1d;\n      line-height: 1.8;\n    }\n    header {\n      background: white;\n      padding: 40px 20px;\n      text-align: center;\n      border-bottom: 1px solid #e0e0e0;\n    }\n    h1 { font-size: 2.5rem; margin-bottom: 0.5rem; }\n    .container {\n      max-width: 800px;\n      margin: 60px auto;\n      padding: 0 20px;\n    }\n    article {\n      background: white;\n      padding: 40px;\n      margin-bottom: 30px;\n      border-radius: 8px;\n      box-shadow: 0 2px 8px rgba(0,0,0,0.1);\n    }\n    article h2 {\n      margin-bottom: 10px;\n      color: #333;\n    }\n    .meta {\n      color: #666;\n      font-size: 0.9rem;\n      margin-bottom: 20px;\n    }\n  </style>\n</head>\n<body>\n  <header>\n    <h1>Můj Blog</h1>\n    <p>Myšlenky a nápady</p>\n  </header>\n  <div class="container">\n    <article>\n      <h2>Titulek prvního článku</h2>\n      <div class="meta">4. ledna 2026 • 5 min čtení</div>\n      <p>Obsah článku zde. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.</p>\n    </article>\n    <article>\n      <h2>Titulek druhého článku</h2>\n      <div class="meta">3. ledna 2026 • 3 min čtení</div>\n      <p>Obsah článku zde. Lorem ipsum dolor sit amet, consectetur adipiscing elit.</p>\n    </article>\n  </div>\n</body>\n</html>`
    };

    // Close handler
    const closeModal = () => modal.remove();

    modal.querySelector('#templatesClose').addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeModal();
    });

    // Template click handlers
    modal.querySelectorAll('.component-card').forEach(card => {
      card.addEventListener('click', () => {
        const templateId = card.dataset.template;
        const code = templates[templateId];

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

  openDevTools() {
    // Check if Eruda is available
    if (typeof eruda !== 'undefined') {
      if (eruda._isInit) {
        // Toggle Eruda (show/hide)
        const erudaElement = document.querySelector('#eruda');
        if (erudaElement) {
          const isVisible = erudaElement.style.display !== 'none';
          erudaElement.style.display = isVisible ? 'none' : 'block';

          eventBus.emit('toast:show', {
            message: isVisible ? '🚫 DevTools skryty' : '🐞 DevTools otevřeny',
            type: 'info',
            duration: 2000
          });
        } else {
          eruda.show();
        }
      } else {
        // Initialize Eruda if not already
        eruda.init();
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
      <div class="open-file-item" data-tab-id="${file.id}" data-index="${index}">
        <span class="file-icon">📄</span>
        <span class="file-name">${file.name}</span>
        <button class="file-close-btn" data-tab-id="${file.id}" title="Zavřít">
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
