import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, protectedProcedure, creatorProcedure } from "@/core/trpc/init";

export const quizzesRouter = createTRPCRouter({
  // Crear quiz para una lección
  create: creatorProcedure
    .input(
      z.object({
        lessonId: z.string().optional(),
        courseId: z.string().optional(),
        title: z.string().min(3).max(150),
        type: z.enum(["MID_VIDEO", "END_OF_LESSON", "FINAL_EXAM"]),
        triggerAt: z.number().min(0).optional(),
        passingScore: z.number().min(1).max(100).default(70),
        maxAttempts: z.number().min(1).max(10).default(3),
        questions: z.array(
          z.object({
            text: z.string().min(5),
            type: z.enum(["MULTIPLE_CHOICE", "TRUE_FALSE"]),
            points: z.number().min(1).default(1),
            options: z.array(
              z.object({
                text: z.string().min(1),
                isCorrect: z.boolean(),
              })
            ).min(2).max(6),
          })
        ).min(1).max(20),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { questions, ...quizData } = input;

      return ctx.db.quiz.create({
        data: {
          ...quizData,
          questions: {
            create: questions.map((q, qi) => ({
              text: q.text,
              type: q.type,
              points: q.points,
              position: qi,
              options: {
                create: q.options.map((o, oi) => ({
                  text: o.text,
                  isCorrect: o.isCorrect,
                  position: oi,
                })),
              },
            })),
          },
        },
        include: { questions: { include: { options: true } } },
      });
    }),

  /** Reemplaza metadatos y preguntas de un quiz de lección. Elimina intentos previos para evitar datos huérfanos. */
  update: creatorProcedure
    .input(
      z.object({
        quizId: z.string(),
        title: z.string().min(3).max(150),
        type: z.enum(["MID_VIDEO", "END_OF_LESSON", "FINAL_EXAM"]),
        triggerAt: z.number().min(0).optional(),
        passingScore: z.number().min(1).max(100).default(70),
        maxAttempts: z.number().min(1).max(10).default(3),
        questions: z
          .array(
            z.object({
              text: z.string().min(5),
              type: z.enum(["MULTIPLE_CHOICE", "TRUE_FALSE"]),
              points: z.number().min(1).default(1),
              options: z
                .array(
                  z.object({
                    text: z.string().min(1),
                    isCorrect: z.boolean(),
                  })
                )
                .min(2)
                .max(6),
            })
          )
          .min(1)
          .max(20),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { quizId, questions, ...meta } = input;

      const quiz = await ctx.db.quiz.findUnique({
        where: { id: quizId },
        include: { lesson: { include: { section: { include: { course: true } } } } },
      });
      if (
        !quiz?.lessonId ||
        !quiz.lesson ||
        quiz.lesson.section.course.creatorId !== ctx.user.id
      ) {
        throw new TRPCError({ code: "FORBIDDEN", message: "No puedes editar este quiz" });
      }
      if (quiz.courseId) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Solo se editan quices de lección aquí" });
      }

      await ctx.db.$transaction(async (tx) => {
        await tx.quizAttempt.deleteMany({ where: { quizId } });
        await tx.question.deleteMany({ where: { quizId } });
        await tx.quiz.update({
          where: { id: quizId },
          data: {
            title: meta.title,
            type: meta.type,
            triggerAt: meta.type === "MID_VIDEO" ? meta.triggerAt ?? null : null,
            passingScore: meta.passingScore,
            maxAttempts: meta.maxAttempts,
            questions: {
              create: questions.map((q, qi) => ({
                text: q.text,
                type: q.type,
                points: q.points,
                position: qi,
                options: {
                  create: q.options.map((o, oi) => ({
                    text: o.text,
                    isCorrect: o.isCorrect,
                    position: oi,
                  })),
                },
              })),
            },
          },
        });
      });

      return ctx.db.quiz.findUnique({
        where: { id: quizId },
        include: { questions: { include: { options: true }, orderBy: { position: "asc" } } },
      });
    }),

  delete: creatorProcedure
    .input(z.object({ quizId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const quiz = await ctx.db.quiz.findUnique({
        where: { id: input.quizId },
        include: { lesson: { include: { section: { include: { course: true } } } } },
      });
      if (
        !quiz?.lessonId ||
        !quiz.lesson ||
        quiz.lesson.section.course.creatorId !== ctx.user.id
      ) {
        throw new TRPCError({ code: "FORBIDDEN", message: "No puedes eliminar este quiz" });
      }

      await ctx.db.$transaction(async (tx) => {
        await tx.quizAttempt.deleteMany({ where: { quizId: input.quizId } });
        await tx.quiz.delete({ where: { id: input.quizId } });
      });

      return { ok: true as const };
    }),

  // Enviar respuestas y calcular resultado
  submit: protectedProcedure
    .input(
      z.object({
        quizId: z.string(),
        answers: z.array(
          z.object({
            questionId: z.string(),
            optionId: z.string(),
          })
        ),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const quiz = await ctx.db.quiz.findUnique({
        where: { id: input.quizId },
        include: {
          questions: { include: { options: true } },
        },
      });
      if (!quiz) throw new TRPCError({ code: "NOT_FOUND" });

      // Verificar límite de intentos
      const attemptCount = await ctx.db.quizAttempt.count({
        where: { quizId: input.quizId, userId: ctx.user.id },
      });
      if (attemptCount >= quiz.maxAttempts) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: `Máximo ${quiz.maxAttempts} intentos permitidos`,
        });
      }

      // Calcular puntaje
      let totalPoints = 0;
      let earnedPoints = 0;
      for (const question of quiz.questions) {
        totalPoints += question.points;
        const answer = input.answers.find((a) => a.questionId === question.id);
        if (answer) {
          const selectedOption = question.options.find((o) => o.id === answer.optionId);
          if (selectedOption?.isCorrect) earnedPoints += question.points;
        }
      }
      const score = totalPoints > 0 ? (earnedPoints / totalPoints) * 100 : 0;
      const passed = score >= quiz.passingScore;

      // Guardar intento
      const attempt = await ctx.db.quizAttempt.create({
        data: {
          quizId: input.quizId,
          userId: ctx.user.id,
          score,
          passed,
          startedAt: new Date(),
          endedAt: new Date(),
          answers: {
            create: input.answers.map((a) => ({
              questionId: a.questionId,
              optionId: a.optionId,
            })),
          },
        },
      });

      return { attempt, score, passed, xpEarned: passed ? 50 : 10 };
    }),

  // Obtener intentos del usuario en un quiz
  myAttempts: protectedProcedure
    .input(z.object({ quizId: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.quizAttempt.findMany({
        where: { quizId: input.quizId, userId: ctx.user.id },
        orderBy: { startedAt: "desc" },
      });
    }),
});
