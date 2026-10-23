import { test, expect } from '@playwright/test';

for (const width of [390, 1440]) {
  test(`reader zoom steps, panning and reset keep the same page at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/catalogos?libro=catalog-01');
    const stage = page.locator('.reader-stage');
    const select = page.getByLabel('Nivel de zoom');
    await expect(stage).toHaveAttribute('aria-busy', 'false');
    const initial = await page.locator('.reader-book').boundingBox();
    const label = await page.locator('#readerPageLabel').textContent();
    for (const zoom of [1.25, 1.5, 1.75, 2]) {
      await page.getByRole('button', { name: 'Ampliar', exact: true }).click();
      await expect(select).toHaveValue(String(zoom));
      await expect(stage).toHaveAttribute('aria-busy', 'false');
      await expect
        .poll(async () => (await page.locator('.reader-book').boundingBox()).width / initial.width)
        .toBeCloseTo(zoom, 1);
      await expect(page.locator('#readerPageLabel')).toHaveText(label);
    }
    await expect(page.getByRole('button', { name: 'Ampliar', exact: true })).toBeDisabled();
    const viewport = await stage.boundingBox();
    await stage.evaluate((el) => {
      el.scrollLeft = 0;
      el.scrollTop = 0;
    });
    await page.mouse.move(viewport.x + viewport.width * 0.7, viewport.y + viewport.height * 0.7);
    await page.mouse.down();
    await page.mouse.move(viewport.x + viewport.width * 0.3, viewport.y + viewport.height * 0.3, {
      steps: 8,
    });
    await page.mouse.up();
    expect(await stage.evaluate((el) => el.scrollTop)).toBeGreaterThan(40);
    await expect(page.locator('#readerPageLabel')).toHaveText(label);
    await page.getByRole('button', { name: 'Alejar', exact: true }).click();
    await expect(select).toHaveValue('1.75');
    await select.selectOption('0.5');
    await expect(stage).toHaveAttribute('aria-busy', 'false');
    await expect(page.getByRole('button', { name: 'Alejar', exact: true })).toBeDisabled();
    await select.selectOption('1');
    await expect(stage).toHaveAttribute('aria-busy', 'false');
    await expect
      .poll(async () => (await page.locator('.reader-book').boundingBox()).width)
      .toBe(initial.width);
    expect(await stage.evaluate((el) => el.scrollTop + el.scrollLeft)).toBe(0);
  });
}
