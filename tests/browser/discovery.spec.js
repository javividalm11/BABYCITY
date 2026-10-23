import { test, expect } from '@playwright/test';

test('six pastel category cards retain their original photos, arrows and hover details', async ({
  page,
}) => {
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.setViewportSize({ width: 1207, height: 900 });
  await page.goto('/');
  const section = page.locator('.discovery'),
    cards = section.locator('.category-card');
  await section.scrollIntoViewIfNeeded();
  await expect(cards).toHaveCount(6);
  for (let i = 0; i < 6; i++) {
    const card = cards.nth(i),
      main = card.locator('.category-image-main'),
      detail = card.locator('.category-image-detail');
    await card
      .locator('img')
      .evaluateAll((images) => Promise.all(images.map((image) => image.decode())));
    expect(await card.evaluate((el) => getComputedStyle(el).backgroundColor)).not.toBe(
      'rgba(0, 0, 0, 0)',
    );
    await expect(card.locator('svg:visible')).toHaveCount(2);
    expect(
      await card
        .locator('.category-picture')
        .evaluate((el) => getComputedStyle(el).backgroundColor),
    ).toBe('rgba(0, 0, 0, 0)');
    expect(await main.getAttribute('src')).not.toBe(await detail.getAttribute('src'));
    await card.hover();
    await expect.poll(() => detail.evaluate((el) => Number(getComputedStyle(el).opacity))).toBe(1);
    await expect.poll(() => main.evaluate((el) => Number(getComputedStyle(el).opacity))).toBe(0);
    await expect
      .poll(() => detail.evaluate((el) => new DOMMatrix(getComputedStyle(el).transform).a))
      .toBeCloseTo(1.45, 2);
  }
  await section.getByRole('heading', { name: 'Un mundo por descubrir', exact: true }).hover();
  await expect
    .poll(() =>
      cards
        .last()
        .locator('.category-image-main')
        .evaluate((el) => Number(getComputedStyle(el).opacity)),
    )
    .toBe(1);
  await section.screenshot({ path: 'test-results/discovery-desktop.png' });
  await cards.nth(2).hover();
  await expect
    .poll(() =>
      cards
        .nth(2)
        .locator('.category-image-detail')
        .evaluate((el) => Number(getComputedStyle(el).opacity)),
    )
    .toBe(1);
  await section.screenshot({ path: 'test-results/discovery-hover.png' });
  await cards.nth(0).click();
  await expect(page).toHaveURL(/categoria=Coches/);
  await expect(page.locator('.product-card')).toHaveCount(7);
  expect(errors).toEqual([]);
});

test('categories retain keyboard access and fit mobile with reduced motion', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  const section = page.locator('.discovery');
  await section.scrollIntoViewIfNeeded();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  const card = section.locator('.category-card').first();
  await page.keyboard.press('Tab');
  await card.focus();
  await expect
    .poll(() =>
      card.locator('.category-image-detail').evaluate((el) => Number(getComputedStyle(el).opacity)),
    )
    .toBe(1);
  await expect(card).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/categoria=Coches/);
  await page.goto('/');
  await page.locator('.discovery').scrollIntoViewIfNeeded();
  await page
    .locator('.discovery img')
    .evaluateAll((images) => Promise.all(images.map((image) => image.decode())));
  await page.locator('.discovery').screenshot({ path: 'test-results/discovery-mobile.png' });
  const originalImages = await page
    .locator('.category-image-main')
    .evaluateAll((images) => images.map((img) => img.getAttribute('src')));
  for (const width of [320, 390, 430, 680]) {
    await page.setViewportSize({ width, height: 844 });
    await expect(page.locator('.category-card')).toHaveCount(6);
    await expect(page.locator('.category-mobile-arrow:visible')).toHaveCount(6);
    const columns = await page
      .locator('.category-grid')
      .evaluate((el) => getComputedStyle(el).gridTemplateColumns.split(' ').length);
    expect(columns).toBe(2);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    expect(
      await page
        .locator('.category-image-main')
        .evaluateAll((images) => images.map((img) => img.getAttribute('src'))),
    ).toEqual(originalImages);
  }
  await page.getByRole('link', { name: 'Explorar todas las categorías', exact: true }).click();
  await expect(page).toHaveURL(/\/tienda$/);
});
