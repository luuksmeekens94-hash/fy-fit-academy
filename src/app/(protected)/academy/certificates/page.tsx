import Link from "next/link";
import { redirect } from "next/navigation";

import { PageHeader } from "@/components/page-header";
import { StatCard } from "@/components/stat-card";
import { requireUser } from "@/lib/auth";
import { buildCertificateArchiveSummary } from "@/lib/lms/certificate-archive";
import { getMyCertificates } from "@/lib/lms/queries";
import { canUsePersonalLms } from "@/lib/roles";

function formatDate(value: Date | null) {
  if (!value) {
    return "Niet vastgelegd";
  }

  return new Intl.DateTimeFormat("nl-NL", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(value);
}

function formatStudyLoad(minutes: number) {
  if (!minutes) {
    return "0 min";
  }

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  if (!hours) {
    return `${remainingMinutes} min`;
  }

  return remainingMinutes ? `${hours} u ${remainingMinutes} min` : `${hours} u`;
}

export default async function AcademyCertificatesPage() {
  const user = await requireUser();
  if (!canUsePersonalLms(user.role)) {
    redirect("/");
  }

  const certificates = await getMyCertificates(user.id);
  const archive = buildCertificateArchiveSummary(certificates, {
    downloadBasePath: "/academy/certificates",
  });

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Fy-fit Academy · Bewijs"
        title="Mijn certificaten"
        description="Je persoonlijke archief met deelnamebewijzen, accreditatiegegevens en printwaardige downloads. Netjes bij elkaar, zonder LMS-omweg."
      />

      <section className="grid gap-4 lg:grid-cols-4">
        <StatCard
          label="Certificaten"
          value={String(archive.totalCertificates)}
          detail="Aantal uitgereikte deelnamebewijzen in je archief."
        />
        <StatCard
          label="Studielast"
          value={formatStudyLoad(archive.totalStudyLoadMinutes)}
          detail="Totaal geregistreerde studielast over je certificaten."
        />
        <StatCard
          label="Evaluaties"
          value={String(archive.completedEvaluations)}
          detail="Aantal bewijzen met afgeronde evaluatie."
        />
        <StatCard
          label="Registratie ontbreekt"
          value={String(archive.missingRegistrationNumbers)}
          detail="Bewijzen zonder BIG/KRF/SKF-nummer in de snapshot."
        />
      </section>

      {archive.items.length ? (
        <section className="space-y-4">
          {archive.items.map((certificate) => (
            <article key={certificate.id} className="card-surface overflow-hidden rounded-[28px] p-0">
              <div className="grid gap-0 lg:grid-cols-[1fr_280px]">
                <div className="space-y-4 p-5 sm:p-6">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--brand-primary)]">
                      {certificate.accreditationRegister ?? "Deelnamebewijs"}
                    </p>
                    <h2 className="mt-2 text-2xl font-semibold text-slate-950">
                      {certificate.courseTitle}
                    </h2>
                  </div>
                  <dl className="grid gap-3 text-sm text-[var(--ink-soft)] sm:grid-cols-2 xl:grid-cols-3">
                    <div>
                      <dt className="font-semibold text-slate-900">Deelnemer</dt>
                      <dd>{certificate.participantName ?? user.name}</dd>
                    </div>
                    <div>
                      <dt className="font-semibold text-slate-900">Registratienummer</dt>
                      <dd>{certificate.displayRegistrationNumber}</dd>
                    </div>
                    <div>
                      <dt className="font-semibold text-slate-900">Afgerond op</dt>
                      <dd>{formatDate(certificate.completedAt ?? certificate.issuedAt)}</dd>
                    </div>
                    <div>
                      <dt className="font-semibold text-slate-900">Score</dt>
                      <dd>
                        {certificate.scorePercentage !== null
                          ? `${Math.round(certificate.scorePercentage)}%`
                          : "Niet vastgelegd"}
                      </dd>
                    </div>
                    <div>
                      <dt className="font-semibold text-slate-900">Pogingen</dt>
                      <dd>{certificate.attemptCount ?? "Niet vastgelegd"}</dd>
                    </div>
                    <div>
                      <dt className="font-semibold text-slate-900">Versie</dt>
                      <dd>{certificate.versionNumber}</dd>
                    </div>
                  </dl>
                </div>
                <aside className="flex flex-col justify-between gap-4 border-t border-[var(--border)] bg-[var(--brand-soft)] p-5 lg:border-l lg:border-t-0">
                  <div className="space-y-2">
                    <span className="inline-flex rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-700 shadow-sm">
                      Code {certificate.certificateCode}
                    </span>
                    <p className="text-sm leading-6 text-[var(--ink-soft)]">
                      Print of download dit bewijs als PDF voor je eigen dossier of accreditatiecontrole.
                    </p>
                  </div>
                  <div className="flex flex-col gap-2">
                    <Link className="btn-primary justify-center" href={certificate.downloadPath}>
                      Open / print bewijs
                    </Link>
                    <Link className="btn-secondary justify-center" href={`/academy`}>
                      Terug naar Academy
                    </Link>
                  </div>
                </aside>
              </div>
            </article>
          ))}
        </section>
      ) : (
        <section className="card-surface rounded-[28px] p-6">
          <h2 className="text-xl font-semibold text-slate-950">Nog geen certificaten</h2>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-[var(--ink-soft)]">
            Zodra je een Academy e-learning volledig afrondt, verschijnt je deelnamebewijs hier automatisch.
          </p>
          <Link className="btn-primary mt-5 inline-flex" href="/academy">
            Terug naar Fy-fit Academy
          </Link>
        </section>
      )}
    </div>
  );
}
