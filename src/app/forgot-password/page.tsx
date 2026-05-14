"use client";

import { useState } from "react";
import Link from "next/link";
import { BackLink } from "@/shared/components/BackLink";
import { BrandWordmark } from "@/shared/components/BrandWordmark";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage(null);

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(typeof data.error === "string" ? data.error : "Algo salió mal");
        return;
      }

      setMessage(
        typeof data.message === "string"
          ? data.message
          : "Revisa tu correo para continuar."
      );
      setEmail("");
    } catch {
      setError("No se pudo enviar la solicitud. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md space-y-8">
        <div>
          <BackLink href="/login">Volver al inicio de sesión</BackLink>
        </div>
        <div className="text-center">
          <BrandWordmark size="auth" className="mx-auto" />
          <p className="mt-3 text-slate-400">Recuperar contraseña</p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-slate-900 border border-slate-800 rounded-2xl p-8 space-y-5"
        >
          <p className="text-sm text-slate-400 leading-relaxed">
            Escribe el correo con el que te registraste. Si existe una cuenta, te enviaremos un enlace
            para elegir una contraseña nueva (válido 1 hora).
          </p>

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {message && (
            <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-sm px-4 py-3 rounded-lg">
              {message}
            </div>
          )}

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-slate-300">Correo</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@email.com"
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-purple-600 hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-colors"
          >
            {loading ? "Enviando..." : "Enviar enlace"}
          </button>

          <p className="text-center text-sm text-slate-400">
            <Link href="/login" className="text-purple-400 hover:text-purple-300 font-medium">
              Volver a iniciar sesión
            </Link>
          </p>
        </form>
      </div>
    </main>
  );
}
