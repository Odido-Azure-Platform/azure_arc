import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { canonical, checkDeploymentContext, checkParameters, rejectDeletes, resolveStage } from '../../scripts/validation/deploy.mjs';

test('delivery accepts only fixed target/stage combinations', () => {
  assert.equal(resolveStage('governance', 'definitions').scope, 'mg');
  assert.equal(resolveStage('arc-we-rvit', 'connectivity').group, 'pls');
  assert.equal(resolveStage('arc-we-nrvit', 'maintenance').group, 'ops');
  for (const [target, stage] of [['../other', 'foundation'], ['governance', 'foundation'], ['arc-we-rvit', 'definitions'], ['arc-we-rvit', 'unknown']]) {
    assert.throws(() => resolveStage(target, stage));
  }
});

test('repository delivery has no CI environment dependency and workflow variables are authentication-only', () => {
  const helper = readFileSync(new URL('../../scripts/validation/deploy.mjs', import.meta.url), 'utf8');
  assert.ok(!helper.includes('process.env'));
  assert.ok(!helper.includes('GITHUB_'));
  const workflow = readFileSync(new URL('../../.github/workflows/arc-deploy.yml', import.meta.url), 'utf8');
  const authentication = new Set(['AZURE_CLIENT_ID', 'AZURE_TENANT_ID', 'AZURE_SUBSCRIPTION_ID']);
  for (const match of workflow.matchAll(/vars\.([A-Z_]+)/g)) assert.ok(authentication.has(match[1]), `Non-authentication workflow variable: ${match[1]}`);
});

test('delivery rejects wrong classes, unapproved billing and synthetic identifiers', () => {
  assert.throws(() => checkParameters('arc-we-rvit', 'foundation', { classification: { value: 'Non-RVIT' } }));
  assert.throws(() => checkParameters('arc-we-rvit', 'defender', { costApproved: { value: false } }));
  assert.throws(() => checkParameters('arc-we-rvit', 'rbac', { onboardingPrincipalId: { value: '11111111-1111-1111-1111-111111111111' } }));
  assert.throws(() => checkParameters('arc-we-rvit', 'rbac', { onboardingPrincipalId: { value: '00000000-0000-0000-0000-000000000000' } }));
  assert.throws(() => checkParameters('arc-we-rvit', 'associations', { machines: { value: [{ name: 'REQUIRED_MACHINE_NAME' }] } }));
  assert.doesNotThrow(() => checkParameters('arc-we-nrvit', 'foundation', { classification: { value: 'Non-RVIT' } }));
});

test('delivery context comes from compiled Bicep parameters and fails closed', () => {
  const values = {
    tenantId: '22222222-2222-2222-2222-222222222222',
    subscriptionId: '33333333-3333-3333-3333-333333333333',
    managementGroupId: 'approved-class-mg',
    location: 'westeurope',
    implementationReady: true,
  };
  const parameters = Object.fromEntries(Object.entries(values).map(([name, value]) => [name, { value }]));
  assert.deepEqual(checkDeploymentContext('arc-we-rvit', 'assignments', parameters), values);
  assert.throws(() => checkDeploymentContext('arc-we-rvit', 'foundation', { ...parameters, implementationReady: { value: false } }));
  assert.throws(() => checkDeploymentContext('arc-we-rvit', 'foundation', { ...parameters, subscriptionId: { value: '00000000-0000-0000-0000-000000000000' } }));
  assert.throws(() => checkDeploymentContext('governance', 'definitions', { ...parameters, managementGroupId: { value: 'REQUIRED_PARENT_MANAGEMENT_GROUP_ID' } }));
});

test('delivery rejects deletion previews and missing change lists', () => {
  assert.throws(() => rejectDeletes({ changes: [{ changeType: 'Delete' }] }));
  assert.throws(() => rejectDeletes({ error: { code: 'Failure' } }));
  assert.throws(() => rejectDeletes({}));
  assert.doesNotThrow(() => rejectDeletes({ changes: [{ changeType: 'Create' }] }));
});

test('reviewed bundle comparisons ignore object key ordering but preserve array order', () => {
  assert.deepEqual(canonical({ second: 2, first: { beta: 2, alpha: 1 } }), { first: { alpha: 1, beta: 2 }, second: 2 });
  assert.notDeepEqual(canonical([1, 2]), canonical([2, 1]));
});