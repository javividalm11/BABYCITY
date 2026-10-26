const root = '/assets/testimonios/seleccion';

export const workPhotos = {
  box: `${root}/servicios/caja-premium.webp`,
  gifts: `${root}/servicios/regalos-preparados.webp`,
  personalized: `${root}/servicios/regalo-personalizado.webp`,
  detail: `${root}/servicios/detalle-regalo.webp`,
  presentation: `${root}/servicios/presentacion-original.webp`,
  agency: `${root}/envios/agencia.webp`,
  dispatch: `${root}/envios/despacho.webp`,
  agencyParcel: `${root}/envios/pedido-en-agencia.webp`,
  agencyParcels: `${root}/envios/pedidos-en-agencia.webp`,
  dispatchedRocker: `${root}/envios/mecedora-despachada.webp`,
  collection: `${root}/opiniones/recojo.webp`,
};

// Fragmentos de los mensajes que aparecen en las capturas entregadas por BabyCity.
export const customerStories = [
  {
    name: 'Loidita',
    quote: 'Muchas gracias excelentes productos. Me encantaron.',
    caption: 'Después de recibir sus productos',
    image: `${root}/opiniones/productos.webp`,
    alt: 'Captura de WhatsApp con agradecimiento por los productos recibidos y una foto del coche',
  },
  {
    name: 'Teffita',
    quote: 'Gracias 100% recomendado mi pedido llegó fabuloso',
    caption: 'Una recomendación después de la entrega',
    image: `${root}/opiniones/recomendacion.webp`,
    alt: 'Captura de WhatsApp con la recomendación de una clienta después de recibir su pedido',
  },
  {
    name: 'Luis',
    quote: 'Ya me llegó está muy bonito',
    caption: 'Atención y orientación después de la entrega',
    image: `${root}/opiniones/asesoria.webp`,
    alt: 'Conversación de WhatsApp sobre un pedido recibido y orientación para su armado',
  },
  {
    name: 'Annie',
    quote: 'Muchas gracias ya recogí',
    caption: 'Confirmación de recojo',
    image: `${root}/opiniones/recojo.webp`,
    alt: 'Captura de WhatsApp con la confirmación de recojo y el agradecimiento de una clienta',
  },
];

// Fotografías de paquetes que no se utilizaban en las otras secciones.
export const packagePhotos = [
  [
    'pedidos-embalados',
    'Pedidos embalados en nuestra tienda',
    'Productos reunidos y embalados en cajas para su despacho',
  ],
  [
    'productos-protegidos',
    'Cuidamos cada producto',
    'Productos protegidos con envoltura transparente para su traslado',
  ],
  [
    'despacho-en-agencia',
    'Coordinamos tu despacho',
    'Cajas de productos BabyCity en la agencia de transporte',
  ],
  [
    'cajas-preparadas',
    'Preparados para el viaje',
    'Dos cajas de productos embaladas en la agencia',
  ],
  [
    'paquete-protegido',
    'Protección para el traslado',
    'Caja de producto protegida con envoltura transparente',
  ],
  ['listo-para-envio', 'Un pedido listo para enviar', 'Caja embalada e identificada por BabyCity'],
].map(([file, caption, alt]) => ({ image: `${root}/paquetes/${file}.webp`, caption, alt }));
