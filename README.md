# AURA MCP Server

_AI Universal Runtime Architecture (AURA)_

AI context management with intelligent model recommendations for MCP-compatible IDEs. **Includes standalone Task management for any IDE!**

[![npm version](https://badge.fury.io/js/aura-mcp-server.svg)](https://www.npmjs.com/package/aura-mcp-server)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Why AURA?

> **"AI assistants forget everything between sessions. AURA remembers."**

| Problem | AURA Solution |
|---------|---------------|
| AI forgets context when you close the chat | Automatic context preservation |
| Re-explaining your project every session | One-time setup, forever memory |
| Todos disappear when session ends | Persistent tasks across sessions |
| Locked into one IDE for task tracking | Works in VS Code, Cursor, Windsurf, JetBrains |

## How AURA Compares

| Feature | **AURA** | **Claude Code Tasks** | **Mem0** |
|---------|----------|----------------------|----------|
| **IDE Support** | ✅ All MCP IDEs | ❌ Claude Code only | ❌ N/A (SDK) |
| **Task Dependencies** | ✅ | ✅ | ❌ |
| **Health Scoring** | ✅ 0-10 scale | ❌ | ❌ |
| **Project Context** | ✅ | ❌ | ✅ |
| **Version Control** | ✅ `.aura/` folder | ❌ | ❌ |
| **Zero Infrastructure** | ✅ Just `npx` | ✅ | ❌ Needs LLM+DB |
| **Claude Code Sync** | ✅ Optional | ✅ Native | ❌ |
| **Open Source** | ✅ MIT | ❌ | ✅ Apache |
| **Cost** | Free | Included | $$ (LLM API) |

## Features

- 🔄 **Automatic Context Preservation** - Never lose project context across sessions
- 🧠 **Smart Model Recommendations** - AI suggests optimal models for each task
- 📊 **Health Scoring** - Track code quality with actionable metrics
- 💾 **Automatic Backups** - Session state backed up automatically
- 🔍 **Pattern Detection** - Learns your tech stack and coding patterns
- ⚡ **Zero Configuration** - Works out of the box
- 📋 **AURA Tasks** - Standalone task management for any MCP-compatible IDE

## Installation

### VS Code with Copilot

Create `.vscode/mcp.json` in your project:
```json
{
  "mcpServers": {
    "aura": {
      "command": "npx",
      "args": ["-y", "aura-mcp-server"]
    }
  }
}
```

### Cursor

Add to your MCP configuration:
```json
{
  "mcpServers": {
    "aura": {
      "command": "npx",
      "args": ["-y", "aura-mcp-server"]
    }
  }
}
```

### Windsurf

Same configuration as above.

### JetBrains IDEs

1. Go to Settings → Tools → AI Assistant → Model Context Protocol (MCP)
2. Click "+" to add server
3. Add the same configuration

## Available Tools

Once configured, AURA provides these tools to your AI assistant:

| Tool | Description |
|------|-------------|
| `aura_initialize` | Set up AURA for your project (auto-detects patterns) |
| `aura_save` | Save current session state with automatic backup |
| `aura_load` | Restore project context (happens automatically on startup) |
| `aura_intelligence` | Get smart suggestions for next steps and model recommendations |
| `aura_diagnose` | Deep health analysis with actionable fixes |
| `aura_rollback` | Restore from automatic backups |
| `aura_tasks` | Standalone task management for any IDE |

## AURA Tasks

AURA Tasks provides **standalone task management** for any MCP-compatible IDE - not just Claude Code! Inspired by [Claude Code's Tasks system](https://x.com/trq212/status/2014480496013803643), AURA brings the same power to:

- ✅ **VS Code with Copilot** 
- ✅ **Cursor**
- ✅ **Windsurf**
- ✅ **JetBrains IDEs**
- ✅ **Claude Code** (with optional sync)

### Storage Options

| Mode | Location | Use Case |
|------|----------|----------|
| `project` (default) | `.aura/tasks/` | Version-controllable, project-specific |
| `claude` | `~/.claude/tasks/` | Cross-project, Claude Code native |
| `both` | Both locations | Full compatibility |

### Task Features

| Feature | Description |
|---------|-------------|
| **Dependencies** | Tasks can depend on other tasks |
| **Status Tracking** | pending → in_progress → blocked → completed |
| **Priority Levels** | low, medium, high, critical |
| **Health Scoring** | 0-10 health score for task lists |
| **Blocker Analysis** | Identify what's blocking progress |
| **Todo Sync** | Sync current session todos to persistent tasks |
| **Claude Code Sync** | Optional export/import with Claude Code storage |

### Task Actions

```
aura_tasks action:get_or_create       # Get or create project task list
aura_tasks action:list_task_lists     # List all task lists
aura_tasks action:create_task_list    # Create a new task list
aura_tasks action:create_task         # Add a task with dependencies
aura_tasks action:update_status       # Mark tasks complete/blocked
aura_tasks action:analyze             # Get smart recommendations
aura_tasks action:health              # View task health metrics
aura_tasks action:sync_todos          # Sync current session todos to tasks
aura_tasks action:sync_from_aura      # Import AURA next_steps as tasks
aura_tasks action:sync_to_claude      # Export to Claude Code storage
aura_tasks action:import_from_claude  # Import from Claude Code storage
aura_tasks action:set_storage_mode    # Change storage mode
```

### Quick Start: Task Workflow

```bash
# 1. Get or create a project task list
aura_tasks action:get_or_create

# 2. Create tasks
aura_tasks action:create_task title:"Implement user auth" priority:high
aura_tasks action:create_task title:"Add tests" dependencies:["task-xxx"]

# 3. Work on tasks
aura_tasks action:update_status task_id:task-xxx status:in_progress
aura_tasks action:update_status task_id:task-xxx status:completed

# 4. Sync session todos to persistent tasks (when needed)
aura_tasks action:sync_todos todos:[{title:"Fix bug", status:"in-progress"}]

# 5. Optionally sync to Claude Code
aura_tasks action:sync_to_claude task_list_id:tl-xxx
```

### Claude Code Compatibility

AURA Tasks works seamlessly with Claude Code:

```bash
# Export a task list to Claude Code
aura_tasks action:sync_to_claude task_list_id:tl-xxx

# Import a task list from Claude Code
aura_tasks action:import_from_claude task_list_id:tl-xxx

# Start Claude Code with a specific task list
CLAUDE_CODE_TASK_LIST_ID=tl-xxx claude
```

## How It Works

AURA creates a `.aura/` directory in your project:
```
.aura/
├── state.json       # Project state and session data
├── memory.md        # Human-readable context
├── backups/         # Automatic backup snapshots
└── tasks/           # Task lists (AURA Tasks)
```

These files preserve your project context, allowing seamless continuation across:
- Chat sessions
- Model switches (GPT → Claude → back)
- Computer restarts
- Team collaboration

## Example Workflow

1. **Start working** - AURA observes your project automatically
2. **Get suggestions** - AI calls `aura_intelligence` for smart recommendations
3. **Save progress** - Run `aura_save` before ending your session
4. **Resume later** - AURA automatically loads context when you return
5. **Track health** - Use `aura_diagnose` to identify code quality issues

## Example: Task-Based Workflow

1. **Get/create task list** - `aura_tasks action:get_or_create` creates project task list
2. **Add tasks** - Create tasks with priorities and dependencies
3. **Sync session todos** - `aura_tasks action:sync_todos` saves todos persistently
4. **Work on tasks** - Update status as you progress
5. **Complete tasks** - Dependent tasks auto-unblock when blockers complete
6. **Optional: Share with Claude Code** - Sync to `~/.claude/tasks` for cross-IDE use

## Requirements

- Node.js 18 or higher
- MCP-compatible IDE (VS Code 1.103+, Cursor, Windsurf, JetBrains 2025.1+)

## Why AURA?

**Problem:** AI assistants lose context when you:
- Start a new chat
- Switch between models
- Close your IDE
- Take a break

**Solution:** AURA preserves context automatically, so your AI always knows:
- What you're building
- What you just accomplished
- What to do next
- Your coding standards

## Support

- **User Guide:** [USER-GUIDE.md](USER-GUIDE.md) - Complete setup and usage instructions
- **Issues:** [GitHub Issues](https://github.com/saajunaid/aura-mcp-server/issues)
- **Discussions:** [GitHub Discussions](https://github.com/saajunaid/aura-mcp-server/discussions)

## Contributing

Contributions welcome! Please read the [USER-GUIDE.md](USER-GUIDE.md) first.

## License

MIT License - see [LICENSE](LICENSE) file for details

## Author

Created by [@saajunaid](https://github.com/saajunaid)

---

**⭐ Star this repo if AURA helps you build better!**

**🐦 Share on X:** [Tweet about AURA](https://twitter.com/intent/tweet?text=Just%20discovered%20AURA%20MCP%20Server%20-%20finally%20my%20AI%20assistant%20remembers%20context%20across%20sessions!%20Works%20in%20VS%20Code%2C%20Cursor%2C%20Windsurf%2C%20JetBrains.%20%F0%9F%94%A5&url=https%3A%2F%2Fgithub.com%2Fsaajunaid%2Faura-mcp-server)
```