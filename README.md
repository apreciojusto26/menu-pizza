# Carta digital · La Rueca

Maqueta mobile-first de un menú de pizzas y empanadas construida con Astro, una isla React para filtrar/buscar, Tailwind CSS y TypeScript estricto.

> **Importante:** sabores, precios, horario, ubicación y contacto son contenido de demostración. Se muestran como tales en la interfaz y deben confirmarse antes de publicar.

## Desarrollo

Requiere Node.js 22.19 o superior para satisfacer también los requisitos de
las dependencias transitivas actuales de Astro.

```bash
npm install
cp .env.example .env
npm run dev
```

Verificaciones:

```bash
npm test
npm run typecheck
npm run build
npm run format:check
```

## Editar el contenido

- Menú, sabores, descripciones y precios: `src/data/menu.ts`.
- Datos del negocio: bloque `restaurant` en `src/data/menu.ts`.
- Ubicación, horario, contacto y URL pública: `.env`, partiendo de
  `.env.example`.

Los precios se almacenan como números y se formatean en euros. Mientras sean ejemplos, conserva `placeholder: true`; al confirmar cada dato, actualiza su valor y cambia esa marca.

## Publicación y QR

1. Despliega primero el sitio y obtén su URL HTTPS definitiva.
2. Copia **esa misma URL** en `PUBLIC_MENU_URL` dentro de `.env` o de las
   variables del proveedor de despliegue.
3. Cambia `PUBLIC_MENU_URL_CONFIRMED=true` y ejecuta `npm run build`.
4. El build valida `PUBLIC_MENU_URL` y genera el SVG del QR directamente en la
   página. Si la URL está vacía, usa HTTP, contiene credenciales o conserva un
   dominio reservado de ejemplo, el QR no se renderiza.
5. Abre la carta compilada, usa “Comprobar la URL” y escanea el QR con al menos
   dos teléfonos antes de imprimirlo.
6. Para no reimprimir el QR en futuros cambios, mantén estable esa URL y publica
   las actualizaciones en el mismo dominio.

El número de pedidos sigue la misma regla: solo aparece un enlace cuando
`PUBLIC_WHATSAPP_CONFIRMED=true` y `PUBLIC_WHATSAPP_NUMBER` contiene entre 8 y 15
dígitos, con prefijo internacional y sin `+`, espacios ni guiones.
