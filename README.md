# BabyCity Perú

Plataforma e-commerce en español: Node.js (HTTP nativo), SQLite persistente y una interfaz responsive sin dependencias de ejecución. Se conservó el material original; la aplicación actual está en `public/`.

## Ejecutar en Windows

Requiere Node.js 22.13 o posterior (recomendado: Node.js 24 LTS).

```powershell
cd C:\websites\BABYCITY
npm.cmd start
```

Abrir http://127.0.0.1:3000. No abrir `public/index.html` directamente: productos, administración y formularios necesitan el servidor.

Para desarrollo con reinicio automático: `npm.cmd run dev`.

## Configurar administración

La ruta es `/admin`. No hay usuario con contraseña predeterminada. Desde PowerShell:

```powershell
$env:ADMIN_USER = 'babycity'
$adminSecret = Read-Host 'Contraseña nueva (mínimo 14 caracteres)' -AsSecureString
$env:ADMIN_PASSWORD = [System.Net.NetworkCredential]::new('', $adminSecret).Password
npm.cmd run admin:setup
Remove-Item Env:ADMIN_PASSWORD
```

El comando también permite restablecer la contraseña e invalida las sesiones anteriores. Las contraseñas se guardan con scrypt y sal aleatoria. Las sesiones duran ocho horas, se almacenan con hash y usan cookies HttpOnly y SameSite=Strict. No publicar contraseñas en el código ni en el repositorio.

El panel permite crear/editar/ocultar productos; cambiar precio, descripción y cantidades; subir imágenes de hasta 1 MB; revisar solicitudes, consultas y reclamaciones; actualizar estados de pedidos; configurar tarifas y exportar datos.

## Catálogos y carga inicial

- **50 productos**, dentro del alcance inicial del contrato.
- **12 catálogos**, **195 páginas**, con animación de giro, zoom, navegación por teclado, deslizado móvil y descarga del PDF original.
- El visor comparte el motor StPageFlip 2.0.7 del proyecto `C:\JAVI-PROYECTOS\BOOKS`: hojas con curvatura y sombras, arrastre de esquinas, dos páginas en escritorio, una en móvil, pantalla completa e inicio/final. La librería se sirve localmente desde `public/vendor/`, junto con su licencia MIT; no requiere CDN. `node scripts/vendor-pageflip.mjs` regenera los archivos desde la dependencia fijada en `package-lock.json`, separa la hoja CSS para respetar CSP y detiene la animación al destruir cada instancia.
- Imágenes y precios extraídos del material del cliente. `data/products.json` conserva catálogo y página de procedencia.
- Los PDF no especifican cantidades de inventario. `stock: null` significa **por confirmar**, `0` significa **agotado**, y un entero positivo indica unidades disponibles.
- Las variantes del mismo modelo se agruparon; algunas propuestas del catálogo no están entre los 50 productos iniciales y siguen disponibles en el lector completo.
- Las imágenes del hero son ambientación. Las fichas utilizan el material de los PDF. No se incorporaron testimonios, descuentos ni métricas ficticias.

Reimportación reproducible (solo cuando cambie el material):

```powershell
python -m pip install pymupdf Pillow
python scripts/import_catalogs.py
```

Esto regenera imágenes, páginas y el JSON inicial. **No sobrescribe productos de una base de datos existente**. La base se inicializa desde el JSON únicamente cuando no contiene productos. Los cambios posteriores se realizan desde el panel.

## Pedidos e inventario

El flujo registra una **solicitud de compra**, devuelve un código y permite enviarla por WhatsApp. No realiza cargos ni confirma pagos. Los importes se recalculan en el servidor usando precios vigentes; nunca se aceptan totales del navegador. Las cantidades se validan contra el stock conocido.

Una solicitud no reserva ni descuenta stock. El operador confirma producto, variante y envío por WhatsApp y actualiza existencias al cerrar la venta, incluyendo ventas de tienda física y otros canales.

Recojo en tienda: S/ 0. Lima y provincias: tarifa por cotizar hasta configurarla en administración. Cuando falta una tarifa se informa el subtotal y se deja el total pendiente, sin presentar el envío como gratuito.

## Persistencia y respaldo

`data/babycity.sqlite` guarda productos, cuentas, sesiones, solicitudes, consultas, reclamaciones y tarifas. No está en la carpeta pública. Las imágenes nuevas se guardan en `public/assets/uploads/`.

```powershell
npm.cmd run backup
```

Se genera una instantánea consistente SQLite en `backups/`. Respaldar también `public/assets/uploads/`, `public/assets/catalogs/`, `catalogo/` y `data/products.json`. El archivo JSON del panel es una exportación de negocio, no sustituye al respaldo íntegro de SQLite. Para restaurar, detener el servidor y recuperar una copia de la base junto con sus imágenes. Los respaldos contienen datos personales y deben tener acceso restringido.

## Verificación

```powershell
npm.cmd install --cache .npm-cache
npm.cmd test
npm.cmd run test:browser
```

Las pruebas de API usan una base temporal independiente. Las pruebas de navegador inician su propio servidor en el puerto 3001 y una base de pruebas; la cuenta `browser-test` existe únicamente en esa base aislada. Playwright usa Chrome instalado en Windows. En otro sistema: `npx playwright install chromium`.

Se comprueban autenticación, edición de precios/stock, privacidad de archivos, consentimiento, cálculo de pedidos, tarifas, rechazo de solicitudes entre orígenes, persistencia de reclamaciones, búsqueda, favoritos, carrito, checkout, lector, vista móvil y SEO.

## Publicación y dominio

Esta entrega se ejecuta localmente. No se ha configurado dominio, hosting, SSL ni cuentas de terceros del cliente. Es una aplicación con servidor y disco persistente; publicar únicamente `public/` en un hosting estático no habilita el panel ni los formularios.

Se incluye un `Dockerfile` para desplegar en un servidor o servicio de contenedores con volúmenes persistentes. En producción:

- `HOST=0.0.0.0`, `PORT=3000`.
- `SITE_URL=https://DOMINIO-DEL-CLIENTE` genera URLs canónicas y `/sitemap.xml` con el dominio real.
- `COOKIE_SECURE=true` cuando el acceso sea por HTTPS.
- Terminar HTTPS en el proxy/hosting y conservar el encabezado Host original para las validaciones de origen.
- Conservar la base de datos y los archivos subidos en volúmenes persistentes. Utilizar una sola instancia con SQLite; para múltiples instancias se requiere migrar a una base compartida.
- Configurar cuenta administrativa y comprobar un pedido, un respaldo y su restauración en el entorno definitivo.

Los archivos privados del contrato no son servidos por HTTP y se excluyen del contenedor. El backend solo expone recursos de `public/`, PDF de `catalogo/` y las rutas de API definidas.

## Alcance contractual y servicios externos

Implementado localmente: diseño responsive, productos iniciales, carrito con importes y envíos, formulario WhatsApp con consentimiento, panel autogestionable, persistencia, SEO por producto, sitemap dinámico, robots, Schema.org, textos legales y Libro de Reclamaciones con constancia descargable.

Para la puesta en producción faltan el dominio y hosting del cliente, SSL y la configuración de su cuenta administrativa. El responsable debe confirmar inventario, variantes, tarifas, condiciones comerciales y que los textos describan su operación real.

Las integraciones post-lanzamiento del contrato quedan pendientes de las cuentas y configuración del cliente: Izipay/Yape/Plin, WhatsApp Business API, chatbot IA, GA4, Search Console, Meta Pixel y servicios de mensajería. El historial de solicitudes y sus estados ya está disponible en el panel. No se presenta una pasarela de pago ni un chatbot ficticio.

La atención de reclamaciones se registra en el sistema; la respuesta y el cumplimiento de los plazos corresponden al operador, que debe revisar el panel. No se envía correo automático.

## Referencias consultadas

- Diseño de referencia: https://www.carestino.com.pe/
- Protección de datos: https://www.gob.pe/institucion/anpd/campa%C3%B1as/128319-nuevo-reglamento-de-proteccion-de-datos-personales
- Libro de Reclamaciones: https://www.gob.pe/institucion/indecopi/campa%C3%B1as/65149-libro-de-reclamaciones-todo-lo-que-debe-saber-antes-de-solicitarlo

Los términos del contrato y datos de cobro del desarrollador no se incluyen en el contenido comercial de la tienda.

## Hero y navbar de referencia

El hero reproduce la composición compartida por el cliente: titular en tres líneas, remate rosa, superficie curva y fotografía de habitación cálida. El navbar integra búsqueda real, atención personalizada, favoritos y carrito. Las tipografías Outfit y DM Sans se sirven localmente desde `public/assets/fonts/`, con sus licencias.

Cinco fotografías originales de los catálogos alternan sobre el fondo de ambientación. El ciclo dura 30 segundos, con un desvanecido de 1,2 segundos entre imágenes. Incluye pausa y respeta movimiento reducido. Las imágenes decorativas del hero no dependen de que un producto esté publicado en el inventario.

Fondo generado con la herramienta integrada ImageGen. Original PNG y versión WebP optimizada en `public/assets/hero/`. Prompt completo y procedencia de las cinco imágenes: `data/hero-assets.json`.
