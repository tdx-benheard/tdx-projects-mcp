# TeamDynamix Projects & Issues MCP Server

MCP server for interacting with TeamDynamix Projects and Issues via the TDWebAPI.

## Features

- **Project Management**: Get, update, search, and list projects
- **Issue Tracking**: Get, update, search issues within projects
- **Feed Entries**: View and add comments to projects and issues
- **Resource Management**: View project team members
- **Metadata**: Access issue categories, priorities, and statuses
- **Multi-environment**: Support for prod/test/canary/dev environments
- **Secure Credentials**: DPAPI-encrypted password storage (Windows)
- **Optimized Responses**: Search operations return minimal fields (91.5% size reduction) for better performance

## Response Size Optimization

Search operations (`tdx_search_projects`, `tdx_search_issues`) return **minimal fields** to maximize the number of results that fit within token limits:

- **Projects**: 7 fields (~109 bytes per project)
  - ID, Name, StatusName, PercentComplete, IsActive, ManagerFullName, ModifiedDate
- **Issues**: 13 fields (~200 bytes per issue)
  - ID, ProjectID, Title, StatusID, StatusName, PriorityID, PriorityName, CategoryID, CategoryName, ResponsibleUID, ResponsibleFullName, CreatedDate, ModifiedDate

Get operations (`tdx_get_project`, `tdx_get_issue`) return **full details** with all fields.

**Workflow:** Search (minimal) → Find what you need → Get (full details)

## Installation

### Quick Setup

```bash
npm run setup-with-claude
```

Follow the prompts to configure credentials for your environments.

### Manual Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Create credentials file at `~/.config/tdx-mcp/prod-credentials.json`:
   ```json
   {
     "TDX_BASE_URL": "https://solutions.teamdynamix.com/TDWebApi",
     "TDX_USERNAME": "your-username",
     "TDX_PASSWORD": "dpapi:AQAAANCMnd8...",
     "TDX_PROJECT_APP_IDS": "123,456"
   }
   ```

3. Build the project:
   ```bash
   npm run build
   ```

## Configuration

### MCP Configuration

Add to your Claude Code `.mcp.json`:

```json
{
  "mcpServers": {
    "tdx-projects-mcp": {
      "type": "stdio",
      "command": "node",
      "args": ["/absolute/path/to/tdx-projects-mcp/dist/index.js"],
      "env": {
        "TDX_PROD_CREDENTIALS_FILE": "~/.config/tdx-mcp/prod-credentials.json",
        "TDX_DEFAULT_ENVIRONMENT": "prod"
      }
    }
  }
}
```

### Environment Variables

- `TDX_PROD_CREDENTIALS_FILE`: Path to production credentials
- `TDX_TEST_CREDENTIALS_FILE`: Path to test credentials
- `TDX_CANARY_CREDENTIALS_FILE`: Path to canary credentials
- `TDX_DEV_CREDENTIALS_FILE`: Path to development credentials
- `TDX_DEFAULT_ENVIRONMENT`: Default environment to use (default: "prod")

## Available Tools

### Projects

- `tdx_get_project`: Get project by ID (returns **full details**)
- `tdx_update_project`: Update project details
- `tdx_search_projects`: Search for projects (returns **minimal fields** - use for browsing)
- `tdx_list_projects`: Get projects you're on (returns **full details**)
- `tdx_get_project_resources`: Get project team members
- `tdx_get_project_feed`: Get project comments/updates
- `tdx_add_project_feed`: Add comment to project

### Issues

- `tdx_get_issue`: Get issue by ID (returns **full details**)
- `tdx_update_issue`: Update issue details
- `tdx_search_issues`: Search for issues (returns **minimal fields** - use for browsing)
- `tdx_get_issue_feed`: Get issue comments/updates
- `tdx_add_issue_feed`: Add comment to issue
- `tdx_get_issue_categories`: Get issue categories for project
- `tdx_get_issue_priorities`: Get issue priorities
- `tdx_get_issue_statuses`: Get issue statuses

## Usage Examples

### Find and Get Project Details (Recommended Workflow)

**Step 1: Search** - Returns minimal fields to browse many results
```
Search for projects with "UX Updates" in the name
```
Response includes: ID, Name, StatusName, PercentComplete, IsActive, ManagerFullName, ModifiedDate

**Step 2: Get Details** - Returns full project information
```
Get project 441886 details
```
Response includes all 70+ fields with complete information

### Search with Filters

```
Search for active projects managed by John Smith modified in the last week
```

```
Search for issues in project 12345 with priority "High"
```

### Work with Issues

```
Search for open issues assigned to me in project 12345
```

Then get full details:
```
Get issue 789 from project 12345
```

### Add Comment

```
Add comment to issue 789 in project 12345: "Working on this now"
```

### Direct Access (When You Know the ID)

```
Get project 12345 details
```

```
Get issue 456 from project 12345
```

## Development

### Build
```bash
npm run build
```

### Watch mode
```bash
npm run dev
```

### Testing
```bash
npm run test:prod    # Test production environment
npm run test:test    # Test test environment
npm run test:canary  # Test canary environment
npm run test:api     # Test development environment
```

## Security

- Passwords are encrypted using Windows DPAPI (Data Protection API)
- Credentials are user-scoped and tied to your Windows account
- Use `npm run setup` to generate encrypted credentials
- Never commit plain-text passwords to version control

## Related Projects

- [tdx-tickets-mcp](https://github.com/YourOrg/tdx-tickets-mcp) - Tickets, Reports, Users, and Groups

## License

MIT
