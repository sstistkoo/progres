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
          <h3>Otevřené soubory</h3>
          <div id="openFilesManager" class="open-files-list">
            <!-- Files will be dynamically added here -->
          </div>
        </div>

        <div class="menu-section">
          <h3>Soubor</h3>
          <button class="menu-item" data-action="newFile">
            <span class="menu-icon">📄</span>
            <span>Nový soubor</span>
            <span class="menu-shortcut">Ctrl+N</span>
          </button>
          <button class="menu-item" data-action="save">
            <span class="menu-icon">💾</span>
            <span>Uložit</span>
            <span class="menu-shortcut">Ctrl+S</span>
          </button>
          <button class="menu-item" data-action="download">
            <span class="menu-icon">⬇️</span>
            <span>Stáhnout</span>
            <span class="menu-shortcut">Ctrl+D</span>
          </button>
          <button class="menu-item" data-action="exportZip">
            <span class="menu-icon">📦</span>
            <span>Export ZIP</span>
          </button>
          <button class="menu-item" data-action="screenshot">
            <span class="menu-icon">📸</span>
            <span>Screenshot stránky</span>
          </button>
          <button class="menu-item" data-action="share">
            <span class="menu-icon">🔗</span>
            <span>Sdílet odkaz</span>
          </button>
        </div>

        <div class="menu-section">
          <h3>Úpravy</h3>
          <button class="menu-item" data-action="undo">
            <span class="menu-icon">↩️</span>
            <span>Zpět</span>
            <span class="menu-shortcut">Ctrl+Z</span>
          </button>
          <button class="menu-item" data-action="redo">
            <span class="menu-icon">↪️</span>
            <span>Vpřed</span>
            <span class="menu-shortcut">Ctrl+Y</span>
          </button>
          <button class="menu-item" data-action="search">
            <span class="menu-icon">🔍</span>
            <span>Hledat</span>
            <span class="menu-shortcut">Ctrl+F</span>
          </button>
          <button class="menu-item" data-action="replace">
            <span class="menu-icon">🔄</span>
            <span>Nahradit</span>
            <span class="menu-shortcut">Ctrl+H</span>
          </button>
        </div>

        <div class="menu-section">
          <h3>Nástroje</h3>
          <button class="menu-item" data-action="format">
            <span class="menu-icon">✨</span>
            <span>Formátovat kód</span>
            <span class="menu-shortcut">Ctrl+Shift+F</span>
          </button>
          <button class="menu-item" data-action="validate">
            <span class="menu-icon">✅</span>
            <span>Validovat</span>
            <span class="menu-shortcut">Ctrl+Shift+V</span>
          </button>
          <button class="menu-item" data-action="minify">
            <span class="menu-icon">📦</span>
            <span>Minifikovat</span>
            <span class="menu-shortcut">Ctrl+Shift+M</span>
          </button>
          <button class="menu-item" data-action="gridEditor">
            <span class="menu-icon">📐</span>
            <span>CSS Grid/Flex editor</span>
          </button>
          <button class="menu-item" data-action="gitignore">
            <span class="menu-icon">📝</span>
            <span>Vytvořit .gitignore</span>
          </button>
          <button class="menu-item" data-action="liveServer">
            <span class="menu-icon">🌐</span>
            <span>Živý server</span>
          </button>
          <button class="menu-item" data-action="seo">
            <span class="menu-icon">🔧</span>
            <span>SEO nástroje</span>
          </button>
        </div>

        <div class="menu-section">
          <h3>Zobrazení</h3>
          <button class="menu-item" data-action="viewEditor">
            <span class="menu-icon">📝</span>
            <span>Pouze editor</span>
          </button>
          <button class="menu-item" data-action="viewSplit">
            <span class="menu-icon">⚡</span>
            <span>Split view</span>
          </button>
          <button class="menu-item" data-action="viewPreview">
            <span class="menu-icon">👁️</span>
            <span>Pouze náhled</span>
          </button>
          <button class="menu-item" data-action="console">
            <span class="menu-icon">💻</span>
            <span>Konzole</span>
            <span class="menu-shortcut">Ctrl+&#96;</span>
          </button>
        </div>

        <div class="menu-section">
          <h3>Obsah</h3>
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
          <h3>GitHub</h3>
          <button class="menu-item" data-action="github-search">
            <span class="menu-icon">🔍</span>
            <span>Hledat na GitHubu</span>
          </button>
          <button class="menu-item" data-action="deploy">
            <span class="menu-icon">🚀</span>
            <span>Deploy projekt</span>
          </button>
          <button class="menu-item" data-action="publish">
            <span class="menu-icon">📤</span>
            <span>Publikovat</span>
            <span class="menu-shortcut">Ctrl+Shift+P</span>
          </button>
        </div>

        <div class="menu-section">
          <h3>Nastavení</h3>
          <button class="menu-item" data-action="settings">
            <span class="menu-icon">⚙️</span>
            <span>Nastavení</span>
            <span class="menu-shortcut">Ctrl+,</span>
          </button>
          <button class="menu-item" data-action="aiSettings">
            <span class="menu-icon">🤖</span>
            <span>Nastavení AI</span>
          </button>
          <button class="menu-item" data-action="shortcuts">
            <span class="menu-icon">⚡</span>
            <span>Rychlé akce</span>
            <span class="menu-shortcut">Ctrl+K</span>
          </button>
          <button class="menu-item" data-action="theme">
            <span class="menu-icon">🎨</span>
            <span>Přepnout téma</span>
          </button>
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
    const actionMap = {
      newFile: 'action:newTab',
      save: 'action:save',
      download: 'action:download',
      exportZip: 'action:exportZip',
      screenshot: 'action:screenshot',
      share: 'action:share',
      undo: 'action:undo',
      redo: 'action:redo',
      search: 'action:search',
      replace: 'action:replace',
      format: 'action:format',
      validate: 'action:validate',
      minify: 'action:minify',
      gridEditor: 'gridEditor:show',
      gitignore: 'action:gitignore',
      liveServer: 'liveServer:show',
      seo: 'seo:show',
      viewEditor: 'view:change',
      viewSplit: 'view:change',
      viewPreview: 'view:change',
      console: 'console:toggle',
      components: 'components:show',
      templates: 'templates:show',
      images: 'images:show',
      'github-search': 'github:search',
      deploy: 'action:deploy',
      publish: 'action:publish',
      settings: 'settings:show',
      aiSettings: 'aiSettings:show',
      shortcuts: 'shortcuts:show',
      theme: 'theme:toggle'
    };

    const event = actionMap[action];
    if (event) {
      if (action === 'viewEditor') {
        eventBus.emit(event, { view: 'editor' });
      } else if (action === 'viewSplit') {
        eventBus.emit(event, { view: 'split' });
      } else if (action === 'viewPreview') {
        eventBus.emit(event, { view: 'preview' });
      } else {
        eventBus.emit(event);
      }
    }
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
