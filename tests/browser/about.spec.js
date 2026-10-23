import { test, expect } from '@playwright/test';

const videoIds = [
  '7646211098378521877',
  '7663894714713787668',
  '7619830704683109653',
  '7688956626086219029',
];

test.beforeEach(async ({ page }) => {
  await page.route('https://www.tiktok.com/player/**', (route) =>
    route.fulfill({
      contentType: 'text/html',
      body: '<html><body>TikTok player fixture</body></html>',
    }),
  );
});

test('about content uses supplied photographs and four exact TikTok posts while retaining the shared shell', async ({
  page,
}) => {
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/nosotros', { waitUntil: 'domcontentloaded' });
  const about = page.locator('.about-page');
  await expect(about.locator('h1')).toHaveCount(1);
  await expect(page.locator('.site-header')).toHaveCount(1);
  await expect(page.locator('.babycity-footer')).toHaveCount(1);
  await expect(about.locator('header, footer')).toHaveCount(0);
  for (const file of ['ceobabycity.jpg', 'nosotros.jpg', 'nosotros2.jpg'])
    expect(await about.locator(`img[src="/assets/${file}"]`).count()).toBeGreaterThan(0);
  await expect(about.locator('iframe')).toHaveCount(0);
  await expect(about.locator('.about-video-poster')).toHaveCount(4);
  for (const [index, id] of videoIds.entries()) {
    await expect(about.locator('.about-video-poster img').nth(index)).toHaveAttribute(
      'src',
      `/assets/about/tiktok-${id}.jpg`,
    );
    await expect(about.locator('.about-video figcaption a').nth(index)).toHaveAttribute(
      'href',
      `https://www.tiktok.com/@babycityperu/video/${id}`,
    );
  }
  await about.getByRole('link', { name: 'Conoce nuestra historia' }).click();
  await expect(page).toHaveURL(/#about-story$/);
  await expect(page.locator('#about-story')).toBeInViewport();
  await expect(about.locator('.about-store a').first()).toHaveAttribute(
    'href',
    /Antonio.*Raymondi.*512/,
  );
  await about.locator('.about-closing button').click();
  await expect(page.locator('#contactDialog')).toBeVisible();
  expect(errors).toEqual([]);
});

test('reference about content fits small phones, tablets and desktop', async ({ page }) => {
  for (const width of [320, 390, 768, 935, 1024, 1440, 1920]) {
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
    for (const selector of [
      '.about-intro-inner',
      '.about-benefits',
      '.about-gallery',
      '.about-live',
      '.about-tiktok-grid',
      '.about-store',
    ]) {
      const bounds = await about.locator(selector).boundingBox();
      expect(bounds.x).toBeGreaterThanOrEqual(0);
      expect(bounds.x + bounds.width).toBeLessThanOrEqual(width + 1);
    }
    for (const image of await about
      .locator('.about-portrait img, .about-intro-secondary img, .about-gallery img')
      .all())
      expect(await image.evaluate((el) => getComputedStyle(el).objectFit)).toBe('contain');
    if ([390, 935, 1440].includes(width)) {
      await page
        .locator('.contact-float,.skip,.site-header')
        .evaluateAll((elements) =>
          elements.forEach((element) => (element.style.visibility = 'hidden')),
        );
      await about.screenshot({ path: `test-results/about-${width}.png`, animations: 'disabled' });
    }
  }
});

test('TikTok shows real covers and loads one player at a time when pressed', async ({ page }) => {
  await page.goto('/nosotros', { waitUntil: 'domcontentloaded' });
  const posters = page.locator('.about-video-poster');
  for (const poster of await posters.all()) {
    await poster.locator('img').scrollIntoViewIfNeeded();
    await expect
      .poll(() => poster.locator('img').evaluate((img) => img.complete && img.naturalWidth > 0))
      .toBe(true);
  }
  const playerSrc = (id) =>
    `https://www.tiktok.com/player/v1/${id}?autoplay=1&rel=0&description=0&music_info=0`;

  await posters.nth(0).click();
  await expect(page.locator('.about-video iframe')).toHaveCount(1);
  await expect(page.locator('.about-video iframe')).toHaveAttribute('src', playerSrc(videoIds[0]));
  await expect(page.locator('.about-video iframe')).toHaveAttribute('allow', /autoplay/);
  await expect(posters).toHaveCount(3);

  await posters.nth(0).click();
  await expect(page.locator('.about-video iframe')).toHaveCount(1);
  await expect(page.locator('.about-video iframe')).toHaveAttribute('src', playerSrc(videoIds[1]));
  await expect(posters).toHaveCount(3);
  await expect(
    page.locator('.about-video-poster img[src="/assets/about/tiktok-' + videoIds[0] + '.jpg"]'),
  ).toHaveCount(1);
  await page.locator('.about-closing button').click();
  await page.keyboard.press('Escape');
});
