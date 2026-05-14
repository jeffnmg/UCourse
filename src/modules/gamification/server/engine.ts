import type { PrismaClient } from "@prisma/client";

type AchievementKey =
  | "FIRST_ENROLLMENT"
  | "FIRST_COMPLETION"
  | "STREAK_3"
  | "STREAK_7"
  | "STREAK_30"
  | "QUIZ_PERFECT"
  | "COURSE_CREATOR"
  | "FIRST_REVIEW";

/**
 * Otorga XP al usuario y actualiza su racha diaria
 */
export async function awardXP(db: PrismaClient, userId: string, amount: number) {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { xp: true, streak: true, lastActiveAt: true },
  });
  if (!user) return;

  const now = new Date();
  const lastActive = user.lastActiveAt;
  let newStreak = user.streak;

  if (lastActive) {
    const hoursSince = (now.getTime() - lastActive.getTime()) / (1000 * 60 * 60);
    if (hoursSince >= 24 && hoursSince < 48) {
      // Día siguiente → aumenta racha
      newStreak = user.streak + 1;
    } else if (hoursSince >= 48) {
      // Más de 2 días → reset racha
      newStreak = 1;
    }
  } else {
    newStreak = 1;
  }

  await db.user.update({
    where: { id: userId },
    data: { xp: { increment: amount }, streak: newStreak, lastActiveAt: now },
  });

  return newStreak;
}

/**
 * Verifica y otorga logros pendientes. Retorna los logros nuevos ganados.
 */
export async function checkAndAwardAchievements(
  db: PrismaClient,
  userId: string,
  trigger: {
    event:
      | "ENROLLMENT"
      | "LESSON_COMPLETE"
      | "QUIZ_PASS"
      | "QUIZ_PERFECT"
      | "COURSE_COMPLETE"
      | "BECAME_CREATOR"
      | "REVIEW_CREATED";
    quizScore?: number;
  }
): Promise<Array<{ key: string; title: string; icon: string; xpReward: number }>> {
  const newAchievements: Array<{ key: string; title: string; icon: string; xpReward: number }> = [];

  async function tryGrant(key: AchievementKey) {
    const achievement = await db.achievement.findUnique({ where: { key } });
    if (!achievement) return;

    const alreadyEarned = await db.userAchievement.findUnique({
      where: { userId_achievementId: { userId, achievementId: achievement.id } },
    });
    if (alreadyEarned) return;

    await db.userAchievement.create({
      data: { userId, achievementId: achievement.id },
    });

    // Otorgar XP del logro
    await db.user.update({
      where: { id: userId },
      data: { xp: { increment: achievement.xpReward } },
    });

    newAchievements.push({
      key: achievement.key,
      title: achievement.title,
      icon: achievement.icon,
      xpReward: achievement.xpReward,
    });
  }

  const user = await db.user.findUnique({
    where: { id: userId },
    select: { streak: true, _count: { select: { enrollments: true, certificates: true } } },
  });
  if (!user) return [];

  switch (trigger.event) {
    case "ENROLLMENT":
      if (user._count.enrollments === 1) await tryGrant("FIRST_ENROLLMENT");
      break;

    case "COURSE_COMPLETE":
      if (user._count.certificates === 0) await tryGrant("FIRST_COMPLETION");
      break;

    case "QUIZ_PERFECT":
      if (trigger.quizScore === 100) await tryGrant("QUIZ_PERFECT");
      break;

    case "BECAME_CREATOR":
      await tryGrant("COURSE_CREATOR");
      break;

    case "REVIEW_CREATED":
      await tryGrant("FIRST_REVIEW");
      break;

    case "LESSON_COMPLETE": {
      // Revisar streaks
      if (user.streak >= 3) await tryGrant("STREAK_3");
      if (user.streak >= 7) await tryGrant("STREAK_7");
      if (user.streak >= 30) await tryGrant("STREAK_30");
      break;
    }
  }

  return newAchievements;
}
