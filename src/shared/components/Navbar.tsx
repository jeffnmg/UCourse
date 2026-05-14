import Link from "next/link";
import { auth, signOut } from "@/core/auth";
import { BrandWordmark } from "./BrandWordmark";

export async function Navbar() {
  const session = await auth();
  const user = session?.user;

  return (
    <nav className="border-b border-slate-800 bg-slate-950/80 backdrop-blur-sm sticky top-0 z-50 px-6 py-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <BrandWordmark size="nav" />

        <div className="flex items-center gap-4">
          <Link href="/courses" className="text-slate-400 hover:text-white text-sm transition-colors">
            Explorar
          </Link>

          {user ? (
            <>
              {(user.role === "CREATOR" || user.role === "ADMIN") && (
                <Link
                  href="/studio"
                  className="text-sm font-semibold text-purple-200 bg-purple-600/30 hover:bg-purple-600/45 border border-purple-500/50 px-3 py-2 rounded-lg transition-colors whitespace-nowrap"
                >
                  Mis cursos
                </Link>
              )}
              <Link href="/dashboard" className="text-slate-400 hover:text-white text-sm transition-colors">
                Mi aprendizaje
              </Link>
              <Link href="/settings" className="text-slate-400 hover:text-white text-sm transition-colors">
                ⚙
              </Link>
              <form
                action={async () => {
                  "use server";
                  await signOut({ redirectTo: "/" });
                }}
              >
                <button type="submit" className="text-slate-400 hover:text-white text-sm transition-colors">
                  Salir
                </button>
              </form>
              <Link
                href="/dashboard"
                className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center text-white text-sm font-bold"
              >
                {user.name?.[0]?.toUpperCase() ?? "U"}
              </Link>
            </>
          ) : (
            <>
              <Link href="/login" className="text-slate-400 hover:text-white text-sm transition-colors">
                Iniciar sesión
              </Link>
              <Link
                href="/register"
                className="bg-purple-600 hover:bg-purple-500 text-white text-sm font-medium px-4 py-2 rounded-xl transition-colors"
              >
                Registrarse
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
