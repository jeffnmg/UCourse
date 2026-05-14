import { auth } from "@/core/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { db } from "@/core/db";
import { XPBar } from "@/modules/gamification/components/XPBar";
import { Navbar } from "@/shared/components/Navbar";
import { BackLink } from "@/shared/components/BackLink";
import { flattenLessonIds, pickContinueLesson, type LessonProgressMap } from "@/modules/progress/lib/continue-lesson";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: {
      name: true,
      role: true,
      xp: true,
      streak: true,
      _count: { select: { enrollments: true, certificates: true, achievements: true } },
    },
  });
  if (!user) redirect("/login");

  const enrollments = await db.enrollment.findMany({
    where: { userId: session.user.id },
    take: 6,
    orderBy: { enrolledAt: "desc" },
    include: {
      course: {
        select: {
          id: true,
          slug: true,
          title: true,
          thumbnail: true,
          creator: { select: { name: true } },
          sections: {
            orderBy: { position: "asc" },
            select: {
              lessons: {
                orderBy: { position: "asc" },
                select: { id: true },
              },
            },
          },
        },
      },
    },
  });

  const courseIds = enrollments.map((e) => e.course.id);
  const progressRows =
    courseIds.length === 0
      ? []
      : await db.lessonProgress.findMany({
          where: {
            userId: session.user.id,
            lesson: { section: { courseId: { in: courseIds } } },
          },
          select: {
            lessonId: true,
            completed: true,
            watchedSecs: true,
            lastAccessedAt: true,
            lesson: { select: { section: { select: { courseId: true } } } },
          },
        });

  const progressByCourseId = new Map<string, LessonProgressMap>();
  for (const row of progressRows) {
    const cid = row.lesson.section.courseId;
    if (!progressByCourseId.has(cid)) progressByCourseId.set(cid, new Map());
    progressByCourseId.get(cid)!.set(row.lessonId, {
      completed: row.completed,
      watchedSecs: row.watchedSecs,
      lastAccessedAt: row.lastAccessedAt,
    });
  }

  const recentAchievements = await db.userAchievement.findMany({
    where: { userId: session.user.id },
    take: 5,
    orderBy: { earnedAt: "desc" },
    include: { achievement: true },
  });

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <Navbar />
      <div className="max-w-5xl mx-auto px-6 pt-6">
        <BackLink href="/">Inicio</BackLink>
      </div>
      <div className="max-w-5xl mx-auto px-6 pb-10 pt-4 space-y-8">
        {/* Bienvenida */}
        <div>
          <h1 className="text-3xl font-bold">
            Hola, <span className="text-purple-400">{user.name.split(" ")[0]}</span> 👋
          </h1>
          <p className="text-slate-400 mt-1">Continúa donde lo dejaste</p>
        </div>

        {/* XP Bar */}
        <XPBar xp={user.xp} streak={user.streak} achievementCount={user._count.achievements} />

        {/* Stats rápidas */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {[
            { label: "Cursos activos", value: user._count.enrollments, icon: "📚", href: "#cursos" },
            { label: "Certificados", value: user._count.certificates, icon: "🎓", href: "/certificates" },
            { label: "Logros", value: user._count.achievements, icon: "🏅", href: "/achievements" },
          ].map((stat) => (
            <Link
              key={stat.label}
              href={stat.href}
              className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 transition-colors"
            >
              <div className="text-2xl mb-1">{stat.icon}</div>
              <div className="text-2xl font-bold">{stat.value}</div>
              <div className="text-slate-400 text-sm mt-0.5">{stat.label}</div>
            </Link>
          ))}
        </div>

        {/* Cursos activos */}
        <div id="cursos">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Mis cursos</h2>
            <Link href="/courses" className="text-purple-400 hover:text-purple-300 text-sm">
              Explorar más →
            </Link>
          </div>

          {enrollments.length === 0 ? (
            <div className="bg-slate-900 border border-slate-800 border-dashed rounded-2xl p-10 text-center">
              <p className="text-slate-400">Aún no estás inscrito en ningún curso</p>
              <Link
                href="/courses"
                className="inline-block mt-4 bg-purple-600 hover:bg-purple-500 text-white text-sm font-medium px-5 py-2.5 rounded-xl transition-colors"
              >
                Explorar cursos
              </Link>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {enrollments.map(({ course, progress }) => {
                const totalLessons = course.sections.reduce((s, sec) => s + sec.lessons.length, 0);
                const ordered = flattenLessonIds(course.sections);
                const cmap = progressByCourseId.get(course.id) ?? new Map();
                const { lessonId: continueId } = pickContinueLesson(ordered, cmap);
                const firstLessonId = course.sections[0]?.lessons[0]?.id;
                const learnLessonId = continueId ?? firstLessonId;
                return (
                  <Link
                    key={course.slug}
                    href={
                      learnLessonId
                        ? `/courses/${course.slug}/learn/${learnLessonId}`
                        : `/courses/${course.slug}`
                    }
                    className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden hover:border-purple-500/50 transition-colors group"
                  >
                    <div className="aspect-video bg-slate-800">
                      {course.thumbnail ? (
                        <img src={course.thumbnail} alt={course.title} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-3xl">📹</div>
                      )}
                    </div>
                    <div className="p-4 space-y-2">
                      <h3 className="font-semibold text-sm group-hover:text-purple-300 transition-colors line-clamp-2">
                        {course.title}
                      </h3>
                      <p className="text-slate-500 text-xs">{course.creator.name}</p>
                      <div>
                        <div className="flex justify-between text-xs text-slate-500 mb-1">
                          <span>{Math.round(progress)}% completado</span>
                          <span>{totalLessons} lecciones</span>
                        </div>
                        <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-purple-500 rounded-full transition-all"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* Logros recientes */}
        {recentAchievements.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Logros recientes</h2>
              <Link href="/achievements" className="text-purple-400 hover:text-purple-300 text-sm">
                Ver todos →
              </Link>
            </div>
            <div className="flex gap-3 flex-wrap">
              {recentAchievements.map(({ achievement, earnedAt }) => (
                <div
                  key={achievement.id}
                  className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 flex items-center gap-3"
                  title={achievement.description}
                >
                  <span className="text-2xl">{achievement.icon}</span>
                  <div>
                    <p className="text-sm font-medium text-white">{achievement.title}</p>
                    <p className="text-xs text-slate-500">
                      {new Date(earnedAt).toLocaleDateString("es-ES", { month: "short", day: "numeric" })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* CTA creador */}
        {user.role === "STUDENT" && (
          <div className="bg-gradient-to-r from-purple-900/40 to-pink-900/40 border border-purple-500/20 rounded-2xl p-6 flex items-center justify-between flex-wrap gap-4">
            <div>
              <h3 className="font-semibold text-white">¿Tienes conocimiento para compartir?</h3>
              <p className="text-slate-400 text-sm mt-1">Conviértete en creador y publica tu primer curso</p>
            </div>
            <Link
              href="/studio/become-creator"
              className="bg-purple-600 hover:bg-purple-500 text-white text-sm font-medium px-5 py-2.5 rounded-xl transition-colors whitespace-nowrap"
            >
              Crear curso →
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
