import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, protectedProcedure, creatorProcedure, publicProcedure } from "@/core/trpc/init";

export const certificatesRouter = createTRPCRouter({
  // Verificación pública de un certificado por código
  verify: publicProcedure
    .input(z.object({ code: z.string() }))
    .query(async ({ ctx, input }) => {
      const cert = await ctx.db.certificate.findUnique({
        where: { verifyCode: input.code },
        include: {
          user: { select: { name: true, username: true } },
          course: { select: { title: true, creator: { select: { name: true } } } },
        },
      });
      if (!cert) throw new TRPCError({ code: "NOT_FOUND" });
      return cert;
    }),

  // Mis certificados
  mine: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.certificate.findMany({
      where: { userId: ctx.user.id },
      include: {
        course: { select: { title: true, slug: true, thumbnail: true } },
      },
      orderBy: { issuedAt: "desc" },
    });
  }),

  // Crear/actualizar template del diploma (solo creador del curso)
  saveTemplate: creatorProcedure
    .input(
      z.object({
        courseId: z.string(),
        designJson: z.record(z.string(), z.unknown()).transform((v) => JSON.stringify(v)),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const course = await ctx.db.course.findUnique({ where: { id: input.courseId } });
      if (!course || course.creatorId !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      return ctx.db.certificateTemplate.upsert({
        where: { courseId: input.courseId },
        update: { designJson: input.designJson },
        create: { courseId: input.courseId, designJson: input.designJson },
      });
    }),

  // Emitir certificado al completar un curso
  issue: protectedProcedure
    .input(z.object({ courseId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // Verificar que el curso esté completado
      const enrollment = await ctx.db.enrollment.findUnique({
        where: { userId_courseId: { userId: ctx.user.id, courseId: input.courseId } },
      });
      if (!enrollment?.completedAt) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Debes completar el curso para obtener el certificado",
        });
      }

      // Evitar duplicados
      const existing = await ctx.db.certificate.findUnique({
        where: { userId_courseId: { userId: ctx.user.id, courseId: input.courseId } },
      });
      if (existing) return existing;

      return ctx.db.certificate.create({
        data: { userId: ctx.user.id, courseId: input.courseId },
      });
    }),
});
