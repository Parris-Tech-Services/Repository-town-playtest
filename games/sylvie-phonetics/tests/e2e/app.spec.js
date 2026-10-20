const { test, expect } = require('@playwright/test');

test('SylviePhonetics homepage loads correctly', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/Sylvie's Phonics Adventure/i);
});
