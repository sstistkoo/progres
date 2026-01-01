/**
 * AI Module v3.0
 * ===============
 * Univerzální modul pro práci s AI API (Gemini, Groq, OpenRouter, Mistral, Cohere, HuggingFace)
 *
 * ⚠️ DŮLEŽITÉ PRO AI ASISTENTY (Claude, ChatGPT, apod.):
 * ══════════════════════════════════════════════════════
 * Tento modul se používá ve VÍCE HTML souborech a projektech současně!
 * Jakákoliv úprava tohoto souboru může POKAZIT funkčnost ostatních stránek.
 *
 * Před úpravou:
 * 1. Zeptej se uživatele, zda chce upravit TENTO sdílený modul, nebo vytvořit kopii
 * 2. Upozorni, že změna ovlivní VŠECHNY stránky, které tento modul používají
 * 3. Při přidávání funkcí zachovej zpětnou kompatibilitu
 * 4. NEMĚŇ existující API/názvy funkcí - mohlo by to rozbít závislý kód
 * ══════════════════════════════════════════════════════
 *
 * NOVÉ ve v3.0:
 * - Event systém - AI.on('request:complete', callback)
 * - Workflow/Pipeline - řetězení kroků
 * - Scheduler - plánované úlohy
 * - Intent Detection - rozpoznání záměru
 * - Smart Ask - auto-retry, load balancing
 * - Parallel - paralelní zpracování
 * - askJSON - validace a auto-fix JSON
 * - Conversation summarize - sumarizace historie
 *
 * Použití: Načti soubor přes <scr​ipt src="ai-module.js"></scr​ipt>
 *
 * Příklady:
 *   const response = await AI.ask("Ahoj, jak se máš?");
 *   const response = await AI.ask("Ahoj", { provider: 'groq' });
 *   AI.on('request:complete', (data) => console.log('Hotovo:', data));
 *   const result = await AI.workflow.create('test').step('s1', {system:'...'}).run('text');
 *   AI.scheduler.add('job', 'every 5m', async () => { ... });
 *   const intent = await AI.detectIntent("Přelož to do angličtiny");
 *   const result = await AI.smartAsk("Dotaz", { balanceLoad: true });
 *   const results = await AI.parallel(["Dotaz 1", "Dotaz 2"]);
 *   const data = await AI.askJSON("Extrahuj data", { schema: {...} });
 *
 * Podporovaní provideři:
 * - gemini (Google) - https://aistudio.google.com/app/apikey
 * - groq - https://console.groq.com/keys
 * - openrouter - https://openrouter.ai/keys
 * - mistral - https://console.mistral.ai/api-keys/
 * - cohere - https://dashboard.cohere.com/api-keys
 * - huggingface - https://huggingface.co/settings/tokens
 *
 * Dostupné eventy:
 * - init, request:start, request:complete, request:error
 * - workflow:start, workflow:step:start, workflow:step:complete, workflow:complete
 * - scheduler:start, scheduler:run, scheduler:complete, scheduler:error
 * - intent:detected, conversation:summarized
 * - smartAsk:attempt, smartAsk:success, smartAsk:error
 * - parallel:start, parallel:task:start, parallel:task:complete
 *
 * @author Claude AI
 * @version 3.0
 * @license MIT
 */

const AI = {

    // ============== DEMO KLÍČE (rozdělené pro GitHub) ==============
    DEMO_KEYS: {
        gemini: "***REMOVED***" + "***REMOVED***",
        groq: "***REMOVED***" + "***REMOVED***",
        openrouter: "***REMOVED***" + "***REMOVED***",
        mistral: "***REMOVED***" + "***REMOVED***",
        cohere: "***REMOVED***" + "***REMOVED***",
        huggingface: "***REMOVED***" + "***REMOVED***"
    },

    // ============== KONFIGURACE ==============
    config: {
        keys: {
            gemini: '',
            groq: '',
            openrouter: '',
            mistral: '',
            cohere: '',
            huggingface: ''
        },

        // Výchozí modely - nejlepší z každého providera
        models: {
            gemini: 'gemini-1.5-flash',           // Nejchytřejší Gemini
            groq: 'llama-3.3-70b-versatile',      // Nejchytřejší Groq
            openrouter: 'mistralai/mistral-small-3.1-24b-instruct:free',
            mistral: 'mistral-small-latest',
            cohere: 'command-a-03-2025',
            huggingface: 'mistralai/Mistral-7B-Instruct-v0.3'
        },

        defaultProvider: 'groq',  // Groq má nejlepší free limity (30 RPM)
        timeout: 90000,
        maxRetries: 3
    },

    // ============== AKTIVNÍ POŽADAVEK (pro cancel) ==============
    _activeController: null,
    _debug: false,
    _requestQueue: [],
    _processing: false,

    // ============== DEBUG MODE ==============
    debug(enabled = true) {
        this._debug = enabled;
        console.log(enabled ? '🐛 Debug mode ON' : '🐛 Debug mode OFF');
    },

    _log(...args) {
        if (this._debug) {
            console.log('🤖 [AI]', ...args);
        }
    },

    // ============== REQUEST QUEUE ==============
    queue: {
        _items: [],
        _processing: false,
        _delay: 1000, // ms mezi požadavky

        // Přidej do fronty
        add(prompt, options = {}) {
            return new Promise((resolve, reject) => {
                AI.queue._items.push({ prompt, options, resolve, reject });
                AI.queue._process();
            });
        },

        // Zpracuj frontu
        async _process() {
            if (this._processing || this._items.length === 0) return;

            this._processing = true;

            while (this._items.length > 0) {
                const { prompt, options, resolve, reject } = this._items.shift();

                try {
                    const response = await AI.ask(prompt, options);
                    resolve(response);
                } catch (e) {
                    reject(e);
                }

                // Čekej mezi požadavky
                if (this._items.length > 0) {
                    await new Promise(r => setTimeout(r, this._delay));
                }
            }

            this._processing = false;
        },

        // Počet položek ve frontě
        size() {
            return this._items.length;
        },

        // Vyčisti frontu
        clear() {
            this._items.forEach(item => item.reject(new Error('Queue cleared')));
            this._items = [];
        }
    },

    // ============== STATISTIKY POUŽITÍ ==============
    stats: {
        _data: {
            totalCalls: 0,
            totalTokensIn: 0,
            totalTokensOut: 0,
            dailyCalls: 0,
            lastReset: new Date().toISOString(),
            byProvider: {}
        },

        // Načti statistiky z localStorage
        load() {
            try {
                const stored = localStorage.getItem('ai_module_stats');
                if (stored) {
                    this._data = JSON.parse(stored);
                    this._checkDailyReset();
                }
            } catch (e) {}
            return this._data;
        },

        // Ulož statistiky
        save() {
            try {
                localStorage.setItem('ai_module_stats', JSON.stringify(this._data));
            } catch (e) {}
        },

        // Zaznamenej volání
        record(provider, tokensIn = 0, tokensOut = 0) {
            this._data.totalCalls++;
            this._data.dailyCalls++;
            this._data.totalTokensIn += tokensIn;
            this._data.totalTokensOut += tokensOut;

            if (!this._data.byProvider[provider]) {
                this._data.byProvider[provider] = { calls: 0, tokensIn: 0, tokensOut: 0 };
            }
            this._data.byProvider[provider].calls++;
            this._data.byProvider[provider].tokensIn += tokensIn;
            this._data.byProvider[provider].tokensOut += tokensOut;

            this.save();
        },

        // Získej statistiky
        get() {
            return { ...this._data };
        },

        // Reset statistik
        reset() {
            this._data = {
                totalCalls: 0,
                totalTokensIn: 0,
                totalTokensOut: 0,
                dailyCalls: 0,
                lastReset: new Date().toISOString(),
                byProvider: {}
            };
            this.save();
        },

        // Kontrola denního resetu
        _checkDailyReset() {
            const lastReset = new Date(this._data.lastReset);
            const today = new Date();
            if (lastReset.toDateString() !== today.toDateString()) {
                this._data.dailyCalls = 0;
                this._data.lastReset = today.toISOString();
                this.save();
            }
        }
    },

    // ============== RATE LIMITING ==============
    rateLimit: {
        _timestamps: {},
        _windowMs: 60000, // 1 minuta

        // Zaznamenej požadavek
        record(provider) {
            if (!this._timestamps[provider]) {
                this._timestamps[provider] = [];
            }
            this._timestamps[provider].push(Date.now());
            this._cleanup(provider);
            this._save();
        },

        // Vyčisti staré záznamy
        _cleanup(provider) {
            if (!this._timestamps[provider]) {
                this._timestamps[provider] = [];
                return;
            }
            const now = Date.now();
            this._timestamps[provider] = this._timestamps[provider].filter(
                ts => now - ts < this._windowMs
            );
        },

        // Může udělat požadavek?
        canMakeRequest(provider, model = null) {
            this._cleanup(provider);
            const current = this._timestamps[provider]?.length || 0;
            const limit = this._getLimit(provider, model);
            return current < limit;
        },

        // Kolik požadavků zbývá
        remaining(provider, model = null) {
            this._cleanup(provider);
            const current = this._timestamps[provider]?.length || 0;
            const limit = this._getLimit(provider, model);
            return Math.max(0, limit - current);
        },

        // Získej limit pro providera/model
        _getLimit(provider, model) {
            // Specifické limity pro modely
            const modelLimits = {
                'gemini-2.5-flash-lite': 15,
                'gemini-2.5-flash': 10,
                'gemini-3-pro-preview': 2
            };
            if (model && modelLimits[model]) {
                return modelLimits[model];
            }
            // Obecné limity podle providera
            const providerLimits = {
                gemini: 15,
                groq: 30,
                openrouter: 20,
                mistral: 30,
                cohere: 20,
                huggingface: 10
            };
            return providerLimits[provider] || 15;
        },

        // Ulož do localStorage
        _save() {
            try {
                localStorage.setItem('ai_module_ratelimit', JSON.stringify(this._timestamps));
            } catch (e) {}
        },

        // Načti z localStorage
        load() {
            try {
                const stored = localStorage.getItem('ai_module_ratelimit');
                if (stored) {
                    this._timestamps = JSON.parse(stored);
                    // Vyčisti staré záznamy
                    Object.keys(this._timestamps).forEach(p => this._cleanup(p));
                }
            } catch (e) {}
        }
    },

    // ============== HISTORIE KONVERZACE ==============
    conversation: {
        _history: [],
        _maxLength: 20, // Max počet zpráv v historii

        // Přidej zprávu
        add(role, content) {
            this._history.push({ role, content, timestamp: Date.now() });
            // Ořízni pokud je moc dlouhá
            if (this._history.length > this._maxLength) {
                this._history = this._history.slice(-this._maxLength);
            }
            this._save();
        },

        // Získej historii
        get() {
            return [...this._history];
        },

        // Vyčisti historii
        clear() {
            this._history = [];
            this._save();
        },

        // Získej jako messages pro API
        getMessages(systemPrompt = null) {
            const messages = [];
            if (systemPrompt) {
                messages.push({ role: 'system', content: systemPrompt });
            }
            this._history.forEach(h => {
                messages.push({ role: h.role, content: h.content });
            });
            return messages;
        },

        // Shrň konverzaci pro úsporu tokenů
        async summarize(options = {}) {
            if (this._history.length < 4) {
                return { summarized: false, reason: 'Konverzace je příliš krátká' };
            }

            const keepLast = options.keepLast || 2;
            const toSummarize = this._history.slice(0, -keepLast);
            const toKeep = this._history.slice(-keepLast);

            // Sestav text pro sumarizaci
            const conversationText = toSummarize
                .map(h => `${h.role}: ${h.content}`)
                .join('\n');

            try {
                const summary = await AI.ask(
                    `Shrň tuto konverzaci do 2-3 vět, zachovej klíčové informace:\n\n${conversationText}`,
                    {
                        system: 'Vytváříš stručná shrnutí konverzací. Zachovej důležité fakty a kontext.',
                        provider: options.provider || 'groq',
                        temperature: 0.3
                    }
                );

                // Nahraď historii
                this._history = [
                    { role: 'system', content: `[Shrnutí předchozí konverzace: ${summary}]`, timestamp: Date.now() },
                    ...toKeep
                ];

                this._save();

                AI.emit('conversation:summarized', {
                    originalLength: toSummarize.length + toKeep.length,
                    newLength: this._history.length,
                    summary
                });

                return {
                    summarized: true,
                    summary,
                    removedMessages: toSummarize.length,
                    keptMessages: toKeep.length
                };

            } catch (error) {
                return { summarized: false, error: error.message };
            }
        },

        // Odhadni tokeny v historii
        estimateTokens() {
            const text = this._history.map(h => h.content).join(' ');
            return AI.estimateTokens(text);
        },

        // Auto-summarize pokud přesáhne limit
        async autoSummarize(maxTokens = 2000, options = {}) {
            const tokens = this.estimateTokens();
            if (tokens > maxTokens) {
                return await this.summarize(options);
            }
            return { summarized: false, reason: 'Pod limitem tokenů', tokens };
        },

        // Ulož do localStorage
        _save() {
            try {
                localStorage.setItem('ai_module_conversation', JSON.stringify(this._history));
            } catch (e) {}
        },

        // Načti z localStorage
        load() {
            try {
                const stored = localStorage.getItem('ai_module_conversation');
                if (stored) {
                    this._history = JSON.parse(stored);
                }
            } catch (e) {}
        }
    },

    // ============== ODHAD TOKENŮ ==============
    estimateTokens(text) {
        if (!text) return 0;
        // Přibližný odhad: ~4 znaky = 1 token pro angličtinu
        // Pro češtinu ~3 znaky = 1 token
        return Math.ceil(text.length / 3.5);
    },

    // ============== ZRUŠENÍ POŽADAVKU ==============
    cancel() {
        if (this._activeController) {
            this._activeController.abort();
            this._activeController = null;
            console.log('🛑 Požadavek zrušen');
            return true;
        }
        return false;
    },

    // ============== VŠECHNY MODELY (seřazené od nejlepších) ==============
    ALL_MODELS: {
        gemini: [
            { value: "gemini-2.5-flash", name: "🧠 Gemini 2.5 Flash", rpm: 10, quality: 95 },
            { value: "gemini-2.5-flash-lite", name: "⚡ Gemini 2.5 Flash-Lite", rpm: 15, quality: 85 }
        ],
        groq: [
            { value: "llama-3.3-70b-versatile", name: "🧠 Llama 3.3 70B (nejchytřejší)", rpm: 30, quality: 90 },
            { value: "openai/gpt-oss-120b", name: "🧠 GPT OSS 120B", rpm: 30, quality: 88 },
            { value: "meta-llama/llama-4-maverick-17b-128e-instruct", name: "👁️ Llama 4 Maverick (Vision)", rpm: 30, quality: 85 },
            { value: "meta-llama/llama-4-scout-17b-16e-instruct", name: "👁️ Llama 4 Scout (Vision)", rpm: 30, quality: 82 },
            { value: "openai/gpt-oss-20b", name: "⚡ GPT OSS 20B (rychlý)", rpm: 30, quality: 75 },
            { value: "llama-3.1-8b-instant", name: "⚡ Llama 3.1 8B (nejrychlejší)", rpm: 30, quality: 65 }
        ],
        mistral: [
            { value: "mistral-small-latest", name: "🧠 Mistral Small", rpm: 30, quality: 80 },
            { value: "codestral-latest", name: "💻 Codestral (kódování)", rpm: 30, quality: 78 }
        ],
        cohere: [
            { value: "command-a-03-2025", name: "🧠 Command A (nejnovější)", rpm: 20, quality: 85 },
            { value: "command-r-plus-08-2024", name: "💬 Command R+", rpm: 20, quality: 80 },
            { value: "command-r-08-2024", name: "⚡ Command R (rychlý)", rpm: 20, quality: 70 }
        ],
        openrouter: [
            { value: "mistralai/mistral-small-3.1-24b-instruct:free", name: "🔥 Mistral Small 3.1 :free", rpm: 20, quality: 75 }
        ],
        huggingface: [
            { value: "mistralai/Mistral-7B-Instruct-v0.3", name: "🔥 Mistral 7B", rpm: 10, quality: 60 },
            { value: "microsoft/Phi-3-mini-4k-instruct", name: "🔬 Phi-3 Mini", rpm: 10, quality: 55 },
            { value: "HuggingFaceH4/zephyr-7b-beta", name: "💨 Zephyr 7B", rpm: 10, quality: 50 },
            { value: "google/gemma-2-2b-it", name: "🤖 Gemma 2 2B", rpm: 10, quality: 45 },
            { value: "tiiuae/falcon-7b-instruct", name: "🦅 Falcon 7B", rpm: 10, quality: 40 }
        ]
    },

    // Pořadí providerů od nejlepšího (pro fallback)
    PROVIDER_PRIORITY: ['groq', 'gemini', 'mistral', 'cohere', 'openrouter', 'huggingface'],

    // Modely s podporou vision (Groq)
    VISION_MODELS: [
        'meta-llama/llama-4-maverick-17b-128e-instruct',
        'meta-llama/llama-4-scout-17b-16e-instruct'
    ],

    // Získej nejlepší dostupný model pro providera
    getBestModel(provider) {
        const models = this.ALL_MODELS[provider];
        if (!models || models.length === 0) return null;
        // Modely jsou už seřazené od nejlepšího
        return models[0].value;
    },

    // Získej všechny modely seřazené podle kvality (napříč providery)
    getAllModelsSorted() {
        const allModels = [];

        for (const [provider, models] of Object.entries(this.ALL_MODELS)) {
            if (!this.getKey(provider)) continue; // Přeskoč providery bez klíče

            for (const model of models) {
                allModels.push({
                    provider,
                    model: model.value,
                    name: model.name,
                    quality: model.quality || 50,
                    rpm: model.rpm
                });
            }
        }

        // Seřaď podle kvality (sestupně)
        return allModels.sort((a, b) => b.quality - a.quality);
    },

    // ============== HELPER FUNKCE ==============

    async fetchWithTimeout(url, options, timeoutMs) {
        const timeout = timeoutMs || this.config.timeout || 30000;

        // Vytvoř AbortController pro možnost zrušení
        this._activeController = new AbortController();
        const signal = this._activeController.signal;

        // Timeout promise
        const timeoutId = setTimeout(() => {
            this._activeController?.abort();
        }, timeout);

        try {
            const response = await fetch(url, { ...options, signal });
            clearTimeout(timeoutId);
            this._activeController = null;
            return response;
        } catch (err) {
            clearTimeout(timeoutId);
            this._activeController = null;
            if (err.name === 'AbortError') {
                throw new Error('Požadavek byl zrušen nebo vypršel timeout');
            }
            throw err;
        }
    },

    // Retry s exponenciálním backoff
    async retryWithBackoff(apiCall, maxRetries = null) {
        const retries = maxRetries || this.config.maxRetries;

        for (let attempt = 0; attempt < retries; attempt++) {
            try {
                return await apiCall();
            } catch (err) {
                const isRateLimit =
                    err.message?.includes('429') ||
                    err.message?.includes('quota') ||
                    err.message?.includes('RESOURCE_EXHAUSTED');

                if (isRateLimit && attempt < retries - 1) {
                    const retryMatch = err.message?.match(/retry in ([\d.]+)s/i);
                    let delayMs;

                    if (retryMatch) {
                        delayMs = Math.ceil(parseFloat(retryMatch[1]) * 1000);
                    } else {
                        delayMs = Math.pow(2, attempt + 1) * 1000;
                    }

                    console.log(`⏳ Rate limit, čekám ${delayMs/1000}s...`);
                    await new Promise(resolve => setTimeout(resolve, delayMs));
                    continue;
                }

                throw err;
            }
        }
    },

    // Parsování AI odpovědi (JSON cleaning)
    parseResponse(aiResponseText) {
        try {
            let cleanedJson = aiResponseText
                .replace(/```json\s*/gi, '')
                .replace(/```\s*/g, '');

            const firstBrace = cleanedJson.indexOf('{');
            const lastBrace = cleanedJson.lastIndexOf('}');

            if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
                cleanedJson = cleanedJson.substring(firstBrace, lastBrace + 1);
            }

            const openBraces = (cleanedJson.match(/\{/g) || []).length;
            const closeBraces = (cleanedJson.match(/\}/g) || []).length;
            const openBrackets = (cleanedJson.match(/\[/g) || []).length;
            const closeBrackets = (cleanedJson.match(/\]/g) || []).length;

            if (openBrackets > closeBrackets) {
                cleanedJson += ']'.repeat(openBrackets - closeBrackets);
            }
            if (openBraces > closeBraces) {
                cleanedJson += '}'.repeat(openBraces - closeBraces);
            }

            cleanedJson = cleanedJson.replace(/(\d+\.\d{6})\d{4,}/g, '$1');
            cleanedJson = cleanedJson.replace(/,\s*([}\]])/g, '$1');

            return JSON.parse(cleanedJson);
        } catch (e) {
            console.error('❌ Parse error:', e.message);
            return null;
        }
    },

    // ============== NASTAVENÍ ==============

    getKey(provider) {
        // 1. Zkus multi-key systém
        const multiKey = this.keys.getActive(provider);
        if (multiKey && multiKey.length > 10) {
            return multiKey;
        }

        // 2. Zkus config.keys (nastaveno přes setKey)
        const customKey = this.config.keys[provider];
        if (customKey && customKey.length > 10) {
            return customKey;
        }

        // 3. Fallback na demo klíče
        const demoKey = this.DEMO_KEYS[provider];
        if (demoKey && demoKey.length > 10) {
            return demoKey;
        }

        return null;
    },

    isUsingDemoKey(provider) {
        const multiKey = this.keys.getActive(provider);
        if (multiKey && multiKey.length > 10) return false;

        const customKey = this.config.keys[provider];
        return !(customKey && customKey.length > 10);
    },

    setKey(provider, key) {
        if (this.config.keys.hasOwnProperty(provider)) {
            this.config.keys[provider] = key;
            return true;
        }
        return false;
    },

    setModel(provider, model) {
        if (this.config.models.hasOwnProperty(provider)) {
            this.config.models[provider] = model;
            return true;
        }
        return false;
    },

    setDefaultProvider(provider) {
        if (this.config.keys.hasOwnProperty(provider)) {
            this.config.defaultProvider = provider;
            return true;
        }
        return false;
    },

    getAvailableProviders() {
        return ['gemini', 'groq', 'openrouter', 'mistral', 'cohere', 'huggingface']
            .filter(provider => this.getKey(provider) !== null);
    },

    // Získej všechny providery s jejich modely (pro UI)
    getAllProvidersWithModels() {
        return {
            groq: {
                name: 'Groq',
                models: [
                    { value: 'llama-3.3-70b-versatile', label: 'Llama 3.3 70B Versatile' },
                    { value: 'llama-3.1-70b-versatile', label: 'Llama 3.1 70B Versatile' },
                    { value: 'llama-3.2-90b-text-preview', label: 'Llama 3.2 90B Text' },
                    { value: 'mixtral-8x7b-32768', label: 'Mixtral 8x7B' },
                    { value: 'gemma2-9b-it', label: 'Gemma 2 9B' }
                ]
            },
            gemini: {
                name: 'Google Gemini',
                models: [
                    { value: 'gemini-1.5-flash', label: 'Gemini 1.5 Flash' },
                    { value: 'gemini-1.5-pro', label: 'Gemini 1.5 Pro' },
                    { value: 'gemini-1.0-pro', label: 'Gemini 1.0 Pro' }
                ]
            },
            openrouter: {
                name: 'OpenRouter',
                models: [
                    { value: 'mistralai/mistral-small-3.1-24b-instruct:free', label: 'Mistral Small 3.1 24B (Free)' },
                    { value: 'google/gemini-flash-1.5', label: 'Gemini Flash 1.5' },
                    { value: 'meta-llama/llama-3.1-8b-instruct:free', label: 'Llama 3.1 8B (Free)' },
                    { value: 'anthropic/claude-3.5-sonnet', label: 'Claude 3.5 Sonnet' },
                    { value: 'openai/gpt-4o-mini', label: 'GPT-4o Mini' }
                ]
            },
            mistral: {
                name: 'Mistral',
                models: [
                    { value: 'mistral-small-latest', label: 'Mistral Small (Latest)' },
                    { value: 'mistral-medium-latest', label: 'Mistral Medium' },
                    { value: 'mistral-large-latest', label: 'Mistral Large' },
                    { value: 'open-mistral-7b', label: 'Open Mistral 7B' },
                    { value: 'open-mixtral-8x7b', label: 'Open Mixtral 8x7B' }
                ]
            },
            cohere: {
                name: 'Cohere',
                models: [
                    { value: 'command-a-03-2025', label: 'Command A (2025)' },
                    { value: 'command-r-plus', label: 'Command R+' },
                    { value: 'command-r', label: 'Command R' },
                    { value: 'command-light', label: 'Command Light' }
                ]
            },
            huggingface: {
                name: 'HuggingFace',
                models: [
                    { value: 'mistralai/Mistral-7B-Instruct-v0.3', label: 'Mistral 7B Instruct' },
                    { value: 'meta-llama/Llama-2-13b-chat-hf', label: 'Llama 2 13B Chat' },
                    { value: 'bigscience/bloom-560m', label: 'BLOOM 560M' },
                    { value: 'google/flan-t5-xxl', label: 'FLAN-T5 XXL' }
                ]
            }
        };
    },

    // ============== GEMINI ==============

    async askGemini(prompt, options = {}) {
        const key = options.key || this.getKey('gemini');
        if (!key) throw new Error('Gemini API klíč není nastaven');

        const model = options.model || this.config.models.gemini;
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;

        const body = {
            contents: [{
                parts: [{ text: prompt }]
            }],
            generationConfig: {
                temperature: options.temperature ?? 0.7,
                maxOutputTokens: options.maxTokens ?? 4096
            }
        };

        if (options.system) {
            body.systemInstruction = {
                parts: [{ text: options.system }]
            };
        }

        const response = await this.retryWithBackoff(async () => {
            const resp = await this.fetchWithTimeout(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });

            if (!resp.ok) {
                const error = await resp.json().catch(() => ({}));
                throw new Error(error.error?.message || `HTTP ${resp.status}`);
            }

            return resp.json();
        });

        const text = response.candidates?.[0]?.content?.parts?.[0]?.text || '';

        if (options.parseJson) {
            return this.parseResponse(text);
        }

        return text;
    },

    // ============== GROQ ==============

    async askGroq(prompt, options = {}) {
        const key = options.key || this.getKey('groq');
        if (!key) throw new Error('Groq API klíč není nastaven');

        const model = options.model || this.config.models.groq;
        const url = 'https://api.groq.com/openai/v1/chat/completions';

        let messages = [];

        if (options.system) {
            messages.push({ role: 'system', content: options.system });
        }

        const isVisionModel = this.VISION_MODELS.includes(model);
        const hasImage = options.imageBase64 && options.imageMimeType;

        if (isVisionModel && hasImage) {
            messages.push({
                role: 'user',
                content: [
                    { type: 'text', text: prompt },
                    {
                        type: 'image_url',
                        image_url: {
                            url: `data:${options.imageMimeType};base64,${options.imageBase64}`
                        }
                    }
                ]
            });
        } else {
            messages.push({ role: 'user', content: prompt });
        }

        const response = await this.fetchWithTimeout(url, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${key}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: model,
                messages: messages,
                temperature: options.temperature ?? 0.7,
                max_tokens: options.maxTokens ?? 4096
            })
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({}));
            throw new Error(error.error?.message || `HTTP ${response.status}`);
        }

        const data = await response.json();
        let text = data.choices?.[0]?.message?.content || '';

        if (!text && data.choices?.[0]?.message?.reasoning) {
            text = data.choices[0].message.reasoning;
        }

        if (options.parseJson) {
            return this.parseResponse(text);
        }

        return text;
    },

    // ============== OPENROUTER ==============

    async askOpenRouter(prompt, options = {}) {
        const key = options.key || this.getKey('openrouter');
        if (!key) throw new Error('OpenRouter API klíč není nastaven');

        const model = options.model || this.config.models.openrouter;
        const url = 'https://openrouter.ai/api/v1/chat/completions';

        console.info('🌐 OpenRouter request:', model);

        const messages = [];

        if (options.system) {
            messages.push({ role: 'system', content: options.system });
        }
        messages.push({ role: 'user', content: prompt });

        const response = await this.fetchWithTimeout(url, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${key}`,
                'Content-Type': 'application/json',
                'HTTP-Referer': window.location.href,
                'X-Title': 'AI Module Test'
            },
            body: JSON.stringify({
                model: model,
                messages: messages,
                temperature: options.temperature ?? 0.7,
                max_tokens: options.maxTokens ?? 1024
            })
        });

        const data = await response.json().catch(() => ({}));

        console.info('🌐 OpenRouter response:', response.status, data);

        if (!response.ok) {
            // Detailní error handling
            const errMsg = data.error?.message || data.error?.code || JSON.stringify(data.error) || `HTTP ${response.status}`;
            console.error('🌐 OpenRouter error:', errMsg);
            throw new Error(errMsg);
        }

        const text = data.choices?.[0]?.message?.content || '';

        if (options.parseJson) {
            return this.parseResponse(text);
        }

        return text;
    },

    // ============== MISTRAL ==============

    async askMistral(prompt, options = {}) {
        const key = options.key || this.getKey('mistral');
        if (!key) throw new Error('Mistral API klíč není nastaven');

        const model = options.model || this.config.models.mistral;
        const url = 'https://api.mistral.ai/v1/chat/completions';

        const messages = [];

        if (options.system) {
            messages.push({ role: 'system', content: options.system });
        }
        messages.push({ role: 'user', content: prompt });

        const response = await this.fetchWithTimeout(url, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${key}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: model,
                messages: messages,
                temperature: options.temperature ?? 0.7,
                max_tokens: options.maxTokens ?? 4096
            })
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({}));
            throw new Error(error.error?.message || `HTTP ${response.status}`);
        }

        const data = await response.json();
        const text = data.choices?.[0]?.message?.content || '';

        if (options.parseJson) {
            return this.parseResponse(text);
        }

        return text;
    },

    // ============== COHERE ==============

    async askCohere(prompt, options = {}) {
        const key = options.key || this.getKey('cohere');
        if (!key) throw new Error('Cohere API klíč není nastaven');

        const model = options.model || this.config.models.cohere || 'command-r-plus-08-2024';
        const url = 'https://api.cohere.com/v2/chat';

        const messages = [];

        if (options.system) {
            messages.push({ role: 'system', content: options.system });
        }
        messages.push({ role: 'user', content: prompt });

        const response = await this.fetchWithTimeout(url, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${key}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: model,
                messages: messages,
                temperature: options.temperature ?? 0.7,
                max_tokens: options.maxTokens ?? 4096
            })
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({}));
            throw new Error(error.message || `HTTP ${response.status}`);
        }

        const data = await response.json();
        const text = data.message?.content?.[0]?.text || '';

        if (options.parseJson) {
            return this.parseResponse(text);
        }

        return text;
    },

    // ============== HUGGING FACE ==============

    // CORS proxy pro HuggingFace (nutné pro file://)
    CORS_PROXIES: [
        'https://corsproxy.io/?url=',
        'https://api.codetabs.com/v1/proxy?quest='
    ],

    async askHuggingFace(prompt, options = {}) {
        const key = options.key || this.getKey('huggingface');
        if (!key) throw new Error('HuggingFace API klíč není nastaven');

        const model = options.model || this.config.models.huggingface || 'mistralai/Mistral-7B-Instruct-v0.3';
        const originalUrl = `https://api-inference.huggingface.co/models/${model}/v1/chat/completions`;

        const messages = [];

        if (options.system) {
            messages.push({ role: 'system', content: options.system });
        }
        messages.push({ role: 'user', content: prompt });

        const body = JSON.stringify({
            model: model,
            messages: messages,
            temperature: options.temperature ?? 0.7,
            max_tokens: options.maxTokens ?? 1024,
            stream: false
        });

        const headers = {
            'Authorization': `Bearer ${key}`,
            'Content-Type': 'application/json'
        };

        // Detekce jestli jsme na file:// nebo localhost
        const isLocalFile = window.location.protocol === 'file:';

        if (!isLocalFile) {
            // Přímý request pokud jsme na HTTP/HTTPS
            return this.doHuggingFaceRequest(originalUrl, headers, body, options);
        }

        // Pro file:// zkusit CORS proxy
        for (const proxyBase of this.CORS_PROXIES) {
            try {
                const proxyUrl = proxyBase + encodeURIComponent(originalUrl);
                return await this.doHuggingFaceRequest(proxyUrl, headers, body, options);
            } catch (e) {
                console.warn(`CORS proxy ${proxyBase} selhalo:`, e.message);
                continue;
            }
        }

        // Všechny proxy selhaly
        throw new Error('HuggingFace: CORS blokuje přístup z file://. Spusť: python -m http.server');
    },

    async doHuggingFaceRequest(url, headers, body, options) {
        try {
            const response = await this.fetchWithTimeout(url, {
                method: 'POST',
                headers: headers,
                body: body
            });

            if (!response.ok) {
                const error = await response.json().catch(() => ({}));
                if (error.error?.includes('loading')) {
                    throw new Error('Model se načítá, zkus za 30s...');
                }
                throw new Error(error.error || `HTTP ${response.status}`);
            }

            const data = await response.json();
            const text = data.choices?.[0]?.message?.content || '';
            return options.parseJson ? this.parseResponse(text) : text;
        } catch (e) {
            if (e.message === 'Failed to fetch') {
                throw new Error('CORS blokuje přístup. Spusť: python -m http.server');
            }
            throw e;
        }
    },

    // ============== UNIVERZÁLNÍ METODY ==============

    async ask(prompt, options = {}) {
        const provider = options.provider || this.config.defaultProvider;
        const model = options.model || this.config.models[provider];
        const startTime = Date.now();
        const maxKeyRotations = options._keyRotations || 0;
        const autoFallback = options.autoFallback !== false; // Default: true

        this._log(`Request: ${provider}/${model}`, prompt.substring(0, 50) + '...');
        this.emit('request:start', { provider, model, prompt: prompt.substring(0, 100) });

        // Rate limiting check s automatickou rotací klíčů
        if (!options.skipRateLimit && !this.rateLimit.canMakeRequest(provider, model)) {
            // Zkus rotovat klíč
            const keysCount = this.keys.list(provider).length;
            if (keysCount > 1 && maxKeyRotations < keysCount) {
                this._log(`Rate limit - rotace klíče (${maxKeyRotations + 1}/${keysCount})`);
                this.keys.rotate(provider);
                this.rateLimit._timestamps[provider] = [];
                return this.ask(prompt, { ...options, _keyRotations: maxKeyRotations + 1 });
            }

            // Klíče vyčerpány - zkus další model
            if (autoFallback) {
                this._log(`Všechny klíče vyčerpány pro ${provider}, zkouším další model...`);
                return this._fallbackToNextModel(prompt, options, provider, model);
            }

            throw new Error(`Rate limit překročen pro ${provider}. Zbývá: ${this.rateLimit.remaining(provider, model)} požadavků/min`);
        }

        // Zaznamenej rate limit
        this.rateLimit.record(provider);

        // Odhad vstupních tokenů
        const tokensIn = this.estimateTokens(prompt) + this.estimateTokens(options.system || '');

        let response;
        try {
            switch (provider) {
                case 'gemini':
                    response = await this.askGemini(prompt, options);
                    break;
                case 'groq':
                    response = await this.askGroq(prompt, options);
                    break;
                case 'openrouter':
                    response = await this.askOpenRouter(prompt, options);
                    break;
                case 'mistral':
                    response = await this.askMistral(prompt, options);
                    break;
                case 'cohere':
                    response = await this.askCohere(prompt, options);
                    break;
                case 'huggingface':
                    response = await this.askHuggingFace(prompt, options);
                    break;
                default:
                    throw new Error(`Neznámý poskytovatel: ${provider}`);
            }
        } catch (error) {
            // Při rate limit chybě zkus rotovat klíč nebo fallback
            const isRateLimitError = error.message.includes('429') ||
                                     error.message.includes('rate') ||
                                     error.message.includes('limit') ||
                                     error.message.includes('quota');

            if (isRateLimitError) {
                const keysCount = this.keys.list(provider).length;
                if (keysCount > 1 && maxKeyRotations < keysCount) {
                    this._log(`API rate limit - rotace klíče (${maxKeyRotations + 1}/${keysCount})`);
                    this.keys.rotate(provider);
                    return this.ask(prompt, { ...options, _keyRotations: maxKeyRotations + 1 });
                }

                // Všechny klíče vyčerpány - zkus další model
                if (autoFallback) {
                    this._log(`API rate limit, všechny klíče vyčerpány - zkouším další model...`);
                    return this._fallbackToNextModel(prompt, options, provider, model);
                }
            }

            // Jiná chyba - také zkus fallback
            if (autoFallback && !options._noMoreFallback) {
                this._log(`Chyba ${error.message} - zkouším další model...`);
                return this._fallbackToNextModel(prompt, options, provider, model);
            }

            this._log(`Error: ${error.message}`);
            this.emit('request:error', { provider, model, error: error.message, duration: Date.now() - startTime });
            throw error;
        }

        // Zaznamenej statistiky
        const tokensOut = this.estimateTokens(response);
        const elapsed = Date.now() - startTime;
        this.stats.record(provider, tokensIn, tokensOut);

        this._log(`Response: ${elapsed}ms, ~${tokensIn}→${tokensOut} tokens`);
        this.emit('request:complete', { provider, model, tokensIn, tokensOut, duration: elapsed });

        // Přidej do konverzace pokud je povoleno
        if (options.useConversation) {
            this.conversation.add('user', prompt);
            this.conversation.add('assistant', response);
        }

        return response;
    },

    // Interní metoda pro fallback na další model
    _fallbackToNextModel(prompt, options, failedProvider, failedModel) {
        const allModels = this.getAllModelsSorted();

        // Najdi index aktuálního modelu
        const currentIndex = allModels.findIndex(
            m => m.provider === failedProvider && m.model === failedModel
        );

        // Zkus další modely
        for (let i = currentIndex + 1; i < allModels.length; i++) {
            const { provider, model, name } = allModels[i];

            // Přeskoč modely ze stejného providera pokud nemají klíč
            if (!this.getKey(provider)) continue;

            this._log(`Fallback na: ${name}`);

            try {
                return this.ask(prompt, {
                    ...options,
                    provider,
                    model,
                    _keyRotations: 0, // Reset rotace pro nového providera
                    autoFallback: true
                });
            } catch (e) {
                // Pokračuj na další
                continue;
            }
        }

        throw new Error('Všechny modely vyčerpány');
    },

    async askWithFallback(prompt, options = {}) {
        const providers = options.providers || this.PROVIDER_PRIORITY.filter(p => this.getKey(p));

        if (providers.length === 0) {
            throw new Error('Žádný dostupný poskytovatel - nastav API klíče');
        }

        for (const provider of providers) {
            try {
                this._log(`Fallback: zkouším ${provider}...`);
                return await this.ask(prompt, { ...options, provider, autoFallback: false });
            } catch (error) {
                this._log(`${provider} selhal: ${error.message}`);
                continue;
            }
        }

        throw new Error('Všichni poskytovatelé selhali');
    },

    // Chytrý dotaz - automaticky prochází modely podle kvality
    async askSmart(prompt, options = {}) {
        const allModels = this.getAllModelsSorted();

        if (allModels.length === 0) {
            throw new Error('Žádný dostupný model - nastav API klíče');
        }

        const errors = [];
        const startIndex = options._modelIndex || 0;

        for (let i = startIndex; i < allModels.length; i++) {
            const { provider, model, name, quality } = allModels[i];

            try {
                this._log(`Smart [${i+1}/${allModels.length}]: ${name} (quality: ${quality})`);

                const response = await this.ask(prompt, {
                    ...options,
                    provider,
                    model,
                    autoFallback: false // Zabraň nekonečné rekurzi
                });

                return response;

            } catch (error) {
                errors.push({ provider, model, error: error.message });
                this._log(`${name} selhal: ${error.message}`);

                // Pokračuj na další model
                continue;
            }
        }

        // Všechny modely selhaly
        const errorSummary = errors.map(e => `${e.provider}/${e.model}: ${e.error}`).join('\n');
        throw new Error(`Všechny modely selhaly:\n${errorSummary}`);
    },

    // Alias pro askSmart - automatický fallback přes všechny modely
    async askAuto(prompt, options = {}) {
        return this.askSmart(prompt, options);
    },

    // ============== STREAMING (Gemini) ==============

    async *streamGemini(prompt, options = {}) {
        const key = options.key || this.getKey('gemini');
        if (!key) throw new Error('Gemini API klíč není nastaven');

        const model = options.model || this.config.models.gemini;
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?key=${key}&alt=sse`;

        const body = {
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
                temperature: options.temperature ?? 0.7,
                maxOutputTokens: options.maxTokens ?? 4096
            }
        };

        if (options.system) {
            body.systemInstruction = { parts: [{ text: options.system }] };
        }

        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({}));
            throw new Error(error.error?.message || `HTTP ${response.status}`);
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
                if (line.startsWith('data: ')) {
                    try {
                        const data = JSON.parse(line.slice(6));
                        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
                        if (text) yield text;
                    } catch (e) {}
                }
            }
        }
    },

    async *askStream(prompt, options = {}) {
        const provider = options.provider || this.config.defaultProvider;

        if (provider === 'gemini') {
            yield* this.streamGemini(prompt, options);
        } else {
            const response = await this.ask(prompt, options);
            yield response;
        }
    },

    // ============== UTILITY ==============

    getModels(provider) {
        return this.ALL_MODELS[provider] || [];
    },

    getAllModels() {
        return this.ALL_MODELS;
    },

    getModelLimit(model) {
        for (const provider of Object.keys(this.ALL_MODELS)) {
            const found = this.ALL_MODELS[provider].find(m => m.value === model);
            if (found) return found.rpm;
        }
        return 15;
    },

    supportsVision(model) {
        return this.VISION_MODELS.includes(model);
    },

    getProviderForModel(model) {
        for (const [provider, models] of Object.entries(this.ALL_MODELS)) {
            if (models.some(m => m.value === model)) {
                return provider;
            }
        }
        return null;
    },

    getProviderInfo(provider) {
        const info = {
            gemini: {
                name: 'Google Gemini',
                endpoint: 'generativelanguage.googleapis.com',
                keyUrl: 'https://aistudio.google.com/app/apikey'
            },
            groq: {
                name: 'Groq',
                endpoint: 'api.groq.com',
                keyUrl: 'https://console.groq.com/keys'
            },
            openrouter: {
                name: 'OpenRouter',
                endpoint: 'openrouter.ai',
                keyUrl: 'https://openrouter.ai/keys'
            },
            mistral: {
                name: 'Mistral AI',
                endpoint: 'api.mistral.ai',
                keyUrl: 'https://console.mistral.ai/api-keys/'
            },
            cohere: {
                name: 'Cohere',
                endpoint: 'api.cohere.com',
                keyUrl: 'https://dashboard.cohere.com/api-keys'
            },
            huggingface: {
                name: 'Hugging Face',
                endpoint: 'api-inference.huggingface.co',
                keyUrl: 'https://huggingface.co/settings/tokens'
            }
        };

        const providerInfo = info[provider];
        if (!providerInfo) return null;

        providerInfo.models = this.ALL_MODELS[provider] || [];

        return providerInfo;
    },

    // ============== MULTI-KEY MANAGEMENT ==============
    keys: {
        _storage: {},

        // Přidej klíč pro providera
        add(provider, key, name = null) {
            if (!this._storage[provider]) {
                this._storage[provider] = [];
            }
            this._storage[provider].push({
                key,
                name: name || `Klíč ${this._storage[provider].length + 1}`,
                active: this._storage[provider].length === 0,
                addedAt: Date.now()
            });
            this._save();
        },

        // Odeber klíč
        remove(provider, index) {
            if (this._storage[provider] && this._storage[provider][index]) {
                this._storage[provider].splice(index, 1);
                // Aktivuj první pokud byl odebrán aktivní
                if (this._storage[provider].length > 0 && !this._storage[provider].find(k => k.active)) {
                    this._storage[provider][0].active = true;
                }
                this._save();
            }
        },

        // Přepni na další klíč (rotace)
        rotate(provider) {
            const keys = this._storage[provider];
            if (!keys || keys.length < 2) return false;

            const activeIndex = keys.findIndex(k => k.active);
            keys[activeIndex].active = false;
            keys[(activeIndex + 1) % keys.length].active = true;
            this._save();
            return true;
        },

        // Získej aktivní klíč
        getActive(provider) {
            const keys = this._storage[provider];
            if (!keys || keys.length === 0) return null;
            const active = keys.find(k => k.active);
            return active ? active.key : keys[0].key;
        },

        // Seznam klíčů
        list(provider) {
            return (this._storage[provider] || []).map((k, i) => ({
                index: i,
                name: k.name,
                active: k.active,
                preview: k.key.substring(0, 10) + '...'
            }));
        },

        _save() {
            try {
                localStorage.setItem('ai_module_multikeys', JSON.stringify(this._storage));
            } catch (e) {}
        },

        load() {
            try {
                const stored = localStorage.getItem('ai_module_multikeys');
                if (stored) this._storage = JSON.parse(stored);
            } catch (e) {}
        }
    },

    // ============== RESPONSE CACHE ==============
    cache: {
        _data: {},
        _maxAge: 3600000, // 1 hodina
        _maxSize: 100,

        // Generuj klíč pro cache
        _makeKey(prompt, options) {
            const provider = options.provider || 'default';
            const model = options.model || 'default';
            return `${provider}:${model}:${prompt.substring(0, 100)}`;
        },

        // Získej z cache
        get(prompt, options = {}) {
            const key = this._makeKey(prompt, options);
            const entry = this._data[key];

            if (!entry) return null;
            if (Date.now() - entry.timestamp > this._maxAge) {
                delete this._data[key];
                return null;
            }

            return entry.response;
        },

        // Ulož do cache
        set(prompt, response, options = {}) {
            const key = this._makeKey(prompt, options);

            // Limit velikosti
            const keys = Object.keys(this._data);
            if (keys.length >= this._maxSize) {
                // Smaž nejstarší
                const oldest = keys.reduce((a, b) =>
                    this._data[a].timestamp < this._data[b].timestamp ? a : b
                );
                delete this._data[oldest];
            }

            this._data[key] = {
                response,
                timestamp: Date.now()
            };
        },

        // Vyčisti cache
        clear() {
            this._data = {};
        },

        // Statistiky cache
        stats() {
            const keys = Object.keys(this._data);
            return {
                size: keys.length,
                maxSize: this._maxSize,
                maxAge: this._maxAge
            };
        }
    },

    // ============== PROMPT TEMPLATES ==============
    templates: {
        _templates: {
            translate: {
                name: 'Překlad',
                system: 'Jsi profesionální překladatel. Překládej přesně a zachovávej styl.',
                prompt: 'Přelož do {language}: {text}'
            },
            summarize: {
                name: 'Shrnutí',
                system: 'Vytváříš stručná a přesná shrnutí.',
                prompt: 'Shrň následující text v {length} větách: {text}'
            },
            code: {
                name: 'Programování',
                system: 'Jsi expert na programování. Piš čistý, komentovaný kód.',
                prompt: 'Napiš {language} kód který: {task}'
            },
            explain: {
                name: 'Vysvětlení',
                system: 'Vysvětluješ složité koncepty jednoduše a srozumitelně.',
                prompt: 'Vysvětli {topic} jako bych byl {level}'
            },
            email: {
                name: 'Email',
                system: 'Píšeš profesionální emaily.',
                prompt: 'Napiš {tone} email ohledně: {subject}'
            },
            cnc: {
                name: 'CNC/G-kód',
                system: 'Jsi expert na CNC programování a G-kódy pro soustruhy.',
                prompt: 'Vytvoř G-kód pro: {operation}'
            }
        },

        // Získej šablonu
        get(name) {
            return this._templates[name] || null;
        },

        // Seznam šablon
        list() {
            return Object.entries(this._templates).map(([key, t]) => ({
                key,
                name: t.name
            }));
        },

        // Použij šablonu
        apply(name, variables = {}) {
            const template = this._templates[name];
            if (!template) return null;

            let prompt = template.prompt;
            let system = template.system;

            // Nahraď proměnné
            Object.entries(variables).forEach(([key, value]) => {
                const regex = new RegExp(`{${key}}`, 'g');
                prompt = prompt.replace(regex, value);
                system = system.replace(regex, value);
            });

            return { prompt, system };
        },

        // Přidej vlastní šablonu
        add(key, name, system, prompt) {
            this._templates[key] = { name, system, prompt };
            this._save();
        },

        _save() {
            try {
                localStorage.setItem('ai_module_templates', JSON.stringify(this._templates));
            } catch (e) {}
        },

        load() {
            try {
                const stored = localStorage.getItem('ai_module_templates');
                if (stored) {
                    const custom = JSON.parse(stored);
                    this._templates = { ...this._templates, ...custom };
                }
            } catch (e) {}
        }
    },

    // ============== EVENT SYSTEM ==============
    events: {
        _listeners: {},

        // Přidej listener
        on(event, callback) {
            if (!this._listeners[event]) {
                this._listeners[event] = [];
            }
            this._listeners[event].push(callback);
            return () => this.off(event, callback); // Vrací funkci pro odebrání
        },

        // Odeber listener
        off(event, callback) {
            if (!this._listeners[event]) return;
            this._listeners[event] = this._listeners[event].filter(cb => cb !== callback);
        },

        // Jednou
        once(event, callback) {
            const wrapper = (...args) => {
                this.off(event, wrapper);
                callback(...args);
            };
            this.on(event, wrapper);
        },

        // Emituj event
        emit(event, data) {
            if (!this._listeners[event]) return;
            this._listeners[event].forEach(callback => {
                try {
                    callback(data);
                } catch (e) {
                    console.error(`Event handler error (${event}):`, e);
                }
            });
        },

        // Seznam eventů
        list() {
            return Object.keys(this._listeners);
        },

        // Vyčisti všechny listenery
        clear(event = null) {
            if (event) {
                delete this._listeners[event];
            } else {
                this._listeners = {};
            }
        }
    },

    // Zkratky pro eventy
    on(event, callback) { return this.events.on(event, callback); },
    off(event, callback) { this.events.off(event, callback); },
    emit(event, data) { this.events.emit(event, data); },

    // ============== WORKFLOW / PIPELINE SYSTEM ==============
    workflow: {
        _workflows: {},

        // Vytvoř nový workflow
        create(name) {
            const workflow = {
                name,
                steps: [],

                // Přidej krok
                step(stepName, options = {}) {
                    this.steps.push({
                        name: stepName,
                        system: options.system || null,
                        prompt: options.prompt || null, // Template s {input} a {prevOutput}
                        provider: options.provider || null,
                        model: options.model || null,
                        transform: options.transform || null, // Funkce pro transformaci výstupu
                        condition: options.condition || null, // Podmínka pro spuštění kroku
                        temperature: options.temperature,
                        parseJson: options.parseJson || false
                    });
                    return this;
                },

                // Spusť workflow
                async run(input, options = {}) {
                    const results = [];
                    let currentInput = input;
                    let prevOutput = null;

                    AI.emit('workflow:start', { name: this.name, input });

                    for (let i = 0; i < this.steps.length; i++) {
                        const step = this.steps[i];

                        // Zkontroluj podmínku
                        if (step.condition && !step.condition(currentInput, prevOutput, results)) {
                            AI.emit('workflow:skip', { name: this.name, step: step.name, reason: 'condition' });
                            continue;
                        }

                        // Sestav prompt
                        let prompt = step.prompt
                            ? step.prompt.replace('{input}', currentInput).replace('{prevOutput}', prevOutput || '')
                            : currentInput;

                        try {
                            AI.emit('workflow:step:start', { name: this.name, step: step.name, input: prompt });

                            const response = await AI.ask(prompt, {
                                system: step.system,
                                provider: step.provider || options.provider,
                                model: step.model,
                                temperature: step.temperature,
                                parseJson: step.parseJson
                            });

                            // Transformuj výstup pokud je definována funkce
                            const output = step.transform ? step.transform(response) : response;

                            results.push({
                                step: step.name,
                                input: prompt,
                                output,
                                success: true
                            });

                            prevOutput = output;
                            currentInput = output;

                            AI.emit('workflow:step:complete', { name: this.name, step: step.name, output });

                        } catch (error) {
                            results.push({
                                step: step.name,
                                input: prompt,
                                error: error.message,
                                success: false
                            });

                            AI.emit('workflow:step:error', { name: this.name, step: step.name, error });

                            if (!options.continueOnError) {
                                AI.emit('workflow:error', { name: this.name, step: step.name, error, results });
                                throw error;
                            }
                        }
                    }

                    AI.emit('workflow:complete', { name: this.name, results, finalOutput: prevOutput });

                    return {
                        success: results.every(r => r.success),
                        steps: results,
                        output: prevOutput
                    };
                }
            };

            this._workflows[name] = workflow;
            return workflow;
        },

        // Získej existující workflow
        get(name) {
            return this._workflows[name] || null;
        },

        // Seznam workflows
        list() {
            return Object.keys(this._workflows);
        },

        // Smaž workflow
        remove(name) {
            delete this._workflows[name];
        }
    },

    // ============== SCHEDULER / CRON SYSTEM ==============
    scheduler: {
        _jobs: {},
        _intervals: {},
        _running: false,

        // Parsuj cron výraz (zjednodušená verze)
        _parseCron(expression) {
            // Podporuje: 'every Xm', 'every Xh', 'every Xs', nebo interval v ms
            if (typeof expression === 'number') return expression;

            const match = expression.match(/every\s+(\d+)\s*(s|m|h|d)/i);
            if (match) {
                const value = parseInt(match[1]);
                const unit = match[2].toLowerCase();
                const multipliers = { s: 1000, m: 60000, h: 3600000, d: 86400000 };
                return value * multipliers[unit];
            }

            // Jednoduchý cron (minuty hodiny * * *)
            const cronMatch = expression.match(/^(\d+|\*)\s+(\d+|\*)\s+/);
            if (cronMatch) {
                // Pro jednoduchost vrátíme interval 1 hodinu pro cron výrazy
                console.warn('⚠️ Plný cron není podporován, používám interval 1h');
                return 3600000;
            }

            return 60000; // Výchozí 1 minuta
        },

        // Přidej úlohu
        add(name, schedule, task, options = {}) {
            const intervalMs = this._parseCron(schedule);

            this._jobs[name] = {
                name,
                schedule,
                intervalMs,
                task,
                enabled: options.enabled !== false,
                runImmediately: options.runImmediately || false,
                lastRun: null,
                nextRun: Date.now() + (options.runImmediately ? 0 : intervalMs),
                runCount: 0,
                errors: [],
                maxErrors: options.maxErrors || 5
            };

            if (this._running) {
                this._startJob(name);
            }

            AI.emit('scheduler:add', { name, schedule, intervalMs });
            return this;
        },

        // Spusť scheduler
        start() {
            if (this._running) return;
            this._running = true;

            Object.keys(this._jobs).forEach(name => this._startJob(name));
            AI.emit('scheduler:start', { jobs: Object.keys(this._jobs) });
            console.log('⏰ Scheduler spuštěn');
        },

        // Zastav scheduler
        stop() {
            this._running = false;
            Object.keys(this._intervals).forEach(name => {
                clearInterval(this._intervals[name]);
                delete this._intervals[name];
            });
            AI.emit('scheduler:stop', {});
            console.log('⏰ Scheduler zastaven');
        },

        // Interní: spusť konkrétní job
        _startJob(name) {
            const job = this._jobs[name];
            if (!job || !job.enabled) return;

            // Vyčisti existující interval
            if (this._intervals[name]) {
                clearInterval(this._intervals[name]);
            }

            const runTask = async () => {
                if (!job.enabled) return;

                job.lastRun = Date.now();
                job.runCount++;

                AI.emit('scheduler:run', { name, runCount: job.runCount });

                try {
                    const result = await job.task();
                    AI.emit('scheduler:complete', { name, result });
                } catch (error) {
                    job.errors.push({ time: Date.now(), message: error.message });
                    AI.emit('scheduler:error', { name, error });

                    // Automaticky vypni po příliš mnoha chybách
                    if (job.errors.length >= job.maxErrors) {
                        job.enabled = false;
                        AI.emit('scheduler:disabled', { name, reason: 'too many errors' });
                        console.warn(`⚠️ Job '${name}' vypnut po ${job.maxErrors} chybách`);
                    }
                }

                job.nextRun = Date.now() + job.intervalMs;
            };

            // Spusť okamžitě pokud je nastaveno
            if (job.runImmediately && job.runCount === 0) {
                runTask();
            }

            this._intervals[name] = setInterval(runTask, job.intervalMs);
        },

        // Manuální spuštění
        async run(name) {
            const job = this._jobs[name];
            if (!job) throw new Error(`Job '${name}' neexistuje`);

            job.lastRun = Date.now();
            job.runCount++;
            return await job.task();
        },

        // Povol/zakázat job
        enable(name, enabled = true) {
            if (this._jobs[name]) {
                this._jobs[name].enabled = enabled;
                if (enabled && this._running) {
                    this._startJob(name);
                } else if (!enabled && this._intervals[name]) {
                    clearInterval(this._intervals[name]);
                    delete this._intervals[name];
                }
            }
        },

        // Odeber job
        remove(name) {
            if (this._intervals[name]) {
                clearInterval(this._intervals[name]);
                delete this._intervals[name];
            }
            delete this._jobs[name];
            AI.emit('scheduler:remove', { name });
        },

        // Seznam jobů
        list() {
            return Object.values(this._jobs).map(j => ({
                name: j.name,
                schedule: j.schedule,
                enabled: j.enabled,
                lastRun: j.lastRun ? new Date(j.lastRun).toLocaleString() : null,
                nextRun: j.nextRun ? new Date(j.nextRun).toLocaleString() : null,
                runCount: j.runCount,
                errorCount: j.errors.length
            }));
        },

        // Status
        status() {
            return {
                running: this._running,
                jobs: this.list()
            };
        }
    },

    // ============== INTENT DETECTION ==============
    async detectIntent(text, options = {}) {
        const systemPrompt = options.customIntents
            ? `Rozpoznej záměr uživatele. Možné záměry: ${options.customIntents.join(', ')}.
               Vrať JSON: { "intent": "název_záměru", "confidence": 0-1, "params": {} }`
            : `Rozpoznej záměr uživatele z textu. Možné záměry:
               - translate (překlad) - params: { language, text }
               - summarize (shrnutí) - params: { length }
               - code (programování) - params: { language, task }
               - explain (vysvětlení) - params: { topic, level }
               - search (vyhledávání) - params: { query }
               - create (vytvoření) - params: { type, description }
               - analyze (analýza) - params: { target }
               - compare (porovnání) - params: { items }
               - convert (konverze) - params: { from, to }
               - other (jiné) - params: { description }

               Vrať pouze JSON: { "intent": "název", "confidence": 0.0-1.0, "params": {}, "originalText": "..." }`;

        try {
            const response = await this.ask(text, {
                system: systemPrompt,
                provider: options.provider || 'groq', // Groq je rychlý
                temperature: 0.1, // Nízká pro konzistentní výsledky
                parseJson: true
            });

            const result = typeof response === 'string' ? this.parseJSON(response) : response;

            if (result && result.intent) {
                this.emit('intent:detected', result);
                return result;
            }

            return { intent: 'unknown', confidence: 0, params: {}, originalText: text };

        } catch (error) {
            console.warn('Intent detection failed:', error.message);
            return { intent: 'error', confidence: 0, params: {}, error: error.message };
        }
    },

    // Zpracuj příkaz podle intentu
    async processIntent(text, options = {}) {
        const intent = await this.detectIntent(text, options);

        if (intent.confidence < (options.minConfidence || 0.5)) {
            return {
                success: false,
                intent,
                message: 'Nízká jistota záměru. Můžeš upřesnit?'
            };
        }

        // Mapování intentů na akce
        const actions = {
            translate: async (params) => this.translate(params.text || text, params.language || 'en'),
            summarize: async (params) => this.summarize(params.text || text, params.length || 3),
            code: async (params) => this.generateCode(params.task || text, params.language || 'javascript'),
            explain: async (params) => this.ask(`Vysvětli ${params.topic || text}`, {
                system: `Vysvětluj pro úroveň: ${params.level || 'začátečník'}`
            }),
            ...options.customActions
        };

        const action = actions[intent.intent];

        if (action) {
            try {
                const result = await action(intent.params);
                return { success: true, intent, result };
            } catch (error) {
                return { success: false, intent, error: error.message };
            }
        }

        return { success: false, intent, message: 'Neznámý záměr' };
    },

    // ============== SMART ASK (Auto-retry, Load Balancing) ==============
    async smartAsk(prompt, options = {}) {
        const {
            preferredProviders = this.PROVIDER_PRIORITY,
            maxRetries = 3,
            balanceLoad = true,
            fallbackOnError = true,
            timeout = this.config.timeout
        } = options;

        // Seřaď providery podle dostupnosti
        const providers = preferredProviders.filter(p => this.getKey(p));

        if (balanceLoad) {
            // Seřaď podle zbývajících požadavků
            providers.sort((a, b) => {
                const remainingA = this.rateLimit.remaining(a);
                const remainingB = this.rateLimit.remaining(b);
                return remainingB - remainingA;
            });
        }

        let lastError = null;
        let attempts = [];

        for (const provider of providers) {
            for (let retry = 0; retry < maxRetries; retry++) {
                // Zkontroluj rate limit
                if (!this.rateLimit.canMakeRequest(provider)) {
                    this.emit('smartAsk:rateLimit', { provider });
                    break; // Přejdi na dalšího providera
                }

                try {
                    this.emit('smartAsk:attempt', { provider, retry, prompt: prompt.substring(0, 50) });

                    const startTime = Date.now();
                    const response = await this.ask(prompt, {
                        ...options,
                        provider,
                        timeout
                    });

                    const duration = Date.now() - startTime;

                    this.emit('smartAsk:success', { provider, retry, duration });

                    return {
                        response,
                        provider,
                        attempts: attempts.length + 1,
                        duration
                    };

                } catch (error) {
                    lastError = error;
                    attempts.push({ provider, retry, error: error.message });

                    this.emit('smartAsk:error', { provider, retry, error: error.message });

                    // Rate limit - přejdi na dalšího providera
                    if (error.message.includes('429') || error.message.includes('quota')) {
                        break;
                    }

                    // Jiné chyby - zkus znovu s malým zpožděním
                    if (retry < maxRetries - 1) {
                        await new Promise(r => setTimeout(r, 1000 * (retry + 1)));
                    }
                }
            }

            if (!fallbackOnError) break;
        }

        this.emit('smartAsk:failed', { attempts, lastError: lastError?.message });
        throw new Error(`Všichni provideři selhali. Poslední chyba: ${lastError?.message}`);
    },

    // ============== ASK JSON (s validací a auto-fix) ==============
    async askJSON(prompt, options = {}) {
        const {
            schema = null,
            maxRetries = 3,
            autoFix = true,
            strict = false
        } = options;

        const schemaHint = schema
            ? `\n\nVrať JSON přesně v tomto formátu: ${JSON.stringify(schema)}`
            : '\n\nVrať pouze validní JSON, žádný jiný text.';

        let lastResponse = null;
        let lastError = null;

        for (let attempt = 0; attempt < maxRetries; attempt++) {
            try {
                let currentPrompt = prompt + schemaHint;

                // Pokud je to retry a máme chybu, přidej opravu
                if (attempt > 0 && lastError && autoFix) {
                    currentPrompt = `${prompt}${schemaHint}\n\nPŘEDCHOZÍ POKUS SELHAL. Chyba: ${lastError}\nOprav JSON a vrať správný formát.`;
                    if (lastResponse) {
                        currentPrompt += `\n\nPředchozí odpověď (špatná): ${lastResponse.substring(0, 500)}`;
                    }
                }

                const response = await this.ask(currentPrompt, {
                    ...options,
                    system: (options.system || '') + '\nVždy odpovídej pouze validním JSON bez markdown bloků.',
                    temperature: options.temperature ?? 0.3 // Nižší pro konzistenci
                });

                lastResponse = response;

                // Parsuj JSON
                const parsed = this.parseJSON(response);

                if (!parsed) {
                    lastError = 'Nepodařilo se parsovat JSON';
                    continue;
                }

                // Validuj proti schématu pokud existuje
                if (schema && strict) {
                    const validation = this._validateSchema(parsed, schema);
                    if (!validation.valid) {
                        lastError = `Schema validace selhala: ${validation.errors.join(', ')}`;
                        continue;
                    }
                }

                this.emit('askJSON:success', { attempt, parsed });
                return parsed;

            } catch (error) {
                lastError = error.message;
                this.emit('askJSON:retry', { attempt, error: error.message });
            }
        }

        this.emit('askJSON:failed', { attempts: maxRetries, lastError });
        throw new Error(`Nepodařilo se získat validní JSON po ${maxRetries} pokusech: ${lastError}`);
    },

    // Jednoduchá validace schématu
    _validateSchema(data, schema) {
        const errors = [];

        const validate = (obj, schemaObj, path = '') => {
            if (typeof schemaObj === 'string') {
                // schemaObj je typ: 'string', 'number', 'boolean', 'array', 'object'
                const actualType = Array.isArray(obj) ? 'array' : typeof obj;
                if (actualType !== schemaObj && schemaObj !== 'any') {
                    errors.push(`${path}: očekáván ${schemaObj}, dostán ${actualType}`);
                }
            } else if (Array.isArray(schemaObj)) {
                if (!Array.isArray(obj)) {
                    errors.push(`${path}: očekáváno pole`);
                }
            } else if (typeof schemaObj === 'object' && schemaObj !== null) {
                if (typeof obj !== 'object' || obj === null) {
                    errors.push(`${path}: očekáván objekt`);
                } else {
                    for (const key of Object.keys(schemaObj)) {
                        if (!(key in obj)) {
                            errors.push(`${path}.${key}: chybí`);
                        } else {
                            validate(obj[key], schemaObj[key], `${path}.${key}`);
                        }
                    }
                }
            }
        };

        validate(data, schema);
        return { valid: errors.length === 0, errors };
    },

    // ============== PARALLEL EXECUTION ==============
    async parallel(tasks, options = {}) {
        const {
            maxConcurrent = 3,
            stopOnError = false,
            timeout = this.config.timeout,
            balanceProviders = true
        } = options;

        const results = [];
        const queue = [...tasks];
        let activeCount = 0;
        let hasError = false;

        // Přiřaď providery pokud chceme balancovat
        if (balanceProviders) {
            const providers = this.getAvailableProviders();
            queue.forEach((task, i) => {
                if (!task.provider) {
                    task.provider = providers[i % providers.length];
                }
            });
        }

        this.emit('parallel:start', { totalTasks: tasks.length, maxConcurrent });

        return new Promise((resolve, reject) => {
            const processNext = async () => {
                if (hasError && stopOnError) return;
                if (queue.length === 0 && activeCount === 0) {
                    this.emit('parallel:complete', { results });
                    resolve(results);
                    return;
                }

                while (activeCount < maxConcurrent && queue.length > 0) {
                    const task = queue.shift();
                    const index = tasks.indexOf(task);
                    activeCount++;

                    (async () => {
                        const startTime = Date.now();
                        try {
                            this.emit('parallel:task:start', { index, prompt: (task.prompt || task).substring(0, 50) });

                            const response = await this.ask(
                                typeof task === 'string' ? task : task.prompt,
                                typeof task === 'string' ? options : { ...options, ...task }
                            );

                            results[index] = {
                                success: true,
                                response,
                                duration: Date.now() - startTime,
                                provider: task.provider || options.provider
                            };

                            this.emit('parallel:task:complete', { index, duration: results[index].duration });

                        } catch (error) {
                            results[index] = {
                                success: false,
                                error: error.message,
                                duration: Date.now() - startTime
                            };

                            this.emit('parallel:task:error', { index, error: error.message });

                            if (stopOnError) {
                                hasError = true;
                                reject(error);
                                return;
                            }
                        }

                        activeCount--;
                        processNext();
                    })();
                }
            };

            processNext();
        });
    },

    // ============== MEMORY / LEARNING ==============
    memory: {
        _data: {
            patterns: [],      // Úspěšné vzory
            preferences: {},   // Uživatelské preference
            corrections: []    // Opravy
        },
        _maxPatterns: 100,

        // Zaznamenej úspěšný vzor
        recordSuccess(input, output, metadata = {}) {
            this._data.patterns.push({
                input: input.substring(0, 100),
                outputPreview: output.substring(0, 50),
                metadata,
                timestamp: Date.now()
            });

            // Limit velikosti
            if (this._data.patterns.length > this._maxPatterns) {
                this._data.patterns = this._data.patterns.slice(-this._maxPatterns);
            }
            this._save();
        },

        // Zaznamenej opravu
        recordCorrection(original, corrected) {
            this._data.corrections.push({
                original: original.substring(0, 100),
                corrected: corrected.substring(0, 100),
                timestamp: Date.now()
            });
            this._save();
        },

        // Nastav preferenci
        setPreference(key, value) {
            this._data.preferences[key] = value;
            this._save();
        },

        // Získej preferenci
        getPreference(key) {
            return this._data.preferences[key];
        },

        // Získej kontext pro AI
        getContext() {
            const context = [];

            if (this._data.patterns.length > 0) {
                const recent = this._data.patterns.slice(-3);
                context.push(`Předchozí úspěšné příkazy: ${recent.map(p => p.input).join(', ')}`);
            }

            if (Object.keys(this._data.preferences).length > 0) {
                context.push(`Preference: ${JSON.stringify(this._data.preferences)}`);
            }

            return context.join('\n');
        },

        // Vyčisti paměť
        clear() {
            this._data = { patterns: [], preferences: {}, corrections: [] };
            this._save();
        },

        // Statistiky
        stats() {
            return {
                patterns: this._data.patterns.length,
                preferences: Object.keys(this._data.preferences).length,
                corrections: this._data.corrections.length
            };
        },

        _save() {
            try {
                localStorage.setItem('ai_module_memory', JSON.stringify(this._data));
            } catch (e) {}
        },

        load() {
            try {
                const stored = localStorage.getItem('ai_module_memory');
                if (stored) this._data = JSON.parse(stored);
            } catch (e) {}
        }
    },

    // ============== JSON HELPER ==============
    parseJSON(text) {
        try {
            // Vyčisti markdown bloky
            let clean = text
                .replace(/```json\s*/gi, '')
                .replace(/```\s*/g, '')
                .trim();

            // Najdi JSON objekt nebo pole
            const firstBrace = clean.indexOf('{');
            const firstBracket = clean.indexOf('[');
            const lastBrace = clean.lastIndexOf('}');
            const lastBracket = clean.lastIndexOf(']');

            let start, end;
            if (firstBrace !== -1 && (firstBracket === -1 || firstBrace < firstBracket)) {
                start = firstBrace;
                end = lastBrace;
            } else if (firstBracket !== -1) {
                start = firstBracket;
                end = lastBracket;
            } else {
                return null;
            }

            if (start !== -1 && end !== -1 && end > start) {
                clean = clean.substring(start, end + 1);
            }

            // Oprav neuzavřené závorky
            const openBraces = (clean.match(/\{/g) || []).length;
            const closeBraces = (clean.match(/\}/g) || []).length;
            const openBrackets = (clean.match(/\[/g) || []).length;
            const closeBrackets = (clean.match(/\]/g) || []).length;

            clean += ']'.repeat(Math.max(0, openBrackets - closeBrackets));
            clean += '}'.repeat(Math.max(0, openBraces - closeBraces));

            // Odstraň trailing čárky
            clean = clean.replace(/,\s*([}\]])/g, '$1');

            return JSON.parse(clean);
        } catch (e) {
            console.warn('JSON parse failed:', e.message);
            return null;
        }
    },

    // ============== BATCH REQUESTS ==============
    async batch(prompts, options = {}) {
        const results = [];
        const concurrency = options.concurrency || 3;
        const delay = options.delay || 500;

        // Rozděl na skupiny
        for (let i = 0; i < prompts.length; i += concurrency) {
            const batch = prompts.slice(i, i + concurrency);

            // Paralelně zpracuj skupinu
            const batchResults = await Promise.allSettled(
                batch.map(p => this.ask(
                    typeof p === 'string' ? p : p.prompt,
                    typeof p === 'string' ? options : { ...options, ...p }
                ))
            );

            results.push(...batchResults.map((r, idx) => ({
                prompt: batch[idx],
                success: r.status === 'fulfilled',
                response: r.status === 'fulfilled' ? r.value : null,
                error: r.status === 'rejected' ? r.reason.message : null
            })));

            // Čekej mezi skupinami
            if (i + concurrency < prompts.length) {
                await new Promise(r => setTimeout(r, delay));
            }
        }

        return results;
    },

    // ============== QUICK METHODS ==============

    // Dotaz s cache
    async askCached(prompt, options = {}) {
        // Zkus cache
        const cached = this.cache.get(prompt, options);
        if (cached) {
            console.log('📦 Cache hit');
            return cached;
        }

        // Zavolej API
        const response = await this.ask(prompt, { ...options, skipRateLimit: false });

        // Ulož do cache
        this.cache.set(prompt, response, options);

        return response;
    },

    // Dotaz s šablonou
    async askWithTemplate(templateName, variables = {}, options = {}) {
        const template = this.templates.apply(templateName, variables);
        if (!template) {
            throw new Error(`Šablona '${templateName}' neexistuje`);
        }

        return this.ask(template.prompt, {
            ...options,
            system: template.system
        });
    },

    // Dotaz s pamětí (přidá kontext z memory)
    async askWithMemory(prompt, options = {}) {
        const context = this.memory.getContext();
        const enhancedPrompt = context
            ? `${context}\n\nAktuální požadavek: ${prompt}`
            : prompt;

        const response = await this.ask(enhancedPrompt, options);

        // Zaznamenej úspěch
        this.memory.recordSuccess(prompt, response);

        return response;
    },

    // Rychlý překlad
    async translate(text, targetLang = 'en', options = {}) {
        return this.ask(`Přelož do ${targetLang}: ${text}`, {
            ...options,
            system: 'Jsi překladatel. Vrať pouze překlad, nic jiného.'
        });
    },

    // Rychlé shrnutí
    async summarize(text, sentences = 3, options = {}) {
        return this.ask(`Shrň v ${sentences} větách: ${text}`, {
            ...options,
            system: 'Vrať pouze shrnutí, nic jiného.'
        });
    },

    // Rychlá extrakce JSON
    async extractJSON(text, schema = null, options = {}) {
        const schemaHint = schema ? `\nVrať JSON ve formátu: ${JSON.stringify(schema)}` : '';
        const response = await this.ask(`Extrahuj strukturovaná data z textu:${schemaHint}\n\nText: ${text}`, {
            ...options,
            system: 'Vrať pouze validní JSON, žádný další text.'
        });
        return this.parseJSON(response);
    },

    // Generování kódu
    async generateCode(task, language = 'javascript', options = {}) {
        return this.ask(`Napiš ${language} kód: ${task}`, {
            ...options,
            system: `Jsi expert na ${language}. Vrať pouze kód s komentáři, bez vysvětlení.`
        });
    },

    // ============== INICIALIZACE ==============
    init() {
        this.stats.load();
        this.rateLimit.load();
        this.conversation.load();
        this.keys.load();
        this.templates.load();
        this.memory.load();

        // Emituj init event
        this.emit('init', { version: '3.0', providers: this.getAvailableProviders() });

        console.log('🤖 AI Module v3.0 inicializován (s automatizací)');
        console.log('   📡 Events: AI.on("request:complete", callback)');
        console.log('   🔗 Workflow: AI.workflow.create("name")');
        console.log('   ⏰ Scheduler: AI.scheduler.add("job", "every 5m", task)');
        console.log('   🎯 Intent: AI.detectIntent("text")');
        console.log('   ⚡ Smart: AI.smartAsk("prompt")');
        console.log('   📦 Parallel: AI.parallel([prompts])');

        return this;
    },

    // Verze modulu
    version: '3.0.0'
};

// Automatická inicializace
AI.init();

// Expose globally
window.AI = AI;
