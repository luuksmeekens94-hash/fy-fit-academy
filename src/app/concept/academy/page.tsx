"use client";

import Image from "next/image";
import { useMemo, useState } from "react";

import styles from "./academy-concept.module.css";

type IconName = "academy" | "book" | "calendar" | "certificate" | "chevron" | "clock" | "grid" | "menu" | "notification" | "play" | "profile" | "search" | "target";
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

const navigation: Array<{ label: string; icon: IconName; active?: boolean }> = [
  { label: "Overzicht", icon: "grid", active: true },
  { label: "Mijn e-learnings", icon: "academy" },
  { label: "Ontwikkeling", icon: "target" },
  { label: "Bibliotheek", icon: "book" },
  { label: "Certificaten", icon: "certificate" },
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

function Icon({ name, size = 20 }: { name: IconName; size?: number }) {
  const common = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
  };

  const paths: Record<IconName, React.ReactNode> = {
    grid: <><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" /></>,
    target: <><circle cx="12" cy="12" r="8.5" /><circle cx="12" cy="12" r="4" /><path d="M12 3.5V1.8M20.5 12h1.7M12 20.5v1.7M3.5 12H1.8" /></>,
    academy: <><path d="m3 9 9-5 9 5-9 5-9-5Z" /><path d="M7 12v4.5c2.6 2 7.4 2 10 0V12M21 9v6" /></>,
    book: <><path d="M4.5 4.5h9A2.5 2.5 0 0 1 16 7v13H7a2.5 2.5 0 0 1-2.5-2.5v-13Z" /><path d="M16 7a2.5 2.5 0 0 1 2.5-2.5h1V18H8a3.5 3.5 0 0 0-3.5 2" /></>,
    certificate: <><circle cx="12" cy="9" r="5.5" /><path d="m8.5 13.3-1.2 8 4.7-2.7 4.7 2.7-1.2-8" /><path d="m10 9 1.3 1.3L14.2 7" /></>,
    search: <><circle cx="10.5" cy="10.5" r="6.5" /><path d="m15.5 15.5 5 5" /></>,
    notification: <><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" /><path d="M9.8 21h4.4" /></>,
    menu: <path d="M4 7h16M4 12h16M4 17h16" />,
    clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3.2 2" /></>,
    calendar: <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M8 3v4M16 3v4M3 10h18" /></>,
    play: <><circle cx="12" cy="12" r="9" /><path d="m10 8 6 4-6 4V8Z" /></>,
    chevron: <path d="m9 5 7 7-7 7" />,
    profile: <><circle cx="12" cy="8" r="4" /><path d="M4.5 21c.7-4 3.2-6 7.5-6s6.8 2 7.5 6" /></>,
  };

  return <svg {...common}>{paths[name]}</svg>;
}

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
            <Image src="/fyfit-logo-transparent.png" alt="Fy-fit" width={744} height={196} priority />
          </div>
          <span className={styles.productName}>Academy</span>

          <nav className={styles.primaryNav} aria-label="Conceptnavigatie">
            {navigation.map((item) => (
              <button
                type="button"
                key={item.label}
                className={item.active ? styles.navItemActive : styles.navItem}
                onClick={() => showNotice(`${item.label} is onderdeel van het prototype.`)}
              >
                <Icon name={item.icon} />
                <span>{item.label}</span>
              </button>
            ))}
          </nav>

          <div className={styles.sidebarFooter}>
            <button type="button" className={styles.profileButton} onClick={() => showNotice("Hier opent straks het profielmenu.")}>
              <span className={styles.avatar}>LS</span>
              <span><strong>Luuk Smeekens</strong><small>Fysiotherapeut</small></span>
              <Icon name="chevron" size={16} />
            </button>
          </div>
        </aside>

        {mobileMenuOpen ? <button className={styles.backdrop} type="button" aria-label="Menu sluiten" onClick={() => setMobileMenuOpen(false)} /> : null}

        <section className={styles.workspace}>
          <header className={styles.topbar}>
            <button type="button" className={styles.mobileMenuButton} aria-label="Menu openen" onClick={() => setMobileMenuOpen(true)}>
              <Icon name="menu" size={22} />
            </button>
            <div className={styles.mobileBrand}>Fy-fit <span>Academy</span></div>
            <label className={styles.searchField}>
              <Icon name="search" size={18} />
              <input aria-label="Zoeken in de Academy" placeholder="Zoek een e-learning of document" />
            </label>
            <div className={styles.topbarActions}>
              <button type="button" aria-label="Notificaties" onClick={() => showNotice("Je hebt geen nieuwe meldingen.")}>
                <Icon name="notification" />
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
                Alle e-learnings <Icon name="chevron" size={16} />
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
                  <span><Icon name="clock" size={15} /> 25 min resterend</span>
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
                  <Icon name="play" size={18} /> Ga verder
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
                          <span><Icon name="clock" size={15} /> {course.duration}</span>
                          <span><Icon name="academy" size={16} /> {course.modules} modules</span>
                        </div>
                        <Progress value={course.progress} />
                      </div>
                      <button type="button" className={styles.rowAction} aria-label={`${course.title} openen`} onClick={() => showNotice(`${course.title} opent in een volgende prototypefase.`)}>
                        <Icon name="chevron" size={18} />
                      </button>
                    </article>
                  ))}
                </div>
              </section>

              <aside className={styles.rightRail}>
                <section className={styles.agendaCard} aria-labelledby="agenda-title">
                  <div className={styles.railHeader}>
                    <h2 id="agenda-title">Planning</h2>
                    <Icon name="calendar" />
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
                    Open planning <Icon name="chevron" size={16} />
                  </button>
                </section>

                <section className={styles.completedCard}>
                  <div className={styles.completedIcon}><Icon name="certificate" /></div>
                  <div>
                    <span>Afgerond</span>
                    <strong>4 e-learnings</strong>
                    <small>3 deelnamebewijzen beschikbaar</small>
                  </div>
                  <button type="button" aria-label="Certificaten openen" onClick={() => showNotice("Hier opent straks je certificaatoverzicht.")}><Icon name="chevron" size={18} /></button>
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
