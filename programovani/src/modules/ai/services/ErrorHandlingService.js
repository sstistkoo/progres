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

    console.log('[ErrorHandlingService] Setting up error indicator button');

    errorBtn.addEventListener('click', () => {
      console.log('[ErrorHandlingService] Error button clicked, has success class:', errorBtn.classList.contains('success'));

      // If 0 errors (green), open DevTools
      if (errorBtn.classList.contains('success')) {
        console.log('[ErrorHandlingService] Opening DevTools');
        if (typeof eruda !== 'undefined') {
          eruda.init();
          eruda.show();
        } else {
          toast.info('🔧 DevTools nejsou k dispozici', 2000);
        }
        return;
      }

      // Otherwise show error modal
      console.log('[ErrorHandlingService] Opening error modal');
      this.sendAllErrorsToAI();
    });

    // Initialize error count on setup
    setTimeout(() => this.initializeErrorCount(), 500);
  }

  /**
   * Initialize error count from current console state
   */
  initializeErrorCount() {
    const consoleElement = document.getElementById('consoleContent');
    console.log('[ErrorHandlingService] initializeErrorCount, consoleElement found:', !!consoleElement);

    if (!consoleElement) return;

    const ignoredErrors = JSON.parse(localStorage.getItem('ignoredErrors') || '[]');

    // Count only non-ignored errors
    const allErrors = Array.from(consoleElement.querySelectorAll('.console-message.console-error .console-text'));
    console.log('[ErrorHandlingService] Found error elements:', allErrors.length);

    const visibleErrorCount = allErrors.filter(el => {
      const errorText = el.textContent;
      return !ignoredErrors.some(ignored => errorText.includes(ignored));
    }).length;

    console.log('[ErrorHandlingService] Visible error count:', visibleErrorCount);
    this.updateErrorIndicator(visibleErrorCount);
  }

  /**
   * Update error indicator display
   */
  updateErrorIndicator(errorCount) {
    const errorBtn = this.panel.modal?.element?.querySelector('#aiErrorIndicator');
    if (!errorBtn) {
      console.log('[ErrorHandlingService] Error button not found');
      return;
    }

    console.log('[ErrorHandlingService] Updating error indicator, count:', errorCount);

    const countSpan = errorBtn.querySelector('.error-count');
    const iconSpan = errorBtn.querySelector('.error-icon');

    // Remove all state classes first
    errorBtn.classList.remove('success', 'warning', 'error');

    if (errorCount === 0) {
      // Green - no errors
      errorBtn.classList.add('success');
      errorBtn.title = 'Žádné chyby - klikni pro DevTools';
      if (iconSpan) iconSpan.textContent = '✓';
      if (countSpan) countSpan.textContent = '0 chyb';
    } else {
      // Red - has errors
      errorBtn.classList.add('error');
      errorBtn.title = `${errorCount} chyb - klikni pro opravu`;
      if (iconSpan) iconSpan.textContent = '⚠️';
      if (countSpan) {
        if (errorCount === 1) {
          countSpan.textContent = '1 chyba';
        } else if (errorCount >= 2 && errorCount <= 4) {
          countSpan.textContent = `${errorCount} chyby`;
        } else {
          countSpan.textContent = `${errorCount} chyb`;
        }
      }
    }

    console.log('[ErrorHandlingService] Updated - classes:', errorBtn.className, 'text:', countSpan?.textContent);
  }

  /**
   * Send all errors to AI for fixing
   */
  sendAllErrorsToAI() {
    console.log('[ErrorHandlingService] sendAllErrorsToAI called');

    const consoleElement = document.getElementById('consoleContent');
    if (!consoleElement) {
      console.log('[ErrorHandlingService] Console element not found');
      toast.error('Konzole není dostupná', 2000);
      return;
    }

    const errorMessages = [];
    const errorElements = consoleElement.querySelectorAll('.console-message.console-error');
    console.log('[ErrorHandlingService] Found error elements:', errorElements.length);

    errorElements.forEach(el => {
      const textEl = el.querySelector('.console-text') || el;
      const text = textEl.textContent.trim();
      console.log('[ErrorHandlingService] Error text:', text);
      if (text && !this.isErrorIgnored(text)) {
        errorMessages.push(text);
      }
    });

    console.log('[ErrorHandlingService] Error messages to show:', errorMessages.length);

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
    console.log('[ErrorHandlingService] showErrorSelectionModal called with', errorMessages.length, 'errors');

    const modal = document.createElement('div');
    modal.className = 'modal-overlay error-selection-modal open';
    modal.style.cssText = 'position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: transparent; display: flex; align-items: center; justify-content: center; z-index: 10000; pointer-events: none;';
    modal.innerHTML = `
      <div class="modal-content" style="pointer-events: auto; background: var(--bg-secondary, #f5f5f5); border-radius: 12px; max-width: 500px; width: 90%; max-height: 60vh; overflow: hidden; display: flex; flex-direction: column; box-shadow: 0 10px 40px rgba(0,0,0,0.3); border: 1px solid var(--border-color, #ddd);">
        <div class="modal-header" style="padding: 16px 20px; border-bottom: 1px solid var(--border-color, #ddd); display: flex; justify-content: space-between; align-items: center; background: var(--bg-primary, #fff);">
          <h3 style="margin: 0; color: var(--text-primary, #333); font-size: 16px; display: flex; align-items: center; gap: 8px;">
            🐛 Chyby v konzoli (${errorMessages.length})
          </h3>
          <button class="modal-close" style="background: none; border: none; color: var(--text-secondary, #666); font-size: 28px; cursor: pointer; line-height: 1; padding: 0 4px;">×</button>
        </div>

        <div class="modal-body" style="padding: 16px 20px; overflow-y: auto; flex: 1; background: var(--bg-primary, #fff);">
          <div class="error-list" style="display: flex; flex-direction: column; gap: 8px;">
            ${errorMessages.map((err, i) => `
              <label style="display: flex; align-items: flex-start; gap: 10px; padding: 12px; background: var(--bg-tertiary, #fef2f2); border-radius: 8px; cursor: pointer; border: 1px solid var(--border-color, #fecaca);">
                <input type="checkbox" value="${i}" checked style="margin-top: 3px; accent-color: #3b82f6; width: 18px; height: 18px;">
                <span style="font-family: monospace; font-size: 13px; color: #dc2626; word-break: break-all; line-height: 1.5;">
                  ${this.escapeHTML(err.substring(0, 200))}${err.length > 200 ? '...' : ''}
                </span>
              </label>
            `).join('')}
          </div>
        </div>

        <div class="modal-footer" style="padding: 14px 20px; border-top: 1px solid var(--border-color, #ddd); display: flex; gap: 10px; justify-content: flex-end; background: var(--bg-primary, #fff);">
          <button class="btn-ignore" style="padding: 10px 16px; background: var(--bg-secondary, #e5e5e5); border: none; border-radius: 8px; color: var(--text-secondary, #666); cursor: pointer; font-size: 13px;">
            🚫 Ignorovat
          </button>
          <button class="btn-cancel" style="padding: 10px 16px; background: var(--bg-secondary, #e5e5e5); border: none; border-radius: 8px; color: var(--text-primary, #333); cursor: pointer; font-size: 13px;">
            Zrušit
          </button>
          <button class="btn-fix" style="padding: 10px 20px; background: #3b82f6; border: none; border-radius: 8px; color: #fff; cursor: pointer; font-weight: 600; font-size: 13px;">
            🔧 Opravit v AI
          </button>
        </div>
      </div>
    `;

    // Store error messages for reference
    modal.errorMessages = errorMessages;

    // Event handlers
    modal.querySelector('.modal-close').addEventListener('click', () => modal.remove());
    modal.querySelector('.btn-cancel').addEventListener('click', () => modal.remove());
    modal.addEventListener('click', (e) => { if (e.target === modal) modal.remove(); });

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

    console.log('[ErrorHandlingService] Appending modal to body');
    document.body.appendChild(modal);
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
