import { StateManager } from '../core/state.js';
import { HealthCalculator } from '../core/health.js';

export async function diagnoseTool() {
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
  
  const healthCalc = new HealthCalculator();
  const health = healthCalc.calculateHealth(state);
  
  return {
    content: [{
      type: "text",
      text: JSON.stringify({
        success: true,
        health: health.overall,
        breakdown: health.components,
        recommendations: generateRecommendations(health)
      })
    }]
  };
}

function generateRecommendations(health: any): string[] {
  const recommendations: string[] = [];
  
  if (health.components.test_coverage.score < 7) {
    recommendations.push(
      `Add tests: Current coverage ${health.components.test_coverage.current}%, target ${health.components.test_coverage.target}%`
    );
  }
  
  if (health.components.config_alignment.issues.length > 0) {
    recommendations.push(
      `Fix config issues: ${health.components.config_alignment.issues.join(', ')}`
    );
  }
  
  if (health.overall < 7) {
    recommendations.push('Run aura_save regularly to track improvements');
  }
  
  return recommendations;
}