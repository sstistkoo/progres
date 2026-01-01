/**
 * Search Panel Module
 * Find and replace functionality
 */

import { eventBus } from '@core/events.js';
import { state } from '@core/state.js';
import { Modal } from '@ui/components/Modal.js';

export class SearchPanel {
  constructor() {
    this.modal = null;
    this.setupEventListeners();
  }

  setupEventListeners() {
    eventBus.on('search:show', () => this.show());
    eventBus.on('search:hide', () => this.hide());
  }

  show() {
    if (!this.modal) {
      this.createModal();
    }
    this.modal.open();

    // Focus search input
    setTimeout(() => {
      const searchInput = this.modal.element.querySelector('#searchInput');
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
    const content = this.createSearchInterface();

    this.modal = new Modal({
      title: '🔍 Hledat a nahradit',
      content,
      className: 'search-modal',
      size: 'medium',
      onClose: () => this.hide()
    });

    this.modal.create();
    this.attachEventHandlers();
  }

  createSearchInterface() {
    return `
      <div class="search-panel">
        <div class="search-form">
          <div class="search-input-group">
            <label for="searchInput">Hledat:</label>
            <input
              type="text"
              id="searchInput"
              class="search-input"
              placeholder="Zadejte hledaný text..."
            />
          </div>

          <div class="search-input-group">
            <label for="replaceInput">Nahradit za:</label>
            <input
              type="text"
              id="replaceInput"
              class="search-input"
              placeholder="Nový text..."
            />
          </div>

          <div class="search-options">
            <label class="search-checkbox">
              <input type="checkbox" id="caseSensitive" />
              <span>Rozlišovat velikost písmen</span>
            </label>
            <label class="search-checkbox">
              <input type="checkbox" id="wholeWord" />
              <span>Pouze celá slova</span>
            </label>
            <label class="search-checkbox">
              <input type="checkbox" id="useRegex" />
              <span>Použít regex</span>
            </label>
          </div>
        </div>

        <div class="search-results" id="searchResults">
          <div class="search-results-empty">
            Zadejte hledaný text a stiskněte Enter nebo klikněte na Hledat
          </div>
        </div>

        <div class="search-actions">
          <button class="search-btn primary" id="findBtn">Hledat</button>
          <button class="search-btn" id="replaceBtn">Nahradit</button>
          <button class="search-btn" id="replaceAllBtn">Nahradit vše</button>
          <button class="search-btn secondary" id="clearBtn">Vymazat</button>
        </div>
      </div>
    `;
  }

  attachEventHandlers() {
    const searchInput = this.modal.element.querySelector('#searchInput');
    const replaceInput = this.modal.element.querySelector('#replaceInput');
    const findBtn = this.modal.element.querySelector('#findBtn');
    const replaceBtn = this.modal.element.querySelector('#replaceBtn');
    const replaceAllBtn = this.modal.element.querySelector('#replaceAllBtn');
    const clearBtn = this.modal.element.querySelector('#clearBtn');

    // Search on Enter
    if (searchInput) {
      searchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          this.performSearch();
        }
      });
    }

    if (findBtn) {
      findBtn.addEventListener('click', () => this.performSearch());
    }

    if (replaceBtn) {
      replaceBtn.addEventListener('click', () => this.replaceNext());
    }

    if (replaceAllBtn) {
      replaceAllBtn.addEventListener('click', () => this.replaceAll());
    }

    if (clearBtn) {
      clearBtn.addEventListener('click', () => this.clear());
    }
  }

  performSearch() {
    const searchInput = this.modal.element.querySelector('#searchInput');
    const caseSensitive = this.modal.element.querySelector('#caseSensitive');
    const wholeWord = this.modal.element.querySelector('#wholeWord');
    const useRegex = this.modal.element.querySelector('#useRegex');
    const resultsDiv = this.modal.element.querySelector('#searchResults');

    if (!searchInput || !resultsDiv) return;

    const searchText = searchInput.value.trim();
    if (!searchText) {
      resultsDiv.innerHTML = '<div class="search-results-empty">Zadejte hledaný text</div>';
      return;
    }

    const code = state.get('editor.code') || '';
    const lines = code.split('\n');
    let results = [];

    try {
      let pattern;
      if (useRegex?.checked) {
        const flags = caseSensitive?.checked ? 'g' : 'gi';
        pattern = new RegExp(searchText, flags);
      } else {
        let escapedText = searchText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        if (wholeWord?.checked) {
          escapedText = `\\b${escapedText}\\b`;
        }
        const flags = caseSensitive?.checked ? 'g' : 'gi';
        pattern = new RegExp(escapedText, flags);
      }

      lines.forEach((line, index) => {
        const matches = [...line.matchAll(pattern)];
        matches.forEach(match => {
          results.push({
            line: index + 1,
            column: match.index + 1,
            text: line,
            match: match[0]
          });
        });
      });

      if (results.length === 0) {
        resultsDiv.innerHTML = `<div class="search-results-empty">Nenalezeny žádné výsledky pro "${searchText}"</div>`;
      } else {
        resultsDiv.innerHTML = `
          <div class="search-results-header">Nalezeno ${results.length} výskytů:</div>
          <div class="search-results-list">
            ${results.map((result, i) => `
              <div class="search-result-item" data-index="${i}">
                <div class="search-result-location">Řádek ${result.line}, Sloupec ${result.column}</div>
                <div class="search-result-text">${this.escapeHtml(result.text)}</div>
              </div>
            `).join('')}
          </div>
        `;

        // Store results for replace functionality
        this.lastResults = results;

        // Add click handlers to results
        const resultItems = resultsDiv.querySelectorAll('.search-result-item');
        resultItems.forEach(item => {
          item.addEventListener('click', () => {
            const index = parseInt(item.dataset.index);
            this.goToResult(results[index]);
          });
        });
      }
    } catch (error) {
      resultsDiv.innerHTML = `<div class="search-results-error">Chyba při vyhledávání: ${error.message}</div>`;
    }
  }

  replaceNext() {
    const searchInput = this.modal.element.querySelector('#searchInput');
    const replaceInput = this.modal.element.querySelector('#replaceInput');

    if (!searchInput || !replaceInput) return;

    const searchText = searchInput.value.trim();
    const replaceText = replaceInput.value;

    if (!searchText) {
      eventBus.emit('toast:show', { message: 'Zadejte hledaný text', type: 'warning' });
      return;
    }

    const code = state.get('editor.code') || '';
    const newCode = code.replace(searchText, replaceText);

    if (newCode !== code) {
      state.set('editor.code', newCode);
      eventBus.emit('editor:setContent', { content: newCode });
      eventBus.emit('toast:show', { message: 'Text nahrazen', type: 'success' });
      this.performSearch(); // Update results
    } else {
      eventBus.emit('toast:show', { message: 'Text nenalezen', type: 'warning' });
    }
  }

  replaceAll() {
    const searchInput = this.modal.element.querySelector('#searchInput');
    const replaceInput = this.modal.element.querySelector('#replaceInput');
    const caseSensitive = this.modal.element.querySelector('#caseSensitive');
    const useRegex = this.modal.element.querySelector('#useRegex');

    if (!searchInput || !replaceInput) return;

    const searchText = searchInput.value.trim();
    const replaceText = replaceInput.value;

    if (!searchText) {
      eventBus.emit('toast:show', { message: 'Zadejte hledaný text', type: 'warning' });
      return;
    }

    try {
      const code = state.get('editor.code') || '';
      let pattern;

      if (useRegex?.checked) {
        const flags = caseSensitive?.checked ? 'g' : 'gi';
        pattern = new RegExp(searchText, flags);
      } else {
        const escapedText = searchText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const flags = caseSensitive?.checked ? 'g' : 'gi';
        pattern = new RegExp(escapedText, flags);
      }

      const matches = code.match(pattern);
      const count = matches ? matches.length : 0;

      if (count > 0) {
        const newCode = code.replace(pattern, replaceText);
        state.set('editor.code', newCode);
        eventBus.emit('editor:setContent', { content: newCode });
        eventBus.emit('toast:show', {
          message: `Nahrazeno ${count} výskytů`,
          type: 'success'
        });
        this.performSearch(); // Update results
      } else {
        eventBus.emit('toast:show', { message: 'Text nenalezen', type: 'warning' });
      }
    } catch (error) {
      eventBus.emit('toast:show', {
        message: `Chyba: ${error.message}`,
        type: 'error'
      });
    }
  }

  clear() {
    const searchInput = this.modal.element.querySelector('#searchInput');
    const replaceInput = this.modal.element.querySelector('#replaceInput');
    const resultsDiv = this.modal.element.querySelector('#searchResults');

    if (searchInput) searchInput.value = '';
    if (replaceInput) replaceInput.value = '';
    if (resultsDiv) {
      resultsDiv.innerHTML = '<div class="search-results-empty">Zadejte hledaný text a stiskněte Enter nebo klikněte na Hledat</div>';
    }

    this.lastResults = null;
  }

  goToResult(result) {
    // Emit event to editor to jump to line
    eventBus.emit('editor:goToLine', {
      line: result.line,
      column: result.column
    });
    eventBus.emit('toast:show', {
      message: `Přechod na řádek ${result.line}`,
      type: 'info'
    });
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}
