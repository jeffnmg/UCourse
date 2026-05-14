import { db } from "@/core/db";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { BackLink } from "@/shared/components/BackLink";

type Props = { params: Promise<{ code: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { code } = await params;
  const cert = await db.certificate.findUnique({
    where: { verifyCode: code },
    include: {
      user: { select: { name: true } },
      course: { select: { title: true } },
    },
  });
  if (!cert) return { title: "Certificado no encontrado" };
  return {
    title: `Certificado de ${cert.user.name} — ${cert.course.title}`,
  };
}

export default async function VerifyCertificatePage({ params }: Props) {
  const { code } = await params;
  const cert = await db.certificate.findUnique({
    where: { verifyCode: code },
    include: {
      user: { select: { name: true, username: true } },
      course: {
        select: {
          title: true,
          slug: true,
          creator: { select: { name: true } },
        },
      },
    },
  });

  if (!cert) notFound();

  return (
    <main className="min-h-screen bg-slate-950 flex flex-col items-center p-6 sm:p-8">
      <div className="w-full max-w-lg mb-6 space-y-3">
        <BackLink href="/">Inicio</BackLink>
        <BackLink href={`/courses/${cert.course.slug}`}>Página del curso</BackLink>
      </div>
      <div className="bg-slate-900 border border-slate-700 rounded-2xl p-10 max-w-lg w-full text-center space-y-6">
        <div className="text-green-400 text-5xl">✓</div>
        <div>
          <h1 className="text-2xl font-bold text-white">Certificado Verificado</h1>
          <p className="text-slate-400 mt-1">Este certificado es auténtico</p>
        </div>
        <div className="bg-slate-800 rounded-xl p-6 space-y-3 text-left">
          <div>
            <span className="text-slate-400 text-sm">Estudiante</span>
            <p className="text-white font-semibold">{cert.user.name}</p>
          </div>
          <div>
            <span className="text-slate-400 text-sm">Curso completado</span>
            <p className="text-white font-semibold">{cert.course.title}</p>
          </div>
          <div>
            <span className="text-slate-400 text-sm">Instructor</span>
            <p className="text-white font-semibold">{cert.course.creator.name}</p>
          </div>
          <div>
            <span className="text-slate-400 text-sm">Fecha de emisión</span>
            <p className="text-white font-semibold">
              {cert.issuedAt.toLocaleDateString("es-ES", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          </div>
        </div>
        <p className="text-slate-500 text-xs">ID: {cert.verifyCode}</p>
      </div>
    </main>
  );
}
