import { generatePassword, estimateStrength } from './generator.js';

const form = document.querySelector('#settings');
const length = document.querySelector('#length');
const lengthValue = document.querySelector('#length-value');
const password = document.querySelector('#password');
const copyButton = document.querySelector('#copy');
const generateButton = document.querySelector('#generate');
const message = document.querySelector('#message');
const resultState = document.querySelector('#result-state');
const strength = document.querySelector('.strength');
let copyTimer;
let generation = 0;

function options() {
  const data = new FormData(form);
  return {
    length: Number(length.value),
    ...Object.fromEntries(['uppercase', 'lowercase', 'numbers', 'symbols', 'excludeSimilar'].map(key => [key, data.has(key)])),
  };
}

function resetCopy() {
  clearTimeout(copyTimer);
  copyButton.classList.remove('copied');
  copyButton.setAttribute('aria-label', 'Copy password');
  copyButton.title = 'Copy password';
}

function updateSettings() {
  generation++;
  lengthValue.value = length.value;
  document.querySelector('#decrease').disabled = length.value === length.min;
  document.querySelector('#increase').disabled = length.value === length.max;
  const selected = Object.entries(options()).some(([key, value]) => ['uppercase', 'lowercase', 'numbers', 'symbols'].includes(key) && value);
  generateButton.disabled = !selected;
  password.value = '';
  copyButton.disabled = true;
  resetCopy();
  strength.removeAttribute('data-level');
  document.querySelector('#strength-label').textContent = '—';
  document.querySelector('#strength-detail').textContent = 'Generate a password to check its strength';
  resultState.textContent = 'READY TO GENERATE';
  message.textContent = selected ? '' : 'Select at least one character type to continue.';
  message.classList.toggle('error', !selected);
}

form.addEventListener('input', updateSettings);
for (const [id, direction] of [['decrease', -1], ['increase', 1]]) {
  document.querySelector(`#${id}`).addEventListener('click', () => {
    length.value = String(Math.max(4, Math.min(64, Number(length.value) + direction)));
    updateSettings();
  });
}

form.addEventListener('submit', event => {
  event.preventDefault();
  try {
    const settings = options();
    const nextPassword = generatePassword(settings);
    const estimate = estimateStrength(settings);
    generation++;
    resetCopy();
    password.value = nextPassword;
    copyButton.disabled = false;
    resultState.textContent = 'FRESHLY GENERATED';
    strength.dataset.level = String(estimate.level);
    document.querySelector('#strength-label').textContent = estimate.label;
    document.querySelector('#strength-detail').textContent = `${Math.floor(estimate.bits)} bits of entropy · ${settings.length} characters`;
    message.classList.remove('error');
    message.textContent = `New ${settings.length}-character password generated. Strength: ${estimate.label.toLowerCase()}.`;
  } catch (error) {
    password.value = '';
    copyButton.disabled = true;
    strength.removeAttribute('data-level');
    document.querySelector('#strength-label').textContent = '—';
    document.querySelector('#strength-detail').textContent = 'Generate a password to check its strength';
    resultState.textContent = 'GENERATION UNAVAILABLE';
    message.classList.add('error');
    message.textContent = error.message;
  }
});

copyButton.addEventListener('click', async () => {
  if (!password.value) return;
  const currentGeneration = generation;
  const value = password.value;
  try {
    if (!navigator.clipboard?.writeText) throw new Error('Clipboard unavailable');
    await navigator.clipboard.writeText(value);
    if (generation !== currentGeneration) return;
    copyButton.classList.add('copied');
    copyButton.setAttribute('aria-label', 'Password copied');
    copyButton.title = 'Password copied';
    message.classList.remove('error');
    message.textContent = 'Password copied to clipboard.';
    copyTimer = setTimeout(resetCopy, 2000);
  } catch {
    if (generation !== currentGeneration) return;
    password.focus();
    password.select();
    message.classList.add('error');
    message.textContent = 'Clipboard access is unavailable. Your password is selected; press Ctrl+C or ⌘C to copy.';
  }
});

password.addEventListener('click', () => password.select());
updateSettings();
