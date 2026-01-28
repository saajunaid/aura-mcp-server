import { z } from 'zod';
import path from 'path';
import { PatternObserver } from '../core/observer.js';
import { StateManager } from '../core/state.js';

const InitializeSchema = z.object({
  workspace_path: z.string(),  // ← REQUIRED now
  project_goal: z.string().optional(),
  force: z.boolean().optional()
});

export async function initializeTool(args: unknown) {
  const { workspace_path, project_goal, force } = InitializeSchema.parse(args);
  
  // Change working directory to workspace
  process.chdir(workspace_path);
  
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
  
  const observer = new PatternObserver();
  const patterns = observer.getPatterns();
  
  const state = await stateManager.initializeState(patterns, project_goal);
  
  return {
    content: [{
      type: "text",
      text: JSON.stringify({
        success: true,
        message: "✅ AURA initialized successfully",
        workspace: workspace_path,
        project: state.project.name,
        goal: state.project.goal,
        health: state.intelligence.health_score,
        files_created: [
          path.join(workspace_path, '.aura/state.json'),
          path.join(workspace_path, '.aura/memory.md')
        ]
      })
    }]
  };
}