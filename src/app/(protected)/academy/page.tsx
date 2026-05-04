import { PageHeader } from "@/components/page-header";
import { AcademyCourseCard } from "@/components/academy/academy-course-card";
import { requireUser } from "@/lib/auth";
import { getMyAcademyCourses } from "@/lib/academy/queries";

type AcademyPageProps = {
  searchParams: Promise<{ q?: string }>;
};

export default async function AcademyPage({ searchParams }: AcademyPageProps) {
  const user = await requireUser();
  const params = await searchParams;
  const courses = await getMyAcademyCourses(user.id);
  const query = params.q?.toLowerCase().trim() ?? "";

  const filteredCourses = courses.filter((course) => {
    if (!query) {
      return true;
    }

    return [course.title, course.description, course.goal ?? ""].some((value) =>
      value.toLowerCase().includes(query),
    );
  });

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Academy"
        title="Jouw e-learnings in de flow van de praktijk"
        description="Hier zie je welke e-learnings voor je klaarstaan, waar je bent gebleven en wat nu de slimste volgende stap is."
      />

      <section className="card-surface rounded-[24px] p-4">
        <form className="grid gap-3 lg:grid-cols-[1fr_132px]">
          <input
            type="search"
            name="q"
            defaultValue={params.q}
            placeholder="Zoek op titel, beschrijving of doel"
            className="rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-sm outline-none focus:border-[var(--brand)]"
          />
          <button
            type="submit"
            className="btn-primary px-5 py-3 text-sm"
          >
            Filteren
          </button>
        </form>
      </section>

      {filteredCourses.length ? (
        <section className="grid gap-4 xl:grid-cols-2">
          {filteredCourses.map((course) => (
            <AcademyCourseCard key={course.id} course={course} />
          ))}
        </section>
      ) : (
        <section className="card-surface rounded-[24px] p-6">
          <p className="text-base leading-7 text-[var(--ink-soft)]">
            Er staan nog geen e-learnings voor je klaar die passen bij deze zoekopdracht.
          </p>
        </section>
      )}
    </div>
  );
}
