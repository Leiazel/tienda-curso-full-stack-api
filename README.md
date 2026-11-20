# tienda-curso-full-stack-api

Backend REST API desarrollado con **Node.js**, **Express 5** (ESM) y **MySQL 8.0** para el proyecto de e-commerce de **indumentaria urbana y calzado** (**L&D Streetwear & Footwear**) conectado con [tienda-curso-full-stack](https://github.com/Leiazel/tienda-curso-full-stack) (Curso de Desarrollo Full Stack - Fundación CILSA).

---

## Requisitos

- **Node.js** `>= 20.0.0` (probado con Node `v24`)
- **npm**
- **MySQL 8.0+** (o **MariaDB 10.6+**, o **Docker** con `docker-compose.yml` incluido)

---

## Instalación y puesta en marcha

### 1. Instalar dependencias

```bash
npm install
```

### 2. Configurar variables de entorno

Copiá el archivo de ejemplo y completá tus credenciales de MySQL:

```bash
cp .env.example .env
```

Variables disponibles en `.env`:

| Variable | Descripción | Valor por defecto |
|---|---|---|
| `PORT` | Puerto en el que escucha el servidor HTTP | `3000` |
| `NODE_ENV` | Entorno (`development` / `production`) | `development` |
| `CORS_ORIGIN` | Orígenes permitidos para CORS (`*` o URLs separadas por coma) | `*` |
| `DB_HOST` | Host del servidor MySQL | `127.0.0.1` |
| `DB_PORT` | Puerto de MySQL | `3306` |
| `DB_USER` | Usuario de MySQL | `root` |
| `DB_PASSWORD` | Contraseña de MySQL | *(vacío)* |
| `DB_NAME` | Nombre de la base de datos | `ld_store_db` |
| `DB_CONNECTION_LIMIT` | Máximo de conexiones simultáneas en el pool | `10` |
| `JWT_SECRET` | Clave secreta para firmar tokens JWT | `cambia_esta_clave_secreta_en_produccion` |
| `JWT_EXPIRES_IN` | Duración del token JWT | `7d` |
| `PROTECT_ADMIN_ROUTES` | Si es `true`, exige rol `admin` en rutas de escritura/gestión | `false` |

---

### 3. Crear y poblar la base de datos MySQL

Tenés **dos opciones** para levantar MySQL:

#### Opción A — Con Docker (recomendada, cero configuración manual)

```bash
docker compose up -d
```

Esto levanta:
- **MySQL 8.0** en el puerto `3306` y ejecuta automáticamente [`database/schema.sql`](database/schema.sql) y [`database/seed.sql`](database/seed.sql).
- **phpMyAdmin** en `http://localhost:8080`.

Credenciales por defecto del contenedor Docker (`docker-compose.yml`):
- `DB_HOST=127.0.0.1`
- `DB_PORT=3306`
- `DB_USER=ld_user`
- `DB_PASSWORD=ld_password`
- `DB_NAME=ld_store_db`

#### Opción B — Con MySQL local / XAMPP / Laragon / MySQL Workbench

Asegurate de tener tu servidor MySQL corriendo y configurá `DB_USER` / `DB_PASSWORD` en `.env`. Luego ejecutá:

```bash
npm run db:setup
```

*(O bien importá manualmente `database/schema.sql` seguido de `database/seed.sql` desde MySQL Workbench o phpMyAdmin).*

---

### 4. Iniciar la API

```bash
# Modo desarrollo (con recarga automática)
npm run dev

# Modo estándar
npm start
```

---

## Scripts disponibles

- `npm run dev`: inicia el servidor en modo desarrollo (`node --watch`).
- `npm start`: inicia el servidor en modo estándar.
- `npm run db:init`: crea la base de datos y las 9 tablas ejecutando `database/schema.sql`.
- `npm run db:seed`: carga categorías, productos de indumentaria y calzado, variantes, códigos promo y usuarios iniciales desde `database/seed.sql`.
- `npm run db:setup`: ejecuta `db:init` y `db:seed` en un solo comando.
- `npm test`: ejecuta la suite de tests automatizados (`node --test`).

---

## Modelo de Base de Datos (MySQL)

El esquema definido en [`database/schema.sql`](database/schema.sql) consta de **9 tablas relacionales**:

1. **`categories`**: categorías del catálogo (`hoodies`, `pants`, `tees`, `outerwear`, `sneakers`, `accessories`), diferenciadas por `product_type` (`apparel`, `footwear`, `accessory`).
2. **`products`**: catálogo de prendas urbanas, zapatillas/botas y accesorios (`slug`, `sku_prefix`, `price`, `compare_at_price`, `material`, `fit`, `default_size`, `image_url`, etc.).
3. **`product_variants`**: talles (`S`, `M`, `L`, `XL`, `US 8`–`US 12`, `ONE SIZE`), colores, `sku` único y `stock` individual por variante.
4. **`users`**: clientes y administradores (`customer`, `admin`) con contraseñas cifradas con `bcryptjs`.
5. **`promo_codes`**: cupones de descuento porcentuales o fijos (ej. `FIRST15`, `URBAN10`, `SNEAKER20`).
6. **`orders`**: órdenes de compra generadas en el checkout con cálculo de subtotal, descuento y total en servidor.
7. **`order_items`**: detalle de ítems comprados por orden vinculados al producto y variante.
8. **`newsletter_subscribers`**: suscriptores del drop list (`JOIN DROP LIST`).
9. **`contact_messages`**: mensajes enviados desde el formulario de contacto.

---

## Dónde están las APIs (Endpoints)

Base URL local: `http://localhost:3000` (y prefijo `/api` para todos los recursos).

### Estado y descubrimiento
- `GET /` — Metadatos básicos de la API.
- `GET /api` — Índice con todos los endpoints disponibles.
- `GET /api/health` — Estado del servidor y conectividad con MySQL (`?strict=true` devuelve `503` si MySQL está caído).

### Categorías (`/api/categories`)
- `GET /api/categories` — Lista categorías con cantidad de productos. Filtros: `?type=apparel|footwear|accessory`, `?includeInactive=true`.
- `GET /api/categories/:idOrSlug` — Obtiene una categoría y sus productos (ej: `/api/categories/sneakers`).
- `POST /api/categories` — Crea una nueva categoría.
- `PUT /api/categories/:id` — Actualiza una categoría.
- `DELETE /api/categories/:id` — Elimina una categoría (si no tiene productos asociados).

### Productos y Stock por Talle (`/api/products`)
- `GET /api/products` — Lista productos con variantes y talles. Filtros combinables:
  - `?category=hoodies|pants|tees|outerwear|sneakers|accessories`
  - `?type=apparel|footwear|accessory`
  - `?size=L` o `?size=US 9.5`
  - `?featured=true`
  - `?inStock=true`
  - `?minPrice=50&maxPrice=200`
  - `?search=concrete`
  - `?sort=price_asc|price_desc|name|newest|featured`
  - `?page=1&limit=20`
- `GET /api/products/:idOrSlug` — Detalle completo del producto con sus variantes y stock (ej: `/api/products/ld-sneaker-05`).
- `POST /api/products` — Crea un producto junto a sus variantes/talles iniciales en transacción.
- `PUT /api/products/:id` — Actualiza un producto.
- `DELETE /api/products/:id` — Desactiva un producto (`?hard=true` para borrado físico).
- `POST /api/products/:id/variants` — Agrega un nuevo talle/color al producto.
- `PATCH /api/products/:id/variants/:variantId/stock` — Actualiza stock (`{ "stock": 15 }` o `{ "delta": -2 }`).

### Códigos Promocionales (`/api/promo-codes`)
- `GET /api/promo-codes` — Lista cupones activos.
- `POST /api/promo-codes/validate` — Valida cupón y calcula descuento (`{ "code": "FIRST15", "subtotal": 275 }`).
- `POST /api/promo-codes` — Crea un nuevo código promocional.

### Órdenes y Checkout (`/api/orders`)
- `POST /api/orders` — Crea una orden en **transacción MySQL**: bloquea variantes (`FOR UPDATE`), verifica y descuenta stock, valida cupón promocional, calcula totales en servidor y devuelve `orderNumber` (`LD-XXXXXX`).
- `GET /api/orders` — Lista órdenes (`?status=confirmed`, `?email=...`, `?page=1&limit=20`).
- `GET /api/orders/my-orders` — Lista órdenes del usuario autenticado (requiere Bearer JWT).
- `GET /api/orders/:idOrNumber` — Consulta una orden por ID o número (ej: `/api/orders/LD-482910`).
- `PATCH /api/orders/:id/status` — Cambia estado (`pending`, `confirmed`, `paid`, `shipped`, `delivered`, `cancelled`). Si se pasa a `cancelled`, **restaura el stock automáticamente**.

### Autenticación (`/api/auth`)
- `POST /api/auth/register` — Registra un nuevo cliente y devuelve JWT.
- `POST /api/auth/login` — Inicia sesión y devuelve JWT.
- `GET /api/auth/me` — Devuelve perfil del usuario autenticado (`Authorization: Bearer <token>`).

Cuentas iniciales del seed:
- **Admin:** `admin@ldstore.com` / `Admin1234!`
- **Cliente:** `cliente@ldstore.com` / `Cliente1234!`

### Newsletter y Contacto
- `POST /api/newsletter/subscribe` — Suscribe un email al drop list y devuelve el cupón `FIRST15`.
- `GET /api/newsletter` — Lista suscriptores activos.
- `DELETE /api/newsletter/:email` — Da de baja una suscripción.
- `POST /api/contacts` — Envía mensaje desde el formulario de contacto (`firstName`, `lastName`, `email`, `subject`, `message`).
- `GET /api/contacts` — Lista mensajes de contacto (`?status=new|read|replied|archived`).
- `PATCH /api/contacts/:id/status` — Actualiza estado de un mensaje.

---

## Ejemplo rápido de Checkout (`POST /api/orders`)

```bash
curl -X POST http://localhost:3000/api/orders \
  -H "Content-Type: application/json" \
  -d '{
    "customerName": "Sofía Martínez",
    "customerEmail": "sofia@example.com",
    "shippingAddress": "Av. Corrientes 1234",
    "shippingCity": "Buenos Aires",
    "shippingPostalCode": "1043",
    "paymentMethod": "mercadopago",
    "promoCode": "FIRST15",
    "items": [
      { "slug": "ld-hoodie-01", "size": "L", "quantity": 1 },
      { "slug": "ld-sneaker-05", "size": "US 9.5", "quantity": 1 }
    ]
  }'
```

---

## Estructura del proyecto

```text
├── .env.example
├── .gitignore
├── docker-compose.yml
├── package.json
├── README.md
├── database/
│   ├── schema.sql
│   └── seed.sql
├── src/
│   ├── app.js
│   ├── server.js
│   ├── config/
│   │   ├── database.js
│   │   └── env.js
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── categoryController.js
│   │   ├── contactController.js
│   │   ├── healthController.js
│   │   ├── newsletterController.js
│   │   ├── orderController.js
│   │   ├── productController.js
│   │   └── promoCodeController.js
│   ├── db/
│   │   ├── init.js
│   │   └── seed.js
│   ├── middlewares/
│   │   ├── auth.js
│   │   ├── errorHandler.js
│   │   └── validate.js
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── categoryRoutes.js
│   │   ├── contactRoutes.js
│   │   ├── index.js
│   │   ├── newsletterRoutes.js
│   │   ├── orderRoutes.js
│   │   ├── productRoutes.js
│   │   └── promoCodeRoutes.js
│   └── services/
│       ├── authService.js
│       ├── categoryService.js
│       ├── contactService.js
│       ├── newsletterService.js
│       ├── orderService.js
│       ├── productService.js
│       └── promoCodeService.js
└── tests/
    ├── helpers/
    │   └── mockDb.js
    ├── app.test.js
    ├── community.test.js
    ├── orders.test.js
    ├── products.test.js
    └── sqlSchema.test.js
```
