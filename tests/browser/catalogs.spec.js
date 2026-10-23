import { test, expect } from '@playwright/test';

test('reader opens all twelve catalogs with fitted double pages and paper engine', async ({
  page,
}) => {
  await page.addInitScript(() => {
    const pending = new Set(),
      request = window.requestAnimationFrame.bind(window),
      cancel = window.cancelAnimationFrame.bind(window);
    window.requestAnimationFrame = (callback) => {
      const id = request((time) => {
        pending.delete(id);
        callback(time);
      });
      pending.add(id);
      return id;
    };
    window.cancelAnimationFrame = (id) => {
      pending.delete(id);
      cancel(id);
    };
    window.readerPendingFrames = () => pending.size;
  });
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.setViewportSize({ width: 1591, height: 902 });
  await page.goto('/catalogos');
  const catalogs = await page.request.get('/catalogs.json').then((r) => r.json());
  for (const catalog of catalogs) {
    await page.locator(`.catalog-cover[data-book="${catalog.id}"]`).click();
    await expect(page.locator('.reader-stage')).toHaveAttribute('aria-busy', 'false');
    await expect(page.locator('#readerPageLabel')).toHaveText(`1–2 / ${catalog.count}`);
    await expect(page.locator('.reader-sheet[aria-hidden=false]')).toHaveCount(2);
    await expect(page.locator('.stf__parent')).toHaveCount(1);
    expect(
      await page
        .locator('.reader-sheet[aria-hidden=false] img')
        .evaluateAll((images) => images.every((image) => image.complete && image.naturalWidth > 0)),
    ).toBe(true);
    const fits = await page.locator('.reader-book').evaluate((el) => {
      const b = el.getBoundingClientRect(),
        s = el.parentElement.getBoundingClientRect();
      return (
        b.left >= s.left - 1 &&
        b.right <= s.right + 1 &&
        b.top >= s.top - 1 &&
        b.bottom <= s.bottom + 1
      );
    });
    expect(fits, catalog.title).toBe(true);
    if (catalog.id === 'catalog-01')
      await page.screenshot({ path: 'test-results/reader-desktop.png', animations: 'disabled' });
    await page.keyboard.press('ArrowRight');
    await expect(page.locator('#readerPageLabel')).toHaveText(`3–4 / ${catalog.count}`);
    await page.keyboard.press('End');
    await expect(
      page.getByRole('button', { name: 'Página siguiente', exact: true }),
    ).toBeDisabled();
    await expect(page.locator('#readerPageLabel')).toContainText(`/ ${catalog.count}`);
    await page.keyboard.press('Escape');
    await expect(page.locator('#bookDialog')).not.toBeVisible();
    await expect.poll(() => page.evaluate(() => window.readerPendingFrames())).toBe(0);
  }
  expect(errors).toEqual([]);
});

test('reader supports corner dragging, keyboard, zoom, slider and reopening', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto('/catalogos?libro=catalog-01');
  await expect(page.locator('.reader-stage')).toHaveAttribute('aria-busy', 'false');
  const book = await page.locator('.reader-book').boundingBox();
  await page.mouse.move(book.x + book.width - 8, book.y + book.height - 12);
  await page.mouse.down();
  await page.mouse.move(book.x + book.width * 0.35, book.y + book.height * 0.7, { steps: 18 });
  await page.mouse.up();
  await expect(page.locator('#readerPageLabel')).toHaveText('3–4 / 24');
  await page.keyboard.press('ArrowLeft');
  await expect(page.locator('#readerPageLabel')).toHaveText('1–2 / 24');
  const before = await page.locator('.reader-book').boundingBox();
  await page.getByRole('button', { name: 'Ampliar' }).click();
  await expect(page.getByLabel('Nivel de zoom')).toHaveValue('1.25');
  const after = await page.locator('.reader-book').boundingBox();
  expect(after.width).toBeGreaterThan(before.width);
  await page.getByRole('button', { name: 'Alejar', exact: true }).click();
  await page.locator('#bookSlider').fill('11');
  await expect(page.locator('#readerPageLabel')).toHaveText('11–12 / 24');
  await page.getByRole('button', { name: 'Cerrar lector', exact: true }).focus();
  await page.keyboard.press('Home');
  await expect(page.locator('#readerPageLabel')).toHaveText('1–2 / 24');
  await page.getByRole('button', { name: 'Cerrar lector', exact: true }).click();
  await page.locator('.catalog-cover').nth(1).click();
  await expect(page.locator('.reader-stage')).toHaveAttribute('aria-busy', 'false');
  await expect(page.locator('.stf__parent')).toHaveCount(1);
  await expect(page.locator('#readerPageLabel')).toHaveText('1–2 / 14');
});

test('reader fits mobile, navigates single pages and retains position on resize', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/catalogos?libro=catalog-01');
  await expect(page.locator('.reader-stage')).toHaveAttribute('aria-busy', 'false');
  await expect(page.locator('#readerPageLabel')).toHaveText('1 / 24');
  await expect(page.locator('.reader-sheet[aria-hidden=false]')).toHaveCount(1);
  const box = await page.locator('.reader-book').boundingBox();
  expect(box.width).toBeLessThan(390);
  await page.screenshot({ path: 'test-results/reader-mobile.png', animations: 'disabled' });
  await page.keyboard.press('ArrowRight');
  await expect(page.locator('#readerPageLabel')).toHaveText('2 / 24');
  await page.setViewportSize({ width: 1440, height: 1000 });
  await expect(page.locator('#readerPageLabel')).toHaveText('1–2 / 24');
  await page.keyboard.press('End');
  await expect(page.locator('#readerPageLabel')).toHaveText('23–24 / 24');
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.locator('#readerPageLabel')).toHaveText('23 / 24');
  await page.keyboard.press('ArrowRight');
  await expect(page.locator('#readerPageLabel')).toHaveText('24 / 24');
  await expect(page.getByRole('button', { name: 'Página siguiente', exact: true })).toBeDisabled();
});
