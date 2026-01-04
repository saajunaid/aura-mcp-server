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