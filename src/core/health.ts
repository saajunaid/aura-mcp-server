import type { HealthBreakdown } from '../types/index.js';

export class HealthCalculator {
  calculateHealth(state: any): HealthBreakdown {
    const configAlignment = this.calculateConfigAlignment(state);
    const testCoverage = this.calculateTestCoverage(state);
    const envSync = this.calculateEnvSync(state);
    const documentation = this.calculateDocumentation(state);
    
    const overall = 
      configAlignment.score * 0.40 +
      testCoverage.score * 0.25 +
      envSync.score * 0.20 +
      documentation.score * 0.15;
    
    return {
      overall: Math.round(overall * 10) / 10,
      components: {
        config_alignment: { ...configAlignment, weight: 0.40 },
        test_coverage: { ...testCoverage, weight: 0.25 },
        env_sync: { ...envSync, weight: 0.20 },
        documentation: { ...documentation, weight: 0.15 }
      }
    };
  }
  
  private calculateConfigAlignment(state: any): { score: number; issues: string[] } {
    // For MVP, assume good alignment if state exists
    // In full version, this would analyze actual code
    const issues: string[] = [];
    let score = 10;
    
    if (!state.project?.tech_stack || state.project.tech_stack.length === 0) {
      issues.push('Tech stack not defined');
      score -= 2;
    }
    
    return { score: Math.max(0, score), issues };
  }
  
  private calculateTestCoverage(state: any): { 
    score: number; 
    current: number; 
    target: number 
  } {
    const current = state.intelligence?.test_coverage || 0;
    const target = 80;
    const score = (current / target) * 10;
    
    return {
      score: Math.min(10, score),
      current,
      target
    };
  }
  
  private calculateEnvSync(state: any): { score: number; missing_vars: string[] } {
    // For MVP, assume good sync
    // In full version, compare .env vs .env.example
    return {
      score: 10,
      missing_vars: []
    };
  }
  
  private calculateDocumentation(state: any): { score: number; outdated_files: string[] } {
    // For MVP, assume good docs
    // In full version, check README, architecture/ timestamps
    return {
      score: 10,
      outdated_files: []
    };
  }
}