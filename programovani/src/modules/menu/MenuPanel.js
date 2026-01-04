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
              <div class="component-preview" style="background: var(--bg-elevated); color: var(--text-primary);">
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
              <div class="component-preview" style="background: var(--bg-tertiary); color: var(--text-primary);">
                <div style="padding: 20px; font-size: 10px;">
                  <h3 style="margin: 0 0 5px 0;">💼 Portfolio</h3>
                  <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 5px; font-size: 8px;">
                    <div style="background: var(--bg-secondary); padding: 5px;">Project 1</div>
                    <div style="background: var(--bg-secondary); padding: 5px;">Project 2</div>
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
              <div class="component-preview" style="background: var(--bg-secondary); color: var(--text-primary);">
                <div style="padding: 20px; font-size: 10px;">
                  <h3 style="margin: 0 0 5px 0;">✍️ Blog</h3>
                  <div style="font-size: 8px; line-height: 1.3;">
                    <p style="margin: 0 0 5px 0;"><strong>Titulek článku</strong></p>
                    <p style="margin: 0; color: var(--text-secondary);">Přehled článku...</p>
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
                <select id="aiModelSelect" style="width: 100%; padding: 12px 14px; background: var(--bg-tertiary); border: 1px solid var(--border-color); border-radius: 10px; color: var(--text-primary); font-size: 14px;">
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
              <div style="display: flex; gap: 10px; flex-wrap: wrap;">
                <button id="saveKeysBtn" style="padding: 10px 20px; background: linear-gradient(135deg, #22c55e, #16a34a); color: white; border: none; border-radius: 10px; cursor: pointer; font-size: 14px; font-weight: 500; transition: all 0.2s;">
                  💾 Uložit klíče
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
        // First time - load demo keys automatically
        Object.entries(DEMO_KEYS).forEach(([provider, key]) => {
          if (key && !key.includes('placeholder')) {
            allKeys[provider] = key;
          }
        });
        localStorage.setItem('ai_all_keys', JSON.stringify(allKeys));
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
      }
    };

    const testAllModels = async () => {
      if (!window.AI?.MODELS) {
        eventBus.emit('toast:show', {
          message: '⚠️ Seznam modelů není dostupný',
          type: 'warning',
          duration: 3000
        });
        return;
      }

      const testPrompt = 'Řekni: "Test OK"';
      const allKeys = JSON.parse(localStorage.getItem('ai_all_keys') || '{}');

      Object.entries(allKeys).forEach(([provider, key]) => {
        if (key) window.AI.setKey(provider, key);
      });

      const models = modelRanking.slice(0, 5); // Test top 5
      addChatMessage('system', `⏳ Testuji ${models.length} modelů...`);
      updateChatStatus('Testuji...', '#f59e0b');

      const results = [];
      for (const model of models) {
        const startTime = Date.now();
        try {
          const response = await window.AI.ask(testPrompt, { model });
          const duration = ((Date.now() - startTime) / 1000).toFixed(2);
          results.push({ model, success: true, duration, response: response.substring(0, 50) });
        } catch (error) {
          const duration = ((Date.now() - startTime) / 1000).toFixed(2);
          results.push({ model, success: false, duration, error: error.message });
        }
      }

      const summary = results.map(r =>
        r.success
          ? `✅ ${r.model}: ${r.duration}s - ${r.response}`
          : `❌ ${r.model}: ${r.duration}s - ${r.error}`
      ).join('\n');

      addChatMessage('system', `📊 Výsledky testování:\n\n${summary}`);
      updateChatStatus('Hotovo', '#22c55e');
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
