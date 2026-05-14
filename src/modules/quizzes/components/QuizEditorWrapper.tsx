"use client";

import { useState } from "react";
import { QuizEditor } from "./QuizEditor";
import { useRouter } from "next/navigation";

type Props = { lessonId: string; courseId: string };

export function QuizEditorWrapper({ lessonId, courseId }: Props) {
  const router = useRouter();
  const [saved, setSaved] = useState(false);

  if (saved) {
    return (
      <div className="text-center py-8 space-y-3">
        <div className="text-4xl">✅</div>
        <p className="text-green-400 font-semibold">Quiz guardado correctamente</p>
        <button
          onClick={() => { setSaved(false); router.refresh(); }}
          className="text-sm text-slate-400 hover:text-white underline"
        >
          Añadir otro quiz
        </button>
      </div>
    );
  }

  return (
    <QuizEditor
      lessonId={lessonId}
      defaultType="END_OF_LESSON"
      onSuccess={() => { setSaved(true); router.refresh(); }}
    />
  );
}
