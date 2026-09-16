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

Atajo: en vez de crear las columnas a mano, importá directamente
[`sheets-templates/menu.csv`](sheets-templates/menu.csv) — ya trae los
encabezados correctos y la carta de ejemplo cargada como punto de partida.
En Google Sheets: **Archivo → Importar → Subir**, seleccioná el archivo y
elegí "Reemplazar hoja de cálculo" (o "Insertar como nueva hoja" si ya tenés
otra cosa ahí). Después seguí desde el paso 3.

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

### Cambiar contacto, horario y dirección sin redeploy

Mismo mecanismo, pero para los datos del negocio: agregá una **pestaña
nueva** dentro de la misma Google Sheet (por ejemplo, "Contacto") con una
sola fila y estas columnas. También hay un atajo para importar: en la
pestaña nueva, **Archivo → Importar → Subir**, subí
[`sheets-templates/contacto.csv`](sheets-templates/contacto.csv) e "Insertar
como nueva hoja", y después reemplazá los `COMPLETAR:` por tus datos reales.

| columna             | qué va ahí                                       |
| ------------------- | ------------------------------------------------ |
| `numero`            | solo dígitos, con prefijo internacional, sin `+` |
| `nombre_visible`    | ej. `Pedidos Italy Pizza`                        |
| `mensaje`           | el mensaje que se manda por WhatsApp al escribir |
| `horario_titulo`    | ej. `Lun a dom, 19 a 23h`                        |
| `horario_detalle`   | ej. `Último pedido a las 22:30.`                 |
| `direccion_titulo`  | ej. `Av. Siempre Viva 742`                       |
| `direccion_detalle` | ej. `A dos cuadras de la plaza.`                 |

Cada bloque es independiente: si dejás vacías las dos columnas de horario,
esa tarjeta queda en "por confirmar" sin afectar el número ni la dirección.

Publicala igual que la del menú (**Archivo → Compartir → Publicar en la Web →
CSV**) y pegá ese link en `PUBLIC_CONTACT_SHEET_URL`. A partir de ahí, cambiar
cualquiera de estos datos es editar esa fila — no hace falta redeploy ni
tocar `.env`. Si esa variable queda vacía, la hoja falla, o algún bloque
queda incompleto, esa tarjeta puntual cae a las variables `PUBLIC_WHATSAPP_*`
/ `PUBLIC_SCHEDULE_*` / `PUBLIC_LOCATION_*` (ver
[Variables opcionales](#variables-opcionales-no-vienen-en-envexample)) como
respaldo.

## Editar el contenido a nivel de código

- Carta de ejemplo/respaldo cuando no hay Google Sheet conectada:
  `src/data/menu.ts`.
- Datos del negocio: bloque `restaurant` en `src/data/menu.ts`.
- Las dos hojas de cálculo: `.env`, partiendo de `.env.example`.

Los precios se almacenan como números y se formatean en euros. Mientras sean ejemplos, conserva `placeholder: true`; al confirmar cada dato, actualiza su valor y cambia esa marca.

El botón de pedidos solo aparece con un número válido (8 a 15 dígitos, prefijo
internacional, sin `+`, espacios ni guiones), tomado de la fila de
`PUBLIC_CONTACT_SHEET_URL`.

## Variables opcionales (no vienen en `.env.example`)

`.env.example` trae solo las dos hojas de cálculo, que son las únicas
imprescindibles para tener carta y pedidos funcionando. El código también
soporta estas otras, por si en algún momento las necesitás — agrégalas a mano
a tu `.env`, no rompen nada si faltan:

- **`PUBLIC_WHATSAPP_NUMBER`, `_DISPLAY`, `_MESSAGE`, `_CONFIRMED`**: número de
  respaldo si `PUBLIC_CONTACT_SHEET_URL` está vacía o esa fila no tiene el
  bloque de WhatsApp completo.
- **`PUBLIC_LOCATION_LABEL`, `_DETAIL`, `_CONFIRMED`** y
  **`PUBLIC_SCHEDULE_LABEL`, `_DETAIL`, `_CONFIRMED`**: respaldo para las
  tarjetas de "Dónde" y "Cuándo" cuando esos bloques no vienen completos
  desde la hoja de contacto. Sin ninguna de las dos fuentes, esas tarjetas
  quedan en "por confirmar" — no se rompe nada, solo no muestran datos
  reales.
- **`PUBLIC_MENU_URL`, `PUBLIC_MENU_URL_CONFIRMED`**: si las completás, la home
  genera sola un QR (apuntando a `/carta`) en la sección “Comparte esta
  carta”. Si preferís generar el QR vos con otra herramienta apuntando a tu
  dominio + `/carta`, no hace falta esta variable.
