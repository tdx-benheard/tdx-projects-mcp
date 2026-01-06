import axios, { AxiosInstance } from 'axios';
import { TDXAuth } from './auth.js';
import { exponentialBackoff, sleep } from './utils.js';
import type {
  Project,
  ProjectSearch,
  Issue,
  IssueUpdate,
  IssueSearch,
  IssueOrRiskCategory,
  Resource,
  FeedEntry,
  CreateFeedEntry,
  IssuePriority,
  IssueStatus,
  RetryConfig,
} from './types.js';

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  retryableStatusCodes: [408, 429, 500, 502, 503, 504],
  baseDelay: 1000,
  maxDelay: 30000,
};

/**
 * TeamDynamix Projects & Issues API Client
 * Handles all API interactions with authentication, retry logic, and error handling.
 */
export class TDXClient {
  private auth: TDXAuth;
  private baseUrl: string;
  private appIds: string[];
  private client: AxiosInstance;
  private username: string;
  private timeout: number;
  private retryConfig: RetryConfig;

  constructor(
    baseUrl: string,
    username: string,
    password: string,
    appIds: string | string[],
    timeout: number = 20000,
    retryConfig: Partial<RetryConfig> = {}
  ) {
    if (!baseUrl || !username || !password) {
      throw new Error('baseUrl, username, and password are required');
    }

    this.baseUrl = baseUrl;
    this.username = username;
    this.appIds = Array.isArray(appIds) ? appIds : [appIds];

    if (this.appIds.length === 0) {
      throw new Error('At least one application ID is required');
    }

    this.timeout = timeout;
    this.retryConfig = { ...DEFAULT_RETRY_CONFIG, ...retryConfig };
    this.auth = new TDXAuth({ baseUrl, username, password });

    this.client = axios.create({
      baseURL: baseUrl,
      timeout: this.timeout,
    });

    // Add auth interceptor
    this.client.interceptors.request.use(async (config) => {
      const headers = await this.auth.getAuthHeaders();
      Object.assign(config.headers, headers);
      return config;
    });

    // Add response error interceptor for auth refresh (with retry limit)
    this.client.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;

        // If there's no config, we can't retry
        if (!originalRequest) {
          return Promise.reject(error);
        }

        // Prevent infinite retry loop
        if (originalRequest._retryCount === undefined) {
          originalRequest._retryCount = 0;
        }

        // Handle 401 Unauthorized - token expired
        if (error.response?.status === 401 && originalRequest._retryCount < 1) {
          originalRequest._retryCount++;
          console.error('[Client] Received 401, invalidating token and retrying...');

          // Invalidate token and get a fresh one
          this.auth.invalidateToken();
          const headers = await this.auth.getAuthHeaders();
          Object.assign(originalRequest.headers, headers);

          return this.client.request(originalRequest);
        }

        // Handle retryable errors
        if (
          this.retryConfig.retryableStatusCodes.includes(error.response?.status) &&
          originalRequest._retryCount < this.retryConfig.maxRetries
        ) {
          originalRequest._retryCount++;
          const delay = exponentialBackoff(
            originalRequest._retryCount - 1,
            this.retryConfig.baseDelay,
            this.retryConfig.maxDelay
          );

          console.error(
            `[Client] Retrying request (${originalRequest._retryCount}/${this.retryConfig.maxRetries}) ` +
              `after ${delay}ms due to ${error.response?.status} error`
          );

          await sleep(delay);
          return this.client.request(originalRequest);
        }

        return Promise.reject(error);
      }
    );
  }

  // ===== Projects API Methods =====

  /**
   * Get a project by ID.
   *
   * @param projectId - The project ID to retrieve
   * @returns The project data
   */
  async getProject(projectId: number): Promise<Project> {
    const response = await this.client.get(`/api/projects/${projectId}`);
    return response.data;
  }

  /**
   * Update a project.
   *
   * @param projectId - The project ID to update
   * @param projectData - Partial project data to update
   * @returns The updated project
   */
  async updateProject(projectId: number, projectData: Partial<Project>): Promise<Project> {
    const response = await this.client.post(`/api/projects/${projectId}`, projectData);
    return response.data;
  }

  /**
   * Search for projects.
   *
   * @param searchParams - Search parameters
   * @returns Array of matching projects
   */
  async searchProjects(searchParams: ProjectSearch): Promise<Project[]> {
    // Enforce maxResults limit
    const params = { ...searchParams };
    if (params.MaxResults && params.MaxResults > 1000) {
      console.error('[Client] Warning: MaxResults capped at 1000');
      params.MaxResults = 1000;
    }

    const response = await this.client.post('/api/projects/search', params);
    return response.data;
  }

  /**
   * Get projects the user is on.
   *
   * @returns Array of projects
   */
  async listProjects(): Promise<Project[]> {
    const response = await this.client.get('/api/projects/list');
    return response.data;
  }

  /**
   * Get resources (team members) for a project.
   *
   * @param projectId - The project ID
   * @returns Array of resources
   */
  async getProjectResources(projectId: number): Promise<Resource[]> {
    const response = await this.client.get(`/api/projects/${projectId}/resources`);
    return response.data;
  }

  /**
   * Get feed entries for a project.
   *
   * @param projectId - The project ID
   * @returns Array of feed entries
   */
  async getProjectFeed(projectId: number): Promise<FeedEntry[]> {
    const response = await this.client.get(`/api/projects/${projectId}/feed`);
    return response.data;
  }

  /**
   * Add a feed entry to a project.
   *
   * @param projectId - The project ID
   * @param feedEntry - Feed entry data
   * @returns The created feed entry
   */
  async addProjectFeedEntry(projectId: number, feedEntry: CreateFeedEntry): Promise<FeedEntry> {
    const response = await this.client.post(`/api/projects/${projectId}/feed`, feedEntry);
    return response.data;
  }

  // ===== Issues API Methods =====

  /**
   * Get an issue by ID.
   *
   * @param projectId - The project ID
   * @param issueId - The issue ID
   * @returns The issue data
   */
  async getIssue(projectId: number, issueId: number): Promise<Issue> {
    const response = await this.client.get(`/api/projects/${projectId}/issues/${issueId}`);
    return response.data;
  }

  /**
   * Update an issue.
   *
   * @param projectId - The project ID
   * @param issueId - The issue ID
   * @param issueData - Issue update data
   * @returns The updated issue
   */
  async updateIssue(projectId: number, issueId: number, issueData: IssueUpdate): Promise<Issue> {
    const response = await this.client.post(`/api/projects/${projectId}/issues/${issueId}`, issueData);
    return response.data;
  }

  /**
   * Search for issues.
   *
   * Note: The TDX API requires ProjectIDs (plural, array) not ProjectID (singular).
   * The handlers layer converts projectId to ProjectIDs=[projectId] before calling this.
   * Verified: 2026-01-05 via tests/test-projectid-filter.js
   *
   * @param searchParams - Search parameters
   * @returns Array of matching issues
   */
  async searchIssues(searchParams: IssueSearch): Promise<Issue[]> {
    // Enforce maxResults limit
    const params = { ...searchParams };
    if (params.MaxResults && params.MaxResults > 1000) {
      console.error('[Client] Warning: MaxResults capped at 1000');
      params.MaxResults = 1000;
    }

    const response = await this.client.post('/api/projects/issues/search', params);
    return response.data;
  }

  /**
   * Get feed entries for an issue.
   *
   * @param projectId - The project ID
   * @param issueId - The issue ID
   * @returns Array of feed entries
   */
  async getIssueFeed(projectId: number, issueId: number): Promise<FeedEntry[]> {
    const response = await this.client.get(`/api/projects/${projectId}/issues/${issueId}/feed`);
    return response.data;
  }

  /**
   * Add a feed entry (comment) to an issue.
   *
   * @param projectId - The project ID
   * @param issueId - The issue ID
   * @param feedEntry - Feed entry data
   * @returns The created feed entry
   */
  async addIssueFeedEntry(projectId: number, issueId: number, feedEntry: CreateFeedEntry): Promise<FeedEntry> {
    const response = await this.client.post(`/api/projects/${projectId}/issues/${issueId}/feed`, feedEntry);
    return response.data;
  }

  /**
   * Get issue categories for a project.
   *
   * @param projectId - The project ID
   * @returns Array of issue categories
   */
  async getIssueCategories(projectId: number): Promise<IssueOrRiskCategory[]> {
    const response = await this.client.get(`/api/projects/${projectId}/issues/categories`);
    return response.data;
  }

  /**
   * Get issue priorities.
   *
   * @returns Dictionary of priority names and values
   */
  async getIssuePriorities(): Promise<Record<string, number>> {
    const response = await this.client.get('/api/projects/issues/priorities');
    return response.data;
  }

  /**
   * Get issue statuses.
   *
   * @returns Array of issue statuses
   */
  async getIssueStatuses(): Promise<IssueStatus[]> {
    const response = await this.client.get('/api/projects/issues/statuses');
    return response.data;
  }
}
