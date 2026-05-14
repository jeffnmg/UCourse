# UCourse (Virtual University)

Plataforma de cursos y masterclass con lecciones en video, quizzes, progreso, certificados verificables y recuperación de contraseña por correo.

## Requisitos

- **Node.js** 20 o superior  
- **npm**  
- **PostgreSQL** (local con Docker, o una base gratis como [Neon](https://neon.tech))

## Puesta en marcha (local)

1. Clona el repo y entra en la carpeta.

2. Crea un proyecto en Neon (o levanta Postgres local) y copia la cadena de conexión.

3. Variables de entorno:

   ```bash
   cp .env.example .env
   ```

   En `.env` pon `DATABASE_URL` de Postgres y genera secretos (`openssl rand -base64 32`) en `AUTH_SECRET` y `NEXTAUTH_SECRET`.

4. Instala y aplica esquema + datos de ejemplo:

   ```bash
   npm install
   npm run db:setup
   ```

5. Desarrollo:

   ```bash
   npm run dev
   ```

### Comandos útiles

| Comando | Descripción |
| --------|-------------|
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Solo Next (sin migraciones). En Vercel el build usa `vercel.json`. |
| `npm run db:studio` | Consola Prisma |
| `npm run db:seed` | Ejecuta de nuevo el seed |
| `npm run db:clean -- --yes` | Borra usuarios y contenido asociado |

---

## Desplegar en Vercel

1. Entra en [vercel.com](https://vercel.com), inicia sesión e **importa el proyecto** desde tu repo de GitHub.

2. **Framework Preset:** Next.js (por defecto).

3. **Variables de entorno** (al importar o en Settings → Environment Variables), como mínimo:

   | Variable | Valor |
   |----------|--------|
   | `DATABASE_URL` | **Transaction pooler** Supabase (`…pooler.supabase.com:6543/...`) con `?pgbouncer=true&sslmode=require`. |
   | `DIRECT_URL` | (Opcional) Session pooler `…:5432` o directa. Si **no** existe, el build usa la misma URL que `DATABASE_URL` (ver `prisma.config.ts`). Conviene definirla si `DATABASE_URL` es solo pooler **:6543**. |
   | `AUTH_SECRET` | Secreto largo aleatorio. |
   | `NEXTAUTH_SECRET` | Puede ser el mismo que `AUTH_SECRET`. |
   | `NEXTAUTH_URL` | `https://tu-proyecto.vercel.app` (sin barra final). |
   | `NEXT_PUBLIC_APP_URL` | Igual que `NEXTAUTH_URL`. |

   Opcionales: `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, Upstash, etc.

4. **Deploy.** `vercel.json` ejecuta `prisma generate`, luego `prisma db push` (ajusta las tablas al esquema sin depender del historial de migraciones en el servidor) y `next build`. Así evitamos fallos típicos de `migrate deploy` con Supabase/Vercel.

5. **Seed (categorías y logros):** tras el primer deploy, ejecuta en tu máquina (con `DATABASE_URL` de producción apuntando a esa base):

   ```bash
   npm run db:seed
   ```

6. La configuración de NextAuth incluye `trustHost: true` para que el dominio de Vercel funcione bien con el login.

### Si el build falla al aplicar el esquema (`db push`)

- Con **Transaction pooler** (`:6543`) define también **`DIRECT_URL`** con el session pooler (`:5432`) o la URL directa. Si no la pones, el proyecto usa la misma cadena que `DATABASE_URL` solo para no romper el build; con `:6543` a veces `db push` sigue fallando hasta que agregues `DIRECT_URL`.
- En `DATABASE_URL` con pooler transaccional incluye **`?pgbouncer=true`** (y `sslmode=require`).

### Qué no subas a Git

El archivo **`.env`** con secretos reales no debe versionarse; en el repo va **`.env.example`**.

## Funciones opcionales con API keys

- **Resend**: correo (p. ej. recuperar contraseña). Sin clave, en desarrollo el enlace puede verse en la consola del servidor.
- **Upstash Redis**: rate limiting; sin variables, la app usa memoria en proceso.

## Licencia

La que definas para la hackathon o el proyecto.
