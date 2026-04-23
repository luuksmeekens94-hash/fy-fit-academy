export type LmsSeedQuestionSpec = {
  key: string;
  type: "MULTIPLE_CHOICE" | "MULTIPLE_RESPONSE" | "TRUE_FALSE";
  prompt: string;
  explanation: string;
  points: number;
  options: {
    label: string;
    isCorrect: boolean;
  }[];
};

export type LmsSeedLessonSpec = {
  slug: string;
  title: string;
  description: string;
  type: "TEXT" | "VIDEO" | "CASE" | "REFLECTION" | "ASSESSMENT";
  content: string;
  order: number;
  isRequired: boolean;
  estimatedMinutes: number;
};

export type LmsEnrollmentFixture = {
  key: "in-progress" | "completed";
  assigneeEmail: string;
  assignmentType: "REQUIRED" | "OPTIONAL";
  status: "IN_PROGRESS" | "COMPLETED";
  startedAt: string;
  completedAt: string | null;
  deadlineAt: string | null;
  completedLessonSlugs: string[];
  inProgressLessonSlug?: string;
};

export type LmsSeedSpec = {
  course: {
    title: string;
    slug: string;
    description: string;
    audience: string;
    learningObjectives: string;
    goal: string;
    focus: string;
    learnerOutcomes: string[];
    studyLoadMinutes: number;
    status: "PUBLISHED";
    isMandatory: boolean;
    publishedAt: string;
    revisionDueAt: string;
  };
  version: {
    versionNumber: string;
    changeSummary: string;
    isActive: true;
  };
  lessons: LmsSeedLessonSpec[];
  assessment: {
    title: string;
    description: string;
    passPercentage: number;
    maxAttempts: number;
    timeLimitMinutes: number;
    shuffleQuestions: boolean;
    shuffleOptions: boolean;
    showFeedbackImmediately: boolean;
    isRequiredForCompletion: boolean;
    lessonSlug: string;
    questions: LmsSeedQuestionSpec[];
  };
  enrollmentFixtures: LmsEnrollmentFixture[];
  certificateFixture: {
    assigneeEmail: string;
    courseVersionNumber: string;
    scorePercentage: number;
    studyLoadMinutes: number;
  };
};

export function buildLmsSeedSpec(): LmsSeedSpec {
  return {
    course: {
      title: "Fy-fit consultvoering basis",
      slug: "fy-fit-consultvoering-basis",
      description:
        "Een eerste LMS-cursus over consultstructuur, verwachtingsmanagement en het helder afronden van een behandelcontact volgens de Fy-fit stijl.",
      audience: "Medewerkers en nieuwe collega's binnen Fy-fit",
      learningObjectives:
        "Na afronding kan de medewerker een consult helder openen, samenvatten, samen besluiten nemen en een concrete vervolgstap formuleren.",
      goal:
        "Medewerkers een houvast geven om consulten op de Fy-fit manier rustig, duidelijk en menselijk te openen en af te ronden.",
      focus:
        "Consultstructuur, gezamenlijke besluitvorming en een concrete afronding die de patiënt vertrouwen geeft.",
      learnerOutcomes: [
        "Je opent een consult met een helder kader en de juiste toon.",
        "Je vat de hulpvraag en bevindingen begrijpelijk samen.",
        "Je sluit af met één concrete vervolgstap en checkt of de patiënt die begrijpt.",
      ],
      studyLoadMinutes: 55,
      status: "PUBLISHED",
      isMandatory: true,
      publishedAt: "2026-04-01T08:00:00.000Z",
      revisionDueAt: "2026-10-01T08:00:00.000Z",
    },
    version: {
      versionNumber: "1.0",
      changeSummary: "Eerste LMS-MVP-versie voor consultvoering en basis toetsing.",
      isActive: true,
    },
    lessons: [
      {
        slug: "intro-fy-fit-consultvoering",
        title: "Intro: wat maakt een Fy-fit consult anders?",
        description: "Korte context over toon, regie en gezamenlijke besluitvorming.",
        type: "TEXT",
        content:
          "Fy-fit combineert vakinhoudelijke scherpte met persoonlijk contact. In een sterk consult voelt de patiënt zich serieus genomen, begrijpt hij het plan en weet hij wat de eerstvolgende stap is.",
        order: 1,
        isRequired: true,
        estimatedMinutes: 8,
      },
      {
        slug: "consult-openen-en-kaderen",
        title: "Een consult openen en kaderen",
        description: "Hoe je direct structuur en rust brengt in de eerste minuten.",
        type: "VIDEO",
        content:
          "Gebruik in de uiteindelijke UI een video of opname waarin de opening, check-in en verwachting voor het gesprek worden voorgedaan.",
        order: 2,
        isRequired: true,
        estimatedMinutes: 10,
      },
      {
        slug: "casus-samenvatten-en-richting-kiezen",
        title: "Casus: samenvatten en richting kiezen",
        description: "Werk een korte praktijksituatie door en kies de best passende samenvatting.",
        type: "CASE",
        content:
          "Een patiënt met terugkerende schouderklachten wil vooral weer vertrouwen krijgen om bovenhands te werken. Oefen hoe je de hulpvraag, bevindingen en eerste behandelrichting samenbrengt.",
        order: 3,
        isRequired: true,
        estimatedMinutes: 12,
      },
      {
        slug: "reflectie-afsluiten-met-volgende-stap",
        title: "Reflectie: afsluiten met een volgende stap",
        description: "Sta kort stil bij hoe jij een consult afrondt.",
        type: "REFLECTION",
        content:
          "Beschrijf in 3 tot 5 zinnen hoe jij het consult afrondt zonder te veel tegelijk mee te geven, en hoe je checkt of de patiënt begrijpt wat er is afgesproken.",
        order: 4,
        isRequired: true,
        estimatedMinutes: 10,
      },
      {
        slug: "toets-consultvoering-basis",
        title: "Toets: consultvoering basis",
        description: "Controleer of je de kernprincipes van de cursus beheerst.",
        type: "ASSESSMENT",
        content: "Maak de toets en rond de cursus af met een voldoende score.",
        order: 5,
        isRequired: true,
        estimatedMinutes: 15,
      },
    ],
    assessment: {
      title: "Kennistoets consultvoering basis",
      description: "Korte eindtoets op basis van de consultvoering principes uit de cursus.",
      passPercentage: 80,
      maxAttempts: 3,
      timeLimitMinutes: 20,
      shuffleQuestions: false,
      shuffleOptions: false,
      showFeedbackImmediately: true,
      isRequiredForCompletion: true,
      lessonSlug: "toets-consultvoering-basis",
      questions: [
        {
          key: "q1",
          type: "MULTIPLE_CHOICE",
          prompt: "Wat is in een eerste consult het belangrijkste doel van je samenvatting?",
          explanation:
            "Een goede samenvatting laat zien dat je de patiënt hebt begrepen en helpt om samen naar de volgende stap te bewegen.",
          points: 1,
          options: [
            { label: "Zo snel mogelijk het oefenprogramma uitleggen", isCorrect: false },
            { label: "Controleren of je de klacht, hulpvraag en richting samen helder hebt", isCorrect: true },
            { label: "De volledige differentiaaldiagnose benoemen in detail", isCorrect: false },
          ],
        },
        {
          key: "q2",
          type: "TRUE_FALSE",
          prompt: "Juist of onjuist: geruststellen betekent dat je pijn altijd moet bagatelliseren.",
          explanation:
            "Fy-fit normaliseert waar passend, maar doet nooit alsof de ervaring van de patiënt er niet toe doet.",
          points: 1,
          options: [
            { label: "Juist", isCorrect: false },
            { label: "Onjuist", isCorrect: true },
          ],
        },
        {
          key: "q3",
          type: "MULTIPLE_RESPONSE",
          prompt: "Welke elementen horen bij een sterke consultafronding?",
          explanation:
            "Een goede afronding maakt de afspraak concreet, checkt begrip en laat de patiënt met focus vertrekken.",
          points: 2,
          options: [
            { label: "Eén concrete volgende stap formuleren", isCorrect: true },
            { label: "Checken of de patiënt de afspraak heeft begrepen", isCorrect: true },
            { label: "Nog drie extra zijsporen meegeven voor later", isCorrect: false },
            { label: "Verwachtingen voor het volgende contact benoemen", isCorrect: true },
          ],
        },
        {
          key: "q4",
          type: "MULTIPLE_CHOICE",
          prompt: "Welke toon past het best bij de Fy-fit consultstijl?",
          explanation:
            "De stijl is warm, concreet en richtinggevend — niet afstandelijk of overladen.",
          points: 1,
          options: [
            { label: "Warm, duidelijk en gezamenlijk", isCorrect: true },
            { label: "Afstandelijk maar efficiënt", isCorrect: false },
            { label: "Heel veel informatie tegelijk om compleet te zijn", isCorrect: false },
          ],
        },
        {
          key: "q5",
          type: "MULTIPLE_CHOICE",
          prompt: "Wanneer is een cursus in deze MVP pas echt afgerond?",
          explanation:
            "De cursus is afgerond als verplichte lessen voltooid zijn en de verplichte assessment gehaald is.",
          points: 1,
          options: [
            { label: "Zodra de medewerker de eerste les opent", isCorrect: false },
            { label: "Wanneer alle verplichte lessen klaar zijn en de toets is gehaald", isCorrect: true },
            { label: "Alleen wanneer een teamleider handmatig akkoord geeft", isCorrect: false },
          ],
        },
      ],
    },
    enrollmentFixtures: [
      {
        key: "in-progress",
        assigneeEmail: "luuk@fysiotherapienijmegen.nl",
        assignmentType: "REQUIRED",
        status: "IN_PROGRESS",
        startedAt: "2026-04-08T09:00:00.000Z",
        completedAt: null,
        deadlineAt: "2026-04-22T17:00:00.000Z",
        completedLessonSlugs: [
          "intro-fy-fit-consultvoering",
          "consult-openen-en-kaderen",
        ],
        inProgressLessonSlug: "casus-samenvatten-en-richting-kiezen",
      },
      {
        key: "completed",
        assigneeEmail: "bram@fysiotherapienijmegen.nl",
        assignmentType: "REQUIRED",
        status: "COMPLETED",
        startedAt: "2026-04-03T09:00:00.000Z",
        completedAt: "2026-04-05T16:00:00.000Z",
        deadlineAt: "2026-04-17T17:00:00.000Z",
        completedLessonSlugs: [
          "intro-fy-fit-consultvoering",
          "consult-openen-en-kaderen",
          "casus-samenvatten-en-richting-kiezen",
          "reflectie-afsluiten-met-volgende-stap",
          "toets-consultvoering-basis",
        ],
      },
    ],
    certificateFixture: {
      assigneeEmail: "bram@fysiotherapienijmegen.nl",
      courseVersionNumber: "1.0",
      scorePercentage: 100,
      studyLoadMinutes: 55,
    },
  };
}
