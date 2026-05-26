const test = require('node:test');
const assert = require('node:assert/strict');

test('synchronous passing test', (t) => {
  assert.strictEqual(1,1);
});
