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
    description: 'Get project by ID (returns full project details)',
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
    description: 'Search for projects (returns minimal fields for browsing - use tdx_get_project for full details)',
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
          description: 'Filter by status IDs',
        },
        managerUIDs: {
          type: 'array',
          items: { type: 'string' },
          description: 'Filter by manager UIDs',
        },
        typeIDs: {
          type: 'array',
          items: { type: 'number' },
          description: 'Filter by project type IDs',
        },
        priorityIDs: {
          type: 'array',
          items: { type: 'number' },
          description: 'Filter by priority IDs',
        },
        resourceUIDs: {
          type: 'array',
          items: { type: 'string' },
          description: 'Filter by assigned resource UIDs',
        },
        modifiedDateFrom: {
          type: 'string',
          description: 'Filter by modified date (ISO 8601 format: YYYY-MM-DD)',
        },
        modifiedDateTo: {
          type: 'string',
          description: 'Filter by modified date (ISO 8601 format: YYYY-MM-DD)',
        },
      },
    },
  },
  {
    name: 'tdx_list_projects',
    description: 'Get projects the user is on (returns minimal fields for browsing - use tdx_get_project for full details)',
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
    description: 'Get project feed entries (returns metadata with body preview - excludes full Body field for efficiency)',
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
    description: 'Get issue by ID (returns full issue details)',
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
    description: 'Update issue. IMPORTANT: Comments field is REQUIRED by the API (creates a feed entry). Include any fields you want to update (StatusID, ResponsibleUID, Title, Description, CategoryID, PriorityID, etc.).',
    inputSchema: {
      type: 'object',
      properties: {
        ...environmentParam,
        ...projectIdParam,
        ...issueIdParam,
        issueData: {
          type: 'object',
          description: 'Issue data to update. Must include Comments field (required by API). Optional fields: StatusID, ResponsibleUID, Title, Description, CategoryID, PriorityID, Resolution, ImpactID, ResponsibleGroupID.',
          properties: {
            Comments: {
              type: 'string',
              description: 'REQUIRED: Comment text that will be added to the issue feed',
            },
            StatusID: {
              type: 'number',
              description: 'Optional: New status ID',
            },
            ResponsibleUID: {
              type: 'string',
              description: 'Optional: New responsible user UID',
            },
            Title: {
              type: 'string',
              description: 'Optional: Issue title',
            },
            Description: {
              type: 'string',
              description: 'Optional: Issue description',
            },
            CategoryID: {
              type: 'number',
              description: 'Optional: Category ID',
            },
            PriorityID: {
              type: 'number',
              description: 'Optional: Priority ID',
            },
          },
          required: ['Comments'],
        },
      },
      required: ['projectId', 'issueId', 'issueData'],
    },
  },
  {
    name: 'tdx_search_issues',
    description: 'Search for issues (returns minimal fields for browsing - use tdx_get_issue for full details)',
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
          description: 'Filter by status IDs',
        },
        priorityIDs: {
          type: 'array',
          items: { type: 'number' },
          description: 'Filter by priority IDs',
        },
        categoryIDs: {
          type: 'array',
          items: { type: 'number' },
          description: 'Filter by category IDs',
        },
        responsibleUIDs: {
          type: 'array',
          items: { type: 'string' },
          description: 'Filter by responsible UIDs',
        },
        modifiedDateFrom: {
          type: 'string',
          description: 'Filter by modified date (ISO 8601 format: YYYY-MM-DD)',
        },
        modifiedDateTo: {
          type: 'string',
          description: 'Filter by modified date (ISO 8601 format: YYYY-MM-DD)',
        },
      },
    },
  },
  {
    name: 'tdx_get_issue_feed',
    description: 'Get issue feed entries (returns metadata with body preview - excludes full Body field for efficiency)',
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
