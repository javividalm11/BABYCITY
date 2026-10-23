import { test, expect } from '@playwright/test';

test('reader enters and exits native fullscreen and resets on close', async ({ page }) => {
  await page.goto('/catalogos?libro=catalog-01');
  await expect(page.locator('.reader-stage')).toHaveAttribute('aria-busy', 'false');
  await page.getByRole('button', { name: 'Pantalla completa', exact: true }).click();
  await expect.poll(() => page.evaluate(() => document.fullscreenElement?.tagName)).toBe('HTML');
  await expect(page.locator('#bookDialog')).toHaveClass(/is-fullscreen/);
  await page.getByRole('button', { name: 'Salir de pantalla completa' }).click();
  await expect.poll(() => page.evaluate(() => document.fullscreenElement)).toBeNull();
  await expect(page.locator('#bookDialog')).not.toHaveClass(/is-fullscreen/);
  await page.getByRole('button', { name: 'Pantalla completa', exact: true }).click();
  await page.getByRole('button', { name: 'Cerrar lector' }).click();
  await expect(page.locator('#bookDialog')).not.toBeVisible();
  await expect.poll(() => page.evaluate(() => document.fullscreenElement)).toBeNull();
});

test('restricted fullscreen expands the reader to the viewport and Escape restores it', async ({
  page,
}) => {
  await page.addInitScript(() => {
    document.documentElement.requestFullscreen = () => Promise.reject(new Error('Restricted'));
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/catalogos?libro=catalog-01');
  await expect(page.locator('.reader-stage')).toHaveAttribute('aria-busy', 'false');
  await page.getByRole('button', { name: 'Pantalla completa', exact: true }).click();
  await expect(page.locator('#bookDialog')).toHaveClass(/is-fullscreen/);
  expect(
    await page.locator('#bookDialog').evaluate((el) => {
      const bounds = el.getBoundingClientRect();
      return bounds.width === innerWidth && bounds.height === innerHeight;
    }),
  ).toBe(true);
  await page.keyboard.press('Escape');
  await expect(page.locator('#bookDialog')).toBeVisible();
  await expect(page.locator('#bookDialog')).not.toHaveClass(/is-fullscreen/);
});
