import { expect, test } from '@playwright/test';

const USER = 'browser-test';
const PASSWORD = 'test-only-password-123';
const TEMPORARY = 'clave-temporal-de-prueba-2026';

async function login(page) {
  await page.goto('/admin');
  await page.getByLabel('Usuario', { exact: true }).fill(USER);
  await page.getByLabel('Contraseña', { exact: true }).fill(PASSWORD);
  await page.getByRole('button', { name: 'Ingresar' }).click();
  await expect(page.getByRole('heading', { name: 'Hola, BabyCity.' })).toBeVisible();
}

const openProfile = async (page) => {
  await page.locator('.site-account').click();
  await expect(page.locator('#accountDialog')).toBeVisible();
};

async function changePassword(page, current, next, repeat = next) {
  await page.getByRole('button', { name: 'Cambiar contraseña' }).click();
  await page.getByLabel('Contraseña actual').fill(current);
  await page.getByLabel(/^Nueva contraseña/).fill(next);
  await page.getByLabel('Repite la nueva contraseña').fill(repeat);
  await page.getByRole('button', { name: 'Guardar contraseña' }).click();
}

test('un visitante que pulsa Cuenta ve la atención personalizada', async ({ page }) => {
  await page.goto('/');
  await page.locator('.site-account').click();
  await expect(page.locator('#contactDialog')).toBeVisible();
  await expect(page.locator('#accountDialog')).toBeHidden();
});

test('el administrador ve su perfil y puede ir al panel o cerrar sesión', async ({ page }) => {
  await login(page);
  await page.goto('/');
  await openProfile(page);
  await expect(page.locator('#accountDialog')).toContainText(USER);
  await page.getByRole('link', { name: 'Ir al panel' }).click();
  await expect(page.getByRole('heading', { name: 'Hola, BabyCity.' })).toBeVisible();
  await openProfile(page);
  await page.locator('#accountDialog').getByRole('button', { name: 'Cerrar sesión' }).click();
  await expect(page.getByRole('heading', { name: 'Hola de nuevo.' })).toBeVisible();
  await page.locator('.site-account').click();
  await expect(page.locator('#contactDialog')).toBeVisible();
});

test('cambiar la contraseña desde el perfil valida los datos y se puede revertir', async ({
  page,
}) => {
  await login(page);
  await openProfile(page);
  await changePassword(page, PASSWORD, TEMPORARY, 'otra-distinta-de-prueba-99');
  await expect(page.locator('#passwordForm .form-status')).toContainText('no coinciden');
  await page.getByLabel('Contraseña actual').fill('incorrecta-incorrecta');
  await page.getByLabel('Repite la nueva contraseña').fill(TEMPORARY);
  await page.getByRole('button', { name: 'Guardar contraseña' }).click();
  await expect(page.locator('#passwordForm .form-status')).toContainText('no es correcta');

  await page.getByLabel('Contraseña actual').fill(PASSWORD);
  await page.getByRole('button', { name: 'Guardar contraseña' }).click();
  await expect(page.locator('#toast')).toContainText('Contraseña actualizada');

  await page.keyboard.press('Escape');
  await openProfile(page);
  await changePassword(page, TEMPORARY, PASSWORD);
  await expect(page.locator('#toast')).toContainText('Contraseña actualizada');
});

test('puedo cerrar las sesiones de otros dispositivos', async ({ page, browser }) => {
  await login(page);
  const phone = await browser.newContext();
  const phonePage = await phone.newPage();
  await login(phonePage);

  await openProfile(page);
  await page.getByRole('button', { name: 'Cerrar otras sesiones' }).click();
  await expect(page.locator('#toast')).toContainText('Se cerraron');

  await phonePage.getByRole('button', { name: 'Actividad' }).click();
  await expect(phonePage.getByRole('heading', { name: 'Hola de nuevo.' })).toBeVisible();
  await phone.close();
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Hola, BabyCity.' })).toBeVisible();
});
