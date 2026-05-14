import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, protectedProcedure } from "@/core/trpc/init";

export const notesRouter = createTRPCRouter({
  list: protectedProcedure
    .input(z.object({ lessonId: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.note.findMany({
        where: { lessonId: input.lessonId, userId: ctx.user.id },
        orderBy: { timestamp: "asc" },
      });
    }),

  create: protectedProcedure
    .input(
      z.object({
        lessonId: z.string(),
        content: z.string().min(1).max(2000),
        timestamp: z.number().min(0),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.db.note.create({
        data: { ...input, userId: ctx.user.id },
      });
    }),

  update: protectedProcedure
    .input(z.object({ noteId: z.string(), content: z.string().min(1).max(2000) }))
    .mutation(async ({ ctx, input }) => {
      const note = await ctx.db.note.findUnique({ where: { id: input.noteId } });
      if (!note || note.userId !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      return ctx.db.note.update({
        where: { id: input.noteId },
        data: { content: input.content },
      });
    }),

  delete: protectedProcedure
    .input(z.object({ noteId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const note = await ctx.db.note.findUnique({ where: { id: input.noteId } });
      if (!note || note.userId !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      return ctx.db.note.delete({ where: { id: input.noteId } });
    }),
});
