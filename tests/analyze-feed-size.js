/**
 * Analyze Feed Entry Size
 *
 * Break down a single feed entry to see what's consuming space
 */

// Sample feed entry from actual response
const feedEntry = {
  "ID": 220572975,
  "CreatedUid": "6da16b1a-4dd8-eb11-a7ad-0050f2eef4a7",
  "CreatedRefID": 12213578,
  "CreatedFullName": "Kelsie Curtis",
  "CreatedFirstName": "Kelsie",
  "CreatedLastName": "Curtis",
  "CreatedByPicPath": "6DA16B1A-4DD8-EB11-A7AD-0050F2EEF4A7-637612479935022004.jpeg",
  "CreatedDate": "2025-11-03T19:50:49.683Z",
  "LastUpdatedDate": "2025-11-03T19:50:49.683Z",
  "ProjectID": 433846,
  "ProjectName": "1. Sample Readiness Project",
  "PlanID": 0,
  "PlanName": null,
  "ItemType": 1,
  "ItemID": 0,
  "ItemTitle": "1. Sample Readiness Project",
  "ReferenceID": null,
  "IsRichHtml": false,
  "UpdateType": 3,
  "NotifiedList": "Jessica Reinhardt <jessica.reinhardt@teamdynamix.com>, Nick Pearson <nick.pearson@teamdynamix.com>",
  "IsPrivate": false,
  "IsParent": false,
  "Replies": [],
  "RepliesCount": 0,
  "Likes": [],
  "ILike": false,
  "LikesCount": 0,
  "IsCommunication": true,
  "Participants": null,
  "BreadcrumbsHtml": null,
  "HasAttachment": false,
  "Uri": "api/feed/220572975",
  "BodyPreview": "Made Jessica Reinhardt, Nick Pearson alternate managers. Changed alternate managers from Aaron Sanfo..."
};

console.log('Feed Entry Size Analysis');
console.log('='.repeat(80));

const totalSize = JSON.stringify(feedEntry).length;
console.log(`Total Size: ${totalSize} bytes\n`);

const fieldSizes = [];
for (const [key, value] of Object.entries(feedEntry)) {
  const size = JSON.stringify(value).length;
  const type = Array.isArray(value) ? `array[${value.length}]` : typeof value;
  fieldSizes.push({ key, size, type, value });
}

// Sort by size descending
fieldSizes.sort((a, b) => b.size - a.size);

console.log('Fields by Size:');
console.log('-'.repeat(80));
fieldSizes.forEach(({ key, size, type }) => {
  const percentage = ((size / totalSize) * 100).toFixed(1);
  console.log(`${key.padEnd(25)} ${size.toString().padStart(4)} bytes  ${percentage.padStart(5)}%  [${type}]`);
});

console.log('\n' + '='.repeat(80));
console.log('Analysis:');
console.log('='.repeat(80));

const emptyArrays = fieldSizes.filter(f => f.type.startsWith('array[0]'));
const emptyArraySize = emptyArrays.reduce((sum, f) => sum + f.size, 0);

console.log(`\nEmpty Arrays: ${emptyArrays.length}`);
emptyArrays.forEach(f => console.log(`  - ${f.key}`));
console.log(`Empty Array Size: ${emptyArraySize} bytes (${((emptyArraySize / totalSize) * 100).toFixed(1)}%)`);

const nullFields = fieldSizes.filter(f => f.value === null);
const nullSize = nullFields.reduce((sum, f) => sum + f.size, 0);

console.log(`\nNull Fields: ${nullFields.length}`);
nullFields.forEach(f => console.log(`  - ${f.key}`));
console.log(`Null Size: ${nullSize} bytes (${((nullSize / totalSize) * 100).toFixed(1)}%)`);

console.log(`\nRemovable Overhead: ${emptyArraySize + nullSize} bytes (${((emptyArraySize + nullSize) / totalSize * 100).toFixed(1)}%)`);
console.log(`Potential Optimized Size: ${totalSize - emptyArraySize - nullSize} bytes`);

console.log('\n' + '='.repeat(80));
console.log('Recommendations:');
console.log('='.repeat(80));
console.log(`
1. REMOVE empty arrays: Replies, Likes, Participants
   - Saves: ${emptyArraySize} bytes per entry (${((emptyArraySize / totalSize) * 100).toFixed(1)}%)

2. REMOVE null fields: PlanName, ReferenceID, Participants, BreadcrumbsHtml
   - Saves: ${nullSize} bytes per entry (${((nullSize / totalSize) * 100).toFixed(1)}%)

3. KEEP important metadata:
   - User info (Created*, for attribution)
   - IDs (for navigation)
   - BodyPreview (the actual content preview)
   - Flags (IsPrivate, HasAttachment, etc.)

Total potential savings: ${((emptyArraySize + nullSize) / totalSize * 100).toFixed(1)}% per entry
For 49 entries: ${(emptyArraySize + nullSize) * 49} bytes (${((emptyArraySize + nullSize) * 49 / 1024).toFixed(1)}KB)
`);
