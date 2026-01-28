import { StateManager } from '../core/state.js';
import { IntelligenceEngine } from '../core/intelligence.js';

export async function intelligenceTool() {
  const stateManager = new StateManager();
  const state = await stateManager.loadState();
  
  if (!state) {
    return {
      content: [{
        type: "text",
        text: JSON.stringify({
          success: false,
          error: "AURA not initialized"
        })
      }]
    };
  }
  
  const engine = new IntelligenceEngine();
  const intelligence = await engine.analyze(state, state.session.message_count);
  
  return {
    content: [{
      type: "text",
      text: JSON.stringify({
        success: true,
        linked_task_list: state.project.linked_task_list || null,
        ...intelligence
      })
    }]
  };
}