#!/usr/bin/env node
import fetchAccountsByType from '../lib/dynamix.js';
import fs from 'fs';
import path from 'path';


import minimist from "minimist";

const rawDate = process.env.LAST_RUN;
const parsedDate = new Date(rawDate);

const lastRun = raw && !isNaN(parsedDate) 
  ? parsed 
  : new Date('2000-01-01T00:00:00Z');

const argv = minimist(process.argv.slice(2));

function parseIds(value, defaultValue = []) {
  if (!value) return defaultValue;

  const arr = Array.isArray(value) ? value : [value];

  return arr
    .flatMap(v => String(v).split(","))
    .map(v => parseInt(v.trim(), 10))
    .filter(Number.isFinite);
}

const accountTypeIds = parseIds(argv.types, [6, 8]);

console.log("Fetching accounts with membership status IDs:", accountTypeIds);
const rootDir = path.dirname(path.dirname(import.meta.url.replace('file:/', '')));
const outputDir = path.join(rootDir, 'docs');

const accountMap = {
  "8": "mem-institutions",
  "6,8": "mem-institutions",
  "6,8,100000000": "mem-sp-institutions",
};


// Ensure output directory exists
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}


async function crmToJson(accountTypeId) {
const accounts = await fetchAccountsByType(lastRun, accountTypeId);

const customValues = ["Amigos Library Services", "Non-member Exception"];

const jsonData = [
  ...accounts.value.map(account => ({
    label: account.name,
    value: account.accountid
  })),
  ...customValues.map(name => ({
    label: name,
    value: name
  }))
].sort((a, b) => a.label.localeCompare(b.label));

  //Write to JSON file
  const accountType = accountMap[accountTypeId];
  const jsonFileName =  accountType + '.json';
  const jsonOutputPath = path.join(outputDir, jsonFileName);
  fs.writeFileSync(jsonOutputPath, JSON.stringify(jsonData, null, 2));

  console.log(`✓ Fetched accounts and saved to ${jsonOutputPath}`);
}

crmToJson(accountTypeIds).catch(error => {
  console.error('Error fetching accounts:', error);
});

//console.log(`\nAll conversions complete!`);
