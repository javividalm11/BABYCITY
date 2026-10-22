import { test, expect } from '@playwright/test';

test('quiet animations work without creating a WebGL context or canvas', async ({ page }) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.addInitScript(() => {
    window.webglRequests = 0;
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (type, ...args) {
      if (type.includes('webgl')) window.webglRequests++;
      return original.call(this, type, ...args);
    };
  });
  await page.goto('/?efectos=1');
  await expect(page.locator('body')).toHaveClass(/living-enabled/);
  await expect(page.locator('.living-canvas')).toHaveCount(0);
  expect(await page.evaluate(() => window.webglRequests)).toBe(0);
  const card = page.locator('.category-card').first();
  await card.scrollIntoViewIfNeeded();
  await card.hover();
  await expect(card).toHaveClass(/living-tilted/);
  await page.mouse.wheel(0, -160);
  await expect(page.locator('.site-header')).not.toHaveClass(/is-scroll-hidden/);
  await page.locator('.desktop-nav a[href="/tienda"]').click();
  await expect(page.locator('body')).not.toHaveClass(/living-enabled/);
  expect(errors).toEqual([]);
});

test('reduced motion and comparison mode disable the remaining animations', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await expect(page.locator('h1')).toBeVisible();
  await expect(page.locator('body')).not.toHaveClass(/living-enabled/);
  await expect(page.locator('canvas')).toHaveCount(0);
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('/?efectos=0');
  await expect(page.locator('body')).not.toHaveClass(/living-enabled/);
});
