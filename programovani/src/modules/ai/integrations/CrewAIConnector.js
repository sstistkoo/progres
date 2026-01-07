/**
 * CrewAI Python Connector
 * Bridges JavaScript AI Agents with Python CrewAI system
 */

class CrewAIConnector {
  constructor() {
    this.baseUrl = 'http://localhost:5005';
    this.isAvailable = false;
    this.checkConnection();
  }

  /**
   * Check if CrewAI API server is running
   */
  async checkConnection() {
    try {
      const response = await fetch(`${this.baseUrl}/health`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        this.isAvailable = true;
        console.log('✅ CrewAI API connected');
        return true;
      }
    } catch (error) {
      this.isAvailable = false;
      console.log('⚠️ CrewAI API není dostupné (localhost:5005)');
      console.log('💡 Aplikace funguje i bez CrewAI - používají se JavaScript agenti');
      console.log('🔧 Pro spuštění CrewAI: python python/crewai_api.py');
      return false;
    }
  }

  /**
   * Get available CrewAI agents
   */
  async getAgents() {
    if (!this.isAvailable) {
      await this.checkConnection();
    }

    try {
      const response = await fetch(`${this.baseUrl}/agents`);
      const data = await response.json();
      return data.agents;
    } catch (error) {
      console.error('Error fetching CrewAI agents:', error);
      return [];
    }
  }

  /**
   * Run full CrewAI team on a task
   */
  async runCrew(prompt, selectedAgents = ['architect', 'coder', 'tester', 'documenter']) {
    if (!this.isAvailable) {
      throw new Error('CrewAI API not available. Start server with: python crewai_api.py');
    }

    try {
      const response = await fetch(`${this.baseUrl}/crewai`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          prompt: prompt,
          agents: selectedAgents
        })
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'CrewAI execution failed');
      }

      return {
        success: true,
        result: data.result,
        agentsUsed: data.agents_used
      };
    } catch (error) {
      console.error('Error running CrewAI:', error);
      throw error;
    }
  }

  /**
   * Run single agent task
   */
  async runSingleAgent(agentId, task) {
    if (!this.isAvailable) {
      throw new Error('CrewAI API not available');
    }

    try {
      const response = await fetch(`${this.baseUrl}/agent/task`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          agent_id: agentId,
          task: task
        })
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Agent execution failed');
      }

      return {
        success: true,
        result: data.result,
        agent: data.agent
      };
    } catch (error) {
      console.error('Error running single agent:', error);
      throw error;
    }
  }

  /**
   * Map JavaScript agent IDs to CrewAI agent IDs
   */
  mapToCrewAIAgents(jsAgentIds) {
    const mapping = {
      'architect': 'architect',
      'frontend': 'coder',
      'tester': 'tester',
      'documentation': 'documenter'
    };

    return jsAgentIds
      .map(id => mapping[id])
      .filter(id => id !== undefined);
  }
}

// Create global instance
window.CrewAI = new CrewAIConnector();

// Auto-check connection on load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.CrewAI.checkConnection();
  });
} else {
  window.CrewAI.checkConnection();
}

console.log('✅ CrewAI Connector loaded');
