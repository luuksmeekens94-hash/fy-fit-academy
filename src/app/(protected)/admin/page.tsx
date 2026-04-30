import {
  deactivateUserAction,
  deleteCategoryAction,
  deleteDocumentAction,
  deleteModuleAction,
  saveCategoryAction,
  saveDocumentAction,
  saveModuleAction,
  saveOnboardingPathAction,
  saveUserAction,
  setModuleStatusAction,
  setOnboardingPathActiveAction,
} from "@/app/actions";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { requireRole } from "@/lib/auth";
import { getAdminOverview, listActiveUsers } from "@/lib/data";

function formatModuleSections(
  sections: Array<{ order: number; title: string; type: string; content: string }>,
) {
  return sections
    .map((section) => `${section.order}||${section.title}||${section.type}||${section.content}`)
    .join("\n");
}

function formatPathSteps(
  steps: Array<{
    order: number;
    title: string;
    contentType: string;
    isRequired: boolean;
    description: string;
    content: string;
  }>,
) {
  return steps
    .map(
      (step) =>
        `${step.order}||${step.title}||${step.contentType}||${step.isRequired ? "ja" : "nee"}||${step.description}||${step.content}`,
    )
    .join("\n");
}

export default async function AdminPage() {
  await requireRole(["BEHEERDER"]);
  const [overview, activeUsers] = await Promise.all([getAdminOverview(), listActiveUsers()]);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Admin"
        title="Beheer van inhoud, mensen en lijnen"
        description="Deze beheerpagina werkt nu op echte databasegegevens en gebruikt server actions voor alle mutaties."
      />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Gebruikers", value: overview.metrics.users, tone: "brand" as const },
          { label: "Modules", value: overview.metrics.modules, tone: "warning" as const },
          { label: "Bibliotheekitems", value: overview.metrics.documents, tone: "success" as const },
          {
            label: "Ontwikkelitems",
            value: overview.metrics.developmentItems,
            tone: "neutral" as const,
          },
        ].map((metric) => (
          <div key={metric.label} className="card-surface rounded-[28px] p-5">
            <StatusBadge label={metric.label} tone={metric.tone} />
            <p className="mt-5 text-4xl font-semibold text-slate-950">{metric.value}</p>
          </div>
        ))}
      </section>

      <section className="grid gap-6">
        <div className="card-surface rounded-[32px] p-6">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[var(--brand-deep)]">
            Categorieen
          </p>
          <form action={saveCategoryAction} className="mt-6 grid gap-3 rounded-[28px] bg-[var(--brand-soft)] p-5 md:grid-cols-4">
            <input name="name" placeholder="Nieuwe categorie" className="rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-sm outline-none focus:border-[var(--brand)]" required />
            <input name="icon" placeholder="Icoonlabel" className="rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-sm outline-none focus:border-[var(--brand)]" />
            <input name="order" type="number" defaultValue={overview.categories.length + 1} className="rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-sm outline-none focus:border-[var(--brand)]" />
            <button type="submit" className="rounded-full bg-[var(--brand)] px-5 py-3 text-sm font-semibold text-white">Categorie opslaan</button>
          </form>
          <div className="mt-6 space-y-4">
            {overview.categories.map((category) => (
              <div key={category.id} className="rounded-[24px] border border-[var(--border)] bg-white/85 p-5">
                <form action={saveCategoryAction} className="grid gap-3 md:grid-cols-[1.3fr_1fr_120px_160px]">
                  <input type="hidden" name="categoryId" value={category.id} />
                  <input name="name" defaultValue={category.name} className="rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-sm outline-none focus:border-[var(--brand)]" required />
                  <input name="icon" defaultValue={category.icon} className="rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-sm outline-none focus:border-[var(--brand)]" />
                  <input name="order" type="number" defaultValue={category.order} className="rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-sm outline-none focus:border-[var(--brand)]" />
                  <button type="submit" className="rounded-full bg-[var(--brand)] px-5 py-3 text-sm font-semibold text-white">Bijwerken</button>
                </form>
                <form action={deleteCategoryAction} className="mt-3">
                  <input type="hidden" name="categoryId" value={category.id} />
                  <button type="submit" className="text-sm font-semibold text-[var(--danger)]">Verwijderen</button>
                </form>
              </div>
            ))}
          </div>
        </div>

        <div className="card-surface rounded-[32px] p-6">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[var(--teal)]">Modules</p>
          <p className="mt-2 text-sm leading-6 text-[var(--ink-soft)]">
            Secties invoeren als `volgorde||titel||type||inhoud`, een regel per sectie.
          </p>
          <form action={saveModuleAction} className="mt-6 grid gap-3 rounded-[28px] bg-[var(--teal-soft)] p-5">
            <input name="title" placeholder="Nieuwe module" className="rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-sm outline-none focus:border-[var(--teal)]" required />
            <textarea name="description" rows={3} placeholder="Beschrijving" className="rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-sm outline-none focus:border-[var(--teal)]" required />
            <div className="grid gap-3 md:grid-cols-4">
              <select name="categoryId" className="rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-sm outline-none focus:border-[var(--teal)]" required>
                <option value="">Categorie</option>
                {overview.categories.map((category) => (
                  <option key={category.id} value={category.id}>{category.name}</option>
                ))}
              </select>
              <input name="thumbnailLabel" placeholder="Thumbnail label" className="rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-sm outline-none focus:border-[var(--teal)]" />
              <input name="estimatedMinutes" type="number" defaultValue={15} className="rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-sm outline-none focus:border-[var(--teal)]" />
              <select name="status" defaultValue="CONCEPT" className="rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-sm outline-none focus:border-[var(--teal)]">
                <option value="CONCEPT">Concept</option>
                <option value="GEPUBLICEERD">Gepubliceerd</option>
                <option value="GEARCHIVEERD">Gearchiveerd</option>
              </select>
            </div>
            <label className="flex items-center gap-3 text-sm font-medium text-slate-900">
              <input type="checkbox" name="isRequired" className="h-4 w-4" />
              Verplichte module
            </label>
            <textarea name="sections" rows={6} placeholder="1||Intro||TEXT||Inhoud" className="rounded-2xl border border-[var(--border)] bg-white px-4 py-3 font-mono text-sm outline-none focus:border-[var(--teal)]" required />
            <button type="submit" className="rounded-full bg-[var(--teal)] px-5 py-3 text-sm font-semibold text-white">Module aanmaken</button>
          </form>
          <div className="mt-6 space-y-4">
            {overview.modules.map((module) => (
              <div key={module.id} className="rounded-[24px] border border-[var(--border)] bg-white/85 p-5">
                <div className="mb-4 flex flex-wrap gap-3">
                  <StatusBadge label={module.status} tone="warning" />
                  {module.isRequired ? <StatusBadge label="Verplicht" tone="brand" /> : null}
                </div>
                <form action={saveModuleAction} className="grid gap-3">
                  <input type="hidden" name="moduleId" value={module.id} />
                  <input name="title" defaultValue={module.title} className="rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-sm outline-none focus:border-[var(--teal)]" required />
                  <textarea name="description" rows={3} defaultValue={module.description} className="rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-sm outline-none focus:border-[var(--teal)]" required />
                  <div className="grid gap-3 md:grid-cols-4">
                    <select name="categoryId" defaultValue={module.categoryId} className="rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-sm outline-none focus:border-[var(--teal)]">
                      {overview.categories.map((category) => (
                        <option key={category.id} value={category.id}>{category.name}</option>
                      ))}
                    </select>
                    <input name="thumbnailLabel" defaultValue={module.thumbnailLabel ?? ""} className="rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-sm outline-none focus:border-[var(--teal)]" />
                    <input name="estimatedMinutes" type="number" defaultValue={module.estimatedMinutes} className="rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-sm outline-none focus:border-[var(--teal)]" />
                    <select name="status" defaultValue={module.status} className="rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-sm outline-none focus:border-[var(--teal)]">
                      <option value="CONCEPT">Concept</option>
                      <option value="GEPUBLICEERD">Gepubliceerd</option>
                      <option value="GEARCHIVEERD">Gearchiveerd</option>
                    </select>
                  </div>
                  <label className="flex items-center gap-3 text-sm font-medium text-slate-900">
                    <input type="checkbox" name="isRequired" defaultChecked={module.isRequired} className="h-4 w-4" />
                    Verplichte module
                  </label>
                  <textarea name="sections" rows={6} defaultValue={formatModuleSections(module.sections)} className="rounded-2xl border border-[var(--border)] bg-white px-4 py-3 font-mono text-sm outline-none focus:border-[var(--teal)]" required />
                  <button type="submit" className="rounded-full bg-[var(--teal)] px-5 py-3 text-sm font-semibold text-white">Opslaan</button>
                </form>
                <div className="mt-3 flex flex-wrap gap-3">
                  <form action={setModuleStatusAction}>
                    <input type="hidden" name="moduleId" value={module.id} />
                    <input type="hidden" name="status" value="GEPUBLICEERD" />
                    <button type="submit" className="rounded-full border border-[var(--border)] px-5 py-3 text-sm font-semibold text-slate-900">Publiceren</button>
                  </form>
                  <form action={setModuleStatusAction}>
                    <input type="hidden" name="moduleId" value={module.id} />
                    <input type="hidden" name="status" value="GEARCHIVEERD" />
                    <button type="submit" className="rounded-full border border-[var(--border)] px-5 py-3 text-sm font-semibold text-slate-900">Archiveren</button>
                  </form>
                  <form action={deleteModuleAction}>
                    <input type="hidden" name="moduleId" value={module.id} />
                    <button type="submit" className="rounded-full border border-[var(--danger)] px-5 py-3 text-sm font-semibold text-[var(--danger)]">Verwijderen</button>
                  </form>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card-surface rounded-[32px] p-6">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[var(--brand-deep)]">Bibliotheek</p>
          <p className="mt-2 text-sm leading-6 text-[var(--ink-soft)]">Documentinhoud opslaan als HTML-string.</p>
          <form action={saveDocumentAction} className="mt-6 grid gap-3 rounded-[28px] bg-[var(--brand-soft)] p-5">
            <input name="title" placeholder="Nieuw document" className="rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-sm outline-none focus:border-[var(--brand)]" required />
            <div className="grid gap-3 md:grid-cols-4">
              <select name="type" defaultValue="PROTOCOL" className="rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-sm outline-none focus:border-[var(--brand)]">
                <option value="PROTOCOL">Protocol</option>
                <option value="WERKAFSPRAAK">Werkafspraak</option>
                <option value="KERNBOODSCHAP">Kernboodschap</option>
                <option value="FORMAT">Format</option>
                <option value="OVERIG">Overig</option>
              </select>
              <select name="categoryId" className="rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-sm outline-none focus:border-[var(--brand)]" required>
                <option value="">Categorie</option>
                {overview.categories.map((category) => (
                  <option key={category.id} value={category.id}>{category.name}</option>
                ))}
              </select>
              <input name="version" defaultValue="1.0" placeholder="Versie" className="rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-sm outline-none focus:border-[var(--brand)]" required />
              <label className="flex items-center gap-3 rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-sm font-medium text-slate-900">
                <input type="checkbox" name="isPublished" defaultChecked className="h-4 w-4" />
                Gepubliceerd
              </label>
            </div>
            <input name="summary" placeholder="Samenvatting" className="rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-sm outline-none focus:border-[var(--brand)]" required />
            <input name="tags" placeholder="Tags, gescheiden door komma's" className="rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-sm outline-none focus:border-[var(--brand)]" />
            <textarea name="content" rows={6} placeholder="<p>Inhoud</p>" className="rounded-2xl border border-[var(--border)] bg-white px-4 py-3 font-mono text-sm outline-none focus:border-[var(--brand)]" required />
            <button type="submit" className="rounded-full bg-[var(--brand)] px-5 py-3 text-sm font-semibold text-white">Document aanmaken</button>
          </form>
          <div className="mt-6 space-y-4">
            {overview.documents.map((document) => (
              <div key={document.id} className="rounded-[24px] border border-[var(--border)] bg-white/85 p-5">
                <div className="mb-4 flex flex-wrap gap-3">
                  <StatusBadge label={document.type} tone="brand" />
                  <StatusBadge label={document.isPublished ? "Gepubliceerd" : "Concept"} tone={document.isPublished ? "success" : "warning"} />
                </div>
                <form action={saveDocumentAction} className="grid gap-3">
                  <input type="hidden" name="documentId" value={document.id} />
                  <input name="title" defaultValue={document.title} className="rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-sm outline-none focus:border-[var(--brand)]" required />
                  <div className="grid gap-3 md:grid-cols-4">
                    <select name="type" defaultValue={document.type} className="rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-sm outline-none focus:border-[var(--brand)]">
                      <option value="PROTOCOL">Protocol</option>
                      <option value="WERKAFSPRAAK">Werkafspraak</option>
                      <option value="KERNBOODSCHAP">Kernboodschap</option>
                      <option value="FORMAT">Format</option>
                      <option value="OVERIG">Overig</option>
                    </select>
                    <select name="categoryId" defaultValue={document.categoryId} className="rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-sm outline-none focus:border-[var(--brand)]">
                      {overview.categories.map((category) => (
                        <option key={category.id} value={category.id}>{category.name}</option>
                      ))}
                    </select>
                    <input name="version" defaultValue={document.version} className="rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-sm outline-none focus:border-[var(--brand)]" required />
                    <label className="flex items-center gap-3 rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-sm font-medium text-slate-900">
                      <input type="checkbox" name="isPublished" defaultChecked={document.isPublished} className="h-4 w-4" />
                      Gepubliceerd
                    </label>
                  </div>
                  <input name="summary" defaultValue={document.summary} className="rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-sm outline-none focus:border-[var(--brand)]" required />
                  <input name="tags" defaultValue={document.tags.join(", ")} className="rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-sm outline-none focus:border-[var(--brand)]" />
                  <textarea name="content" rows={6} defaultValue={document.content} className="rounded-2xl border border-[var(--border)] bg-white px-4 py-3 font-mono text-sm outline-none focus:border-[var(--brand)]" required />
                  <button type="submit" className="rounded-full bg-[var(--brand)] px-5 py-3 text-sm font-semibold text-white">Opslaan</button>
                </form>
                <form action={deleteDocumentAction} className="mt-3">
                  <input type="hidden" name="documentId" value={document.id} />
                  <button type="submit" className="rounded-full border border-[var(--danger)] px-5 py-3 text-sm font-semibold text-[var(--danger)]">Verwijderen</button>
                </form>
              </div>
            ))}
          </div>
        </div>

        <div className="card-surface rounded-[32px] p-6">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[var(--teal)]">Gebruikers</p>
          <form action={saveUserAction} className="mt-6 grid gap-3 rounded-[28px] bg-[var(--teal-soft)] p-5">
            <div className="grid gap-3 md:grid-cols-2">
              <input name="name" placeholder="Naam" className="rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-sm outline-none focus:border-[var(--teal)]" required />
              <input name="email" type="email" placeholder="E-mailadres" className="rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-sm outline-none focus:border-[var(--teal)]" required />
            </div>
            <div className="grid gap-3 md:grid-cols-5">
              <select name="role" defaultValue="MEDEWERKER" className="rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-sm outline-none focus:border-[var(--teal)]">
                <option value="MEDEWERKER">Medewerker</option>
                <option value="TEAMLEIDER">Teamleider</option>
                <option value="BEHEERDER">Beheerder</option>
                <option value="REVIEWER">Reviewer</option>
              </select>
              <input name="team" placeholder="Team" className="rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-sm outline-none focus:border-[var(--teal)]" />
              <input name="professionalRegistrationNumber" placeholder="BIG/KRF/SKF registratienummer" className="rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-sm outline-none focus:border-[var(--teal)]" />
              <input name="title" placeholder="Functie" className="rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-sm outline-none focus:border-[var(--teal)]" required />
              <input name="location" placeholder="Locatie" className="rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-sm outline-none focus:border-[var(--teal)]" required />
            </div>
            <div className="grid gap-3 md:grid-cols-4">
              <select name="teamleaderId" defaultValue="" className="rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-sm outline-none focus:border-[var(--teal)]">
                <option value="">Geen teamleider</option>
                {activeUsers.map((entry) => (
                  <option key={entry.id} value={entry.id}>{entry.name}</option>
                ))}
              </select>
              <select name="buddyId" defaultValue="" className="rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-sm outline-none focus:border-[var(--teal)]">
                <option value="">Geen buddy</option>
                {activeUsers.map((entry) => (
                  <option key={entry.id} value={entry.id}>{entry.name}</option>
                ))}
              </select>
              <input name="avatarColor" defaultValue="bg-[var(--brand)]" placeholder="Avatar kleurclass" className="rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-sm outline-none focus:border-[var(--teal)]" />
              <input name="initialPassword" type="password" placeholder="Initieel wachtwoord" className="rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-sm outline-none focus:border-[var(--teal)]" required />
            </div>
            <textarea name="bio" rows={3} placeholder="Korte bio" className="rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-sm outline-none focus:border-[var(--teal)]" required />
            <label className="flex items-center gap-3 text-sm font-medium text-slate-900">
              <input type="checkbox" name="isOnboarding" className="h-4 w-4" />
              Onboarding actief
            </label>
            <button type="submit" className="rounded-full bg-[var(--teal)] px-5 py-3 text-sm font-semibold text-white">Gebruiker aanmaken</button>
          </form>
          <div className="mt-6 space-y-4">
            {overview.users.map((user) => (
              <div key={user.id} className="rounded-[24px] border border-[var(--border)] bg-white/85 p-5">
                <div className="mb-4 flex flex-wrap gap-3">
                  <StatusBadge label={user.role} tone="brand" />
                  <StatusBadge label={user.isActive ? "Actief" : "Gedeactiveerd"} tone={user.isActive ? "success" : "warning"} />
                </div>
                <form action={saveUserAction} className="grid gap-3">
                  <input type="hidden" name="userId" value={user.id} />
                  <div className="grid gap-3 md:grid-cols-2">
                    <input name="name" defaultValue={user.name} className="rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-sm outline-none focus:border-[var(--teal)]" required />
                    <input name="email" type="email" defaultValue={user.email} className="rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-sm outline-none focus:border-[var(--teal)]" required />
                  </div>
                  <div className="grid gap-3 md:grid-cols-5">
                    <select name="role" defaultValue={user.role} className="rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-sm outline-none focus:border-[var(--teal)]">
                      <option value="MEDEWERKER">Medewerker</option>
                      <option value="TEAMLEIDER">Teamleider</option>
                      <option value="BEHEERDER">Beheerder</option>
                      <option value="REVIEWER">Reviewer</option>
                    </select>
                    <input name="team" defaultValue={user.team ?? ""} className="rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-sm outline-none focus:border-[var(--teal)]" />
                    <input name="professionalRegistrationNumber" defaultValue={user.professionalRegistrationNumber ?? ""} placeholder="BIG/KRF/SKF" className="rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-sm outline-none focus:border-[var(--teal)]" />
                    <input name="title" defaultValue={user.title} className="rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-sm outline-none focus:border-[var(--teal)]" required />
                    <input name="location" defaultValue={user.location} className="rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-sm outline-none focus:border-[var(--teal)]" required />
                  </div>
                  <div className="grid gap-3 md:grid-cols-4">
                    <select name="teamleaderId" defaultValue={user.teamleaderId ?? ""} className="rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-sm outline-none focus:border-[var(--teal)]">
                      <option value="">Geen teamleider</option>
                      {activeUsers.map((entry) => (
                        <option key={entry.id} value={entry.id}>{entry.name}</option>
                      ))}
                    </select>
                    <select name="buddyId" defaultValue={user.buddyId ?? ""} className="rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-sm outline-none focus:border-[var(--teal)]">
                      <option value="">Geen buddy</option>
                      {activeUsers.map((entry) => (
                        <option key={entry.id} value={entry.id}>{entry.name}</option>
                      ))}
                    </select>
                    <input name="avatarColor" defaultValue={user.avatarColor} className="rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-sm outline-none focus:border-[var(--teal)]" />
                    <input name="initialPassword" type="password" placeholder="Nieuw wachtwoord" className="rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-sm outline-none focus:border-[var(--teal)]" />
                  </div>
                  <textarea name="bio" rows={3} defaultValue={user.bio} className="rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-sm outline-none focus:border-[var(--teal)]" required />
                  <label className="flex items-center gap-3 text-sm font-medium text-slate-900">
                    <input type="checkbox" name="isOnboarding" defaultChecked={user.isOnboarding} className="h-4 w-4" />
                    Onboarding actief
                  </label>
                  <button type="submit" className="rounded-full bg-[var(--teal)] px-5 py-3 text-sm font-semibold text-white">Opslaan</button>
                </form>
                {user.isActive ? (
                  <form action={deactivateUserAction} className="mt-3">
                    <input type="hidden" name="userId" value={user.id} />
                    <button type="submit" className="rounded-full border border-[var(--danger)] px-5 py-3 text-sm font-semibold text-[var(--danger)]">Deactiveren</button>
                  </form>
                ) : null}
              </div>
            ))}
          </div>
        </div>

        <div className="card-surface rounded-[32px] p-6">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[var(--brand-deep)]">Onboardingpaden</p>
          <p className="mt-2 text-sm leading-6 text-[var(--ink-soft)]">
            Stappen invoeren als `volgorde||titel||type||ja/nee||beschrijving||inhoud`.
          </p>
          <form action={saveOnboardingPathAction} className="mt-6 grid gap-3 rounded-[28px] bg-[var(--brand-soft)] p-5">
            <input name="name" placeholder="Nieuw pad" className="rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-sm outline-none focus:border-[var(--brand)]" required />
            <textarea name="description" rows={3} placeholder="Beschrijving" className="rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-sm outline-none focus:border-[var(--brand)]" required />
            <label className="flex items-center gap-3 text-sm font-medium text-slate-900">
              <input type="checkbox" name="isActive" className="h-4 w-4" />
              Actief pad
            </label>
            <textarea name="steps" rows={6} placeholder="1||Welkom||TEXT||ja||Beschrijving||Inhoud" className="rounded-2xl border border-[var(--border)] bg-white px-4 py-3 font-mono text-sm outline-none focus:border-[var(--brand)]" required />
            <button type="submit" className="rounded-full bg-[var(--brand)] px-5 py-3 text-sm font-semibold text-white">Pad aanmaken</button>
          </form>
          <div className="mt-6 space-y-4">
            {overview.onboardingPaths.map((path) => (
              <div key={path.id} className="rounded-[24px] border border-[var(--border)] bg-white/85 p-5">
                <div className="mb-4 flex flex-wrap gap-3">
                  <StatusBadge label={path.isActive ? "Actief" : "Inactief"} tone={path.isActive ? "success" : "neutral"} />
                  <StatusBadge label={`${path.steps.length} stappen`} tone="warning" />
                </div>
                <form action={saveOnboardingPathAction} className="grid gap-3">
                  <input type="hidden" name="pathId" value={path.id} />
                  <input name="name" defaultValue={path.name} className="rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-sm outline-none focus:border-[var(--brand)]" required />
                  <textarea name="description" rows={3} defaultValue={path.description} className="rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-sm outline-none focus:border-[var(--brand)]" required />
                  <label className="flex items-center gap-3 text-sm font-medium text-slate-900">
                    <input type="checkbox" name="isActive" defaultChecked={path.isActive} className="h-4 w-4" />
                    Actief pad
                  </label>
                  <textarea name="steps" rows={6} defaultValue={formatPathSteps(path.steps)} className="rounded-2xl border border-[var(--border)] bg-white px-4 py-3 font-mono text-sm outline-none focus:border-[var(--brand)]" required />
                  <button type="submit" className="rounded-full bg-[var(--brand)] px-5 py-3 text-sm font-semibold text-white">Opslaan</button>
                </form>
                <form action={setOnboardingPathActiveAction} className="mt-3">
                  <input type="hidden" name="pathId" value={path.id} />
                  <input type="hidden" name="isActive" value={path.isActive ? "false" : "true"} />
                  <button type="submit" className="rounded-full border border-[var(--border)] px-5 py-3 text-sm font-semibold text-slate-900">
                    {path.isActive ? "Deactiveren" : "Activeren"}
                  </button>
                </form>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
