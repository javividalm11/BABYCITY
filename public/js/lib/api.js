const GENERIC_ERROR = 'No se pudo completar la solicitud.';

// Llamo a la API del sitio; los errores llegan como Error con un mensaje apto para mostrar.
export async function api(url, method = 'GET', data) {
  const response = await fetch(url, {
    method,
    headers: data ? { 'Content-Type': 'application/json' } : {},
    body: data ? JSON.stringify(data) : undefined,
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.error || GENERIC_ERROR);
  return body;
}
