import { test, expect } from '@playwright/test';

test('collections search and category filters keep original reader and PDF destinations', async ({
  page,
}) => {
  await page.goto('/catalogos');
  await expect(page.locator('.catalog-card:visible')).toHaveCount(12);
  await page.getByRole('button', { name: 'Coches', exact: true }).click();
  await expect(page.locator('.catalog-card:visible')).toHaveCount(2);
  await page.getByRole('button', { name: 'Todos', exact: true }).click();
  await page.getByRole('searchbox', { name: 'Buscar catálogo' }).fill('bano');
  await expect(page.locator('.catalog-card:visible')).toHaveCount(1);
  await page.getByRole('searchbox', { name: 'Buscar catálogo' }).fill('xyz');
  await expect(page.locator('.collections-empty')).toBeVisible();
  await page.getByRole('searchbox', { name: 'Buscar catálogo' }).fill('');
  await page.getByLabel('Más colecciones', { exact: true }).selectOption('Melliceros');
  await expect(page.locator('.catalog-card:visible')).toHaveCount(1);
  const catalog = await page.request.get('/catalogs.json').then((r) => r.json());
  await expect(page.locator('.catalog-card:visible .catalog-links a')).toHaveAttribute(
    'href',
    encodeURI(catalog[2].pdf),
  );
  await page.locator('.catalog-card:visible .collection-read').click();
  await expect(page.locator('.reader-stage')).toHaveAttribute('aria-busy', 'false');
  await expect(page.locator('#readerPageLabel')).toContainText('/ 5');
});

test('collections fit mobile and desktop with loaded covers and 3D art', async ({ page }) => {
  for (const width of [320, 390, 768, 1024, 1440, 1920]) {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto('/catalogos');
    await expect(page.locator('.catalog-card')).toHaveCount(12);
    await expect
      .poll(() =>
        page.locator('.collections-art').evaluate((img) => img.complete && img.naturalWidth > 0),
      )
      .toBe(true);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    const cover = page.locator('.catalog-cover img').first();
    await expect
      .poll(() => cover.evaluate((img) => img.complete && img.naturalWidth > 0))
      .toBe(true);
    if ([390, 1440].includes(width))
      await page.screenshot({
        path: `test-results/collections-${width}.png`,
        animations: 'disabled',
        fullPage: true,
      });
  }
});
