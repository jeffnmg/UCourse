import { auth } from "@/core/auth";
import { redirect } from "next/navigation";
import { db } from "@/core/db";
import Link from "next/link";
import { Navbar } from "@/shared/components/Navbar";
import { BackLink } from "@/shared/components/BackLink";
import { ClaimButton } from "@/modules/certificates/components/ClaimButton";
import { CopyLinkButton } from "@/modules/certificates/components/CopyLinkButton";

export default async function CertificatesPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const certificates = await db.certificate.findMany({
    where: { userId: session.user.id },
    orderBy: { issuedAt: "desc" },
    include: {
      course: {
        select: {
          title: true,
          slug: true,
          thumbnail: true,
          creator: { select: { name: true } },
          category: { select: { name: true } },
        },
      },
    },
  });

  // Cursos completados sin certificado emitido aún
  const completedWithoutCert = await db.enrollment.findMany({
    where: {
      userId: session.user.id,
      completedAt: { not: null },
      course: {
        certificates: { none: { userId: session.user.id } },
      },
    },
    include: {
      course: { select: { id: true, title: true, slug: true, thumbnail: true } },
    },
  });

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <Navbar />
      <div className="max-w-4xl mx-auto px-6 pt-6">
        <BackLink href="/dashboard">Mi aprendizaje</BackLink>
      </div>
      <div className="max-w-4xl mx-auto px-6 py-10 space-y-8">
        <div>
          <h1 className="text-3xl font-bold">Mis Certificados</h1>
          <p className="text-slate-400 mt-1">Tus diplomas verificables</p>
        </div>

        {/* Cursos completados pendientes de reclamar certificado */}
        {completedWithoutCert.length > 0 && (
          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-2xl p-5 space-y-3">
            <p className="text-yellow-400 font-semibold">🎓 Tienes certificados pendientes de reclamar</p>
            {completedWithoutCert.map(({ course }) => (
              <ClaimCertificateButton key={course.id} courseId={course.id} courseTitle={course.title} />
            ))}
          </div>
        )}

        {/* Lista de certificados */}
        {certificates.length === 0 && completedWithoutCert.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 border-dashed rounded-2xl p-12 text-center">
            <p className="text-5xl mb-4">🎓</p>
            <p className="text-white font-semibold text-lg">Aún no tienes certificados</p>
            <p className="text-slate-400 mt-2">Completa un curso para obtener tu primer diploma</p>
            <Link
              href="/courses"
              className="inline-block mt-6 bg-purple-600 hover:bg-purple-500 text-white font-medium px-6 py-3 rounded-xl transition-colors"
            >
              Explorar cursos
            </Link>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 gap-5">
            {certificates.map((cert) => (
              <div
                key={cert.id}
                className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden"
              >
                {/* Preview del diploma */}
                <div className="bg-gradient-to-br from-purple-900/40 to-pink-900/40 p-8 text-center border-b border-slate-800">
                  <div className="text-4xl mb-2">🎓</div>
                  <p className="text-xs text-slate-400 uppercase tracking-widest mb-2">Certificado de</p>
                  <p className="font-bold text-lg text-white leading-tight">{cert.course.title}</p>
                  <p className="text-slate-400 text-sm mt-1">por {cert.course.creator.name}</p>
                </div>

                <div className="p-4 space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-400">
                      Emitido el{" "}
                      {new Date(cert.issuedAt).toLocaleDateString("es-ES", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <Link
                      href={`/verify/${cert.verifyCode}`}
                      target="_blank"
                      className="flex-1 text-center text-sm border border-slate-700 hover:border-slate-500 text-slate-300 hover:text-white py-2 rounded-lg transition-colors"
                    >
                      Verificar ↗
                    </Link>
                    <CopyLinkButton verifyCode={cert.verifyCode} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ClaimCertificateButton({ courseId, courseTitle }: { courseId: string; courseTitle: string }) {
  return (
    <div className="flex items-center justify-between bg-slate-900/50 rounded-xl px-4 py-3">
      <p className="text-sm text-white font-medium">{courseTitle}</p>
      <ClaimButton courseId={courseId} />
    </div>
  );
}
