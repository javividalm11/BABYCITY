import { test, expect } from '@playwright/test';

test('package gallery slides, wraps, respects reduced motion and fits each viewport', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');
  const gallery = page.locator('.package-carousel');
  const track = gallery.locator('.customer-stories-track');
  const status = gallery.locator('[data-stories-status]');
  await expect(gallery.locator('figure')).toHaveCount(6);
  await expect(status).toHaveText('1–3 de 6');
  await expect(gallery.locator('[data-stories-pause]')).toHaveText('Reanudar');
  await gallery.locator('img').evaluateAll((images) =>
    Promise.all(
      images.map((image) => {
        image.loading = 'eager';
        return image.decode();
      }),
    ),
  );
  await gallery.locator('[data-stories-next]').click();
  await expect(status).toHaveText('4–6 de 6');
  await gallery.locator('[data-stories-next]').click();
  await expect(status).toHaveText('1–3 de 6');
  for (const [width, visible] of [
    [320, 1],
    [390, 1],
    [768, 2],
    [1440, 3],
  ]) {
    await page.setViewportSize({ width, height: 900 });
    await track.evaluate((element) => element.scrollTo({ left: 0, behavior: 'instant' }));
    await expect(status).toHaveText(`1–${visible} de 6`);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    await track.focus();
    await page.keyboard.press('ArrowRight');
    await expect(status).toHaveText(`${visible + 1}–${visible * 2} de 6`);
  }
  await gallery.locator('[data-stories-pause]').click();
  await expect(gallery.locator('[data-stories-pause]')).toHaveText('Pausar');
  await track.dispatchEvent('pointerdown');
  await expect(gallery.locator('[data-stories-pause]')).toHaveText('Reanudar');
  await page.locator('.desktop-nav a[href="/servicios"]').click();
  await expect(gallery).toHaveCount(0);
  await page.locator('.site-brand').click();
  await expect(page.locator('.package-carousel')).toHaveCount(1);
});
