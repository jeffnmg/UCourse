import { auth } from "@/core/auth";
import { redirect, notFound } from "next/navigation";
import { db } from "@/core/db";
import Link from "next/link";
import { Navbar } from "@/shared/components/Navbar";
import { BackLink } from "@/shared/components/BackLink";
import { StudioCourseTabs } from "@/modules/courses/components/StudioCourseTabs";

type Props = { params: Promise<{ courseId: string }> };

export default async function EditCoursePage({ params }: Props) {
  const { courseId } = await params;
  const session = await auth();
  if (!session?.user) redirect("/login");

  const [course, categories] = await Promise.all([
    db.course.findUnique({
      where: { id: courseId },
      include: {
        sections: {
          orderBy: { position: "asc" },
          include: { lessons: { orderBy: { position: "asc" } } },
        },
        category: true,
      },
    }),
    db.category.findMany({ orderBy: { name: "asc" } }),
  ]);

  if (!course || course.creatorId !== session.user.id) notFound();

  return (
    <main className="min-h-screen bg-[var(--bg-base)] text-[var(--text-primary)]">
      <Navbar />
      <div className="max-w-5xl mx-auto px-6 pt-6">
        <BackLink href="/studio">Studio · Mis cursos</BackLink>
      </div>
      {/* Header */}
      <div className="border-b border-[var(--border)] px-6 py-5">
        <div className="max-w-5xl mx-auto flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-sm text-[var(--text-muted)]">
              <Link href="/studio" className="hover:text-[var(--text-secondary)] transition-colors">
                Studio
              </Link>
              <span>/</span>
              <span className="text-[var(--text-secondary)]">{course.title}</span>
            </div>
            <h1 className="text-2xl font-bold mt-1">{course.title}</h1>
            <div className="flex items-center gap-3 mt-1.5">
              <span className="text-[var(--text-secondary)] text-sm">{course.category.name}</span>
              <span className="text-[var(--text-muted)] text-xs">·</span>
              <span className="text-[var(--text-secondary)] text-sm">{course.level}</span>
              <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${
                course.isPublished
                  ? "bg-green-500/15 text-green-400"
                  : "bg-yellow-500/15 text-yellow-400"
              }`}>
                {course.isPublished ? "Publicado" : "Borrador"}
              </span>
            </div>
          </div>
          <div className="flex gap-2 shrink-0">
            {course.isPublished && (
              <Link
                href={`/courses/${course.slug}`}
                target="_blank"
                className="text-sm text-purple-400 hover:text-purple-300 border border-purple-500/30 px-4 py-2 rounded-xl transition-colors"
              >
                Ver público ↗
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Tabs + Content */}
      <div className="max-w-5xl mx-auto px-6 py-8">
        <StudioCourseTabs
          course={course}
          categories={categories}
        />
      </div>
    </main>
  );
}
