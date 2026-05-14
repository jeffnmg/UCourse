import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, creatorProcedure } from "@/core/trpc/init";
import { cache } from "@/core/redis";

export const analyticsRouter = createTRPCRouter({
  // Stats generales del creador
  overview: creatorProcedure.query(async ({ ctx }) => {
    const cacheKey = `analytics:overview:${ctx.user.id}`;
    const cached = await cache.get(cacheKey);
    if (cached) return cached;

    const courses = await ctx.db.course.findMany({
      where: { creatorId: ctx.user.id },
      select: { id: true, enrollmentCount: true, avgRating: true, completionRate: true },
    });

    const totalEnrollments = courses.reduce((s, c) => s + c.enrollmentCount, 0);
    const avgRating =
      courses.length > 0
        ? courses.reduce((s, c) => s + c.avgRating, 0) / courses.length
        : 0;

    const result = {
      totalCourses: courses.length,
      totalEnrollments,
      avgRating: Math.round(avgRating * 10) / 10,
    };

    await cache.set(cacheKey, result, 300);
    return result;
  }),

  // Stats detalladas de un curso específico
  courseStats: creatorProcedure
    .input(z.object({ courseId: z.string() }))
    .query(async ({ ctx, input }) => {
      const course = await ctx.db.course.findUnique({
        where: { id: input.courseId },
      });
      if (!course || course.creatorId !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      const [enrollments, completions, quizAttempts] = await Promise.all([
        ctx.db.enrollment.count({ where: { courseId: input.courseId } }),
        ctx.db.enrollment.count({ where: { courseId: input.courseId, completedAt: { not: null } } }),
        ctx.db.quizAttempt.findMany({
          where: { quiz: { courseId: input.courseId } },
          select: { passed: true, score: true },
        }),
      ]);

      const quizPassRate =
        quizAttempts.length > 0
          ? (quizAttempts.filter((a) => a.passed).length / quizAttempts.length) * 100
          : 0;

      return {
        enrollments,
        completions,
        completionRate: enrollments > 0 ? (completions / enrollments) * 100 : 0,
        quizPassRate: Math.round(quizPassRate),
        avgQuizScore:
          quizAttempts.length > 0
            ? quizAttempts.reduce((s, a) => s + a.score, 0) / quizAttempts.length
            : 0,
      };
    }),
});
