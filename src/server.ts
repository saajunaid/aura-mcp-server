import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

import { initializeTool } from './tools/initialize.js';
import { saveTool } from './tools/save.js';
import { loadTool } from './tools/load.js';
import { intelligenceTool } from './tools/intelligence.js';
import { diagnoseTool } from './tools/diagnose.js';
import { rollbackTool } from './tools/rollback.js';
import { tasksTool } from './tools/tasks.js';
import { Logger } from './utils/logger.js';

const logger = new Logger();

export class AuraServer {
  private server: Server;
  
  constructor() {
    this.server = new Server(
      {
        name: "aura-mcp-server",
        version: "1.0.0",
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );
    
    this.setupHandlers();
    this.setupErrorHandling();
  }
  
  private setupHandlers(): void {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        {
          name: "aura_initialize",
          description: "Initialize AURA for a project (auto-detects patterns)",
          inputSchema: {
            type: "object",
            properties: {
              project_goal: {
                type: "string",
                description: "Optional: Describe the project goal in 1-2 sentences"
              },
              force: {
                type: "boolean",
                description: "Force re-initialization even if already initialized"
              }
            }
          }
        },
        {
          name: "aura_save",
          description: "Save current session state with automatic backup",
          inputSchema: {
            type: "object",
            properties: {
              message: {
                type: "string",
                description: "Optional: Note about what was accomplished"
              }
            }
          }
        },
        {
          name: "aura_load",
          description: "Load project context (happens automatically on startup)",
          inputSchema: {
            type: "object",
            properties: {}
          }
        },
        {
          name: "aura_intelligence",
          description: "Get smart suggestions (model recommendations, health, next actions)",
          inputSchema: {
            type: "object",
            properties: {}
          }
        },
        {
          name: "aura_diagnose",
          description: "Deep health analysis with actionable recommendations",
          inputSchema: {
            type: "object",
            properties: {}
          }
        },
        {
          name: "aura_rollback",
          description: "List or restore from automatic backups",
          inputSchema: {
            type: "object",
            properties: {
              backup_id: {
                type: "string",
                description: "Optional: Specific backup ID to restore. Omit to list available backups."
              }
            }
          }
        },
        {
          name: "aura_tasks",
          description: "Standalone task management for any MCP-compatible IDE (VS Code, Cursor, Windsurf, JetBrains, Claude Code). Tasks are stored in .aura/tasks/ (project-local) by default, with optional sync to Claude Code ~/.claude/tasks. Supports dependencies, health scoring, and intelligent recommendations.",
          inputSchema: {
            type: "object",
            properties: {
              action: {
                type: "string",
                enum: [
                  "list_task_lists",
                  "get_task_list",
                  "create_task_list",
                  "create_task",
                  "update_status",
                  "analyze",
                  "health",
                  "sync_from_aura",
                  "sync_todos",
                  "sync_to_claude",
                  "import_from_claude",
                  "set_storage_mode",
                  "link_project",
                  "get_or_create"
                ],
                description: "The action to perform: list_task_lists, get_task_list, create_task_list, create_task, update_status, analyze, health, sync_from_aura, sync_todos (sync current todos), sync_to_claude (export to Claude Code), import_from_claude, set_storage_mode, link_project, get_or_create"
              },
              task_list_id: {
                type: "string",
                description: "Task list ID. Uses AURA_TASK_LIST_ID or CLAUDE_CODE_TASK_LIST_ID env var if not provided."
              },
              task_id: {
                type: "string",
                description: "Task ID for update_status action"
              },
              title: {
                type: "string",
                description: "Title for new task or task list"
              },
              description: {
                type: "string",
                description: "Description for task or task list"
              },
              priority: {
                type: "string",
                enum: ["low", "medium", "high", "critical"],
                description: "Task priority level"
              },
              status: {
                type: "string",
                enum: ["pending", "in_progress", "blocked", "completed", "cancelled"],
                description: "Task status for update_status action"
              },
              dependencies: {
                type: "array",
                items: { type: "string" },
                description: "Task IDs this task depends on"
              },
              tags: {
                type: "array",
                items: { type: "string" },
                description: "Tags for the task"
              },
              storage_mode: {
                type: "string",
                enum: ["project", "claude", "both"],
                description: "Storage mode: 'project' (.aura/tasks/), 'claude' (~/.claude/tasks/), 'both'"
              },
              todos: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    title: { type: "string" },
                    status: { type: "string" }
                  },
                  required: ["title"]
                },
                description: "Array of todos to sync (for sync_todos action)"
              }
            },
            required: ["action"]
          }
        }
      ]
    }));
    
    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      try {
        logger.info(`Tool called: ${request.params.name}`);
        
        switch (request.params.name) {
          case "aura_initialize":
            return await initializeTool(request.params.arguments);
          
          case "aura_save":
            return await saveTool(request.params.arguments);
          
          case "aura_load":
            return await loadTool();
          
          case "aura_intelligence":
            return await intelligenceTool();
          
          case "aura_diagnose":
            return await diagnoseTool();
          
          case "aura_rollback":
            return await rollbackTool(request.params.arguments);
          
          case "aura_tasks":
            return await tasksTool(request.params.arguments);
          
          default:
            throw new Error(`Unknown tool: ${request.params.name}`);
        }
      } catch (error: any) {
        logger.error(`Tool execution failed: ${request.params.name}`, error);
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              success: false,
              error: error.message || "Unknown error occurred"
            })
          }],
          isError: true,
        };
      }
    });
  }
  
  private setupErrorHandling(): void {
    this.server.onerror = (error) => {
      logger.error("Server error:", error);
    };
    
    process.on('SIGINT', async () => {
      logger.info('Shutting down gracefully...');
      await this.server.close();
      process.exit(0);
    });
  }
  
  async start(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    logger.info("AURA MCP Server started");
  }
}