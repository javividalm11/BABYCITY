import { money } from '../lib/format.js';

const normalize = (value) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
const stopWords = new Set([
  'hola',
  'quiero',
  'busco',
  'tienen',
  'necesito',
  'para',
  'una',
  'unos',
  'unas',
  'del',
  'que',
  'por',
  'con',
  'los',
  'las',
  'bebe',
  'recomiendas',
  'recomienda',
  'gustaria',
  'comprar',
  'producto',
  'productos',
  'favor',
]);

// Answers use the loaded store data; no fabricated prices, stock or delivery times.
export function getChatReply(message, { products, catalogs, shipping }) {
  const query = normalize(message);
  if (/asesor|persona|humano|whatsapp|contactar/.test(query))
    return {
      text: '¡Claro! Nuestro equipo puede ayudarte a elegir y confirmar disponibilidad, entrega y pago. Cuéntanos qué necesitas y continuamos por WhatsApp.',
      handoff: true,
    };
  if (/envio|provincia|delivery|agencia|despacho/.test(query)) {
    const rates = [
      ['Lima', shipping.lima],
      ['Provincias', shipping.province],
    ]
      .filter(([, fee]) => Number.isFinite(fee))
      .map(([destination, fee]) => `${destination}: ${money(fee)}.`);
    return {
      text: `Sí, coordinamos envíos a todo el Perú. La cobertura, agencia, plazo y costo final se confirman según tu destino antes del pago.${rates.length ? '\n' + rates.join(' ') : ' Nuestro equipo te comparte la cotización para tu ciudad.'}`,
      handoff: true,
    };
  }
  if (/ubic|direccion|donde.*(estan|queda|tienda)|horario|visita|tienda fisica|recojo/.test(query))
    return {
      text: 'Estamos en Jr. Antonio Raymondi 512, La Victoria, Lima. Puedes conocer los productos y recoger tu pedido sin costo de envío. Coordina la fecha y el horario de tu visita con nuestro equipo.',
      links: [{ label: 'Conoce nuestra tienda', href: '/contacto' }],
    };
  if (/pagar|pago|yape|plin|tarjeta|contra entrega/.test(query))
    return {
      text: 'Nuestro equipo te confirma los medios de pago habilitados junto con la disponibilidad y la entrega. La web no solicita datos de tarjetas ni realiza cobros en línea.',
      handoff: true,
    };
  if (/catalog|pdf|coleccion/.test(query))
    return {
      text: `Puedes hojear ${catalogs.length ? `nuestras ${catalogs.length} colecciones` : 'nuestros catálogos'} y descargar los PDF para ver cada detalle con calma.`,
      links: [{ label: 'Ver catálogos', href: '/catalogos' }],
    };

  const terms = [...new Set(query.match(/[a-z0-9]+/g) || [])].filter(
    (term) => term.length >= 3 && !stopWords.has(term),
  );
  const matches = products
    .filter((product) => product.stock !== 0)
    .map((product) => {
      const name = normalize(product.name);
      const category = normalize(product.category);
      const score = query.includes(name)
        ? 1000
        : terms.reduce(
            (sum, term) => sum + (name.includes(term) ? 3 : category.includes(term) ? 1 : 0),
            0,
          );
      return { product, score };
    })
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .filter(({ score }, index, ranked) => ranked[0].score < 1000 || score === 1000)
    .slice(0, 2)
    .map(({ product }) => product);
  if (matches.length)
    return {
      text: 'Estas son opciones de nuestro catálogo. Te ayudamos a confirmar disponibilidad y elegir según la etapa de tu bebé.',
      products: matches,
      links: [{ label: 'Explorar la tienda', href: '/tienda' }],
    };
  if (/como.*(compr|pedido)|hacer.*pedido|comprar|proceso/.test(query))
    return {
      text: 'Elige tus productos, agrégalos al carrito y completa tus datos de entrega. Después puedes enviar tu solicitud por WhatsApp. Confirmamos disponibilidad, envío y pago contigo antes de cerrar la compra.',
      links: [{ label: 'Ver productos', href: '/tienda' }],
    };
  if (/gracias/.test(query))
    return {
      text: '¡Gracias a ti por visitar BabyCity! Estoy aquí si necesitas consultar un producto, un catálogo o los detalles de tu pedido. ♡',
    };
  if (/^(hola|buenas|buenos|hey|buen dia)/.test(query))
    return {
      text: '¡Hola! ♡ ¿Qué estás buscando para tu bebé? Puedes decirme el nombre o la categoría de un producto, o preguntarme por envíos, catálogos y nuestra tienda.',
    };
  return {
    text: 'Puedo orientarte sobre productos del catálogo, envíos, recojo en tienda y cómo hacer tu pedido. Para una consulta más específica, nuestro equipo te ayuda por WhatsApp.',
    handoff: true,
  };
}
