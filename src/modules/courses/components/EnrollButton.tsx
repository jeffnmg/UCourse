"use client";

import { useRouter } from "next/navigation";
import { trpc } from "@/core/trpc/client";

type Props = { courseId: string; courseSlug: string; firstLessonId: string | null };

export function EnrollButton({ courseId, courseSlug, firstLessonId }: Props) {
  const router = useRouter();

  const enroll = trpc.progress.enroll.useMutation({
    onSuccess: () => {
      if (firstLessonId) {
        router.push(`/courses/${courseSlug}/learn/${firstLessonId}`);
      } else {
        router.refresh();
      }
    },
  });

  return (
    <button
      onClick={() => enroll.mutate({ courseId })}
      disabled={enroll.isPending}
      className="w-full bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-semibold py-3.5 rounded-xl transition-colors"
    >
      {enroll.isPending ? "Inscribiendo..." : "Inscribirse gratis →"}
    </button>
  );
}
