/**
 * UIRenderingService.js
 * Service pro rendering AI Panel UI komponent
 * Zodpovědný za generování HTML, formátování zpráv a syntax highlighting
 */

import { ICONS } from '../constants/Messages.js';

export class UIRenderingService {
  constructor(aiPanel) {
    this.aiPanel = aiPanel;
    console.log('[UIRenderingService] Initialized');
  }

  /**
   * Escape HTML special characters
   */
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * Create content preview for collapsible sections
   */
  createContentPreview(content) {
    // Try to extract the first heading or first sentence
    const headingMatch = content.match(/^#+ (.+)$/m);
    if (headingMatch) {
      return headingMatch[1];
    }

    // Try to get first sentence
    const firstSentence = content.split(/[.!?]\s/)[0];
    if (firstSentence && firstSentence.length < 100) {
      return firstSentence + '...';
    }

    // Fallback to first 80 chars
    return content.substring(0, 80) + '...';
  }

  /**
   * Format AI message text (bold, code, links)
   */
  formatAIMessage(text) {
    if (!text) return '';

    let formatted = this.escapeHtml(text);

    // **bold**
    formatted = formatted.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');

    // `code`
    formatted = formatted.replace(/`([^`]+)`/g, '<code style="background: rgba(255,255,255,0.1); padding: 2px 6px; border-radius: 3px; font-family: monospace; font-size: 0.9em;">$1</code>');

    // Links [text](url)
    formatted = formatted.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" style="color: #60a5fa; text-decoration: underline;">$1</a>');

    // Headings
    formatted = formatted.replace(/^### (.+)$/gm, '<h4 style="margin: 16px 0 8px 0; font-size: 1em; font-weight: 600;">$1</h4>');
    formatted = formatted.replace(/^## (.+)$/gm, '<h3 style="margin: 18px 0 10px 0; font-size: 1.1em; font-weight: 600;">$1</h3>');
    formatted = formatted.replace(/^# (.+)$/gm, '<h2 style="margin: 20px 0 12px 0; font-size: 1.2em; font-weight: 600;">$1</h2>');

    // Lists
    formatted = formatted.replace(/^- (.+)$/gm, '<li style="margin-left: 20px;">$1</li>');
    formatted = formatted.replace(/^(\d+)\. (.+)$/gm, '<li style="margin-left: 20px;" value="$1">$2</li>');

    // Wrap consecutive list items
    formatted = formatted.replace(/(<li[^>]*>.*?<\/li>\s*)+/gs, '<ul style="margin: 8px 0; padding-left: 0;">$&</ul>');

    // Line breaks
    formatted = formatted.replace(/\n/g, '<br>');

    return formatted;
  }

  /**
   * Syntax highlighting for code blocks
   */
  highlightCode(code, language) {
    const escaped = this.escapeHtml(code);

    // Basic syntax highlighting
    if (language === 'javascript' || language === 'js') {
      return escaped
        .replace(/\b(const|let|var|function|return|if|else|for|while|class|import|export|async|await|try|catch)\b/g, '<span style="color: #c678dd;">$1</span>')
        .replace(/('.*?'|".*?")/g, '<span style="color: #98c379;">$1</span>')
        .replace(/\b(\d+)\b/g, '<span style="color: #d19a66;">$1</span>');
    } else if (language === 'html') {
      return escaped
        .replace(/(&lt;\/?[a-zA-Z][a-zA-Z0-9]*)/g, '<span style="color: #e06c75;">$1</span>')
        .replace(/([a-zA-Z-]+)=/g, '<span style="color: #9cdcfe;">$1</span>=');
    } else if (language === 'css') {
      return escaped
        .replace(/([.#][a-zA-Z-_][a-zA-Z0-9-_]*)/g, '<span style="color: #d7ba7d;">$1</span>')
        .replace(/([a-zA-Z-]+):/g, '<span style="color: #9cdcfe;">$1</span>:');
    }

    return escaped;
  }

  /**
   * Add chat message with formatted content
   */
  addChatMessage(role, content, messageId = null) {
    const messagesContainer = this.aiPanel.modal.element.querySelector('#aiChatMessages');
    const msgId = messageId || `msg-${Date.now()}-${Math.random()}`;

    const messageEl = document.createElement('div');
    messageEl.className = `ai-message ${role}`;
    messageEl.id = msgId;
    messageEl.setAttribute('data-message-id', msgId);

    if (role === 'assistant') {
      // Format AI assistant messages with markdown-like formatting
      messageEl.innerHTML = `<div>${this.formatAIMessage(content)}</div>`;
    } else {
      // Simple formatting for user and system messages
      messageEl.innerHTML = `<p>${this.escapeHtml(content).replace(/\n/g, '<br>')}</p>`;
    }

    messagesContainer.appendChild(messageEl);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;

    // Ensure scroll after DOM update
    setTimeout(() => {
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }, 100);

    return msgId;
  }

  /**
   * Add chat message with code blocks
   */
  addChatMessageWithCode(role, content, originalMessage = '', isModification = false, codeStatus = {}) {
    const messagesContainer = this.aiPanel.modal.element.querySelector('#aiChatMessages');
    const messageEl = document.createElement('div');
    messageEl.className = `ai-message ${role}`;

    // Detect code blocks
    const codeBlockRegex = /```(\w+)?\n?([\s\S]*?)```/g;
    let lastIndex = 0;
    let formattedContent = '';
    let codeBlocks = [];
    let match;

    while ((match = codeBlockRegex.exec(content)) !== null) {
      // Add text before code block
      if (match.index > lastIndex) {
        const textBefore = content.substring(lastIndex, match.index).trim();
        if (textBefore) {
          formattedContent += this.formatAIMessage(textBefore);
        }
      }

      const language = match[1] || 'html';
      const code = match[2].trim();
      codeBlocks.push({ language, code });

      // Add code block with collapsible wrapper and actions on top
      formattedContent += `
        <div class="code-block-wrapper">
          <div class="code-block-actions" data-code-index="${codeBlocks.length - 1}"></div>
          <details class="code-block-collapsible">
            <summary class="code-block-header">
              <span class="code-language">${language}</span>
              <span class="toggle-icon">▼</span>
            </summary>
            <pre class="code-block"><code>${this.escapeHtml(code)}</code></pre>
          </details>
        </div>
      `;

      lastIndex = match.index + match[0].length;
    }

    // Add remaining text
    if (lastIndex < content.length) {
      const remainingText = content.substring(lastIndex).trim();
      if (remainingText) {
        formattedContent += this.formatAIMessage(remainingText);
      }
    }

    // Check if content has action bar (undo/keep buttons) or is long
    const hasActionBar = content.includes('code-action-bar');
    const lineCount = content.split('\n').length;
    const isLongContent = lineCount > 10 || content.length > 500;

    // Auto-collapse long content or content with action bar
    if ((isLongContent || hasActionBar) && role === 'assistant') {
      const preview = this.createContentPreview(content);
      const shouldStartCollapsed = hasActionBar || lineCount > 15;

      // If has action bar, move it outside of details so it's always visible
      if (hasActionBar) {
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = formattedContent;
        const actionBar = tempDiv.querySelector('.code-action-bar');

        if (actionBar) {
          // Remove action bar from details content
          actionBar.remove();
          messageEl.innerHTML = `
            ${actionBar.outerHTML}
            <details class="message-collapsible">
              <summary class="message-summary">
                <span class="summary-text">${preview}</span>
                <span class="toggle-icon">▼</span>
              </summary>
              <div class="message-content">${tempDiv.innerHTML}</div>
            </details>
          `;
        } else {
          // No action bar found, use regular collapsible
          messageEl.innerHTML = `
            <details class="message-collapsible" ${shouldStartCollapsed ? '' : 'open'}>
              <summary class="message-summary">
                <span class="summary-text">${preview}</span>
                <span class="toggle-icon">▼</span>
              </summary>
              <div class="message-content">${formattedContent}</div>
            </details>
          `;
        }
      } else {
        // No action bar, standard long content collapsible
        messageEl.innerHTML = `
          <details class="message-collapsible" ${shouldStartCollapsed ? '' : 'open'}>
            <summary class="message-summary">
              <span class="summary-text">${preview}</span>
              <span class="toggle-icon">▼</span>
            </summary>
            <div class="message-content">${formattedContent}</div>
          </details>
        `;
      }
    } else {
      messageEl.innerHTML = formattedContent;
    }

    messagesContainer.appendChild(messageEl);

    // Add action buttons to code blocks
    codeBlocks.forEach((block, index) => {
      const actionsContainer = messageEl.querySelector(`.code-block-actions[data-code-index="${index}"]`);
      if (!actionsContainer) return;

      const copyBtn = document.createElement('button');
      copyBtn.className = 'code-action-btn copy-btn';
      copyBtn.dataset.code = block.code;
      copyBtn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 16px; height: 16px;"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg> Kopírovat`;
      copyBtn.onclick = function() {
        navigator.clipboard.writeText(this.dataset.code);
        this.textContent = `${ICONS.SPARKLES} Zkopírováno!`;
        setTimeout(() => {
          this.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 16px; height: 16px;"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg> Kopírovat`;
        }, 2000);
      };

      const insertBtn = document.createElement('button');
      insertBtn.className = 'code-action-btn insert-btn';
      insertBtn.dataset.code = block.code;
      insertBtn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 16px; height: 16px;"><path d="M12 5v14M5 12h14"/></svg> Vložit`;
      insertBtn.onclick = () => {
        this.aiPanel.codeEditorService.insertCodeToEditor(block.code);
        insertBtn.textContent = `${ICONS.SPARKLES} Vloženo!`;
        setTimeout(() => {
          insertBtn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 16px; height: 16px;"><path d="M12 5v14M5 12h14"/></svg> Vložit`;
        }, 2000);
      };

      actionsContainer.appendChild(copyBtn);
      actionsContainer.appendChild(insertBtn);

      // No auto-apply - user must choose
    });

    messagesContainer.scrollTop = messagesContainer.scrollHeight;

    // Ensure scroll after DOM update
    setTimeout(() => {
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }, 100);
  }
}
