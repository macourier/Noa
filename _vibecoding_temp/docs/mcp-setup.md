# MCP Setup Guide

## What is MCP?

Model Context Protocol (MCP) allows AI coding agents (like Cline, Cursor, Claude Desktop) to interact with external tools and data sources.

## Configuration Location

MCP settings are configured in your AI tool's settings file:

- **Cline**: `~/.config/Code/User/globalStorage/saoudrizwan.claude-dev/settings/cline_mcp_settings.json`
- **Claude Desktop**: `~/.claude/claude_desktop_config.json`
- **Cursor**: Settings → MCP

## Server Configurations

### Postgres (Supabase)

```json
{
  "mcpServers": {
    "postgres": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-postgres", "postgresql://USER:PASS@HOST:5432/DATABASE"]
    }
  }
}
```

**Capabilities**: Read-only SQL queries, schema exploration.

### GitHub

```json
{
  "mcpServers": {
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "ghp_YOUR_TOKEN"
      }
    }
  }
}
```

**Required scopes**: `repo`, `read:org`, `workflow`

**Capabilities**: PR management, issue tracking, file operations, code search.

### Brave Search

```json
{
  "mcpServers": {
    "brave-search": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-brave-search"],
      "env": {
        "BRAVE_API_KEY": "BSA_YOUR_KEY"
      }
    }
  }
}
```

**Get API key**: https://brave.com/search/api/

**Capabilities**: Web search, local search, technical documentation lookup.

## Security Notes

- Never commit API keys to git
- Use environment variables for all secrets
- Rotate tokens regularly
- Use minimal required scopes for GitHub tokens
