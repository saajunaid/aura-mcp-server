# AURA MCP Server

_AI Universal Runtime Architecure(AURA)_

AI context management with intelligent model recommendations for MCP-compatible IDEs.

## Features

- 🔄 **Automatic Context Preservation** - Never lose project context across sessions
- 🧠 **Smart Model Recommendations** - AI suggests optimal models for each task
- 📊 **Health Scoring** - Track code quality with actionable metrics
- 💾 **Automatic Backups** - Session state backed up automatically
- 🔍 **Pattern Detection** - Learns your tech stack and coding patterns
- ⚡ **Zero Configuration** - Works out of the box

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

## How It Works

AURA creates a `.aura/` directory in your project:
```
.aura/
├── state.json       # Project state and session data
├── memory.md        # Human-readable context
└── backups/         # Automatic backup snapshots
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

- **Issues:** [GitHub Issues](https://github.com/saajunaid/aura-mcp-server/issues)
- **Discussions:** [GitHub Discussions](https://github.com/saajunaid/aura-mcp-server/discussions)

## License

MIT License - see [LICENSE](LICENSE) file for details

## Author

Created by [@saajunaid](https://github.com/saajunaid)

---

**Star ⭐ this repo if AURA helps you build better!**
```