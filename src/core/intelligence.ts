import type { Intelligence, AuraState, HealthBreakdown } from '../types/index.js';
import { HealthCalculator } from './health.js';

export class IntelligenceEngine {
  private healthCalc = new HealthCalculator();
  
  analyze(state: AuraState, messageCount: number): Intelligence {
    const health = this.healthCalc.calculateHealth(state);
    const recommendedModel = this.recommendModel(messageCount, health.overall);
    const nextAction = this.suggestNextAction(health, state);
    const { show, message } = this.shouldShowFooter(health.overall, messageCount);
    
    return {
      recommended_model: recommendedModel,
      reasoning: this.explainModelChoice(recommendedModel, messageCount),
      health: health.overall,
      next_action: nextAction,
      show_footer: show,
      footer_message: message
    };
  }
  
  private recommendModel(messageCount: number, health: number): string {
    // Model recommendations based on context
    if (messageCount > 30) {
      return 'Consider saving and starting fresh';
    }
    
    if (health < 6.0) {
      return 'Current model (fix health first)';
    }
    
    return 'Current model (optimal)';
  }
  
  private explainModelChoice(model: string, messageCount: number): string {
    if (messageCount > 30) {
      return 'Context quality degrades after 30 messages. Save progress and start fresh.';
    }
    
    return 'Current model is suitable for your task';
  }
  
  private suggestNextAction(health: HealthBreakdown, state: AuraState): string {
    if (health.overall < 5.0) {
      return 'Critical: Run aura_diagnose to see issues';
    }
    
    if (health.overall < 7.0) {
      return 'Improve health: Add tests or fix violations';
    }
    
    if (state.next_steps && state.next_steps.length > 0) {
      return state.next_steps[0];
    }
    
    return 'Continue building features';
  }
  
  private shouldShowFooter(health: number, messageCount: number): { 
    show: boolean; 
    message?: string 
  } {
    // Silent mode (health good, session not too long)
    if (health >= 7.0 && messageCount < 20) {
      return { show: false };
    }
    
    // Critical health
    if (health < 5.0) {
      return {
        show: true,
        message: `🚨 Health: ${health}/10 - Critical issues detected. Run aura_diagnose`
      };
    }
    
    // Low health
    if (health < 7.0) {
      return {
        show: true,
        message: `⚠️ Health: ${health}/10 - Consider improving code quality`
      };
    }
    
    // Long session
    if (messageCount >= 20 && messageCount < 30) {
      return {
        show: true,
        message: `💡 ${messageCount} messages - Consider saving soon (quality stays high until ~30)`
      };
    }
    
    if (messageCount >= 30) {
      return {
        show: true,
        message: `⚠️ ${messageCount} messages - Save and start fresh recommended`
      };
    }
    
    return { show: false };
  }
}