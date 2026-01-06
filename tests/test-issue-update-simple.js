#!/usr/bin/env node

/**
 * Test script for issue updates - determine minimal required fields
 *
 * Purpose:
 * - Test different combinations of fields to find what's required for updates
 * - Document API requirements
 *
 * Usage: node tests/test-issue-update-simple.js
 */

import { readFileSync } from 'fs';
import { homedir } from 'os';
import { join } from 'path';
import { TDXClient } from '../dist/client.js';
import { decodePassword } from '../dist/utils.js';

async function runTests() {
  console.log('=== TeamDynamix Issue Update Tests ===\n');

  const projectId = 441886;
  const issueId = 212936;
  const environment = 'prod';

  // Load credentials
  const credsPath = join(homedir(), '.config', 'tdx-mcp', `${environment}-credentials.json`);
  const creds = JSON.parse(readFileSync(credsPath, 'utf8'));

  const baseUrl = creds.TDX_BASE_URL;
  const username = creds.TDX_USERNAME;
  const password = await decodePassword(creds.TDX_PASSWORD);
  const appIds = (creds.TDX_PROJECT_APP_IDS || creds.TDX_TICKET_APP_IDS).split(',');

  console.log(`Environment: ${environment}`);
  console.log(`Base URL: ${baseUrl}`);
  console.log(`Project ID: ${projectId}`);
  console.log(`Issue ID: ${issueId}\n`);

  // Create client
  const client = new TDXClient(baseUrl, username, password, appIds);

  // Get current issue
  console.log('Fetching current issue state...');
  const currentIssue = await client.getIssue(projectId, issueId);
  console.log(`Current Status: ${currentIssue.StatusName} (ID: ${currentIssue.StatusID})`);
  console.log(`Current Responsible: ${currentIssue.ResponsibleFullName} (UID: ${currentIssue.ResponsibleUID})`);
  console.log(`Title: ${currentIssue.Title}`);
  console.log(`Category: ${currentIssue.CategoryName} (ID: ${currentIssue.CategoryID})`);
  console.log(`Priority: ${currentIssue.PriorityName} (ID: ${currentIssue.PriorityID})\n`);

  // Test cases
  const tests = [
    {
      name: 'Test 1: Minimal - Status + Responsible + Comments',
      data: {
        StatusID: 8820,
        ResponsibleUID: 'f67dc740-edfd-ec11-b47a-0003ff505262',
        Comments: 'Test update - changing status and assignee',
      },
    },
    {
      name: 'Test 2: With Title + Comments',
      data: {
        Title: currentIssue.Title,
        StatusID: 8820,
        ResponsibleUID: 'f67dc740-edfd-ec11-b47a-0003ff505262',
        Comments: 'Test update with title',
      },
    },
    {
      name: 'Test 3: With Title + Description + Comments',
      data: {
        Title: currentIssue.Title,
        Description: currentIssue.Description,
        StatusID: 8820,
        ResponsibleUID: 'f67dc740-edfd-ec11-b47a-0003ff505262',
        Comments: 'Test update with title and description',
      },
    },
    {
      name: 'Test 4: With Title + Description + Category + Comments',
      data: {
        Title: currentIssue.Title,
        Description: currentIssue.Description,
        CategoryID: currentIssue.CategoryID,
        StatusID: 8820,
        ResponsibleUID: 'f67dc740-edfd-ec11-b47a-0003ff505262',
        Comments: 'Test update with title, description, and category',
      },
    },
    {
      name: 'Test 5: Full required fields + Comments',
      data: {
        Title: currentIssue.Title,
        Description: currentIssue.Description,
        CategoryID: currentIssue.CategoryID,
        PriorityID: currentIssue.PriorityID,
        StatusID: 8820,
        ResponsibleUID: 'f67dc740-edfd-ec11-b47a-0003ff505262',
        Comments: 'Test update with all fields',
      },
    },
  ];

  console.log('Running update tests...\n');
  console.log('='.repeat(80));

  const results = [];
  const resetData = {
    Title: currentIssue.Title,
    Description: currentIssue.Description,
    CategoryID: currentIssue.CategoryID,
    PriorityID: currentIssue.PriorityID,
    StatusID: currentIssue.StatusID,
    ResponsibleUID: currentIssue.ResponsibleUID,
    Comments: 'Reset to original state after test',
  };

  for (const test of tests) {
    console.log(`\n${test.name}`);
    console.log('Payload:', JSON.stringify(test.data, null, 2));
    console.log('-'.repeat(80));

    try {
      const result = await client.updateIssue(projectId, issueId, test.data);

      console.log('✓ SUCCESS');
      console.log(`  Updated Status: ${result.StatusName} (ID: ${result.StatusID})`);
      console.log(`  Updated Responsible: ${result.ResponsibleFullName} (UID: ${result.ResponsibleUID})`);

      results.push({ test: test.name, success: true, payload: test.data });

      // Reset to original state
      console.log('\n  Resetting...');
      await client.updateIssue(projectId, issueId, resetData);
      console.log('  ✓ Reset complete');

    } catch (error) {
      console.log('✗ FAILED');
      console.log(`  Error: ${error.message}`);
      if (error.response) {
        console.log(`  Status: ${error.response.status} ${error.response.statusText}`);
        if (error.response.data) {
          console.log(`  Data:`, error.response.data);
        }
      }

      results.push({ test: test.name, success: false, error: error.message, payload: test.data });
    }

    await new Promise(resolve => setTimeout(resolve, 300));
  }

  console.log('\n' + '='.repeat(80));
  console.log('\n=== Test Results Summary ===\n');

  let firstSuccess = null;
  for (const result of results) {
    const icon = result.success ? '✓' : '✗';
    console.log(`${icon} ${result.test}`);
    if (result.success && !firstSuccess) {
      firstSuccess = result;
    }
  }

  console.log('\n=== Analysis ===\n');

  if (firstSuccess) {
    console.log('✓ Minimum required fields for issue updates:');
    console.log(JSON.stringify(firstSuccess.payload, null, 2));
    console.log(`\nFields count: ${Object.keys(firstSuccess.payload).length}`);

    // Document findings
    console.log('\n📝 Documentation Update:');
    console.log('The TeamDynamix API requires the following fields to update an issue:');
    Object.keys(firstSuccess.payload).forEach(field => {
      console.log(`  - ${field}`);
    });
  } else {
    console.log('✗ All tests failed. Issue updates may require additional fields');
    console.log('or there may be a permission/authentication issue.');
  }

  // Verify final state
  console.log('\n=== Verification ===\n');
  const finalIssue = await client.getIssue(projectId, issueId);
  const matches =
    finalIssue.StatusID === currentIssue.StatusID &&
    finalIssue.ResponsibleUID === currentIssue.ResponsibleUID;

  if (matches) {
    console.log('✓ Issue successfully reset to original state');
  } else {
    console.log('⚠ Issue state differs from original:');
    console.log(`  Expected: Status=${currentIssue.StatusID}, Responsible=${currentIssue.ResponsibleUID}`);
    console.log(`  Actual: Status=${finalIssue.StatusID}, Responsible=${finalIssue.ResponsibleUID}`);
  }

  console.log('\n=== Tests Complete ===\n');
}

runTests().catch(err => {
  console.error('\nError:', err.message);
  if (err.stack) console.error(err.stack);
  process.exit(1);
});
