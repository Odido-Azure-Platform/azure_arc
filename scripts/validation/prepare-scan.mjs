import assert from 'node:assert/strict';
import { mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const [inputDirectory, outputDirectory] = process.argv.slice(2);
assert.ok(inputDirectory && outputDirectory, 'Usage: prepare-scan.mjs compiled-directory scan-directory');
assert.notEqual(path.resolve(inputDirectory), path.resolve(outputDirectory));
mkdirSync(outputDirectory, { recursive: true });
assert.equal(readdirSync(outputDirectory).length, 0, 'Use an empty scan-only output directory');
let templateCount = 0;
let resourceCount = 0;

function emit(template, label, overrides = {}) {
  assert.ok(template && typeof template === 'object', `Unresolved template: ${label}`);
  const scan = structuredClone(template);
  scan.resources = Array.isArray(scan.resources) ? scan.resources : Object.values(scan.resources || {});
  for (const [name, setting] of Object.entries(overrides)) {
    const value = setting?.value;
    if (scan.parameters?.[name] && value !== undefined && !(typeof value === 'string' && value.startsWith('['))) {
      scan.parameters[name].defaultValue = value;
    }
  }
  for (const resource of scan.resources) {
    if (resource.type !== 'Microsoft.Resources/deployments') resourceCount++;
    let child = resource.properties?.template;
    if (child === undefined) continue;
    if (typeof child === 'string') {
      const variable = child.match(/^\[variables\('([^']+)'\)\]$/);
      assert.ok(variable, `Unsupported nested template expression: ${child}`);
      child = scan.variables?.[variable[1]];
    }
    emit(child, label, resource.properties.parameters);
  }
  const filename = `${String(templateCount++).padStart(3, '0')}-${label}`;
  writeFileSync(path.join(outputDirectory, filename), `${JSON.stringify(scan, null, 2)}\n`);
}

for (const filename of readdirSync(inputDirectory).filter(file => file.endsWith('.json'))) {
  emit(JSON.parse(readFileSync(path.join(inputDirectory, filename), 'utf8')), filename);
}
assert.ok(resourceCount > 0, 'No resources available for scanning');
console.log(`Prepared ${templateCount} scan-only templates containing ${resourceCount} resource declarations.`);
console.log('Scan-only symbolic-map conversion is NOT a deployable ARM bundle and does not evaluate arbitrary ARM expressions.');