import assert from 'node:assert/strict';
import test from 'node:test';
import { canonical, checkParameters, rejectDeletes, resolveStage } from '../../scripts/validation/deploy.mjs';

test('delivery accepts only fixed target/stage combinations', () => {
  assert.equal(resolveStage('governance', 'definitions').scope, 'mg');
  assert.equal(resolveStage('arc-we-rvit', 'connectivity').group, 'pls');
  assert.equal(resolveStage('arc-we-nrvit', 'maintenance').group, 'ops');
  for (const [target, stage] of [['../other', 'foundation'], ['governance', 'foundation'], ['arc-we-rvit', 'definitions'], ['arc-we-rvit', 'unknown']]) {
    assert.throws(() => resolveStage(target, stage));
  }
});

test('delivery rejects wrong classes, unapproved billing and synthetic identifiers', () => {
  assert.throws(() => checkParameters('arc-we-rvit', 'foundation', { classification: { value: 'Non-RVIT' } }));
  assert.throws(() => checkParameters('arc-we-rvit', 'defender', { costApproved: { value: false } }));
  assert.throws(() => checkParameters('arc-we-rvit', 'rbac', { onboardingPrincipalId: { value: '11111111-1111-1111-1111-111111111111' } }));
  assert.doesNotThrow(() => checkParameters('arc-we-nrvit', 'foundation', { classification: { value: 'Non-RVIT' } }));
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