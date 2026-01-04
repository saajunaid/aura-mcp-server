export interface AuraState {
  version: string;
  project: {
    name: string;
    goal?: string;
    initialized: string;
    tech_stack: string[];
  };
  session: {
    message_count: number;
    last_active_model: string;
    last_save: string;
    observed_patterns: string[];
  };
  intelligence: {
    health_score: number;
    last_health_check: string;
    test_coverage: number;
    total_functions: number;
  };
  next_steps: string[];
}

export interface HealthBreakdown {
  overall: number;
  components: {
    config_alignment: { score: number; weight: number; issues: string[] };
    test_coverage: { score: number; weight: number; current: number; target: number };
    env_sync: { score: number; weight: number; missing_vars: string[] };
    documentation: { score: number; weight: number; outdated_files: string[] };
  };
}

export interface Intelligence {
  recommended_model: string;
  reasoning: string;
  health: number;
  next_action: string;
  show_footer: boolean;
  footer_message?: string;
}

export interface ObservedPatterns {
  frameworks: string[];
  languages: string[];
  imports: string[];
  patterns: string[];
  tech_detected: string[];
}