"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import {
  BadgeCheck,
  Bell,
  BookMarked,
  CalendarDays,
  ChevronRight,
  Clock3,
  GraduationCap,
  LayoutDashboard,
  Library,
  Menu,
  PlayCircle,
  Search,
  Target,
} from "lucide-react";

import styles from "./academy-concept.module.css";

type CourseFilter = "Alles" | "Bezig" | "Afgerond";
type CourseStatus = "Bezig" | "Nog niet gestart" | "Afgerond";

type Course = {
  id: string;
  title: string;
  category: string;
  duration: string;
  modules: number;
  progress: number;
  status: CourseStatus;
  mandatory?: boolean;
};

const navigation = [
  { label: "Overzicht", icon: LayoutDashboard, active: true },
  { label: "Mijn e-learnings", icon: GraduationCap },
  { label: "Ontwikkeling", icon: Target },
  { label: "Bibliotheek", icon: Library },
  { label: "Certificaten", icon: BadgeCheck },
];

const courses: Course[] = [
  {
    id: "veilig-werken",
    title: "Veilig en verantwoord werken",
    category: "Praktijkafspraken",
    duration: "45 min",
    modules: 3,
    progress: 35,
    status: "Bezig",
    mandatory: true,
  },
  {
    id: "klinisch-redeneren",
    title: "Klinisch redeneren bij knieklachten",
    category: "Vakinhoudelijk",
    duration: "90 min",
    modules: 4,
    progress: 0,
    status: "Nog niet gestart",
  },
  {
    id: "communicatie",
    title: "Communicatie en vertrouwen",
    category: "Patiëntcommunicatie",
    duration: "60 min",
    modules: 4,
    progress: 100,
    status: "Afgerond",
  },
];

function Progress({ value }: { value: number }) {
  return (
    <div className={styles.progress} aria-label={`${value}% afgerond`}>
      <div className={styles.progressTrack}><span style={{ width: `${value}%` }} /></div>
      <span>{value}%</span>
    </div>
  );
}

export default function AcademyConceptPage() {
  const [filter, setFilter] = useState<CourseFilter>("Alles");
  const [notice, setNotice] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const visibleCourses = useMemo(() => {
    if (filter === "Bezig") return courses.filter((course) => course.status === "Bezig");
    if (filter === "Afgerond") return courses.filter((course) => course.status === "Afgerond");
    return courses;
  }, [filter]);

  function showNotice(message: string) {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 2400);
  }

  return (
    <main className={styles.page}>
      <div className={styles.prototypeFlag}>Visueel prototype · voorbeeldinhoud · geen databasekoppeling</div>

      <div className={styles.shell}>
        <aside className={`${styles.sidebar} ${mobileMenuOpen ? styles.sidebarOpen : ""}`}>
          <div className={styles.logoPanel}>
            <Image src="/fyfit-logo-transparent.png" alt="Fy-fit" width={744} height={196} quality={100} priority />
          </div>
          <span className={styles.productName}>Academy</span>

          <nav className={styles.primaryNav} aria-label="Conceptnavigatie">
            {navigation.map((item) => {
              const NavigationIcon = item.icon;
              return (
                <button
                  type="button"
                  key={item.label}
                  className={item.active ? styles.navItemActive : styles.navItem}
                  onClick={() => showNotice(`${item.label} is onderdeel van het prototype.`)}
                >
                  <NavigationIcon size={18} strokeWidth={1.8} aria-hidden="true" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          <div className={styles.sidebarFooter}>
            <button type="button" className={styles.profileButton} onClick={() => showNotice("Hier opent straks het profielmenu.")}>
              <span className={styles.avatar}>LS</span>
              <span><strong>Luuk Smeekens</strong><small>Fysiotherapeut</small></span>
              <ChevronRight size={16} strokeWidth={1.8} aria-hidden="true" />
            </button>
          </div>
        </aside>

        {mobileMenuOpen ? <button className={styles.backdrop} type="button" aria-label="Menu sluiten" onClick={() => setMobileMenuOpen(false)} /> : null}

        <section className={styles.workspace}>
          <header className={styles.topbar}>
            <button type="button" className={styles.mobileMenuButton} aria-label="Menu openen" onClick={() => setMobileMenuOpen(true)}>
              <Menu size={21} strokeWidth={1.8} aria-hidden="true" />
            </button>
            <div className={styles.mobileBrand}>
              <Image src="/fyfit-logo-transparent.png" alt="Fy-fit" width={744} height={196} quality={100} />
              <span>Academy</span>
            </div>
            <label className={styles.searchField}>
              <Search size={17} strokeWidth={1.8} aria-hidden="true" />
              <input aria-label="Zoeken in de Academy" placeholder="Zoek een e-learning of document" />
            </label>
            <div className={styles.topbarActions}>
              <button type="button" aria-label="Notificaties" onClick={() => showNotice("Je hebt geen nieuwe meldingen.")}>
                <Bell size={18} strokeWidth={1.8} aria-hidden="true" />
              </button>
              <button type="button" className={styles.topbarAvatar} aria-label="Profiel openen" onClick={() => showNotice("Hier opent straks het profielmenu.")}>LS</button>
            </div>
          </header>

          <div className={styles.content}>
            <header className={styles.pageHeader}>
              <div>
                <span className={styles.eyebrow}>Mijn Academy</span>
                <h1>Goedemorgen, Luuk</h1>
                <p>Hier vind je jouw e-learnings, planning en afgeronde onderdelen.</p>
              </div>
              <button type="button" className={styles.secondaryButton} onClick={() => showNotice("Hier opent straks het volledige leeraanbod.")}>
                Alle e-learnings <ChevronRight size={16} strokeWidth={1.8} aria-hidden="true" />
              </button>
            </header>

            <section className={styles.continueCard} aria-labelledby="continue-title">
              <div className={styles.continueCover} aria-hidden="true">
                <span>Fy-fit Academy</span>
                <strong>01</strong>
                <small>Onboarding</small>
              </div>
              <div className={styles.continueBody}>
                <div className={styles.metaRow}>
                  <span className={styles.requiredLabel}>Verplicht</span>
                  <span><Clock3 size={14} strokeWidth={1.8} aria-hidden="true" /> 25 min resterend</span>
                </div>
                <h2 id="continue-title">Onboarding Fy-fit</h2>
                <p>Volgende onderdeel: werken volgens onze gezamenlijke afspraken.</p>
                <div className={styles.continueProgress}>
                  <Progress value={60} />
                  <span>3 van 5 onderdelen afgerond</span>
                </div>
              </div>
              <div className={styles.continueAction}>
                <span>Ga verder waar je gebleven bent</span>
                <button type="button" className={styles.primaryButton} onClick={() => showNotice("Prototype: hier opent het volgende onderdeel.")}>
                  <PlayCircle size={18} strokeWidth={1.8} aria-hidden="true" /> Ga verder
                </button>
              </div>
            </section>

            <div className={styles.dashboardGrid}>
              <section className={styles.coursePanel} aria-labelledby="courses-title">
                <div className={styles.sectionHeader}>
                  <div>
                    <h2 id="courses-title">Mijn e-learnings</h2>
                    <p>E-learnings die voor jou beschikbaar zijn.</p>
                  </div>
                  <div className={styles.filters} role="tablist" aria-label="Cursusfilters">
                    {(["Alles", "Bezig", "Afgerond"] as CourseFilter[]).map((option) => (
                      <button
                        type="button"
                        role="tab"
                        aria-selected={filter === option}
                        className={filter === option ? styles.filterActive : styles.filter}
                        key={option}
                        onClick={() => setFilter(option)}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                </div>

                <div className={styles.courseList}>
                  {visibleCourses.map((course, index) => (
                    <article className={styles.courseRow} key={course.id}>
                      <div className={index % 2 === 0 ? styles.courseThumbOrange : styles.courseThumbDark} aria-hidden="true">
                        <span>{String(index + 2).padStart(2, "0")}</span>
                        <strong>FY</strong>
                      </div>
                      <div className={styles.courseInfo}>
                        <div className={styles.courseTitleRow}>
                          <div>
                            <span>{course.category}{course.mandatory ? " · Verplicht" : ""}</span>
                            <h3>{course.title}</h3>
                          </div>
                          <span className={course.status === "Afgerond" ? styles.statusComplete : course.status === "Bezig" ? styles.statusProgress : styles.statusNeutral}>
                            {course.status}
                          </span>
                        </div>
                        <div className={styles.courseMeta}>
                          <span><Clock3 size={14} strokeWidth={1.8} aria-hidden="true" /> {course.duration}</span>
                          <span><BookMarked size={15} strokeWidth={1.8} aria-hidden="true" /> {course.modules} modules</span>
                        </div>
                        <Progress value={course.progress} />
                      </div>
                      <button type="button" className={styles.rowAction} aria-label={`${course.title} openen`} onClick={() => showNotice(`${course.title} opent in een volgende prototypefase.`)}>
                        <ChevronRight size={17} strokeWidth={1.8} aria-hidden="true" />
                      </button>
                    </article>
                  ))}
                </div>
              </section>

              <aside className={styles.rightRail}>
                <section className={styles.agendaCard} aria-labelledby="agenda-title">
                  <div className={styles.railHeader}>
                    <h2 id="agenda-title">Planning</h2>
                    <span className={styles.railIcon}><CalendarDays size={18} strokeWidth={1.8} aria-hidden="true" /></span>
                  </div>
                  <div className={styles.agendaList}>
                    <article>
                      <time><strong>12</strong><span>aug</span></time>
                      <div><strong>Ontwikkelgesprek</strong><span>10:00 · Weezenhof</span></div>
                    </article>
                    <article>
                      <time><strong>15</strong><span>aug</span></time>
                      <div><strong>POP-reflectie afronden</strong><span>Voor het einde van de week</span></div>
                    </article>
                  </div>
                  <button type="button" className={styles.textButton} onClick={() => showNotice("Hier opent straks je volledige planning.")}>
                    Open planning <ChevronRight size={16} strokeWidth={1.8} aria-hidden="true" />
                  </button>
                </section>

                <section className={styles.completedCard}>
                  <div className={styles.completedIcon}><BadgeCheck size={20} strokeWidth={1.8} aria-hidden="true" /></div>
                  <div>
                    <span>Afgerond</span>
                    <strong>4 e-learnings</strong>
                    <small>3 deelnamebewijzen beschikbaar</small>
                  </div>
                  <button type="button" aria-label="Certificaten openen" onClick={() => showNotice("Hier opent straks je certificaatoverzicht.")}><ChevronRight size={17} strokeWidth={1.8} aria-hidden="true" /></button>
                </section>
              </aside>
            </div>
          </div>
        </section>
      </div>

      {notice ? <div className={styles.toast} role="status" aria-live="polite">{notice}</div> : null}
    </main>
  );
}
