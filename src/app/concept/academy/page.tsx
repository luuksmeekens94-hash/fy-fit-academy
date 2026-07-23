"use client";

import Image from "next/image";
import { useMemo, useState } from "react";

import styles from "./academy-concept.module.css";

type IconName =
  | "academy"
  | "book"
  | "calendar"
  | "certificate"
  | "chevron"
  | "clock"
  | "grid"
  | "menu"
  | "notification"
  | "play"
  | "profile"
  | "search"
  | "spark"
  | "target";

type CourseStatus = "Bezig" | "Nieuw" | "Afgerond";

type Course = {
  id: string;
  category: string;
  title: string;
  description: string;
  duration: string;
  modules: number;
  progress: number;
  status: CourseStatus;
  tone: "orange" | "green" | "sand";
  code: string;
};

const navigation: Array<{ label: string; icon: IconName; active?: boolean }> = [
  { label: "Overzicht", icon: "grid", active: true },
  { label: "Mijn leerroute", icon: "target" },
  { label: "Academy", icon: "academy" },
  { label: "Ontwikkeling", icon: "spark" },
  { label: "Bibliotheek", icon: "book" },
  { label: "Certificaten", icon: "certificate" },
];

const courses: Course[] = [
  {
    id: "klinisch-redeneren",
    category: "Vakinhoudelijk",
    title: "Klinisch redeneren bij knieklachten",
    description: "Van anamnese en onderzoek naar een helder, onderbouwd behandelplan.",
    duration: "90 min",
    modules: 4,
    progress: 0,
    status: "Nieuw",
    tone: "orange",
    code: "01",
  },
  {
    id: "samenwerken",
    category: "Persoonlijke ontwikkeling",
    title: "Samenwerken in de praktijk",
    description: "Maak verwachtingen bespreekbaar en werk doelgericht samen met collega’s.",
    duration: "55 min",
    modules: 3,
    progress: 20,
    status: "Bezig",
    tone: "green",
    code: "02",
  },
  {
    id: "communicatie",
    category: "Professionele groei",
    title: "Het goede gesprek met de patiënt",
    description: "Vergroot vertrouwen met duidelijke communicatie en gedeelde besluitvorming.",
    duration: "70 min",
    modules: 4,
    progress: 100,
    status: "Afgerond",
    tone: "sand",
    code: "03",
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

  if (name === "grid") {
    return <svg {...common}><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" /></svg>;
  }
  if (name === "target") {
    return <svg {...common}><circle cx="12" cy="12" r="8.5" /><circle cx="12" cy="12" r="4" /><path d="M12 3.5V1.8M20.5 12h1.7M12 20.5v1.7M3.5 12H1.8" /></svg>;
  }
  if (name === "academy") {
    return <svg {...common}><path d="m3 9 9-5 9 5-9 5-9-5Z" /><path d="M7 12v4.5c2.6 2 7.4 2 10 0V12M21 9v6" /></svg>;
  }
  if (name === "spark") {
    return <svg {...common}><path d="M12 2.5 14.1 8l5.4 2.1-5.4 2.1L12 18l-2.1-5.8-5.4-2.1L9.9 8 12 2.5Z" /><path d="m18.5 16 .8 2.1 2.2.9-2.2.8-.8 2.2-.8-2.2-2.2-.8 2.2-.9.8-2.1Z" /></svg>;
  }
  if (name === "book") {
    return <svg {...common}><path d="M4.5 4.5h9A2.5 2.5 0 0 1 16 7v13H7a2.5 2.5 0 0 1-2.5-2.5v-13Z" /><path d="M16 7a2.5 2.5 0 0 1 2.5-2.5h1V18H8a3.5 3.5 0 0 0-3.5 2" /></svg>;
  }
  if (name === "certificate") {
    return <svg {...common}><circle cx="12" cy="9" r="5.5" /><path d="m8.5 13.3-1.2 8 4.7-2.7 4.7 2.7-1.2-8" /><path d="m10 9 1.3 1.3L14.2 7" /></svg>;
  }
  if (name === "search") {
    return <svg {...common}><circle cx="10.5" cy="10.5" r="6.5" /><path d="m15.5 15.5 5 5" /></svg>;
  }
  if (name === "notification") {
    return <svg {...common}><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" /><path d="M9.8 21h4.4" /></svg>;
  }
  if (name === "menu") {
    return <svg {...common}><path d="M4 7h16M4 12h16M4 17h16" /></svg>;
  }
  if (name === "clock") {
    return <svg {...common}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3.2 2" /></svg>;
  }
  if (name === "calendar") {
    return <svg {...common}><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M8 3v4M16 3v4M3 10h18" /></svg>;
  }
  if (name === "play") {
    return <svg {...common}><circle cx="12" cy="12" r="9" /><path d="m10 8 6 4-6 4V8Z" /></svg>;
  }
  if (name === "chevron") {
    return <svg {...common}><path d="m9 5 7 7-7 7" /></svg>;
  }
  if (name === "profile") {
    return <svg {...common}><circle cx="12" cy="8" r="4" /><path d="M4.5 21c.7-4 3.2-6 7.5-6s6.8 2 7.5 6" /></svg>;
  }
  return <svg {...common}><path d="M12 3 4 7.5V16l8 5 8-5V7.5L12 3Z" /></svg>;
}

function Progress({ value, dark = false }: { value: number; dark?: boolean }) {
  return (
    <div className={styles.progress} aria-label={`${value}% afgerond`}>
      <div className={dark ? styles.progressTrackDark : styles.progressTrack}>
        <span style={{ width: `${value}%` }} />
      </div>
      <span className={dark ? styles.progressLabelDark : styles.progressLabel}>{value}%</span>
    </div>
  );
}

export default function AcademyConceptPage() {
  const [filter, setFilter] = useState<"Voor jou" | "Alles" | "Afgerond">("Voor jou");
  const [notice, setNotice] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const visibleCourses = useMemo(() => {
    if (filter === "Afgerond") return courses.filter((course) => course.status === "Afgerond");
    if (filter === "Voor jou") return courses.filter((course) => course.status !== "Afgerond");
    return courses;
  }, [filter]);

  function showPrototypeNotice(message: string) {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 2600);
  }

  return (
    <main className={styles.page}>
      <div className={styles.prototypeFlag}>Review-safe visueel prototype · voorbeeldinhoud · geen databasekoppeling</div>

      <div className={styles.shell}>
        <aside className={`${styles.sidebar} ${mobileMenuOpen ? styles.sidebarOpen : ""}`}>
          <div className={styles.brandRow}>
            <div className={styles.brandMark}>
              <Image src="/fyfit-poppetje.png" alt="" width={28} height={28} priority />
            </div>
            <div>
              <span className={styles.brandName}>Fy-fit</span>
              <span className={styles.brandProduct}>Academy</span>
            </div>
          </div>

          <p className={styles.navLabel}>Mijn omgeving</p>
          <nav className={styles.primaryNav} aria-label="Conceptnavigatie">
            {navigation.map((item) => (
              <button
                type="button"
                key={item.label}
                className={item.active ? styles.navItemActive : styles.navItem}
                onClick={() => showPrototypeNotice(`${item.label} is onderdeel van het visuele prototype.`)}
              >
                <Icon name={item.icon} />
                <span>{item.label}</span>
              </button>
            ))}
          </nav>

          <div className={styles.sidebarFooter}>
            <div className={styles.weekGoal}>
              <div className={styles.weekGoalIcon}><Icon name="target" size={18} /></div>
              <div>
                <span>Weekdoel</span>
                <strong>35 van 45 min</strong>
              </div>
            </div>
            <Progress value={78} dark />
            <button type="button" className={styles.profileButton} onClick={() => showPrototypeNotice("Hier opent straks het profielmenu.")}>
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
            <div className={styles.mobileBrand}>
              <span>Fy-fit</span> Academy
            </div>
            <div className={styles.searchField}>
              <Icon name="search" size={18} />
              <input aria-label="Zoeken in de Academy" placeholder="Zoek in de Academy" />
              <kbd>⌘ K</kbd>
            </div>
            <div className={styles.topbarActions}>
              <button type="button" aria-label="Notificaties" onClick={() => showPrototypeNotice("Je hebt geen nieuwe meldingen.")}>
                <Icon name="notification" />
                <span className={styles.notificationDot} />
              </button>
              <button type="button" className={styles.topbarAvatar} aria-label="Profiel openen" onClick={() => showPrototypeNotice("Hier opent straks het profielmenu.")}>LS</button>
            </div>
          </header>

          <div className={styles.content}>
            <section className={styles.intro}>
              <div>
                <span className={styles.eyebrow}>Persoonlijke leeromgeving</span>
                <h1>Goedemorgen, Luuk.<br /><em>Waar wil je in groeien?</em></h1>
                <p>Alles wat je nodig hebt om gericht te leren, toe te passen en je ontwikkeling zichtbaar te maken.</p>
              </div>
              <div className={styles.compactStats} aria-label="Persoonlijke leerstatistieken">
                <div><strong>2</strong><span>Actief</span></div>
                <div><strong>4</strong><span>Afgerond</span></div>
                <div><strong>3</strong><span>Bewijzen</span></div>
              </div>
            </section>

            <section className={styles.continueCard} aria-labelledby="continue-title">
              <div className={styles.continueContent}>
                <div className={styles.cardMetaRow}>
                  <span className={styles.inverseEyebrow}>Ga verder met je ontwikkeling</span>
                  <span className={styles.timeMeta}><Icon name="clock" size={16} /> 18 min resterend</span>
                </div>
                <h2 id="continue-title">Van vakbekwaam naar<br /><em>8-8 professional</em></h2>
                <p>Je bent bezig met module 2: eigenaarschap in de praktijk. De volgende les helpt je om je ontwikkeldoel concreet te maken.</p>
                <div className={styles.continueFooter}>
                  <div className={styles.progressGroup}>
                    <div><span>Module 2 van 5</span><strong>42% afgerond</strong></div>
                    <div className={styles.continueTrack}><span style={{ width: "42%" }} /></div>
                  </div>
                  <button type="button" className={styles.primaryButton} onClick={() => showPrototypeNotice("Prototype: hier opent les 2.3 – Jouw ontwikkeldoel.")}>
                    <Icon name="play" size={18} /> Ga verder
                  </button>
                </div>
              </div>
              <div className={styles.continueVisual} aria-hidden="true">
                <span className={styles.visualIssue}>FY / 08</span>
                <span className={styles.visualNumber}>8</span>
                <div className={styles.visualCaption}>
                  <span>Persoonlijk</span>
                  <span>Vakinhoudelijk</span>
                  <span>Praktijkgericht</span>
                </div>
              </div>
            </section>

            <div className={styles.dashboardGrid}>
              <section className={styles.coursesSection} aria-labelledby="courses-title">
                <div className={styles.sectionHeader}>
                  <div>
                    <span className={styles.sectionIndex}>01</span>
                    <div>
                      <h2 id="courses-title">Jouw Academy</h2>
                      <p>Geselecteerd op jouw rol en ontwikkeling.</p>
                    </div>
                  </div>
                  <button type="button" className={styles.textButton} onClick={() => setFilter("Alles")}>Bekijk alles <Icon name="chevron" size={16} /></button>
                </div>

                <div className={styles.filters} role="tablist" aria-label="Cursusfilters">
                  {(["Voor jou", "Alles", "Afgerond"] as const).map((option) => (
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

                <div className={styles.courseGrid}>
                  {visibleCourses.map((course) => (
                    <article className={styles.courseCard} key={course.id}>
                      <div className={`${styles.courseCover} ${styles[`courseCover${course.tone[0].toUpperCase()}${course.tone.slice(1)}`]}`}>
                        <span className={styles.courseCode}>{course.code}</span>
                        <span className={styles.courseStatus}>{course.status}</span>
                        <div className={styles.courseCoverTitle}>Fy-fit<br />Academy</div>
                      </div>
                      <div className={styles.courseBody}>
                        <span className={styles.courseCategory}>{course.category}</span>
                        <h3>{course.title}</h3>
                        <p>{course.description}</p>
                        <div className={styles.courseFacts}>
                          <span><Icon name="clock" size={15} /> {course.duration}</span>
                          <span><Icon name="academy" size={16} /> {course.modules} modules</span>
                        </div>
                        <Progress value={course.progress} />
                        <button type="button" className={styles.courseAction} onClick={() => showPrototypeNotice(`${course.title} opent in de volgende prototypefase.`)}>
                          {course.status === "Afgerond" ? "Bekijk resultaat" : course.progress > 0 ? "Ga verder" : "Bekijk e-learning"}
                          <Icon name="chevron" size={16} />
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              </section>

              <aside className={styles.rightRail}>
                <section className={styles.agendaCard} aria-labelledby="agenda-title">
                  <div className={styles.railHeader}>
                    <div>
                      <span className={styles.sectionIndex}>02</span>
                      <h2 id="agenda-title">Deze week</h2>
                    </div>
                    <Icon name="calendar" />
                  </div>
                  <div className={styles.agendaList}>
                    <article>
                      <time><strong>12</strong><span>aug</span></time>
                      <div><span>Ontwikkelgesprek</span><strong>Met je teamleider</strong><small>10:00 · Weezenhof</small></div>
                    </article>
                    <article>
                      <time><strong>15</strong><span>aug</span></time>
                      <div><span>Leeractie</span><strong>Reflectie POP afronden</strong><small>Voor het einde van de week</small></div>
                    </article>
                  </div>
                  <button type="button" className={styles.railLink} onClick={() => showPrototypeNotice("Hier opent straks je volledige ontwikkelplanning.")}>Open mijn planning <Icon name="chevron" size={16} /></button>
                </section>

                <section className={styles.developmentCard}>
                  <span className={styles.inverseEyebrow}>Jouw ontwikkelkompas</span>
                  <h2>Van plan naar<br /><em>zichtbare groei.</em></h2>
                  <p>Je POP is bijgewerkt. Kies één concrete leeractie voor deze maand.</p>
                  <button type="button" onClick={() => showPrototypeNotice("Hier opent straks je persoonlijke ontwikkelplan.")}>Open mijn POP <Icon name="chevron" size={16} /></button>
                </section>

                <section className={styles.certificateCard}>
                  <div className={styles.certificateIcon}><Icon name="certificate" /></div>
                  <div><span>Laatst behaald</span><strong>Communicatie & vertrouwen</strong><small>Certificaat · 28 juni</small></div>
                  <button type="button" aria-label="Certificaat openen" onClick={() => showPrototypeNotice("Hier opent straks het certificaat.")}><Icon name="chevron" size={18} /></button>
                </section>
              </aside>
            </div>
          </div>

          <nav className={styles.mobileNav} aria-label="Mobiele conceptnavigatie">
            {navigation.slice(0, 4).map((item) => (
              <button type="button" key={item.label} className={item.active ? styles.mobileNavActive : ""} onClick={() => showPrototypeNotice(`${item.label} is onderdeel van het visuele prototype.`)}>
                <Icon name={item.icon} size={19} />
                <span>{item.label === "Mijn leerroute" ? "Leerroute" : item.label}</span>
              </button>
            ))}
          </nav>
        </section>
      </div>

      {notice ? <div className={styles.toast} role="status" aria-live="polite">{notice}</div> : null}
    </main>
  );
}
