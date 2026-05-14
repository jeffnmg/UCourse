import { auth } from "@/core/auth";
import { redirect } from "next/navigation";
import { Navbar } from "@/shared/components/Navbar";
import { BackLink } from "@/shared/components/BackLink";
import { ProfileForm } from "@/modules/auth/components/ProfileForm";
import { db } from "@/core/db";

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { name: true, username: true, bio: true, email: true },
  });
  if (!user) redirect("/login");

  return (
    <div className="min-h-screen bg-[var(--bg-base)] text-[var(--text-primary)]">
      <Navbar />
      <div className="max-w-2xl mx-auto px-6 pt-6">
        <BackLink href="/dashboard">Mi aprendizaje</BackLink>
      </div>
      <div className="max-w-2xl mx-auto px-6 py-10 space-y-10">
        <h1 className="text-3xl font-bold">Configuración</h1>

        {/* Perfil */}
        <section className="space-y-4">
          <h2 className="text-lg font-semibold border-b border-[var(--border)] pb-3">
            Perfil
          </h2>
          <ProfileForm
            defaultValues={{ name: user.name, username: user.username, bio: user.bio ?? "" }}
          />
        </section>

        {/* Cuenta */}
        <section className="space-y-4">
          <h2 className="text-lg font-semibold border-b border-[var(--border)] pb-3">
            Cuenta
          </h2>
          <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl p-4 flex items-center justify-between">
            <div>
              <p className="font-medium">Email</p>
              <p className="text-[var(--text-secondary)] text-sm">{user.email}</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
