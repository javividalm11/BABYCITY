import { test, expect } from '@playwright/test';

test('reference hero and navbar fit desktop, five images crossfade infinitely', async ({
  page,
}) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.setViewportSize({ width: 1207, height: 679 });
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'el mundo de tu bebe a un clic' })).toBeVisible();
  await expect(page.locator('.hero-slide')).toHaveCount(5);
  await page
    .locator('.hero-slide')
    .evaluateAll((images) => Promise.all(images.map((image) => image.decode())));
  expect(
    await page
      .locator('.hero-slide')
      .evaluateAll((images) => new Set(images.map((i) => i.src)).size),
  ).toBe(5);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  const animation = await page
    .locator('.hero-slide')
    .first()
    .evaluate((el) => {
      const a = el.getAnimations()[0];
      return {
        duration: a.effect.getTiming().duration,
        iterations: a.effect.getTiming().iterations === Infinity,
      };
    });
  expect(animation).toEqual({ duration: 30000, iterations: true });
  await page.getByRole('button', { name: 'Pausar animación' }).click();
  await expect(page.getByRole('button', { name: 'Reanudar animación' })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  expect(
    await page
      .locator('.hero-slide')
      .first()
      .evaluate((el) => getComputedStyle(el).animationPlayState),
  ).toBe('paused');
  for (let index = 0; index < 5; index++) {
    await page.locator('.hero-slide').evaluateAll(
      (slides, time) =>
        slides.forEach((el) => {
          const a = el.getAnimations()[0];
          a.pause();
          a.currentTime = time;
        }),
      index * 6000 + 1500,
    );
    expect(
      Number(
        await page
          .locator('.hero-slide')
          .nth(index)
          .evaluate((el) => getComputedStyle(el).opacity),
      ),
    ).toBe(1);
  }
  await page.locator('.hero-slide').evaluateAll((slides) =>
    slides.forEach((el) => {
      el.getAnimations()[0].currentTime = 1500;
    }),
  );
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: 'test-results/hero-reference-desktop.png' });
  await page.getByLabel('Buscar en la tienda').fill('Rudi');
  await page.locator('#navbarSearchForm button').click();
  await expect(page.locator('.product-card')).toHaveCount(1);
  expect(errors).toEqual([]);
});

test('hero adapts to mobile and respects reduced motion', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await expect(page.getByRole('link', { name: 'Compra aquí', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Pausar animación' })).not.toBeVisible();
  expect(
    await page
      .locator('.hero-slide')
      .first()
      .evaluate((el) => getComputedStyle(el).opacity),
  ).toBe('1');
  expect(
    await page
      .locator('.hero-slide')
      .nth(1)
      .evaluate((el) => getComputedStyle(el).opacity),
  ).toBe('0');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page
    .locator('.hero-slide')
    .first()
    .evaluate((img) => img.decode());
  await page.screenshot({ path: 'test-results/hero-reference-mobile.png' });
  await page.getByRole('button', { name: 'Buscar productos', exact: true }).click();
  await expect(page.locator('#searchDialog')).toBeVisible();
});

test('mobile cover keeps its content readable without slideshow controls', async ({ page }) => {
  for (const width of [320, 360, 390, 430, 680]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/?efectos=0');
    await expect(page.locator('.hero-pause')).not.toBeVisible();
    await expect(page.locator('.hero-showcase')).toHaveCount(1);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    const hero = await page.locator('.hero-showcase').boundingBox();
    const cta = await page.locator('.hero-actions .primary').boundingBox();
    const product = await page.locator('.hero-product-stage').boundingBox();
    expect(cta.x).toBeGreaterThanOrEqual(16);
    expect(cta.y + cta.height).toBeLessThan(hero.y + hero.height * 0.65);
    expect(product.y + product.height).toBeLessThanOrEqual(hero.y + hero.height);
    expect(hero.height).toBeLessThanOrEqual(730);
    await expect(page.locator('.hero-whatsapp')).toBeVisible();
    await expect(page.locator('.hero-whatsapp')).toHaveAttribute(
      'href',
      /https:\/\/wa.me\/51937473120/,
    );
    const whatsapp = await page.locator('.hero-whatsapp').boundingBox();
    expect(whatsapp.y + whatsapp.height).toBeLessThanOrEqual(product.y);
    await expect(page.getByRole('link', { name: 'Ver todas las categorías' })).toHaveAttribute(
      'href',
      '/tienda',
    );
  }
});
