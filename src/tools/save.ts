import { z } from 'zod';
import { StateManager } from '../core/state.js';
import { HealthCalculator } from '../core/health.js';

const SaveSchema = z.object({
  workspace_path: z.string(),
  message: z.string().optional()
});

export async function saveTool(args: unknown) {
  const { workspace_path, message } = SaveSchema.parse(args);
  process.chdir(workspace_path);
  const stateManager = new StateManager();
  
  const state = await stateManager.loadState();
  if (!state) {
    return {
      content: [{
        type: "text",
        text: JSON.stringify({
          success: false,
          error: "AURA not initialized. Run aura_initialize first."
        })
      }]
    };
  }
  
  // Update state
  state.session.last_save = new Date().toISOString();
  if (message) {
    state.next_steps.unshift(message);
    state.next_steps = state.next_steps.slice(0, 5); // Keep top 5
  }
  
  // Recalculate health
  const healthCalc = new HealthCalculator();
  const health = healthCalc.calculateHealth(state);
  state.intelligence.health_score = health.overall;
  state.intelligence.last_health_check = new Date().toISOString();
  
  await stateManager.saveState(state);
  
  return {
    content: [{
      type: "text",
      text: JSON.stringify({
        success: true,
        message: "💾 Context saved successfully",
        health: health.overall,
        backup_created: true,
        next_steps: state.next_steps
      })
    }]
  };
}