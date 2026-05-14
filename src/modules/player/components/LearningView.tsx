"use client";

import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import Link from "next/link";
import { VideoPlayer } from "./VideoPlayer";
import { NotesPanel } from "@/modules/notes/components/NotesPanel";
import { QuizPlayer } from "@/modules/quizzes/components/QuizPlayer";
import { LessonCommentsPanel } from "@/modules/comments/components/LessonCommentsPanel";
import { trpc } from "@/core/trpc/client";

type Option = { id: string; text: string; isCorrect: boolean; position: number };
type Question = {
  id: string;
  text: string;
  type: string;
  points: number;
  position: number;
  options: Option[];
};
type QuizData = {
  id: string;
  title: string;
  type: string;
  triggerAt: number | null;
  passingScore: number;
  maxAttempts: number;
  questions: Question[];
};

type Resource = { id: string; title: string; url: string; kind: string };

type Lesson = {
  id: string;
  title: string;
  youtubeId: string;
  duration: number;
  description: string | null;
  creatorNotes: string | null;
  quizzes: QuizData[];
  resources: Resource[];
};

type Section = {
  id: string;
  title: string;
  lessons: Array<{ id: string; title: string; duration: number }>;
};

type Props = {
  lesson: Lesson;
  sections: Section[];
  courseSlug: string;
  courseTitle: string;
  completedLessonIds: string[];
  /** Segundos guardados para reanudar (si la lección no está completada). */
  resumeSeconds: number;
  lessonIndex1: number;
  totalLessons: number;
  sectionIndex1: number;
  totalSections: number;
  currentUserId: string;
  courseCreatorId: string;
};

function formatTime(s: number) {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

export function LearningView({
  lesson,
  sections,
  courseSlug,
  courseTitle,
  completedLessonIds,
  resumeSeconds,
  lessonIndex1,
  totalLessons,
  sectionIndex1,
  totalSections,
  currentUserId,
  courseCreatorId,
}: Props) {
  const [currentTime, setCurrentTime] = useState(0);
  const [activeTab, setActiveTab] = useState<"curriculum" | "notes">("curriculum");
  const [activeQuiz, setActiveQuiz] = useState<QuizData | null>(null);
  const [xpToast, setXpToast] = useState<number | null>(null);
  const [mobileCurriculumOpen, setMobileCurriculumOpen] = useState(false);
  const [localCompleted, setLocalCompleted] = useState(() => completedLessonIds.includes(lesson.id));
  const [detailTab, setDetailTab] = useState<"about" | "discussion">("about");

  const saveDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isCompletedLesson = completedLessonIds.includes(lesson.id);

  useEffect(() => {
    setLocalCompleted(completedLessonIds.includes(lesson.id));
  }, [lesson.id, completedLessonIds]);

  useEffect(() => {
    return () => {
      if (saveDebounceRef.current) clearTimeout(saveDebounceRef.current);
    };
  }, []);

  const { prevLesson, nextLesson, currentSectionTitle } = useMemo(() => {
    const flat = sections.flatMap((s) => s.lessons.map((l) => ({ lesson: l, sectionTitle: s.title })));
    const idx = flat.findIndex((x) => x.lesson.id === lesson.id);
    return {
      prevLesson: idx > 0 ? flat[idx - 1]!.lesson : null,
      nextLesson: idx >= 0 && idx < flat.length - 1 ? flat[idx + 1]!.lesson : null,
      currentSectionTitle: idx >= 0 ? flat[idx]!.sectionTitle : "",
    };
  }, [sections, lesson.id]);

  const utils = trpc.useUtils();
  const awardXP = trpc.gamification.awardXP.useMutation();
  const saveWatch = trpc.progress.saveWatchProgress.useMutation();

  const markComplete = trpc.progress.markLessonComplete.useMutation({
    onSuccess: (data) => {
      utils.progress.getCourseProgress.invalidate();
      if (!data.wasAlreadyCompleted) {
        awardXP.mutate({ amount: 20 });
        setXpToast(20);
        setTimeout(() => setXpToast(null), 3000);
      }
      setLocalCompleted(true);
    },
  });

  const scheduleSaveProgress = useCallback(
    (t: number) => {
      if (isCompletedLesson || localCompleted) return;
      if (saveDebounceRef.current) clearTimeout(saveDebounceRef.current);
      saveDebounceRef.current = setTimeout(() => {
        saveWatch.mutate({ lessonId: lesson.id, watchedSecs: t });
      }, 3200);
    },
    [lesson.id, isCompletedLesson, localCompleted, saveWatch]
  );

  const quizTriggers = useMemo(
    () =>
      lesson.quizzes
        .filter((q) => q.type === "MID_VIDEO" && q.triggerAt !== null)
        .map((q) => ({ quizId: q.id, triggerAt: q.triggerAt!, title: q.title })),
    [lesson.quizzes]
  );

  const endOfLessonQuizzes = useMemo(
    () => lesson.quizzes.filter((q) => q.type === "END_OF_LESSON"),
    [lesson.quizzes]
  );

  const handleEnded = useCallback(() => {
    markComplete.mutate({ lessonId: lesson.id, watchedSecs: lesson.duration });
    if (endOfLessonQuizzes[0]) setActiveQuiz(endOfLessonQuizzes[0]);
  }, [lesson.id, lesson.duration, markComplete, endOfLessonQuizzes]);

  const handleTimeUpdate = useCallback(
    (t: number) => {
      setCurrentTime(t);
      scheduleSaveProgress(t);
    },
    [scheduleSaveProgress]
  );

  const handleQuizTrigger = useCallback(
    (quizId: string) => {
      const quiz = lesson.quizzes.find((q) => q.id === quizId);
      if (quiz) setActiveQuiz(quiz);
    },
    [lesson.quizzes]
  );

  function handleQuizPass(xpEarned: number) {
    awardXP.mutate({ amount: xpEarned });
    setXpToast(xpEarned);
    setTimeout(() => setXpToast(null), 3000);
  }

  const videoStartSeconds =
    localCompleted || isCompletedLesson
      ? 0
      : Math.min(resumeSeconds, Math.max(0, lesson.duration > 0 ? lesson.duration - 2 : 0));

  const showResumeHint = !localCompleted && !isCompletedLesson && resumeSeconds >= 8;

  function CurriculumPanel({ onNavigate }: { onNavigate?: () => void }) {
    return (
      <div className="flex flex-col flex-1 min-h-0 h-full">
        <div className="flex border-b border-slate-800 shrink-0">
          {(["curriculum", "notes"] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-3 text-sm font-medium transition-colors ${
                activeTab === tab
                  ? "text-white border-b-2 border-purple-500"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              {tab === "curriculum" ? "Curriculum" : "Mis notas"}
            </button>
          ))}
        </div>
        <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
          {activeTab === "curriculum" ? (
            <div className="overflow-y-auto flex-1 min-h-0">
              {sections.map((section) => (
                <div key={section.id}>
                  <div className="px-4 py-2.5 bg-slate-900/50 border-b border-slate-800/50">
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{section.title}</p>
                  </div>
                  {section.lessons.map((l) => {
                    const isActive = l.id === lesson.id;
                    const isDone = completedLessonIds.includes(l.id);
                    return (
                      <Link
                        key={l.id}
                        href={`/courses/${courseSlug}/learn/${l.id}`}
                        onClick={onNavigate}
                        className={`flex items-center gap-3 px-4 py-3 border-b border-slate-800/30 text-sm transition-colors ${
                          isActive
                            ? "bg-purple-600/20 border-l-2 border-l-purple-500"
                            : "hover:bg-slate-900/50"
                        }`}
                      >
                        <span
                          className={`shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${
                            isDone
                              ? "bg-green-500 text-white"
                              : isActive
                                ? "bg-purple-600 text-white"
                                : "bg-slate-800 text-slate-400"
                          }`}
                        >
                          {isDone ? "✓" : "▶"}
                        </span>
                        <span
                          className={`flex-1 leading-snug ${isActive ? "text-white font-medium" : "text-slate-300"}`}
                        >
                          {l.title}
                        </span>
                        {l.duration > 0 && (
                          <span className="text-slate-500 text-xs shrink-0">{formatTime(l.duration)}</span>
                        )}
                      </Link>
                    );
                  })}
                </div>
              ))}
            </div>
          ) : (
            <div className="flex-1 min-h-0 overflow-y-auto">
              <NotesPanel lessonId={lesson.id} currentTime={currentTime} />
            </div>
          )}
        </div>
      </div>
    );
  }

  const hasAboutContent =
    !!(lesson.description?.trim()) ||
    !!(lesson.creatorNotes?.trim()) ||
    (lesson.resources && lesson.resources.length > 0);

  return (
    <div className="flex flex-col h-screen bg-slate-950 text-white overflow-hidden">
      {xpToast !== null && (
        <div className="fixed top-20 right-4 z-[60] bg-yellow-500/20 border border-yellow-500/40 text-yellow-300 px-5 py-3 rounded-2xl font-semibold shadow-lg animate-bounce">
          ⚡ +{xpToast} XP ganados
        </div>
      )}

      <header className="shrink-0 z-40 border-b border-slate-800 bg-slate-900/95 backdrop-blur-sm">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2 px-3 py-2.5 sm:px-4 min-h-[3.25rem]">
          <Link
            href={`/courses/${courseSlug}`}
            className="flex min-w-0 max-w-[min(100%,280px)] sm:max-w-[320px] items-center gap-2 rounded-xl border border-slate-700/80 bg-slate-800/40 px-2 py-1.5 text-left transition-colors hover:border-slate-600 hover:bg-slate-800/70"
            title="Volver a la ficha del curso"
          >
            <span
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-600 bg-slate-900 text-lg leading-none text-slate-200"
              aria-hidden
            >
              ←
            </span>
            <span className="min-w-0 flex flex-col">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                Volver al curso
              </span>
              <span className="truncate text-sm font-medium text-white">{courseTitle}</span>
            </span>
          </Link>

          <span className="hidden sm:inline text-slate-600 text-xs px-0.5">·</span>
          <span
            className="hidden sm:inline text-xs text-slate-500 truncate max-w-[120px] md:max-w-[180px]"
            title={currentSectionTitle}
          >
            {currentSectionTitle}
          </span>

          <div className="flex-1 min-w-[8px]" />

          <div className="flex items-center gap-1 shrink-0">
            {prevLesson ? (
              <Link
                href={`/courses/${courseSlug}/learn/${prevLesson.id}`}
                className="text-xs sm:text-sm px-2.5 py-1.5 rounded-lg border border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
              >
                ← Anterior
              </Link>
            ) : (
              <span className="text-xs text-slate-600 px-2 py-1.5 hidden sm:inline">← Anterior</span>
            )}
            {nextLesson ? (
              <Link
                href={`/courses/${courseSlug}/learn/${nextLesson.id}`}
                className="text-xs sm:text-sm px-2.5 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-medium transition-colors"
              >
                Siguiente →
              </Link>
            ) : (
              <Link
                href={`/courses/${courseSlug}`}
                className="text-xs sm:text-sm px-2.5 py-1.5 rounded-lg border border-green-500/40 text-green-400 hover:bg-green-500/10 transition-colors"
              >
                Fin del curso ✓
              </Link>
            )}
          </div>

          <Link
            href="/courses"
            className="hidden lg:inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-300 px-1"
          >
            <span aria-hidden className="text-slate-600">
              ←
            </span>
            Explorar
          </Link>
          <Link
            href="/dashboard"
            className="hidden lg:inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-300 px-1"
          >
            <span aria-hidden className="text-slate-600">
              ←
            </span>
            Mi aprendizaje
          </Link>
          <button
            type="button"
            onClick={() => setMobileCurriculumOpen(true)}
            className="lg:hidden text-xs font-medium text-white border border-slate-600 px-3 py-1.5 rounded-lg hover:bg-slate-800"
          >
            Menú
          </button>
        </div>
      </header>

      <div className="flex flex-1 min-h-0 overflow-hidden">
        <aside className="hidden lg:flex flex-col w-80 border-r border-slate-800 shrink-0 min-h-0">
          <div className="p-4 border-b border-slate-800 shrink-0">
            <p className="text-xs text-slate-500">Progreso</p>
            <p className="text-sm font-medium text-white mt-0.5">
              Lección {lessonIndex1} de {totalLessons}
            </p>
            <p className="text-xs text-slate-500 mt-0.5">
              Módulo {sectionIndex1} de {totalSections}
            </p>
            <p className="text-xs text-slate-400 mt-2 line-clamp-2">{lesson.title}</p>
          </div>
          <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
            <CurriculumPanel />
          </div>
        </aside>

        <main className="flex-1 overflow-y-auto min-h-0">
          <div className="max-w-4xl mx-auto p-4 sm:p-6 space-y-6">
            {showResumeHint && (
              <p className="text-xs sm:text-sm text-amber-400/90 bg-amber-500/10 border border-amber-500/25 rounded-xl px-4 py-2">
                ↪ Reanudando desde aprox. {formatTime(resumeSeconds)} — el video arrancará en ese punto.
              </p>
            )}

            <div className="lg:hidden flex flex-wrap gap-2 text-xs text-slate-400">
              <span className="px-2 py-1 rounded-lg bg-slate-800 border border-slate-700">
                {lessonIndex1}/{totalLessons} lecciones
              </span>
              <span className="px-2 py-1 rounded-lg bg-slate-800 border border-slate-700">
                Módulo {sectionIndex1}/{totalSections}
              </span>
            </div>

            <div className="relative">
              <VideoPlayer
                youtubeId={lesson.youtubeId}
                lessonId={lesson.id}
                quizTriggers={quizTriggers}
                initialTime={videoStartSeconds}
                onTimeUpdate={handleTimeUpdate}
                onEnded={handleEnded}
                onQuizTrigger={handleQuizTrigger}
              />

              {activeQuiz && (
                <div className="absolute inset-0 bg-slate-950/95 rounded-xl flex items-start overflow-y-auto p-6 z-10">
                  <div className="w-full max-w-2xl mx-auto">
                    <QuizPlayer
                      quiz={activeQuiz}
                      onPass={handleQuizPass}
                      onClose={() => setActiveQuiz(null)}
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <h1 className="text-xl sm:text-2xl font-bold">{lesson.title}</h1>
                <div className="flex items-center gap-2 flex-wrap">
                  {endOfLessonQuizzes.length > 0 && !activeQuiz && (
                    <button
                      type="button"
                      onClick={() => setActiveQuiz(endOfLessonQuizzes[0]!)}
                      className="text-sm bg-purple-600/20 hover:bg-purple-600/40 text-purple-400 border border-purple-500/30 px-4 py-2 rounded-lg transition-colors"
                    >
                      📝 Hacer quiz
                    </button>
                  )}
                  {localCompleted ? (
                    <span className="text-sm text-green-400 border border-green-500/30 bg-green-600/10 px-4 py-2 rounded-lg flex items-center gap-1.5">
                      ✓ Completada
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() =>
                        markComplete.mutate({ lessonId: lesson.id, watchedSecs: currentTime })
                      }
                      disabled={markComplete.isPending}
                      className="text-sm bg-green-600/20 hover:bg-green-600/40 text-green-400 border border-green-500/30 px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
                    >
                      {markComplete.isPending ? "..." : "✓ Marcar completa"}
                    </button>
                  )}
                </div>
              </div>

              {/* Pestañas material / discusión */}
              <div className="flex border-b border-slate-800">
                <button
                  type="button"
                  onClick={() => setDetailTab("about")}
                  className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
                    detailTab === "about"
                      ? "text-white border-purple-500"
                      : "text-slate-400 border-transparent hover:text-white"
                  }`}
                >
                  Material {hasAboutContent ? "" : "(vacío)"}
                </button>
                <button
                  type="button"
                  onClick={() => setDetailTab("discussion")}
                  className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
                    detailTab === "discussion"
                      ? "text-white border-purple-500"
                      : "text-slate-400 border-transparent hover:text-white"
                  }`}
                >
                  Discusión
                </button>
              </div>

              {detailTab === "about" && (
                <div className="space-y-5 pt-1">
                  {lesson.description?.trim() && (
                    <div>
                      <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1.5">
                        Resumen
                      </h3>
                      <p className="text-slate-300 leading-relaxed">{lesson.description}</p>
                    </div>
                  )}
                  {lesson.creatorNotes?.trim() && (
                    <div>
                      <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1.5">
                        Notas del creador
                      </h3>
                      <p className="text-slate-300 leading-relaxed whitespace-pre-wrap">{lesson.creatorNotes}</p>
                    </div>
                  )}
                  {lesson.resources.length > 0 && (
                    <div>
                      <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">
                        Recursos
                      </h3>
                      <ul className="space-y-2">
                        {lesson.resources.map((r) => (
                          <li key={r.id}>
                            <a
                              href={r.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 text-sm text-purple-400 hover:text-purple-300 underline-offset-2 hover:underline"
                            >
                              <span aria-hidden>🔗</span>
                              {r.title}
                            </a>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {!hasAboutContent && (
                    <p className="text-slate-500 text-sm">El creador aún no añadió material extra en esta lección.</p>
                  )}
                </div>
              )}

              {detailTab === "discussion" && (
                <LessonCommentsPanel
                  lessonId={lesson.id}
                  currentUserId={currentUserId}
                  isCreator={currentUserId === courseCreatorId}
                />
              )}

              <p className="text-slate-600 text-xs font-mono">
                {formatTime(currentTime)} / {formatTime(lesson.duration)}
              </p>

              <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-800/80 sm:hidden">
                {prevLesson && (
                  <Link
                    href={`/courses/${courseSlug}/learn/${prevLesson.id}`}
                    className="text-sm text-slate-400 hover:text-white"
                  >
                    ← {prevLesson.title}
                  </Link>
                )}
                {nextLesson && (
                  <Link
                    href={`/courses/${courseSlug}/learn/${nextLesson.id}`}
                    className="text-sm text-purple-400 hover:text-purple-300"
                  >
                    {nextLesson.title} →
                  </Link>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>

      {mobileCurriculumOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex flex-col bg-slate-950">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800 shrink-0">
            <p className="font-semibold">Navegación</p>
            <button
              type="button"
              onClick={() => setMobileCurriculumOpen(false)}
              className="text-sm text-slate-400 hover:text-white px-3 py-1.5 rounded-lg border border-slate-700"
            >
              Cerrar
            </button>
          </div>
          <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
            <CurriculumPanel onNavigate={() => setMobileCurriculumOpen(false)} />
          </div>
          <div className="p-4 border-t border-slate-800 space-y-2 shrink-0 bg-slate-900/90">
            <Link
              href={`/courses/${courseSlug}`}
              onClick={() => setMobileCurriculumOpen(false)}
              className="block text-center text-sm py-2.5 rounded-xl border border-slate-700 text-slate-300"
            >
              Volver al curso
            </Link>
            <Link
              href="/dashboard"
              onClick={() => setMobileCurriculumOpen(false)}
              className="block text-center text-sm py-2.5 rounded-xl bg-slate-800 text-white"
            >
              Mi aprendizaje
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
