import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const directory = process.env.ARC_COMPILED_DIR;
assert.ok(directory, 'Run through the local validator');
function template(relative) {
  return JSON.parse(readFileSync(path.join(directory, `bicep__solutions__azure__${relative.replaceAll('/', '__')}.json`), 'utf8'));
}

test('workspace and DCE modules receive explicit private-only access controls', () => {
  const monitoring = template('platform/monitoring/monitoring');
  const workspace = monitoring.resources.workspace.properties.parameters;
  assert.equal(workspace.publicNetworkAccessForIngestion.value, 'Disabled');
  assert.equal(workspace.publicNetworkAccessForQuery.value, 'Disabled');
  assert.equal(workspace.features.value.disableLocalAuth, true);
  assert.equal(workspace.features.value.enableLogAccessUsingOnlyResourcePermissions, false);
  assert.equal(monitoring.resources.endpoints.properties.parameters.publicNetworkAccess.value, 'Disabled');
});

test('Arc and Monitor scopes have no configured public fallback', () => {
  const arc = template('infrastructure/connectivity/modules/arc-private-link-scope');
  const scope = Object.values(arc.resources).find(resource => resource.type === 'Microsoft.HybridCompute/privateLinkScopes');
  assert.equal(scope.properties.publicNetworkAccess, 'Disabled');
  const connectivity = template('infrastructure/connectivity/connectivity');
  const modes = connectivity.resources.monitorScope.properties.parameters.accessModeSettings.value;
  assert.equal(modes.ingestionAccessMode, 'PrivateOnly');
  assert.equal(modes.queryAccessMode, 'PrivateOnly');
});

test('patch targeting is disabled by default and requires class AND ring', () => {
  const maintenance = template('platform/maintenance/maintenance');
  assert.equal(maintenance.parameters.enableAssignment.defaultValue, false);
  const filter = maintenance.resources.assignment.properties.parameters.filter.value;
  assert.equal(filter.tagSettings.filterOperator, 'All');
  assert.ok(Object.hasOwn(filter.tagSettings.tags, 'cmdb.Security.Class'));
  assert.ok(Object.hasOwn(filter.tagSettings.tags, 'PatchRing'));
  assert.deepEqual(filter.resourceTypes, ['Microsoft.HybridCompute/machines']);
});

test('Defender does not enable agentless VM scanning or bypass cost approval', () => {
  const defender = template('security/defender-for-servers/defender-for-servers');
  assert.equal(defender.resources.servers.condition, "[parameters('costApproved')]");
  assert.equal(defender.resources.servers.properties.extensions, undefined);
});