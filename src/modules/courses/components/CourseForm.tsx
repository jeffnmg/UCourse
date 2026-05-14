"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { trpc } from "@/core/trpc/client";

type Category = { id: string; name: string; icon: string | null };

type Props = {
  categories: Category[];
  courseId?: string;
  defaultValues?: {
    title?: string;
    description?: string;
    categoryId?: string;
    level?: string;
    language?: string;
    thumbnail?: string;
  };
};

const LEVELS = [
  { value: "BEGINNER", label: "Principiante" },
  { value: "INTERMEDIATE", label: "Intermedio" },
  { value: "ADVANCED", label: "Avanzado" },
];

const LANGUAGES = [
  { value: "es", label: "Español" },
  { value: "en", label: "English" },
  { value: "pt", label: "Português" },
];

export function CourseForm({ categories, courseId, defaultValues = {} }: Props) {
  const router = useRouter();
  const [form, setForm] = useState({
    title: defaultValues.title ?? "",
    description: defaultValues.description ?? "",
    categoryId: defaultValues.categoryId ?? "",
    level: defaultValues.level ?? "BEGINNER",
    language: defaultValues.language ?? "es",
    thumbnail: defaultValues.thumbnail ?? "",
  });

  function onChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  const create = trpc.courses.create.useMutation({
    onSuccess: (course) => router.push(`/studio/courses/${course.id}`),
  });

  const update = trpc.courses.update.useMutation({
    onSuccess: () => router.push("/studio"),
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const payload = {
      title: form.title,
      description: form.description,
      categoryId: form.categoryId,
      level: form.level as "BEGINNER" | "INTERMEDIATE" | "ADVANCED",
      language: form.language,
      tags: [],
      ...(form.thumbnail ? { thumbnail: form.thumbnail } : {}),
    };

    if (courseId) {
      update.mutate({ courseId, data: payload });
    } else {
      create.mutate(payload);
    }
  }

  const isPending = create.isPending || update.isPending;
  const error = create.error?.message ?? update.error?.message;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      <div className="space-y-1.5">
        <label className="block text-sm font-medium text-slate-300">
          Título del curso <span className="text-red-400">*</span>
        </label>
        <input
          name="title"
          required
          minLength={5}
          maxLength={120}
          value={form.title}
          onChange={onChange}
          placeholder="Ej: React desde cero hasta experto"
          className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
        />
      </div>

      <div className="space-y-1.5">
        <label className="block text-sm font-medium text-slate-300">
          Descripción <span className="text-red-400">*</span>
        </label>
        <textarea
          name="description"
          required
          minLength={20}
          maxLength={2000}
          rows={5}
          value={form.description}
          onChange={onChange}
          placeholder="Describe qué aprenderán los estudiantes, prerrequisitos, y a quién va dirigido..."
          className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
        />
        <p className="text-slate-500 text-xs text-right">{form.description.length}/2000</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-slate-300">
            Categoría <span className="text-red-400">*</span>
          </label>
          <select
            name="categoryId"
            required
            value={form.categoryId}
            onChange={onChange}
            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value="">Seleccionar...</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.icon} {cat.name}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-slate-300">Nivel</label>
          <select
            name="level"
            value={form.level}
            onChange={onChange}
            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            {LEVELS.map((l) => (
              <option key={l.value} value={l.value}>{l.label}</option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-slate-300">Idioma</label>
          <select
            name="language"
            value={form.language}
            onChange={onChange}
            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            {LANGUAGES.map((l) => (
              <option key={l.value} value={l.value}>{l.label}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="block text-sm font-medium text-slate-300">
          Thumbnail (URL de imagen)
        </label>
        <input
          name="thumbnail"
          type="url"
          value={form.thumbnail}
          onChange={onChange}
          placeholder="https://imagen.com/portada.jpg"
          className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
        />
      </div>

      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={isPending}
          className="bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-semibold px-8 py-3 rounded-xl transition-colors"
        >
          {isPending
            ? "Guardando..."
            : courseId
            ? "Guardar cambios"
            : "Crear curso →"}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="text-slate-400 hover:text-white border border-slate-700 px-6 py-3 rounded-xl transition-colors"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}
