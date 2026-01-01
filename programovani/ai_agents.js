/**
 * AI Agents System for Code Generation
 * Multi-agent system for collaborative programming
 */

class AIAgentsSystem {
  constructor() {
    this.agents = new Map();
    this.conversations = new Map();
    this.activeAgents = [];
    this.initialized = false;
  }

  /**
   * Initialize the AI agents system
   */
  async init() {
    if (this.initialized) return;

    // Register default agents
    this.registerAgent('architect', {
      name: 'Architekt',
      role: 'Návrh architektury a struktury aplikace',
      icon: '🏗️',
      systemPrompt: `Jsi zkušený softwarový architekt. Tvým úkolem je:
- Navrhovat strukturu aplikací a komponent
- Vytvářet diagramy a modely
- Definovat API a rozhraní
- Optimalizovat výkon a škálovatelnost
- Doporučovat best practices a design patterns`,
      capabilities: ['architecture', 'design', 'planning', 'optimization']
    });

    this.registerAgent('frontend', {
      name: 'Frontend Developer',
      role: 'HTML, CSS, JavaScript a React vývoj',
      icon: '🎨',
      systemPrompt: `Jsi frontend developer expert. Specializuješ se na:
- HTML5 a sémantické značky
- CSS3, Flexbox, Grid, animace
- JavaScript ES6+, DOM manipulace
- React, Vue, Angular frameworks
- Responsive design a mobile-first
- Accessibility (a11y) a UX best practices`,
      capabilities: ['html', 'css', 'javascript', 'react', 'vue', 'responsive']
    });

    this.registerAgent('backend', {
      name: 'Backend Developer',
      role: 'Server-side logika a databáze',
      icon: '⚙️',
      systemPrompt: `Jsi backend developer expert. Tvé schopnosti:
- Node.js, Express, REST APIs
- Python, Django, Flask
- Databáze: SQL, MongoDB, Redis
- Authentication a authorization
- API design a dokumentace
- Performance optimization a caching`,
      capabilities: ['nodejs', 'python', 'databases', 'apis', 'security']
    });

    this.registerAgent('fullstack', {
      name: 'Full-Stack Developer',
      role: 'Kompletní end-to-end vývoj',
      icon: '🚀',
      systemPrompt: `Jsi full-stack developer s širokou expertízou:
- Frontend: React, Vue, HTML/CSS
- Backend: Node.js, Python
- Databáze: PostgreSQL, MongoDB
- DevOps: Docker, CI/CD
- Cloud: AWS, Azure, GCP
- Kompletní aplikace od A do Z`,
      capabilities: ['frontend', 'backend', 'databases', 'devops', 'cloud']
    });

    this.registerAgent('debugger', {
      name: 'Debugger',
      role: 'Hledání a oprava chyb',
      icon: '🐛',
      systemPrompt: `Jsi expert na debugging a troubleshooting:
- Analýza chybových hlášení
- Console.log a debugging tools
- Performance profiling
- Memory leaks detection
- Error handling best practices
- Testing a QA`,
      capabilities: ['debugging', 'testing', 'performance', 'troubleshooting']
    });

    this.registerAgent('reviewer', {
      name: 'Code Reviewer',
      role: 'Review kódu a quality assurance',
      icon: '👁️',
      systemPrompt: `Jsi code reviewer zaměřený na kvalitu:
- Code review a best practices
- Security vulnerabilities
- Performance issues
- Code smells a refactoring
- Documentation a comments
- Clean code principles`,
      capabilities: ['review', 'security', 'quality', 'refactoring']
    });

    this.registerAgent('documentation', {
      name: 'Documentation Writer',
      role: 'Tvorba dokumentace',
      icon: '📚',
      systemPrompt: `Jsi technical writer specialista:
- API dokumentace
- README a usage guides
- Code comments a JSDoc
- Architecture documentation
- Tutorial a examples
- Wiki a knowledge base`,
      capabilities: ['documentation', 'tutorials', 'examples', 'guides']
    });

    this.registerAgent('tester', {
      name: 'Test Engineer',
      role: 'Tvorba testů a QA',
      icon: '✅',
      systemPrompt: `Jsi testing engineer expert:
- Unit tests (Jest, Mocha)
- Integration tests
- E2E tests (Cypress, Playwright)
- Test coverage a quality
- TDD a BDD metodologie
- Performance testing`,
      capabilities: ['testing', 'unit-tests', 'e2e', 'tdd', 'qa']
    });

    this.initialized = true;
    console.log('✅ AI Agents System initialized with', this.agents.size, 'agents');
  }

  /**
   * Register a new agent
   */
  registerAgent(id, config) {
    this.agents.set(id, {
      id,
      ...config,
      active: false,
      conversationHistory: []
    });
  }

  /**
   * Get all registered agents
   */
  getAgents() {
    return Array.from(this.agents.values());
  }

  /**
   * Get agent by ID
   */
  getAgent(id) {
    return this.agents.get(id);
  }

  /**
   * Activate an agent for the current session
   */
  activateAgent(agentId) {
    const agent = this.agents.get(agentId);
    if (!agent) {
      console.error('Agent not found:', agentId);
      return false;
    }

    agent.active = true;
    if (!this.activeAgents.includes(agentId)) {
      this.activeAgents.push(agentId);
    }

    console.log(`✅ Agent "${agent.name}" activated`);
    return true;
  }

  /**
   * Deactivate an agent
   */
  deactivateAgent(agentId) {
    const agent = this.agents.get(agentId);
    if (!agent) return false;

    agent.active = false;
    this.activeAgents = this.activeAgents.filter(id => id !== agentId);

    console.log(`🔴 Agent "${agent.name}" deactivated`);
    return true;
  }

  /**
   * Get all active agents
   */
  getActiveAgents() {
    return this.activeAgents.map(id => this.agents.get(id));
  }

  /**
   * Send message to a specific agent
   */
  async sendToAgent(agentId, message, context = {}) {
    const agent = this.agents.get(agentId);
    if (!agent) {
      throw new Error(`Agent ${agentId} not found`);
    }

    // Add to conversation history
    agent.conversationHistory.push({
      role: 'user',
      content: message,
      timestamp: new Date().toISOString()
    });

    // Build the full prompt with system context
    const fullPrompt = this.buildPrompt(agent, message, context);

    try {
      // Use the global AI object from ai_module.js
      if (!window.AI) {
        throw new Error('AI module not loaded');
      }

      const response = await window.AI.chat(fullPrompt, {
        temperature: 0.7,
        maxTokens: 2000
      });

      // Add to conversation history
      agent.conversationHistory.push({
        role: 'assistant',
        content: response,
        timestamp: new Date().toISOString()
      });

      return {
        agent: agent.name,
        response,
        agentId
      };
    } catch (error) {
      console.error(`Error communicating with agent ${agentId}:`, error);
      throw error;
    }
  }

  /**
   * Send message to multiple agents (collaborative)
   */
  async sendToMultipleAgents(agentIds, message, context = {}) {
    const promises = agentIds.map(id => this.sendToAgent(id, message, context));
    return Promise.all(promises);
  }

  /**
   * Collaborative session - agents work together
   */
  async collaborativeSession(agentIds, task, context = {}) {
    const results = [];
    
    // Phase 1: Each agent analyzes the task
    console.log('📋 Phase 1: Task Analysis');
    const analyses = await this.sendToMultipleAgents(
      agentIds,
      `Analyzuj tento úkol z pohledu své role: ${task}`,
      context
    );
    results.push({ phase: 'analysis', responses: analyses });

    // Phase 2: Agents review each other's work
    console.log('🔄 Phase 2: Peer Review');
    const analysisTexts = analyses.map(a => `${a.agent}: ${a.response}`).join('\n\n');
    const reviews = await this.sendToMultipleAgents(
      agentIds,
      `Přečti si analýzy od ostatních agentů a dej feedback:\n\n${analysisTexts}`,
      context
    );
    results.push({ phase: 'review', responses: reviews });

    // Phase 3: Final synthesis
    console.log('✨ Phase 3: Synthesis');
    const allInputs = [...analyses, ...reviews];
    const synthesis = await this.sendToAgent(
      agentIds[0], // Lead agent
      `Na základě všech analýz a feedbacku vytvoř finální řešení pro úkol: ${task}\n\nVstup od agentů:\n${allInputs.map(a => `${a.agent}: ${a.response}`).join('\n\n')}`,
      context
    );
    results.push({ phase: 'synthesis', response: synthesis });

    return results;
  }

  /**
   * Build full prompt with context
   */
  buildPrompt(agent, message, context = {}) {
    let prompt = agent.systemPrompt + '\n\n';

    // Add context if available
    if (context.code) {
      prompt += `Aktuální kód:\n\`\`\`\n${context.code}\n\`\`\`\n\n`;
    }

    if (context.files) {
      prompt += `Otevřené soubory:\n${context.files.join(', ')}\n\n`;
    }

    if (context.errors) {
      prompt += `Chyby:\n${context.errors.join('\n')}\n\n`;
    }

    // Add conversation history (last 5 messages)
    const recentHistory = agent.conversationHistory.slice(-5);
    if (recentHistory.length > 0) {
      prompt += 'Historie konverzace:\n';
      recentHistory.forEach(msg => {
        prompt += `${msg.role === 'user' ? 'Uživatel' : agent.name}: ${msg.content}\n`;
      });
      prompt += '\n';
    }

    // Add current message
    prompt += `Uživatel: ${message}\n\n${agent.name}:`;

    return prompt;
  }

  /**
   * Clear agent conversation history
   */
  clearHistory(agentId) {
    const agent = this.agents.get(agentId);
    if (agent) {
      agent.conversationHistory = [];
    }
  }

  /**
   * Clear all agents' history
   */
  clearAllHistory() {
    this.agents.forEach(agent => {
      agent.conversationHistory = [];
    });
  }

  /**
   * Export agent configuration
   */
  exportConfig() {
    return {
      agents: Array.from(this.agents.entries()).map(([id, agent]) => ({
        id,
        name: agent.name,
        role: agent.role,
        capabilities: agent.capabilities
      })),
      activeAgents: this.activeAgents
    };
  }
}

// Create global instance
window.AIAgents = new AIAgentsSystem();

// Auto-initialize when AI module is ready
if (window.AI) {
  window.AIAgents.init();
} else {
  // Wait for AI module to load
  const checkAI = setInterval(() => {
    if (window.AI) {
      window.AIAgents.init();
      clearInterval(checkAI);
    }
  }, 100);
}

console.log('✅ AI Agents System loaded');
