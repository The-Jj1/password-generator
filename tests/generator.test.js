import test from 'node:test';
import assert from 'node:assert/strict';
import { generatePassword, estimateStrength, randomIndex } from '../src/generator.js';

const all = { length: 20, uppercase: true, lowercase: true, numbers: true, symbols: true };

test('every selected character group is present, even at the minimum length', () => {
  for (let i = 0; i < 200; i++) {
    const password = generatePassword({ ...all, length: 4 });
    assert.equal(password.length, 4);
    for (const pattern of [/[A-Z]/, /[a-z]/, /[0-9]/, /[^A-Za-z0-9]/]) assert.match(password, pattern);
  }
});

test('all 15 group combinations use only their selected alphabet', () => {
  for (let mask = 1; mask < 16; mask++) {
    const options = { length: 64, uppercase: !!(mask & 1), lowercase: !!(mask & 2), numbers: !!(mask & 4), symbols: !!(mask & 8) };
    for (let i = 0; i < 30; i++) {
      const password = generatePassword(options);
      assert.equal(password.length, 64);
      assert.equal(/[A-Z]/.test(password), options.uppercase);
      assert.equal(/[a-z]/.test(password), options.lowercase);
      assert.equal(/[0-9]/.test(password), options.numbers);
      assert.equal(/[^A-Za-z0-9]/.test(password), options.symbols);
    }
  }
});

test('ambiguous characters are excluded when requested', () => {
  for (let i = 0; i < 100; i++) assert.doesNotMatch(generatePassword({ ...all, length: 64, excludeSimilar: true }), /[il1Lo0O]/);
});

test('invalid lengths and an empty selection are rejected', () => {
  for (const length of [0, 3, 65, 8.5, NaN, '16', undefined]) assert.throws(() => generatePassword({ ...all, length }), /length/i);
  assert.throws(() => generatePassword({ length: 16 }), /select/i);
});

test('secure random sampling rejects the biased tail before choosing an index', () => {
  const values = [255, 250, 249];
  const source = { getRandomValues: array => { array[0] = values.shift(); return array; } };
  assert.equal(randomIndex(10, source), 9);
  assert.equal(values.length, 0);
});

test('absence of Web Crypto fails closed', () => {
  assert.throws(() => generatePassword(all, {}), /secure random/i);
});

test('strength reflects the actual constrained search space', () => {
  const digits = estimateStrength({ length: 4, numbers: true });
  assert.ok(Math.abs(digits.bits - 13.2877123795) < 0.00001);
  assert.equal(digits.label, 'Weak');
  assert.equal(estimateStrength(all).label, 'Excellent');
  assert.ok(estimateStrength({ ...all, excludeSimilar: true }).bits < estimateStrength(all).bits);
  const twoGroups = estimateStrength({ length: 4, uppercase: true, lowercase: true });
  // 52^4 total strings minus 26^4 all-uppercase and 26^4 all-lowercase strings.
  assert.ok(Math.abs(twoGroups.bits - Math.log2(52 ** 4 - 2 * 26 ** 4)) < 0.00001);
});

test('fresh generations do not repeat in a practical sample', () => {
  assert.equal(new Set(Array.from({ length: 100 }, () => generatePassword(all))).size, 100);
});
