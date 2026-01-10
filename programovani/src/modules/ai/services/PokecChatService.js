import { toast } from '../../../ui/components/Toast.js';

/**
 * PokecChatService - Spravuje samostatný chat pro obecnou konverzaci
 *
 * Funkce:
 * - Oddělený chat pro volnou konverzaci s AI
 * - Bez tools a code editing funkcí
 * - Vlastní historie zpráv
 * - Formátování markdown odpovědí
 */
export class PokecChatService {
  constructor(aiPanel) {
    this.aiPanel = aiPanel;
    this.pokecHistory = []; // Separate history for pokec chat
    this.isProcessing = false;
  }

  /**
   * Send message in pokec mode
   */
  async sendMessage(message) {
    // Race condition protection
    if (this.isProcessing) {
      toast.warning('⏳ Čekám na dokončení předchozího požadavku...', 2000);
      return;
    }

    this.isProcessing = true;

    // Add user message to pokec chat
    this.addMessage('user', message);

    // Add to history
    this.pokecHistory.push({ role: 'user', content: message });

    try {
      // Build simple system prompt for chat mode
      const systemPrompt = this.aiPanel.promptBuilder.buildChatModePrompt(
        message,
        this.pokecHistory.length > 1
      );

      // Get provider and model from UI
      let provider = this.aiPanel.modal.element.querySelector('#aiProvider')?.value;
      let model = this.aiPanel.modal.element.querySelector('#aiModel')?.value;
      const autoAI = this.aiPanel.modal.element.querySelector('#autoAI')?.checked;

      // If Auto AI is enabled, use intelligent model selection
      if (autoAI) {
        const bestModel = window.AI.selectBestCodingModel();
        provider = bestModel.provider;
        model = bestModel.model;
        console.log(`🤖 Auto AI (pokec): ${provider}/${model} (kvalita: ${bestModel.quality})`);
      } else if (!model || model === 'null' || model === '') {
        // Manual mode but no model selected - use best available
        const bestModel = window.AI.selectBestModel();
        provider = bestModel.provider;
        model = bestModel.model;
      } else {
        // Manual mode with specific model selected
        // Get provider from selected model's data-attribute (in case user selected model from different provider)
        const modelSelect = this.aiPanel.modal.element.querySelector('#aiModel');
        const selectedOption = modelSelect?.options[modelSelect.selectedIndex];
        const modelProvider = selectedOption?.dataset?.provider;
        if (modelProvider) {
          provider = modelProvider;
        }
      }

      // Build messages with history
      const messages = [
        { role: 'system', content: systemPrompt }
      ];

      // Add last 10 messages from history
      const recentHistory = this.pokecHistory.slice(-10);
      messages.push(...recentHistory);

      // Track start time for duration
      const startTime = Date.now();

      // Make API call
      const response = await window.AI.ask(message, {
        provider,
        model,
        messages
      });

      // Calculate duration
      const duration = Date.now() - startTime;

      // Add AI response to pokec chat
      this.addMessage('assistant', response);

      // Add to history
      this.pokecHistory.push({ role: 'assistant', content: response });

      // Show token usage if available
      if (window.AI.lastTokenUsage) {
        const { tokensIn, tokensOut } = window.AI.lastTokenUsage;
        const total = tokensIn + tokensOut;
        this.addMessage('system',
          `📊 ${total.toLocaleString()} tokenů (${tokensIn.toLocaleString()}→${tokensOut.toLocaleString()}) • ${duration}ms • ${provider}/${model}`
        );
      }

    } catch (error) {
      const errorMsg = error.message || 'Neznámá chyba';
      this.addMessage('system', `❌ Chyba: ${errorMsg}`);
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Add message to Pokec chat
   */
  addMessage(role, content) {
    const messagesContainer = this.aiPanel.modal.element.querySelector('#aiPokecMessages');
    if (!messagesContainer) return;

    const messageEl = document.createElement('div');
    messageEl.className = `ai-message ${role}`;

    // Format content with markdown-like formatting
    const formattedContent = this.formatMessageContent(content);
    messageEl.innerHTML = formattedContent;

    messagesContainer.appendChild(messageEl);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;

    // Ensure scroll after DOM update
    setTimeout(() => {
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }, 100);
  }

  /**
   * Format message content with code blocks
   */
  formatMessageContent(content) {
    if (!content || typeof content !== 'string') {
      return '';
    }

    // Escape HTML
    const escapeHtml = (text) => {
      const div = document.createElement('div');
      div.textContent = text;
      return div.innerHTML;
    };

    // Store code blocks temporarily to prevent escaping
    const codeBlocks = [];
    content = content.replace(/```(\w+)?\n([\s\S]*?)```/g, (match, lang, code) => {
      const language = lang || 'code';
      const placeholder = `___CODE_BLOCK_${codeBlocks.length}___`;
      codeBlocks.push(`<pre class="code-block"><code class="language-${language}">${escapeHtml(code.trim())}</code></pre>`);
      return placeholder;
    });

    // Store inline code temporarily
    const inlineCodes = [];
    content = content.replace(/`([^`]+)`/g, (match, code) => {
      const placeholder = `___INLINE_CODE_${inlineCodes.length}___`;
      inlineCodes.push(`<code>${escapeHtml(code)}</code>`);
      return placeholder;
    });

    // Store links temporarily
    const links = [];
    content = content.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (match, text, url) => {
      const placeholder = `___LINK_${links.length}___`;
      links.push(`<a href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(text)}</a>`);
      return placeholder;
    });

    // Replace bold **text**
    content = content.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');

    // Escape remaining HTML
    content = escapeHtml(content);

    // Restore links
    links.forEach((link, i) => {
      content = content.replace(`___LINK_${i}___`, link);
    });

    // Restore inline codes
    inlineCodes.forEach((code, i) => {
      content = content.replace(`___INLINE_CODE_${i}___`, code);
    });

    // Restore code blocks
    codeBlocks.forEach((block, i) => {
      content = content.replace(`___CODE_BLOCK_${i}___`, block);
    });

    // Replace line breaks
    content = content.replace(/\n/g, '<br>');

    return content;
  }

  /**
   * Clear pokec chat history
   */
  clearHistory() {
    this.pokecHistory = [];
    const messagesContainer = this.aiPanel.modal.element.querySelector('#aiPokecMessages');
    if (messagesContainer) {
      messagesContainer.innerHTML = `
        <div class="ai-message system">
          <p>👋 Ahoj! Jsem v režimu volné konverzace. Můžeme si pokecát o programování, technologiích, algoritmech, nebo čemkoliv jiném. Ptej se na co chceš!</p>
        </div>
      `;
    }
    toast.show('🗑️ Historie pokec chatu vymazána', 'info');
  }

  /**
   * Attach event handlers for pokec chat
   */
  attachHandlers() {
    const pokecInput = this.aiPanel.modal.element.querySelector('#aiPokecInput');
    const pokecSendBtn = this.aiPanel.modal.element.querySelector('#aiPokecSendBtn');

    if (pokecInput && pokecSendBtn) {
      const sendMessage = () => {
        const message = pokecInput.value.trim();
        if (message) {
          this.sendMessage(message);
          pokecInput.value = '';
          pokecInput.style.height = 'auto';
        }
      };

      pokecSendBtn.addEventListener('click', sendMessage);

      pokecInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          sendMessage();
        }
      });

      // Auto-resize textarea
      pokecInput.addEventListener('input', () => {
        pokecInput.style.height = 'auto';
        pokecInput.style.height = pokecInput.scrollHeight + 'px';
      });
    }

    // Setup token counter for pokec chat
    this.setupTokenCounter();

    // Setup prompt dropdown
    this.setupPromptDropdown();
  }

  /**
   * Setup token counter for pokec input
   */
  setupTokenCounter() {
    const pokecInput = this.aiPanel.modal?.element?.querySelector('#aiPokecInput');
    const tokenCounter = this.aiPanel.modal?.element?.querySelector('#pokecTokenCounter');

    if (!pokecInput || !tokenCounter) return;

    pokecInput.addEventListener('input', () => {
      const text = pokecInput.value;
      const charCount = text.length;
      // Rough estimation: 1 token ≈ 4 characters
      const tokenCount = Math.ceil(charCount / 4);

      // Odhad system promptu pro pokec (menší než pro kód, průměrně ~500-1000 tokenů)
      const systemPromptTokens = 800;

      // Tokeny z historie (pokec chat má vlastní historii)
      const historyTokens = Math.ceil(this.pokecHistory.reduce((sum, msg) => sum + msg.content.length, 0) / 4);

      // Celkový odhad (zpráva + systém + historie)
      const totalTokens = tokenCount + systemPromptTokens + historyTokens;

      tokenCounter.querySelector('.token-count').textContent = tokenCount;
      const totalCountSpan = tokenCounter.querySelector('.total-token-count');
      if (totalCountSpan) {
        totalCountSpan.textContent = `~${totalTokens.toLocaleString()}`;
      }

      // Color coding na základě celkového počtu
      if (totalTokens > 100000) {
        tokenCounter.style.color = '#ef4444';
      } else if (totalTokens > 50000) {
        tokenCounter.style.color = '#f59e0b';
      } else {
        tokenCounter.style.color = 'var(--text-secondary)';
      }
    });
  }

  /**
   * Setup prompt dropdown menu
   */
  setupPromptDropdown() {
    const promptBtn = this.aiPanel.modal?.element?.querySelector('#pokecPromptBtn');
    const promptMenu = this.aiPanel.modal?.element?.querySelector('#pokecPromptMenu');
    const pokecInput = this.aiPanel.modal?.element?.querySelector('#aiPokecInput');

    if (!promptBtn || !promptMenu || !pokecInput) return;

    // Toggle menu on button click
    promptBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const isHidden = promptMenu.style.display === 'none';
      promptMenu.style.display = isHidden ? 'block' : 'none';
      promptBtn.classList.toggle('active', isHidden);
    });

    // Close menu when clicking outside
    document.addEventListener('click', (e) => {
      if (!promptBtn.contains(e.target) && !promptMenu.contains(e.target)) {
        promptMenu.style.display = 'none';
        promptBtn.classList.remove('active');
      }
    });

    // Handle prompt item clicks
    const promptItems = promptMenu.querySelectorAll('.prompt-item');
    promptItems.forEach(item => {
      item.addEventListener('click', () => {
        const promptType = item.dataset.prompt;
        this.handlePromptSelection(promptType, pokecInput);
        promptMenu.style.display = 'none';
        promptBtn.classList.remove('active');
      });
    });
  }

  /**
   * Handle prompt selection
   */
  handlePromptSelection(promptType, inputElement) {
    let promptText = '';

    switch (promptType) {
      case 'search-code':
        promptText = `🔍 **Najdi dostupná řešení z těchto zdrojů:**

Prohledej tyto weby a najdi vhodná řešení:
• [CodePen.io](https://codepen.io/search/pens) - interaktivní příklady
• [CodeSandbox.io](https://codesandbox.io/search) - webové aplikace
• [GitHub.com](https://github.com/search?type=repositories) - open source projekty
• [JSFiddle.net](https://jsfiddle.net/) - rychlé testy
• [StackBlitz.com](https://stackblitz.com/) - online IDE
• [MDN Web Docs](https://developer.mozilla.org/en-US/search) - dokumentace
• [W3Schools.com](https://www.w3schools.com/howto/) - tutoriály

**INSTRUKCE:** Podle mého požadavku níže prosím:
1. Vyhledej dostupná řešení na těchto webech
2. Vypiš **seznam nalezených projektů** ve formátu:
   - **Název projektu** - stručný popis co dělá
   - Zdroj: [název webu](přímý odkaz)
   - Klíčové vlastnosti/technologie
3. Minimálně 3-5 různých řešení z různých zdrojů
4. Nepiš celý kód, jen přehled co je dostupné

**Co hledám:** `;
        break;

      case 'explain-concept':
        promptText = 'Vysvětli mi tento koncept: ';
        break;

      case 'best-practices':
        promptText = 'Jaké jsou best practices pro: ';
        break;

      case 'debug-help':
        promptText = 'Pomoz mi debugovat tento problém: ';
        break;

      default:
        return;
    }

    // Insert prompt into textarea
    inputElement.value = promptText;
    inputElement.focus();

    // Auto-resize textarea
    inputElement.style.height = 'auto';
    inputElement.style.height = inputElement.scrollHeight + 'px';

    // Move cursor to end
    inputElement.setSelectionRange(promptText.length, promptText.length);
  }
}
