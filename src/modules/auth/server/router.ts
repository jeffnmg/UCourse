import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "@/core/trpc/init";
import { TRPCError } from "@trpc/server";

export const authRouter = createTRPCRouter({
  // Retorna el perfil del usuario autenticado
  me: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.user.findUnique({
      where: { id: ctx.user.id },
      select: {
        id: true,
        email: true,
        username: true,
        name: true,
        avatar: true,
        bio: true,
        role: true,
        xp: true,
        streak: true,
        createdAt: true,
        _count: {
          select: { enrollments: true, courses: true, certificates: true },
        },
      },
    });
  }),

  // Actualiza el perfil del usuario
  updateProfile: protectedProcedure
    .input(
      z.object({
        name: z.string().min(2).max(60).optional(),
        bio: z.string().max(300).optional(),
        username: z
          .string()
          .min(3)
          .max(30)
          .regex(/^[a-z0-9_]+$/, "Solo letras minúsculas, números y _")
          .optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (input.username) {
        const existing = await ctx.db.user.findUnique({
          where: { username: input.username },
        });
        if (existing && existing.id !== ctx.user.id) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "Ese nombre de usuario ya está en uso",
          });
        }
      }
      return ctx.db.user.update({
        where: { id: ctx.user.id },
        data: input,
      });
    }),

  // Solicita cambio de rol a CREATOR
  becomeCreator: protectedProcedure.mutation(async ({ ctx }) => {
    if (ctx.user.role !== "STUDENT") {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Ya tienes rol de creador",
      });
    }
    return ctx.db.user.update({
      where: { id: ctx.user.id },
      data: { role: "CREATOR" },
    });
  }),
});
