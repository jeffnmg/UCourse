import { db } from "@/core/db";
import { auth } from "@/core/auth";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Navbar } from "@/shared/components/Navbar";
import { BackLink } from "@/shared/components/BackLink";
import { EnrollButton } from "@/modules/courses/components/EnrollButton";
import {
  flattenLessonIds,
  pickContinueLesson,
  type LessonProgressMap,
} from "@/modules/progress/lib/continue-lesson";

type Props = { params: Promise<{ slug: string }> };

const LEVEL_LABELS: Record<string, string> = {
  BEGINNER: "Principiante",
  INTERMEDIATE: "Intermedio",
  ADVANCED: "Avanzado",
};

function formatDuration(seconds: number) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m} min`;
}

export default async function CourseDetailPage({ params }: Props) {
  const { slug } = await params;
  const session = await auth();

  const course = await db.course.findUnique({
    where: { slug, isPublished: true },
    include: {
      creator: { select: { id: true, name: true, username: true, avatar: true, bio: true } },
      category: true,
      sections: {
        orderBy: { position: "asc" },
        include: {
          lessons: {
            orderBy: { position: "asc" },
            select: { id: true, title: true, duration: true, isFree: true, position: true },
          },
        },
      },
      _count: { select: { enrollments: true, reviews: true } },
    },
  });

  if (!course) notFound();

  const totalLessons = course.sections.reduce((s, sec) => s + sec.lessons.length, 0);
  const totalDuration = course.sections.reduce(
    (s, sec) => s + sec.lessons.reduce((ls, l) => ls + l.duration, 0),
    0
  );

  let isEnrolled = false;
  let firstLessonId: string | null = null;

  const isCreator = !!session?.user && course.creatorId === session.user.id;

  if (session?.user) {
    const enrollment = await db.enrollment.findUnique({
      where: { userId_courseId: { userId: session.user.id, courseId: course.id } },
    });
    isEnrolled = !!enrollment;
  }

  firstLessonId = course.sections[0]?.lessons[0]?.id ?? null;

  const canJumpToLearning = !!session?.user && (isEnrolled || isCreator);
  let continueLessonId = firstLessonId;
  let continueCtaLabel = "Continuar aprendiendo →";

  if (canJumpToLearning && session?.user) {
    const orderedIds = flattenLessonIds(course.sections);
    const progresses = await db.lessonProgress.findMany({
      where: {
        userId: session.user.id,
        lesson: { section: { courseId: course.id } },
      },
      select: {
        lessonId: true,
        completed: true,
        watchedSecs: true,
        lastAccessedAt: true,
      },
    });
    const pmap: LessonProgressMap = new Map(
      progresses.map((p) => [
        p.lessonId,
        {
          completed: p.completed,
          watchedSecs: p.watchedSecs,
          lastAccessedAt: p.lastAccessedAt,
        },
      ])
    );
    const pick = pickContinueLesson(orderedIds, pmap);
    continueLessonId = pick.lessonId ?? firstLessonId;
    continueCtaLabel = pick.allComplete ? "Repasar curso →" : "Continuar donde lo dejaste →";
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <Navbar />
      <div className="max-w-6xl mx-auto px-6 pt-4 pb-1">
        <BackLink href="/courses">Catálogo de cursos</BackLink>
      </div>

      {/* Hero */}
      <div className="bg-gradient-to-br from-slate-900 via-purple-950/30 to-slate-900 border-b border-slate-800 py-12 px-6">
        <div className="max-w-6xl mx-auto grid lg:grid-cols-3 gap-10">
          <div className="lg:col-span-2 space-y-5">
            <div className="flex items-center gap-2 text-sm text-slate-400">
              <Link href="/courses" className="hover:text-white transition-colors">
                Cursos
              </Link>
              <span>›</span>
              <Link
                href={`/courses?category=${course.category.slug}`}
                className="hover:text-white transition-colors"
              >
                {course.category.name}
              </Link>
            </div>

            <h1 className="text-3xl sm:text-4xl font-bold leading-tight">{course.title}</h1>
            <p className="text-slate-300 text-lg leading-relaxed">{course.description}</p>

            <div className="flex flex-wrap gap-4 text-sm text-slate-400">
              {course.avgRating > 0 && (
                <span className="text-yellow-400">★ {course.avgRating.toFixed(1)}</span>
              )}
              <span>{course._count.enrollments} estudiantes</span>
              <span>{totalLessons} lecciones</span>
              {totalDuration > 0 && <span>{formatDuration(totalDuration)} de contenido</span>}
              <span>{LEVEL_LABELS[course.level]}</span>
              <span>{course.language === "es" ? "🇪🇸 Español" : course.language}</span>
            </div>

            <div className="flex items-center gap-3 pt-1">
              {course.creator.avatar ? (
                <img
                  src={course.creator.avatar}
                  alt={course.creator.name}
                  className="w-10 h-10 rounded-full"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-purple-600 flex items-center justify-center font-bold">
                  {course.creator.name[0]}
                </div>
              )}
              <div>
                <p className="text-xs text-slate-500">Creado por</p>
                <p className="font-medium">{course.creator.name}</p>
              </div>
            </div>
          </div>

          {/* Card sticky */}
          <div className="lg:col-span-1">
            <div className="bg-slate-900 border border-slate-700 rounded-2xl overflow-hidden sticky top-20">
              {course.thumbnail && (
                <img
                  src={course.thumbnail}
                  alt={course.title}
                  className="w-full aspect-video object-cover"
                />
              )}
              <div className="p-6 space-y-4">
                <div className="text-3xl font-bold">Gratis</div>

                {isCreator && (
                  <>
                    <Link
                      href={`/studio/courses/${course.id}`}
                      className="w-full block text-center font-semibold py-3 rounded-xl transition-colors border-2 border-purple-500/60 text-purple-200 bg-purple-500/10 hover:bg-purple-500/20"
                    >
                      Administrar este curso
                    </Link>
                    {!isEnrolled && (
                      <p className="text-xs text-slate-400 leading-relaxed">
                        Como creador tienes acceso a todo el contenido sin inscribirte. El botón morado abajo es para
                        aprender como lo verían los estudiantes.
                      </p>
                    )}
                  </>
                )}

                {canJumpToLearning && continueLessonId ? (
                  <Link
                    href={`/courses/${course.slug}/learn/${continueLessonId}`}
                    className="w-full block text-center bg-purple-600 hover:bg-purple-500 text-white font-semibold py-3.5 rounded-xl transition-colors"
                  >
                    {continueCtaLabel}
                  </Link>
                ) : session?.user ? (
                  <EnrollButton courseId={course.id} courseSlug={course.slug} firstLessonId={firstLessonId} />
                ) : (
                  <Link
                    href="/register"
                    className="w-full block text-center bg-purple-600 hover:bg-purple-500 text-white font-semibold py-3.5 rounded-xl transition-colors"
                  >
                    Inscribirse gratis
                  </Link>
                )}

                <ul className="space-y-2 text-sm text-slate-300 pt-2">
                  <li>✓ {totalLessons} lecciones en video</li>
                  <li>✓ Acceso completo de por vida</li>
                  <li>✓ Certificado al completar</li>
                  <li>✓ Notas y quices integrados</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Curriculum */}
      <div className="max-w-6xl mx-auto px-6 py-10 lg:pr-[calc(33.333%+3.5rem)]">
        {isCreator && (
          <div className="mb-6 rounded-2xl border border-purple-500/35 bg-purple-500/10 px-5 py-4 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-slate-300">
              Eres el creador de este curso. Edita lecciones, quices y publicación desde el Studio.
            </p>
            <Link
              href={`/studio/courses/${course.id}`}
              className="shrink-0 text-sm font-semibold text-white bg-purple-600 hover:bg-purple-500 px-4 py-2.5 rounded-xl transition-colors"
            >
              Ir a administración →
            </Link>
          </div>
        )}
        <h2 className="text-2xl font-bold mb-6">Contenido del curso</h2>
        <div className="space-y-3">
          {course.sections.map((section) => (
            <details key={section.id} className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden group" open>
              <summary className="flex items-center justify-between px-5 py-4 cursor-pointer hover:bg-slate-800/50 transition-colors list-none">
                <div className="flex items-center gap-3">
                  <span className="font-semibold">{section.title}</span>
                  <span className="text-slate-500 text-sm">{section.lessons.length} lecciones</span>
                </div>
                <span className="text-slate-500 text-sm group-open:rotate-180 transition-transform">▼</span>
              </summary>
              <div className="border-t border-slate-800">
                {section.lessons.map((lesson) => {
                  const canAccess = isCreator || isEnrolled || lesson.isFree;
                  const learnHref = `/courses/${course.slug}/learn/${lesson.id}`;
                  return (
                    <div
                      key={lesson.id}
                      className="flex items-center gap-3 px-5 py-3 border-b border-slate-800/50 text-sm flex-wrap"
                    >
                      <span className="text-slate-500 shrink-0">▶</span>
                      <span
                        className={`flex-1 min-w-[120px] ${lesson.isFree ? "text-white" : "text-slate-400"}`}
                      >
                        {lesson.title}
                      </span>
                      {lesson.isFree && (
                        <span className="text-xs text-green-400 bg-green-500/10 px-2 py-0.5 rounded-full shrink-0">
                          Vista previa
                        </span>
                      )}
                      {lesson.duration > 0 && (
                        <span className="text-slate-500 text-xs shrink-0">
                          {formatDuration(lesson.duration)}
                        </span>
                      )}
                      <div className="w-full sm:w-auto sm:ml-auto flex justify-end">
                        {canAccess ? (
                          <Link
                            href={learnHref}
                            className="text-xs sm:text-sm font-medium text-purple-400 hover:text-purple-300 whitespace-nowrap"
                          >
                            Ver lección →
                          </Link>
                        ) : session?.user ? (
                          <span className="text-xs text-slate-500">Inscríbete para desbloquear</span>
                        ) : (
                          <Link
                            href={`/login?callbackUrl=/courses/${course.slug}`}
                            className="text-xs font-medium text-purple-400 hover:text-purple-300"
                          >
                            Inicia sesión para ver
                          </Link>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </details>
          ))}
        </div>
      </div>
    </div>
  );
}
