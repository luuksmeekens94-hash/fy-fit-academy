import Link from "next/link";

import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { requireUser } from "@/lib/auth";
import { getStore } from "@/lib/demo-data";

type LibraryPageProps = {
  searchParams: Promise<{ q?: string; category?: string; type?: string }>;
};

export default async function LibraryPage({ searchParams }: LibraryPageProps) {
  await requireUser();
  const params = await searchParams;
  const store = getStore();
  const query = params.q?.toLowerCase() ?? "";
  const selectedType = params.type ?? "all";
  const selectedCategory = params.category ?? "all";

  const filteredDocuments = store.documents.filter((document) => {
    const matchesQuery =
      document.title.toLowerCase().includes(query) ||
      document.summary.toLowerCase().includes(query) ||
      document.tags.some((tag) => tag.toLowerCase().includes(query));
    const matchesType = selectedType === "all" || document.type === selectedType;
    const matchesCategory =
      selectedCategory === "all" || document.categoryId === selectedCategory;

    return document.isPublished && matchesQuery && matchesType && matchesCategory;
  });

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Bibliotheek"
        title="Actuele documenten en kernboodschappen"
        description="De bibliotheek bundelt protocollen, formats en werkafspraken zodat iedereen met dezelfde informatie werkt."
      />

      <section className="card-surface rounded-[32px] p-6">
        <form className="grid gap-4 xl:grid-cols-[1fr_220px_220px_140px]">
          <input
            type="search"
            name="q"
            defaultValue={params.q}
            placeholder="Zoek op titel, samenvatting of tags"
            className="rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-sm outline-none focus:border-[var(--brand)]"
          />
          <select
            name="type"
            defaultValue={selectedType}
            className="rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-sm outline-none focus:border-[var(--brand)]"
          >
            <option value="all">Alle types</option>
            {["PROTOCOL", "WERKAFSPRAAK", "KERNBOODSCHAP", "FORMAT", "OVERIG"].map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
          <select
            name="category"
            defaultValue={selectedCategory}
            className="rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-sm outline-none focus:border-[var(--brand)]"
          >
            <option value="all">Alle categorieen</option>
            {store.categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
          <button
            type="submit"
            className="rounded-full bg-[var(--brand)] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[var(--brand-deep)]"
          >
            Filteren
          </button>
        </form>
      </section>

      <section className="grid gap-5 xl:grid-cols-2">
        {filteredDocuments.map((document) => {
          const owner = store.users.find((entry) => entry.id === document.ownerId);
          const category = store.categories.find((entry) => entry.id === document.categoryId);

          return (
            <Link
              key={document.id}
              href={`/bibliotheek/${document.id}`}
              className="card-surface rounded-[32px] p-6 transition hover:-translate-y-0.5"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <StatusBadge label={document.type} tone="brand" />
                <p className="text-xs font-medium uppercase tracking-[0.18em] text-[var(--muted)]">
                  Versie {document.version}
                </p>
              </div>
              <h2 className="mt-4 text-2xl font-semibold text-slate-950">{document.title}</h2>
              <p className="mt-3 text-sm leading-7 text-[var(--ink-soft)]">{document.summary}</p>
              <div className="mt-5 flex flex-wrap gap-2">
                {document.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700"
                  >
                    {tag}
                  </span>
                ))}
              </div>
              <p className="mt-5 text-xs font-medium uppercase tracking-[0.18em] text-[var(--muted)]">
                {category?.name} · Eigenaar {owner?.name} · bijgewerkt {document.updatedAt}
              </p>
            </Link>
          );
        })}
      </section>
    </div>
  );
}
