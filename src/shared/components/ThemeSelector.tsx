"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

const THEMES = [
  { value: "dark", label: "Oscuro", icon: "🌙", desc: "Fondo negro, ideal para largas sesiones" },
  { value: "light", label: "Claro", icon: "☀️", desc: "Fondo blanco, mayor contraste" },
  { value: "system", label: "Sistema", icon: "💻", desc: "Sigue la preferencia de tu sistema operativo" },
];

export function ThemeSelector() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  return (
    <div className="grid grid-cols-3 gap-3">
      {THEMES.map((t) => {
        const active = theme === t.value;
        return (
          <button
            key={t.value}
            onClick={() => setTheme(t.value)}
            className={`rounded-2xl p-4 text-left border-2 transition-all ${
              active
                ? "border-purple-500 bg-purple-500/10"
                : "border-[var(--border)] bg-[var(--bg-surface)] hover:border-slate-500"
            }`}
          >
            <div className="text-2xl mb-2">{t.icon}</div>
            <p className="font-semibold text-sm text-[var(--text-primary)]">{t.label}</p>
            <p className="text-xs text-[var(--text-secondary)] mt-0.5 leading-snug">{t.desc}</p>
            {active && (
              <div className="mt-2 text-purple-400 text-xs font-medium">✓ Activo</div>
            )}
          </button>
        );
      })}
    </div>
  );
}
