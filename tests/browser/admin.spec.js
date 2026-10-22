import { expect, test } from '@playwright/test';

const ORIGIN = 'http://127.0.0.1:3001';
const CUSTOMER = { name: 'Cliente de Prueba', phone: '987 654 321', consent: true };

async function login(page) {
  await page.goto('/admin');
  await page.getByLabel('Usuario', { exact: true }).fill('browser-test');
  await page.getByLabel('Contraseña', { exact: true }).fill('test-only-password-123');
  await page.getByRole('button', { name: 'Ingresar' }).click();
  await expect(page.getByRole('heading', { name: 'Hola, BabyCity.' })).toBeVisible();
}

const post = (page, route, data) => page.request.post(route, { data, headers: { Origin: ORIGIN } });

test('un producto nuevo se crea, se encuentra con filtros y se elimina', async ({ page }) => {
  await login(page);
  await page.getByRole('button', { name: '+ Agregar producto' }).click();
  await page.getByLabel('Nombre', { exact: true }).fill('Producto temporal de prueba');
  await page.getByLabel('Precio (S/)', { exact: true }).fill('12.5');
  await page.getByLabel('Stock (vacío = por confirmar)', { exact: true }).fill('0');
  await page.getByRole('button', { name: 'Guardar producto' }).click();
  await expect(page.locator('.admin-editor')).toHaveCount(0);

  await page.getByLabel('Filtrar productos').selectOption('soldout');
  const row = page.locator('tr', { hasText: 'Producto temporal de prueba' });
  await expect(row).toHaveCount(1);
  await expect(page.locator('#adminCount')).toContainText('1 de');

  page.once('dialog', (dialog) => dialog.accept());
  await row.getByRole('button', { name: 'Editar' }).click();
  await page.getByRole('button', { name: 'Eliminar producto' }).click();
  await expect(page.locator('tr', { hasText: 'Producto temporal de prueba' })).toHaveCount(0);

  await page.getByRole('button', { name: 'Actividad' }).click();
  await expect(page.getByRole('cell', { name: 'Producto eliminado' }).first()).toBeVisible();
  await expect(page.getByRole('cell', { name: 'Producto creado' }).first()).toBeVisible();
});

test('los pedidos se filtran, guardan una nota interna y se exportan', async ({ page }) => {
  const created = await post(page, '/api/orders', {
    ...CUSTOMER,
    delivery: 'pickup',
    items: [{ id: 1, quantity: 1 }],
  });
  const { id } = await created.json();
  await login(page);
  await page.getByRole('button', { name: 'Pedidos', exact: true }).click();

  await page.getByLabel('Buscar pedidos').fill(id);
  await expect(page.locator('.admin-record')).toHaveCount(1);
  await page.getByLabel('Filtrar por estado').selectOption('cancelado');
  await expect(page.locator('.admin-record')).toHaveCount(0);
  await page.getByLabel('Filtrar por estado').selectOption('all');

  await page.locator(`[data-note="${id}"]`).fill('Llamar mañana por la tarde');
  await page.locator(`[data-save-note="${id}"]`).click();
  await expect(page.locator('#toast')).toContainText('Nota guardada');

  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: /Exportar a Excel/ }).click();
  expect((await download).suggestedFilename()).toMatch(/^babycity-pedidos-\d{4}-\d{2}-\d{2}\.csv$/);

  await page.reload();
  await page.getByRole('button', { name: 'Pedidos', exact: true }).click();
  await page.getByLabel('Buscar pedidos').fill(id);
  await expect(page.locator(`[data-note="${id}"]`)).toHaveValue('Llamar mañana por la tarde');
});

test('un pedido se puede eliminar desde el panel', async ({ page }) => {
  const created = await post(page, '/api/orders', {
    ...CUSTOMER,
    delivery: 'pickup',
    items: [{ id: 1, quantity: 1 }],
  });
  const { id } = await created.json();
  await login(page);
  await page.getByRole('button', { name: 'Pedidos', exact: true }).click();
  await page.getByLabel('Buscar pedidos').fill(id);
  await expect(page.locator('.admin-record')).toHaveCount(1);
  page.once('dialog', (dialog) => dialog.accept());
  await page.getByRole('button', { name: 'Eliminar pedido' }).click();
  await expect(page.locator('.admin-record')).toHaveCount(0);
  await page.getByRole('button', { name: 'Actividad' }).click();
  await expect(page.getByRole('cell', { name: 'Pedido eliminado' }).first()).toBeVisible();
});

test('las consultas pendientes se marcan como atendidas y se pueden reabrir', async ({ page }) => {
  await post(page, '/api/leads', { ...CUSTOMER, message: 'Consulta para marcar como atendida' });
  await login(page);
  await page.getByRole('button', { name: 'Consultas', exact: true }).click();
  const card = page.locator('.admin-record', { hasText: 'Consulta para marcar como atendida' });
  await card.getByRole('button', { name: 'Marcar como atendido' }).click();
  await expect(page.locator('.admin-record', { hasText: 'Consulta para marcar' })).toHaveCount(0);

  await page.getByLabel('Filtrar registros').selectOption('all');
  const handled = page.locator('.admin-record', { hasText: 'Consulta para marcar como atendida' });
  await expect(handled.getByText('Atendido')).toBeVisible();
  await handled.getByRole('button', { name: 'Reabrir' }).click();
  await page.getByLabel('Filtrar registros').selectOption('pending');
  await expect(
    page.locator('.admin-record', { hasText: 'Consulta para marcar como atendida' }),
  ).toHaveCount(1);
});

test('una sesión caducada lleva al inicio de sesión con un aviso', async ({ page, context }) => {
  await login(page);
  await context.clearCookies();
  await page.getByRole('button', { name: 'Actividad' }).click();
  await expect(page.getByRole('heading', { name: 'Hola de nuevo.' })).toBeVisible();
  await expect(page.getByText('Tu sesión terminó. Ingresa de nuevo.')).toBeVisible();
});
