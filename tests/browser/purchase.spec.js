import { test, expect } from '@playwright/test';

test('la compra tiene ruta propia, conserva el carrito y se adapta a móvil y escritorio', async ({
  page,
}, testInfo) => {
  await page.addInitScript(() =>
    localStorage.setItem('bc-cart-v2', JSON.stringify([{ id: 2, quantity: 2 }])),
  );
  for (const width of [320, 390, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/compra');
    await expect(page.locator('#checkoutForm')).toBeVisible();
    await expect(page.locator('#cartDialog')).not.toBeVisible();
    await expect(page.locator('#purchaseItems .purchase-item')).toHaveCount(1);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    await page.screenshot({ path: testInfo.outputPath(`purchase-${width}.png`), fullPage: true });
  }
  await page.reload();
  await expect(page.locator('#checkoutForm')).toBeVisible();
  await page.locator('#checkoutForm [name=name]').fill('Cliente con datos');
  await page.getByRole('button', { name: 'Editar carrito' }).click();
  await page.getByRole('button', { name: /Aumentar cantidad/ }).click();
  await page.getByRole('button', { name: 'Continuar con mi pedido' }).click();
  await expect(page.locator('#checkoutForm [name=name]')).toHaveValue('Cliente con datos');
  await expect(page.locator('#purchaseItems')).toContainText('3 ×');
});

test('la página de compra vacía permite regresar a la tienda', async ({ page }) => {
  await page.goto('/compra');
  await expect(page.getByRole('heading', { name: 'Tu carrito está vacío' })).toBeVisible();
  await expect(page.locator('#checkoutForm')).toHaveCount(0);
  await page.getByRole('link', { name: 'Explorar la tienda' }).click();
  await expect(page).toHaveURL(/\/tienda$/);
});
