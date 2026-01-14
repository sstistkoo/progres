/**
 * ProviderService.js
 * Service pro správu AI providerů, modelů a Auto AI
 * Extrahováno z AIPanel.js
 */

import { eventBus } from '../../../core/events.js';
import { toast } from '../../../ui/components/Toast.js';

export class ProviderService {
  constructor(panel) {
    this.panel = panel;
    this.favoriteModels = JSON.parse(localStorage.getItem('ai_favorite_models') || '{}');
    console.log('[ProviderService] Initialized');
  }

  /**
   * Generate HTML options for provider select
   */
  generateProviderOptions() {
    const providers = [
      { value: 'gemini', label: '🔷 Google Gemini', free: true },
      { value: 'groq', label: '⚡ Groq', free: true },
      { value: 'openrouter', label: '🌐 OpenRouter', free: false },
      { value: 'mistral', label: '🔮 Mistral AI', free: false },
      { value: 'huggingface', label: '🤗 HuggingFace', free: true }
    ];

    return providers.map(p =>
      `<option value="${p.value}">${p.label}${p.free ? ' (Free)' : ''}</option>`
    ).join('');
  }

  /**
   * Update models dropdown based on selected provider
   */
  async updateModels(provider) {
    const modelSelect = this.panel.modal?.element?.querySelector('#aiModel');
    if (!modelSelect) return;

    modelSelect.innerHTML = '<option value="">Načítání...</option>';
    modelSelect.disabled = true;

    try {
      const models = await this.getModelsForProvider(provider);

      if (models.length === 0) {
        modelSelect.innerHTML = '<option value="">Žádné modely</option>';
        return;
      }

      // Sort: favorites first, then by name
      const favorites = this.favoriteModels[provider] || [];
      const sortedModels = [...models].sort((a, b) => {
        const aFav = favorites.includes(a.value);
        const bFav = favorites.includes(b.value);
        if (aFav && !bFav) return -1;
        if (!aFav && bFav) return 1;
        return a.label.localeCompare(b.label);
      });

      modelSelect.innerHTML = sortedModels.map(m => {
        const isFav = favorites.includes(m.value);
        return `<option value="${m.value}" ${isFav ? 'data-favorite="true"' : ''}>${isFav ? '⭐ ' : ''}${m.label}</option>`;
      }).join('');

      modelSelect.disabled = false;
    } catch (error) {
      console.error('[ProviderService] Error loading models:', error);
      modelSelect.innerHTML = '<option value="">Chyba načítání</option>';
    }
  }

  /**
   * Get available models for provider
   */
  async getModelsForProvider(provider) {
    const modelsByProvider = {
      gemini: [
        { value: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash (Recommended)' },
        { value: 'gemini-2.0-flash', label: 'Gemini 2.0 Flash' },
        { value: 'gemini-1.5-pro', label: 'Gemini 1.5 Pro' },
        { value: 'gemini-1.5-flash', label: 'Gemini 1.5 Flash' }
      ],
      groq: [
        { value: 'llama-3.3-70b-versatile', label: 'Llama 3.3 70B' },
        { value: 'llama-3.1-70b-versatile', label: 'Llama 3.1 70B' },
        { value: 'mixtral-8x7b-32768', label: 'Mixtral 8x7B' },
        { value: 'gemma2-9b-it', label: 'Gemma 2 9B' }
      ],
      openrouter: [
        { value: 'anthropic/claude-3.5-sonnet', label: 'Claude 3.5 Sonnet' },
        { value: 'openai/gpt-4o', label: 'GPT-4o' },
        { value: 'google/gemini-2.0-flash-exp:free', label: 'Gemini 2.0 Flash (Free)' },
        { value: 'meta-llama/llama-3.3-70b-instruct', label: 'Llama 3.3 70B' }
      ],
      mistral: [
        { value: 'mistral-large-latest', label: 'Mistral Large' },
        { value: 'mistral-medium-latest', label: 'Mistral Medium' },
        { value: 'mistral-small-latest', label: 'Mistral Small' },
        { value: 'codestral-latest', label: 'Codestral' }
      ],
      huggingface: [
        { value: 'Qwen/Qwen2.5-Coder-32B-Instruct', label: 'Qwen 2.5 Coder 32B' },
        { value: 'microsoft/Phi-3-mini-4k-instruct', label: 'Phi-3 Mini' },
        { value: 'bigcode/starcoder2-15b', label: 'StarCoder2 15B' }
      ]
    };

    return modelsByProvider[provider] || [];
  }

  /**
   * Toggle model as favorite
   */
  toggleModelFavorite(provider, modelValue) {
    if (!this.favoriteModels[provider]) {
      this.favoriteModels[provider] = [];
    }

    const index = this.favoriteModels[provider].indexOf(modelValue);
    if (index === -1) {
      this.favoriteModels[provider].push(modelValue);
      toast.success('⭐ Model přidán do oblíbených', 2000);
    } else {
      this.favoriteModels[provider].splice(index, 1);
      toast.info('Model odebrán z oblíbených', 2000);
    }

    localStorage.setItem('ai_favorite_models', JSON.stringify(this.favoriteModels));

    // Refresh model list
    this.updateModels(provider);
  }

  /**
   * Update Auto AI state
   */
  updateAutoAIState() {
    const autoAICheckbox = this.panel.modal?.element?.querySelector('#autoAI');
    const providerSelect = this.panel.modal?.element?.querySelector('#aiProvider');
    const modelSelect = this.panel.modal?.element?.querySelector('#aiModel');

    if (!autoAICheckbox) return;

    const isAutoAI = autoAICheckbox.checked;
    localStorage.setItem('ai_autoAI', isAutoAI);

    // Disable/enable manual selection
    if (providerSelect) providerSelect.disabled = isAutoAI;
    if (modelSelect) modelSelect.disabled = isAutoAI;

    // Update visual state
    const container = autoAICheckbox.closest('.auto-ai-container');
    if (container) {
      container.classList.toggle('active', isAutoAI);
    }

    if (isAutoAI) {
      console.log('[ProviderService] Auto AI enabled - model will be selected automatically');
    } else {
      console.log('[ProviderService] Auto AI disabled - manual model selection');
    }
  }

  /**
   * Get current provider setting
   */
  getCurrentProvider() {
    const select = this.panel.modal?.element?.querySelector('#aiProvider');
    return select?.value || 'gemini';
  }

  /**
   * Get current model setting
   */
  getCurrentModel() {
    const select = this.panel.modal?.element?.querySelector('#aiModel');
    return select?.value || '';
  }

  /**
   * Check if Auto AI is enabled
   */
  isAutoAIEnabled() {
    const checkbox = this.panel.modal?.element?.querySelector('#autoAI');
    return checkbox?.checked ?? true;
  }

  /**
   * Initialize provider/model state from localStorage
   */
  initializeFromStorage() {
    const savedAutoAI = localStorage.getItem('ai_autoAI');
    const autoAICheckbox = this.panel.modal?.element?.querySelector('#autoAI');

    if (autoAICheckbox && savedAutoAI !== null) {
      autoAICheckbox.checked = savedAutoAI === 'true';
    }

    this.updateAutoAIState();
  }
}
