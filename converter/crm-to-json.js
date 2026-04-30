#!/usr/bin/env node
import fetchAccountsByType from '../lib/dynamix.js';
import fs from 'fs';
import path from 'path';


import minimist from "minimist";

const lastRun = process.env.LAST_RUN ?? null;

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


const customValues = ["Amigos Library Services", "Non-member Exception"];

async function crmToJson(accountTypeId) {
  const { updated, removed } = await fetchAccountsByType(accountTypeId, lastRun);

  const accountType = accountMap[accountTypeId];
  const jsonFileName = accountType + '.json';
  const jsonOutputPath = path.join(outputDir, jsonFileName);

  const existing = fs.existsSync(jsonOutputPath)
    ? JSON.parse(fs.readFileSync(jsonOutputPath, 'utf8'))
    : [];
  const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  const byId = Object.fromEntries(
    existing
      .filter(e => isUUID.test(e.value))
      .map(e => [e.value, e])
  );

  for (const account of updated.value) {
    byId[account.accountid] = { label: account.name, value: account.accountid };
  }
  for (const account of removed.value) {
    delete byId[account.accountid];
  }

  const jsonData = [
    ...Object.values(byId),
    ...customValues.map(name => ({ label: name, value: name })),
  ].sort((a, b) => a.label.localeCompare(b.label));

  fs.writeFileSync(jsonOutputPath, JSON.stringify(jsonData, null, 2));

  const action = lastRun ? `upserted ${updated.value.length} / removed ${removed.value.length}` : `full rebuild, ${updated.value.length} accounts`;
  console.log(`✓ ${jsonOutputPath} — ${action}`);
}

crmToJson(accountTypeIds).catch(error => {
  console.error('Error fetching accounts:', error);
});

//console.log(`\nAll conversions complete!`);
