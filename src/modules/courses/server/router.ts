import { z } from "zod";
import { TRPCError } from "@trpc/server";
import {
  createTRPCRouter,
  publicProcedure,
  protectedProcedure,
  creatorProcedure,
} from "@/core/trpc/init";
import { cache, CACHE_KEYS, CACHE_TTL } from "@/core/redis";

const courseInputSchema = z.object({
  title: z.string().min(5).max(120),
  description: z.string().min(20).max(2000),
  categoryId: z.string(),
  level: z.enum(["BEGINNER", "INTERMEDIATE", "ADVANCED"]).default("BEGINNER"),
  language: z.string().default("es"),
  tags: z.array(z.string()).max(10).default([]).transform((arr) => JSON.stringify(arr)),
  thumbnail: z.string().url().optional(),
});

export const coursesRouter = createTRPCRouter({
  // Lista pública de cursos con ranking y filtros
  list: publicProcedure
    .input(
      z.object({
        categorySlug: z.string().optional(),
        level: z.enum(["BEGINNER", "INTERMEDIATE", "ADVANCED"]).optional(),
        language: z.string().optional(),
        search: z.string().optional(),
        cursor: z.string().optional(),
        limit: z.number().min(1).max(50).default(20),
      })
    )
    .query(async ({ ctx, input }) => {
      const { categorySlug, level, language, search, cursor, limit } = input;

      const cacheKey = CACHE_KEYS.courseRanking(categorySlug);
      if (!search && !level && !language && !cursor) {
        const cached = await cache.get(cacheKey);
        if (cached) return cached;
      }

      const courses = await ctx.db.course.findMany({
        where: {
          isPublished: true,
          ...(categorySlug && { category: { slug: categorySlug } }),
          ...(level && { level }),
          ...(language && { language }),
          ...(search && {
            OR: [
              { title: { contains: search } },
              { description: { contains: search } },
            ],
          }),
          ...(cursor && { id: { lt: cursor } }),
        },
        take: limit + 1,
        orderBy: [{ enrollmentCount: "desc" }, { avgRating: "desc" }],
        select: {
          id: true,
          slug: true,
          title: true,
          description: true,
          thumbnail: true,
          level: true,
          language: true,
          enrollmentCount: true,
          avgRating: true,
          ratingCount: true,
          totalDuration: true,
          creator: { select: { name: true, username: true, avatar: true } },
          category: { select: { name: true, slug: true } },
        },
      });

      let nextCursor: string | undefined;
      if (courses.length > limit) {
        nextCursor = courses.pop()!.id;
      }

      const result = { courses, nextCursor };

      if (!search && !level && !language && !cursor) {
        await cache.set(cacheKey, result, CACHE_TTL.courseRanking);
      }

      return result;
    }),

  // Detalle público de un curso por slug
  bySlug: publicProcedure
    .input(z.object({ slug: z.string() }))
    .query(async ({ ctx, input }) => {
      const cached = await cache.get(CACHE_KEYS.courseDetail(input.slug));
      if (cached) return cached;

      const course = await ctx.db.course.findUnique({
        where: { slug: input.slug, isPublished: true },
        include: {
          creator: { select: { name: true, username: true, avatar: true, bio: true } },
          category: true,
          sections: {
            orderBy: { position: "asc" },
            include: {
              lessons: {
                orderBy: { position: "asc" },
                select: {
                  id: true,
                  title: true,
                  duration: true,
                  position: true,
                  isFree: true,
                },
              },
            },
          },
          _count: { select: { enrollments: true, reviews: true } },
        },
      });

      if (!course) throw new TRPCError({ code: "NOT_FOUND" });

      await cache.set(CACHE_KEYS.courseDetail(input.slug), course, CACHE_TTL.courseDetail);
      return course;
    }),

  // Cursos del creador autenticado (vista Studio)
  myCreatedCourses: creatorProcedure.query(async ({ ctx }) => {
    return ctx.db.course.findMany({
      where: { creatorId: ctx.user.id },
      orderBy: { updatedAt: "desc" },
      include: {
        category: true,
        _count: { select: { enrollments: true, sections: true } },
      },
    });
  }),

  // Crear curso nuevo
  create: creatorProcedure
    .input(courseInputSchema)
    .mutation(async ({ ctx, input }) => {
      const slug = input.title
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, "")
        .replace(/\s+/g, "-")
        .slice(0, 80) + "-" + Date.now();

      const { categoryId, ...rest } = input;
      return ctx.db.course.create({
        data: { ...rest, slug, creatorId: ctx.user.id, categoryId },
      });
    }),

  // Actualizar curso
  update: creatorProcedure
    .input(z.object({ courseId: z.string(), data: courseInputSchema.partial() }))
    .mutation(async ({ ctx, input }) => {
      const course = await ctx.db.course.findUnique({
        where: { id: input.courseId },
      });
      if (!course || course.creatorId !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      await cache.del(CACHE_KEYS.courseDetail(course.slug));
      const { categoryId, ...rest } = input.data;
      return ctx.db.course.update({
        where: { id: input.courseId },
        data: { ...rest, ...(categoryId ? { categoryId } : {}) },
      });
    }),

  // Publicar / despublicar curso
  togglePublish: creatorProcedure
    .input(z.object({ courseId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const course = await ctx.db.course.findUnique({
        where: { id: input.courseId },
        include: { _count: { select: { sections: true } } },
      });
      if (!course || course.creatorId !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      if (!course.isPublished && course._count.sections === 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "El curso necesita al menos una sección antes de publicarse",
        });
      }
      const updated = await ctx.db.course.update({
        where: { id: input.courseId },
        data: {
          isPublished: !course.isPublished,
          publishedAt: !course.isPublished ? new Date() : undefined,
        },
      });
      await cache.del(CACHE_KEYS.courseDetail(course.slug));
      await cache.invalidatePattern("course:ranking:*");
      return updated;
    }),
});
