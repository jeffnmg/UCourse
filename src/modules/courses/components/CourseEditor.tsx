"use client";

import { useState } from "react";
import Link from "next/link";
import { trpc } from "@/core/trpc/client";

type Lesson = { id: string; title: string; youtubeId: string; duration: number; isFree: boolean; position: number };
type Section = { id: string; title: string; position: number; lessons: Lesson[] };
type Course = { id: string; title: string; isPublished: boolean; sections: Section[] };

export function CourseEditor({ course }: { course: Course }) {
  const courseId = course.id;
  const [newSectionTitle, setNewSectionTitle] = useState("");
  const [addingSection, setAddingSection] = useState(false);
  const [expandedSection, setExpandedSection] = useState<string | null>(
    course.sections[0]?.id ?? null
  );
  const [newLesson, setNewLesson] = useState<{
    sectionId: string;
    title: string;
    youtubeUrl: string;
    duration: string;
    isFree: boolean;
    description: string;
    creatorNotes: string;
  } | null>(null);

  const utils = trpc.useUtils();

  const createSection = trpc.lessons.createSection.useMutation({
    onSuccess: () => {
      setNewSectionTitle("");
      setAddingSection(false);
      utils.courses.bySlug.invalidate();
    },
  });

  const createLesson = trpc.lessons.createLesson.useMutation({
    onSuccess: () => {
      setNewLesson(null);
      utils.courses.bySlug.invalidate();
    },
  });

  const togglePublish = trpc.courses.togglePublish.useMutation({
    onSuccess: () => utils.courses.myCreatedCourses.invalidate(),
  });

  function handleAddLesson(sectionId: string) {
    setNewLesson({
      sectionId,
      title: "",
      youtubeUrl: "",
      duration: "",
      isFree: false,
      description: "",
      creatorNotes: "",
    });
    setExpandedSection(sectionId);
  }

  function handleSubmitLesson(e: React.FormEvent) {
    e.preventDefault();
    if (!newLesson) return;
    createLesson.mutate({
      sectionId: newLesson.sectionId,
      title: newLesson.title,
      youtubeUrl: newLesson.youtubeUrl,
      duration: newLesson.duration ? parseInt(newLesson.duration, 10) : 0,
      isFree: newLesson.isFree,
      description: newLesson.description.trim() || undefined,
      creatorNotes: newLesson.creatorNotes.trim() || undefined,
    });
  }

  return (
    <div className="space-y-6">
      {/* Publish toggle */}
      <div className="flex items-center justify-between bg-slate-900 border border-slate-800 rounded-2xl p-4">
        <div>
          <p className="font-semibold">Estado del curso</p>
          <p className="text-slate-400 text-sm">
            {course.isPublished
              ? "Publicado — visible para todos los estudiantes"
              : "Borrador — solo tú puedes verlo"}
          </p>
        </div>
        <button
          onClick={() => togglePublish.mutate({ courseId: course.id })}
          disabled={togglePublish.isPending}
          className={`px-5 py-2.5 rounded-xl font-medium text-sm transition-colors ${
            course.isPublished
              ? "bg-slate-700 hover:bg-slate-600 text-white"
              : "bg-green-600 hover:bg-green-500 text-white"
          }`}
        >
          {togglePublish.isPending
            ? "..."
            : course.isPublished
            ? "Despublicar"
            : "Publicar curso"}
        </button>
      </div>

      {/* Secciones */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Curriculum</h3>
          <button
            onClick={() => setAddingSection(true)}
            className="text-sm text-purple-400 hover:text-purple-300 transition-colors"
          >
            + Añadir sección
          </button>
        </div>

        {/* Nueva sección */}
        {addingSection && (
          <div className="bg-slate-900 border border-purple-500/40 rounded-xl p-4 mb-3 flex gap-3">
            <input
              autoFocus
              value={newSectionTitle}
              onChange={(e) => setNewSectionTitle(e.target.value)}
              placeholder="Nombre de la sección"
              className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  if (newSectionTitle.trim()) {
                    createSection.mutate({ courseId: course.id, title: newSectionTitle.trim() });
                  }
                }
                if (e.key === "Escape") setAddingSection(false);
              }}
            />
            <button
              onClick={() => {
                if (newSectionTitle.trim()) {
                  createSection.mutate({ courseId: course.id, title: newSectionTitle.trim() });
                }
              }}
              disabled={createSection.isPending}
              className="bg-purple-600 hover:bg-purple-500 text-white text-sm px-4 py-2 rounded-lg"
            >
              {createSection.isPending ? "..." : "Crear"}
            </button>
            <button
              onClick={() => setAddingSection(false)}
              className="text-slate-400 hover:text-white text-sm px-3"
            >
              ✕
            </button>
          </div>
        )}

        {/* Lista de secciones */}
        {course.sections.length === 0 && !addingSection && (
          <div className="bg-slate-900 border border-slate-800 border-dashed rounded-xl p-8 text-center">
            <p className="text-slate-400">Aún no hay secciones. Añade la primera para organizar tus lecciones.</p>
          </div>
        )}

        <div className="space-y-3">
          {course.sections.map((section) => (
            <div key={section.id} className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
              <button
                onClick={() => setExpandedSection(expandedSection === section.id ? null : section.id)}
                className="w-full flex items-center justify-between px-5 py-4 hover:bg-slate-800/50 transition-colors text-left"
              >
                <div className="flex items-center gap-3">
                  <span className="text-slate-400 text-sm">§{section.position}</span>
                  <span className="font-medium">{section.title}</span>
                  <span className="text-slate-500 text-sm">{section.lessons.length} lecciones</span>
                </div>
                <span className="text-slate-500 text-sm">
                  {expandedSection === section.id ? "▲" : "▼"}
                </span>
              </button>

              {expandedSection === section.id && (
                <div className="border-t border-slate-800">
                  {section.lessons.map((lesson) => (
                    <div
                      key={lesson.id}
                      className="flex items-center gap-3 px-5 py-3 border-b border-slate-800/50 hover:bg-slate-800/30 group"
                    >
                      <span className="text-slate-500 text-xs w-5 shrink-0">{lesson.position}</span>
                      <span className="text-slate-300 text-sm flex-1 min-w-0 truncate">{lesson.title}</span>
                      {lesson.isFree && (
                        <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full shrink-0">
                          Gratis
                        </span>
                      )}
                      <a
                        href={`https://youtube.com/watch?v=${lesson.youtubeId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        title="Ver en YouTube"
                        className="text-slate-600 hover:text-red-400 text-sm transition-colors shrink-0"
                      >
                        ▶
                      </a>
                      <Link
                        href={`/studio/courses/${courseId}/lessons/${lesson.id}`}
                        className="text-xs font-medium text-slate-500 hover:text-purple-400 border border-slate-700 hover:border-purple-500/50 px-3 py-1 rounded-lg transition-colors shrink-0"
                      >
                        Editar / Quices
                      </Link>
                    </div>
                  ))}

                  {/* Formulario nueva lección */}
                  {newLesson?.sectionId === section.id ? (
                    <form onSubmit={handleSubmitLesson} className="p-4 space-y-3 bg-slate-800/30">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <input
                          autoFocus
                          required
                          placeholder="Título de la lección"
                          value={newLesson.title}
                          onChange={(e) => setNewLesson((p) => p && { ...p, title: e.target.value })}
                          className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                        <input
                          required
                          placeholder="URL de YouTube (ej: https://youtu.be/xxxxx)"
                          value={newLesson.youtubeUrl}
                          onChange={(e) => setNewLesson((p) => p && { ...p, youtubeUrl: e.target.value })}
                          className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                      </div>
                      <textarea
                        placeholder="Descripción corta (opcional, visible para el estudiante)"
                        value={newLesson.description}
                        onChange={(e) => setNewLesson((p) => p && { ...p, description: e.target.value })}
                        rows={2}
                        maxLength={1000}
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                      />
                      <textarea
                        placeholder="Notas del creador / material de apoyo (opcional)"
                        value={newLesson.creatorNotes}
                        onChange={(e) => setNewLesson((p) => p && { ...p, creatorNotes: e.target.value })}
                        rows={4}
                        maxLength={20000}
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 resize-y min-h-[80px]"
                      />
                      <div className="flex items-center gap-3">
                        <input
                          type="number"
                          placeholder="Duración (segundos)"
                          value={newLesson.duration}
                          onChange={(e) => setNewLesson((p) => p && { ...p, duration: e.target.value })}
                          className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 w-44"
                        />
                        <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={newLesson.isFree}
                            onChange={(e) => setNewLesson((p) => p && { ...p, isFree: e.target.checked })}
                            className="accent-purple-500"
                          />
                          Lección gratis (preview)
                        </label>
                        <div className="flex gap-2 ml-auto">
                          <button
                            type="submit"
                            disabled={createLesson.isPending}
                            className="bg-purple-600 hover:bg-purple-500 text-white text-sm px-4 py-2 rounded-lg"
                          >
                            {createLesson.isPending ? "..." : "Añadir"}
                          </button>
                          <button
                            type="button"
                            onClick={() => setNewLesson(null)}
                            className="text-slate-400 hover:text-white text-sm px-3 py-2"
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                      {createLesson.error && (
                        <p className="text-red-400 text-sm">{createLesson.error.message}</p>
                      )}
                    </form>
                  ) : (
                    <button
                      onClick={() => handleAddLesson(section.id)}
                      className="w-full py-3 text-sm text-slate-500 hover:text-purple-400 hover:bg-slate-800/30 transition-colors"
                    >
                      + Añadir lección
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
