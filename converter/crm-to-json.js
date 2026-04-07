#!/usr/bin/env node
import fetchAccountsByType from '../lib/dynamix.js';
import fs from 'fs';
import path from 'path';

const rootDir = path.dirname(path.dirname(import.meta.url.replace('file:/', '')));
const outputDir = path.join(rootDir, 'docs/crm');

const accountMap = {
  "6,8": "institutions",
  "100000000": "inst-sp",
};


// Ensure output directory exists
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}


async function crmToJson(accountTypeId) {
  const accounts = await fetchAccountsByType(accountTypeId);
  console.log(accounts);
 const jsonData = [...accounts.value]
  .sort((a, b) => a.name.localeCompare(b.name))
  .map(account => ({
    label: account.name,
    value: account.accountid
  }));

  console.log(outputDir);
  //Write to JSON file
  const accountType = accountMap[accountTypeId];
  const jsonFileName =  accountType + '.json';
  const jsonOutputPath = path.join(outputDir, jsonFileName);
  fs.writeFileSync(jsonOutputPath, JSON.stringify(jsonData, null, 2));

  console.log(`✓ Fetched accounts and saved to ${jsonOutputPath}`);
}

crmToJson([6, 8]).catch(error => {
  console.error('Error fetching accounts:', error);
});

//console.log(`\nAll conversions complete!`);
