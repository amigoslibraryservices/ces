#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

// Get the parent directory (root of the project)
const rootDir = path.dirname(__dirname);
const inputDir = path.join(rootDir, 'input');
const outputDir = path.join(rootDir, 'docs');

// Ensure output directory exists
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Get all YAML files in the input directory
const yamlFiles = fs.readdirSync(inputDir).filter(file => file.endsWith('.yaml') || file.endsWith('.yml'));

if (yamlFiles.length === 0) {
  console.log('No YAML files found in input directory');
  process.exit(0);
}

// Process each YAML file
yamlFiles.forEach(yamlFile => {
  const yamlPath = path.join(inputDir, yamlFile);
  const jsonFileName = yamlFile.replace(/\.(yaml|yml)$/, '.json');
  const jsonOutputPath = path.join(outputDir, jsonFileName);

  try {
    const yamlContent = fs.readFileSync(yamlPath, 'utf8');

    // Parse YAML
    const values = yaml.load(yamlContent);

    // Convert to the original JSON structure, sorted alphabetically
    const jsonData = values
      .sort()
      .map(value => ({
        label: value,
        value: value
      }));

    // Write to JSON file
    fs.writeFileSync(jsonOutputPath, JSON.stringify(jsonData, null, 2));

    console.log(`✓ Converted ${yamlFile} → ${jsonFileName} (${jsonData.length} entries)`);
  } catch (error) {
    console.error(`✗ Error processing ${yamlFile}:`, error.message);
  }
});

console.log(`\nAll conversions complete!`);
