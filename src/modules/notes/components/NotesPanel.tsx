"use client";

import { useState } from "react";
import { trpc } from "@/core/trpc/client";

type Props = { lessonId: string; currentTime: number };

function formatTime(s: number) {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

export function NotesPanel({ lessonId, currentTime }: Props) {
  const [content, setContent] = useState("");
  const utils = trpc.useUtils();

  const { data: notes = [] } = trpc.notes.list.useQuery({ lessonId });

  const create = trpc.notes.create.useMutation({
    onSuccess: () => {
      setContent("");
      utils.notes.list.invalidate({ lessonId });
    },
  });

  const deleteNote = trpc.notes.delete.useMutation({
    onSuccess: () => utils.notes.list.invalidate({ lessonId }),
  });

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-slate-800">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={`Nota en ${formatTime(currentTime)}...`}
          rows={3}
          className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-white placeholder-slate-500 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-purple-500"
        />
        <button
          onClick={() => {
            if (!content.trim()) return;
            create.mutate({ lessonId, content: content.trim(), timestamp: currentTime });
          }}
          disabled={create.isPending || !content.trim()}
          className="mt-2 w-full bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white text-sm font-medium py-2 rounded-lg transition-colors"
        >
          {create.isPending ? "Guardando..." : `Guardar nota (${formatTime(currentTime)})`}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {notes.length === 0 ? (
          <p className="text-slate-500 text-sm text-center py-6">
            Tus notas aparecerán aquí
          </p>
        ) : (
          notes.map((note) => (
            <div key={note.id} className="bg-slate-800 rounded-xl p-3 group">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-purple-400 text-xs font-mono font-semibold">
                  {formatTime(note.timestamp)}
                </span>
                <button
                  onClick={() => deleteNote.mutate({ noteId: note.id })}
                  className="text-slate-600 hover:text-red-400 text-xs opacity-0 group-hover:opacity-100 transition-all"
                >
                  ✕
                </button>
              </div>
              <p className="text-slate-300 text-sm whitespace-pre-wrap">{note.content}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
