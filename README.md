# BabyCity Perú

Tienda en línea para BabyCity: catálogo de productos, carrito con solicitud de compra por WhatsApp, visor de catálogos, Libro de Reclamaciones y panel de administración autogestionable.

## Arquitectura

Un **núcleo único** (`src/`) atiende todas las peticiones con la API estándar `Request`/`Response`. No conoce dónde corre: recibe sus dependencias por inyección y dos adaptadores delgados lo conectan con cada entorno.

```
                  ┌──────────────── src/app.js ────────────────┐
 Request ───────► │ seguridad → rutas → dominio → repositorio  │ ───────► Response
                  └──────▲───────────────▲───────────────▲─────┘
                         │ repo          │ files         │ assets
            ┌────────────┴───┐   ┌───────┴────────┐  ┌───┴────────────┐
 Node       │ SQLite         │   │ Disco          │  │ public/ (fs)   │
 Cloudflare │ D1             │   │ R2             │  │ Static Assets  │
            └────────────────┘   └────────────────┘  └────────────────┘
```

```
src/
  app.js                 Ensambla enrutador, seguridad y manejo de errores
  config.js              Lee el entorno y lo congela
  constants.js           Estados de pedido, métodos de entrega, datos del negocio
  http/                  Enrutador, errores, respuestas, cabeceras de seguridad, lectura de JSON
  security/              Contraseñas, sesiones, límites de intentos, alta del administrador
  domain/                Validaciones, cálculo de pedidos, detección de imágenes
  routes/                API pública, API de administración, sitio (páginas, archivos, sitemap)
  seo/                   Título, descripción y datos estructurados por ruta; sitemap
  adapters/
    schema.js            Esquema SQL compartido
    node/                Servidor HTTP, SQLite, archivos en disco, carpeta pública
    cloudflare/          Worker, D1, R2
public/
  index.html             Documento base de la aplicación de página única
  css/                   Hojas de estilo
  js/
    main.js              Punto de entrada
    lib/                 Utilidades: API, formato y escape, avisos, DOM, íconos
    state/               Carrito, favoritos y datos de la tienda
    components/          Piezas de interfaz reutilizables
    views/               Una vista por página; views/sections/ para secciones de la portada
    features/            Navegación, carrito, eventos, formularios, visor de catálogos
    effects/             Animaciones de la portada
    content/             Textos legales
  vendor/                Motor del visor de catálogos con su licencia
data/products.json       Catálogo inicial (50 productos)
catalogo/                PDF originales de los catálogos
scripts/                 Respaldo, importación de catálogos, subida de PDF
tests/                   Pruebas de API (tests/api) y de navegador (tests/browser)
archive/                 Material del sitio original, solo de consulta
```

## Requisitos y arranque

Node.js 22.13 o superior (recomendado 24 LTS).

```powershell
npm install
$env:ADMIN_USER = 'babycity'
$env:ADMIN_PASSWORD = 'una-clave-de-14-caracteres-o-mas'
npm start
```

Abre http://127.0.0.1:3000. No abras `public/index.html` directamente: productos, administración y formularios necesitan el servidor. Para recarga automática usa `npm run dev`.

## Configuración

| Variable         | Uso                                                                                                                                                                  |
| ---------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ADMIN_USER`     | Usuario del panel (por defecto `admin`).                                                                                                                             |
| `ADMIN_PASSWORD` | Clave inicial del panel, mínimo 14 caracteres. Después se cambia desde el perfil; si cambias esta variable (o `ADMIN_USER`) en el servidor, la cuenta se restablece. |
| `SITE_URL`       | Dominio público sin barra final; habilita sitemap, canonical y datos estructurados.                                                                                  |
| `TRUST_PROXY`    | `true` detrás de un proxy: usa su protocolo, host e IP de cliente.                                                                                                   |
| `DB_PATH`        | Ruta de la base SQLite (por defecto `data/babycity.sqlite`).                                                                                                         |
| `UPLOAD_DIR`     | Carpeta de las imágenes subidas (por defecto `data/uploads`).                                                                                                        |
| `HOST` / `PORT`  | Dirección y puerto de escucha.                                                                                                                                       |
| `LOGIN_LIMIT`    | Intentos de ingreso por IP y por usuario cada 15 minutos (por defecto 10).                                                                                           |

No hay contraseña predeterminada: sin `ADMIN_PASSWORD` no existe cuenta administradora. Nunca guardes claves en el repositorio.

## Seguridad

- **Cabeceras en todas las respuestas:** política de contenido estricta (`default-src 'none'`, solo recursos propios, sin scripts ni estilos en línea), `frame-ancestors 'none'`, `nosniff`, `Referrer-Policy`, `Permissions-Policy`, aislamiento de origen y HSTS en HTTPS.
- **Escrituras:** solo desde el mismo sitio (`Origin` o `Sec-Fetch-Site`), con `Content-Type: application/json` y tamaño limitado.
- **Administración:** la sesión se cierra tras 30 minutos sin actividad y siempre a las 8 horas; la cookie es `HttpOnly`, `SameSite=Strict` y `Secure`, y solo se guarda el hash del token. Cada acción del panel queda en un registro de actividad (con la IP sin su último tramo) que se conserva 6 meses. Las rutas `/api/admin/*` y `/admin` no se cachean ni se indexan.
- **Contraseñas:** PBKDF2-SHA256 con sal propia y comparación en tiempo constante, también cuando el usuario no existe.
- **Límite de intentos:** por IP y por usuario en inicio de sesión, pedidos, consultas y reclamos.
- **Entradas:** validación estricta de tipos y rangos; los importes siempre se recalculan en el servidor.
- **Imágenes subidas:** se identifican por su firma real (PNG, JPG, WebP), máximo 1 MB y nombre aleatorio.
- **Archivos:** solo extensiones conocidas, sin archivos ocultos y sin salir de las carpetas públicas.
- **Interfaz:** todo texto dinámico se escapa antes de insertarse en el HTML.

## Panel de administración

Se abre en `/admin`. Pestañas:

- **Productos:** crear, editar, ocultar y eliminar; subir imágenes; buscar y filtrar por estado (publicados, ocultos, por confirmar, agotados).
- **Pedidos:** buscar por código, nombre o celular; filtrar por estado; cambiar el estado; guardar una nota interna que el cliente no ve; exportar a CSV (compatible con Excel).
- **Consultas y Reclamaciones:** ver pendientes, marcarlas como atendidas o reabrirlas; los reclamos muestran cuántos días pasaron desde su registro.
- **Actividad:** quién hizo qué y cuándo, incluidos los intentos fallidos de ingreso.
- **Envíos y respaldo:** tarifas de envío y descarga de un respaldo en JSON.

Código en `public/js/views/admin/`: `index.js` (entrada), `shell.js` (marco y pestañas), `tabs/` (una por pestaña), `product-editor.js`, `idle.js` (cierre por inactividad) y utilidades de formato y CSV. La API correspondiente está en `src/routes/admin-api.js`.

El botón **Cuenta** de la barra superior abre el perfil del administrador cuando hay sesión iniciada (para un visitante abre la atención personalizada): ir al panel, cambiar la contraseña (pide la actual y cierra las sesiones de otros dispositivos), cerrar las otras sesiones y cerrar sesión. La clave se guarda en la base de datos; `ADMIN_PASSWORD` solo crea la cuenta o la restablece si cambia.

## Pruebas y calidad

```powershell
npm test               # API y seguridad, en memoria y sin red
npm run test:browser   # Navegador con Playwright (Chrome instalado en Windows)
npm run lint           # ESLint
npm run format:check   # Prettier
npm run check          # lint + formato + pruebas de API
```

Las pruebas de navegador levantan su propio servidor en el puerto 3001 con una base nueva. En otro sistema: `npx playwright install chromium`. La integración continua ejecuta `npm run check` en cada cambio.

## Catálogos, pedidos e inventario

- 12 catálogos y 195 páginas con visor de páginas que se doblan, zoom, teclado y vista móvil. El motor se sirve desde `public/vendor/`; `node scripts/vendor-pageflip.mjs` lo regenera.
- 50 productos iniciales en `data/products.json`. `stock: null` significa **por confirmar**, `0` **agotado** y un entero positivo, unidades disponibles. La base se carga desde el JSON solo cuando está vacía; después se gestiona desde el panel.
- Para reimportar el material: `python -m pip install pymupdf Pillow` y `python scripts/import_catalogs.py`. No sobrescribe productos de una base existente.
- Un pedido es una **solicitud**: no cobra, no reserva ni descuenta stock. El equipo confirma disponibilidad, variante y envío por WhatsApp y actualiza el stock al cerrar la venta.
- Recojo en tienda: S/ 0. Lima y provincias: «por cotizar» hasta definir la tarifa en el panel.

## Despliegue

### Contenedor (Railway u otro servicio con disco persistente)

El `Dockerfile` ejecuta el servidor Node. Necesita un volumen para la base y las imágenes subidas:

| Variable                        | Valor                                |
| ------------------------------- | ------------------------------------ |
| `DB_PATH`                       | `/data/babycity.sqlite`              |
| `UPLOAD_DIR`                    | `/data/uploads`                      |
| `TRUST_PROXY`                   | `true` (ya viene en el `Dockerfile`) |
| `ADMIN_USER` / `ADMIN_PASSWORD` | credenciales del panel               |
| `SITE_URL`                      | `https://dominio-del-cliente`        |

Monta el volumen en `/data` y, si el servicio lo monta como root, define `RAILWAY_RUN_UID=0`. Usa una sola instancia mientras la base sea SQLite. Respaldo: `npm run backup` genera una copia consistente en `backups/`; respalda también el volumen de imágenes.

### Cloudflare Workers

`src/adapters/cloudflare/worker.js` usa **D1** para los datos, **R2** para imágenes y PDF, y sirve `public/` como archivos estáticos. La base se crea y se carga sola en la primera visita.

1. _Workers & Pages → Create → Import a repository_ con comando de build vacío y deploy `npx wrangler deploy`.
2. Crea el bucket R2 `babycity-files` (R2 debe estar activado en la cuenta). El D1 `babycity-db` se crea solo.
3. En _Settings → Variables and Secrets_ agrega los secretos `ADMIN_USER` y `ADMIN_PASSWORD`.
4. Define `SITE_URL` en `wrangler.jsonc` y conecta el dominio en _Domains & Routes_.
5. Sube los PDF (superan el límite de 25 MiB de los archivos estáticos): `npx wrangler login` y `npm run cf:upload-pdfs`.

Prueba local: crea `.dev.vars` (ignorado por Git) con `ADMIN_USER` y `ADMIN_PASSWORD` y ejecuta `npm run cf:dev`.

## Alcance y servicios externos

Incluye diseño responsive, catálogo, carrito, solicitud por WhatsApp con consentimiento, panel autogestionable, SEO por producto, sitemap, datos estructurados, textos legales y Libro de Reclamaciones con constancia descargable.

Quedan para después del lanzamiento, con las cuentas del cliente: pasarela de pago (Izipay, Yape, Plin), WhatsApp Business API, chatbot con IA, analítica y Meta Pixel. Las reclamaciones se registran en el sistema; la respuesta y los plazos legales son responsabilidad del operador. No se envía correo automático.

Marco normativo: [protección de datos personales](https://www.gob.pe/institucion/anpd/campa%C3%B1as/128319-nuevo-reglamento-de-proteccion-de-datos-personales) y [Libro de Reclamaciones](https://www.gob.pe/institucion/indecopi/campa%C3%B1as/65149-libro-de-reclamaciones-todo-lo-que-debe-saber-antes-de-solicitarlo).
