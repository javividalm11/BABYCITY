const MAX_BYTES = 1_048_576;
const TYPES = ['image/png', 'image/jpeg', 'image/webp'];

export async function receiptPayload(form) {
  const input = form.elements.receipt;
  const file = input?.files?.[0];
  if (form.elements.receiptChannel?.value === 'upload' && !file && !input.disabled) {
    throw new Error('Adjunta tu comprobante para continuar.');
  }
  if (!file || input.disabled) return {};
  if (!TYPES.includes(file.type) || file.size > MAX_BYTES || !file.size) {
    throw new Error('Usa un comprobante PNG, JPG o WebP de hasta 1 MB.');
  }
  const receiptBase64 = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(',')[1]);
    reader.onerror = () =>
      reject(new Error('No pudimos leer el comprobante. Selecciónalo nuevamente.'));
    reader.readAsDataURL(file);
  });
  return { receiptBase64 };
}
