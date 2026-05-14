import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, protectedProcedure } from "@/core/trpc/init";

export const progressRouter = createTRPCRouter({
  // Inscribirse en un curso
  enroll: protectedProcedure
    .input(z.object({ courseId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const course = await ctx.db.course.findUnique({
        where: { id: input.courseId, isPublished: true },
      });
      if (!course) throw new TRPCError({ code: "NOT_FOUND" });

      const enrollment = await ctx.db.enrollment.upsert({
        where: { userId_courseId: { userId: ctx.user.id, courseId: input.courseId } },
        update: {},
        create: { userId: ctx.user.id, courseId: input.courseId },
      });

      // Actualizar contador de inscripciones
      await ctx.db.course.update({
        where: { id: input.courseId },
        data: { enrollmentCount: { increment: 1 } },
      });

      return enrollment;
    }),

  // Marcar lección como completada
  markLessonComplete: protectedProcedure
    .input(z.object({ lessonId: z.string(), watchedSecs: z.number().min(0) }))
    .mutation(async ({ ctx, input }) => {
      // Verificar si ya estaba completada ANTES del upsert
      const existing = await ctx.db.lessonProgress.findUnique({
        where: { userId_lessonId: { userId: ctx.user.id, lessonId: input.lessonId } },
        select: { completed: true },
      });
      const wasAlreadyCompleted = existing?.completed === true;

      const lessonProgress = await ctx.db.lessonProgress.upsert({
        where: { userId_lessonId: { userId: ctx.user.id, lessonId: input.lessonId } },
        update: {
          watchedSecs: input.watchedSecs,
          completed: true,
          completedAt: wasAlreadyCompleted ? undefined : new Date(),
        },
        create: {
          userId: ctx.user.id,
          lessonId: input.lessonId,
          watchedSecs: input.watchedSecs,
          completed: true,
          completedAt: new Date(),
        },
      });

      // Recalcular progreso del curso
      const lesson = await ctx.db.lesson.findUnique({
        where: { id: input.lessonId },
        include: { section: { include: { course: { include: { sections: { include: { lessons: true } } } } } } },
      });
      if (lesson) {
        const course = lesson.section.course;
        const allLessonIds = course.sections.flatMap((s) => s.lessons.map((l) => l.id));
        const completedCount = await ctx.db.lessonProgress.count({
          where: { userId: ctx.user.id, lessonId: { in: allLessonIds }, completed: true },
        });
        const progressPct = (completedCount / allLessonIds.length) * 100;
        await ctx.db.enrollment.update({
          where: { userId_courseId: { userId: ctx.user.id, courseId: course.id } },
          data: {
            progress: progressPct,
            completedAt: progressPct >= 100 ? new Date() : undefined,
          },
        });
      }

      return { ...lessonProgress, wasAlreadyCompleted };
    }),

  /** Guarda posición del video (debounced en cliente). No marca completado. */
  saveWatchProgress: protectedProcedure
    .input(z.object({ lessonId: z.string(), watchedSecs: z.number().min(0) }))
    .mutation(async ({ ctx, input }) => {
      const lesson = await ctx.db.lesson.findUnique({
        where: { id: input.lessonId },
        include: { section: { include: { course: true } } },
      });
      if (!lesson) throw new TRPCError({ code: "NOT_FOUND" });

      const course = lesson.section.course;
      if (course.creatorId !== ctx.user.id) {
        const enrollment = await ctx.db.enrollment.findUnique({
          where: { userId_courseId: { userId: ctx.user.id, courseId: course.id } },
        });
        if (!enrollment && !lesson.isFree) {
          throw new TRPCError({ code: "FORBIDDEN" });
        }
      }

      const existing = await ctx.db.lessonProgress.findUnique({
        where: { userId_lessonId: { userId: ctx.user.id, lessonId: input.lessonId } },
      });

      if (existing?.completed) {
        await ctx.db.lessonProgress.update({
          where: { userId_lessonId: { userId: ctx.user.id, lessonId: input.lessonId } },
          data: {
            lastAccessedAt: new Date(),
            watchedSecs: Math.max(existing.watchedSecs, input.watchedSecs),
          },
        });
        return { ok: true as const };
      }

      const nextWatched = Math.max(existing?.watchedSecs ?? 0, input.watchedSecs);

      await ctx.db.lessonProgress.upsert({
        where: { userId_lessonId: { userId: ctx.user.id, lessonId: input.lessonId } },
        update: {
          watchedSecs: nextWatched,
          lastAccessedAt: new Date(),
        },
        create: {
          userId: ctx.user.id,
          lessonId: input.lessonId,
          watchedSecs: nextWatched,
          completed: false,
          lastAccessedAt: new Date(),
        },
      });

      return { ok: true as const };
    }),

  // Progreso del usuario en un curso
  getCourseProgress: protectedProcedure
    .input(z.object({ courseId: z.string() }))
    .query(async ({ ctx, input }) => {
      const enrollment = await ctx.db.enrollment.findUnique({
        where: { userId_courseId: { userId: ctx.user.id, courseId: input.courseId } },
      });
      if (!enrollment) return null;

      const lessonsProgress = await ctx.db.lessonProgress.findMany({
        where: {
          userId: ctx.user.id,
          lesson: { section: { courseId: input.courseId } },
        },
        include: { lesson: { select: { id: true, title: true, position: true } } },
      });

      return { enrollment, lessonsProgress };
    }),

  // Cursos activos del estudiante
  myEnrollments: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.enrollment.findMany({
      where: { userId: ctx.user.id },
      orderBy: { enrolledAt: "desc" },
      include: {
        course: {
          select: {
            id: true, slug: true, title: true, thumbnail: true,
            creator: { select: { name: true } },
            _count: { select: { sections: true } },
          },
        },
      },
    });
  }),
});
