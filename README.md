# Carta digital · Italy Pizza

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

## Editar el menú sin tocar código (Google Sheets)

Pensado para que el dueño del local cambie precios, agregue productos o ponga
fotos por su cuenta, sin pedirle nada a quien programó el sitio y sin ningún
panel de administración: solo una hoja de cálculo.

**Configuración inicial (la hace una vez la persona técnica):**

1. Crea una Google Sheet nueva con estas columnas en la primera fila (los
   nombres van en minúscula y sin tildes, tal cual):

   | columna          | qué va ahí                                                                               | obligatoria |
   | ---------------- | ---------------------------------------------------------------------------------------- | ----------- |
   | `categoria`      | `pizzas`, `empanadas`, o cualquier palabra nueva (ej. `bebidas`) para crear otra sección | sí          |
   | `nombre`         | nombre del producto                                                                      | sí          |
   | `descripcion`    | descripción corta                                                                        | no          |
   | `etiquetas`      | `Picante`, `Vegetariana`, `Nueva`, etc. (separadas por coma si son varias)               | no          |
   | `precio1_nombre` | ej. `Mediana`, `Unidad`                                                                  | sí          |
   | `precio1_valor`  | ej. `9,50`                                                                               | sí          |
   | `precio2_nombre` | ej. `Familiar`, `Caja de 6` (dejar vacío si no aplica)                                   | no          |
   | `precio2_valor`  | ej. `15`                                                                                 | no          |
   | `foto_url`       | link directo a una foto (subida a Drive, Imgur, etc., con acceso público)                | no          |
   | `visible`        | `si` o `no`. Vacío = visible. Poner `no` para ocultar un producto sin borrar la fila     | no          |

2. Cargá una fila por producto.
3. **Archivo → Compartir → Publicar en la Web → CSV → Publicar.** Copiá el
   link que te da Google.
4. Pegá ese link en `PUBLIC_MENU_SHEET_URL` (en `.env` o en las variables de
   entorno del hosting) y volvé a desplegar una vez.

**Después de esto, ya no hace falta tocar código ni volver a desplegar.** El
dueño edita la hoja desde el celular o la compu, guarda, y la próxima persona
que escanea el QR (`/carta`) ve los cambios — Google suele tardar uno o dos
minutos en actualizar el CSV publicado, no es instantáneo pero tampoco
requiere avisar a nadie.

Si la hoja está vacía, mal configurada, o `PUBLIC_MENU_SHEET_URL` no está
definida, el sitio no se rompe: muestra la carta de ejemplo incluida en el
proyecto (`src/data/menu.ts`) como respaldo.

## Editar el contenido a nivel de código

- Carta de ejemplo/respaldo cuando no hay Google Sheet conectada:
  `src/data/menu.ts`.
- Datos del negocio: bloque `restaurant` en `src/data/menu.ts`.
- Ubicación, horario, contacto, URL pública y hoja de cálculo: `.env`,
  partiendo de `.env.example`.

Los precios se almacenan como números y se formatean en euros. Mientras sean ejemplos, conserva `placeholder: true`; al confirmar cada dato, actualiza su valor y cambia esa marca.

## Publicación y QR

1. Despliega primero el sitio y obtén su URL HTTPS definitiva (el dominio raíz,
   no una ruta concreta).
2. Copia **esa misma URL** en `PUBLIC_MENU_URL` dentro de `.env` o de las
   variables del proveedor de despliegue.
3. Cambia `PUBLIC_MENU_URL_CONFIRMED=true` y ejecuta `npm run build`.
4. El build valida `PUBLIC_MENU_URL`, añade la ruta `/carta` y genera el SVG
   del QR con esa URL final directamente en la página de inicio. El QR no
   lleva a la landing completa, sino a `/carta`: solo la carta con precios y
   el botón de pedido por WhatsApp. Si la URL está vacía, usa HTTP, contiene
   credenciales o conserva un dominio reservado de ejemplo, el QR no se
   renderiza.
5. Abre `/carta` en el sitio compilado, usa “Comprobar la URL” desde la home y
   escanea el QR con al menos dos teléfonos antes de imprimirlo.
6. Para no reimprimir el QR en futuros cambios, mantén estable esa URL y publica
   las actualizaciones en el mismo dominio.

El número de pedidos sigue la misma regla: solo aparece un enlace cuando
`PUBLIC_WHATSAPP_CONFIRMED=true` y `PUBLIC_WHATSAPP_NUMBER` contiene entre 8 y 15
dígitos, con prefijo internacional y sin `+`, espacios ni guiones.
