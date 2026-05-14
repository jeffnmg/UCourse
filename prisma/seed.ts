import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

const CATEGORIES = [
  { name: "Programación", slug: "programacion", icon: "💻", description: "Desarrollo web, móvil, backend y más" },
  { name: "Diseño", slug: "diseno", icon: "🎨", description: "UI/UX, gráfico, motion y branding" },
  { name: "Negocios", slug: "negocios", icon: "📈", description: "Emprendimiento, marketing y finanzas" },
  { name: "Ciencia de Datos", slug: "ciencia-de-datos", icon: "📊", description: "Machine learning, análisis y BI" },
  { name: "Idiomas", slug: "idiomas", icon: "🌍", description: "Inglés, francés, portugués y más" },
  { name: "Música", slug: "musica", icon: "🎵", description: "Producción, teoría e instrumentos" },
  { name: "Fotografía", slug: "fotografia", icon: "📷", description: "Fotografía y edición de video" },
  { name: "Marketing Digital", slug: "marketing-digital", icon: "📱", description: "SEO, redes sociales y publicidad" },
  { name: "Salud y Bienestar", slug: "salud", icon: "🏃", description: "Fitness, meditación y nutrición" },
  { name: "Finanzas Personales", slug: "finanzas", icon: "💰", description: "Inversión, ahorro y libertad financiera" },
];

const ACHIEVEMENTS = [
  { key: "FIRST_ENROLLMENT", title: "Primer Paso", description: "Inscribirse en el primer curso", icon: "🚀", xpReward: 50 },
  { key: "FIRST_COMPLETION", title: "¡Lo lograste!", description: "Completar tu primer curso", icon: "🎓", xpReward: 200 },
  { key: "STREAK_3", title: "En Racha", description: "3 días consecutivos aprendiendo", icon: "🔥", xpReward: 75 },
  { key: "STREAK_7", title: "Semana Sólida", description: "7 días consecutivos aprendiendo", icon: "⚡", xpReward: 150 },
  { key: "STREAK_30", title: "Mes Imparable", description: "30 días consecutivos aprendiendo", icon: "💎", xpReward: 500 },
  { key: "QUIZ_PERFECT", title: "Perfección", description: "Obtener 100% en cualquier quiz", icon: "🌟", xpReward: 100 },
  { key: "COURSE_CREATOR", title: "Creador", description: "Publicar tu primer curso", icon: "✨", xpReward: 300 },
  { key: "FIRST_REVIEW", title: "Crítico", description: "Escribir tu primera reseña", icon: "📝", xpReward: 25 },
] as const;

async function main() {
  console.log("🌱 Iniciando seed...");

  for (const cat of CATEGORIES) {
    await db.category.upsert({
      where: { slug: cat.slug },
      update: {},
      create: cat,
    });
  }
  console.log(`✅ ${CATEGORIES.length} categorías creadas`);

  for (const ach of ACHIEVEMENTS) {
    await db.achievement.upsert({
      where: { key: ach.key },
      update: {},
      create: ach,
    });
  }
  console.log(`✅ ${ACHIEVEMENTS.length} logros creados`);

  console.log("✅ Seed completado");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => db.$disconnect());
