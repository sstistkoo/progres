/**
 * Modal Dialog Component
 */
import { createElement, $ } from '../../utils/dom.js';

export class Modal {
  constructor(options = {}) {
    this.options = {
      title: '',
      content: '',
      className: '',
      closeOnEscape: true,
      closeOnOverlay: true,
      ...options,
    };
    this.element = null;
    this.isOpen = false;
  }

  create() {
    const overlay = createElement('div', {
      className: `modal-overlay ${this.options.className}`,
      onClick: e => {
        if (this.options.closeOnOverlay && e.target === overlay) {
          this.close();
        }
      },
    });

    const modal = createElement('div', { className: 'modal' });

    if (this.options.title) {
      const header = createElement('div', { className: 'modal-header' });
      const title = createElement('div', { className: 'modal-title' });
      title.innerHTML = this.options.title;
      const closeBtn = createElement('button', {
        className: 'modal-close-btn',
        onClick: () => this.close(),
        innerHTML: `<svg width="12" height="12" viewBox="0 0 12 12" fill="none">
          <path d="M1 1L11 11M11 1L1 11" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        </svg>`
      });
      header.appendChild(title);
      header.appendChild(closeBtn);
      modal.appendChild(header);
    }

    if (this.options.content) {
      const content = createElement('div', { className: 'modal-content' });
      if (typeof this.options.content === 'string') {
        content.innerHTML = this.options.content;
      } else {
        content.appendChild(this.options.content);
      }
      modal.appendChild(content);
    }

    if (this.options.actions) {
      const actions = createElement('div', { className: 'modal-actions' });
      this.options.actions.forEach(action => {
        const btn = createElement(
          'button',
          {
            className: `modal-btn ${action.primary ? 'primary' : ''}`,
            onClick: () => {
              if (action.onClick) action.onClick();
              if (action.closeOnClick !== false) this.close();
            },
          },
          action.label
        );
        actions.appendChild(btn);
      });
      modal.appendChild(actions);
    }

    overlay.appendChild(modal);
    this.element = overlay;
    return overlay;
  }

  open() {
    if (this.isOpen) return;

    if (!this.element) {
      this.create();
    }

    document.body.appendChild(this.element);
    this.isOpen = true;

    if (this.options.closeOnEscape) {
      this.escapeHandler = e => {
        if (e.key === 'Escape') this.close();
      };
      document.addEventListener('keydown', this.escapeHandler);
    }

    if (this.options.onOpen) {
      this.options.onOpen(this);
    }

    // Trigger animation
    requestAnimationFrame(() => {
      this.element.classList.add('open');
    });
  }

  close() {
    if (!this.isOpen) return;

    this.element.classList.remove('open');

    setTimeout(() => {
      if (this.element && this.element.parentNode) {
        this.element.parentNode.removeChild(this.element);
      }
      this.isOpen = false;

      if (this.escapeHandler) {
        document.removeEventListener('keydown', this.escapeHandler);
        this.escapeHandler = null;
      }

      if (this.options.onClose) {
        this.options.onClose(this);
      }
    }, 200);
  }

  setContent(content) {
    if (!this.element) return;
    const contentEl = $('.modal-content', this.element);
    if (contentEl) {
      if (typeof content === 'string') {
        contentEl.innerHTML = content;
      } else {
        contentEl.innerHTML = '';
        contentEl.appendChild(content);
      }
    }
  }

  setTitle(title) {
    if (!this.element) return;
    const titleEl = $('.modal-title', this.element);
    if (titleEl) {
      titleEl.textContent = title;
    }
  }
}

/**
 * Helper pro rychlé zobrazení modalu
 */
export function showModal(options) {
  const modal = new Modal(options);
  modal.open();
  return modal;
}

/**
 * Confirm dialog
 */
export function confirm(message, title = 'Potvrzení') {
  return new Promise(resolve => {
    showModal({
      title,
      content: message,
      actions: [
        { label: 'Zrušit', onClick: () => resolve(false) },
        { label: 'OK', primary: true, onClick: () => resolve(true) },
      ],
    });
  });
}

/**
 * Alert dialog
 */
export function alert(message, title = 'Upozornění') {
  return new Promise(resolve => {
    showModal({
      title,
      content: message,
      actions: [{ label: 'OK', primary: true, onClick: () => resolve() }],
    });
  });
}

export default Modal;
