import {
  type AcademyModule,
  type DemoStore,
  type DevelopmentDocument,
  type LearningGoal,
  type LibraryDocument,
  type ModuleProgress,
  type OnboardingPath,
  type OnboardingProgress,
  type User,
} from "@/lib/types";

const users: User[] = [
  {
    id: "user-admin",
    name: "Marion Brouwer",
    email: "marion@fysiotherapienijmegen.nl",
    role: "BEHEERDER",
    title: "Praktijkmanager",
    location: "Nijmegen",
    isOnboarding: false,
    bio: "Stuurt de Academy aan en bewaakt de kwaliteit van onboarding, bibliotheek en teamontwikkeling.",
    avatarColor: "bg-[var(--brand)]",
  },
  {
    id: "user-teamlead",
    name: "Sjoerd Hendriks",
    email: "sjoerd@fysiotherapienijmegen.nl",
    role: "TEAMLEIDER",
    title: "Sportfysiotherapeut",
    location: "Lankforst",
    isOnboarding: false,
    bio: "Begeleidt teamleden op sportrevalidatie, casuistiek en persoonlijke ontwikkeling.",
    avatarColor: "bg-[var(--teal)]",
  },
  {
    id: "user-medewerker-1",
    name: "Luuk Smeekens",
    email: "luuk@fysiotherapienijmegen.nl",
    role: "MEDEWERKER",
    title: "Algemeen fysiotherapeut",
    location: "Weezenhof",
    buddyId: "user-teamlead",
    teamleaderId: "user-teamlead",
    isOnboarding: true,
    bio: "Bouwt aan een stevige basis in behandelvisie, communicatie en het werken met de Fy-fit standaarden.",
    avatarColor: "bg-amber-500",
  },
  {
    id: "user-medewerker-2",
    name: "Bram Heldens",
    email: "bram@fysiotherapienijmegen.nl",
    role: "MEDEWERKER",
    title: "Algemeen fysiotherapeut",
    location: "Meijhorst",
    teamleaderId: "user-teamlead",
    isOnboarding: false,
    bio: "Werkt actief aan consultvoering, geriatrische casuistiek en POP-doelen voor het komende kwartaal.",
    avatarColor: "bg-sky-500",
  },
];

const onboardingPath: OnboardingPath = {
  id: "path-standaard",
  name: "Fy-fit warm welkom",
  description:
    "Een duidelijk eerste traject voor nieuwe collega's met aandacht voor cultuur, kwaliteit en de eerste behandelmodules.",
  isActive: true,
  steps: [
    {
      id: "step-1",
      pathId: "path-standaard",
      order: 1,
      title: "Welkom bij Fy-fit",
      description: "Start met de introductievideo en leer hoe Fy-fit persoonlijke aandacht combineert met innovatieve zorg.",
      contentType: "VIDEO",
      content: "Bekijk de korte welkomstvideo en noteer twee dingen die je direct opvallen aan de Fy-fit benadering.",
      isRequired: true,
    },
    {
      id: "step-2",
      pathId: "path-standaard",
      order: 2,
      title: "Missie, visie en merkbelofte",
      description: "Leer de kernboodschap kennen die in consulten, intake en teamoverleg terugkomt.",
      contentType: "TEXT",
      content: "Fy-fit staat voor innovatieve behandelingen met een persoonlijke benadering. Koppel dit aan jouw eigen manier van werken.",
      isRequired: true,
    },
    {
      id: "step-3",
      pathId: "path-standaard",
      order: 3,
      title: "Jouw buddy en eerste week",
      description: "Stem met je buddy af wat je deze week observeert en welke vragen je meeneemt.",
      contentType: "CHECKLIST",
      content: "Plan een eerste evaluatiemoment van 20 minuten met je buddy aan het einde van je eerste week.",
      isRequired: true,
    },
    {
      id: "step-4",
      pathId: "path-standaard",
      order: 4,
      title: "Praktische werkafspraken",
      description: "Neem de basale afspraken door over verslaglegging, overdracht en patiëntcontact.",
      contentType: "DOCUMENT",
      content: "Lees de documenten in de bibliotheek en bevestig dat je weet waar je de actuele versies vindt.",
      isRequired: true,
    },
    {
      id: "step-5",
      pathId: "path-standaard",
      order: 5,
      title: "Kennismaken met het team",
      description: "Maak kennis met de disciplines en locaties binnen Fy-fit.",
      contentType: "TEXT",
      content: "Loop per locatie langs de collega's met wie je de komende weken het meest zult samenwerken.",
      isRequired: true,
    },
    {
      id: "step-6",
      pathId: "path-standaard",
      order: 6,
      title: "Behandelvisie module",
      description: "Volg de eerste academy-module over de Fy-fit behandelvisie.",
      contentType: "MODULE_LINK",
      content: "module-behandelvisie",
      isRequired: true,
    },
    {
      id: "step-7",
      pathId: "path-standaard",
      order: 7,
      title: "Patiëntcommunicatie observeren",
      description: "Observeer twee consulten en let op verwachtingen, taal en samenvatting.",
      contentType: "CHECKLIST",
      content: "Bespreek met je buddy welke formuleringen bij Fy-fit goed werken in een eerste consult.",
      isRequired: true,
    },
    {
      id: "step-8",
      pathId: "path-standaard",
      order: 8,
      title: "EPD en procesflow",
      description: "Doorloop de kernstappen van intake tot plan en opvolging.",
      contentType: "TEXT",
      content: "Oefen een intake-registratie en laat die de eerste keer nakijken door je buddy of teamleider.",
      isRequired: true,
    },
    {
      id: "step-9",
      pathId: "path-standaard",
      order: 9,
      title: "Eerste leerdoel formuleren",
      description: "Maak je eerste POP-doel aan in Mijn Ontwikkeling.",
      contentType: "TEXT",
      content: "Kies een leerdoel dat concreet genoeg is om binnen 6 weken te evalueren.",
      isRequired: true,
    },
    {
      id: "step-10",
      pathId: "path-standaard",
      order: 10,
      title: "Evaluatie na twee weken",
      description: "Bespreek voortgang, vragen en de eerste indrukken van het werkproces.",
      contentType: "CHECKLIST",
      content: "Plan een evaluatie met je buddy en teamleider en markeer daarna deze stap als afgerond.",
      isRequired: true,
    },
  ],
};

const modules: AcademyModule[] = [
  {
    id: "module-behandelvisie",
    title: "Behandelvisie van Fy-fit",
    description:
      "Een compacte introductie in de manier waarop Fy-fit persoonlijke benadering, educatie en activeren met elkaar verbindt.",
    categoryId: "cat-organisatie",
    thumbnailLabel: "Visie",
    status: "GEPUBLICEERD",
    isRequired: true,
    estimatedMinutes: 18,
    authorId: "user-admin",
    sections: [
      {
        id: "section-1",
        moduleId: "module-behandelvisie",
        order: 1,
        title: "Onze leidraad in elk behandeltraject",
        type: "TEXT",
        content:
          "Fy-fit werkt vanuit een heldere combinatie van deskundigheid, persoonlijke aandacht en actieve betrokkenheid van de patiënt. We willen dat patiënten zich gezien voelen, begrijpen waar ze staan en weten welke stap logisch volgt.",
      },
      {
        id: "section-2",
        moduleId: "module-behandelvisie",
        order: 2,
        title: "Video: zo klinkt de Fy-fit stijl",
        type: "VIDEO",
        content: "Gebruik in de demo hier een video-embed of vervangend beeldmateriaal over de behandelvisie en consulttoon.",
      },
      {
        id: "section-3",
        moduleId: "module-behandelvisie",
        order: 3,
        title: "Kennistoets",
        type: "QUIZ",
        content: "Kies per vraag het antwoord dat het beste aansluit bij de Fy-fit aanpak.",
        quizData: [
          {
            id: "q1",
            question: "Wat staat in de Fy-fit behandelvisie centraal in het eerste consult?",
            options: [
              "Zo snel mogelijk veel oefeningen meegeven",
              "De patiënt actief meenemen in het verhaal achter de klacht en het plan",
              "De intake volledig standaardiseren zonder nuance",
            ],
            correctIndex: 1,
            explanation: "De Fy-fit toon combineert duidelijkheid, uitleg en gezamenlijke regie.",
          },
          {
            id: "q2",
            question: "Welke combinatie past het best bij de merkbelofte?",
            options: [
              "Innovatief en persoonlijk",
              "Zakelijk en afstandelijk",
              "Complex en specialistisch zonder context",
            ],
            correctIndex: 0,
            explanation: "De website en academy-positionering benadrukken juist deze combinatie.",
          },
        ],
      },
    ],
  },
  {
    id: "module-communicatie",
    title: "Communicatie met patiënten",
    description:
      "Praktische richtlijnen voor verwachtingsmanagement, samenvatten en heldere uitleg in een consult.",
    categoryId: "cat-communicatie",
    thumbnailLabel: "Gesprek",
    status: "GEPUBLICEERD",
    isRequired: true,
    estimatedMinutes: 22,
    authorId: "user-teamlead",
    sections: [
      {
        id: "section-4",
        moduleId: "module-communicatie",
        order: 1,
        title: "Van intake naar gezamenlijk plan",
        type: "TEXT",
        content:
          "Een goed gesprek bij Fy-fit is warm, concreet en richtinggevend. De patiënt moet begrijpen wat je onderzoekt, wat je nog niet weet en welke volgende stap logisch is.",
      },
      {
        id: "section-5",
        moduleId: "module-communicatie",
        order: 2,
        title: "Voorbeeldzinnen die werken",
        type: "IMAGE",
        content:
          "Gebruik korte, rustige taal. Bijvoorbeeld: 'Ik vat even samen wat ik tot nu toe hoor' of 'We kiezen nu eerst voor een stap die jou vandaag al helpt'.",
      },
    ],
  },
  {
    id: "module-lage-rug",
    title: "Kernboodschap lage rugpijn",
    description:
      "Een korte module over consistente uitleg en geruststelling bij aspecifieke lage rugpijn.",
    categoryId: "cat-rug",
    thumbnailLabel: "Rug",
    status: "GEPUBLICEERD",
    isRequired: false,
    estimatedMinutes: 14,
    authorId: "user-teamlead",
    sections: [
      {
        id: "section-6",
        moduleId: "module-lage-rug",
        order: 1,
        title: "Wat willen we dat patiënten meenemen?",
        type: "TEXT",
        content:
          "Bij lage rugpijn willen we dat patiënten zich serieus genomen voelen, begrijpen dat bewegen meestal helpend blijft en weten welke signalen reden zijn voor extra alertheid.",
      },
      {
        id: "section-7",
        moduleId: "module-lage-rug",
        order: 2,
        title: "Toon en framing",
        type: "TEXT",
        content:
          "Gebruik taal die normaliseert zonder te bagatelliseren. Sluit aan bij zorgen, benoem herstelkansen en maak verwachtingen concreet.",
      },
    ],
  },
];

const moduleProgress: ModuleProgress[] = [
  {
    id: "mp-1",
    userId: "user-medewerker-1",
    moduleId: "module-behandelvisie",
    status: "BEZIG",
    score: 80,
    startedAt: "2026-03-22",
  },
  {
    id: "mp-2",
    userId: "user-medewerker-1",
    moduleId: "module-communicatie",
    status: "NIET_GESTART",
    startedAt: "2026-03-23",
  },
  {
    id: "mp-3",
    userId: "user-medewerker-2",
    moduleId: "module-behandelvisie",
    status: "AFGEROND",
    score: 100,
    startedAt: "2026-03-15",
    completedAt: "2026-03-16",
  },
  {
    id: "mp-4",
    userId: "user-medewerker-2",
    moduleId: "module-lage-rug",
    status: "BEZIG",
    startedAt: "2026-03-24",
  },
];

const onboardingProgress: OnboardingProgress[] = onboardingPath.steps.map((step, index) => ({
  id: `op-${step.id}`,
  userId: "user-medewerker-1",
  stepId: step.id,
  completed: index < 4,
  completedAt: index < 4 ? "2026-03-20" : undefined,
  completedById: index < 4 ? "user-teamlead" : undefined,
  notes: index === 2 ? "Buddygesprek ingepland voor vrijdagmiddag." : undefined,
}));

const documents: LibraryDocument[] = [
  {
    id: "doc-werkafspraken",
    title: "Werkafspraken eerste consult",
    type: "WERKAFSPRAAK",
    categoryId: "cat-communicatie",
    version: "1.4",
    ownerId: "user-admin",
    isPublished: true,
    updatedAt: "2026-03-18",
    summary: "Heldere afspraken voor ontvangst, intake, verwachtingsmanagement en afsluiting van het eerste consult.",
    content: [
      "Start elk consult met een korte check-in en maak direct duidelijk wat de patiënt van dit moment kan verwachten.",
      "Vat na het onderzoek in gewone taal samen wat je hebt gezien, welke hypotheses logisch zijn en welke vervolgstap je voorstelt.",
      "Sluit af met één concrete afspraak voor thuis en een heldere verwachting voor het volgende contactmoment.",
    ],
    tags: ["consult", "communicatie", "intake"],
  },
  {
    id: "doc-lage-rug",
    title: "Kernboodschap aspecifieke lage rugpijn",
    type: "KERNBOODSCHAP",
    categoryId: "cat-rug",
    version: "0.9",
    ownerId: "user-teamlead",
    isPublished: true,
    updatedAt: "2026-03-20",
    summary: "Een compacte richtlijn voor consistente uitleg, geruststelling en activatie bij lage rugpijn.",
    content: [
      "Normaliseer de klacht waar passend, zonder de ervaring van de patiënt te verkleinen.",
      "Benoem dat bewegen vaak onderdeel van herstel is en koppel het advies direct aan de hulpvraag.",
      "Gebruik geruststelling in combinatie met een duidelijk plan: wat doen we nu, wat verwachten we de komende week en wanneer schalen we op?",
    ],
    tags: ["rug", "educatie", "patiëntuitleg"],
  },
  {
    id: "doc-pop-format",
    title: "POP-format kwartaalgesprek",
    type: "FORMAT",
    categoryId: "cat-organisatie",
    version: "1.1",
    ownerId: "user-admin",
    isPublished: true,
    updatedAt: "2026-03-12",
    summary: "Basisformat om leerdoelen, bewijsstukken en evaluatievragen in één lijn te houden.",
    content: [
      "Beschrijf één inhoudelijk doel, één procesdoel en het bewijs dat laat zien dat je vooruitgang boekt.",
      "Maak het klein genoeg om binnen één kwartaal te bespreken en groot genoeg om zichtbaar verschil te maken in je werk.",
      "Gebruik concrete observaties, casussen of feedbackmomenten om je voortgang te onderbouwen.",
    ],
    tags: ["pop", "ontwikkeling", "gesprek"],
  },
  {
    id: "doc-overdracht",
    title: "Protocol warme overdracht tussen collega's",
    type: "PROTOCOL",
    categoryId: "cat-organisatie",
    version: "2.0",
    ownerId: "user-admin",
    isPublished: true,
    updatedAt: "2026-03-10",
    summary: "Praktische richtlijn voor een zorgvuldige overdracht met aandacht voor context, behandelrichting en patiëntvertrouwen.",
    content: [
      "Maak zichtbaar wat de patiënt al heeft gehoord en ervaren, zodat de volgende behandelaar daarop kan voortbouwen.",
      "Draag niet alleen feiten over, maar ook de werkhypothese en eventuele gevoeligheden in communicatie of motivatie.",
      "Bevestig richting de patiënt waarom de overdracht logisch is en hoe het vervolg eruitziet.",
    ],
    tags: ["overdracht", "kwaliteit", "proces"],
  },
];

const learningGoals: LearningGoal[] = [
  {
    id: "goal-1",
    userId: "user-medewerker-1",
    title: "Zelfstandig een eerste consult structureren volgens Fy-fit stijl",
    description: "Ik wil mijn openingsfase, samenvatting en gezamenlijke planvorming consistenter maken.",
    status: "BEZIG",
    targetDate: "2026-04-15",
    updatedAt: "2026-03-24",
  },
  {
    id: "goal-2",
    userId: "user-medewerker-2",
    title: "Sterker worden in geriatrische casusbespreking",
    description: "Ik wil in teamoverleg scherper benoemen wat mijn hypothese is en welke vervolgstap ik voorstel.",
    status: "OPEN",
    targetDate: "2026-05-01",
    updatedAt: "2026-03-19",
  },
  {
    id: "goal-3",
    userId: "user-medewerker-2",
    title: "POP bewijs verzamelen voor kwartaalgesprek",
    description: "Ik wil drie praktijkvoorbeelden en feedbackmomenten bundelen in mijn ontwikkelmap.",
    status: "BEZIG",
    targetDate: "2026-04-08",
    updatedAt: "2026-03-25",
  },
];

const developmentDocuments: DevelopmentDocument[] = [
  {
    id: "dev-1",
    userId: "user-medewerker-1",
    title: "POP Q2 - eerste 6 weken",
    description: "Startdocument met leerdoel, buddy-afspraken en observatiepunten uit de eerste consulten.",
    category: "POP",
    visibility: "TEAM",
    updatedAt: "2026-03-24",
  },
  {
    id: "dev-2",
    userId: "user-medewerker-2",
    title: "Bewijsmap consultvoering",
    description: "Notities uit intervisie, feedback van Sjoerd en twee uitgewerkte casussen.",
    category: "Bewijs",
    visibility: "TEAM",
    updatedAt: "2026-03-23",
  },
  {
    id: "dev-3",
    userId: "user-medewerker-2",
    title: "Persoonlijke reflectienotitie",
    description: "Korte notitie over energieverdeling en ritme in de week. Alleen zichtbaar voor de medewerker zelf.",
    category: "Reflectie",
    visibility: "PRIVATE",
    updatedAt: "2026-03-21",
  },
];

const initialStore: DemoStore = {
  users,
  demoAccounts: [
    { userId: "user-admin", password: "fyfit-demo" },
    { userId: "user-teamlead", password: "fyfit-demo" },
    { userId: "user-medewerker-1", password: "fyfit-demo" },
    { userId: "user-medewerker-2", password: "fyfit-demo" },
  ],
  categories: [
    { id: "cat-organisatie", name: "Organisatie", icon: "Structuur", order: 1 },
    { id: "cat-communicatie", name: "Communicatie", icon: "Gesprek", order: 2 },
    { id: "cat-rug", name: "Lage rug", icon: "Rug", order: 3 },
  ],
  modules,
  moduleProgress,
  onboardingPath,
  onboardingProgress,
  documents,
  learningGoals,
  developmentDocuments,
};

declare global {
  var fyfitStore: DemoStore | undefined;
}

export function getStore(): DemoStore {
  if (!globalThis.fyfitStore) {
    globalThis.fyfitStore = structuredClone(initialStore);
  }

  return globalThis.fyfitStore;
}

export function listUsers() {
  return getStore().users;
}

export function getUserById(userId: string) {
  return getStore().users.find((user) => user.id === userId);
}

export function getModuleById(moduleId: string) {
  return getStore().modules.find((module) => module.id === moduleId);
}

export function getDocumentById(documentId: string) {
  return getStore().documents.find((document) => document.id === documentId);
}

export function getTeamMembers(teamleaderId: string) {
  return getStore().users.filter((user) => user.teamleaderId === teamleaderId);
}

export function getVisibleDevelopmentDocuments(viewerId: string, targetUserId: string) {
  const store = getStore();
  const viewer = getUserById(viewerId);
  const target = getUserById(targetUserId);

  return store.developmentDocuments.filter((document) => {
    if (document.userId !== targetUserId || !viewer || !target) {
      return false;
    }

    if (viewer.role === "BEHEERDER" || viewer.id === targetUserId) {
      return true;
    }

    return document.visibility === "TEAM" && target.teamleaderId === viewer.id;
  });
}

export function getVisibleGoals(viewerId: string, targetUserId: string) {
  const viewer = getUserById(viewerId);
  const target = getUserById(targetUserId);

  if (!viewer || !target) {
    return [];
  }

  if (
    viewer.role === "BEHEERDER" ||
    viewer.id === targetUserId ||
    target.teamleaderId === viewer.id
  ) {
    return getStore().learningGoals.filter((goal) => goal.userId === targetUserId);
  }

  return [];
}

export function getOnboardingProgressForUser(userId: string) {
  return getStore().onboardingProgress.filter((entry) => entry.userId === userId);
}

export function getModuleProgressForUser(userId: string) {
  return getStore().moduleProgress.filter((entry) => entry.userId === userId);
}

export function createLearningGoal(goal: Omit<LearningGoal, "id" | "updatedAt">) {
  const store = getStore();

  store.learningGoals.unshift({
    ...goal,
    id: `goal-${Math.random().toString(36).slice(2, 8)}`,
    updatedAt: new Date().toISOString().slice(0, 10),
  });
}

export function createDevelopmentDocument(
  document: Omit<DevelopmentDocument, "id" | "updatedAt">,
) {
  const store = getStore();

  store.developmentDocuments.unshift({
    ...document,
    id: `dev-${Math.random().toString(36).slice(2, 8)}`,
    updatedAt: new Date().toISOString().slice(0, 10),
  });
}

export function upsertModuleProgress(userId: string, moduleId: string) {
  const store = getStore();
  const existing = store.moduleProgress.find(
    (entry) => entry.userId === userId && entry.moduleId === moduleId,
  );

  if (!existing) {
    store.moduleProgress.push({
      id: `mp-${Math.random().toString(36).slice(2, 8)}`,
      userId,
      moduleId,
      status: "AFGEROND",
      startedAt: new Date().toISOString().slice(0, 10),
      completedAt: new Date().toISOString().slice(0, 10),
    });
    return;
  }

  existing.status = existing.status === "AFGEROND" ? "BEZIG" : "AFGEROND";
  existing.completedAt =
    existing.status === "AFGEROND" ? new Date().toISOString().slice(0, 10) : undefined;
}

export function toggleOnboardingStep(userId: string, stepId: string, completedById: string) {
  const store = getStore();
  const existing = store.onboardingProgress.find(
    (entry) => entry.userId === userId && entry.stepId === stepId,
  );

  if (!existing) {
    store.onboardingProgress.push({
      id: `op-${Math.random().toString(36).slice(2, 8)}`,
      userId,
      stepId,
      completed: true,
      completedAt: new Date().toISOString().slice(0, 10),
      completedById,
    });
    return;
  }

  existing.completed = !existing.completed;
  existing.completedAt = existing.completed ? new Date().toISOString().slice(0, 10) : undefined;
  existing.completedById = existing.completed ? completedById : undefined;
}
