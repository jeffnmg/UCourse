"use client";

import { useState } from "react";
import { trpc } from "@/core/trpc/client";

type Resource = { id: string; title: string; url: string };

type Props = {
  lessonId: string;
  initialCreatorNotes: string | null;
  initialDescription: string | null;
  resources: Resource[];
};

export function LessonStudioMeta({
  lessonId,
  initialCreatorNotes,
  initialDescription,
  resources: initialResources,
}: Props) {
  const [creatorNotes, setCreatorNotes] = useState(initialCreatorNotes ?? "");
  const [description, setDescription] = useState(initialDescription ?? "");
  const [resources, setResources] = useState(initialResources);
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [saved, setSaved] = useState(false);

  const utils = trpc.useUtils();

  const update = trpc.lessons.updateLessonMeta.useMutation({
    onSuccess: () => {
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
      utils.lessons.getForLearning.invalidate({ lessonId });
    },
  });

  const addRes = trpc.lessons.addLessonResource.useMutation({
    onSuccess: (r) => {
      setResources((p) => [...p, { id: r.id, title: r.title, url: r.url }]);
      setTitle("");
      setUrl("");
    },
  });

  const delRes = trpc.lessons.deleteLessonResource.useMutation({
    onSuccess: (_, input) => {
      setResources((p) => p.filter((x) => x.id !== input.resourceId));
    },
  });

  return (
    <div className="space-y-8">
      <section className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
        <h2 className="text-lg font-semibold">Texto para el estudiante</h2>
        <p className="text-slate-500 text-sm">
          Resumen corto (ficha de la lección) y notas ampliadas (material, enlaces útiles) visibles en la vista de
          aprendizaje.
        </p>
        <div className="space-y-1.5">
          <label className="text-sm text-slate-400">Resumen / descripción</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            maxLength={1000}
            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white resize-none focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm text-slate-400">Notas del creador (material de apoyo)</label>
          <textarea
            value={creatorNotes}
            onChange={(e) => setCreatorNotes(e.target.value)}
            rows={10}
            maxLength={20000}
            placeholder="Conceptos clave, enlaces recomendados, ejercicios opcionales…"
            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 resize-y min-h-[160px] focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
          <p className="text-xs text-slate-600 text-right">{creatorNotes.length}/20000</p>
        </div>
        <button
          type="button"
          disabled={update.isPending}
          onClick={() =>
            update.mutate({
              lessonId,
              description: description.trim() || null,
              creatorNotes: creatorNotes.trim() || null,
            })
          }
          className="bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors"
        >
          {update.isPending ? "Guardando…" : saved ? "Guardado ✓" : "Guardar texto"}
        </button>
        {update.error && <p className="text-red-400 text-sm">{update.error.message}</p>}
      </section>

      <section className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
        <h2 className="text-lg font-semibold">Recursos (enlaces)</h2>
        <p className="text-slate-500 text-sm">
          PDFs en la nube, repos, documentación. El estudiante los ve como lista descargable / enlaces.
        </p>
        <ul className="space-y-2">
          {resources.length === 0 && (
            <li className="text-slate-500 text-sm">Aún no hay recursos.</li>
          )}
          {resources.map((r) => (
            <li
              key={r.id}
              className="flex items-center justify-between gap-3 bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-2"
            >
              <div className="min-w-0">
                <p className="font-medium text-sm truncate">{r.title}</p>
                <p className="text-xs text-slate-500 truncate">{r.url}</p>
              </div>
              <button
                type="button"
                onClick={() => delRes.mutate({ resourceId: r.id })}
                disabled={delRes.isPending}
                className="text-xs text-red-400 hover:text-red-300 shrink-0"
              >
                Quitar
              </button>
            </li>
          ))}
        </ul>
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Título (ej. Cheat sheet PDF)"
            className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://…"
            className="flex-[2] bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
          <button
            type="button"
            disabled={addRes.isPending || !title.trim() || !url.trim()}
            onClick={() => addRes.mutate({ lessonId, title: title.trim(), url: url.trim() })}
            className="bg-slate-700 hover:bg-slate-600 disabled:opacity-50 text-white text-sm font-medium px-5 py-2.5 rounded-xl transition-colors"
          >
            Añadir
          </button>
        </div>
        {addRes.error && <p className="text-red-400 text-sm">{addRes.error.message}</p>}
      </section>
    </div>
  );
}
