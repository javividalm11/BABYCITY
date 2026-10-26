import { test, expect } from '@playwright/test';

for (const [method, label] of [
  ['yape', 'Yape Empresas'],
  ['bcp', 'Transferencia BCP en soles'],
]) {
  test(`pago ${method}: datos oficiales, solicitud y WhatsApp sin acreditar el abono`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: 320, height: 844 });
    await page.addInitScript(() =>
      localStorage.setItem('bc-cart-v2', JSON.stringify([{ id: 2, quantity: 1 }])),
    );
    await page.goto('/');
    await page.getByRole('button', { name: 'Abrir carrito' }).click();
    await page.getByRole('button', { name: 'Continuar con mi pedido' }).click();
    const form = page.locator('#checkoutForm');
    const payments = form.getByRole('group', { name: 'Medios de pago oficiales' });
    for (const value of [
      '913 205 364',
      '1947227359024',
      '00219400722735902499',
      'GRUPO BABY STORE S.A.C.',
      '20614491036',
    ]) {
      await expect(payments).toContainText(value);
    }
    await payments.getByRole('radio', { name: new RegExp(label) }).check();
    await form.locator('[name=name]').fill('Cliente de pagos');
    await form.locator('[name=phone]').fill('987654321');
    await form.locator('[name=consent]').check();
    const responsePromise = page.waitForResponse(
      (response) =>
        response.url().endsWith('/api/orders') && response.request().method() === 'POST',
    );
    await form.getByRole('button', { name: 'Registrar mi solicitud' }).click();
    const response = await responsePromise;
    expect(response.status()).toBe(201);
    expect(response.request().postDataJSON().paymentMethod).toBe(method);
    const order = await response.json();
    expect(order.payment).toEqual({
      method,
      status: 'pending_verification',
      receiptChannel: 'whatsapp',
    });
    const summary = page.getByRole('region', { name: 'Pago del pedido' });
    await expect(summary).toContainText(label);
    await expect(summary).toContainText('Pago no verificado');
    await expect(summary).toContainText(method === 'yape' ? '913 205 364' : '00219400722735902499');
    const link = page.getByRole('link', { name: 'Enviar mi pedido por WhatsApp' });
    const message = new URL(await link.getAttribute('href')).searchParams.get('text');
    expect(message).toContain(order.id);
    expect(message).toContain(`Medio de pago: ${label}`);
    expect(message).toContain('Pago no verificado');
    expect(
      await page.locator('.purchase-page').evaluate((el) => el.scrollWidth <= el.clientWidth),
    ).toBe(true);
  });
}
