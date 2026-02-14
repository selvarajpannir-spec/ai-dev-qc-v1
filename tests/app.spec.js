import { test, expect } from '@playwright/test';

test('basic calculation works', async ({ page }) => {
  await page.goto('file://' + process.cwd() + '/project/index.html');

  await page.fill('#price', '100');
  await page.fill('#quantity', '2');
  await page.click('#calculate');

  await expect(page.locator('#total')).toHaveText('200');
});
