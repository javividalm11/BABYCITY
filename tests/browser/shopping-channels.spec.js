import { test, expect } from '@playwright/test';

test('home benefits and purchase channels show real destinations before the footer', async ({
  page,
}) => {
  await page.goto('/');
  const channels = page.locator('.shopping-channels');
  await expect(page.getByRole('heading', { name: '¿Por qué comprar en BabyCity?' })).toBeVisible();
  await expect(channels.getByRole('link', { name: 'Conversemos por WhatsApp' })).toHaveAttribute(
    'href',
    'https://wa.me/51937473120',
  );
  await expect(channels.getByRole('link', { name: 'Visitar BabyCity en TikTok' })).toHaveAttribute(
    'href',
    'https://www.tiktok.com/@babycityperu',
  );
  await expect(
    channels.getByRole('link', { name: 'Ir a Baby Store en Falabella' }),
  ).toHaveAttribute('href', 'https://www.falabella.com.pe/falabella-pe/seller/BABY%20STORE');
  expect(
    await page
      .locator('#main')
      .evaluate((el) => el.lastElementChild.classList.contains('shopping-channels')),
  ).toBe(true);
  for (const width of [320, 390, 768, 1440, 1920]) {
    await page.setViewportSize({ width, height: 900 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    await expect(channels.getByRole('link', { name: 'Ver catálogo', exact: true })).toBeVisible();
  }
  await channels.getByRole('link', { name: 'Ver catálogo', exact: true }).click();
  await expect(page).toHaveURL(/\/catalogos$/);
  await expect(page.locator('.catalog-card')).toHaveCount(12);
  await expect(page.locator('.shopping-channels')).toHaveCount(0);
});
