"use client";

import { useEffect, useState } from "react";

type Achievement = { key: string; title: string; icon: string; xpReward: number };

type Props = { achievements: Achievement[]; onDismiss: () => void };

export function AchievementToast({ achievements, onDismiss }: Props) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(onDismiss, 300);
    }, 4000);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  if (!visible || achievements.length === 0) return null;

  return (
    <div className={`fixed bottom-6 right-6 z-50 space-y-3 transition-all duration-300 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
      {achievements.map((a) => (
        <div
          key={a.key}
          className="flex items-center gap-4 bg-slate-900 border border-yellow-500/40 rounded-2xl px-5 py-4 shadow-2xl shadow-yellow-500/10 min-w-64"
        >
          <span className="text-3xl">{a.icon}</span>
          <div>
            <p className="text-xs text-yellow-400 font-semibold uppercase tracking-wider">
              ¡Logro desbloqueado!
            </p>
            <p className="text-white font-bold mt-0.5">{a.title}</p>
            <p className="text-yellow-400 text-sm">+{a.xpReward} XP</p>
          </div>
        </div>
      ))}
    </div>
  );
}
