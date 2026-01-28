export interface AuraState {
  version: string;
  project: {
    name: string;
    goal?: string;
    initialized: string;
    tech_stack: string[];
    linked_task_list?: string;  // ID of linked Claude Code task list
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
    task_health_score?: number;  // Health score from linked task list
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

// === Claude Code Tasks Integration ===

export type TaskStatus = 'pending' | 'in_progress' | 'blocked' | 'completed' | 'cancelled';
export type TaskPriority = 'low' | 'medium' | 'high' | 'critical';

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  dependencies: string[];  // IDs of tasks that must complete first
  blockedBy?: string[];    // IDs of tasks currently blocking this
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  assignedSession?: string;  // Session ID working on this task
  tags: string[];
  metadata?: Record<string, unknown>;
}

export interface TaskList {
  id: string;
  name: string;
  description?: string;
  tasks: Task[];
  createdAt: string;
  updatedAt: string;
  projectPath?: string;  // Links to AURA project
}

export interface TaskEvent {
  type: 'created' | 'updated' | 'completed' | 'blocked' | 'unblocked';
  taskId: string;
  taskListId: string;
  timestamp: string;
  sessionId?: string;
  data?: Record<string, unknown>;
}

export interface TaskHealth {
  totalTasks: number;
  completedTasks: number;
  blockedTasks: number;
  inProgressTasks: number;
  completionRate: number;  // 0-100
  avgTaskAge: number;      // Days
  staleTasks: number;      // Tasks not updated in 7+ days
  healthScore: number;     // 0-10 scale
}

export interface TaskIntelligence {
  suggestedNextTask: Task | null;
  blockerAnalysis: string[];
  dependencyIssues: string[];
  recommendations: string[];
}