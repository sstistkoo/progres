/**
 * Simple Side Panel - Levý vysouvací panel s GitHub a soubory
 */

import { eventBus } from '@core/events.js';
import toast from '@ui/components/Toast.js';

export class SidePanel {
  constructor() {
    this.panel = null;
    this.isVisible = false;
    this.escHandler = null;
  }

  show() {
    if (this.panel) {
      this.panel.classList.add('show');
      document.body.classList.add('sidebar-open');
      this.isVisible = true;
      return;
    }

    this.create();
  }

  hide() {
    if (this.panel) {
      this.panel.classList.remove('show');
      document.body.classList.remove('sidebar-open');
      this.isVisible = false;
    }
  }

  toggle() {
    if (this.isVisible) {
      this.hide();
    } else {
      this.show();
    }
  }

  create() {
    const existing = document.querySelector('.side-panel');
    if (existing) {
      existing.remove();
    }

    this.panel = document.createElement('div');
    this.panel.className = 'side-panel';
    this.panel.innerHTML = `
      <div class="panel-header">
        <h2>📁 Soubory & GitHub</h2>
        <button class="panel-close" aria-label="Zavřít">&times;</button>
      </div>
      <div class="panel-body">
        <div style="margin-bottom: 24px;">
          <h3 style="margin: 0 0 12px 0; font-size: 16px; display: flex; align-items: center; gap: 8px;">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 20px; height: 20px;">
              <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/>
              <path d="M13 2v7h7"/>
            </svg>
            Otevřené soubory
          </h3>
          <div id="panelFilesList" style="background: var(--bg-secondary); border-radius: 8px; padding: 12px;">
            <p style="color: var(--text-secondary); font-size: 14px; margin: 0;">Žádné otevřené soubory</p>
          </div>
          <div style="margin-top: 12px; display: flex; gap: 8px;">
            <button class="btn btn-secondary" data-action="newFile" style="flex: 1; padding: 10px; border: none; border-radius: 6px; background: var(--bg-secondary); color: var(--text-primary); cursor: pointer; min-height: 44px;">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 16px; height: 16px; vertical-align: middle; margin-right: 6px;">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <path d="M14 2v6h6M12 18v-6m-3 3h6"/>
              </svg>
              Nový
            </button>
            <button class="btn btn-secondary" data-action="save" style="flex: 1; padding: 10px; border: none; border-radius: 6px; background: var(--bg-secondary); color: var(--text-primary); cursor: pointer; min-height: 44px;">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 16px; height: 16px; vertical-align: middle; margin-right: 6px;">
                <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
                <path d="M17 21v-8H7v8M7 3v5h8"/>
              </svg>
              Uložit
            </button>
          </div>
        </div>

        <div>
          <h3 style="margin: 0 0 12px 0; font-size: 16px; display: flex; align-items: center; gap: 8px;">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 20px; height: 20px;">
              <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"/>
            </svg>
            GitHub
          </h3>
          <div id="panelGitHubStatus" style="background: var(--bg-secondary); border-radius: 8px; padding: 12px; margin-bottom: 12px;">
            <p style="color: var(--text-secondary); font-size: 14px; margin: 0;">Nepřipojeno</p>
          </div>
          <button class="btn btn-primary" data-action="github-login" style="width: 100%; padding: 12px; border: none; border-radius: 6px; background: var(--primary); color: white; cursor: pointer; font-weight: 500; min-height: 44px;">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 18px; height: 18px; vertical-align: middle; margin-right: 8px;">
              <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"/>
            </svg>
            Přihlásit se na GitHub
          </button>
        </div>
      </div>
    `;

    this.attachEvents();
    document.body.appendChild(this.panel);
    setTimeout(() => {
      this.panel.classList.add('show');
      document.body.classList.add('sidebar-open');
      this.isVisible = true;
    }, 10);
  }

  attachEvents() {
    this.panel.querySelector('.panel-close')?.addEventListener('click', () => {
      this.hide();
    });

    this.panel.querySelector('[data-action="newFile"]')?.addEventListener('click', () => {
      toast.info('Vytváření nového souboru...', 2000);
      eventBus.emit('file:new');
    });

    this.panel.querySelector('[data-action="save"]')?.addEventListener('click', () => {
      toast.info('Ukládání...', 2000);
      eventBus.emit('file:save');
    });

    this.panel.querySelector('[data-action="github-login"]')?.addEventListener('click', async () => {
      try {
        const { username, token } = await window.app.aiPanel.showGitHubLoginModal();
        if (username && token) {
          toast.success(`Přihlášen jako ${username}`, 2000);
          const statusEl = this.panel.querySelector('#panelGitHubStatus');
          if (statusEl) {
            statusEl.innerHTML = `<p style="color: var(--success); font-size: 14px; margin: 0;">✓ Přihlášen jako <strong>${username}</strong></p>`;
          }
        }
      } catch (error) {
        console.error('GitHub login error:', error);
      }
    });

    this.escHandler = (e) => {
      if (e.key === 'Escape' && this.isVisible) {
        this.hide();
      }
    };
    document.addEventListener('keydown', this.escHandler);
  }

  destroy() {
    if (this.escHandler) {
      document.removeEventListener('keydown', this.escHandler);
    }
    if (this.panel) {
      this.panel.remove();
      this.panel = null;
    }
  }
}
