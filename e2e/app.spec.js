import { test, expect } from '@playwright/test';

test('generates, regenerates, and clears stale results on settings changes', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('button', { name: 'Copy password', exact: true })).toBeDisabled();
  await page.getByRole('button', { name: 'Generate password', exact: true }).click();
  const first = await page.getByRole('textbox', { name: 'Generated password', exact: true }).inputValue();
  expect(first).toHaveLength(16);
  await expect(page.locator('#strength-label')).toHaveText('Excellent');
  await page.getByRole('button', { name: 'Generate password', exact: true }).click();
  expect(await page.locator('#password').inputValue()).not.toBe(first);
  await page.getByRole('button', { name: 'Increase password length' }).click();
  await expect(page.locator('#length-value')).toHaveText('17');
  await expect(page.locator('#password')).toHaveValue('');
  await expect(page.getByRole('button', { name: 'Copy password', exact: true })).toBeDisabled();
});

test('empty selection is recoverable, and digits-only generates the correct alphabet', async ({ page }) => {
  await page.goto('/');
  for (const name of ['uppercase', 'lowercase', 'numbers', 'symbols']) await page.locator(`[name=${name}]`).uncheck();
  await expect(page.getByRole('button', { name: 'Generate password', exact: true })).toBeDisabled();
  await expect(page.getByRole('status', { name: 'Generator status' })).toContainText('Select at least one');
  await page.locator('[name=numbers]').check();
  await page.getByRole('button', { name: 'Generate password', exact: true }).click();
  expect(await page.locator('#password').inputValue()).toMatch(/^\d{16}$/);
});

test('range works from the keyboard and reaches both bounds', async ({ page }) => {
  await page.goto('/');
  const range = page.getByRole('slider', { name: 'Password length' });
  await range.focus();
  await page.keyboard.press('Home');
  await expect(range).toHaveValue('4');
  await expect(page.getByRole('button', { name: 'Decrease password length' })).toBeDisabled();
  await page.keyboard.press('End');
  await expect(range).toHaveValue('64');
  await expect(page.getByRole('button', { name: 'Increase password length' })).toBeDisabled();
  await page.getByRole('button', { name: 'Generate password', exact: true }).click();
  expect(await page.locator('#password').inputValue()).toHaveLength(64);
});

test('copy writes the current password to the real browser clipboard', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.goto('/');
  await page.getByRole('button', { name: 'Generate password', exact: true }).click();
  const value = await page.locator('#password').inputValue();
  await page.getByRole('button', { name: 'Copy password', exact: true }).click();
  await expect(page.getByRole('status', { name: 'Generator status' })).toHaveText('Password copied to clipboard.');
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(value);
});

test('clipboard refusal offers manual copy without losing the password', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'clipboard', { value: { writeText: async () => { throw new DOMException('Denied', 'NotAllowedError'); } } });
  });
  await page.goto('/');
  await page.getByRole('button', { name: 'Generate password', exact: true }).click();
  const value = await page.locator('#password').inputValue();
  await page.getByRole('button', { name: 'Copy password', exact: true }).click();
  await expect(page.getByRole('status', { name: 'Generator status' })).toContainText('press Ctrl+C');
  expect(await page.locator('#password').inputValue()).toBe(value);
  expect(await page.locator('#password').evaluate(input => input.selectionEnd - input.selectionStart)).toBe(16);
});

test('secure randomness failure never returns a weak fallback', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, 'crypto', { value: {} });
  });
  await page.goto('/');
  await page.getByRole('button', { name: 'Generate password', exact: true }).click();
  await expect(page.getByRole('status', { name: 'Generator status' })).toContainText('secure random source is unavailable');
  await expect(page.locator('#password')).toHaveValue('');
  await expect(page.getByRole('button', { name: 'Copy password', exact: true })).toBeDisabled();
});

for (const width of [320, 390, 768, 1440]) {
  test(`layout stays within the viewport at ${width}px with a long password`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto('/');
    await page.locator('#length').focus();
    await page.keyboard.press('End');
    await page.getByRole('button', { name: 'Generate password', exact: true }).click();
    expect(await page.locator('#password').inputValue()).toHaveLength(64);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    expect(errors).toEqual([]);
  });
}

test('generating sends no requests and persists no passwords', async ({ page }) => {
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  const requests = [];
  page.on('request', request => requests.push(request.url()));
  for (let i = 0; i < 5; i++) await page.getByRole('button', { name: 'Generate password', exact: true }).click();
  expect(requests).toEqual([]);
  expect(await page.evaluate(() => ({ local: localStorage.length, session: sessionStorage.length, cookies: document.cookie }))).toEqual({ local: 0, session: 0, cookies: '' });
});
