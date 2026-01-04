import { StateManager } from '../core/state.js';
import { FileManager } from '../utils/files.js';

export async function loadTool() {
  const stateManager = new StateManager();
  const fileManager = new FileManager();
  
  const state = await stateManager.loadState();
  if (!state) {
    return {
      content: [{
        type: "text",
        text: JSON.stringify({
          success: false,
          error: "No AURA state found. Start with aura_initialize."
        })
      }]
    };
  }
  
  // Read memory file for human-readable context
  const memory = await fileManager.readMarkdown('.aura/memory.md');
  
  return {
    content: [{
      type: "text",
      text: JSON.stringify({
        success: true,
        message: "🔄 Context restored",
        project: state.project.name,
        goal: state.project.goal,
        health: state.intelligence.health_score,
        tech_stack: state.project.tech_stack,
        message_count: state.session.message_count,
        last_save: state.session.last_save,
        next_steps: state.next_steps,
        memory_content: memory
      })
    }]
  };
}