import { test, expect } from '@playwright/test';

for (const width of [320, 1440]) {
  test(`logo WhatsApp consistente y reglas del widget conservadas a ${width}px`, async ({
    page,
  }) => {
    test.setTimeout(90000);
    await page.setViewportSize({ width, height: 900 });
    await page.route('https://www.google.com/maps**', (route) => route.abort());
    await page.addInitScript(() =>
      localStorage.setItem('bc-cart-v2', JSON.stringify([{ id: 2, quantity: 1 }])),
    );
    for (const route of [
      '/',
      '/tienda',
      '/producto/2',
      '/catalogos',
      '/servicios',
      '/nosotros',
      '/contacto',
      '/favoritos',
      '/reclamaciones',
      '/compra',
      '/legal/terminos',
      '/legal/privacidad',
      '/legal/devoluciones',
      '/admin',
    ]) {
      await page.goto(route, { waitUntil: 'domcontentloaded' });
      const widget = page.locator('.contact-float');
      await expect(widget.locator('#waIcon svg')).toHaveAttribute('viewBox', '0 0 720 720');
      await expect(page.locator('.footer-social-links a[href*="wa.me"] > svg')).toHaveAttribute(
        'viewBox',
        '0 0 720 720',
      );
      await expect(page.locator('.footer-whatsapp-icon svg')).toHaveAttribute(
        'viewBox',
        '0 0 720 720',
      );
      await expect(page.locator('svg path[d^="M21 11a9"]')).toHaveCount(0);
      if (route === '/') {
        await expect(page.locator('body')).toHaveClass(/hero-in-view/);
        await expect(widget).not.toBeVisible();
        await expect(
          page.locator('.shopping-benefit-grid article').last().locator('svg'),
        ).toHaveAttribute('viewBox', '0 0 720 720');
        await expect(page.locator('.community-wa-emblem svg')).toHaveAttribute(
          'viewBox',
          '0 0 720 720',
        );
      }
      if (route === '/compra') {
        await expect(page.locator('#checkoutForm')).toBeVisible();
        await expect(widget).not.toBeVisible();
      }
      if (route === '/contacto') {
        await expect(page.locator('.contact-shortcut-icon.whatsapp svg')).toHaveAttribute(
          'viewBox',
          '0 0 720 720',
        );
      }
    }
  });
}
