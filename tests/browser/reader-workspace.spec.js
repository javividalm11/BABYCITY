import { test, expect } from '@playwright/test';

test('reader thumbnails, bookmarks, page search and view modes work without side arrows', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto('/catalogos?libro=catalog-01');
  await expect(page.locator('.reader-stage')).toHaveAttribute('aria-busy', 'false');
  await expect(page.locator('.reader-thumbnail')).toHaveCount(12);
  await expect(page.locator('.reader-gesture')).toBeVisible();
  await expect(page.locator('.reader-stage button')).toHaveCount(0);
  await page.locator('.reader-thumbnail').nth(2).click();
  await expect(page.locator('#readerPageLabel')).toHaveText('5–6 / 24');
  await expect(page.locator('.reader-gesture')).not.toBeVisible();
  await page.getByRole('button', { name: 'Guardar página' }).click();
  await page.getByRole('tab', { name: 'Marcadores' }).click();
  await expect(page.locator('.reader-thumbnail')).toHaveCount(1);
  await page.getByRole('tab', { name: 'Páginas', exact: true }).click();
  await page.getByRole('searchbox', { name: 'Buscar página por número' }).fill('9');
  await expect(page.locator('.reader-thumbnail:visible')).toHaveCount(1);
  await page.getByRole('searchbox', { name: 'Buscar página por número' }).press('Enter');
  await expect(page.locator('#readerPageLabel')).toHaveText('9–10 / 24');
  await page.getByRole('searchbox', { name: 'Buscar página por número' }).fill('');
  await page.getByRole('button', { name: 'Una página', exact: true }).click();
  await expect(page.locator('.reader-sheet[aria-hidden=false]')).toHaveCount(1);
  await page.getByRole('button', { name: 'Doble página', exact: true }).click();
  await expect(page.locator('.reader-sheet[aria-hidden=false]')).toHaveCount(2);
  await page.locator('#readerPageInput').fill('17');
  await page.getByRole('button', { name: 'Ir a la página', exact: true }).click();
  await expect(page.locator('#readerPageLabel')).toHaveText('17–18 / 24');
  await page.getByLabel('Nivel de zoom').selectOption('1.25');
  await expect(page.locator('.reader-stage')).toHaveClass(/reader-zoomed/);
  await page.getByRole('button', { name: 'Alejar', exact: true }).click();
  await expect(page.locator('.reader-stage')).not.toHaveClass(/reader-zoomed/);
  expect(await page.locator('#bookDialog').evaluate((el) => el.scrollWidth <= el.clientWidth)).toBe(
    true,
  );
});

test('reader gesture respects reduced motion and mobile page search can jump', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 740 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/catalogos?libro=catalog-01');
  await expect(page.locator('.reader-stage')).toHaveAttribute('aria-busy', 'false');
  expect(
    await page
      .locator('.reader-gesture > svg')
      .evaluate((el) => getComputedStyle(el).animationName),
  ).toBe('none');
  await page.getByRole('searchbox', { name: 'Buscar página por número' }).fill('7');
  await page.getByRole('searchbox', { name: 'Buscar página por número' }).press('Enter');
  await expect(page.locator('#readerPageLabel')).toHaveText('7 / 24');
  expect(await page.locator('#bookDialog').evaluate((el) => el.scrollWidth <= el.clientWidth)).toBe(
    true,
  );
});
