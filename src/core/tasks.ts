import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import type { 
  Task, 
  TaskList, 
  TaskStatus, 
  TaskPriority, 
  TaskHealth, 
  TaskIntelligence,
  TaskEvent 
} from '../types/index.js';
import { Logger } from '../utils/logger.js';

const logger = new Logger();

export type TaskStorageMode = 'project' | 'claude' | 'both';

export interface TaskManagerOptions {
  /** Storage mode: 'project' (default), 'claude', or 'both' */
  storageMode?: TaskStorageMode;
  /** Project path for project-local storage */
  projectPath?: string;
}

/**
 * TaskManager provides standalone task management for any MCP-compatible IDE.
 * 
 * Storage Options:
 * - Project-local: .aura/tasks/ (default, version-controllable)
 * - Claude Code: ~/.claude/tasks/ (fallback for Claude Code users)
 * - Both: Syncs between project and Claude Code storage
 * 
 * Features:
 * - Works in VS Code, Cursor, Windsurf, JetBrains, Claude Code
 * - Task dependencies and blocking
 * - Health scoring and analytics
 * - Intelligent task recommendations
 */
export class TaskManager {
  private projectTasksDir: string;
  private claudeTasksDir: string;
  private storageMode: TaskStorageMode;
  private sessionId: string;
  
  constructor(options: TaskManagerOptions = {}) {
    const projectPath = options.projectPath || process.cwd();
    this.projectTasksDir = path.join(projectPath, '.aura', 'tasks');
    this.claudeTasksDir = path.join(os.homedir(), '.claude', 'tasks');
    this.storageMode = options.storageMode || 'project';
    this.sessionId = `aura-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  }
  
  /**
   * Get the primary tasks directory based on storage mode
   */
  private getPrimaryTasksDir(): string {
    return this.storageMode === 'claude' ? this.claudeTasksDir : this.projectTasksDir;
  }
  
  /**
   * Ensure the tasks directories exist
   */
  async ensureTasksDirectory(): Promise<void> {
    try {
      await fs.mkdir(this.projectTasksDir, { recursive: true });
      
      if (this.storageMode === 'claude' || this.storageMode === 'both') {
        await fs.mkdir(this.claudeTasksDir, { recursive: true });
      }
    } catch (error) {
      logger.error('Failed to create tasks directory:', error);
      throw error;
    }
  }
  
  /**
   * Get the current task list ID from environment or default
   */
  getActiveTaskListId(): string | null {
    // Check for AURA-specific env var first, then Claude's
    return process.env.AURA_TASK_LIST_ID || 
           process.env.CLAUDE_CODE_TASK_LIST_ID || 
           null;
  }
  
  /**
   * Set storage mode
   */
  setStorageMode(mode: TaskStorageMode): void {
    this.storageMode = mode;
  }
  
  /**
   * Get current storage mode
   */
  getStorageMode(): TaskStorageMode {
    return this.storageMode;
  }
  
  /**
   * List all available task lists from all configured storage locations
   */
  async listTaskLists(): Promise<TaskList[]> {
    await this.ensureTasksDirectory();
    
    const taskLists: TaskList[] = [];
    const seenIds = new Set<string>();
    
    // Read from project-local first
    if (this.storageMode === 'project' || this.storageMode === 'both') {
      const projectLists = await this.readTaskListsFromDir(this.projectTasksDir, 'project');
      for (const list of projectLists) {
        if (!seenIds.has(list.id)) {
          seenIds.add(list.id);
          taskLists.push(list);
        }
      }
    }
    
    // Read from Claude Code storage
    if (this.storageMode === 'claude' || this.storageMode === 'both') {
      const claudeLists = await this.readTaskListsFromDir(this.claudeTasksDir, 'claude');
      for (const list of claudeLists) {
        if (!seenIds.has(list.id)) {
          seenIds.add(list.id);
          taskLists.push(list);
        }
      }
    }
    
    return taskLists.sort((a, b) => 
      new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
  }
  
  /**
   * Read task lists from a specific directory
   */
  private async readTaskListsFromDir(
    dir: string, 
    source: 'project' | 'claude'
  ): Promise<TaskList[]> {
    try {
      const files = await fs.readdir(dir);
      const taskLists: TaskList[] = [];
      
      for (const file of files) {
        if (file.endsWith('.json')) {
          try {
            const content = await fs.readFile(path.join(dir, file), 'utf-8');
            const taskList = JSON.parse(content) as TaskList;
            // Add metadata about storage location
            (taskList as any)._storage = source;
            taskLists.push(taskList);
          } catch {
            logger.warn(`Invalid task list file: ${file}`);
          }
        }
      }
      
      return taskLists;
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        return []; // Directory doesn't exist yet
      }
      logger.error(`Failed to read task lists from ${dir}:`, error);
      return [];
    }
  }
  
  /**
   * Get a specific task list by ID (checks all storage locations)
   */
  async getTaskList(taskListId: string): Promise<TaskList | null> {
    // Try project-local first
    if (this.storageMode === 'project' || this.storageMode === 'both') {
      const projectPath = path.join(this.projectTasksDir, `${taskListId}.json`);
      try {
        const content = await fs.readFile(projectPath, 'utf-8');
        const taskList = JSON.parse(content) as TaskList;
        (taskList as any)._storage = 'project';
        return taskList;
      } catch {
        // Not found in project, try Claude
      }
    }
    
    // Try Claude Code storage
    if (this.storageMode === 'claude' || this.storageMode === 'both') {
      const claudePath = path.join(this.claudeTasksDir, `${taskListId}.json`);
      try {
        const content = await fs.readFile(claudePath, 'utf-8');
        const taskList = JSON.parse(content) as TaskList;
        (taskList as any)._storage = 'claude';
        return taskList;
      } catch {
        // Not found
      }
    }
    
    return null;
  }
  
  /**
   * Create a new task list
   */
  async createTaskList(
    name: string, 
    description?: string, 
    projectPath?: string
  ): Promise<TaskList> {
    await this.ensureTasksDirectory();
    
    const taskList: TaskList = {
      id: `tl-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      name,
      description,
      tasks: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      projectPath: projectPath || process.cwd()
    };
    
    await this.saveTaskList(taskList);
    return taskList;
  }
  
  /**
   * Save a task list to disk
   */
  async saveTaskList(taskList: TaskList, syncToClaude: boolean = false): Promise<void> {
    await this.ensureTasksDirectory();
    
    taskList.updatedAt = new Date().toISOString();
    
    // Remove internal metadata before saving
    const listToSave = { ...taskList };
    delete (listToSave as any)._storage;
    
    const jsonContent = JSON.stringify(listToSave, null, 2);
    
    // Save to project-local
    if (this.storageMode === 'project' || this.storageMode === 'both') {
      await this.atomicWrite(
        path.join(this.projectTasksDir, `${taskList.id}.json`),
        jsonContent
      );
    }
    
    // Save to Claude Code storage (if mode is 'claude', 'both', or explicitly requested)
    if (this.storageMode === 'claude' || this.storageMode === 'both' || syncToClaude) {
      await this.atomicWrite(
        path.join(this.claudeTasksDir, `${taskList.id}.json`),
        jsonContent
      );
    }
  }
  
  /**
   * Atomic file write operation
   */
  private async atomicWrite(filePath: string, content: string): Promise<void> {
    const dir = path.dirname(filePath);
    await fs.mkdir(dir, { recursive: true });
    
    const tmpPath = `${filePath}.tmp`;
    try {
      await fs.writeFile(tmpPath, content, 'utf-8');
      await fs.rename(tmpPath, filePath);
    } catch (error) {
      try { await fs.unlink(tmpPath); } catch {}
      throw error;
    }
  }
  
  /**
   * Sync a project task list to Claude Code storage
   */
  async syncToClaude(taskListId: string): Promise<boolean> {
    const taskList = await this.getTaskList(taskListId);
    if (!taskList) return false;
    
    await this.atomicWrite(
      path.join(this.claudeTasksDir, `${taskList.id}.json`),
      JSON.stringify(taskList, null, 2)
    );
    
    logger.info(`Synced task list ${taskListId} to Claude Code storage`);
    return true;
  }
  
  /**
   * Import a task list from Claude Code storage to project
   */
  async importFromClaude(taskListId: string): Promise<TaskList | null> {
    const claudePath = path.join(this.claudeTasksDir, `${taskListId}.json`);
    
    try {
      const content = await fs.readFile(claudePath, 'utf-8');
      const taskList = JSON.parse(content) as TaskList;
      
      // Update project path
      taskList.projectPath = process.cwd();
      
      // Save to project-local
      await this.atomicWrite(
        path.join(this.projectTasksDir, `${taskList.id}.json`),
        JSON.stringify(taskList, null, 2)
      );
      
      logger.info(`Imported task list ${taskListId} from Claude Code`);
      return taskList;
    } catch {
      return null;
    }
  }
  
  /**
   * Create a new task in a task list
   */
  async createTask(
    taskListId: string,
    title: string,
    options: {
      description?: string;
      priority?: TaskPriority;
      dependencies?: string[];
      tags?: string[];
      metadata?: Record<string, unknown>;
    } = {}
  ): Promise<Task> {
    const taskList = await this.getTaskList(taskListId);
    if (!taskList) {
      throw new Error(`Task list not found: ${taskListId}`);
    }
    
    const task: Task = {
      id: `task-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      title,
      description: options.description,
      status: 'pending',
      priority: options.priority || 'medium',
      dependencies: options.dependencies || [],
      tags: options.tags || [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      metadata: options.metadata
    };
    
    // Check for blocked status based on dependencies
    if (task.dependencies.length > 0) {
      const blockers = this.findBlockers(task, taskList.tasks);
      if (blockers.length > 0) {
        task.blockedBy = blockers;
        task.status = 'blocked';
      }
    }
    
    taskList.tasks.push(task);
    await this.saveTaskList(taskList);
    
    return task;
  }
  
  /**
   * Create multiple tasks from an array of titles (for todo sync)
   */
  async createTasksFromTodos(
    taskListId: string,
    todos: Array<{ title: string; status?: string }>
  ): Promise<Task[]> {
    const taskList = await this.getTaskList(taskListId);
    if (!taskList) {
      throw new Error(`Task list not found: ${taskListId}`);
    }
    
    const createdTasks: Task[] = [];
    
    for (const todo of todos) {
      // Check if similar task already exists
      const exists = taskList.tasks.some(t => 
        t.title.toLowerCase() === todo.title.toLowerCase()
      );
      
      if (!exists) {
        const task: Task = {
          id: `task-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          title: todo.title,
          status: this.mapTodoStatusToTaskStatus(todo.status),
          priority: 'medium',
          dependencies: [],
          tags: ['from-todos'],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          metadata: { source: 'todo_sync' }
        };
        
        taskList.tasks.push(task);
        createdTasks.push(task);
      }
    }
    
    if (createdTasks.length > 0) {
      await this.saveTaskList(taskList);
    }
    
    return createdTasks;
  }
  
  /**
   * Map todo status to task status
   */
  private mapTodoStatusToTaskStatus(todoStatus?: string): TaskStatus {
    switch (todoStatus) {
      case 'completed': return 'completed';
      case 'in-progress': return 'in_progress';
      default: return 'pending';
    }
  }
  
  /**
   * Update a task's status
   */
  async updateTaskStatus(
    taskListId: string, 
    taskId: string, 
    status: TaskStatus
  ): Promise<Task | null> {
    const taskList = await this.getTaskList(taskListId);
    if (!taskList) return null;
    
    const task = taskList.tasks.find(t => t.id === taskId);
    if (!task) return null;
    
    const oldStatus = task.status;
    task.status = status;
    task.updatedAt = new Date().toISOString();
    
    if (status === 'completed') {
      task.completedAt = new Date().toISOString();
      task.assignedSession = undefined;
      
      // Unblock dependent tasks
      await this.unblockDependentTasks(taskList, taskId);
    } else if (status === 'in_progress') {
      task.assignedSession = this.sessionId;
    }
    
    await this.saveTaskList(taskList);
    
    logger.info(`Task ${taskId} status changed: ${oldStatus} → ${status}`);
    return task;
  }
  
  /**
   * Find blockers for a task
   */
  private findBlockers(task: Task, allTasks: Task[]): string[] {
    return task.dependencies.filter(depId => {
      const dep = allTasks.find(t => t.id === depId);
      return dep && dep.status !== 'completed';
    });
  }
  
  /**
   * Unblock tasks that were waiting on a completed task
   */
  private async unblockDependentTasks(taskList: TaskList, completedTaskId: string): Promise<void> {
    for (const task of taskList.tasks) {
      if (task.blockedBy?.includes(completedTaskId)) {
        task.blockedBy = task.blockedBy.filter(id => id !== completedTaskId);
        
        if (task.blockedBy.length === 0) {
          task.status = 'pending';
          task.blockedBy = undefined;
          task.updatedAt = new Date().toISOString();
          logger.info(`Task ${task.id} unblocked`);
        }
      }
    }
  }
  
  /**
   * Calculate health metrics for a task list
   */
  calculateTaskHealth(taskList: TaskList): TaskHealth {
    const tasks = taskList.tasks;
    const now = new Date();
    
    if (tasks.length === 0) {
      return {
        totalTasks: 0,
        completedTasks: 0,
        blockedTasks: 0,
        inProgressTasks: 0,
        completionRate: 100,
        avgTaskAge: 0,
        staleTasks: 0,
        healthScore: 10
      };
    }
    
    const completedTasks = tasks.filter(t => t.status === 'completed').length;
    const blockedTasks = tasks.filter(t => t.status === 'blocked').length;
    const inProgressTasks = tasks.filter(t => t.status === 'in_progress').length;
    
    // Calculate average task age (in days)
    const ages = tasks.map(t => 
      (now.getTime() - new Date(t.createdAt).getTime()) / (1000 * 60 * 60 * 24)
    );
    const avgTaskAge = ages.reduce((a, b) => a + b, 0) / ages.length;
    
    // Count stale tasks (not updated in 7 days)
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const staleTasks = tasks.filter(t => 
      t.status !== 'completed' && 
      new Date(t.updatedAt) < sevenDaysAgo
    ).length;
    
    const completionRate = (completedTasks / tasks.length) * 100;
    
    // Calculate health score (0-10)
    let healthScore = 10;
    
    // Deduct for blocked tasks (high impact)
    healthScore -= Math.min(3, blockedTasks * 0.5);
    
    // Deduct for stale tasks
    healthScore -= Math.min(2, staleTasks * 0.3);
    
    // Deduct for low completion rate on mature projects
    if (tasks.length > 5 && completionRate < 30) {
      healthScore -= 1.5;
    }
    
    // Deduct for old average age
    if (avgTaskAge > 14) {
      healthScore -= Math.min(1.5, (avgTaskAge - 14) * 0.1);
    }
    
    return {
      totalTasks: tasks.length,
      completedTasks,
      blockedTasks,
      inProgressTasks,
      completionRate: Math.round(completionRate * 10) / 10,
      avgTaskAge: Math.round(avgTaskAge * 10) / 10,
      staleTasks,
      healthScore: Math.max(0, Math.round(healthScore * 10) / 10)
    };
  }
  
  /**
   * Get intelligent recommendations for a task list
   */
  analyzeTaskList(taskList: TaskList): TaskIntelligence {
    const tasks = taskList.tasks;
    const recommendations: string[] = [];
    const blockerAnalysis: string[] = [];
    const dependencyIssues: string[] = [];
    
    // Find next suggested task
    const pendingTasks = tasks.filter(t => 
      t.status === 'pending' && 
      (!t.blockedBy || t.blockedBy.length === 0)
    );
    
    // Sort by priority, then by creation date
    const priorityOrder: Record<TaskPriority, number> = {
      critical: 0,
      high: 1,
      medium: 2,
      low: 3
    };
    
    pendingTasks.sort((a, b) => {
      const prioDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
      if (prioDiff !== 0) return prioDiff;
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    });
    
    const suggestedNextTask = pendingTasks[0] || null;
    
    // Analyze blockers
    const blockedTasks = tasks.filter(t => t.status === 'blocked');
    for (const blocked of blockedTasks) {
      const blockerTitles = blocked.blockedBy?.map(id => {
        const blocker = tasks.find(t => t.id === id);
        return blocker?.title || id;
      }) || [];
      
      blockerAnalysis.push(
        `"${blocked.title}" is blocked by: ${blockerTitles.join(', ')}`
      );
    }
    
    // Check for circular dependencies
    for (const task of tasks) {
      if (this.hasCircularDependency(task, tasks, new Set())) {
        dependencyIssues.push(`Circular dependency detected involving "${task.title}"`);
      }
    }
    
    // Check for missing dependencies
    for (const task of tasks) {
      for (const depId of task.dependencies) {
        if (!tasks.find(t => t.id === depId)) {
          dependencyIssues.push(
            `"${task.title}" depends on non-existent task: ${depId}`
          );
        }
      }
    }
    
    // Generate recommendations
    const health = this.calculateTaskHealth(taskList);
    
    if (health.blockedTasks > 2) {
      recommendations.push('Focus on completing blocking tasks to unblock workflow');
    }
    
    if (health.staleTasks > 0) {
      recommendations.push(`Review ${health.staleTasks} stale task(s) - consider cancelling or updating`);
    }
    
    if (health.inProgressTasks > 3) {
      recommendations.push('Too many tasks in progress - focus on completing before starting new ones');
    }
    
    if (suggestedNextTask) {
      recommendations.push(`Suggested next: "${suggestedNextTask.title}" (${suggestedNextTask.priority} priority)`);
    }
    
    return {
      suggestedNextTask,
      blockerAnalysis,
      dependencyIssues,
      recommendations
    };
  }
  
  /**
   * Check for circular dependencies
   */
  private hasCircularDependency(
    task: Task, 
    allTasks: Task[], 
    visited: Set<string>
  ): boolean {
    if (visited.has(task.id)) return true;
    visited.add(task.id);
    
    for (const depId of task.dependencies) {
      const dep = allTasks.find(t => t.id === depId);
      if (dep && this.hasCircularDependency(dep, allTasks, new Set(visited))) {
        return true;
      }
    }
    
    return false;
  }
  
  /**
   * Link a task list to an AURA project
   */
  async linkToProject(taskListId: string, projectPath: string): Promise<TaskList | null> {
    const taskList = await this.getTaskList(taskListId);
    if (!taskList) return null;
    
    taskList.projectPath = projectPath;
    await this.saveTaskList(taskList);
    
    return taskList;
  }
  
  /**
   * Get task list for the current project (if linked)
   */
  async getProjectTaskList(projectPath: string): Promise<TaskList | null> {
    const taskLists = await this.listTaskLists();
    return taskLists.find(tl => tl.projectPath === projectPath) || null;
  }
  
  /**
   * Get or create a default task list for the current project
   */
  async getOrCreateProjectTaskList(projectName?: string): Promise<TaskList> {
    const projectPath = process.cwd();
    
    // Check for existing project task list
    let taskList = await this.getProjectTaskList(projectPath);
    
    if (!taskList) {
      // Create a new one
      const name = projectName || path.basename(projectPath);
      taskList = await this.createTaskList(
        `${name} Tasks`,
        `Task list for ${name}`,
        projectPath
      );
    }
    
    return taskList;
  }
  
  /**
   * Sync AURA next_steps with a task list
   */
  async syncNextStepsToTasks(
    taskListId: string, 
    nextSteps: string[]
  ): Promise<Task[]> {
    const taskList = await this.getTaskList(taskListId);
    if (!taskList) {
      throw new Error(`Task list not found: ${taskListId}`);
    }
    
    const createdTasks: Task[] = [];
    
    for (const step of nextSteps) {
      // Check if a similar task already exists
      const exists = taskList.tasks.some(t => 
        t.title.toLowerCase() === step.toLowerCase() ||
        t.title.toLowerCase().includes(step.toLowerCase())
      );
      
      if (!exists) {
        const task: Task = {
          id: `task-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          title: step,
          status: 'pending',
          priority: 'medium',
          dependencies: [],
          tags: ['from-aura', 'next-step'],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          metadata: { source: 'aura_sync' }
        };
        
        taskList.tasks.push(task);
        createdTasks.push(task);
      }
    }
    
    if (createdTasks.length > 0) {
      await this.saveTaskList(taskList);
    }
    
    return createdTasks;
  }
}
