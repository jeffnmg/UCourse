"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { trpc } from "@/core/trpc/client";
import { BackLink } from "@/shared/components/BackLink";

export default function BecomeCreatorPage() {
  const router = useRouter();
  const [done, setDone] = useState(false);

  const becomeCreator = trpc.auth.becomeCreator.useMutation({
    onSuccess: () => {
      setDone(true);
      setTimeout(() => router.push("/studio"), 2000);
    },
  });

  if (done) {
    return (
      <main className="relative min-h-screen bg-slate-950 flex items-center justify-center text-white px-4">
        <div className="absolute top-6 left-4 right-4 sm:left-8">
          <BackLink href="/dashboard">Mi aprendizaje</BackLink>
        </div>
        <div className="text-center space-y-4">
          <div className="text-6xl">🎉</div>
          <h1 className="text-3xl font-bold">¡Ya eres Creador!</h1>
          <p className="text-slate-400">Redirigiendo a tu Studio...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="relative min-h-screen bg-slate-950 flex items-center justify-center px-4 py-16">
      <div className="absolute top-6 left-4 right-4 sm:left-8">
        <BackLink href="/dashboard">Mi aprendizaje</BackLink>
      </div>
      <div className="max-w-lg w-full space-y-8 text-white text-center">
        <div className="space-y-4">
          <div className="text-6xl">✨</div>
          <h1 className="text-4xl font-bold">Conviértete en Creador</h1>
          <p className="text-slate-400 text-lg">
            Comparte tu conocimiento con el mundo. Crea cursos, sube tus videos
            de YouTube y certifica a tus estudiantes.
          </p>
        </div>

        <div className="grid gap-4 text-left">
          {[
            { icon: "📹", title: "Usa tus videos de YouTube", desc: "Sube a YouTube y enlaza aquí. Sin costo de almacenamiento." },
            { icon: "🧠", title: "Crea quices interactivos", desc: "Pausa el video y evalúa a tus estudiantes en tiempo real." },
            { icon: "🎓", title: "Emite certificados", desc: "Diseña y entrega diplomas verificables al completar el curso." },
            { icon: "📊", title: "Analiza tu impacto", desc: "Ve estadísticas de enrollment, progreso y aprobación." },
          ].map((f) => (
            <div key={f.title} className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex gap-4 items-start">
              <span className="text-2xl">{f.icon}</span>
              <div>
                <p className="font-semibold">{f.title}</p>
                <p className="text-slate-400 text-sm mt-0.5">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {becomeCreator.error && (
          <p className="text-red-400 text-sm">{becomeCreator.error.message}</p>
        )}

        <button
          onClick={() => becomeCreator.mutate()}
          disabled={becomeCreator.isPending}
          className="w-full bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-semibold py-4 rounded-xl transition-colors text-lg"
        >
          {becomeCreator.isPending ? "Activando..." : "Activar cuenta de Creador →"}
        </button>
      </div>
    </main>
  );
}
