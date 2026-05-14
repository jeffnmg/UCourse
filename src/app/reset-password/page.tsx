"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { BackLink } from "@/shared/components/BackLink";
import { BrandWordmark } from "@/shared/components/BrandWordmark";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess(null);

    if (!token.trim()) {
      setError("Falta el enlace de recuperación. Abre el link del correo o solicita uno nuevo.");
      return;
    }

    if (password !== confirm) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: token.trim(), password }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(typeof data.error === "string" ? data.error : "No se pudo actualizar la contraseña");
        return;
      }

      setSuccess(typeof data.message === "string" ? data.message : "Listo.");
      setTimeout(() => router.push("/login"), 2000);
    } catch {
      setError("Error de red. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-slate-900 border border-slate-800 rounded-2xl p-8 space-y-5">
      {!token ? (
        <div className="bg-amber-500/10 border border-amber-500/30 text-amber-200 text-sm px-4 py-3 rounded-lg">
          Este enlace no es válido.{" "}
          <Link href="/forgot-password" className="underline font-medium">
            Solicitar uno nuevo
          </Link>
          .
        </div>
      ) : null}

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-sm px-4 py-3 rounded-lg">
          {success} Redirigiendo al inicio de sesión…
        </div>
      )}

      <div className="space-y-1.5">
        <label className="block text-sm font-medium text-slate-300">Nueva contraseña</label>
        <input
          type="password"
          required
          minLength={6}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Mínimo 6 caracteres"
          disabled={!token || !!success}
          className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:opacity-50"
        />
      </div>

      <div className="space-y-1.5">
        <label className="block text-sm font-medium text-slate-300">Confirmar contraseña</label>
        <input
          type="password"
          required
          minLength={6}
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          placeholder="Repite la contraseña"
          disabled={!token || !!success}
          className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:opacity-50"
        />
      </div>

      <button
        type="submit"
        disabled={loading || !token || !!success}
        className="w-full bg-purple-600 hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-colors"
      >
        {loading ? "Guardando..." : "Guardar contraseña"}
      </button>

      <p className="text-center text-sm text-slate-400">
        <Link href="/login" className="text-purple-400 hover:text-purple-300 font-medium">
          Ir a iniciar sesión
        </Link>
      </p>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <main className="min-h-screen bg-slate-950 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md space-y-8">
        <div>
          <BackLink href="/forgot-password">Otro enlace</BackLink>
        </div>
        <div className="text-center">
          <BrandWordmark size="auth" className="mx-auto" />
          <p className="mt-3 text-slate-400">Nueva contraseña</p>
        </div>

        <Suspense
          fallback={
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center text-slate-400 text-sm">
              Cargando…
            </div>
          }
        >
          <ResetPasswordForm />
        </Suspense>
      </div>
    </main>
  );
}
