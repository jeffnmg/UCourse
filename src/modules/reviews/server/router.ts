import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, publicProcedure, protectedProcedure } from "@/core/trpc/init";
import { cache, CACHE_KEYS } from "@/core/redis";

export const reviewsRouter = createTRPCRouter({
  list: publicProcedure
    .input(z.object({ courseId: z.string(), cursor: z.string().optional(), limit: z.number().default(10) }))
    .query(async ({ ctx, input }) => {
      const reviews = await ctx.db.review.findMany({
        where: { courseId: input.courseId, ...(input.cursor && { id: { lt: input.cursor } }) },
        take: input.limit + 1,
        orderBy: { createdAt: "desc" },
        include: { user: { select: { name: true, username: true, avatar: true } } },
      });
      let nextCursor: string | undefined;
      if (reviews.length > input.limit) nextCursor = reviews.pop()!.id;
      return { reviews, nextCursor };
    }),

  upsert: protectedProcedure
    .input(z.object({ courseId: z.string(), rating: z.number().min(1).max(5), comment: z.string().max(1000).optional() }))
    .mutation(async ({ ctx, input }) => {
      // Solo inscriptos pueden reseñar
      const enrollment = await ctx.db.enrollment.findUnique({
        where: { userId_courseId: { userId: ctx.user.id, courseId: input.courseId } },
      });
      if (!enrollment) throw new TRPCError({ code: "FORBIDDEN", message: "Debes estar inscrito para reseñar" });

      const review = await ctx.db.review.upsert({
        where: { userId_courseId: { userId: ctx.user.id, courseId: input.courseId } },
        update: { rating: input.rating, comment: input.comment },
        create: { ...input, userId: ctx.user.id },
      });

      // Actualizar rating promedio del curso
      const agg = await ctx.db.review.aggregate({
        where: { courseId: input.courseId },
        _avg: { rating: true },
        _count: { rating: true },
      });
      await ctx.db.course.update({
        where: { id: input.courseId },
        data: { avgRating: agg._avg.rating ?? 0, ratingCount: agg._count.rating },
      });

      // Invalidar cache del curso
      const course = await ctx.db.course.findUnique({ where: { id: input.courseId }, select: { slug: true } });
      if (course) await cache.del(CACHE_KEYS.courseDetail(course.slug));

      return review;
    }),
});
