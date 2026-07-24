import {
  BadgeCheck,
  BookMarked,
  ChevronRight,
  Clock3,
  GraduationCap,
  PlayCircle,
  Search,
} from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

import styles from "@/components/academy/academy-shell.module.css";
import { requireUser } from "@/lib/auth";
import { buildAcademyDashboardModel, getAcademyAssignmentLabel } from "@/lib/academy/dashboard";
import { buildAcademyOverview } from "@/lib/academy/overview";
import { getMyAcademyCourses } from "@/lib/academy/queries";
import type { AcademyCourseCardView } from "@/lib/academy/types";
import { canUsePersonalLms } from "@/lib/roles";

type AcademyPageProps = {
  searchParams: Promise<{ q?: string }>;
};

function statusLabel(status: AcademyCourseCardView["status"]) {
  if (status === "COMPLETED") return "Afgerond";
  if (status === "IN_PROGRESS") return "Bezig";
  return "Nog niet gestart";
}

function statusClass(status: AcademyCourseCardView["status"]) {
  if (status === "COMPLETED") return styles.statusComplete;
  if (status === "IN_PROGRESS") return styles.statusProgress;
  return styles.statusNeutral;
}

function formatDate(date: Date | null) {
  if (!date) return null;

  return new Intl.DateTimeFormat("nl-NL", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

function Progress({ course }: { course: AcademyCourseCardView }) {
  return (
    <div className={styles.progress} aria-label={course.progressLabel}>
      <div className={styles.progressTrack}>
        <span style={{ width: `${course.progressPercentage}%` }} />
      </div>
      <span>{course.progressPercentage}%</span>
    </div>
  );
}

function CourseRow({ course, index }: { course: AcademyCourseCardView; index: number }) {
  const deadline = formatDate(course.deadlineAt);

  return (
    <Link href={course.href} className={styles.courseRow}>
      <div className={index % 2 === 0 ? styles.courseThumbOrange : styles.courseThumbDark} aria-hidden="true">
        <span>{String(index + 1).padStart(2, "0")}</span>
        <strong>FY</strong>
      </div>
      <div className={styles.courseInfo}>
        <div className={styles.courseTitleRow}>
          <div>
            <span>E-learning · {getAcademyAssignmentLabel(course.assignmentLabel)}</span>
            <h3>{course.title}</h3>
          </div>
          <span className={statusClass(course.status)}>{statusLabel(course.status)}</span>
        </div>
        <p className={styles.courseDescription}>{course.description}</p>
        <div className={styles.courseMeta}>
          <span><Clock3 size={14} strokeWidth={1.8} aria-hidden="true" /> {course.studyLoadMinutes} min</span>
          <span><BookMarked size={15} strokeWidth={1.8} aria-hidden="true" /> {deadline ? `Deadline ${deadline}` : course.progressLabel}</span>
        </div>
        <Progress course={course} />
      </div>
      <span className={styles.rowAction} aria-label={`${course.title} openen`}>
        <ChevronRight size={17} strokeWidth={1.8} aria-hidden="true" />
      </span>
    </Link>
  );
}

export default async function AcademyPage({ searchParams }: AcademyPageProps) {
  const user = await requireUser();
  if (!canUsePersonalLms(user.role)) {
    redirect("/");
  }

  const params = await searchParams;
  const courses = await getMyAcademyCourses(user.id);
  const overview = buildAcademyOverview(user.audienceProfile, courses, params.q ?? "");
  const dashboard = buildAcademyDashboardModel(overview);
  const firstName = user.name.trim().split(/\s+/)[0] || user.name;

  return (
    <>
      <header className={styles.pageHeader}>
        <div>
          <span className={styles.eyebrow}>Mijn Academy</span>
          <h1>Goedemorgen, {firstName}</h1>
          <p>{overview.copy.description}</p>
        </div>
        <Link href="/academy/certificates" className={styles.secondaryButton}>
          Mijn certificaten <ChevronRight size={16} strokeWidth={1.8} aria-hidden="true" />
        </Link>
      </header>

      {dashboard.primaryCourse ? (
        <section className={styles.continueCard} aria-labelledby="continue-title">
          <div className={styles.continueCover} aria-hidden="true">
            <span>Fy-fit Academy</span>
            <strong>FY</strong>
            <small>E-learning</small>
          </div>
          <div className={styles.continueBody}>
            <div className={styles.metaRow}>
              <span className={styles.requiredLabel}>{getAcademyAssignmentLabel(dashboard.primaryCourse.assignmentLabel)}</span>
              <span><Clock3 size={14} strokeWidth={1.8} aria-hidden="true" /> {dashboard.primaryCourse.studyLoadMinutes} min</span>
            </div>
            <h2 id="continue-title">{dashboard.primaryCourse.title}</h2>
            <p>{dashboard.primaryCourse.description}</p>
            <div className={styles.continueProgress}>
              <Progress course={dashboard.primaryCourse} />
              <span>{dashboard.primaryCourse.progressLabel}</span>
            </div>
          </div>
          <div className={styles.continueAction}>
            <span>{dashboard.primaryCourse.status === "IN_PROGRESS" ? "Ga verder waar je gebleven bent" : "Klaar om te beginnen"}</span>
            <Link href={dashboard.primaryCourse.href} className={styles.primaryButton}>
              <PlayCircle size={18} strokeWidth={1.8} aria-hidden="true" /> {dashboard.primaryCourse.ctaLabel}
            </Link>
          </div>
        </section>
      ) : null}

      <div className={styles.dashboardGrid}>
        <section className={styles.coursePanel} aria-labelledby="courses-title">
          <div className={styles.sectionHeader}>
            <div>
              <h2 id="courses-title">Mijn e-learnings</h2>
              <p>{overview.copy.title}</p>
            </div>
          </div>

          <form className={styles.dashboardSearch} action="/academy">
            <Search size={17} strokeWidth={1.8} aria-hidden="true" />
            <input
              type="search"
              name="q"
              defaultValue={params.q}
              aria-label="Zoeken in mijn e-learnings"
              placeholder="Zoek een e-learning"
            />
            <button type="submit">Zoeken</button>
            {overview.isSearching ? <Link href="/academy">Wissen</Link> : null}
          </form>

          {dashboard.sections.length > 0 ? (
            <div className={styles.courseSections}>
              {dashboard.sections.map((section, sectionIndex) => (
                <section className={styles.courseSection} key={section.id} aria-labelledby={`section-${section.id}`}>
                  <div className={styles.courseSectionHeader}>
                    <div>
                      <h3 id={`section-${section.id}`}>{section.title}</h3>
                      <p>{section.description}</p>
                    </div>
                    <span>{section.courses.length}</span>
                  </div>
                  <div className={styles.courseList}>
                    {section.courses.map((course, courseIndex) => (
                      <CourseRow key={`${section.id}-${course.id}`} course={course} index={sectionIndex + courseIndex} />
                    ))}
                  </div>
                </section>
              ))}
            </div>
          ) : dashboard.primaryCourse ? (
            <div className={styles.emptyState}>
              <GraduationCap size={22} strokeWidth={1.7} aria-hidden="true" />
              <div>
                <h3>Je actuele e-learning staat hierboven</h3>
                <p>Er zijn op dit moment geen andere onderdelen om te tonen.</p>
              </div>
            </div>
          ) : (
            <div className={styles.emptyState}>
              <GraduationCap size={22} strokeWidth={1.7} aria-hidden="true" />
              <div>
                <h3>{overview.emptyState.title}</h3>
                <p>{overview.emptyState.text}</p>
              </div>
            </div>
          )}
        </section>

        <aside className={styles.rightRail}>
          <section className={styles.agendaCard} aria-labelledby="academy-stats-title">
            <div className={styles.railHeader}>
              <h2 id="academy-stats-title">Jouw overzicht</h2>
              <span className={styles.railIcon}><GraduationCap size={18} strokeWidth={1.8} aria-hidden="true" /></span>
            </div>
            <dl className={styles.statsList}>
              <div><dt>Beschikbaar</dt><dd>{dashboard.stats.total}</dd></div>
              <div><dt>Bezig</dt><dd>{dashboard.stats.inProgress}</dd></div>
              <div><dt>Afgerond</dt><dd>{dashboard.stats.completed}</dd></div>
            </dl>
            <div className={styles.focusTags} aria-label="Onderwerpen voor jouw doelgroep">
              {overview.copy.focusTags.map((tag) => <span key={tag}>{tag}</span>)}
            </div>
          </section>

          <Link href="/academy/certificates" className={styles.completedCard}>
            <div className={styles.completedIcon}><BadgeCheck size={20} strokeWidth={1.8} aria-hidden="true" /></div>
            <div>
              <span>Afgerond</span>
              <strong>{dashboard.stats.completed} e-learning{dashboard.stats.completed === 1 ? "" : "s"}</strong>
              <small>Bekijk je certificaten en deelnamebewijzen</small>
            </div>
            <span className={styles.rowAction} aria-hidden="true"><ChevronRight size={17} strokeWidth={1.8} /></span>
          </Link>
        </aside>
      </div>
    </>
  );
}
