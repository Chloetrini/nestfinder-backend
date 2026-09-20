# NestFinder Backend

REST API for **NestFinder Pro**, a real-estate listing platform. Visitors browse properties and send enquiries; admins manage listings, enquiries and users.

## Tech stack

Node 20+, **Express 5**, **TypeScript** (ESM / NodeNext), **MongoDB + Mongoose**, JWT auth, **Zod** validation, **Pino** logging, **helmet**, **express-rate-limit**, **compression**, **Cloudinary** (images), **Brevo** (email), **Memcachier / in-memory** cache.

## Getting started

```bash
npm install
cp .env.example .env     # fill in the values
npm run dev              # http://localhost:7200
npm run seed:admin       # create the admin account once
```

| Script | What it does |
| --- | --- |
| `npm run dev` | Run with nodemon + tsx |
| `npm run typecheck` | Type-check without emitting |
| `npm run build` | Compile to `dist/` |
| `npm start` | Run the compiled server (`dist/server.js`) |
| `npm run seed:admin` | Create the admin user from `ADMIN_EMAIL` / `ADMIN_PASSWORD` |

`MONGODB_URI` and `JWT_SECRET` are required: the server refuses to start without them. See `.env.example` for everything else.

## Project structure

```
src/
├── config/        keys.ts (env loading + validation), database, logger, cloudinary
├── controllers/   Request handlers, each wrapped in tryCatchWrapper
├── middlewares/   auth, cache, error, rate-limit, schema (zod)
├── models/        Mongoose models (*.model.ts)
├── routes/        Express routers (*.routes.ts)
├── services/      cache.service, property.service, email/ (Brevo + templates)
├── types/         Express type augmentation (req.user)
├── utils/         try-catch-wrapper, response-handler, app-error, tokens
├── validators/    Zod schemas
└── server.ts      App setup and startup
scripts/           seed-admin.ts
```

## Conventions

- **Errors**: controllers are wrapped in `tryCatchWrapper`. Throw `new AppError(message, status)` for expected failures; anything else becomes a 500. The global handler in `error.middleware.ts` also translates Mongoose and JWT errors.
- **Responses** are always `{ success: true, ... }` or `{ success: false, message }`, built with `sendSuccess` / `sendError`.
- **Validation** happens in the route with `validateBody(schema)`; the first problem becomes `message`.
- **Imports** use `.js` extensions (NodeNext ESM).
- **Files** are kebab-case with a role suffix: `property.controller.ts`, `auth.routes.ts`.

## Caching

Public property reads (`GET /api/properties`, `GET /api/properties/:id`) are cached for 60 seconds and return an `x-cache: HIT | MISS` header. With `MEMCACHIER_SERVERS` set the cache is Memcachier, otherwise an in-memory store. Creating, updating or deleting a property clears the `properties` cache immediately, so admins never see stale data. A cache failure never breaks a request.

## API

| Method & path | Access |
| --- | --- |
| `POST /api/auth/register`, `/login`, `/forgot-password`, `/reset-password/:token`; `GET /api/auth/verify-email/:token` | Public (rate limited) |
| `GET /api/auth/me` | Logged in |
| `GET /api/auth/stats`, `/users/count`, `/users/count/all`; `DELETE /api/auth/delete/:id` | Admin |
| `GET /api/properties`, `GET /api/properties/:id` | Public (cached) |
| `GET /api/properties/admin/all`; `POST`, `PUT /:id`, `DELETE /:id` on `/api/properties` | Admin |
| `POST /api/enquiries` | Public (rate limited) |
| `GET /api/enquiries`; `PUT`, `DELETE /api/enquiries/:id` | Admin |
| `GET /api/health` (also `/health`) | Public |

Authenticated requests send `Authorization: Bearer <token>`.

## Deployment (Render)

Build command `npm install && npm run build`, start command `npm start`. Set the environment variables from `.env.example` in the dashboard.
