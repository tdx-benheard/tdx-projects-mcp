import { Tool } from '@modelcontextprotocol/sdk/types.js';

// Common parameters for all tools
const environmentParam = {
  environment: {
    type: 'string' as const,
    description: 'Environment: prod/dev/canary/test',
    enum: ['prod', 'dev', 'canary', 'test'],
  },
};

const projectIdParam = {
  projectId: {
    type: 'number' as const,
    description: 'Project ID',
  },
};

const issueIdParam = {
  issueId: {
    type: 'number' as const,
    description: 'Issue ID',
  },
};

export const tools: Tool[] = [
  // ===== Project Tools =====
  {
    name: 'tdx_get_project',
    description: 'Get project by ID',
    inputSchema: {
      type: 'object',
      properties: {
        ...environmentParam,
        ...projectIdParam,
      },
      required: ['projectId'],
    },
  },
  {
    name: 'tdx_update_project',
    description: 'Update project',
    inputSchema: {
      type: 'object',
      properties: {
        ...environmentParam,
        ...projectIdParam,
        projectData: {
          type: 'object',
          description: 'Project data to update',
        },
      },
      required: ['projectId', 'projectData'],
    },
  },
  {
    name: 'tdx_search_projects',
    description: 'Search for projects',
    inputSchema: {
      type: 'object',
      properties: {
        ...environmentParam,
        searchText: {
          type: 'string',
          description: 'Search text',
        },
        maxResults: {
          type: 'number',
          description: 'Max results',
          default: 50,
        },
        statusIDs: {
          type: 'array',
          items: { type: 'number' },
          description: 'Status IDs',
        },
        managerUIDs: {
          type: 'array',
          items: { type: 'string' },
          description: 'Manager UIDs',
        },
      },
    },
  },
  {
    name: 'tdx_list_projects',
    description: 'Get projects the user is on',
    inputSchema: {
      type: 'object',
      properties: {
        ...environmentParam,
      },
    },
  },
  {
    name: 'tdx_get_project_resources',
    description: 'Get project team members',
    inputSchema: {
      type: 'object',
      properties: {
        ...environmentParam,
        ...projectIdParam,
      },
      required: ['projectId'],
    },
  },
  {
    name: 'tdx_get_project_feed',
    description: 'Get project feed entries',
    inputSchema: {
      type: 'object',
      properties: {
        ...environmentParam,
        ...projectIdParam,
      },
      required: ['projectId'],
    },
  },
  {
    name: 'tdx_add_project_feed',
    description: 'Add feed entry to project',
    inputSchema: {
      type: 'object',
      properties: {
        ...environmentParam,
        ...projectIdParam,
        comments: {
          type: 'string',
          description: 'Comment text',
        },
        isPrivate: {
          type: 'boolean',
          description: 'Private entry',
          default: false,
        },
        notify: {
          type: 'array',
          items: { type: 'string' },
          description: 'Email addresses to notify',
        },
      },
      required: ['projectId', 'comments'],
    },
  },

  // ===== Issue Tools =====
  {
    name: 'tdx_get_issue',
    description: 'Get issue by ID',
    inputSchema: {
      type: 'object',
      properties: {
        ...environmentParam,
        ...projectIdParam,
        ...issueIdParam,
      },
      required: ['projectId', 'issueId'],
    },
  },
  {
    name: 'tdx_update_issue',
    description: 'Update issue',
    inputSchema: {
      type: 'object',
      properties: {
        ...environmentParam,
        ...projectIdParam,
        ...issueIdParam,
        issueData: {
          type: 'object',
          description: 'Issue data to update',
        },
      },
      required: ['projectId', 'issueId', 'issueData'],
    },
  },
  {
    name: 'tdx_search_issues',
    description: 'Search for issues',
    inputSchema: {
      type: 'object',
      properties: {
        ...environmentParam,
        ...projectIdParam,
        searchText: {
          type: 'string',
          description: 'Search text',
        },
        maxResults: {
          type: 'number',
          description: 'Max results',
          default: 50,
        },
        statusIDs: {
          type: 'array',
          items: { type: 'number' },
          description: 'Status IDs',
        },
      },
    },
  },
  {
    name: 'tdx_get_issue_feed',
    description: 'Get issue feed entries',
    inputSchema: {
      type: 'object',
      properties: {
        ...environmentParam,
        ...projectIdParam,
        ...issueIdParam,
      },
      required: ['projectId', 'issueId'],
    },
  },
  {
    name: 'tdx_add_issue_feed',
    description: 'Add feed entry to issue',
    inputSchema: {
      type: 'object',
      properties: {
        ...environmentParam,
        ...projectIdParam,
        ...issueIdParam,
        comments: {
          type: 'string',
          description: 'Comment text',
        },
        isPrivate: {
          type: 'boolean',
          description: 'Private entry',
          default: false,
        },
        notify: {
          type: 'array',
          items: { type: 'string' },
          description: 'Email addresses to notify',
        },
      },
      required: ['projectId', 'issueId', 'comments'],
    },
  },
  {
    name: 'tdx_get_issue_categories',
    description: 'Get issue categories for project',
    inputSchema: {
      type: 'object',
      properties: {
        ...environmentParam,
        ...projectIdParam,
      },
      required: ['projectId'],
    },
  },
  {
    name: 'tdx_get_issue_priorities',
    description: 'Get issue priorities',
    inputSchema: {
      type: 'object',
      properties: {
        ...environmentParam,
      },
    },
  },
  {
    name: 'tdx_get_issue_statuses',
    description: 'Get issue statuses',
    inputSchema: {
      type: 'object',
      properties: {
        ...environmentParam,
      },
    },
  },
];
