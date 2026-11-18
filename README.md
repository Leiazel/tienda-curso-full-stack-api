# tienda-curso-full-stack-api

Backend REST API desarrollado con **Node.js** y **Express** para el proyecto [tienda-curso-full-stack](https://github.com/Leiazel/tienda-curso-full-stack) (Curso de Desarrollo Full Stack - Fundación CILSA).

## Requisitos

- **Node.js** `>= 20.0.0` (probado con Node `v24`)
- **npm**

## Instalación

```bash
npm install
```

Copiá el archivo de variables de entorno de ejemplo y ajustalo según necesites:

```bash
cp .env.example .env
```

Variables disponibles en `.env`:

| Variable | Descripción | Valor por defecto |
|---|---|---|
| `PORT` | Puerto en el que escucha el servidor | `3000` |
| `NODE_ENV` | Entorno de ejecución (`development` / `production`) | `development` |
| `CORS_ORIGIN` | Orígenes permitidos para CORS (`*` o URLs separadas por coma) | `*` |

## Scripts disponibles

- `npm run dev`: inicia el servidor en modo desarrollo con recarga automática (`node --watch`).
- `npm start`: inicia el servidor en modo estándar.
- `npm test`: ejecuta los tests de integración con el test runner nativo de Node (`node --test`).

## Endpoints iniciales

- `GET /`: información básica de la API.
- `GET /api/health`: estado de salud del servidor (`status`, `uptime`, `timestamp`).

## Estructura del proyecto

```text
├── .env.example
├── .gitignore
├── package.json
├── README.md
├── src
│   ├── app.js
│   ├── server.js
│   ├── middlewares
│   │   └── errorHandler.js
│   └── routes
│       └── index.js
└── tests
    └── app.test.js
```
