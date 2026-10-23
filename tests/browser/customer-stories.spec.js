import { test, expect } from '@playwright/test';

test('dispatch carousel includes the selected shipments and collection confirmation', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/servicios');
  const carousel = page.locator('.dispatch-carousel');
  await expect(carousel.locator('figure')).toHaveCount(6);
  await expect(carousel.locator('[data-stories-status]')).toHaveText('1–2 de 6');
  await carousel.locator('[data-stories-next]').click();
  await expect(carousel.locator('[data-stories-status]')).toHaveText('3–4 de 6');
  await carousel.locator('[data-stories-next]').click();
  await expect(carousel.locator('[data-stories-status]')).toHaveText('5–6 de 6');
  await expect(carousel.locator('figure').last()).toContainText('Confirmación de recojo');
  await carousel.locator('img').evaluateAll((images) =>
    Promise.all(
      images.map((image) => {
        image.loading = 'eager';
        return image.decode();
      }),
    ),
  );
  for (const width of [320, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
  }
  await page.setViewportSize({ width: 390, height: 900 });
  await carousel.locator('.customer-stories-track').evaluate((el) => (el.scrollLeft = 0));
  await expect(carousel.locator('[data-stories-status]')).toHaveText('1–1 de 6');
  await carousel.locator('[data-stories-next]').click();
  await expect(carousel.locator('[data-stories-status]')).toHaveText('2–2 de 6');
});

test('home testimonials slide through all positive replies on desktop and mobile', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');
  const carousel = page.locator('.customer-stories-carousel');
  const track = carousel.locator('.customer-stories-track');
  await expect(carousel.locator('.customer-story')).toHaveCount(4);
  await expect(carousel.locator('[data-stories-status]')).toHaveText('1–2 de 4');
  await carousel.locator('[data-stories-next]').click();
  await expect(carousel.locator('[data-stories-status]')).toHaveText('3–4 de 4');
  await carousel.locator('[data-stories-next]').click();
  await expect(carousel.locator('[data-stories-status]')).toHaveText('1–2 de 4');
  await page.setViewportSize({ width: 390, height: 900 });
  await expect(carousel.locator('[data-stories-status]')).toHaveText('1–1 de 4');
  await track.focus();
  await page.keyboard.press('ArrowRight');
  await expect(carousel.locator('[data-stories-status]')).toHaveText('2–2 de 4');
  await carousel.locator('[data-stories-prev]').click();
  await expect(carousel.locator('[data-stories-status]')).toHaveText('1–1 de 4');
  await expect(carousel.locator('[data-stories-pause]')).toHaveText('Reanudar');
  await page.goto('/tienda');
  await expect(page.locator('.customer-stories-carousel')).toHaveCount(0);
});

test('customer stories follow shop products and preserve the supplied conversations', async ({
  page,
}) => {
  await page.goto('/tienda');
  await expect(page.locator('.customer-story')).toHaveCount(4);
  await expect(page.locator('.customer-story blockquote').first()).toContainText('Me encantaron');
  const products = await page.locator('.shop-layout').boundingBox();
  const stories = await page.locator('.customer-stories').boundingBox();
  expect(stories.y).toBeGreaterThan(products.y + products.height);
  const href = await page
    .getByRole('link', { name: 'Ampliar conversación de Loidita' })
    .getAttribute('href');
  const source = await page.request.get(href);
  expect(source.status()).toBe(200);
  expect(source.headers()['content-type']).toBe('image/webp');
  await page.goto('/favoritos');
  await expect(page.locator('.customer-stories')).toHaveCount(0);
});

test('work images belong to the intended pages and fit phone, tablet and desktop', async ({
  page,
}) => {
  const routes = [
    ['/', '.customer-stories', 4],
    ['/tienda', '.customer-stories', 4],
    ['/servicios', '.service-work', 0],
    ['/nosotros', '.about-purpose', 0],
  ];
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  for (const [route, section, reviews] of routes) {
    await page.goto(route);
    await expect(page.locator(section)).toHaveCount(1);
    await expect(page.locator('.customer-story')).toHaveCount(reviews);
    await page.locator(`${section} img`).evaluateAll((images) =>
      Promise.all(
        images.map((image) => {
          image.loading = 'eager';
          return image.decode();
        }),
      ),
    );
    for (const width of [320, 390, 768, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
        `${route} ${width}`,
      ).toBe(true);
    }
  }
  await expect(page.locator('.about-purpose')).toContainText('Nuestra misión');
  await expect(page.locator('.about-purpose')).toContainText('Nuestra visión');
  expect(errors).toEqual([]);
});
