/**
 * Borra todos los usuarios y, por cascada (Prisma/SQLite), todo lo ligado:
 * cursos, secciones, lecciones, quizzes, inscripciones, progreso, certificados,
 * comentarios, reseñas, notas, intentos de quiz, tokens de recuperación, etc.
 *
 * No borra: categorías ni definiciones de logros (Achievement), como en el seed.
 */
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

async function main() {
  if (!process.argv.includes("--yes")) {
    console.error(
      "Esta acción es irreversible. Confirma con:\n  npm run db:clean -- --yes"
    );
    process.exit(1);
  }

  const n = await db.user.count();
  await db.user.deleteMany({});
  console.log(
    `Listo: eliminados ${n} usuario(s) y todo el contenido asociado (cursos, evaluaciones, certificados, …).`
  );
  console.log("Categorías y logros (tabla Achievement) se mantienen.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
