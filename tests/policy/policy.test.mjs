import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const compiledDirectory = process.env.ARC_COMPILED_DIR;
assert.ok(compiledDirectory, 'Run tests through node scripts/validation/validate.mjs');
const template = JSON.parse(readFileSync(path.join(compiledDirectory, 'bicep__solutions__azure__platform__governance__policy__definitions.json'), 'utf8'));
const controls = template.variables.controls;
const aliases = {
  'Microsoft.HybridCompute/machines/extensions/publisher': 'publisher',
  'Microsoft.HybridCompute/machines/extensions/type': 'extensionType',
  'Microsoft.HybridCompute/machines/privateLinkScopeResourceId': 'privateScope',
};

function expression(value, resource, parameters) {
  if (typeof value !== 'string') return value;
  const literal = value.startsWith('[[') ? value.slice(1) : value;
  const parameter = literal.match(/^\[parameters\('([^']+)'\)\]$/);
  if (parameter) return parameters[parameter[1]];
  if (literal.startsWith('[concat(')) {
    assert.equal(literal, "[concat(field('Microsoft.HybridCompute/machines/extensions/publisher'), '/', field('Microsoft.HybridCompute/machines/extensions/type'))]");
    return `${resource.publisher || ''}/${resource.extensionType || ''}`;
  }
  return literal;
}

function violates(condition, resource, parameters) {
  if (condition.allOf) return condition.allOf.every(child => violates(child, resource, parameters));
  let actual;
  if (condition.field) {
    const tag = condition.field.match(/^tags\['([^']+)'\]$/);
    actual = tag ? resource.tags?.[tag[1]] : resource[aliases[condition.field] || condition.field];
  } else {
    actual = expression(condition.value, resource, parameters);
  }
  for (const operator of ['equals', 'notEquals', 'notIn']) {
    if (!(operator in condition)) continue;
    const expected = expression(condition[operator], resource, parameters);
    const normalized = value => typeof value === 'string' ? value.toLowerCase() : value;
    if (operator === 'equals') return normalized(actual) === normalized(expected);
    if (operator === 'notEquals') return normalized(actual) !== normalized(expected);
    return !expected.map(normalized).includes(normalized(actual));
  }
  throw new Error(`Unsupported policy test condition: ${JSON.stringify(condition)}`);
}

const machine = { type: 'Microsoft.HybridCompute/machines' };
const extension = { type: 'Microsoft.HybridCompute/machines/extensions' };

for (const classification of ['RVIT', 'Non-RVIT']) {
  test(`${classification}: reject missing, invalid and opposite class tags`, () => {
    const parameters = { expectedClass: classification };
    assert.equal(violates(controls[0].condition, machine, parameters), true);
    for (const wrong of ['unknown', classification === 'RVIT' ? 'Non-RVIT' : 'RVIT']) {
      assert.equal(violates(controls[0].condition, { ...machine, tags: { 'cmdb.Security.Class': wrong } }, parameters), true);
    }
    assert.equal(violates(controls[0].condition, { ...machine, tags: { 'cmdb.Security.Class': classification } }, parameters), false);
  });
}

test('extension policy checks both publisher and type', () => {
  const parameters = { allowedExtensions: ['Microsoft.Azure.Monitor/AzureMonitorWindowsAgent'] };
  const approved = { ...extension, publisher: 'Microsoft.Azure.Monitor', extensionType: 'AzureMonitorWindowsAgent' };
  assert.equal(violates(controls[1].condition, approved, parameters), false);
  assert.equal(violates(controls[1].condition, { ...approved, publisher: 'Untrusted' }, parameters), true);
  assert.equal(violates(controls[1].condition, { ...approved, extensionType: 'CustomScript' }, parameters), true);
  assert.equal(violates(controls[1].condition, machine, parameters), false);
});

test('private scope rejects missing or different scope IDs', () => {
  const parameters = { privateLinkScopeResourceId: '/approved/arc-scope' };
  assert.equal(violates(controls[2].condition, machine, parameters), true);
  assert.equal(violates(controls[2].condition, { ...machine, privateScope: '/other/arc-scope' }, parameters), true);
  assert.equal(violates(controls[2].condition, { ...machine, privateScope: '/approved/arc-scope' }, parameters), false);
});

test('definitions evaluate child extensions and allow only direct-property effects', () => {
  assert.equal(template.resources[0].properties.mode, 'All');
  assert.deepEqual(template.variables.effectParameter.allowedValues, ['Audit', 'Deny', 'Disabled']);
  assert.equal(template.variables.effectParameter.defaultValue, 'Audit');
});