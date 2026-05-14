import { auth } from "@/core/auth";
import { redirect } from "next/navigation";
import { db } from "@/core/db";
import Link from "next/link";
import { Navbar } from "@/shared/components/Navbar";
import { BackLink } from "@/shared/components/BackLink";

export default async function StudioPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const user = await db.user.findUnique({ where: { id: session.user.id } });
  if (!user) redirect("/login");

  if (user.role === "STUDENT") redirect("/studio/become-creator");

  const courses = await db.course.findMany({
    where: { creatorId: user.id },
    orderBy: { updatedAt: "desc" },
    include: {
      category: { select: { name: true } },
      _count: { select: { enrollments: true, sections: true } },
    },
  });

  const totalEnrollments = courses.reduce((s, c) => s + c._count.enrollments, 0);
  const published = courses.filter((c) => c.isPublished).length;

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <Navbar />
      {/* Header */}
      <div className="border-b border-slate-800 px-6 py-5">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
          <div>
            <BackLink href="/">Inicio</BackLink>
            <h1 className="text-2xl font-bold mt-4">Creator Studio</h1>
          </div>
          <Link
            href="/studio/courses/new"
            className="bg-purple-600 hover:bg-purple-500 text-white font-semibold px-5 py-2.5 rounded-xl transition-colors"
          >
            + Nuevo curso
          </Link>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8 space-y-8">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "Cursos totales", value: courses.length, icon: "📚" },
            { label: "Publicados", value: published, icon: "🟢" },
            { label: "Estudiantes", value: totalEnrollments, icon: "👥" },
          ].map((s) => (
            <div key={s.label} className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
              <div className="text-2xl mb-2">{s.icon}</div>
              <div className="text-3xl font-bold">{s.value}</div>
              <div className="text-slate-400 text-sm mt-1">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Cursos */}
        <div>
          <h2 className="text-lg font-semibold mb-4">Mis cursos</h2>
          {courses.length === 0 ? (
            <div className="bg-slate-900 border border-slate-800 border-dashed rounded-2xl p-12 text-center">
              <p className="text-4xl mb-4">🎬</p>
              <p className="text-white font-semibold text-lg">Crea tu primer curso</p>
              <p className="text-slate-400 mt-2 mb-6">
                Sube tus videos a YouTube y empieza a enseñar
              </p>
              <Link
                href="/studio/courses/new"
                className="bg-purple-600 hover:bg-purple-500 text-white font-medium px-6 py-3 rounded-xl transition-colors inline-block"
              >
                Crear curso
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {courses.map((course) => (
                <div
                  key={course.id}
                  className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex items-center justify-between hover:border-slate-700 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    {course.thumbnail ? (
                      <img
                        src={course.thumbnail}
                        alt={course.title}
                        className="w-16 h-12 object-cover rounded-lg"
                      />
                    ) : (
                      <div className="w-16 h-12 bg-slate-800 rounded-lg flex items-center justify-center text-2xl">
                        📹
                      </div>
                    )}
                    <div>
                      <p className="font-semibold">{course.title}</p>
                      <div className="flex items-center gap-3 mt-1">
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                            course.isPublished
                              ? "bg-green-500/20 text-green-400"
                              : "bg-yellow-500/20 text-yellow-400"
                          }`}
                        >
                          {course.isPublished ? "Publicado" : "Borrador"}
                        </span>
                        <span className="text-slate-500 text-xs">
                          {course._count.sections} secciones · {course._count.enrollments} estudiantes
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/studio/courses/${course.id}`}
                      className="text-sm font-medium text-white bg-purple-600 hover:bg-purple-500 px-4 py-2 rounded-lg transition-colors"
                    >
                      Administrar
                    </Link>
                    {course.isPublished && (
                      <Link
                        href={`/courses/${course.slug}`}
                        target="_blank"
                        className="text-sm text-slate-400 hover:text-white border border-slate-700 hover:border-slate-500 px-4 py-2 rounded-lg transition-colors"
                      >
                        Ver público ↗
                      </Link>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
