import { test, expect } from '@playwright/test';

for (const [method, width] of [
  ['yape', 390],
  ['bcp', 1440],
  ['coordinate', 320],
  ['yape', 1366],
  ['coordinate', 1366],
]) {
  test(`confirmación ${method} a ${width}px: datos del medio elegido, diseño adaptable y copia del código`, async ({
    page,
    context,
  }, testInfo) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    await page.setViewportSize({ width, height: width > 900 ? 768 : 1000 });
    await page.addInitScript(() =>
      localStorage.setItem('bc-cart-v2', JSON.stringify([{ id: 2, quantity: 1 }])),
    );
    await page.goto('/compra');
    await page.locator(`[name=paymentMethod][value=${method}]`).check();
    await page.locator('#checkoutForm [name=name]').fill('Cliente de confirmación');
    await page.locator('#checkoutForm [name=phone]').fill('987654321');
    await page.locator('#checkoutForm [name=consent]').check();
    await page.getByRole('button', { name: 'Registrar mi solicitud' }).click();
    const confirmation = page.locator('.order-success');
    await expect(confirmation).toBeVisible();
    if (width > 900) {
      const bounds = await confirmation.boundingBox();
      expect(bounds.y).toBeGreaterThanOrEqual(0);
      expect(bounds.y + bounds.height).toBeLessThanOrEqual(768);
    }
    await expect(confirmation.locator(`.payment-brand-${method}`)).toBeVisible();
    const summary = confirmation.getByRole('region', { name: 'Pago del pedido' });
    await expect(summary).toContainText(
      method === 'coordinate' ? 'Por coordinar' : 'Por verificar',
    );
    await expect(summary).toContainText('20614491036');
    if (method === 'bcp') {
      await expect(summary).toContainText('1947227359024');
      await expect(summary).toContainText('00219400722735902499');
      await expect(summary).not.toContainText('913 205 364');
    } else if (method === 'yape') {
      await expect(summary).toContainText('913 205 364');
      await expect(summary).not.toContainText('1947227359024');
    } else {
      await expect(summary).toContainText('Te ayudamos a elegir cómo pagar');
      await expect(summary.locator('.success-account')).toHaveCount(0);
    }
    const code = await confirmation.locator('.success-code > strong').textContent();
    await confirmation.getByRole('button', { name: 'Copiar código' }).click();
    expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(code);
    await expect(page.locator('#toast')).toContainText('Copiado');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    await page.screenshot({
      path: testInfo.outputPath(`confirmation-${method}.png`),
      fullPage: true,
    });
  });
}
