import { auth } from "@/core/auth";
import { redirect } from "next/navigation";
import { db } from "@/core/db";
import { CourseForm } from "@/modules/courses/components/CourseForm";
import { Navbar } from "@/shared/components/Navbar";
import { BackLink } from "@/shared/components/BackLink";

export default async function NewCoursePage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const user = await db.user.findUnique({ where: { id: session.user.id } });
  if (!user || user.role === "STUDENT") redirect("/studio/become-creator");

  const categories = await db.category.findMany({ orderBy: { name: "asc" } });

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <Navbar />
      <div className="max-w-3xl mx-auto px-6 pt-6">
        <BackLink href="/studio">Studio · Mis cursos</BackLink>
      </div>
      <div className="border-b border-slate-800 px-6 py-5">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-2xl font-bold mt-1">Crear nuevo curso</h1>
        </div>
      </div>
      <div className="max-w-3xl mx-auto px-6 py-8">
        <CourseForm categories={categories} />
      </div>
    </main>
  );
}
