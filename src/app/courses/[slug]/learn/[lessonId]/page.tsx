import { auth } from "@/core/auth";
import { redirect, notFound } from "next/navigation";
import { db } from "@/core/db";
import { LearningView } from "@/modules/player/components/LearningView";

type Props = { params: Promise<{ slug: string; lessonId: string }> };

export default async function LearnPage({ params }: Props) {
  const { slug, lessonId } = await params;
  const session = await auth();
  if (!session?.user) redirect(`/login`);

  const lesson = await db.lesson.findUnique({
    where: { id: lessonId },
    include: {
      section: {
        include: {
          course: {
            include: {
              sections: {
                orderBy: { position: "asc" },
                include: {
                  lessons: {
                    orderBy: { position: "asc" },
                    select: { id: true, title: true, duration: true },
                  },
                },
              },
            },
          },
        },
      },
      quizzes: {
        include: {
          questions: {
            orderBy: { position: "asc" },
            include: { options: { orderBy: { position: "asc" } } },
          },
        },
      },
      resources: { orderBy: { position: "asc" } },
    },
  });

  if (!lesson || lesson.section.course.slug !== slug) notFound();

  const course = lesson.section.course;

  if (course.creatorId !== session.user.id) {
    const enrollment = await db.enrollment.findUnique({
      where: { userId_courseId: { userId: session.user.id, courseId: course.id } },
    });
    if (!enrollment && !lesson.isFree) redirect(`/courses/${slug}`);
  }

  const allLessonIds = course.sections.flatMap((s) => s.lessons.map((l) => l.id));
  const [completedProgress, myProgress] = await Promise.all([
    db.lessonProgress.findMany({
      where: { userId: session.user.id, lessonId: { in: allLessonIds }, completed: true },
      select: { lessonId: true },
    }),
    db.lessonProgress.findUnique({
      where: { userId_lessonId: { userId: session.user.id, lessonId } },
    }),
  ]);
  const completedIds = completedProgress.map((p) => p.lessonId);

  const flatLessons = course.sections.flatMap((s) => s.lessons);
  const lessonIdx = flatLessons.findIndex((l) => l.id === lessonId);
  const lessonIndex1 = lessonIdx >= 0 ? lessonIdx + 1 : 1;
  const totalLessons = flatLessons.length;
  const sectionIdx = course.sections.findIndex((s) => s.lessons.some((l) => l.id === lessonId));
  const sectionIndex1 = sectionIdx >= 0 ? sectionIdx + 1 : 1;
  const totalSections = course.sections.length;

  const isComplete = completedIds.includes(lessonId);
  const resumeSeconds =
    isComplete || !myProgress
      ? 0
      : Math.min(
          myProgress.watchedSecs,
          lesson.duration > 5 ? lesson.duration - 3 : lesson.duration
        );

  return (
    <LearningView
      lesson={lesson}
      sections={course.sections}
      courseSlug={slug}
      courseTitle={course.title}
      completedLessonIds={completedIds}
      resumeSeconds={resumeSeconds}
      lessonIndex1={lessonIndex1}
      totalLessons={totalLessons}
      sectionIndex1={sectionIndex1}
      totalSections={totalSections}
      currentUserId={session.user.id}
      courseCreatorId={course.creatorId}
    />
  );
}
