import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.route('https://www.tiktok.com/player/**', (route) =>
    route.fulfill({
      contentType: 'text/html',
      body: '<html><body>TikTok player fixture</body></html>',
    }),
  );
});

test('about page presents the supplied photos, logo and exact TikTok video without autoplay', async ({
  page,
}) => {
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  const response = await page.goto('/nosotros', { waitUntil: 'domcontentloaded' });
  expect(response.headers()['content-security-policy']).toContain(
    'frame-src https://www.google.com https://www.tiktok.com',
  );
  const about = page.locator('.about-page');
  await expect(about.locator('h1')).toHaveCount(1);
  await expect(about.locator('.about-brand')).toHaveAttribute(
    'src',
    '/assets/logo-transparent.png',
  );
  for (const file of ['ceobabycity.jpg', 'nosotros.jpg', 'nosotros2.jpg'])
    await expect(about.locator(`img[src="/assets/${file}"]`)).toHaveCount(1);
  await expect(about.locator('iframe')).toHaveCount(1);
  await expect(about.locator('iframe')).toHaveAttribute(
    'src',
    'https://www.tiktok.com/player/v1/7646211098378521877?autoplay=0&rel=0&description=0&music_info=0',
  );
  await expect(about.locator('.about-video a')).toHaveAttribute(
    'href',
    'https://www.tiktok.com/@babycityperu/video/7646211098378521877',
  );
  await about.getByRole('link', { name: 'Conoce nuestra tienda' }).click();
  await expect(page).toHaveURL(/\/contacto$/);
  await expect(page.getByRole('heading', { name: 'Estamos cerquita de ti' })).toBeVisible();
  expect(errors).toEqual([]);
});

test('about layout keeps photos complete and fits mobile through large desktop', async ({
  page,
}) => {
  for (const width of [320, 390, 768, 1024, 1440, 1920]) {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto('/nosotros', { waitUntil: 'domcontentloaded' });
    const about = page.locator('.about-page');
    await about.locator('img').evaluateAll((images) =>
      Promise.all(
        images.map((image) => {
          image.loading = 'eager';
          return image.decode();
        }),
      ),
    );
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    for (const selector of ['.about-intro', '.about-gallery', '.about-live', '.about-video']) {
      const bounds = await about.locator(selector).boundingBox();
      expect(bounds.x).toBeGreaterThanOrEqual(0);
      expect(bounds.x + bounds.width).toBeLessThanOrEqual(width + 1);
    }
    for (const image of await about.locator('.about-portrait img, .about-gallery img').all())
      expect(await image.evaluate((el) => getComputedStyle(el).objectFit)).toBe('contain');
    if ([390, 1440].includes(width)) {
      await page
        .locator('.contact-float,.skip')
        .evaluateAll((elements) =>
          elements.forEach((element) => (element.style.visibility = 'hidden')),
        );
      await about.screenshot({ path: `test-results/about-${width}.png`, animations: 'disabled' });
    }
  }
});
