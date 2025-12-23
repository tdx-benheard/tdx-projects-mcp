/**
 * TeamDynamix Projects & Issues API Type Definitions
 */

/**
 * Configuration for connecting to a TeamDynamix environment
 */
export interface EnvironmentConfig {
  baseUrl: string;
  username: string;
  password: string;
  appIds: string[];
  timeout?: number;
}

/**
 * Authentication configuration
 */
export interface AuthConfig {
  baseUrl: string;
  username: string;
  password: string;
}

/**
 * TeamDynamix Project entity
 */
export interface Project {
  ID: number;
  Name: string;
  Description?: string;
  ManagerUID?: string;
  ManagerFullName?: string;
  AlternateManagerUIDs?: string[];
  StartDate?: string;
  EndDate?: string;
  PercentComplete?: number;
  StatusID?: number;
  StatusName?: string;
  TypeID?: number;
  TypeName?: string;
  PriorityID?: number;
  PriorityName?: string;
  AccountID?: number;
  AccountName?: string;
  CreatedDate?: string;
  CreatedUID?: string;
  CreatedFullName?: string;
  ModifiedDate?: string;
  ModifiedUID?: string;
  ModifiedFullName?: string;
  CompletedDate?: string;
  IsActive?: boolean;
  IsFavorite?: boolean;
  Attributes?: ProjectAttribute[];
  CustomColumns?: any[];
  NonWorkingDays?: number[];
  [key: string]: any;
}

/**
 * Project attribute (custom field)
 */
export interface ProjectAttribute {
  ID: number;
  Name: string;
  Value?: string;
  ValueText?: string;
}

/**
 * Project search parameters
 */
export interface ProjectSearch {
  SearchText?: string;
  MaxResults?: number;
  StatusIDs?: number[];
  PriorityIDs?: number[];
  TypeIDs?: number[];
  AccountIDs?: number[];
  ManagerUIDs?: string[];
  ResourceUIDs?: string[];
  CreatedDateFrom?: string;
  CreatedDateTo?: string;
  ModifiedDateFrom?: string;
  ModifiedDateTo?: string;
  [key: string]: any;
}

/**
 * TeamDynamix Issue entity
 */
export interface Issue {
  ID: number;
  ProjectID: number;
  Title: string;
  Description?: string;
  StatusID?: number;
  StatusName?: string;
  PriorityID?: number;
  PriorityName?: string;
  CategoryID?: number;
  CategoryName?: string;
  Resolution?: string;
  ImpactID?: number;
  ImpactName?: string;
  ResponsibleUID?: string;
  ResponsibleFullName?: string;
  ResponsibleEmail?: string;
  ResponsibleGroupID?: number;
  ResponsibleGroupName?: string;
  CreatedDate?: string;
  CreatedUID?: string;
  CreatedFullName?: string;
  ModifiedDate?: string;
  ModifiedUID?: string;
  ModifiedFullName?: string;
  ClosedDate?: string;
  ClosedUID?: string;
  ClosedFullName?: string;
  IsActive?: boolean;
  Attributes?: IssueAttribute[];
  [key: string]: any;
}

/**
 * Issue attribute (custom field)
 */
export interface IssueAttribute {
  ID: number;
  Name: string;
  Value?: string;
  ValueText?: string;
}

/**
 * Issue update parameters
 */
export interface IssueUpdate {
  Title?: string;
  Description?: string;
  StatusID?: number;
  PriorityID?: number;
  CategoryID?: number;
  Resolution?: string;
  ImpactID?: number;
  ResponsibleUID?: string;
  ResponsibleGroupID?: number;
  [key: string]: any;
}

/**
 * Issue search parameters
 */
export interface IssueSearch {
  ProjectID?: number;
  SearchText?: string;
  MaxResults?: number;
  StatusIDs?: number[];
  PriorityIDs?: number[];
  CategoryIDs?: number[];
  ResponsibleUIDs?: string[];
  CreatedDateFrom?: string;
  CreatedDateTo?: string;
  ModifiedDateFrom?: string;
  ModifiedDateTo?: string;
  [key: string]: any;
}

/**
 * Issue category
 */
export interface IssueOrRiskCategory {
  ID: number;
  ProjectID?: number;
  Name: string;
  Description?: string;
  IsActive?: boolean;
  Order?: number;
  [key: string]: any;
}

/**
 * Project resource (team member)
 */
export interface Resource {
  UID: string;
  FullName?: string;
  PrimaryEmail?: string;
  RoleID?: number;
  RoleName?: string;
  IsProjectManager?: boolean;
  IsAlternateProjectManager?: boolean;
  [key: string]: any;
}

/**
 * Feed entry (comment/update)
 */
export interface FeedEntry {
  ID: number;
  Body: string;
  IsPrivate: boolean;
  CreatedDate: string;
  CreatedUid?: string;
  CreatedFullName?: string;
  CreatedEmail?: string;
  ItemID?: number;
  ItemType?: string;
  Comments?: string;
  Notify?: string[];
  Replies?: FeedEntry[];
  RepliesCount?: number;
  Likes?: any[];
  LikesCount?: number;
  LikedByMe?: boolean;
}

/**
 * Feed entry creation parameters
 */
export interface CreateFeedEntry {
  Comments: string;
  IsPrivate?: boolean;
  Notify?: string[];
}

/**
 * Issue priority
 */
export interface IssuePriority {
  Name: string;
  Value: number;
}

/**
 * Issue status
 */
export interface IssueStatus {
  ID: number;
  Name: string;
  Description?: string;
  Order?: number;
  StatusClass?: number;
  IsActive?: boolean;
  IsDefault?: boolean;
}

/**
 * HTTP retry configuration
 */
export interface RetryConfig {
  maxRetries: number;
  retryableStatusCodes: number[];
  baseDelay: number;
  maxDelay: number;
}

/**
 * API Error response
 */
export interface ApiError {
  statusCode: number;
  message: string;
  details?: any;
  endpoint?: string;
  timestamp?: string;
}

/**
 * MCP Tool arguments base
 */
export interface ToolArgs {
  environment?: string;
  appId?: string;
}

/**
 * Tool argument interfaces for type safety
 */
export interface GetProjectArgs extends ToolArgs {
  projectId: number;
}

export interface UpdateProjectArgs extends ToolArgs {
  projectId: number;
  projectData: Partial<Project>;
}

export interface SearchProjectsArgs extends ToolArgs {
  searchText?: string;
  maxResults?: number;
  statusIDs?: number[];
  managerUIDs?: string[];
}

export interface GetProjectResourcesArgs extends ToolArgs {
  projectId: number;
}

export interface GetProjectFeedArgs extends ToolArgs {
  projectId: number;
  top?: number;
}

export interface AddProjectFeedArgs extends ToolArgs {
  projectId: number;
  comments: string;
  isPrivate?: boolean;
  notify?: string[];
}

export interface GetIssueArgs extends ToolArgs {
  projectId: number;
  issueId: number;
}

export interface UpdateIssueArgs extends ToolArgs {
  projectId: number;
  issueId: number;
  issueData: IssueUpdate;
}

export interface SearchIssuesArgs extends ToolArgs {
  projectId?: number;
  searchText?: string;
  maxResults?: number;
  statusIDs?: number[];
}

export interface GetIssueFeedArgs extends ToolArgs {
  projectId: number;
  issueId: number;
}

export interface AddIssueFeedArgs extends ToolArgs {
  projectId: number;
  issueId: number;
  comments: string;
  isPrivate?: boolean;
  notify?: string[];
}

export interface GetIssueCategoriesArgs extends ToolArgs {
  projectId: number;
}

export interface GetIssuePrioritiesArgs extends ToolArgs {}

export interface GetIssueStatusesArgs extends ToolArgs {}
