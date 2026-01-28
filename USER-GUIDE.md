# AURA MCP Server - User Guide

A complete guide to setting up and using AURA (AI Universal Runtime Architecture) for context management and task tracking in your IDE.

---

## Table of Contents

1. [What is AURA?](#what-is-aura)
2. [Quick Start (5 minutes)](#quick-start)
3. [IDE Setup](#ide-setup)
   - [VS Code with Copilot](#vs-code-with-copilot)
   - [Cursor](#cursor)
   - [Windsurf](#windsurf)
   - [JetBrains IDEs](#jetbrains-ides)
   - [Claude Code](#claude-code)
4. [Using AURA Tools](#using-aura-tools)
5. [AURA Tasks](#aura-tasks)
6. [Best Practices](#best-practices)
7. [Troubleshooting](#troubleshooting)

---

## What is AURA?

AURA is an MCP (Model Context Protocol) server that helps AI assistants:

- **Remember context** across sessions (no more re-explaining your project)
- **Track tasks** with dependencies and health scoring
- **Suggest next steps** intelligently based on your project state
- **Recommend models** for different types of work

### The Problem AURA Solves

Without AURA:
```
You: "Continue working on the auth feature"
AI: "I don't have context about what auth feature or what we did before..."
You: *Re-explains everything for the 10th time*
```

With AURA:
```
You: "Continue working on the auth feature"  
AI: *Calls aura_load* "Got it! Last session we implemented JWT tokens. 
     Next step is adding refresh token rotation. Want me to continue?"
```

---

## Quick Start

### 1. Install (No Download Required)

AURA runs directly via `npx` - no global installation needed!

### 2. Configure Your IDE

Add this to your MCP configuration (see IDE-specific instructions below):

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

### 3. Start Using

In your AI chat, the assistant will automatically have access to AURA tools. Just start working - AURA handles the rest!

---

## IDE Setup

### VS Code with Copilot

**Requirements:** VS Code 1.103+ with GitHub Copilot extension

1. Create `.vscode/mcp.json` in your project root:

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

2. Reload VS Code (`Ctrl+Shift+P` → "Reload Window")

3. Open Copilot Chat and verify AURA is available:
   - Type: "What tools do you have access to?"
   - You should see `aura_initialize`, `aura_save`, `aura_tasks`, etc.

---

### Cursor

1. Open Settings (`Ctrl+,`)
2. Search for "MCP" 
3. Add to your MCP configuration:

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

4. Restart Cursor

---

### Windsurf

1. Open Settings → MCP Servers
2. Add new server with configuration:

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

3. Restart Windsurf

---

### JetBrains IDEs

**Requirements:** JetBrains IDE 2025.1+ with AI Assistant plugin

1. Go to `Settings` → `Tools` → `AI Assistant` → `Model Context Protocol (MCP)`
2. Click `+` to add a new server
3. Configure:
   - **Name:** AURA
   - **Command:** `npx`
   - **Arguments:** `-y aura-mcp-server`
4. Apply and restart

---

### Claude Code

Claude Code has native task support, but AURA extends it with:
- Project-local storage (`.aura/tasks/`)
- Health scoring and analytics
- Cross-IDE compatibility

Add to your Claude Code MCP config:

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

---

## Using AURA Tools

### Overview of Available Tools

| Tool | When to Use | Example |
|------|-------------|---------|
| `aura_initialize` | First time setting up a project | "Initialize AURA for this project" |
| `aura_save` | Before ending a session | "Save my progress" |
| `aura_load` | Starting a new session | Automatic, or "Load project context" |
| `aura_intelligence` | Need suggestions | "What should I work on next?" |
| `aura_diagnose` | Check project health | "Diagnose this project" |
| `aura_rollback` | Restore previous state | "Show me backups" |
| `aura_tasks` | Manage tasks | "Create a task for auth feature" |

---

### Tool Details

#### 🚀 aura_initialize

**When:** First time using AURA in a project

**What it does:**
- Scans your project structure
- Detects frameworks, languages, patterns
- Creates `.aura/` directory with state files

**How to use:**
```
You: "Initialize AURA for this project"
AI: *Calls aura_initialize*
    "AURA initialized! Detected: TypeScript, React, Node.js backend..."
```

**Optional parameters:**
- `project_goal`: Describe your project in 1-2 sentences
- `force`: Re-initialize even if already set up

---

#### 💾 aura_save

**When:** Before ending your coding session

**What it does:**
- Saves current context, decisions, and progress
- Creates automatic backup
- Updates the human-readable memory file

**How to use:**
```
You: "Save my session - I implemented user authentication today"
AI: *Calls aura_save with message*
    "Session saved! Backup created. You can continue tomorrow."
```

**Optional parameters:**
- `message`: Note about what you accomplished

---

#### 📂 aura_load

**When:** Starting a new session (often called automatically)

**What it does:**
- Restores project context
- Loads previous decisions and patterns
- Shows what was worked on last

**How to use:**
```
You: "Load the project context"
AI: *Calls aura_load*
    "Welcome back! Last session you worked on JWT auth. 
     Next steps: Add refresh token rotation, Write tests..."
```

---

#### 🧠 aura_intelligence

**When:** You need guidance on what to do next

**What it does:**
- Analyzes project state
- Suggests next actions
- Recommends optimal AI models for tasks

**How to use:**
```
You: "What should I focus on?"
AI: *Calls aura_intelligence*
    "Based on your project:
     1. Complete the user registration endpoint
     2. Add input validation
     3. Write unit tests
     
     Recommended model: Claude for complex logic, GPT-4 for tests"
```

---

#### 🏥 aura_diagnose

**When:** You want a health check of your project

**What it does:**
- Calculates health score (0-10)
- Identifies issues and blockers
- Provides actionable recommendations

**How to use:**
```
You: "Diagnose the project health"
AI: *Calls aura_diagnose*
    "Project Health: 7.5/10 💛
     Issues:
     - 3 stale tasks not updated in 7+ days
     - Missing test coverage for auth module
     Recommendations:
     - Review and update stale tasks
     - Add tests before adding new features"
```

---

#### ⏪ aura_rollback

**When:** You need to restore a previous state

**What it does:**
- Lists available backups
- Restores selected backup

**How to use:**
```
You: "Show me available backups"
AI: *Calls aura_rollback*
    "Available backups:
     1. 2026-01-28 14:30 - Added auth feature
     2. 2026-01-27 16:45 - Initial setup
     
     Which would you like to restore?"
```

---

## AURA Tasks

AURA Tasks is a standalone task management system that works in **any MCP-compatible IDE**.

### Why Use AURA Tasks?

- **Persistent:** Tasks survive across sessions (unlike chat todos)
- **Dependencies:** Tasks can block/unblock each other
- **Health Scoring:** Track project progress with metrics
- **Cross-IDE:** Works the same in VS Code, Cursor, JetBrains, etc.

### Task Actions

| Action | Description |
|--------|-------------|
| `get_or_create` | Get or create the project's task list |
| `create_task` | Add a new task |
| `update_status` | Change task status |
| `analyze` | Get intelligent recommendations |
| `health` | View task health metrics |
| `sync_todos` | Convert session todos to tasks |

### Task Workflow Example

```
You: "Create a task list for this project"
AI: *Calls aura_tasks action:get_or_create*
    "📋 Task list created: my-project Tasks"

You: "Add a task: Implement user authentication, high priority"
AI: *Calls aura_tasks action:create_task*
    "✅ Task created: Implement user authentication (high priority)"

You: "Add a task: Write auth tests, depends on the auth task"
AI: *Calls aura_tasks action:create_task with dependency*
    "✅ Task created: Write auth tests (blocked by: Implement user auth)"

You: "Mark the auth task as in progress"
AI: *Calls aura_tasks action:update_status*
    "🔄 Task updated: Implement user authentication → in_progress"

You: "Complete the auth task"
AI: *Calls aura_tasks action:update_status status:completed*
    "✅ Task completed! Write auth tests is now unblocked."

You: "Show task health"
AI: *Calls aura_tasks action:health*
    "💚 Health: 8.5/10
     Total: 2 | Completed: 1 | In Progress: 0 | Blocked: 0"
```

### Syncing Session Todos to Tasks

When you have todos in your current chat session and want to make them permanent:

```
You: "Sync my current todos to AURA tasks"
AI: *Calls aura_tasks action:sync_todos*
    "📝 Synced 3 todos to AURA Tasks. They'll persist across sessions."
```

### Task Storage

Tasks are stored in `.aura/tasks/` by default (project-local, can be git-tracked).

For Claude Code users, you can also sync to `~/.claude/tasks/`:
```
You: "Sync tasks to Claude Code storage"
AI: *Calls aura_tasks action:sync_to_claude*
```

---

## Best Practices

### 1. Initialize Once, Use Forever

Run `aura_initialize` once when you first start using AURA on a project. After that, context is automatically preserved.

### 2. Save Before Ending Sessions

Always ask the AI to save before you close your IDE:
```
"Save my progress - worked on user dashboard today"
```

### 3. Use Tasks for Complex Projects

For projects with multiple features or phases, use AURA Tasks:
```
"Create tasks for the MVP: auth, dashboard, settings, and deployment"
```

### 4. Check Health Regularly

Run diagnostics weekly to catch issues early:
```
"Diagnose the project health"
```

### 5. Let AI Call Tools Automatically

Most of the time, you don't need to explicitly ask for tools. Just describe what you want:

| Instead of... | Say... |
|---------------|--------|
| "Call aura_load" | "What did we work on last time?" |
| "Call aura_intelligence" | "What should I do next?" |
| "Call aura_tasks create_task" | "Add a task for the payment feature" |

---

## Troubleshooting

### "AURA tools not available"

1. Check your MCP configuration file exists
2. Verify the JSON syntax is correct
3. Reload/restart your IDE
4. Check if `npx aura-mcp-server` runs in terminal

### "Context not loading"

1. Check if `.aura/` directory exists in your project
2. Try: "Force reload AURA context"
3. Check `.aura/state.json` for corruption

### "Tasks not persisting"

1. Verify `.aura/tasks/` directory exists
2. Check file permissions
3. Try: "Get or create project task list"

### Need Help?

- **GitHub Issues:** [aura-mcp-server/issues](https://github.com/saajunaid/aura-mcp-server/issues)
- **Discussions:** [aura-mcp-server/discussions](https://github.com/saajunaid/aura-mcp-server/discussions)

---

## What's Stored in .aura/

```
.aura/
├── state.json       # Project state (JSON)
├── memory.md        # Human-readable context summary
├── backups/         # Automatic backups
│   ├── backup-2026-01-28T14-30-00.json
│   └── ...
└── tasks/           # Task lists
    └── tl-xxx.json  # Task list files
```

**Tip:** Add `.aura/` to `.gitignore` if you don't want to share context, or commit it to share project state with your team!

---

## Summary

| Goal | Command |
|------|---------|
| First-time setup | "Initialize AURA for this project" |
| Resume work | "What were we working on?" |
| Save progress | "Save my session" |
| Get suggestions | "What should I do next?" |
| Check health | "Diagnose the project" |
| Manage tasks | "Show my tasks" / "Create a task for X" |

---

**Enjoy using AURA! 🚀**

*Star the repo if it helps: [github.com/saajunaid/aura-mcp-server](https://github.com/saajunaid/aura-mcp-server)*
