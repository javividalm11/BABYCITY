import { test, expect } from '@playwright/test';

test('footer preserves social destinations and opens the existing contact dialog', async ({
  page,
}) => {
  await page.goto('/');
  const footer = page.locator('.babycity-footer');
  await footer.scrollIntoViewIfNeeded();
  const payments = footer.getByRole('region', { name: 'Medios de pago' });
  await expect(payments.getByRole('img', { name: 'Yape Empresas' })).toBeVisible();
  await expect(payments.getByRole('img', { name: 'Transferencia BCP en soles' })).toBeVisible();
  await expect(payments.getByRole('img', { name: 'Visa', exact: true })).toBeVisible();
  await expect(payments.getByRole('img', { name: 'Mastercard', exact: true })).toBeVisible();
  await expect(payments.locator('img')).toHaveCount(4);
  await expect(payments).not.toContainText(
    /Plin|Medios de pago oficiales|Env\u00edos a todo el Per\u00fa/i,
  );
  const admin = await footer.locator('.footer-floor-inner > a').boundingBox();
  const logos = await payments.boundingBox();
  expect(logos.y).toBeGreaterThanOrEqual(admin.y + admin.height);
  expect(
    Math.abs(logos.x + logos.width / 2 - (await page.evaluate(() => innerWidth)) / 2),
  ).toBeLessThan(2);
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

test('floating contact fades out at the footer and returns when scrolling away', async ({
  page,
}) => {
  for (const width of [390, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/nosotros', { waitUntil: 'domcontentloaded' });
    const button = page.locator('.contact-float');
    await expect(button).toHaveCSS('opacity', '1');
    await page.locator('.babycity-footer').scrollIntoViewIfNeeded();
    await expect(button).toHaveClass(/is-footer-hidden/);
    await expect(button).toHaveCSS('opacity', '0');
    expect(await button.evaluate((element) => element.inert)).toBe(true);
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
    await expect(button).not.toHaveClass(/is-footer-hidden/);
    await expect(button).toHaveCSS('opacity', '1');
    expect(await button.evaluate((element) => element.inert)).toBe(false);
  }
});
