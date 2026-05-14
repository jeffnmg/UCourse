# UCourse (Virtual University)

Plataforma de cursos y masterclass con lecciones en video, quizzes, progreso, certificados verificables y recuperación de contraseña por correo.

## Requisitos

- **Node.js** 20 o superior  
- **npm** (incluido con Node)

## Puesta en marcha (clonar y probar)

1. **Clonar el repositorio**

   ```bash
   git clone <url-de-tu-repo>
   cd virtual-university
   ```

2. **Variables de entorno**

   ```bash
   cp .env.example .env
   ```

   Edita `.env` y pon un valor real en `AUTH_SECRET` y `NEXTAUTH_SECRET` (pueden ser el mismo string largo y aleatorio). Por ejemplo, en terminal: `openssl rand -base64 32`. El resto del bloque mínimo puede quedarse como en el ejemplo si corres en `http://localhost:3000`.

3. **Instalar dependencias y base de datos**

   ```bash
   npm install
   npm run db:setup
   ```

   Esto crea el SQLite `prisma/dev.db`, aplica el esquema y carga categorías y logros de ejemplo (`prisma/seed.ts`).

4. **Arrancar en desarrollo**

   ```bash
   npm run dev
   ```

   Abre [http://localhost:3000](http://localhost:3000). Regístrate, explora cursos y, si eres creador, usa **Studio** para publicar contenido.

### Comandos útiles

| Comando | Descripción |
| --------|-------------|
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Compilación de producción |
| `npm run db:studio` | Consola visual de Prisma |
| `npm run db:seed` | Vuelve a ejecutar solo el seed |
| `npm run db:clean -- --yes` | Borra usuarios y contenido ligado (irreversible) |

## Qué no subir a Git

El archivo **`.env`** con secretos reales debe quedarse solo en tu máquina. En el repo va **`.env.example`** como plantilla. Las bases `*.db` locales están en `.gitignore`.

## Funciones opcionales con API keys

- **Resend**: envío de correos (p. ej. olvidé mi contraseña). Sin clave, en desarrollo puedes ver el enlace de recuperación en la consola del servidor.
- **Upstash Redis**: rate limiting; sin variables, la app usa un almacén en memoria adecuado para demos.

## Licencia

Según definas para la hackathon (p. ej. MIT o la que indique el evento).
