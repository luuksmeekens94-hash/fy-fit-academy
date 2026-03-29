import { notFound } from "next/navigation";

import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { requireUser } from "@/lib/auth";
import { getDocumentById, listCategories, listUsers } from "@/lib/data";

type LibraryDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function LibraryDetailPage({ params }: LibraryDetailPageProps) {
  const user = await requireUser();
  const { id } = await params;
  const [document, users, categories] = await Promise.all([
    getDocumentById(id),
    listUsers(),
    listCategories(),
  ]);

  if (!document) {
    notFound();
  }

  if (!document.isPublished && user.role !== "BEHEERDER") {
    notFound();
  }

  const owner = users.find((entry) => entry.id === document.ownerId);
  const category = categories.find((entry) => entry.id === document.categoryId);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Documentdetail"
        title={document.title}
        description={document.summary}
      />

      <section className="card-surface rounded-[32px] p-6">
        <div className="flex flex-wrap items-center gap-3">
          <StatusBadge label={document.type} tone="brand" />
          <StatusBadge label={`Versie ${document.version}`} tone="neutral" />
          <StatusBadge label={category?.name ?? "Categorie"} tone="warning" />
        </div>
        <p className="mt-4 text-sm leading-7 text-[var(--ink-soft)]">
          Eigenaar: <strong>{owner?.name}</strong> · Laatst bijgewerkt {document.updatedAt}
        </p>
      </section>

      <section className="card-surface rounded-[32px] p-6">
        <div
          className="prose prose-slate max-w-none text-[var(--ink-soft)]"
          dangerouslySetInnerHTML={{ __html: document.content }}
        />
      </section>
    </div>
  );
}
