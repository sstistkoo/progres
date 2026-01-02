/**
 * Shortcuts Panel Module
 * Command palette and shortcuts reference
 */

import { eventBus } from '../../core/events.js';
import { Modal } from '../../ui/components/Modal.js';

export class ShortcutsPanel {
  constructor() {
    this.modal = null;
    this.setupEventListeners();
  }

  setupEventListeners() {
    eventBus.on('shortcuts:show', () => this.show());
    eventBus.on('shortcuts:hide', () => this.hide());
  }

  show() {
    if (!this.modal) {
      this.createModal();
    }
    this.modal.open();

    // Focus search input
    setTimeout(() => {
      const searchInput = this.modal.element.querySelector('#shortcutsSearch');
      if (searchInput) {
        searchInput.focus();
      }
    }, 100);
  }

  hide() {
    if (this.modal) {
      this.modal.close();
    }
  }

  createModal() {
    const content = this.createShortcutsInterface();

    this.modal = new Modal({
      title: '⚡ Rychlé akce',
      content,
      className: 'shortcuts-modal',
      size: 'large',
      onClose: () => this.hide()
    });

    // Create the element first
    this.modal.create();

    // Now attach event handlers
    this.attachEventHandlers();
  }

  createShortcutsInterface() {
    return `
      <div class="shortcuts-panel">
        <!-- Search -->
        <div class="shortcuts-search">
          <input
            type="text"
            id="shortcutsSearch"
            placeholder="Hledat akci... (začni psát)"
            class="shortcuts-search-input"
          />
        </div>

        <!-- Actions Grid -->
        <div class="shortcuts-grid" id="shortcutsGrid">
          ${this.renderShortcuts()}
        </div>

        <!-- Help Section -->
        <div class="shortcuts-help">
          <h3>💡 Klávesové zkratky</h3>
          <div class="shortcuts-list">
            <div class="shortcut-item">
              <span class="shortcut-keys"><kbd>Ctrl</kbd> + <kbd>K</kbd></span>
              <span class="shortcut-desc">Otevřít rychlé akce</span>
            </div>
            <div class="shortcut-item">
              <span class="shortcut-keys"><kbd>Ctrl</kbd> + <kbd>S</kbd></span>
              <span class="shortcut-desc">Uložit</span>
            </div>
            <div class="shortcut-item">
              <span class="shortcut-keys"><kbd>Ctrl</kbd> + <kbd>N</kbd></span>
              <span class="shortcut-desc">Nový soubor</span>
            </div>
            <div class="shortcut-item">
              <span class="shortcut-keys"><kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>F</kbd></span>
              <span class="shortcut-desc">Formátovat</span>
            </div>
            <div class="shortcut-item">
              <span class="shortcut-keys"><kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>V</kbd></span>
              <span class="shortcut-desc">Validovat</span>
            </div>
            <div class="shortcut-item">
              <span class="shortcut-keys"><kbd>Ctrl</kbd> + <kbd>F</kbd></span>
              <span class="shortcut-desc">Hledat</span>
            </div>
            <div class="shortcut-item">
              <span class="shortcut-keys"><kbd>Ctrl</kbd> + <kbd>Z</kbd></span>
              <span class="shortcut-desc">Zpět</span>
            </div>
            <div class="shortcut-item">
              <span class="shortcut-keys"><kbd>Ctrl</kbd> + <kbd>Y</kbd></span>
              <span class="shortcut-desc">Vpřed</span>
            </div>
            <div class="shortcut-item">
              <span class="shortcut-keys"><kbd>Ctrl</kbd> + <kbd>&#96;</kbd></span>
              <span class="shortcut-desc">Konzole</span>
            </div>
            <div class="shortcut-item">
              <span class="shortcut-keys"><kbd>F5</kbd></span>
              <span class="shortcut-desc">Obnovit náhled</span>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  renderShortcuts() {
    const shortcuts = [
      {
        icon: '💾',
        title: 'Uložit',
        description: 'Uložit aktuální soubor',
        action: 'save',
        shortcut: 'Ctrl+S'
      },
      {
        icon: '⬇️',
        title: 'Stáhnout',
        description: 'Stáhnout jako HTML',
        action: 'download',
        shortcut: 'Ctrl+D'
      },
      {
        icon: '📄',
        title: 'Nový soubor',
        description: 'Vytvořit nový soubor',
        action: 'newFile',
        shortcut: 'Ctrl+N'
      },
      {
        icon: '🔍',
        title: 'Hledat',
        description: 'Hledat v kódu',
        action: 'search',
        shortcut: 'Ctrl+F'
      },
      {
        icon: '✨',
        title: 'Formátovat',
        description: 'Formátovat kód',
        action: 'format',
        shortcut: 'Ctrl+Shift+F'
      },
      {
        icon: '✅',
        title: 'Validovat',
        description: 'Validovat HTML',
        action: 'validate',
        shortcut: 'Ctrl+Shift+V'
      },
      {
        icon: '📦',
        title: 'Minifikovat',
        description: 'Zmenšit kód',
        action: 'minify',
        shortcut: 'Ctrl+Shift+M'
      },

      {
        icon: '↩️',
        title: 'Zpět',
        description: 'Vrátit změnu',
        action: 'undo',
        shortcut: 'Ctrl+Z'
      },
      {
        icon: '↪️',
        title: 'Vpřed',
        description: 'Zopakovat změnu',
        action: 'redo',
        shortcut: 'Ctrl+Y'
      },
      {
        icon: '❌',
        title: 'Zavřít tab',
        description: 'Zavřít aktuální tab',
        action: 'closeTab',
        shortcut: 'Ctrl+W'
      },
      {
        icon: '🎨',
        title: 'Barevné schéma',
        description: 'Přepnout téma',
        action: 'colorScheme',
        shortcut: 'Ctrl+Shift+T'
      },
      {
        icon: '🚀',
        title: 'Publikovat',
        description: 'Publikovat na GitHub',
        action: 'publish',
        shortcut: 'Ctrl+Shift+P'
      },
      {
        icon: '🔧',
        title: 'SEO',
        description: 'Nastavení SEO',
        action: 'seo',
        shortcut: ''
      },
      {
        icon: '📱',
        title: 'Zařízení',
        description: 'Testovat na zařízeních',
        action: 'devices',
        shortcut: ''
      },
      {
        icon: '📸',
        title: 'Screenshot',
        description: 'Vytvořit screenshot',
        action: 'screenshot',
        shortcut: ''
      },
      {
        icon: '⚙️',
        title: 'Nastavení',
        description: 'Otevřít nastavení',
        action: 'settings',
        shortcut: 'Ctrl+,'
      }
    ];

    return shortcuts.map(shortcut => `
      <button class="shortcut-card" data-action="${shortcut.action}">
        <div class="shortcut-icon">${shortcut.icon}</div>
        <div class="shortcut-info">
          <div class="shortcut-title">${shortcut.title}</div>
          <div class="shortcut-description">${shortcut.description}</div>
          ${shortcut.shortcut ? `<div class="shortcut-key">${shortcut.shortcut}</div>` : ''}
        </div>
      </button>
    `).join('');
  }

  attachEventHandlers() {
    // Search functionality
    const searchInput = this.modal.element.querySelector('#shortcutsSearch');
    const grid = this.modal.element.querySelector('#shortcutsGrid');

    searchInput.addEventListener('input', (e) => {
      const query = e.target.value.toLowerCase();
      const cards = grid.querySelectorAll('.shortcut-card');

      cards.forEach(card => {
        const title = card.querySelector('.shortcut-title').textContent.toLowerCase();
        const desc = card.querySelector('.shortcut-description').textContent.toLowerCase();

        if (title.includes(query) || desc.includes(query)) {
          card.style.display = '';
        } else {
          card.style.display = 'none';
        }
      });
    });

    // Action cards
    const cards = this.modal.element.querySelectorAll('.shortcut-card');
    cards.forEach(card => {
      card.addEventListener('click', () => {
        const action = card.dataset.action;
        this.executeAction(action);
        this.hide();
      });
    });
  }

  executeAction(action) {
    const actionMap = {
      save: 'action:save',
      download: 'action:download',
      newFile: 'action:newTab',
      search: 'action:search',
      format: 'action:format',
      validate: 'action:validate',
      minify: 'action:minify',
      preview: 'preview:refresh',
      console: 'console:toggle',
      undo: 'action:undo',
      redo: 'action:redo',
      closeTab: 'action:closeTab',
      colorScheme: 'theme:toggle',
      publish: 'action:publish',
      seo: 'seo:show',
      devices: 'devices:show',
      screenshot: 'action:screenshot',
      settings: 'settings:show'
    };

    const event = actionMap[action];
    if (event) {
      eventBus.emit(event);
    }
  }
}
