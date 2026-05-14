"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { trpc } from "@/core/trpc/client";
import { QuizEditor, type QuizInitialValues } from "./QuizEditor";
import { QuizEditorWrapper } from "./QuizEditorWrapper";

export type LessonQuizListItem = {
  id: string;
  title: string;
  type: string;
  triggerAt: number | null;
  passingScore: number;
  maxAttempts: number;
  questions: Array<{
    text: string;
    type: string;
    points: number;
    options: Array<{ text: string; isCorrect: boolean }>;
  }>;
};

function toInitial(quiz: LessonQuizListItem): QuizInitialValues {
  return {
    title: quiz.title,
    type: quiz.type as QuizInitialValues["type"],
    triggerAt: quiz.triggerAt,
    passingScore: quiz.passingScore,
    maxAttempts: quiz.maxAttempts,
    questions: quiz.questions.map((q) => ({
      text: q.text,
      type: q.type as "MULTIPLE_CHOICE" | "TRUE_FALSE",
      points: q.points,
      options: q.options.map((o) => ({ text: o.text, isCorrect: o.isCorrect })),
    })),
  };
}

function typeLabel(q: LessonQuizListItem) {
  if (q.type === "MID_VIDEO" && q.triggerAt !== null) {
    return `Pausa en ${Math.floor(q.triggerAt / 60)}:${String(q.triggerAt % 60).padStart(2, "0")}`;
  }
  if (q.type === "END_OF_LESSON") return "Al finalizar lección";
  return "Examen final";
}

export function LessonQuizzesManage({
  lessonId,
  courseId,
  quizzes,
}: {
  lessonId: string;
  courseId: string;
  quizzes: LessonQuizListItem[];
}) {
  const router = useRouter();
  const [editing, setEditing] = useState<LessonQuizListItem | null>(null);

  const del = trpc.quizzes.delete.useMutation({
    onSuccess: () => router.refresh(),
  });

  function confirmDelete(quiz: LessonQuizListItem) {
    if (
      typeof window !== "undefined" &&
      !window.confirm(
        `¿Eliminar el quiz "${quiz.title}"? Esta acción no se puede deshacer y borrará los intentos de los estudiantes.`
      )
    ) {
      return;
    }
    del.mutate({ quizId: quiz.id });
  }

  if (editing) {
    return (
      <div className="space-y-4">
        <button
          type="button"
          onClick={() => setEditing(null)}
          className="text-sm text-purple-400 hover:text-purple-300 font-medium"
        >
          ← Volver a la lista de quices
        </button>
        <QuizEditor
          lessonId={lessonId}
          editingQuizId={editing.id}
          initialQuiz={toInitial(editing)}
          onSuccess={() => {
            setEditing(null);
            router.refresh();
          }}
          onCancel={() => setEditing(null)}
        />
      </div>
    );
  }

  return (
    <div className="space-y-10">
      {quizzes.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-4">Quices de esta lección</h2>
          <div className="space-y-3">
            {quizzes.map((quiz) => (
              <div
                key={quiz.id}
                className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-wrap items-center justify-between gap-4"
              >
                <div className="min-w-0">
                  <p className="font-medium">{quiz.title}</p>
                  <p className="text-slate-400 text-sm mt-0.5">
                    {typeLabel(quiz)} · {quiz.questions.length} preguntas · Mínimo {quiz.passingScore}% ·{" "}
                    {quiz.maxAttempts} intentos
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => setEditing(quiz)}
                    className="text-sm font-medium text-white bg-purple-600 hover:bg-purple-500 px-4 py-2 rounded-lg transition-colors"
                  >
                    Editar
                  </button>
                  <button
                    type="button"
                    onClick={() => confirmDelete(quiz)}
                    disabled={del.isPending}
                    className="text-sm font-medium text-red-400 hover:text-red-300 border border-red-500/30 hover:bg-red-500/10 px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div>
        <h2 className="text-lg font-semibold mb-4">
          {quizzes.length > 0 ? "Añadir otro quiz" : "Crear quiz para esta lección"}
        </h2>
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <QuizEditorWrapper lessonId={lessonId} courseId={courseId} />
        </div>
      </div>
    </div>
  );
}
