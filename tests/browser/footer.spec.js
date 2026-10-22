import { test, expect } from '@playwright/test';

test('footer preserves social destinations and opens the existing contact dialog', async ({
  page,
}) => {
  await page.goto('/');
  const footer = page.locator('.babycity-footer');
  await footer.scrollIntoViewIfNeeded();
  await expect(footer.locator('.footer-social-links a')).toHaveCount(4);
  const expected = [
    'https://www.tiktok.com/@babycityperu',
    'https://wa.me/51937473120',
    'https://www.instagram.com/baby.cityperu/',
    'https://www.facebook.com/profile.php?id=61584453203918',
  ];
  for (const [index, href] of expected.entries()) {
    await expect(footer.locator('.footer-social-links a').nth(index)).toHaveAttribute('href', href);
    await expect(footer.locator('.footer-social-links a').nth(index)).toHaveAttribute(
      'target',
      '_blank',
    );
  }
  await footer.locator('.footer-whatsapp').click();
  await expect(page.locator('#contactDialog')).toBeVisible();
  await page.keyboard.press('Escape');
  await footer.getByRole('link', { name: /Contacto y tienda/ }).click();
  await expect(page).toHaveURL(/\/contacto$/);
});

test('footer fits desktop, tablets and small phones', async ({ page }) => {
  for (const width of [320, 390, 768, 1024, 1280, 1536, 1920]) {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto('/');
    const footer = page.locator('.babycity-footer');
    await footer.scrollIntoViewIfNeeded();
    await footer.locator('img').evaluateAll((images) =>
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
    for (const element of await footer
      .locator('.footer-column, .footer-social-links a, .footer-whatsapp')
      .all()) {
      const box = await element.boundingBox();
      expect(box.x).toBeGreaterThanOrEqual(0);
      expect(box.x + box.width).toBeLessThanOrEqual(width + 1);
    }
    if ([390, 1536].includes(width)) {
      await page
        .locator('.contact-float,.skip')
        .evaluateAll((nodes) => nodes.forEach((node) => (node.style.visibility = 'hidden')));
      await footer.screenshot({ path: `test-results/footer-${width}.png`, animations: 'disabled' });
    }
  }
});
