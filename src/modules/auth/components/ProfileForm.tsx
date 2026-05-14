"use client";

import { useState } from "react";
import { trpc } from "@/core/trpc/client";

type Props = {
  defaultValues: { name: string; username: string; bio: string };
};

export function ProfileForm({ defaultValues }: Props) {
  const [form, setForm] = useState(defaultValues);
  const [saved, setSaved] = useState(false);

  const update = trpc.auth.updateProfile.useMutation({
    onSuccess: () => {
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    },
  });

  function onChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));
    setSaved(false);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    update.mutate({
      name: form.name,
      username: form.username,
      bio: form.bio || undefined,
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-[var(--text-secondary)]">Nombre</label>
          <input
            name="name"
            required
            minLength={2}
            value={form.name}
            onChange={onChange}
            className="w-full bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl px-4 py-2.5 text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-[var(--text-secondary)]">
            Nombre de usuario
          </label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)] text-sm">@</span>
            <input
              name="username"
              required
              minLength={3}
              pattern="^[a-z0-9_]+$"
              value={form.username}
              onChange={onChange}
              className="w-full bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl pl-8 pr-4 py-2.5 text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-medium text-[var(--text-secondary)]">Biografía</label>
        <textarea
          name="bio"
          rows={3}
          maxLength={300}
          value={form.bio}
          onChange={onChange}
          placeholder="Cuéntanos algo sobre ti..."
          className="w-full bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl px-4 py-2.5 text-[var(--text-primary)] placeholder-[var(--text-muted)] resize-none focus:outline-none focus:ring-2 focus:ring-purple-500"
        />
        <p className="text-xs text-[var(--text-muted)] text-right">{form.bio.length}/300</p>
      </div>

      {update.error && (
        <p className="text-red-400 text-sm">{update.error.message}</p>
      )}

      <button
        type="submit"
        disabled={update.isPending}
        className="bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-semibold px-6 py-2.5 rounded-xl transition-colors"
      >
        {update.isPending ? "Guardando..." : saved ? "✓ Guardado" : "Guardar cambios"}
      </button>
    </form>
  );
}
