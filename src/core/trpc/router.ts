import { createTRPCRouter } from "./init";
import { authRouter } from "@/modules/auth/server/router";
import { coursesRouter } from "@/modules/courses/server/router";
import { lessonsRouter } from "@/modules/courses/server/lessons-router";
import { quizzesRouter } from "@/modules/quizzes/server/router";
import { progressRouter } from "@/modules/progress/server/router";
import { notesRouter } from "@/modules/notes/server/router";
import { reviewsRouter } from "@/modules/reviews/server/router";
import { searchRouter } from "@/modules/search/server/router";
import { gamificationRouter } from "@/modules/gamification/server/router";
import { certificatesRouter } from "@/modules/certificates/server/router";
import { analyticsRouter } from "@/modules/analytics/server/router";
import { commentsRouter } from "@/modules/comments/server/router";

export const appRouter = createTRPCRouter({
  auth: authRouter,
  courses: coursesRouter,
  lessons: lessonsRouter,
  quizzes: quizzesRouter,
  progress: progressRouter,
  notes: notesRouter,
  reviews: reviewsRouter,
  search: searchRouter,
  gamification: gamificationRouter,
  certificates: certificatesRouter,
  analytics: analyticsRouter,
  comments: commentsRouter,
});

export type AppRouter = typeof appRouter;
