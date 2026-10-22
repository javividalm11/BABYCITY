const GENERIC_ERROR = 'No se pudo completar la solicitud.';

// Llamo a la API del sitio; los errores llegan como Error con mensaje apto y el código HTTP.
export async function api(url, method = 'GET', data) {
  const response = await fetch(url, {
    method,
    headers: data ? { 'Content-Type': 'application/json' } : {},
    body: data ? JSON.stringify(data) : undefined,
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw Object.assign(new Error(body.error || GENERIC_ERROR), { status: response.status });
  }
  return body;
}
