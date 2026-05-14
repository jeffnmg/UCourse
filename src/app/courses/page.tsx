import { db } from "@/core/db";
import Link from "next/link";
import { Navbar } from "@/shared/components/Navbar";
import { BackLink } from "@/shared/components/BackLink";

const LEVEL_LABELS: Record<string, string> = {
  BEGINNER: "Principiante",
  INTERMEDIATE: "Intermedio",
  ADVANCED: "Avanzado",
};

type SearchParams = Promise<{ category?: string; q?: string }>;

export default async function CoursesPage({ searchParams }: { searchParams: SearchParams }) {
  const { category, q } = await searchParams;

  const [courses, categories] = await Promise.all([
    db.course.findMany({
      where: {
        isPublished: true,
        ...(category && { category: { slug: category } }),
        ...(q && { OR: [{ title: { contains: q } }, { description: { contains: q } }] }),
      },
      orderBy: [{ enrollmentCount: "desc" }, { avgRating: "desc" }],
      include: {
        creator: { select: { name: true, username: true } },
        category: { select: { name: true, slug: true, icon: true } },
        _count: { select: { enrollments: true } },
      },
      take: 48,
    }),
    db.category.findMany({
      orderBy: { name: "asc" },
      include: { _count: { select: { courses: { where: { isPublished: true } } } } },
    }),
  ]);

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <Navbar />

      {/* Hero search */}
      <div className="bg-gradient-to-b from-slate-900 to-slate-950 py-12 px-6">
        <div className="max-w-7xl mx-auto mb-8">
          <BackLink href="/">Inicio</BackLink>
        </div>
        <div className="max-w-3xl mx-auto text-center space-y-6">
          <h1 className="text-4xl font-bold">
            {q ? `Resultados para "${q}"` : "Explora todos los cursos"}
          </h1>
          <form method="GET" action="/courses" className="flex gap-3">
            <input
              name="q"
              defaultValue={q}
              placeholder="Buscar cursos, temas, creadores..."
              className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-5 py-3.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            <button
              type="submit"
              className="bg-purple-600 hover:bg-purple-500 text-white font-semibold px-6 py-3.5 rounded-xl transition-colors"
            >
              Buscar
            </button>
          </form>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex gap-8">
          {/* Filtros sidebar */}
          <aside className="hidden lg:block w-56 shrink-0 space-y-2">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
              Categorías
            </p>
            <Link
              href="/courses"
              className={`block px-3 py-2 rounded-lg text-sm transition-colors ${
                !category
                  ? "bg-purple-600 text-white"
                  : "text-slate-400 hover:text-white hover:bg-slate-800"
              }`}
            >
              Todos los cursos
            </Link>
            {categories.map((cat) => (
              <Link
                key={cat.slug}
                href={`/courses?category=${cat.slug}`}
                className={`block px-3 py-2 rounded-lg text-sm transition-colors ${
                  category === cat.slug
                    ? "bg-purple-600 text-white"
                    : "text-slate-400 hover:text-white hover:bg-slate-800"
                }`}
              >
                {cat.icon} {cat.name}
                <span className="ml-1 text-xs opacity-60">({cat._count.courses})</span>
              </Link>
            ))}
          </aside>

          {/* Grid de cursos */}
          <div className="flex-1">
            <p className="text-slate-400 text-sm mb-6">
              {courses.length} {courses.length === 1 ? "curso" : "cursos"} encontrados
            </p>

            {courses.length === 0 ? (
              <div className="text-center py-20">
                <p className="text-6xl mb-4">🔍</p>
                <p className="text-white text-xl font-semibold">No hay cursos todavía</p>
                <p className="text-slate-400 mt-2">
                  {q ? "Intenta con otro término" : "Sé el primero en crear uno"}
                </p>
                <Link
                  href="/studio"
                  className="inline-block mt-6 bg-purple-600 hover:bg-purple-500 text-white font-medium px-6 py-3 rounded-xl transition-colors"
                >
                  Crear curso →
                </Link>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-5">
                {courses.map((course) => (
                  <Link
                    key={course.id}
                    href={`/courses/${course.slug}`}
                    className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden hover:border-purple-500/50 hover:shadow-lg hover:shadow-purple-500/5 transition-all group"
                  >
                    {/* Thumbnail */}
                    <div className="aspect-video bg-slate-800 overflow-hidden">
                      {course.thumbnail ? (
                        <img
                          src={course.thumbnail}
                          alt={course.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-4xl">
                          {course.category.icon ?? "📚"}
                        </div>
                      )}
                    </div>

                    <div className="p-5 space-y-3">
                      <div>
                        <h3 className="font-semibold text-white group-hover:text-purple-300 transition-colors line-clamp-2 leading-snug">
                          {course.title}
                        </h3>
                        <p className="text-slate-400 text-sm mt-1">{course.creator.name}</p>
                      </div>

                      <p className="text-slate-500 text-sm line-clamp-2">
                        {course.description}
                      </p>

                      <div className="flex items-center justify-between pt-1">
                        <div className="flex items-center gap-2">
                          <span className="text-yellow-400 text-xs">
                            {course.avgRating > 0
                              ? `★ ${course.avgRating.toFixed(1)}`
                              : "Nuevo"}
                          </span>
                          <span className="text-slate-600 text-xs">·</span>
                          <span className="text-slate-400 text-xs">
                            {course._count.enrollments} estudiantes
                          </span>
                        </div>
                        <span className="text-xs bg-slate-800 text-slate-400 px-2 py-1 rounded-lg">
                          {LEVEL_LABELS[course.level] ?? course.level}
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
