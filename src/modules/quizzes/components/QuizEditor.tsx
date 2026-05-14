"use client";

import { useState } from "react";
import { trpc } from "@/core/trpc/client";

type QuizType = "MID_VIDEO" | "END_OF_LESSON" | "FINAL_EXAM";

type OptionDraft = { text: string; isCorrect: boolean };
type QuestionDraft = {
  text: string;
  type: "MULTIPLE_CHOICE" | "TRUE_FALSE";
  points: number;
  options: OptionDraft[];
};

export type QuizInitialValues = {
  title: string;
  type: QuizType;
  triggerAt: number | null;
  passingScore: number;
  maxAttempts: number;
  questions: Array<{
    text: string;
    type: "MULTIPLE_CHOICE" | "TRUE_FALSE";
    points: number;
    options: Array<{ text: string; isCorrect: boolean }>;
  }>;
};

type Props = {
  lessonId?: string;
  courseId?: string;
  defaultType?: QuizType;
  /** Si se indica, se llama a `quizzes.update` en lugar de `create`. */
  editingQuizId?: string;
  initialQuiz?: QuizInitialValues;
  onSuccess?: () => void;
  onCancel?: () => void;
};

const QUIZ_TYPE_LABELS: Record<QuizType, string> = {
  MID_VIDEO: "Durante el video (pausa automática)",
  END_OF_LESSON: "Al finalizar la lección",
  FINAL_EXAM: "Examen final del curso",
};

function blankQuestion(): QuestionDraft {
  return {
    text: "",
    type: "MULTIPLE_CHOICE",
    points: 1,
    options: [
      { text: "", isCorrect: false },
      { text: "", isCorrect: false },
      { text: "", isCorrect: false },
      { text: "", isCorrect: false },
    ],
  };
}

/** Normaliza opciones guardadas al formato del editor (4 ranuras). */
function toQuestionDrafts(
  initial: QuizInitialValues["questions"] | undefined
): QuestionDraft[] {
  if (!initial?.length) return [blankQuestion()];
  return initial.map((q) => {
    const opts = [...q.options];
    while (opts.length < 4) opts.push({ text: "", isCorrect: false });
    return {
      text: q.text,
      type: q.type,
      points: q.points,
      options: opts.slice(0, 4).map((o) => ({
        text: o.text,
        isCorrect: o.isCorrect,
      })),
    };
  });
}

export function QuizEditor({
  lessonId,
  courseId,
  defaultType = "END_OF_LESSON",
  editingQuizId,
  initialQuiz,
  onSuccess,
  onCancel,
}: Props) {
  const [title, setTitle] = useState(initialQuiz?.title ?? "");
  const [type, setType] = useState<QuizType>(initialQuiz?.type ?? defaultType);
  const [triggerAt, setTriggerAt] = useState(
    initialQuiz?.triggerAt != null ? String(initialQuiz.triggerAt) : ""
  );
  const [passingScore, setPassingScore] = useState(initialQuiz?.passingScore ?? 70);
  const [maxAttempts, setMaxAttempts] = useState(initialQuiz?.maxAttempts ?? 3);
  const [questions, setQuestions] = useState<QuestionDraft[]>(() =>
    toQuestionDrafts(initialQuiz?.questions)
  );

  const create = trpc.quizzes.create.useMutation({ onSuccess });
  const update = trpc.quizzes.update.useMutation({ onSuccess });

  function setQuestion(i: number, update: Partial<QuestionDraft>) {
    setQuestions((prev) => prev.map((q, idx) => (idx === i ? { ...q, ...update } : q)));
  }

  function setOption(qi: number, oi: number, update: Partial<OptionDraft>) {
    setQuestions((prev) =>
      prev.map((q, idx) => {
        if (idx !== qi) return q;
        // Si marcamos como correcta, desmarcar las otras (para multiple choice)
        const options = q.options.map((o, oIdx) => {
          if (oIdx === oi) return { ...o, ...update };
          if (update.isCorrect && q.type === "MULTIPLE_CHOICE") return { ...o, isCorrect: false };
          return o;
        });
        return { ...q, options };
      })
    );
  }

  function addQuestion() {
    setQuestions((prev) => [...prev, blankQuestion()]);
  }

  function removeQuestion(i: number) {
    setQuestions((prev) => prev.filter((_, idx) => idx !== i));
  }

  const mapQuestionsForApi = () =>
    questions.map((q) => ({
      text: q.text,
      type: q.type,
      points: q.points,
      options: q.options.filter((o) => o.text.trim()),
    }));

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const payload = {
      title,
      type,
      triggerAt: type === "MID_VIDEO" && triggerAt ? parseInt(triggerAt, 10) : undefined,
      passingScore,
      maxAttempts,
      questions: mapQuestionsForApi(),
    };

    if (editingQuizId) {
      update.mutate({ quizId: editingQuizId, ...payload });
      return;
    }

    create.mutate({
      lessonId,
      courseId,
      ...payload,
    });
  }

  const pending = create.isPending || update.isPending;
  const err = create.error ?? update.error;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Cabecera */}
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-slate-300">Título del quiz</label>
          <input
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ej: Comprensión del módulo 1"
            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-slate-300">Tipo</label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value as QuizType)}
            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            {(Object.entries(QUIZ_TYPE_LABELS) as [QuizType, string][]).map(([v, l]) => (
              <option key={v} value={v}>{l}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        {type === "MID_VIDEO" && (
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-300">Pausar en (segundos)</label>
            <input
              type="number"
              required
              min={1}
              value={triggerAt}
              onChange={(e) => setTriggerAt(e.target.value)}
              placeholder="Ej: 120 (= 2 min)"
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
        )}
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-slate-300">Nota mínima para aprobar (%)</label>
          <input
            type="number"
            min={1}
            max={100}
            value={passingScore}
            onChange={(e) => setPassingScore(Number(e.target.value))}
            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>
        <div className="space-y-1.5 sm:col-span-2">
          <label className="text-sm font-medium text-slate-300">Intentos máximos por estudiante</label>
          <input
            type="number"
            min={1}
            max={10}
            value={maxAttempts}
            onChange={(e) => setMaxAttempts(Number(e.target.value))}
            className="w-full max-w-xs bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>
      </div>

      {/* Preguntas */}
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <h4 className="font-semibold text-slate-300">
            Preguntas <span className="text-purple-400">({questions.length})</span>
          </h4>
          <button
            type="button"
            onClick={addQuestion}
            className="text-sm text-purple-400 hover:text-purple-300 transition-colors"
          >
            + Añadir pregunta
          </button>
        </div>

        {questions.map((q, qi) => (
          <div key={qi} className="bg-slate-800/50 border border-slate-700 rounded-2xl p-5 space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 space-y-1.5">
                <label className="text-xs text-slate-500">Pregunta {qi + 1}</label>
                <textarea
                  required
                  rows={2}
                  value={q.text}
                  onChange={(e) => setQuestion(qi, { text: e.target.value })}
                  placeholder="Escribe la pregunta..."
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              {questions.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeQuestion(qi)}
                  className="text-slate-600 hover:text-red-400 text-sm mt-6 transition-colors"
                >
                  ✕
                </button>
              )}
            </div>

            <div className="space-y-2">
              <p className="text-xs text-slate-500">Opciones — marca la correcta</p>
              {q.options.map((opt, oi) => (
                <div key={oi} className="flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => setOption(qi, oi, { isCorrect: true })}
                    className={`shrink-0 w-5 h-5 rounded-full border-2 transition-colors ${
                      opt.isCorrect
                        ? "bg-green-500 border-green-500"
                        : "border-slate-600 hover:border-slate-400"
                    }`}
                  />
                  <input
                    required
                    value={opt.text}
                    onChange={(e) => setOption(qi, oi, { text: e.target.value })}
                    placeholder={`Opción ${String.fromCharCode(65 + oi)}`}
                    className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-1 focus:ring-purple-500"
                  />
                </div>
              ))}
              <p className="text-xs text-slate-600">El círculo verde = respuesta correcta</p>
            </div>
          </div>
        ))}
      </div>

      {err && <p className="text-red-400 text-sm">{err.message}</p>}

      <div className="flex gap-3 flex-wrap">
        <button
          type="submit"
          disabled={pending}
          className="bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-semibold px-8 py-3 rounded-xl transition-colors"
        >
          {pending ? "Guardando..." : editingQuizId ? "Actualizar quiz" : "Guardar quiz"}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="text-slate-400 hover:text-white border border-slate-700 px-6 py-3 rounded-xl transition-colors"
          >
            Cancelar
          </button>
        )}
      </div>
    </form>
  );
}
