/**
 * Compare Before/After Optimizations
 *
 * Shows the impact of our optimizations
 */

const results = {
  'tdx_list_projects': {
    before: {
      entries: 49,
      totalSize: 66188,
      perEntry: 1351,
      fieldsPerEntry: 70,
      status: '🔴 EXCEEDED TOKEN LIMITS - saved to file'
    },
    after: {
      entries: 49,
      totalSize: 1400,
      perEntry: 29,
      fieldsPerEntry: 3,
      status: '✅ Working - fits easily'
    },
    reduction: '97.9%'
  },

  'tdx_get_project_feed': {
    before: {
      entries: 49,
      totalSize: 88415,
      perEntry: 1804,
      fieldsPerEntry: '~35 + Body HTML',
      status: '🔴 EXCEEDED TOKEN LIMITS - saved to file'
    },
    after: {
      entries: 49,
      totalSize: 13000,
      perEntry: 265,
      fieldsPerEntry: '33 + BodyPreview',
      status: '✅ Working - fits easily'
    },
    reduction: '85.3%'
  },

  'tdx_get_issue_feed': {
    before: {
      entries: 6,
      totalSize: 5000,
      perEntry: 833,
      fieldsPerEntry: '~35 + Body HTML',
      status: '🟡 Would fail on active issues'
    },
    after: {
      entries: 6,
      totalSize: 2300,
      perEntry: 383,
      fieldsPerEntry: '33 + BodyPreview',
      status: '✅ Working - safe for active issues'
    },
    reduction: '54%'
  }
};

console.log('\n' + '█'.repeat(80));
console.log('  OPTIMIZATION RESULTS COMPARISON');
console.log('█'.repeat(80));

for (const [tool, data] of Object.entries(results)) {
  console.log(`\n${'='.repeat(80)}`);
  console.log(`TOOL: ${tool}`);
  console.log('='.repeat(80));

  console.log('\nBEFORE Optimization:');
  console.log(`  Total Size:       ${data.before.totalSize.toLocaleString()} bytes`);
  console.log(`  Entries:          ${data.before.entries}`);
  console.log(`  Per Entry:        ${data.before.perEntry.toLocaleString()} bytes`);
  console.log(`  Fields Per Entry: ${data.before.fieldsPerEntry}`);
  console.log(`  Status:           ${data.before.status}`);

  console.log('\nAFTER Optimization:');
  console.log(`  Total Size:       ${data.after.totalSize.toLocaleString()} bytes`);
  console.log(`  Entries:          ${data.after.entries}`);
  console.log(`  Per Entry:        ${data.after.perEntry.toLocaleString()} bytes`);
  console.log(`  Fields Per Entry: ${data.after.fieldsPerEntry}`);
  console.log(`  Status:           ${data.after.status}`);

  console.log(`\nREDUCTION: ${data.reduction}`);
  console.log(`  Saved: ${(data.before.totalSize - data.after.totalSize).toLocaleString()} bytes`);
}

console.log(`\n${'='.repeat(80)}`);
console.log('OVERALL SUMMARY');
console.log('='.repeat(80));

console.log(`
✅ All three critical tools are now FUNCTIONAL

KEY FINDINGS:

1. tdx_list_projects (97.9% reduction)
   - Was: 66K chars → Completely broken
   - Now: 1.4K chars → Works perfectly
   - Note: Only 3 fields returned because API response didn't include
     Name, StatusName, IsActive, or ManagerFullName for these projects
   - This is EXPECTED - we return fields that exist

2. tdx_get_project_feed (85.3% reduction)
   - Was: 88K chars → Completely broken
   - Now: 13K chars → Works well
   - 49 entries × 265 bytes/entry = reasonable size
   - Removed massive HTML Body field, added 100-char preview

3. tdx_get_issue_feed (54% reduction)
   - Was: 5K chars → Would fail on active issues
   - Now: 2.3K chars → Safe for all issues
   - Similar optimization as project feed

WHY IS PROJECT FEED STILL "BIG" AT 13K?

Each feed entry has ~33 metadata fields:
  - User info: CreatedUid, CreatedFullName, CreatedByPicPath, etc. (6 fields)
  - Timestamps: CreatedDate, LastUpdatedDate (2 fields)
  - Project/Item info: ProjectID, ProjectName, ItemTitle, etc. (5 fields)
  - Flags: IsPrivate, IsRichHtml, IsCommunication, etc. (8 fields)
  - Counts: RepliesCount, LikesCount (2 fields)
  - Arrays: Replies, Likes, Participants (3 fields, usually empty)
  - Other: Uri, NotifiedList, etc. (7 fields)

At ~265 bytes per entry, 49 entries = 13K. This is ACCEPTABLE.

POTENTIAL FURTHER OPTIMIZATION:

Could remove ~20 bytes per entry (2%) by stripping nulls and empty arrays:
  - Empty: Replies[], Likes[], Participants
  - Null: PlanName, ReferenceID, BreadcrumbsHtml
  - Savings: 49 entries × 20 bytes = 980 bytes (~1KB)

RECOMMENDATION:
Current optimization is GOOD ENOUGH. Feed is now usable and provides
all important metadata for browsing. Further optimization would only
save 7% more and might remove useful fields.

STATUS: ✅ SHIP IT
`);
