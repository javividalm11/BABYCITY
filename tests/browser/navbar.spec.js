import { test, expect } from '@playwright/test';

test('navbar has one cart icon and each click adds exactly one product', async ({ page }) => {
  const errors = [],
    modules = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('request', (r) => {
    if (/\/js\/main\.js(?:\?|$)/.test(r.url())) modules.push(r.url());
  });
  await page.goto('/');
  await expect(page.locator('.showcase-card')).toHaveCount(4);
  await expect(page.locator('#cartButton > svg')).toHaveCount(1);
  await expect(page.locator('#cartCount')).toHaveCount(1);
  expect(modules).toHaveLength(1);
  await page.locator('[data-add]').first().click();
  await expect(page.locator('#cartCount')).toHaveText('1');
  await page.reload();
  await expect(page.locator('#cartCount')).toHaveText('1');
  await expect(page.locator('#cartButton > svg')).toHaveCount(1);
  await page.locator('#cartButton').click();
  await expect(page.locator('#cartDialog')).toBeVisible();
  await expect(page.locator('.cart-item')).toHaveCount(1);
  expect(errors).toEqual([]);
});
