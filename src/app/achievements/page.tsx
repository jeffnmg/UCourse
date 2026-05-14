import { auth } from "@/core/auth";
import { redirect } from "next/navigation";
import { db } from "@/core/db";
import { Navbar } from "@/shared/components/Navbar";
import { BackLink } from "@/shared/components/BackLink";

export default async function AchievementsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const [all, earned] = await Promise.all([
    db.achievement.findMany(),
    db.userAchievement.findMany({
      where: { userId: session.user.id },
      select: { achievementId: true, earnedAt: true },
    }),
  ]);

  const earnedMap = new Map(earned.map((e) => [e.achievementId, e.earnedAt]));
  const achievements = all.map((a) => ({
    ...a,
    earned: earnedMap.has(a.id),
    earnedAt: earnedMap.get(a.id) ?? null,
  }));

  const earnedCount = achievements.filter((a) => a.earned).length;

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <Navbar />
      <div className="max-w-3xl mx-auto px-6 pt-6">
        <BackLink href="/dashboard">Mi aprendizaje</BackLink>
      </div>
      <div className="max-w-3xl mx-auto px-6 py-10 space-y-8">
        <div>
          <h1 className="text-3xl font-bold">Mis Logros</h1>
          <p className="text-slate-400 mt-1">
            {earnedCount} de {all.length} desbloqueados
          </p>
        </div>

        {/* Barra de progreso de logros */}
        <div className="space-y-2">
          <div className="h-3 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full transition-all"
              style={{ width: `${(earnedCount / all.length) * 100}%` }}
            />
          </div>
          <p className="text-xs text-slate-500 text-right">{Math.round((earnedCount / all.length) * 100)}% completado</p>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          {achievements.map((a) => (
            <div
              key={a.id}
              className={`flex items-center gap-4 rounded-2xl p-4 border transition-colors ${
                a.earned
                  ? "bg-slate-900 border-yellow-500/30"
                  : "bg-slate-900/40 border-slate-800 opacity-50"
              }`}
            >
              <span className={`text-3xl ${!a.earned ? "grayscale" : ""}`}>{a.icon}</span>
              <div className="flex-1">
                <p className={`font-semibold ${a.earned ? "text-white" : "text-slate-500"}`}>
                  {a.title}
                </p>
                <p className="text-slate-400 text-xs mt-0.5">{a.description}</p>
                {a.earned && a.earnedAt && (
                  <p className="text-yellow-400 text-xs mt-1">
                    Ganado el{" "}
                    {new Date(a.earnedAt).toLocaleDateString("es-ES", {
                      month: "short",
                      day: "numeric",
                    })}
                  </p>
                )}
              </div>
              <div className="text-right shrink-0">
                <span className={`text-sm font-bold ${a.earned ? "text-yellow-400" : "text-slate-600"}`}>
                  +{a.xpReward}
                </span>
                <p className="text-xs text-slate-600">XP</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
