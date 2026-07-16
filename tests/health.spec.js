const { test, expect } = require('@playwright/test');

test('health endpoint reports that the app is ready', async ({ request }) => {
  const response = await request.get('/health');

  expect(response.ok()).toBeTruthy();
  await expect(response.json()).resolves.toEqual({ status: 'ok' });
});

test('home page shows the Cascade dashboard', async ({ page }) => {
  await page.goto('/');

  await expect(page).toHaveTitle('Cascade');
  await expect(page.getByRole('heading', { name: 'Cascade' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Add a task' })).toBeVisible();
});

test('unknown endpoints return 404', async ({ request }) => {
  const response = await request.get('/not-a-real-page');

  expect(response.status()).toBe(404);
});
