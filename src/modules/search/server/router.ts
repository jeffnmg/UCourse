import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "@/core/trpc/init";

export const searchRouter = createTRPCRouter({
  courses: publicProcedure
    .input(z.object({ q: z.string().min(1).max(100), limit: z.number().default(10) }))
    .query(async ({ ctx, input }) => {
      // SQLite: sin mode: "insensitive" ni has — usa contains simple
      return ctx.db.course.findMany({
        where: {
          isPublished: true,
          OR: [
            { title: { contains: input.q } },
            { description: { contains: input.q } },
          ],
        },
        take: input.limit,
        orderBy: [{ enrollmentCount: "desc" }, { avgRating: "desc" }],
        select: {
          id: true, slug: true, title: true, thumbnail: true,
          level: true, enrollmentCount: true, avgRating: true,
          creator: { select: { name: true } },
          category: { select: { name: true, slug: true } },
        },
      });
    }),

  categories: publicProcedure.query(async ({ ctx }) => {
    return ctx.db.category.findMany({
      orderBy: { name: "asc" },
      include: { _count: { select: { courses: true } } },
    });
  }),
});
