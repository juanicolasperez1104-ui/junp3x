# Junp3x · sitio web

Sitio estático (HTML, CSS y JavaScript sin librerías externas) con un asistente de IA servido por una función propia.

## Diseño
- Sitio comercial: cada sección responde una duda del visitante y termina en una acción (cotizar, WhatsApp o ver un caso).
- Recorrido: portada → soluciones (pestañas con qué incluye y un ejemplo real) → proyectos en carrusel → demo del chatbot (pasos que saltan al momento del video) → por qué Junp3x (3X) → proceso → cotizador → preguntas frecuentes → cierre. Poca información por sección: título, una frase y la acción.
- Tipografía: Bricolage Grotesque (títulos, peso 700), Geist (textos) y Geist Mono (datos técnicos y precios). Tamaños definidos una sola vez en `:root` de `css/styles.css`.
- Movimiento: títulos que suben palabra por palabra, botones con texto que rueda y relleno de color, fondo que cambia de tono por sección, intro solo una vez por visita. Pensado primero para celular: nada depende de la rueda del mouse; los proyectos se deslizan con el dedo o con botones y el proceso se apila al bajar. Con "reducir movimiento" se quitan los desplazamientos.
- Contenido real: nada de clientes, cifras ni testimonios inventados. Los precios salen de `js/pricing.js`.

## Estructura
- `index.html`: contenido de la página.
- `css/styles.css`: estilos, ordenados por secciones (ver índice al inicio del archivo).
- `js/main.js`: punto de entrada; carga los módulos en orden.
  - `utils.js`: utilidades compartidas (colores, SVG, puntero, scroll).
  - `pricing.js`: precios, número de WhatsApp y correo. **Cambiar precios solo aquí.**
  - `knowledge.js`: lo que sabe el asistente y sus reglas (lo usan el navegador y el servidor).
  - `logo.js`: logo de cubos isométricos.
  - `intro.js` + `waves.js`: animación de entrada con la superficie de puntos en olas.
  - `ambient.js`: fondo con luces que emiten ondas.
  - `hero.js`: portada y terreno de cubos.
  - `motion.js`: apariciones escalonadas, botones y menú.
  - `scenes.js`: carrusel de proyectos, entrada del proceso, tono de fondo, menú activo y cursor.
  - `sections.js`: pestañas de soluciones, fichas de caso, demo del chatbot y contacto.
  - `quote.js`: cotizador con preguntas según el servicio.
  - `assistant.js`: chat con IA que se abre desde el botón del robot.
  - `robot.js`: el robot de cubos, cara del asistente (ojos que siguen el cursor y parpadean).
- `functions/api/chat.js`: función del servidor (Cloudflare Pages) que habla con Claude.
- `assets/`: imágenes (WebP con versión de 800 px para celular; los JPG originales se conservan), `og.jpg` para compartir, video y fuentes (`assets/fonts/`, servidas desde el propio sitio).
- `robots.txt` y `sitemap.xml`: para buscadores. Los datos estructurados (servicio profesional) van en el `<head>` de `index.html`.
- `_headers`: cabeceras de seguridad para el hosting.

## Publicación
- Cloudflare Pages publica solo desde GitHub: `main` → junp3x.com; cualquier otra rama → vista previa en `<rama>.junp3x.pages.dev`.
- Si Cloudflare muestra "This project is disconnected from your Git account", no se publica nada nuevo: reconectar en Settings → Builds y dar acceso al repositorio `junp3x` a la app de GitHub "Cloudflare Workers and Pages".

## Activar el asistente de IA (Cloudflare Pages)
**Opción gratuita (activa):** IA de Cloudflare (Workers AI, modelo Llama 3.3 70B).
1. Cloudflare → Workers & Pages → proyecto `junp3x` → Settings → Bindings → Add → **Workers AI**.
2. Variable name: `AI` → Save.
3. Deployments → último despliegue → ⋯ → Retry deployment.

**Opción Claude (mejor calidad, de pago):** agregar el secreto `ANTHROPIC_API_KEY` en Settings → Variables and Secrets. Si existe, la función usa Claude primero.

Recomendado en ambos casos: Security → WAF → Rate limiting rule para `/api/chat` (por ejemplo 20 solicitudes por minuto por IP).
Si la IA falla o no está configurada, el chat invita a seguir por WhatsApp; la página nunca se rompe.

## Bot de WhatsApp Business (`functions/api/whatsapp.js`)
Webhook de la API oficial de WhatsApp (Meta). Responde con la misma IA y los mismos datos de `js/knowledge.js`.
- Secretos en Cloudflare: `WA_VERIFY_TOKEN`, `WA_APP_SECRET`, `WA_TOKEN`, `WA_PHONE_ID`. Enlace KV opcional `CHATS` (memoria 24 h).
- Cada mensaje se acepta solo si trae la firma válida de Meta (HMAC-SHA256 con el App Secret).
- Si Nicolás escribe desde la app (evento `smb_message_echoes`) o el cliente pide un asesor, el bot calla 12 h en ese chat.
- Webhook en Meta: `https://junp3x.com/api/whatsapp`, campos `messages` y `smb_message_echoes`.

## Seguridad
- La llave de la IA vive solo en el servidor; nunca llega al navegador ni al repositorio.
- La función acepta solo POST desde el mismo dominio, mensajes de máximo 500 caracteres, 12 turnos y 8 KB, y limita mensajes por visitante.
- Las instrucciones del asistente están en el servidor; lo que escribe el visitante no puede cambiar sus reglas ni sus precios.
- Las respuestas se muestran como texto plano (`textContent`), nunca como HTML.
- Sin base de datos ni formularios que guarden datos personales.
- Sin scripts ni estilos de terceros: las fuentes también se sirven desde el propio dominio.
- Todo el JavaScript va en archivos propios, sin código en línea ni `innerHTML`.
- `_headers` activa HTTPS obligatorio, bloquea que otras páginas incrusten el sitio y limita qué recursos puede cargar.
- Enlaces externos con `rel="noopener noreferrer"`.
- Para publicar: activar verificación en dos pasos en GitHub, en el hosting, en Anthropic y en el registrador del dominio.
