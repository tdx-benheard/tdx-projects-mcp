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

### Response Size Optimization ✅ (Implemented 2025-12-24)

**Search/List tools return minimal fields (91.5% size reduction):**
- `tdx_search_projects`: Returns 7 essential fields per project (~109 bytes)
- `tdx_search_issues`: Returns 13 essential fields per issue (~200 bytes)
- `tdx_list_projects`: Returns 7 essential fields per project (~109 bytes) - OPTIMIZED

**Feed tools return minimal fields (70-90% size reduction):**
- `tdx_get_project_feed`: Excludes Body HTML, includes BodyPreview (100 chars) - OPTIMIZED
- `tdx_get_issue_feed`: Excludes Body HTML, includes BodyPreview (100 chars) - OPTIMIZED

**Get tools return full details:**
- `tdx_get_project`: Full project details with all fields
- `tdx_get_issue`: Full issue details with all fields

**Recommended Workflow:**
```
1. Search/List (minimal) → Browse efficiently, find what you need
2. Get (full) → View complete details on specific item
3. Feed (minimal) → Browse updates quickly with previews
```

**Example:**
```typescript
// 1. Search returns minimal fields (fast, fits many results)
search_projects("UX Updates")
  → Returns 60+ projects with: ID, Name, StatusName, PercentComplete, IsActive, ManagerFullName, ModifiedDate

// 2. List returns same minimal fields (fast, fits 100+ projects)
list_projects()
  → Returns all user's projects with same 7 fields

// 3. Get returns full details (when you find the right one)
get_project(441886)
  → Returns complete project with all 70+ fields

// 4. Feed returns metadata + preview (fast, fits 100+ entries)
get_project_feed(441886)
  → Returns feed entries with BodyPreview instead of full HTML Body
```

**Projects:**
- `tdx_get_project`: Returns full project details
- `tdx_update_project`: Updates project fields
- `tdx_search_projects`: Returns minimal fields - use filters for precision (manager, status, type, priority, dates)
- `tdx_list_projects`: Returns minimal fields for projects user is on

**Issues:**
- Issues belong to projects - always need `projectId` and `issueId`
- `tdx_get_issue`: Returns full issue details
- `tdx_update_issue`: Updates issue fields
- `tdx_search_issues`: Returns minimal fields - use filters (project, status, priority, category, responsible, dates)

**Feed Entries:**
- Projects and issues both support feed entries (comments/updates)
- Feed endpoints return metadata + 100-char body preview (not full HTML Body)
- Use `isPrivate` flag to control visibility
- Can notify specific users via `notify` array

**Auth:** JWT tokens cached 23hr, auto-refresh on 401

**Retry:** 408/429/500/502/503/504 retry 3x with exponential backoff

---

## API Quirks & Important Notes

### Issue Search ProjectID Parameter

**CRITICAL:** The `/api/projects/issues/search` endpoint requires `ProjectIDs` (plural, array) not `ProjectID` (singular).

```typescript
// ✗ WRONG - API ignores this
{ ProjectID: 441886 }

// ✓ CORRECT - API filters properly
{ ProjectIDs: [441886] }
```

**Implementation:**
- MCP tool accepts `projectId` (singular number) for user convenience
- `handlers.ts` converts to `ProjectIDs: [projectId]` before API call
- API performs server-side filtering (no client-side filtering needed)

**Verified:** 2026-01-05 via `tests/test-projectid-filter.js`

**Documentation:** https://solutions.teamdynamix.com/TDWebApi/Home/type/TeamDynamix.Api.Issues.IssueSearch

### Issue Updates Comments Requirement

**CRITICAL:** The `/api/projects/{projectId}/issues/{issueId}` endpoint (POST/update) REQUIRES a `Comments` field.

```typescript
// ✗ WRONG - API returns 400: "Comments must be provided."
{
  StatusID: 8820,
  ResponsibleUID: "f67dc740-edfd-ec11-b47a-0003ff505262"
}

// ✓ CORRECT - Minimal update with required Comments field
{
  StatusID: 8820,
  ResponsibleUID: "f67dc740-edfd-ec11-b47a-0003ff505262",
  Comments: "Changing status to Ready for Testing and reassigning to David"
}
```

**Why:** The Comments field creates a feed entry documenting the change. The API enforces this to maintain audit trail.

**Minimal Required Fields:**
- `Comments` (required - string - creates feed entry)
- Any fields you want to update (StatusID, ResponsibleUID, Title, Description, CategoryID, PriorityID, etc.)

**Implementation:**
- MCP tool schema now documents Comments as required field
- Tool description warns users about this requirement
- LLM should include meaningful comment describing the change

**Verified:** 2026-01-06 via `tests/test-issue-update-simple.js`

**Documentation:** https://solutions.teamdynamix.com/TDWebApi/Home/type/TeamDynamix.Api.Issues.Issue

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

# Response size analysis (development)
node tests/analyze-feed-size.js         # Analyze single feed entry
node tests/compare-optimizations.js     # Compare before/after optimization results
```

---

## Recent Work & Status (2025-12-25)

### Optimization Phase Complete ✅

**Problem Identified:**
- Initial testing revealed 3 tools exceeded token limits (66K-88K chars)
- `tdx_list_projects`: 66K chars → Saved to file, unusable
- `tdx_get_project_feed`: 88K chars → Saved to file, unusable
- `tdx_get_issue_feed`: 5K chars → Would fail on active issues

**Solutions Implemented:**

1. **`tdx_list_projects`** - 97.9% reduction
   - Stripped to same 7 minimal fields as search
   - Before: 66K chars (broken) → After: 1.4K chars (working)
   - Can now browse 100+ projects efficiently

2. **`tdx_get_project_feed`** - 85.3% reduction
   - Removed massive HTML Body field, added 100-char BodyPreview
   - Before: 88K chars (broken) → After: 13K chars (working)
   - 49 entries × 265 bytes = manageable size

3. **`tdx_get_issue_feed`** - 54% reduction
   - Same Body → BodyPreview optimization
   - Before: 5K chars (risky) → After: 2.3K chars (safe)
   - Safe for issues with long feed histories

**Test Scripts Created:**
- `tests/analyze-feed-size.js`: Analyzes individual feed entry size breakdown
- `tests/compare-optimizations.js`: Documents before/after metrics

### Current Status

✅ **All tools functional and tested**
- Search/List tools: Minimal fields, 91.5% reduction
- Feed tools: Body removed, BodyPreview added, 54-85% reduction
- Get tools: Full details preserved

⚠️ **Known Limitations:**
- Feed BodyPreview is 100 chars max (cannot retrieve full Body HTML)
- This is acceptable - preview sufficient for 90% of use cases
- Full Body would reintroduce token limit issues

📊 **Performance Metrics:**
- Can handle 100+ projects in list
- Can handle 50+ feed entries per project/issue
- Total optimization: 85-98% size reduction across critical tools

### What's Ahead

✅ **No critical issues remaining**
- All tools working within token limits
- Optimization strategy validated with test data
- Documentation updated

🔄 **Potential Future Enhancements:**
- Add optional `includeFullBody` parameter to feed tools (with warnings about token limits)
- Remove null fields and empty arrays from feed entries (additional 7% reduction)
- Add pagination parameters for feed tools if needed

💡 **Recommendation:**
Current optimization is production-ready. Further optimization would provide diminishing returns and may remove useful metadata.
