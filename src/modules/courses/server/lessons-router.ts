import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, creatorProcedure, protectedProcedure } from "@/core/trpc/init";

// Extrae el ID de un URL de YouTube
function extractYoutubeId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match?.[1]) return match[1];
  }
  return null;
}

export const lessonsRouter = createTRPCRouter({
  // Crear sección dentro de un curso
  createSection: creatorProcedure
    .input(z.object({ courseId: z.string(), title: z.string().min(2).max(100) }))
    .mutation(async ({ ctx, input }) => {
      const course = await ctx.db.course.findUnique({ where: { id: input.courseId } });
      if (!course || course.creatorId !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      const lastSection = await ctx.db.section.findFirst({
        where: { courseId: input.courseId },
        orderBy: { position: "desc" },
      });
      return ctx.db.section.create({
        data: {
          title: input.title,
          position: (lastSection?.position ?? 0) + 1,
          courseId: input.courseId,
        },
      });
    }),

  // Crear lección dentro de una sección
  createLesson: creatorProcedure
    .input(
      z.object({
        sectionId: z.string(),
        title: z.string().min(2).max(150),
        youtubeUrl: z.string().url(),
        description: z.string().max(1000).optional(),
        creatorNotes: z.string().max(20000).optional(),
        duration: z.number().min(0).default(0),
        isFree: z.boolean().default(false),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const section = await ctx.db.section.findUnique({
        where: { id: input.sectionId },
        include: { course: true },
      });
      if (!section || section.course.creatorId !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      const youtubeId = extractYoutubeId(input.youtubeUrl);
      if (!youtubeId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "URL de YouTube no válida",
        });
      }
      const lastLesson = await ctx.db.lesson.findFirst({
        where: { sectionId: input.sectionId },
        orderBy: { position: "desc" },
      });
      return ctx.db.lesson.create({
        data: {
          sectionId: input.sectionId,
          title: input.title,
          youtubeUrl: input.youtubeUrl,
          youtubeId,
          description: input.description,
          creatorNotes: input.creatorNotes,
          duration: input.duration,
          isFree: input.isFree,
          position: (lastLesson?.position ?? 0) + 1,
        },
      });
    }),

  // Obtener lección con quizzes (vista de aprendizaje)
  getForLearning: protectedProcedure
    .input(z.object({ lessonId: z.string() }))
    .query(async ({ ctx, input }) => {
      const lesson = await ctx.db.lesson.findUnique({
        where: { id: input.lessonId },
        include: {
          section: {
            include: {
              course: {
                select: { id: true, slug: true, title: true, creatorId: true },
              },
            },
          },
          quizzes: {
            include: {
              questions: {
                orderBy: { position: "asc" },
                include: { options: { orderBy: { position: "asc" } } },
              },
            },
          },
          resources: { orderBy: { position: "asc" } },
        },
      });

      if (!lesson) throw new TRPCError({ code: "NOT_FOUND" });

      // Verificar que el usuario está inscrito (o es el creador)
      const course = lesson.section.course;
      if (course.creatorId !== ctx.user.id) {
        const enrollment = await ctx.db.enrollment.findUnique({
          where: { userId_courseId: { userId: ctx.user.id, courseId: course.id } },
        });
        if (!enrollment && !lesson.isFree) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Debes inscribirte en el curso para ver esta lección",
          });
        }
      }

      // Obtener progreso del usuario en esta lección
      const progress = await ctx.db.lessonProgress.findUnique({
        where: { userId_lessonId: { userId: ctx.user.id, lessonId: input.lessonId } },
      });

      return { lesson, progress };
    }),

  updateLessonMeta: creatorProcedure
    .input(
      z.object({
        lessonId: z.string(),
        title: z.string().min(2).max(150).optional(),
        description: z.string().max(1000).optional().nullable(),
        creatorNotes: z.string().max(20000).optional().nullable(),
        duration: z.number().min(0).optional(),
        isFree: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { lessonId, ...rest } = input;
      const lesson = await ctx.db.lesson.findUnique({
        where: { id: lessonId },
        include: { section: { include: { course: true } } },
      });
      if (!lesson || lesson.section.course.creatorId !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      const data: Record<string, unknown> = {};
      if (rest.title !== undefined) data.title = rest.title;
      if (rest.description !== undefined) data.description = rest.description;
      if (rest.creatorNotes !== undefined) data.creatorNotes = rest.creatorNotes;
      if (rest.duration !== undefined) data.duration = rest.duration;
      if (rest.isFree !== undefined) data.isFree = rest.isFree;
      return ctx.db.lesson.update({ where: { id: lessonId }, data });
    }),

  addLessonResource: creatorProcedure
    .input(
      z.object({
        lessonId: z.string(),
        title: z.string().min(1).max(120),
        url: z.string().url(),
        kind: z.enum(["LINK"]).default("LINK"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const lesson = await ctx.db.lesson.findUnique({
        where: { id: input.lessonId },
        include: { section: { include: { course: true } } },
      });
      if (!lesson || lesson.section.course.creatorId !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      const last = await ctx.db.lessonResource.findFirst({
        where: { lessonId: input.lessonId },
        orderBy: { position: "desc" },
      });
      return ctx.db.lessonResource.create({
        data: {
          lessonId: input.lessonId,
          title: input.title,
          url: input.url,
          kind: input.kind,
          position: (last?.position ?? 0) + 1,
        },
      });
    }),

  deleteLessonResource: creatorProcedure
    .input(z.object({ resourceId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const res = await ctx.db.lessonResource.findUnique({
        where: { id: input.resourceId },
        include: { lesson: { include: { section: { include: { course: true } } } } },
      });
      if (!res || res.lesson.section.course.creatorId !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      await ctx.db.lessonResource.delete({ where: { id: input.resourceId } });
      return { ok: true as const };
    }),

  // Reordenar lecciones
  reorder: creatorProcedure
    .input(
      z.object({
        sectionId: z.string(),
        orderedIds: z.array(z.string()),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const section = await ctx.db.section.findUnique({
        where: { id: input.sectionId },
        include: { course: true },
      });
      if (!section || section.course.creatorId !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      await Promise.all(
        input.orderedIds.map((id, position) =>
          ctx.db.lesson.update({ where: { id }, data: { position } })
        )
      );
      return { success: true };
    }),
});
