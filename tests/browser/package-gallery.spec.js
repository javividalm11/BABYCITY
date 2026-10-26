import { test, expect } from '@playwright/test';

test('package rows move in opposite directions and stop for reduced motion or interaction', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto('/');
  const gallery = page.locator('.package-gallery');
  const rows = gallery.locator('.package-lane');
  await expect(rows).toHaveCount(2);
  await gallery.scrollIntoViewIfNeeded();
  await page.mouse.move(0, 0);
  await expect.poll(() => rows.first().evaluate((el) => el.scrollLeft)).toBeGreaterThan(5);
  const before = await rows.evaluateAll((els) => els.map((el) => el.scrollLeft));
  await expect.poll(() => rows.last().evaluate((el) => el.scrollLeft)).toBeLessThan(before[1] - 3);
  expect(await rows.first().evaluate((el) => el.scrollLeft)).toBeGreaterThan(before[0]);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const pause = gallery.locator('[data-package-pause]');
  await expect(pause).toHaveText('Reanudar');
  const stopped = await rows.first().evaluate((el) => el.scrollLeft);
  await page.waitForTimeout(250);
  expect(await rows.first().evaluate((el) => el.scrollLeft)).toBe(stopped);
  await rows.first().focus();
  await page.keyboard.press('ArrowRight');
  expect(await rows.first().evaluate((el) => el.scrollLeft)).toBeGreaterThan(stopped);
  await expect(pause).toHaveText('Reanudar');
  const originals = gallery.locator('.package-group:not([inert]) img');
  expect(
    await originals.evaluateAll((images) => new Set(images.map((image) => image.src)).size),
  ).toBe(6);
  await originals.evaluateAll((images) =>
    Promise.all(
      images.map((image) => {
        image.loading = 'eager';
        return image.decode();
      }),
    ),
  );
  for (const width of [320, 390, 768, 1440, 1920]) {
    await page.setViewportSize({ width, height: 1000 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
  }
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
  await page.locator('.desktop-nav a[href="/servicios"]').click();
  await expect(gallery).toHaveCount(0);
  await page.locator('.site-brand').click();
  await expect(page.locator('.package-gallery')).toHaveCount(1);
});
