import { z } from 'zod';
import { TaskManager, TaskStorageMode } from '../core/tasks.js';
import { StateManager } from '../core/state.js';
import type { TaskPriority, TaskStatus } from '../types/index.js';

const TasksSchema = z.object({
  action: z.enum([
    'list_task_lists',   // List all task lists
    'get_task_list',     // Get a specific task list
    'create_task_list',  // Create a new task list
    'create_task',       // Create a task in a list
    'update_status',     // Update task status
    'analyze',           // Get intelligence/recommendations
    'health',            // Get task health metrics
    'sync_from_aura',    // Sync AURA next_steps to tasks
    'sync_todos',        // Sync current session todos to tasks
    'sync_to_claude',    // Sync project tasks to Claude Code storage
    'import_from_claude', // Import tasks from Claude Code storage
    'set_storage_mode',  // Change storage mode
    'link_project',      // Link task list to current project
    'get_or_create'      // Get or create project task list
  ]),
  task_list_id: z.string().optional(),
  task_id: z.string().optional(),
  title: z.string().optional(),
  description: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high', 'critical']).optional(),
  status: z.enum(['pending', 'in_progress', 'blocked', 'completed', 'cancelled']).optional(),
  dependencies: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
  storage_mode: z.enum(['project', 'claude', 'both']).optional(),
  todos: z.array(z.object({
    title: z.string(),
    status: z.string().optional()
  })).optional()
});

export async function tasksTool(args: unknown) {
  const params = TasksSchema.parse(args);
  const taskManager = new TaskManager();
  
  try {
    switch (params.action) {
      case 'list_task_lists': {
        const taskLists = await taskManager.listTaskLists();
        const activeId = taskManager.getActiveTaskListId();
        
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              success: true,
              active_task_list: activeId,
              task_lists: taskLists.map(tl => ({
                id: tl.id,
                name: tl.name,
                task_count: tl.tasks.length,
                completed: tl.tasks.filter(t => t.status === 'completed').length,
                updated: tl.updatedAt,
                project: tl.projectPath
              })),
              hint: activeId ? 
                `Active task list: ${activeId}` : 
                'No active task list. Set CLAUDE_CODE_TASK_LIST_ID to share with Claude Code.'
            }, null, 2)
          }]
        };
      }
      
      case 'get_task_list': {
        const taskListId = params.task_list_id || taskManager.getActiveTaskListId();
        if (!taskListId) {
          return {
            content: [{
              type: "text",
              text: JSON.stringify({
                success: false,
                error: "No task_list_id provided and no active task list set"
              })
            }]
          };
        }
        
        const taskList = await taskManager.getTaskList(taskListId);
        if (!taskList) {
          return {
            content: [{
              type: "text",
              text: JSON.stringify({
                success: false,
                error: `Task list not found: ${taskListId}`
              })
            }]
          };
        }
        
        const health = taskManager.calculateTaskHealth(taskList);
        
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              success: true,
              task_list: {
                id: taskList.id,
                name: taskList.name,
                description: taskList.description,
                project: taskList.projectPath,
                health_score: health.healthScore,
                stats: {
                  total: health.totalTasks,
                  completed: health.completedTasks,
                  blocked: health.blockedTasks,
                  in_progress: health.inProgressTasks,
                  completion_rate: `${health.completionRate}%`
                }
              },
              tasks: taskList.tasks.map(t => ({
                id: t.id,
                title: t.title,
                status: t.status,
                priority: t.priority,
                blocked_by: t.blockedBy,
                tags: t.tags
              }))
            }, null, 2)
          }]
        };
      }
      
      case 'create_task_list': {
        if (!params.title) {
          return {
            content: [{
              type: "text",
              text: JSON.stringify({
                success: false,
                error: "title is required for create_task_list"
              })
            }]
          };
        }
        
        const projectPath = process.cwd();
        const taskList = await taskManager.createTaskList(
          params.title, 
          params.description,
          projectPath
        );
        
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              success: true,
              message: "📋 Task list created",
              task_list: {
                id: taskList.id,
                name: taskList.name,
                project: taskList.projectPath
              },
              hint: `To share with Claude Code: CLAUDE_CODE_TASK_LIST_ID=${taskList.id} claude`
            }, null, 2)
          }]
        };
      }
      
      case 'create_task': {
        const taskListId = params.task_list_id || taskManager.getActiveTaskListId();
        if (!taskListId) {
          return {
            content: [{
              type: "text",
              text: JSON.stringify({
                success: false,
                error: "No task_list_id provided and no active task list set"
              })
            }]
          };
        }
        
        if (!params.title) {
          return {
            content: [{
              type: "text",
              text: JSON.stringify({
                success: false,
                error: "title is required for create_task"
              })
            }]
          };
        }
        
        const task = await taskManager.createTask(taskListId, params.title, {
          description: params.description,
          priority: params.priority as TaskPriority,
          dependencies: params.dependencies,
          tags: params.tags
        });
        
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              success: true,
              message: `✅ Task created: ${task.title}`,
              task: {
                id: task.id,
                title: task.title,
                status: task.status,
                priority: task.priority,
                blocked_by: task.blockedBy
              }
            }, null, 2)
          }]
        };
      }
      
      case 'update_status': {
        const taskListId = params.task_list_id || taskManager.getActiveTaskListId();
        if (!taskListId || !params.task_id || !params.status) {
          return {
            content: [{
              type: "text",
              text: JSON.stringify({
                success: false,
                error: "task_list_id (or active), task_id, and status are required"
              })
            }]
          };
        }
        
        const task = await taskManager.updateTaskStatus(
          taskListId, 
          params.task_id, 
          params.status as TaskStatus
        );
        
        if (!task) {
          return {
            content: [{
              type: "text",
              text: JSON.stringify({
                success: false,
                error: "Task not found"
              })
            }]
          };
        }
        
        const statusEmoji: Record<TaskStatus, string> = {
          pending: '⏳',
          in_progress: '🔄',
          blocked: '🚫',
          completed: '✅',
          cancelled: '❌'
        };
        
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              success: true,
              message: `${statusEmoji[task.status]} Task updated: ${task.title} → ${task.status}`,
              task: {
                id: task.id,
                title: task.title,
                status: task.status
              }
            }, null, 2)
          }]
        };
      }
      
      case 'analyze': {
        const taskListId = params.task_list_id || taskManager.getActiveTaskListId();
        if (!taskListId) {
          return {
            content: [{
              type: "text",
              text: JSON.stringify({
                success: false,
                error: "No task_list_id provided and no active task list set"
              })
            }]
          };
        }
        
        const taskList = await taskManager.getTaskList(taskListId);
        if (!taskList) {
          return {
            content: [{
              type: "text",
              text: JSON.stringify({
                success: false,
                error: `Task list not found: ${taskListId}`
              })
            }]
          };
        }
        
        const intelligence = taskManager.analyzeTaskList(taskList);
        
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              success: true,
              analysis: {
                suggested_next: intelligence.suggestedNextTask ? {
                  id: intelligence.suggestedNextTask.id,
                  title: intelligence.suggestedNextTask.title,
                  priority: intelligence.suggestedNextTask.priority
                } : null,
                blockers: intelligence.blockerAnalysis,
                dependency_issues: intelligence.dependencyIssues,
                recommendations: intelligence.recommendations
              }
            }, null, 2)
          }]
        };
      }
      
      case 'health': {
        const taskListId = params.task_list_id || taskManager.getActiveTaskListId();
        if (!taskListId) {
          return {
            content: [{
              type: "text",
              text: JSON.stringify({
                success: false,
                error: "No task_list_id provided and no active task list set"
              })
            }]
          };
        }
        
        const taskList = await taskManager.getTaskList(taskListId);
        if (!taskList) {
          return {
            content: [{
              type: "text",
              text: JSON.stringify({
                success: false,
                error: `Task list not found: ${taskListId}`
              })
            }]
          };
        }
        
        const health = taskManager.calculateTaskHealth(taskList);
        
        const healthEmoji = health.healthScore >= 8 ? '💚' : 
                           health.healthScore >= 6 ? '💛' : 
                           health.healthScore >= 4 ? '🧡' : '❤️';
        
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              success: true,
              health: {
                score: `${healthEmoji} ${health.healthScore}/10`,
                total_tasks: health.totalTasks,
                completed: health.completedTasks,
                blocked: health.blockedTasks,
                in_progress: health.inProgressTasks,
                completion_rate: `${health.completionRate}%`,
                avg_task_age_days: health.avgTaskAge,
                stale_tasks: health.staleTasks
              }
            }, null, 2)
          }]
        };
      }
      
      case 'sync_from_aura': {
        const taskListId = params.task_list_id || taskManager.getActiveTaskListId();
        if (!taskListId) {
          return {
            content: [{
              type: "text",
              text: JSON.stringify({
                success: false,
                error: "No task_list_id provided and no active task list set"
              })
            }]
          };
        }
        
        // Load AURA state to get next_steps
        const stateManager = new StateManager();
        const state = await stateManager.loadState();
        
        if (!state || !state.next_steps || state.next_steps.length === 0) {
          return {
            content: [{
              type: "text",
              text: JSON.stringify({
                success: false,
                error: "No AURA state or next_steps found. Run aura_initialize first."
              })
            }]
          };
        }
        
        const createdTasks = await taskManager.syncNextStepsToTasks(
          taskListId, 
          state.next_steps
        );
        
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              success: true,
              message: `🔄 Synced ${createdTasks.length} task(s) from AURA next_steps`,
              created_tasks: createdTasks.map(t => ({
                id: t.id,
                title: t.title
              }))
            }, null, 2)
          }]
        };
      }
      
      case 'link_project': {
        const taskListId = params.task_list_id || taskManager.getActiveTaskListId();
        if (!taskListId) {
          return {
            content: [{
              type: "text",
              text: JSON.stringify({
                success: false,
                error: "No task_list_id provided and no active task list set"
              })
            }]
          };
        }
        
        const projectPath = process.cwd();
        const taskList = await taskManager.linkToProject(taskListId, projectPath);
        
        if (!taskList) {
          return {
            content: [{
              type: "text",
              text: JSON.stringify({
                success: false,
                error: `Task list not found: ${taskListId}`
              })
            }]
          };
        }
        
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              success: true,
              message: `🔗 Task list linked to project`,
              task_list: taskList.id,
              project: projectPath
            }, null, 2)
          }]
        };
      }
      
      case 'sync_todos': {
        // Get or create project task list
        let taskListId = params.task_list_id || taskManager.getActiveTaskListId();
        let taskList;
        
        if (taskListId) {
          taskList = await taskManager.getTaskList(taskListId);
        }
        
        if (!taskList) {
          // Create a new project task list
          taskList = await taskManager.getOrCreateProjectTaskList();
          taskListId = taskList.id;
        }
        
        if (!params.todos || params.todos.length === 0) {
          return {
            content: [{
              type: "text",
              text: JSON.stringify({
                success: false,
                error: "No todos provided. Pass the current session todos to sync."
              })
            }]
          };
        }
        
        const createdTasks = await taskManager.createTasksFromTodos(
          taskListId!, 
          params.todos
        );
        
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              success: true,
              message: `📝 Synced ${createdTasks.length} todo(s) to AURA Tasks`,
              task_list_id: taskListId,
              created_tasks: createdTasks.map(t => ({
                id: t.id,
                title: t.title,
                status: t.status
              })),
              hint: createdTasks.length === 0 ? 
                "All todos already exist as tasks" : 
                `${params.todos.length - createdTasks.length} todo(s) were skipped (already exist)`
            }, null, 2)
          }]
        };
      }
      
      case 'sync_to_claude': {
        const taskListId = params.task_list_id || taskManager.getActiveTaskListId();
        if (!taskListId) {
          return {
            content: [{
              type: "text",
              text: JSON.stringify({
                success: false,
                error: "No task_list_id provided and no active task list set"
              })
            }]
          };
        }
        
        const synced = await taskManager.syncToClaude(taskListId);
        
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              success: synced,
              message: synced ? 
                `🔄 Task list synced to Claude Code storage (~/.claude/tasks)` :
                "Failed to sync - task list not found",
              task_list_id: taskListId,
              hint: `Claude Code can now access this task list via CLAUDE_CODE_TASK_LIST_ID=${taskListId}`
            }, null, 2)
          }]
        };
      }
      
      case 'import_from_claude': {
        if (!params.task_list_id) {
          return {
            content: [{
              type: "text",
              text: JSON.stringify({
                success: false,
                error: "task_list_id is required for import_from_claude"
              })
            }]
          };
        }
        
        const imported = await taskManager.importFromClaude(params.task_list_id);
        
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              success: !!imported,
              message: imported ? 
                `📥 Imported task list from Claude Code storage` :
                "Failed to import - task list not found in Claude Code storage",
              task_list: imported ? {
                id: imported.id,
                name: imported.name,
                task_count: imported.tasks.length
              } : null
            }, null, 2)
          }]
        };
      }
      
      case 'set_storage_mode': {
        if (!params.storage_mode) {
          return {
            content: [{
              type: "text",
              text: JSON.stringify({
                success: false,
                error: "storage_mode is required. Options: 'project', 'claude', 'both'"
              })
            }]
          };
        }
        
        taskManager.setStorageMode(params.storage_mode as TaskStorageMode);
        
        const modeDescriptions: Record<TaskStorageMode, string> = {
          project: 'Project-local (.aura/tasks/) - version controllable',
          claude: 'Claude Code (~/.claude/tasks/) - cross-project',
          both: 'Both locations - full compatibility'
        };
        
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              success: true,
              message: `📁 Storage mode set to: ${params.storage_mode}`,
              description: modeDescriptions[params.storage_mode],
              hint: params.storage_mode === 'project' ? 
                'Tasks will be stored in .aura/tasks/ (add to .gitignore if needed)' :
                params.storage_mode === 'claude' ?
                'Tasks will be shared across all Claude Code sessions' :
                'Tasks will be available in both project and Claude Code'
            }, null, 2)
          }]
        };
      }
      
      case 'get_or_create': {
        const taskList = await taskManager.getOrCreateProjectTaskList(params.title);
        const health = taskManager.calculateTaskHealth(taskList);
        
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              success: true,
              message: "📋 Project task list ready",
              task_list: {
                id: taskList.id,
                name: taskList.name,
                description: taskList.description,
                project: taskList.projectPath,
                task_count: taskList.tasks.length,
                health_score: health.healthScore
              },
              storage: {
                mode: taskManager.getStorageMode(),
                location: '.aura/tasks/'
              },
              hint: "Use action 'create_task' to add tasks to this list"
            }, null, 2)
          }]
        };
      }
      
      default:
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              success: false,
              error: `Unknown action: ${params.action}`
            })
          }]
        };
    }
  } catch (error: any) {
    return {
      content: [{
        type: "text",
        text: JSON.stringify({
          success: false,
          error: error.message || "Unknown error"
        })
      }]
    };
  }
}
