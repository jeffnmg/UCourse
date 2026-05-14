"use client";

import { useState } from "react";
import { trpc } from "@/core/trpc/client";

type Option = { id: string; text: string; isCorrect: boolean; position: number };
type Question = { id: string; text: string; type: string; points: number; options: Option[] };
type Quiz = {
  id: string;
  title: string;
  type: string;
  passingScore: number;
  maxAttempts: number;
  questions: Question[];
};

type Props = {
  quiz: Quiz;
  onPass?: (xpEarned: number) => void;
  onClose?: () => void;
};

type AnswerMap = Record<string, string>; // questionId -> optionId

export function QuizPlayer({ quiz, onPass, onClose }: Props) {
  const [answers, setAnswers] = useState<AnswerMap>({});
  const [result, setResult] = useState<{
    score: number;
    passed: boolean;
    xpEarned: number;
    correctMap: Record<string, boolean>;
  } | null>(null);
  const [currentQ, setCurrentQ] = useState(0);

  const submit = trpc.quizzes.submit.useMutation({
    onSuccess: (data) => {
      // Construir mapa de correctas para mostrar feedback
      const correctMap: Record<string, boolean> = {};
      for (const q of quiz.questions) {
        const selectedId = answers[q.id];
        const correct = q.options.find((o) => o.isCorrect);
        correctMap[q.id] = selectedId === correct?.id;
      }
      setResult({ score: data.score, passed: data.passed, xpEarned: data.xpEarned, correctMap });
      if (data.passed) onPass?.(data.xpEarned);
    },
  });

  const question = quiz.questions[currentQ];
  const total = quiz.questions.length;
  const allAnswered = quiz.questions.every((q) => answers[q.id]);

  function selectOption(questionId: string, optionId: string) {
    setAnswers((prev) => ({ ...prev, [questionId]: optionId }));
  }

  function handleSubmit() {
    const answersArr = Object.entries(answers).map(([questionId, optionId]) => ({
      questionId,
      optionId,
    }));
    submit.mutate({ quizId: quiz.id, answers: answersArr });
  }

  // ─── Resultado ───────────────────────────────────────────────
  if (result) {
    return (
      <div className="space-y-6">
        {/* Header resultado */}
        <div className={`rounded-2xl p-6 text-center ${result.passed ? "bg-green-500/10 border border-green-500/30" : "bg-red-500/10 border border-red-500/30"}`}>
          <div className="text-5xl mb-3">{result.passed ? "🎉" : "😅"}</div>
          <h3 className="text-2xl font-bold text-white">
            {result.passed ? "¡Aprobaste!" : "No aprobaste esta vez"}
          </h3>
          <p className={`text-3xl font-bold mt-2 ${result.passed ? "text-green-400" : "text-red-400"}`}>
            {Math.round(result.score)}%
          </p>
          <p className="text-slate-400 text-sm mt-1">
            Mínimo requerido: {quiz.passingScore}%
          </p>
          {result.passed && (
            <div className="inline-flex items-center gap-2 mt-3 bg-yellow-500/20 text-yellow-400 px-4 py-1.5 rounded-full text-sm font-medium">
              ⚡ +{result.xpEarned} XP ganados
            </div>
          )}
        </div>

        {/* Revisión de respuestas */}
        <div className="space-y-4">
          <h4 className="font-semibold text-slate-300">Revisión de respuestas</h4>
          {quiz.questions.map((q) => {
            const selectedId = answers[q.id];
            const isCorrect = result.correctMap[q.id];
            const correctOption = q.options.find((o) => o.isCorrect);
            return (
              <div
                key={q.id}
                className={`rounded-xl p-4 border ${isCorrect ? "bg-green-500/5 border-green-500/20" : "bg-red-500/5 border-red-500/20"}`}
              >
                <div className="flex items-start gap-2 mb-3">
                  <span className={isCorrect ? "text-green-400" : "text-red-400"}>
                    {isCorrect ? "✓" : "✗"}
                  </span>
                  <p className="text-white text-sm font-medium">{q.text}</p>
                </div>
                <div className="space-y-1.5 pl-5">
                  {q.options.map((opt) => {
                    const isSelected = opt.id === selectedId;
                    const isCorrectOpt = opt.isCorrect;
                    return (
                      <div
                        key={opt.id}
                        className={`text-sm px-3 py-1.5 rounded-lg ${
                          isCorrectOpt
                            ? "bg-green-500/20 text-green-300"
                            : isSelected
                            ? "bg-red-500/20 text-red-300"
                            : "text-slate-500"
                        }`}
                      >
                        {isCorrectOpt ? "✓ " : isSelected ? "✗ " : ""}{opt.text}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex gap-3">
          {!result.passed && (
            <button
              onClick={() => { setResult(null); setAnswers({}); setCurrentQ(0); }}
              className="flex-1 bg-purple-600 hover:bg-purple-500 text-white font-semibold py-3 rounded-xl transition-colors"
            >
              Intentar de nuevo
            </button>
          )}
          <button
            onClick={onClose}
            className="flex-1 bg-slate-800 hover:bg-slate-700 text-white font-semibold py-3 rounded-xl transition-colors"
          >
            {result.passed ? "Continuar →" : "Cerrar"}
          </button>
        </div>
      </div>
    );
  }

  // ─── Quiz en curso ────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Progreso */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm text-slate-400">
          <span>{quiz.title}</span>
          <span>Pregunta {currentQ + 1} de {total}</span>
        </div>
        <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-purple-500 rounded-full transition-all duration-300"
            style={{ width: `${((currentQ + 1) / total) * 100}%` }}
          />
        </div>
      </div>

      {/* Pregunta actual */}
      {question && (
        <div className="space-y-4">
          <p className="text-lg font-semibold text-white leading-snug">{question.text}</p>
          <div className="space-y-2.5">
            {question.options.map((opt) => {
              const selected = answers[question.id] === opt.id;
              return (
                <button
                  key={opt.id}
                  onClick={() => selectOption(question.id, opt.id)}
                  className={`w-full text-left px-5 py-3.5 rounded-xl border transition-all text-sm ${
                    selected
                      ? "bg-purple-600/30 border-purple-500 text-white"
                      : "bg-slate-800/50 border-slate-700 text-slate-300 hover:border-slate-500 hover:bg-slate-800"
                  }`}
                >
                  <span className={`mr-3 inline-flex w-6 h-6 rounded-full border items-center justify-center text-xs ${
                    selected ? "bg-purple-500 border-purple-500 text-white" : "border-slate-600"
                  }`}>
                    {String.fromCharCode(65 + question.options.indexOf(opt))}
                  </span>
                  {opt.text}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Navegación */}
      <div className="flex items-center justify-between pt-2">
        <button
          onClick={() => setCurrentQ((p) => Math.max(0, p - 1))}
          disabled={currentQ === 0}
          className="text-slate-400 hover:text-white disabled:opacity-30 text-sm px-4 py-2 rounded-lg border border-slate-700 transition-colors"
        >
          ← Anterior
        </button>

        {currentQ < total - 1 ? (
          <button
            onClick={() => setCurrentQ((p) => p + 1)}
            disabled={!answers[question?.id ?? ""]}
            className="bg-purple-600 hover:bg-purple-500 disabled:opacity-40 text-white text-sm font-medium px-6 py-2 rounded-lg transition-colors"
          >
            Siguiente →
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={!allAnswered || submit.isPending}
            className="bg-green-600 hover:bg-green-500 disabled:opacity-40 text-white text-sm font-semibold px-6 py-2 rounded-lg transition-colors"
          >
            {submit.isPending ? "Enviando..." : "Enviar respuestas ✓"}
          </button>
        )}
      </div>

      {submit.error && (
        <p className="text-red-400 text-sm text-center">{submit.error.message}</p>
      )}
    </div>
  );
}
