import { test, expect } from '@playwright/test';

test('services includes the complete gift PDF content and its original download', async ({
  page,
}) => {
  const response = await page.goto('/servicios');
  expect(response.status()).toBe(200);
  await expect(page).toHaveTitle('Servicios · BabyCity Perú');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('El regalo perfecto');
  await expect(page.locator('.services-price')).toContainText('S/ 6');
  await expect(page.locator('.services-includes')).toContainText(
    'Caja premium, forrada con papel de regalo.',
  );
  await expect(page.locator('.services-includes')).toContainText(
    'Etiqueta con dedicatoria personalizada.',
  );
  await expect(page.locator('.services-includes')).toContainText('Moño decorativo.');
  await expect(page.locator('.services-gallery-grid img')).toHaveCount(9);
  await expect(page.locator('.services-document-pages img')).toHaveCount(3);
  await page.locator('.services-page img').evaluateAll((images) =>
    Promise.all(
      images.map((image) => {
        image.loading = 'eager';
        return image.decode();
      }),
    ),
  );
  const href = await page
    .getByRole('link', { name: 'Descargar PDF original' })
    .getAttribute('href');
  const pdf = await page.request.get(href);
  expect(pdf.status()).toBe(200);
  expect(pdf.headers()['content-type']).toContain('application/pdf');
  const sitemap = await page.request.get('/sitemap.xml').then((r) => r.text());
  expect(sitemap).toContain('/servicios');
  for (const width of [320, 390, 768, 1200, 1440, 1600, 1920]) {
    await page.setViewportSize({ width, height: 900 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    if (width >= 1200) {
      const nav = await page.locator('.desktop-nav').boundingBox();
      const actions = await page.locator('.site-actions').boundingBox();
      expect(nav.x + nav.width).toBeLessThanOrEqual(actions.x + 1);
    }
  }
});

test('Servicios can be opened from desktop and mobile navigation', async ({ page }) => {
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/');
    if (width < 1200) await page.getByRole('button', { name: 'Abrir menú' }).click();
    const nav = page.locator(width < 1200 ? '.mobile-primary-links' : '.desktop-nav');
    await nav.getByRole('link', { name: 'Servicios', exact: true }).click();
    await expect(page).toHaveURL(/\/servicios$/);
    await expect(page.locator('.services-page')).toBeVisible();
    if (width >= 1200)
      await expect(nav.getByRole('link', { name: 'Servicios', exact: true })).toHaveAttribute(
        'aria-current',
        'page',
      );
    await expect(page.locator('.services-hero .services-button')).toHaveAttribute(
      'href',
      /^https:\/\/wa.me\/51937473120\?text=/,
    );
  }
});
