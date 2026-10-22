import { test, expect } from '@playwright/test';

test('redesigned cart updates quantities, totals and favorites and continues to checkout', async ({
  page,
}) => {
  await page.addInitScript(() =>
    localStorage.setItem('bc-cart-v2', JSON.stringify([{ id: 2, quantity: 1 }])),
  );
  await page.goto('/');
  await page.getByRole('button', { name: 'Abrir carrito' }).click();
  const drawer = page.locator('#cartDialog');
  const item = drawer.locator('.cart-item');
  await expect(item).toHaveCount(1);
  await expect(drawer.locator('h2')).toHaveText('Tu carrito (1)');
  const original = await drawer.locator('.total b').textContent();
  await item.getByRole('button', { name: /Aumentar cantidad/ }).click();
  await expect(drawer.locator('h2')).toHaveText('Tu carrito (2)');
  await expect(drawer.locator('.total b')).not.toHaveText(original);
  await item.getByRole('button', { name: /Reducir cantidad/ }).click();
  await expect(drawer.locator('.total b')).toHaveText(original);
  await item.getByRole('button', { name: 'Guardar en favoritos' }).click();
  await expect(item.locator('[data-wish]')).toHaveAttribute('aria-pressed', 'true');
  await drawer.getByRole('button', { name: 'Seguir comprando' }).click();
  await expect(drawer).not.toBeVisible();
  await page.getByRole('button', { name: 'Abrir carrito' }).click();
  await expect(item.locator('[data-wish]')).toHaveAttribute('aria-pressed', 'true');
  await drawer.getByRole('button', { name: 'Continuar con mi pedido' }).click();
  await expect(page.locator('#checkoutForm')).toBeVisible();
  await drawer.getByRole('button', { name: /Volver al carrito/ }).click();
  await item.getByRole('button', { name: /Quitar .* del carrito/ }).click();
  await expect(drawer.locator('.cart-empty')).toBeVisible();
  await expect(page.locator('#cartCount')).toHaveText('0');
});

test('cart fits desktop and small mobile screens', async ({ page }) => {
  await page.addInitScript(() =>
    localStorage.setItem('bc-cart-v2', JSON.stringify([{ id: 2, quantity: 1 }])),
  );
  for (const width of [1440, 390, 320]) {
    await page.setViewportSize({ width, height: 844 });
    await page.goto('/');
    await page.getByRole('button', { name: 'Abrir carrito' }).click();
    const drawer = page.locator('#cartDialog');
    await drawer
      .locator('img')
      .evaluateAll((images) => Promise.all(images.map((image) => image.decode())));
    expect(await drawer.evaluate((el) => el.scrollWidth <= el.clientWidth)).toBe(true);
    const bounds = await drawer.boundingBox();
    expect(bounds.x).toBeGreaterThanOrEqual(0);
    expect(bounds.x + bounds.width).toBeLessThanOrEqual(width);
    await drawer.screenshot({ path: `test-results/cart-${width}.png` });
    await drawer.getByRole('button', { name: 'Seguir comprando' }).click();
    await expect(drawer).not.toBeVisible();
  }
});
