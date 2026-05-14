/** Orden plano de lecciones del curso (tabs primero). */
export function flattenLessonIds(
  sections: Array<{ lessons: Array<{ id: string }> }>
): string[] {
  return sections.flatMap((s) => s.lessons.map((l) => l.id));
}

export type LessonProgressMap = Map<
  string,
  { completed: boolean; watchedSecs: number; lastAccessedAt: Date | null }
>;

/** Primera lección no completada; si todas completas, última lección. */
export function pickContinueLesson(
  orderedLessonIds: string[],
  progress: LessonProgressMap
): {
  lessonId: string | null;
  resumeSecs: number;
  allComplete: boolean;
} {
  if (orderedLessonIds.length === 0) {
    return { lessonId: null, resumeSecs: 0, allComplete: false };
  }

  for (const id of orderedLessonIds) {
    const p = progress.get(id);
    if (!p?.completed) {
      return {
        lessonId: id,
        resumeSecs: Math.max(0, p?.watchedSecs ?? 0),
        allComplete: false,
      };
    }
  }

  const lastId = orderedLessonIds[orderedLessonIds.length - 1]!;
  const lastP = progress.get(lastId);
  return {
    lessonId: lastId,
    resumeSecs: Math.max(0, lastP?.watchedSecs ?? 0),
    allComplete: true,
  };
}
