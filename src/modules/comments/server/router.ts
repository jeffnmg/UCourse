import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, protectedProcedure } from "@/core/trpc/init";

async function assertCanViewLesson(
  ctx: { db: typeof import("@/core/db").db; user: { id: string } },
  lessonId: string
) {
  const lesson = await ctx.db.lesson.findUnique({
    where: { id: lessonId },
    include: { section: { include: { course: true } } },
  });
  if (!lesson) throw new TRPCError({ code: "NOT_FOUND" });
  const course = lesson.section.course;
  if (course.creatorId === ctx.user.id) return;
  const enrollment = await ctx.db.enrollment.findUnique({
    where: { userId_courseId: { userId: ctx.user.id, courseId: course.id } },
  });
  if (!enrollment && !lesson.isFree) {
    throw new TRPCError({ code: "FORBIDDEN", message: "Sin acceso a esta lección" });
  }
}

export const commentsRouter = createTRPCRouter({
  byLesson: protectedProcedure
    .input(z.object({ lessonId: z.string() }))
    .query(async ({ ctx, input }) => {
      await assertCanViewLesson(ctx, input.lessonId);
      return ctx.db.lessonComment.findMany({
        where: { lessonId: input.lessonId },
        orderBy: { createdAt: "asc" },
        take: 80,
        include: {
          user: { select: { id: true, name: true, username: true, avatar: true } },
        },
      });
    }),

  add: protectedProcedure
    .input(
      z.object({
        lessonId: z.string(),
        body: z.string().min(2).max(2000),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await assertCanViewLesson(ctx, input.lessonId);
      return ctx.db.lessonComment.create({
        data: {
          lessonId: input.lessonId,
          userId: ctx.user.id,
          body: input.body.trim(),
        },
        include: {
          user: { select: { id: true, name: true, username: true, avatar: true } },
        },
      });
    }),

  delete: protectedProcedure
    .input(z.object({ commentId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const row = await ctx.db.lessonComment.findUnique({
        where: { id: input.commentId },
        include: { lesson: { include: { section: { include: { course: true } } } } },
      });
      if (!row) throw new TRPCError({ code: "NOT_FOUND" });
      const isAuthor = row.userId === ctx.user.id;
      const isCreator = row.lesson.section.course.creatorId === ctx.user.id;
      if (!isAuthor && !isCreator) throw new TRPCError({ code: "FORBIDDEN" });
      await ctx.db.lessonComment.delete({ where: { id: input.commentId } });
      return { ok: true as const };
    }),
});
