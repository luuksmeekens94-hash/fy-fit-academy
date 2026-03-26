import { notFound } from "next/navigation";

import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { requireUser } from "@/lib/auth";
import { getDocumentById, getStore } from "@/lib/demo-data";

type LibraryDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function LibraryDetailPage({ params }: LibraryDetailPageProps) {
  await requireUser();
  const { id } = await params;
  const store = getStore();
  const document = getDocumentById(id);

  if (!document) {
    notFound();
  }

  const owner = store.users.find((entry) => entry.id === document.ownerId);
  const category = store.categories.find((entry) => entry.id === document.categoryId);

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
        <div className="space-y-5">
          {document.content.map((paragraph) => (
            <p key={paragraph} className="text-base leading-8 text-[var(--ink-soft)]">
              {paragraph}
            </p>
          ))}
        </div>
      </section>
    </div>
  );
}
