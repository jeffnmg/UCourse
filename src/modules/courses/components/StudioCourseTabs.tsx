"use client";

import { useState } from "react";
import { CourseEditor } from "./CourseEditor";
import { CourseForm } from "./CourseForm";

type Lesson = { id: string; title: string; youtubeId: string; duration: number; isFree: boolean; position: number };
type Section = { id: string; title: string; position: number; lessons: Lesson[] };
type Category = { id: string; name: string; icon: string | null };
type Course = {
  id: string;
  title: string;
  description: string | null;
  slug: string;
  thumbnail: string | null;
  level: string;
  language: string;
  isPublished: boolean;
  categoryId: string;
  sections: Section[];
};

type Props = {
  course: Course;
  categories: Category[];
};

const TABS = [
  { id: "curriculum", label: "Curriculum" },
  { id: "details", label: "Detalles del curso" },
] as const;

type TabId = (typeof TABS)[number]["id"];

export function StudioCourseTabs({ course, categories }: Props) {
  const [tab, setTab] = useState<TabId>("curriculum");

  return (
    <div>
      {/* Tab bar */}
      <div className="flex border-b border-[var(--border)] mb-8 gap-1">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-5 py-3 text-sm font-medium transition-colors border-b-2 -mb-px ${
              tab === t.id
                ? "border-purple-500 text-[var(--text-primary)]"
                : "border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "curriculum" && <CourseEditor course={course} />}

      {tab === "details" && (
        <div className="max-w-2xl">
          <p className="text-[var(--text-secondary)] text-sm mb-6">
            Actualiza la información pública de tu curso. Los cambios se reflejarán inmediatamente en la página del curso.
          </p>
          <CourseForm
            categories={categories}
            courseId={course.id}
            defaultValues={{
              title: course.title,
              description: course.description ?? "",
              categoryId: course.categoryId,
              level: course.level,
              language: course.language,
              thumbnail: course.thumbnail ?? "",
            }}
          />
        </div>
      )}
    </div>
  );
}
