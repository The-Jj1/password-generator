/** Passwords are sampled uniformly from strings satisfying every selected group. */
const GROUPS = Object.freeze({
  uppercase: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
  lowercase: 'abcdefghijklmnopqrstuvwxyz',
  numbers: '0123456789',
  symbols: '!"#$%&\'()*+,-./:;<=>?@[\\]^_`{|}~',
});
const SIMILAR = /[il1Lo0O]/g;

function getGroups(options) {
  if (!Number.isInteger(options.length) || options.length < 4 || options.length > 64) {
    throw new RangeError('Password length must be a whole number between 4 and 64.');
  }
  const groups = Object.entries(GROUPS)
    .filter(([key]) => options[key])
    .map(([, characters]) => options.excludeSimilar ? characters.replace(SIMILAR, '') : characters);
  if (!groups.length) throw new RangeError('Select at least one character type.');
  return groups;
}

/** Discard the uneven tail instead of introducing modulo bias. */
export function randomIndex(max, source = globalThis.crypto) {
  if (!Number.isInteger(max) || max < 1 || max > 256) throw new RangeError('Invalid alphabet size.');
  if (typeof source?.getRandomValues !== 'function') throw new Error('A secure random source is unavailable.');
  const sample = new Uint8Array(1);
  const limit = 256 - (256 % max);
  for (let attempt = 0; attempt < 10000; attempt++) {
    source.getRandomValues(sample);
    if (sample[0] < limit) return sample[0] % max;
  }
  throw new Error('The secure random source did not produce a usable value.');
}

export function generatePassword(options, source = globalThis.crypto) {
  const groups = getGroups(options);
  const alphabet = groups.join('');
  for (let attempt = 0; attempt < 10000; attempt++) {
    const characters = Array.from({ length: options.length }, () => alphabet[randomIndex(alphabet.length, source)]);
    if (groups.every(group => characters.some(character => group.includes(character)))) return characters.join('');
  }
  throw new Error('Unable to generate a password. Please try again.');
}

/** Exact count with inclusion-exclusion; describes this generator, not human passwords. */
export function estimateStrength(options) {
  const groups = getGroups(options);
  const total = groups.reduce((sum, group) => sum + group.length, 0);
  let possibilities = 0n;
  for (let mask = 0; mask < (1 << groups.length); mask++) {
    let removed = 0;
    let size = total;
    groups.forEach((group, index) => {
      if (mask & (1 << index)) { size -= group.length; removed++; }
    });
    const count = BigInt(size) ** BigInt(options.length);
    possibilities += removed % 2 ? -count : count;
  }
  const bits = Math.log2(Number(possibilities));
  const level = bits < 40 ? 1 : bits < 60 ? 2 : bits < 80 ? 3 : 4;
  return { bits, level, label: ['Weak', 'Fair', 'Strong', 'Excellent'][level - 1] };
}
