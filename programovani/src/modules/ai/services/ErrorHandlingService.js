/**
 * ErrorHandlingService.js
 * Service pro správu chyb - error indicator, ignorované chyby, modaly
 * Extrahováno z AIPanel.js
 */

import { eventBus } from '../../../core/events.js';
import { state } from '../../../core/state.js';
import { toast } from '../../../ui/components/Toast.js';

export class ErrorHandlingService {
  constructor(panel) {
    this.panel = panel;
    this.ignoredErrors = new Set(JSON.parse(localStorage.getItem('ai_ignored_errors') || '[]'));
    console.log('[ErrorHandlingService] Initialized');
  }

  /**
   * Setup error indicator button
   */
  setupErrorIndicator() {
    const errorBtn = this.panel.modal?.element?.querySelector('#aiErrorIndicator');
    if (!errorBtn) return;

    errorBtn.addEventListener('click', () => {
      // If 0 errors (green), open DevTools
      if (errorBtn.classList.contains('success')) {
        if (typeof eruda !== 'undefined') {
          eruda.init();
          eruda.show();
        } else {
          toast.info('🔧 DevTools nejsou k dispozici', 2000);
        }
        return;
      }

      // Otherwise show error modal
      this.sendAllErrorsToAI();
    });
  }

  /**
   * Update error indicator display
   */
  updateErrorIndicator(errorCount) {
    const errorBtn = this.panel.modal?.element?.querySelector('#aiErrorIndicator');
    if (!errorBtn) return;

    const countSpan = errorBtn.querySelector('.error-count');
    if (countSpan) {
      countSpan.textContent = errorCount;
    }

    // Update styling based on count
    errorBtn.classList.remove('success', 'warning', 'error');

    if (errorCount === 0) {
      errorBtn.classList.add('success');
      errorBtn.title = 'Žádné chyby - klikni pro DevTools';
    } else if (errorCount <= 3) {
      errorBtn.classList.add('warning');
      errorBtn.title = `${errorCount} varování - klikni pro opravu`;
    } else {
      errorBtn.classList.add('error');
      errorBtn.title = `${errorCount} chyb - klikni pro opravu`;
    }
  }

  /**
   * Send all errors to AI for fixing
   */
  sendAllErrorsToAI() {
    const consoleElement = document.getElementById('consoleOutput');
    if (!consoleElement) {
      toast.error('Konzole není dostupná', 2000);
      return;
    }

    const errorMessages = [];
    const errorElements = consoleElement.querySelectorAll('.console-error, .console-warning');

    errorElements.forEach(el => {
      const text = el.textContent.trim();
      if (text && !this.isErrorIgnored(text)) {
        errorMessages.push(text);
      }
    });

    if (errorMessages.length === 0) {
      toast.info('✅ Žádné chyby k opravě', 2000);
      return;
    }

    // Show error selection modal
    this.showErrorSelectionModal(errorMessages);
  }

  /**
   * Check if error is in ignored list
   */
  isErrorIgnored(errorText) {
    return this.ignoredErrors.has(errorText);
  }

  /**
   * Add errors to ignore list
   */
  ignoreErrors(errors) {
    errors.forEach(e => this.ignoredErrors.add(e));
    localStorage.setItem('ai_ignored_errors', JSON.stringify([...this.ignoredErrors]));
    toast.success(`Ignorováno ${errors.length} chyb`, 2000);
  }

  /**
   * Show modal for selecting which errors to fix
   */
  showErrorSelectionModal(errorMessages) {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay error-selection-modal';
    modal.innerHTML = `
      <div class="modal-content" style="max-width: 600px; max-height: 80vh; overflow: hidden; display: flex; flex-direction: column;">
        <div class="modal-header" style="padding: 16px 20px; border-bottom: 1px solid #333; display: flex; justify-content: space-between; align-items: center;">
          <h3 style="margin: 0; color: #fff; font-size: 16px; display: flex; align-items: center; gap: 8px;">
            🐛 Chyby v konzoli (${errorMessages.length})
          </h3>
          <button class="modal-close" style="background: none; border: none; color: #888; font-size: 20px; cursor: pointer;">×</button>
        </div>

        <div class="modal-body" style="padding: 16px 20px; overflow-y: auto; flex: 1;">
          <div class="error-list" style="display: flex; flex-direction: column; gap: 8px;">
            ${errorMessages.map((err, i) => `
              <label style="display: flex; align-items: flex-start; gap: 10px; padding: 10px; background: #1a1a1a; border-radius: 6px; cursor: pointer; border: 1px solid #333;">
                <input type="checkbox" value="${i}" checked style="margin-top: 3px; accent-color: #3b82f6;">
                <span style="font-family: monospace; font-size: 12px; color: #ef4444; word-break: break-all; line-height: 1.4;">
                  ${this.escapeHTML(err.substring(0, 200))}${err.length > 200 ? '...' : ''}
                </span>
              </label>
            `).join('')}
          </div>
        </div>

        <div class="modal-footer" style="padding: 12px 20px; border-top: 1px solid #333; display: flex; gap: 10px; justify-content: space-between;">
          <div style="display: flex; gap: 8px;">
            <button class="btn-select-all" style="padding: 8px 12px; background: #333; border: none; border-radius: 6px; color: #fff; cursor: pointer; font-size: 12px;">
              ✓ Vybrat vše
            </button>
            <button class="btn-ignore" style="padding: 8px 12px; background: #333; border: none; border-radius: 6px; color: #888; cursor: pointer; font-size: 12px;">
              🚫 Ignorovat vybrané
            </button>
          </div>
          <div style="display: flex; gap: 8px;">
            <button class="btn-cancel" style="padding: 8px 16px; background: #333; border: none; border-radius: 6px; color: #fff; cursor: pointer;">
              Zrušit
            </button>
            <button class="btn-fix" style="padding: 8px 16px; background: #3b82f6; border: none; border-radius: 6px; color: #fff; cursor: pointer; font-weight: 500;">
              🔧 Opravit vybrané
            </button>
          </div>
        </div>
      </div>
    `;

    // Store error messages for reference
    modal.errorMessages = errorMessages;

    // Event handlers
    modal.querySelector('.modal-close').addEventListener('click', () => modal.remove());
    modal.querySelector('.btn-cancel').addEventListener('click', () => modal.remove());
    modal.addEventListener('click', (e) => { if (e.target === modal) modal.remove(); });

    modal.querySelector('.btn-select-all').addEventListener('click', () => {
      modal.querySelectorAll('input[type="checkbox"]').forEach(cb => cb.checked = true);
    });

    modal.querySelector('.btn-ignore').addEventListener('click', () => {
      const selected = [...modal.querySelectorAll('input[type="checkbox"]:checked')]
        .map(cb => errorMessages[parseInt(cb.value)]);
      this.ignoreErrors(selected);
      modal.remove();
    });

    modal.querySelector('.btn-fix').addEventListener('click', () => {
      const selected = [...modal.querySelectorAll('input[type="checkbox"]:checked')]
        .map(cb => errorMessages[parseInt(cb.value)]);

      if (selected.length === 0) {
        toast.error('Vyber alespoň jednu chybu', 2000);
        return;
      }

      // Send to AI
      const errorList = selected.map((e, i) => `${i + 1}. ${e}`).join('\n');
      const message = `🔧 Oprav tyto chyby v kódu:\n\n${errorList}\n\nPoužij SEARCH/REPLACE formát pro opravu.`;

      this.panel.sendMessage(message);
      modal.remove();
    });

    document.body.appendChild(modal);
    setTimeout(() => modal.classList.add('show'), 10);
  }

  /**
   * Show modal with ignored errors list
   */
  showIgnoredErrorsModal() {
    const ignoredList = [...this.ignoredErrors];

    if (ignoredList.length === 0) {
      toast.info('Žádné ignorované chyby', 2000);
      return;
    }

    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
      <div class="modal-content" style="max-width: 500px;">
        <div class="modal-header" style="padding: 16px; border-bottom: 1px solid #333;">
          <h3 style="margin: 0; color: #fff;">🚫 Ignorované chyby (${ignoredList.length})</h3>
          <button class="modal-close" style="background: none; border: none; color: #888; font-size: 20px; cursor: pointer; position: absolute; right: 16px; top: 12px;">×</button>
        </div>
        <div class="modal-body" style="padding: 16px; max-height: 400px; overflow-y: auto;">
          ${ignoredList.map((err, i) => `
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px; background: #1a1a1a; border-radius: 4px; margin-bottom: 8px;">
              <span style="font-size: 12px; color: #888; flex: 1; word-break: break-all;">${this.escapeHTML(err.substring(0, 100))}</span>
              <button class="btn-unignore" data-index="${i}" style="background: #ef4444; border: none; padding: 4px 8px; border-radius: 4px; color: white; cursor: pointer; font-size: 11px; margin-left: 8px;">
                Obnovit
              </button>
            </div>
          `).join('')}
        </div>
        <div class="modal-footer" style="padding: 12px 16px; border-top: 1px solid #333; display: flex; justify-content: space-between;">
          <button class="btn-clear-all" style="padding: 8px 16px; background: #ef4444; border: none; border-radius: 6px; color: white; cursor: pointer;">
            Vymazat vše
          </button>
          <button class="btn-close" style="padding: 8px 16px; background: #333; border: none; border-radius: 6px; color: white; cursor: pointer;">
            Zavřít
          </button>
        </div>
      </div>
    `;

    modal.querySelector('.modal-close').addEventListener('click', () => modal.remove());
    modal.querySelector('.btn-close').addEventListener('click', () => modal.remove());
    modal.addEventListener('click', (e) => { if (e.target === modal) modal.remove(); });

    modal.querySelectorAll('.btn-unignore').forEach(btn => {
      btn.addEventListener('click', () => {
        const index = parseInt(btn.dataset.index);
        const errorToRemove = ignoredList[index];
        this.ignoredErrors.delete(errorToRemove);
        localStorage.setItem('ai_ignored_errors', JSON.stringify([...this.ignoredErrors]));
        btn.closest('div').remove();
        toast.success('Chyba obnovena', 2000);
      });
    });

    modal.querySelector('.btn-clear-all').addEventListener('click', () => {
      this.ignoredErrors.clear();
      localStorage.setItem('ai_ignored_errors', '[]');
      toast.success('Všechny ignorované chyby vymazány', 2000);
      modal.remove();
    });

    document.body.appendChild(modal);
  }

  /**
   * Escape HTML for safe display
   */
  escapeHTML(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}
