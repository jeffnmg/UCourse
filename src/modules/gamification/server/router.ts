import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "@/core/trpc/init";
import { awardXP, checkAndAwardAchievements } from "./engine";

export const gamificationRouter = createTRPCRouter({
  // Otorgar XP + revisar logros por lección completada
  awardXP: protectedProcedure
    .input(z.object({ amount: z.number().min(1).max(500) }))
    .mutation(async ({ ctx, input }) => {
      const newStreak = await awardXP(ctx.db, ctx.user.id, input.amount);
      const newAchievements = await checkAndAwardAchievements(ctx.db, ctx.user.id, {
        event: "LESSON_COMPLETE",
      });
      return { newStreak, newAchievements };
    }),

  // Verificar logros después de un quiz
  checkQuizAchievements: protectedProcedure
    .input(z.object({ score: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const event = input.score === 100 ? "QUIZ_PERFECT" : "QUIZ_PASS";
      return checkAndAwardAchievements(ctx.db, ctx.user.id, {
        event,
        quizScore: input.score,
      });
    }),

  // Mis logros desbloqueados
  myAchievements: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.userAchievement.findMany({
      where: { userId: ctx.user.id },
      include: { achievement: true },
      orderBy: { earnedAt: "desc" },
    });
  }),

  // Todos los logros con estado de desbloqueo
  allAchievements: protectedProcedure.query(async ({ ctx }) => {
    const [all, earned] = await Promise.all([
      ctx.db.achievement.findMany(),
      ctx.db.userAchievement.findMany({
        where: { userId: ctx.user.id },
        select: { achievementId: true, earnedAt: true },
      }),
    ]);
    const earnedMap = new Map(earned.map((e) => [e.achievementId, e.earnedAt]));
    return all.map((a) => ({
      ...a,
      earned: earnedMap.has(a.id),
      earnedAt: earnedMap.get(a.id) ?? null,
    }));
  }),

  // Leaderboard
  leaderboard: protectedProcedure
    .input(z.object({ limit: z.number().default(20) }))
    .query(async ({ ctx, input }) => {
      return ctx.db.user.findMany({
        take: input.limit,
        orderBy: { xp: "desc" },
        select: { id: true, name: true, username: true, avatar: true, xp: true, streak: true },
      });
    }),

  // Stats de gamificación del usuario actual
  myStats: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.user.findUnique({
      where: { id: ctx.user.id },
      select: {
        xp: true,
        streak: true,
        lastActiveAt: true,
        _count: { select: { achievements: true } },
      },
    });
  }),
});
