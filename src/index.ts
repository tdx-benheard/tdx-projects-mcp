import { readFileSync, existsSync } from 'fs';
import { homedir } from 'os';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { TDXClient } from './client.js';
import { tools } from './tools.js';
import { ToolHandlers } from './handlers.js';
import { decodePassword } from './utils.js';
import type { EnvironmentConfig } from './types.js';

// Expand ~ to home directory and normalize path separators for Windows
function expandHome(path: string): string {
  if (!path) return path;

  let expanded = path.startsWith('~') ? path.replace('~', homedir()) : path;

  if (process.platform === 'win32') {
    expanded = expanded.replace(/\//g, '\\');
  }

  return expanded;
}

// Load JSON credentials file
function loadCredentialsFile(filePath: string): Record<string, string> {
  try {
    const content = readFileSync(filePath, 'utf8');
    return JSON.parse(content);
  } catch (error) {
    console.error(`Failed to load credentials file: ${filePath}`);
    throw error;
  }
}

/**
 * Parse environment configuration from credentials.
 * Decodes passwords using the shared utility function.
 */
function parseEnvironmentConfig(credentials: Record<string, string>): EnvironmentConfig {
  const baseUrl = credentials.TDX_BASE_URL || '';
  const username = credentials.TDX_USERNAME || '';
  const password = credentials.TDX_PASSWORD || '';
  const appIdsStr = credentials.TDX_PROJECT_APP_IDS || credentials.TDX_TICKET_APP_IDS || '';

  if (!baseUrl || !username || !password || !appIdsStr) {
    throw new Error('Missing required configuration: TDX_BASE_URL, TDX_USERNAME, TDX_PASSWORD, TDX_PROJECT_APP_IDS');
  }

  const decodedPassword = decodePassword(password);

  const appIds = appIdsStr.split(',').map(id => id.trim()).filter(id => id.length > 0);
  if (appIds.length === 0) {
    throw new Error('TDX_PROJECT_APP_IDS must contain at least one valid application ID');
  }

  return { baseUrl, username, password: decodedPassword, appIds };
}

// Load environment configurations
const environments = new Map<string, EnvironmentConfig>();

// Try to load production credentials
const prodCredsFile = process.env.TDX_PROD_CREDENTIALS_FILE;
if (prodCredsFile) {
  const expandedPath = expandHome(prodCredsFile);
  if (existsSync(expandedPath)) {
    try {
      const prodCreds = loadCredentialsFile(expandedPath);
      environments.set('prod', parseEnvironmentConfig(prodCreds));
      console.error('✓ Loaded production environment configuration');
    } catch (error) {
      console.error('✗ Failed to load production credentials:', error instanceof Error ? error.message : error);
    }
  } else {
    console.error(`✗ Production credentials file not found: ${expandedPath}`);
  }
}

// Try to load test credentials
const testCredsFile = process.env.TDX_TEST_CREDENTIALS_FILE;
if (testCredsFile) {
  const expandedPath = expandHome(testCredsFile);
  if (existsSync(expandedPath)) {
    try {
      const testCreds = loadCredentialsFile(expandedPath);
      environments.set('test', parseEnvironmentConfig(testCreds));
      console.error('✓ Loaded test environment configuration');
    } catch (error) {
      console.error('✗ Failed to load test credentials:', error instanceof Error ? error.message : error);
    }
  } else {
    console.error(`✗ Test credentials file not found: ${expandedPath}`);
  }
}

// Try to load canary credentials
const canaryCredsFile = process.env.TDX_CANARY_CREDENTIALS_FILE;
if (canaryCredsFile) {
  const expandedPath = expandHome(canaryCredsFile);
  if (existsSync(expandedPath)) {
    try {
      const canaryCreds = loadCredentialsFile(expandedPath);
      environments.set('canary', parseEnvironmentConfig(canaryCreds));
      console.error('✓ Loaded canary environment configuration');
    } catch (error) {
      console.error('✗ Failed to load canary credentials:', error instanceof Error ? error.message : error);
    }
  } else {
    console.error(`✗ Canary credentials file not found: ${expandedPath}`);
  }
}

// Try to load development credentials
const devCredsFile = process.env.TDX_DEV_CREDENTIALS_FILE;
if (devCredsFile) {
  const expandedPath = expandHome(devCredsFile);
  if (existsSync(expandedPath)) {
    try {
      const devCreds = loadCredentialsFile(expandedPath);
      environments.set('dev', parseEnvironmentConfig(devCreds));
      console.error('✓ Loaded development environment configuration');
    } catch (error) {
      console.error('✗ Failed to load development credentials:', error instanceof Error ? error.message : error);
    }
  } else {
    console.error(`✗ Development credentials file not found: ${expandedPath}`);
  }
}

// Warn if no environments are configured, but don't exit
if (environments.size === 0) {
  console.error('WARNING: No environment configurations found!');
  console.error('The MCP server will start, but tools will fail until credentials are configured.');
  console.error('Set TDX_PROD_CREDENTIALS_FILE, TDX_TEST_CREDENTIALS_FILE, TDX_CANARY_CREDENTIALS_FILE, and/or TDX_DEV_CREDENTIALS_FILE environment variables');
}

// Get default environment from config (defaults to 'prod')
let defaultEnvironment = process.env.TDX_DEFAULT_ENVIRONMENT || 'prod';

// If the specified default environment is not available, use the first available one
if (!environments.has(defaultEnvironment)) {
  if (environments.size > 0) {
    const firstEnv = Array.from(environments.keys())[0];
    console.error(`WARNING: Default environment '${defaultEnvironment}' not found in configurations`);
    console.error(`Available environments: ${Array.from(environments.keys()).join(', ')}`);
    console.error(`Falling back to: ${firstEnv}`);
    defaultEnvironment = firstEnv;
  } else {
    console.error(`WARNING: Default environment '${defaultEnvironment}' not found and no environments configured`);
    console.error('Tools will fail until credentials are configured.');
  }
}

if (environments.size > 0) {
  console.error(`Default environment: ${defaultEnvironment}`);
  console.error(`Available environments: ${Array.from(environments.keys()).join(', ')}`);
}

// Initialize TDX clients for each environment
const tdxClients = new Map<string, TDXClient>();
for (const [env, config] of environments.entries()) {
  tdxClients.set(env, new TDXClient(config.baseUrl, config.username, config.password, config.appIds));
}

// Initialize tool handlers with client map and default environment
const handlers = new ToolHandlers(tdxClients, defaultEnvironment);

// Create MCP server
const server = new Server(
  {
    name: 'tdx-projects-mcp',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Handle tool listing
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return { tools };
});

// Handle tool execution
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      // Project tools
      case 'tdx_get_project':
        return await handlers.handleGetProject(args as any);
      case 'tdx_update_project':
        return await handlers.handleUpdateProject(args as any);
      case 'tdx_search_projects':
        return await handlers.handleSearchProjects(args as any);
      case 'tdx_list_projects':
        return await handlers.handleListProjects(args as any);
      case 'tdx_get_project_resources':
        return await handlers.handleGetProjectResources(args as any);
      case 'tdx_get_project_feed':
        return await handlers.handleGetProjectFeed(args as any);
      case 'tdx_add_project_feed':
        return await handlers.handleAddProjectFeed(args as any);

      // Issue tools
      case 'tdx_get_issue':
        return await handlers.handleGetIssue(args as any);
      case 'tdx_update_issue':
        return await handlers.handleUpdateIssue(args as any);
      case 'tdx_search_issues':
        return await handlers.handleSearchIssues(args as any);
      case 'tdx_get_issue_feed':
        return await handlers.handleGetIssueFeed(args as any);
      case 'tdx_add_issue_feed':
        return await handlers.handleAddIssueFeed(args as any);
      case 'tdx_get_issue_categories':
        return await handlers.handleGetIssueCategories(args as any);
      case 'tdx_get_issue_priorities':
        return await handlers.handleGetIssuePriorities(args as any);
      case 'tdx_get_issue_statuses':
        return await handlers.handleGetIssueStatuses(args as any);

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return {
      content: [
        {
          type: 'text',
          text: `Error: ${errorMessage}`,
        },
      ],
      isError: true,
    };
  }
});

// Start the server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
