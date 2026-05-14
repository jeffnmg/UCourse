"use client";

type Props = { xp: number; streak: number; achievementCount: number };

// Niveles cada 500 XP
function getLevel(xp: number) {
  return Math.floor(xp / 500) + 1;
}
function getProgress(xp: number) {
  return (xp % 500) / 500;
}

const LEVEL_TITLES = [
  "Explorador", "Aprendiz", "Estudiante", "Practicante",
  "Avanzado", "Experto", "Maestro", "Leyenda",
];

export function XPBar({ xp, streak, achievementCount }: Props) {
  const level = getLevel(xp);
  const progress = getProgress(xp);
  const title = LEVEL_TITLES[Math.min(level - 1, LEVEL_TITLES.length - 1)] ?? "Leyenda";
  const xpInLevel = xp % 500;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold text-white">Nv. {level}</span>
            <span className="text-purple-400 text-sm font-medium">{title}</span>
          </div>
          <p className="text-slate-400 text-xs mt-0.5">{xpInLevel} / 500 XP para el siguiente nivel</p>
        </div>
        <div className="flex items-center gap-4 text-center">
          <div>
            <div className="text-xl font-bold text-orange-400">🔥 {streak}</div>
            <div className="text-slate-500 text-xs">Racha</div>
          </div>
          <div>
            <div className="text-xl font-bold text-yellow-400">🏅 {achievementCount}</div>
            <div className="text-slate-500 text-xs">Logros</div>
          </div>
        </div>
      </div>

      {/* Barra de progreso */}
      <div className="space-y-1">
        <div className="h-3 bg-slate-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all duration-700"
            style={{ width: `${progress * 100}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-slate-600">
          <span>{xp.toLocaleString()} XP total</span>
          <span>{(500 - xpInLevel)} XP para nv. {level + 1}</span>
        </div>
      </div>
    </div>
  );
}
