import Link from "next/link";
import {
  Award,
  BookOpen,
  CheckCircle2,
  Clapperboard,
  GraduationCap,
  Infinity,
  Layers,
  Sparkles,
  Users,
  Youtube,
} from "lucide-react";
import { auth } from "@/core/auth";
import { Navbar } from "@/shared/components/Navbar";

export default async function HomePage() {
  const session = await auth();
  const loggedIn = !!session?.user;

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <Navbar />

      <main className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden border-b border-slate-200 dark:border-slate-800">
          <div
            className="pointer-events-none absolute inset-0 bg-gradient-to-br from-purple-500/15 via-transparent to-pink-500/10 dark:from-purple-600/20 dark:to-pink-600/15"
            aria-hidden
          />
          <div className="relative max-w-5xl mx-auto px-6 pt-16 pb-20 sm:pt-24 sm:pb-28 text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-purple-500/30 bg-purple-500/10 px-4 py-1.5 text-sm font-medium text-purple-700 dark:text-purple-300">
              <Sparkles className="size-4 shrink-0" aria-hidden />
              Gratis para aprender — certificación y evaluación incluidas
            </span>
            <h1 className="mt-8 text-4xl sm:text-6xl font-bold tracking-tight text-balance">
              Tu conocimiento en vivo,
              <span className="block sm:inline sm:pl-3 bg-gradient-to-r from-purple-600 to-pink-600 dark:from-purple-400 dark:to-pink-400 bg-clip-text text-transparent">
                sin perderse en un drive
              </span>
            </h1>
            <p className="mt-6 text-lg sm:text-xl text-slate-600 dark:text-slate-400 max-w-3xl mx-auto text-pretty leading-relaxed">
              <strong className="font-semibold text-slate-800 dark:text-slate-200">UCourse</strong>, dentro del ecosistema{" "}
              <strong className="font-semibold text-slate-800 dark:text-slate-200">Virtual University</strong>, no es solo
              “otra lista de cursos”. Es un hogar para{" "}
              <strong className="font-semibold text-slate-800 dark:text-slate-200">masterclass y material formativo</strong>{" "}
              que muchas veces queda enterrado en carpetas, enlaces privados o vídeos sueltos en YouTube — sin forma
              clara de certificar ni evaluar. Aquí el contenido puede quedar{" "}
              <strong className="font-semibold text-slate-800 dark:text-slate-200">organizado, eterno y gratuito</strong>,
              con <strong className="font-semibold text-slate-800 dark:text-slate-200">evaluación y certificados verificables</strong>{" "}
              cuando completas el recorrido.
            </p>

            <div className="mt-10 flex flex-col sm:flex-row gap-3 justify-center items-stretch sm:items-center">
              {loggedIn ? (
                <>
                  <Link
                    href="/courses"
                    className="inline-flex justify-center items-center gap-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold px-8 py-3.5 transition-colors shadow-lg shadow-purple-600/25"
                  >
                    Ver cursos
                  </Link>
                  <Link
                    href="/dashboard"
                    className="inline-flex justify-center items-center gap-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white/80 dark:bg-slate-900/80 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold px-8 py-3.5 transition-colors"
                  >
                    Mi aprendizaje
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    href="/register"
                    className="inline-flex justify-center items-center gap-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold px-8 py-3.5 transition-colors shadow-lg shadow-purple-600/25"
                  >
                    Crear cuenta gratis
                  </Link>
                  <Link
                    href="/login"
                    className="inline-flex justify-center items-center gap-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white/80 dark:bg-slate-900/80 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold px-8 py-3.5 transition-colors"
                  >
                    Iniciar sesión
                  </Link>
                </>
              )}
              {!loggedIn && (
                <Link
                  href="/courses"
                  className="inline-flex justify-center items-center gap-2 rounded-xl text-slate-600 dark:text-slate-400 hover:text-purple-600 dark:hover:text-purple-300 font-medium px-4 py-3.5 transition-colors"
                >
                  Explorar contenido
                  <span aria-hidden>→</span>
                </Link>
              )}
            </div>
          </div>
        </section>

        {/* Pillars */}
        <section className="max-w-6xl mx-auto px-6 py-20">
          <h2 className="text-2xl sm:text-3xl font-bold text-center text-balance max-w-2xl mx-auto">
            Tres ideas que guían la plataforma
          </h2>
          <div className="mt-12 grid gap-6 sm:grid-cols-3">
            <article className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 p-6 shadow-sm">
              <div className="flex size-11 items-center justify-center rounded-xl bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300">
                <Clapperboard className="size-5" aria-hidden />
              </div>
              <h3 className="mt-4 font-semibold text-lg">Masterclass y cursos, no archivos huérfanos</h3>
              <p className="mt-2 text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
                Sube o consume charlas, talleres y programas estructurados. Menos contenido perdido entre enlaces y más
                biblioteca viva que la gente puede seguir cuando quiera.
              </p>
            </article>
            <article className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 p-6 shadow-sm">
              <div className="flex size-11 items-center justify-center rounded-xl bg-pink-100 dark:bg-pink-950/60 text-pink-700 dark:text-pink-300">
                <Infinity className="size-5" aria-hidden />
              </div>
              <h3 className="mt-4 font-semibold text-lg">Material “eterno” para trabajar y compartir</h3>
              <p className="mt-2 text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
                Lo que publicamos permanece disponible: lecciones, recursos y rutas claras. Ideal para reforzar ideas,
                usarlos en equipos o llegar a quien no pudo conectar en directo.
              </p>
            </article>
            <article className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 p-6 shadow-sm">
              <div className="flex size-11 items-center justify-center rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300">
                <Award className="size-5" aria-hidden />
              </div>
              <h3 className="mt-4 font-semibold text-lg">100% gratis con evaluación y certificación</h3>
              <p className="mt-2 text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
                Quizzes y cierre de lección para medir lo aprendido; certificados con verificación cuando corresponda —
                sin depender solo del “momento” en que se dictó la clase.
              </p>
            </article>
          </div>
        </section>

        {/* What you can do */}
        <section className="border-y border-slate-200 dark:border-slate-800 bg-slate-100/80 dark:bg-slate-900/40 py-20">
          <div className="max-w-6xl mx-auto px-6">
            <h2 className="text-2xl sm:text-3xl font-bold text-center">Qué puedes hacer hoy</h2>
            <ul className="mt-12 grid gap-4 sm:grid-cols-2 max-w-4xl mx-auto">
              {[
                {
                  icon: BookOpen,
                  title: "Aprender",
                  text: "Recorre lecciones con vídeo, notas y controles de avance en tu panel de aprendizaje.",
                },
                {
                  icon: CheckCircle2,
                  title: "Demostrar lo aprendido",
                  text: "Responde evaluaciones integradas en las lecciones y al final del contenido.",
                },
                {
                  icon: GraduationCap,
                  title: "Obtener certificados",
                  text: "Emite y guarda certificados verificables cuando completes los requisitos del curso.",
                },
                {
                  icon: Users,
                  title: "Participar como creador",
                  text: "Publica cursos o masterclass desde el estudio: secciones, lecciones, quizzes y recursos.",
                },
                {
                  icon: Layers,
                  title: "Explorar un catálogo único",
                  text: "Descubre contenido por categorías y filtra lo que mejor encaje con tu momento.",
                },
                {
                  icon: Youtube,
                  title: "Contrastar con lo disperso",
                  text: "Si ya tienes material en YouTube o drives, aquí puedes darle orden, evaluación y reconocimiento formal.",
                },
              ].map(({ icon: Icon, title, text }) => (
                <li
                  key={title}
                  className="flex gap-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950/60 p-5"
                >
                  <Icon className="size-6 shrink-0 text-purple-600 dark:text-purple-400 mt-0.5" aria-hidden />
                  <div>
                    <h3 className="font-semibold">{title}</h3>
                    <p className="mt-1 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{text}</p>
                  </div>
                </li>
              ))}
            </ul>

            <div className="mt-14 flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/courses"
                className="inline-flex justify-center rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold px-8 py-3 transition-colors"
              >
                {loggedIn ? "Ir al catálogo" : "Empezar ahora"}
              </Link>
              <Link
                href="/studio/become-creator"
                className="inline-flex justify-center rounded-xl border border-slate-300 dark:border-slate-600 font-semibold px-8 py-3 hover:bg-white dark:hover:bg-slate-800 transition-colors"
              >
                Quiero crear contenido
              </Link>
            </div>
          </div>
        </section>

        {/* Closing */}
        <section className="max-w-3xl mx-auto px-6 py-20 text-center">
          <h2 className="text-2xl font-bold text-balance">Hecho para quien enseña y quien aprende, sin fricción</h2>
          <p className="mt-4 text-slate-600 dark:text-slate-400 leading-relaxed">
            Si tienes una masterclass grabada o un curso armado con cariño, aquí puede tener una segunda vida: visible,
            evaluable y con certificación. Si quieres aprender, todo el flujo —desde el registro hasta tu progreso— está
            pensado para ser claro y gratuito.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            {loggedIn ? (
              <>
                <Link href="/dashboard" className="text-purple-600 dark:text-purple-400 font-semibold hover:underline">
                  Mi aprendizaje
                </Link>
                <span className="text-slate-300 dark:text-slate-600" aria-hidden>
                  ·
                </span>
                <Link href="/courses" className="text-purple-600 dark:text-purple-400 font-semibold hover:underline">
                  Ver catálogo
                </Link>
              </>
            ) : (
              <>
                <Link href="/login" className="text-purple-600 dark:text-purple-400 font-semibold hover:underline">
                  Ya tengo cuenta
                </Link>
                <span className="text-slate-300 dark:text-slate-600" aria-hidden>
                  ·
                </span>
                <Link href="/courses" className="text-purple-600 dark:text-purple-400 font-semibold hover:underline">
                  Ver catálogo
                </Link>
              </>
            )}
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-200 dark:border-slate-800 py-8 px-6 text-center text-sm text-slate-500 dark:text-slate-500">
        <p>UCourse · Virtual University — aprendizaje abierto con certificación y evaluación.</p>
      </footer>
    </div>
  );
}
