import { auth } from "@/core/auth";
import { redirect, notFound } from "next/navigation";
import { db } from "@/core/db";
import { LessonQuizzesManage } from "@/modules/quizzes/components/LessonQuizzesManage";
import { LessonStudioMeta } from "@/modules/studio/components/LessonStudioMeta";
import { Navbar } from "@/shared/components/Navbar";
import { BackLink } from "@/shared/components/BackLink";
import Link from "next/link";

type Props = { params: Promise<{ courseId: string; lessonId: string }> };

export default async function LessonStudioPage({ params }: Props) {
  const { courseId, lessonId } = await params;
  const session = await auth();
  if (!session?.user) redirect("/login");

  const lesson = await db.lesson.findUnique({
    where: { id: lessonId },
    include: {
      section: { include: { course: true } },
      resources: { orderBy: { position: "asc" } },
      quizzes: {
        include: {
          questions: {
            orderBy: { position: "asc" },
            include: { options: { orderBy: { position: "asc" } } },
          },
        },
      },
    },
  });

  if (!lesson || lesson.section.course.id !== courseId || lesson.section.course.creatorId !== session.user.id) {
    notFound();
  }

  const course = lesson.section.course;

  const quizList = lesson.quizzes.map((quiz) => ({
    id: quiz.id,
    title: quiz.title,
    type: quiz.type,
    triggerAt: quiz.triggerAt,
    passingScore: quiz.passingScore,
    maxAttempts: quiz.maxAttempts,
    questions: quiz.questions.map((q) => ({
      text: q.text,
      type: q.type,
      points: q.points,
      options: q.options.map((o) => ({ text: o.text, isCorrect: o.isCorrect })),
    })),
  }));

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <Navbar />
      <div className="max-w-4xl mx-auto px-6 pt-6">
        <BackLink href={`/studio/courses/${courseId}`}>Volver al curso en Studio</BackLink>
      </div>
      <div className="border-b border-slate-800 px-6 py-5">
        <div className="max-w-4xl mx-auto">
          <nav className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-slate-500">
            <Link href="/studio" className="hover:text-slate-300">
              Studio
            </Link>
            <span aria-hidden> / </span>
            <Link href={`/studio/courses/${courseId}`} className="hover:text-slate-300 truncate max-w-[200px]">
              {course.title}
            </Link>
            <span aria-hidden> / </span>
            <span className="text-slate-400 truncate max-w-[220px]">{lesson.title}</span>
          </nav>
          <h1 className="text-2xl font-bold mt-3">{lesson.title}</h1>
          <div className="flex items-center gap-3 mt-2">
            <a
              href={`https://youtube.com/watch?v=${lesson.youtubeId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-red-400 hover:text-red-300 transition-colors"
            >
              ▶ Ver en YouTube
            </a>
            {lesson.duration > 0 && (
              <span className="text-slate-500 text-sm">
                {Math.floor(lesson.duration / 60)}:{String(lesson.duration % 60).padStart(2, "0")} min
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8 space-y-10">
        <LessonStudioMeta
          lessonId={lessonId}
          initialDescription={lesson.description}
          initialCreatorNotes={lesson.creatorNotes}
          resources={lesson.resources.map((r) => ({ id: r.id, title: r.title, url: r.url }))}
        />
        <LessonQuizzesManage lessonId={lessonId} courseId={courseId} quizzes={quizList} />
      </div>
    </main>
  );
}
