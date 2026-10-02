# Junp3x · sitio web

Sitio estático (HTML, CSS y JavaScript sin librerías externas) con un asistente de IA servido por una función propia.

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
  - `motion.js`: apariciones, bandas, cursor, menú y scroll suave.
  - `sections.js`: 3X, proyectos, demo, galería, proceso y contacto.
  - `quote.js`: cotizador.
  - `assistant.js`: chat con IA que se abre desde el botón del robot.
  - `robot.js`: el robot de cubos, cara del asistente (ojos que siguen el cursor y parpadean).
- `functions/api/chat.js`: función del servidor (Cloudflare Pages) que habla con Claude.
- `assets/`: imágenes y video.
- `_headers`: cabeceras de seguridad para el hosting.

## Activar el asistente de IA (Cloudflare Pages)
**Opción gratuita (activa):** IA de Cloudflare (Workers AI, modelo Llama 3.3 70B).
1. Cloudflare → Workers & Pages → proyecto `junp3x` → Settings → Bindings → Add → **Workers AI**.
2. Variable name: `AI` → Save.
3. Deployments → último despliegue → ⋯ → Retry deployment.

**Opción Claude (mejor calidad, de pago):** agregar el secreto `ANTHROPIC_API_KEY` en Settings → Variables and Secrets. Si existe, la función usa Claude primero.

Recomendado en ambos casos: Security → WAF → Rate limiting rule para `/api/chat` (por ejemplo 20 solicitudes por minuto por IP).
Si la IA falla o no está configurada, el chat invita a seguir por WhatsApp; la página nunca se rompe.

## Seguridad
- La llave de la IA vive solo en el servidor; nunca llega al navegador ni al repositorio.
- La función acepta solo POST desde el mismo dominio, mensajes de máximo 500 caracteres, 12 turnos y 8 KB, y limita mensajes por visitante.
- Las instrucciones del asistente están en el servidor; lo que escribe el visitante no puede cambiar sus reglas ni sus precios.
- Las respuestas se muestran como texto plano (`textContent`), nunca como HTML.
- Sin base de datos ni formularios que guarden datos personales.
- Sin scripts de terceros; solo las fuentes de Google.
- Todo el JavaScript va en archivos propios, sin código en línea ni `innerHTML`.
- `_headers` activa HTTPS obligatorio, bloquea que otras páginas incrusten el sitio y limita qué recursos puede cargar.
- Enlaces externos con `rel="noopener noreferrer"`.
- Para publicar: activar verificación en dos pasos en GitHub, en el hosting, en Anthropic y en el registrador del dominio.
