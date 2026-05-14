"use client";

import { useState } from "react";
import { trpc } from "@/core/trpc/client";

type Item = {
  id: string;
  body: string;
  createdAt: Date;
  user: { id: string; name: string; username: string; avatar: string | null };
};

type Props = {
  lessonId: string;
  currentUserId: string;
  isCreator: boolean;
};

export function LessonCommentsPanel({ lessonId, currentUserId, isCreator }: Props) {
  const [draft, setDraft] = useState("");
  const utils = trpc.useUtils();

  const { data: list = [], isLoading } = trpc.comments.byLesson.useQuery({ lessonId });

  const add = trpc.comments.add.useMutation({
    onSuccess: () => {
      setDraft("");
      utils.comments.byLesson.invalidate({ lessonId });
    },
  });

  const remove = trpc.comments.delete.useMutation({
    onSuccess: () => utils.comments.byLesson.invalidate({ lessonId }),
  });

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-slate-300">Discusión</h3>
      <form
        className="space-y-2"
        onSubmit={(e) => {
          e.preventDefault();
          const t = draft.trim();
          if (!t || add.isPending) return;
          add.mutate({ lessonId, body: t });
        }}
      >
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Pregunta o comentario sobre esta lección…"
          rows={3}
          maxLength={2000}
          className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 resize-none focus:outline-none focus:ring-2 focus:ring-purple-500"
        />
        <div className="flex justify-between items-center gap-2">
          <span className="text-xs text-slate-600">{draft.length}/2000</span>
          <button
            type="submit"
            disabled={add.isPending || draft.trim().length < 2}
            className="text-sm font-medium bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white px-4 py-2 rounded-lg transition-colors"
          >
            {add.isPending ? "…" : "Publicar"}
          </button>
        </div>
      </form>

      {add.error && <p className="text-red-400 text-xs">{add.error.message}</p>}

      {isLoading && <p className="text-slate-500 text-sm">Cargando comentarios…</p>}

      {!isLoading && list.length === 0 && (
        <p className="text-slate-500 text-sm">Sé el primero en comentar.</p>
      )}

      <ul className="space-y-3">
        {(list as Item[]).map((c) => (
          <li
            key={c.id}
            className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 text-sm"
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <span className="font-medium text-white">{c.user.name}</span>
                <span className="text-slate-500 text-xs ml-2">
                  @{c.user.username}
                </span>
                <p className="text-slate-600 text-xs mt-0.5">
                  {new Date(c.createdAt).toLocaleString("es-ES", {
                    dateStyle: "short",
                    timeStyle: "short",
                  })}
                </p>
              </div>
              {(c.user.id === currentUserId || isCreator) && (
                <button
                  type="button"
                  onClick={() => remove.mutate({ commentId: c.id })}
                  disabled={remove.isPending}
                  className="text-xs text-slate-500 hover:text-red-400 shrink-0"
                >
                  Eliminar
                </button>
              )}
            </div>
            <p className="text-slate-300 mt-2 whitespace-pre-wrap leading-relaxed">{c.body}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
