// Precios de lanzamiento (USD) y datos del negocio: una sola fuente para el cotizador y el asistente.
export const WHATSAPP = '573204108873';
export const EMAIL = 'junp3x.contact@gmail.com';

export const TYPES = {
  landing: { name: 'Página de presentación', base: [60, 80], includes: 3, unit: 'bloques' },
  sitio: { name: 'Sitio completo con animaciones', base: [100, 130], includes: 5, unit: 'secciones' },
  pedidos: { name: 'Menú o catálogo con pedidos', base: [110, 150], includes: 5, unit: 'secciones' },
  chatbot: { name: 'Chatbot para WhatsApp', base: [120, 180] },
  marca: { name: 'Logo e identidad visual', base: [40, 60] },
};
export const EXTRAS = {
  textos: { name: 'Textos redactados', price: [10, 15] },
  dominio: { name: 'Dominio y alojamiento configurados', price: [10, 15], notForBrand: true },
  bot: { name: 'Asistente de chat en la página', price: [40, 60], webOnly: true },
  '3d': { name: 'Efectos 3D premium', price: [20, 30], webOnly: true },
};
export const PER_SECTION = [8, 10];
export const RUSH = 1.2;

export const waLink = text => `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(text)}`;
