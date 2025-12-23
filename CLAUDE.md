# TeamDynamix Projects & Issues API MCP Server - Claude Reference

## Quick Reference

**Environments:**
- Production: `solutions.teamdynamix.com/TDWebApi`
- Test: `part01-demo.teamdynamixtest.com/TDWebApi`
- Canary: `eng.teamdynamixcanary.com/TDWebApi`
- Dev: `localhost/TDDev/TDWebApi`

**Credentials:** `~/.config/tdx-mcp/{env}-credentials.json` (DPAPI-encrypted)

---

## Setup Workflow

**CRITICAL: Use the same credentials as tdx-tickets-mcp. Projects and tickets share the same authentication.**

When user asks to setup/configure:

1. Run `npm run setup-with-claude` in a separate terminal
2. Use existing credentials from `~/.config/tdx-mcp/prod-credentials.json`
3. Ensure `TDX_PROJECT_APP_IDS` is configured (can be same as ticket app IDs)
4. Install to project directory via `.mcp.json`

---

## Key Behaviors

**Projects:**
- `tdx_get_project`: Returns full project details
- `tdx_update_project`: Updates project fields
- `tdx_search_projects`: Search with filters (manager, status, dates)
- `tdx_list_projects`: Returns projects user is on

**Issues:**
- Issues belong to projects - always need `projectId` and `issueId`
- `tdx_get_issue`: Returns full issue details
- `tdx_update_issue`: Updates issue fields
- `tdx_search_issues`: Search issues (optionally filter by project)

**Feed Entries:**
- Projects and issues both support feed entries (comments/updates)
- Use `isPrivate` flag to control visibility
- Can notify specific users via `notify` array

**Auth:** JWT tokens cached 23hr, auto-refresh on 401

**Retry:** 408/429/500/502/503/504 retry 3x with exponential backoff

---

## Architecture

- `index.ts`: MCP server, credential loading, graceful startup
- `client.ts`: TDXClient, axios, retry logic
- `auth.ts`: JWT auth, token cache, thread-safe refresh
- `tools.ts`: MCP tool schemas
- `handlers.ts`: Tool implementations
- `types.ts`: TypeScript interfaces
- `utils.ts`: Password decoding (DPAPI), validation

---

## Security

- **DPAPI required**: Passwords must be `dpapi:AQAAANCMnd8...`
- **User-scoped**: Tied to Windows user account
- Setup tool handles encryption via PowerShell

---

## Testing

```bash
npm run test:prod    # Production
npm run test:test    # Test
npm run test:canary  # Canary
npm run test:api     # Development
```
