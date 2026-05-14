"use client";

import { useRouter } from "next/navigation";
import { trpc } from "@/core/trpc/client";

export function ClaimButton({ courseId }: { courseId: string }) {
  const router = useRouter();
  const issue = trpc.certificates.issue.useMutation({
    onSuccess: () => router.refresh(),
  });

  return (
    <button
      onClick={() => issue.mutate({ courseId })}
      disabled={issue.isPending}
      className="text-sm bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-400 border border-yellow-500/30 px-4 py-1.5 rounded-lg transition-colors"
    >
      {issue.isPending ? "Generando..." : "Reclamar 🎓"}
    </button>
  );
}
