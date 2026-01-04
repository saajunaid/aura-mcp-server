import { z } from 'zod';
import { PatternObserver } from '../core/observer.js';
import { StateManager } from '../core/state.js';

const InitializeSchema = z.object({
  project_goal: z.string().optional(),
  force: z.boolean().optional()
});

export async function initializeTool(args: unknown) {
  const { project_goal, force } = InitializeSchema.parse(args);
  const stateManager = new StateManager();
  
  // Check if already initialized
  const existingState = await stateManager.loadState();
  if (existingState && !force) {
    return {
      content: [{
        type: "text",
        text: JSON.stringify({
          success: false,
          error: "AURA already initialized. Use force=true to reinitialize."
        })
      }]
    };
  }
  
  // For MVP, create basic state
  // In production, this would analyze observed patterns
  const observer = new PatternObserver();
  const patterns = observer.getPatterns();
  
  const state = await stateManager.initializeState(patterns, project_goal);
  
  return {
    content: [{
      type: "text",
      text: JSON.stringify({
        success: true,
        message: "✅ AURA initialized successfully",
        project: state.project.name,
        goal: state.project.goal,
        health: state.intelligence.health_score
      })
    }]
  };
}