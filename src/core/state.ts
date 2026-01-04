import type { AuraState, ObservedPatterns } from '../types/index.js';
import { FileManager } from '../utils/files.js';

export class StateManager {
  private files = new FileManager();
  private statePath = '.aura/state.json';
  private memoryPath = '.aura/memory.md';
  
  async loadState(): Promise<AuraState | null> {
    return await this.files.readJSON<AuraState>(this.statePath);
  }
  
  async saveState(state: AuraState): Promise<void> {
    await this.files.ensureAuraDirectory();
    
    // Create backup before saving
    if (await this.files.exists(this.statePath)) {
      await this.files.createBackup(this.statePath);
    }
    
    await this.files.writeJSON(this.statePath, state);
  }
  
  async initializeState(patterns: ObservedPatterns, goal?: string): Promise<AuraState> {
    const state: AuraState = {
      version: '1.0.0',
      project: {
        name: await this.inferProjectName(),
        goal: goal || patterns.tech_detected.join(' + ') + ' project',
        initialized: new Date().toISOString(),
        tech_stack: patterns.tech_detected
      },
      session: {
        message_count: 0,
        last_active_model: 'unknown',
        last_save: new Date().toISOString(),
        observed_patterns: patterns.patterns
      },
      intelligence: {
        health_score: 10.0,
        last_health_check: new Date().toISOString(),
        test_coverage: 0,
        total_functions: 0
      },
      next_steps: ['Continue building features', 'Add tests', 'Document architecture']
    };
    
    await this.saveState(state);
    await this.createMemoryFile(state);
    
    return state;
  }
  
  private async inferProjectName(): Promise<string> {
    // Try to get from package.json
    try {
      const pkg = await this.files.readJSON<{ name?: string }>('package.json');
      if (pkg?.name) {
        return pkg.name;
      }
    } catch {}
    
    // Fall back to directory name
    return process.cwd().split('/').pop() || 'Unknown Project';
  }
  
  private async createMemoryFile(state: AuraState): Promise<void> {
    const memory = `# ${state.project.name}

## Project Goal
${state.project.goal}

## Tech Stack
${state.project.tech_stack.map(t => `- ${t}`).join('\n')}

## Observed Patterns
${state.session.observed_patterns.map(p => `- ${p}`).join('\n')}

## Next Steps
${state.next_steps.map((s, i) => `${i + 1}. ${s}`).join('\n')}

---
*Last updated: ${state.session.last_save}*
`;
    
    await this.files.writeMarkdown(this.memoryPath, memory);
  }
  
  async updateMessageCount(increment: number = 1): Promise<void> {
    const state = await this.loadState();
    if (state) {
      state.session.message_count += increment;
      await this.saveState(state);
    }
  }
  
  async updateLastModel(model: string): Promise<void> {
    const state = await this.loadState();
    if (state) {
      state.session.last_active_model = model;
      await this.saveState(state);
    }
  }
}