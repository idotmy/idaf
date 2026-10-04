import assert from 'node:assert/strict';
import { test } from 'node:test';
import { runContractMathSuite } from './Marketplace.test.ts';

const results = runContractMathSuite();

test('contract math suite returns checks', () => {
  assert.ok(results.length > 0, 'No contract math checks were returned');
});

for (const result of results) {
  test(`${result.testNumber}. ${result.name}`, () => {
    assert.equal(result.passed, true, result.details);
  });
}