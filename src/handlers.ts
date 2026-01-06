import { TDXClient } from './client.js';
import { truncateToTokenLimit } from './utils.js';
import type {
  GetProjectArgs,
  UpdateProjectArgs,
  SearchProjectsArgs,
  GetProjectResourcesArgs,
  GetProjectFeedArgs,
  AddProjectFeedArgs,
  GetIssueArgs,
  UpdateIssueArgs,
  SearchIssuesArgs,
  GetIssueFeedArgs,
  AddIssueFeedArgs,
  GetIssueCategoriesArgs,
  GetIssuePrioritiesArgs,
  GetIssueStatusesArgs,
} from './types.js';

export class ToolHandlers {
  constructor(
    private tdxClients: Map<string, TDXClient>,
    private defaultEnvironment: string
  ) {}

  // Get the appropriate client based on environment parameter
  private getClient(environment?: string): TDXClient {
    const env = environment || this.defaultEnvironment;
    const client = this.tdxClients.get(env);

    if (!client) {
      throw new Error(`Environment '${env}' not configured. Available: ${Array.from(this.tdxClients.keys()).join(', ')}`);
    }

    return client;
  }

  /**
   * Filter attributes to remove bloated choice metadata.
   * Reduces response size significantly.
   */
  private filterAttributes(item: any): any {
    if (!item.Attributes || !Array.isArray(item.Attributes)) {
      return item;
    }

    const filtered = { ...item };
    filtered.Attributes = item.Attributes.map((attr: any) => {
      const filteredAttr: any = {
        ID: attr.ID,
        Name: attr.Name,
        Value: attr.Value,
        ValueText: attr.ValueText,
      };

      if (attr.Choices && Array.isArray(attr.Choices) && attr.Value) {
        const selectedValues = Array.isArray(attr.Value) ? attr.Value : [attr.Value];
        filteredAttr.SelectedChoices = attr.Choices
          .filter((choice: any) => selectedValues.includes(choice.ID))
          .map((choice: any) => ({
            ID: choice.ID,
            Name: choice.Name,
          }));
      }

      return filteredAttr;
    });

    return filtered;
  }

  /**
   * Minimal field set for project searches.
   * Reduces response size by ~91.5% (from ~1,283 bytes to ~109 bytes per project).
   *
   * Only includes essential browsing fields. Use tdx_get_project for full details.
   */
  private static readonly MINIMAL_PROJECT_FIELDS = [
    'ID',
    'Name',
    'StatusName',
    'PercentComplete',
    'IsActive',
    'ManagerFullName',
    'ModifiedDate',
  ];

  /**
   * Strip project to minimal fields for search results.
   * Use tdx_get_project to retrieve full details.
   */
  private stripToMinimalFields(project: any): any {
    const minimal: any = {};

    for (const field of ToolHandlers.MINIMAL_PROJECT_FIELDS) {
      if (field in project) {
        minimal[field] = project[field];
      }
    }

    return minimal;
  }

  /**
   * Minimal field set for issue searches.
   * Reduces response size by ~80-90% (estimated).
   */
  private static readonly MINIMAL_ISSUE_FIELDS = [
    'ID',
    'ProjectID',
    'Title',
    'StatusID',
    'StatusName',
    'PriorityID',
    'PriorityName',
    'CategoryID',
    'CategoryName',
    'ResponsibleUID',
    'ResponsibleFullName',
    'CreatedDate',
    'ModifiedDate',
  ];

  /**
   * Strip issue to minimal fields for search results.
   * Use tdx_get_issue to retrieve full details.
   */
  private stripToMinimalIssueFields(issue: any): any {
    const minimal: any = {};

    for (const field of ToolHandlers.MINIMAL_ISSUE_FIELDS) {
      if (field in issue) {
        minimal[field] = issue[field];
      }
    }

    return minimal;
  }

  /**
   * Strip feed entry to minimal fields (exclude Body which contains large HTML content).
   * Reduces response size by ~70-90% depending on Body length.
   *
   * Keeps all metadata for browsing feed history efficiently.
   */
  private stripFeedEntryToMinimal(entry: any): any {
    const { Body, ...minimal } = entry;

    // Add truncated body preview (first 100 chars)
    if (Body) {
      const plainText = Body.replace(/<[^>]*>/g, ''); // Strip HTML tags
      minimal.BodyPreview = plainText.substring(0, 100) + (plainText.length > 100 ? '...' : '');
    }

    return minimal;
  }

  // ===== Project Handlers =====

  async handleGetProject(args: GetProjectArgs) {
    const client = this.getClient(args?.environment);
    if (!args?.projectId) {
      throw new Error('projectId is required');
    }

    const project = await client.getProject(args.projectId);
    const filteredProject = this.filterAttributes(project);

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(filteredProject, null, 2),
        },
      ],
    };
  }

  async handleUpdateProject(args: UpdateProjectArgs) {
    const client = this.getClient(args?.environment);
    if (!args?.projectId || !args?.projectData) {
      throw new Error('projectId and projectData are required');
    }

    const result = await client.updateProject(args.projectId, args.projectData);
    const filteredResult = this.filterAttributes(result);

    return {
      content: [
        {
          type: 'text',
          text: `Project #${result.ID} "${result.Name}" updated successfully.\n\nUpdated project details:\n${JSON.stringify(filteredResult, null, 2)}`,
        },
      ],
    };
  }

  async handleSearchProjects(args: SearchProjectsArgs) {
    const client = this.getClient(args?.environment);

    const searchParams: any = {};
    if (args?.searchText) searchParams.SearchText = args.searchText;
    if (args?.maxResults) searchParams.MaxResults = args.maxResults;
    if (args?.statusIDs) searchParams.StatusIDs = args.statusIDs;
    if (args?.managerUIDs) searchParams.ManagerUIDs = args.managerUIDs;
    if (args?.typeIDs) searchParams.TypeIDs = args.typeIDs;
    if (args?.priorityIDs) searchParams.PriorityIDs = args.priorityIDs;
    if (args?.resourceUIDs) searchParams.ResourceUIDs = args.resourceUIDs;
    if (args?.modifiedDateFrom) searchParams.ModifiedDateFrom = args.modifiedDateFrom;
    if (args?.modifiedDateTo) searchParams.ModifiedDateTo = args.modifiedDateTo;

    let projects = await client.searchProjects(searchParams);

    // Strip to minimal fields for search results (88% size reduction)
    projects = projects.map(p => this.stripToMinimalFields(p));

    // Truncate if necessary to stay within token limits
    const { data, truncated, message, originalCount, returnedCount } = truncateToTokenLimit(projects);

    // If truncated, add informative message as a comment at the end of JSON
    // (JSON allows trailing text after parsing, and this won't break JSON parsing)
    let responseText = JSON.stringify(data, null, 2);
    if (truncated && message) {
      // Add message after JSON in a comment-style format
      responseText += `\n\n# ${message}`;
    }

    return {
      content: [
        {
          type: 'text',
          text: responseText,
        },
      ],
    };
  }

  async handleListProjects(args: any) {
    const client = this.getClient(args?.environment);
    let projects = await client.listProjects();

    // Strip to minimal fields for browsing (same as search - 91.5% size reduction)
    projects = projects.map(p => this.stripToMinimalFields(p));

    // Truncate if necessary to stay within token limits
    const { data, truncated, message, originalCount, returnedCount } = truncateToTokenLimit(projects);

    // If truncated, add informative message as a comment at the end of JSON
    // (JSON allows trailing text after parsing, and this won't break JSON parsing)
    let responseText = JSON.stringify(data, null, 2);
    if (truncated && message) {
      // Add message after JSON in a comment-style format
      responseText += `\n\n# ${message}`;
    }

    return {
      content: [
        {
          type: 'text',
          text: responseText,
        },
      ],
    };
  }

  async handleGetProjectResources(args: GetProjectResourcesArgs) {
    const client = this.getClient(args?.environment);
    if (!args?.projectId) {
      throw new Error('projectId is required');
    }

    const resources = await client.getProjectResources(args.projectId);

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(resources, null, 2),
        },
      ],
    };
  }

  async handleGetProjectFeed(args: GetProjectFeedArgs) {
    const client = this.getClient(args?.environment);
    if (!args?.projectId) {
      throw new Error('projectId is required');
    }

    let feed = await client.getProjectFeed(args.projectId);

    // Strip to minimal fields (exclude Body, add preview - 70-90% size reduction)
    feed = feed.map(entry => this.stripFeedEntryToMinimal(entry));

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(feed, null, 2),
        },
      ],
    };
  }

  async handleAddProjectFeed(args: AddProjectFeedArgs) {
    const client = this.getClient(args?.environment);
    if (!args?.projectId || !args?.comments) {
      throw new Error('projectId and comments are required');
    }

    const feedEntry: any = {
      Comments: args.comments,
      IsPrivate: args.isPrivate || false,
    };

    if (args.notify) feedEntry.Notify = args.notify;

    const result = await client.addProjectFeedEntry(args.projectId, feedEntry);

    return {
      content: [
        {
          type: 'text',
          text: `Feed entry #${result.ID} added to project #${args.projectId} successfully.`,
        },
      ],
    };
  }

  // ===== Issue Handlers =====

  async handleGetIssue(args: GetIssueArgs) {
    const client = this.getClient(args?.environment);
    if (!args?.projectId || !args?.issueId) {
      throw new Error('projectId and issueId are required');
    }

    const issue = await client.getIssue(args.projectId, args.issueId);
    const filteredIssue = this.filterAttributes(issue);

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(filteredIssue, null, 2),
        },
      ],
    };
  }

  async handleUpdateIssue(args: UpdateIssueArgs) {
    const client = this.getClient(args?.environment);
    if (!args?.projectId || !args?.issueId || !args?.issueData) {
      throw new Error('projectId, issueId, and issueData are required');
    }

    const result = await client.updateIssue(args.projectId, args.issueId, args.issueData);
    const filteredResult = this.filterAttributes(result);

    return {
      content: [
        {
          type: 'text',
          text: `Issue #${result.ID} "${result.Title}" updated successfully.\n\nUpdated issue details:\n${JSON.stringify(filteredResult, null, 2)}`,
        },
      ],
    };
  }

  async handleSearchIssues(args: SearchIssuesArgs) {
    const client = this.getClient(args?.environment);

    const searchParams: any = {};
    if (args?.projectId) searchParams.ProjectIDs = [args.projectId];  // API requires ProjectIDs (plural, array)
    if (args?.searchText) searchParams.SearchText = args.searchText;
    if (args?.maxResults) searchParams.MaxResults = args.maxResults;
    if (args?.statusIDs) searchParams.StatusIDs = args.statusIDs;
    if (args?.priorityIDs) searchParams.PriorityIDs = args.priorityIDs;
    if (args?.categoryIDs) searchParams.CategoryIDs = args.categoryIDs;
    if (args?.responsibleUIDs) searchParams.ResponsibleUIDs = args.responsibleUIDs;
    if (args?.modifiedDateFrom) searchParams.ModifiedDateFrom = args.modifiedDateFrom;
    if (args?.modifiedDateTo) searchParams.ModifiedDateTo = args.modifiedDateTo;

    let issues = await client.searchIssues(searchParams);

    // Strip to minimal fields for search results (80-90% size reduction)
    issues = issues.map(i => this.stripToMinimalIssueFields(i));

    // Truncate if necessary to stay within token limits
    const { data, truncated, message, originalCount, returnedCount } = truncateToTokenLimit(issues);

    // If truncated, add informative message as a comment at the end of JSON
    // (JSON allows trailing text after parsing, and this won't break JSON parsing)
    let responseText = JSON.stringify(data, null, 2);
    if (truncated && message) {
      // Add message after JSON in a comment-style format
      responseText += `\n\n# ${message}`;
    }

    return {
      content: [
        {
          type: 'text',
          text: responseText,
        },
      ],
    };
  }

  async handleGetIssueFeed(args: GetIssueFeedArgs) {
    const client = this.getClient(args?.environment);
    if (!args?.projectId || !args?.issueId) {
      throw new Error('projectId and issueId are required');
    }

    let feed = await client.getIssueFeed(args.projectId, args.issueId);

    // Strip to minimal fields (exclude Body, add preview - 70-90% size reduction)
    feed = feed.map(entry => this.stripFeedEntryToMinimal(entry));

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(feed, null, 2),
        },
      ],
    };
  }

  async handleAddIssueFeed(args: AddIssueFeedArgs) {
    const client = this.getClient(args?.environment);
    if (!args?.projectId || !args?.issueId || !args?.comments) {
      throw new Error('projectId, issueId, and comments are required');
    }

    const feedEntry: any = {
      Comments: args.comments,
      IsPrivate: args.isPrivate || false,
    };

    if (args.notify) feedEntry.Notify = args.notify;

    const result = await client.addIssueFeedEntry(args.projectId, args.issueId, feedEntry);

    return {
      content: [
        {
          type: 'text',
          text: `Feed entry #${result.ID} added to issue #${args.issueId} successfully.`,
        },
      ],
    };
  }

  async handleGetIssueCategories(args: GetIssueCategoriesArgs) {
    const client = this.getClient(args?.environment);
    if (!args?.projectId) {
      throw new Error('projectId is required');
    }

    const categories = await client.getIssueCategories(args.projectId);

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(categories, null, 2),
        },
      ],
    };
  }

  async handleGetIssuePriorities(args: GetIssuePrioritiesArgs) {
    const client = this.getClient(args?.environment);
    const priorities = await client.getIssuePriorities();

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(priorities, null, 2),
        },
      ],
    };
  }

  async handleGetIssueStatuses(args: GetIssueStatusesArgs) {
    const client = this.getClient(args?.environment);
    const statuses = await client.getIssueStatuses();

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(statuses, null, 2),
        },
      ],
    };
  }
}
