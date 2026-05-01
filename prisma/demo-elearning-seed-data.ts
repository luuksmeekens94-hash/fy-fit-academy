import type {
  LmsSeedCompetencyReferenceSpec,
  LmsSeedEvaluationFormSpec,
  LmsSeedLearningObjectiveSpec,
  LmsSeedLiteratureReferenceSpec,
  LmsSeedModuleSpec,
  LmsSeedQuestionSpec,
} from "./lms-seed-data.ts";

export const DEMO_ELEARNING_COURSE_SLUG = "demo-geaccrediteerde-elearning";
export const DEMO_ELEARNING_ASSET_ROOT = "/lms/demo-geaccrediteerde-elearning";

export type DemoElearningLessonSpec = {
  slug: string;
  title: string;
  description: string;
  type: "TEXT" | "VIDEO" | "CASE" | "REFLECTION" | "ASSESSMENT";
  content: string;
  order: number;
  isRequired: boolean;
  estimatedMinutes: number;
  assetPath?: string;
};

export type DemoElearningModuleSpec = LmsSeedModuleSpec & {
  assetPaths: string[];
};

export type DemoElearningSeedSpec = {
  cleanup: {
    courseSlug: string;
    assetRoot: string;
    isTemporaryDemo: true;
  };
  course: {
    title: string;
    slug: string;
    description: string;
    audience: string;
    learningObjectives: string;
    goal: string;
    focus: string;
    learnerOutcomes: string[];
    authorExperts: {
      name: string;
      role: string;
      organization?: string;
      registrationNumber?: string;
    }[];
    accreditationRegister: string;
    accreditationKind: "VAKINHOUDELIJK" | "BEROEPSGERELATEERD";
    versionDate: string;
    requiredQuestionCount: number;
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
  modules: DemoElearningModuleSpec[];
  learningObjectives: LmsSeedLearningObjectiveSpec[];
  literatureReferences: LmsSeedLiteratureReferenceSpec[];
  competencyReferences: LmsSeedCompetencyReferenceSpec[];
  evaluationForm: LmsSeedEvaluationFormSpec;
  lessons: DemoElearningLessonSpec[];
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
};

const module1AssetRoot = `${DEMO_ELEARNING_ASSET_ROOT}/module-1`;

export function buildDemoElearningSeedSpec(): DemoElearningSeedSpec {
  return {
    cleanup: {
      courseSlug: DEMO_ELEARNING_COURSE_SLUG,
      assetRoot: DEMO_ELEARNING_ASSET_ROOT,
      isTemporaryDemo: true,
    },
    course: {
      title: "Tijdelijke demo: Complexiteit in de manuele therapie",
      slug: DEMO_ELEARNING_COURSE_SLUG,
      description:
        "Tijdelijke voorbeeld-e-learning op basis van aangeleverd geaccrediteerd materiaal. Bedoeld als demo voor praktijkhouders; later schoon te verwijderen of te vervangen door eigen Fy-Fit content.",
      audience: "Praktijkhouders, reviewers en Fy-Fit teamleden die de LMS-demo beoordelen",
      learningObjectives:
        "De deelnemer herkent complexiteit in manueeltherapeutische casuïstiek, redeneert systemisch en past interventies iteratief aan op basis van respons en context.",
      goal:
        "Inzicht geven in complexiteit binnen de manuele therapie en laten zien hoe een accreditatie-ready e-learning in de Fy-Fit Academy kan worden opgebouwd.",
      focus:
        "Complexe systemen, emergentie, niet-lineariteit, adaptiviteit, biopsychosociaal redeneren, patroonherkenning en iteratief behandelen.",
      learnerOutcomes: [
        "Je legt het verschil uit tussen gecompliceerde en complexe systemen.",
        "Je beschrijft emergentie, niet-lineariteit en adaptiviteit in klinische voorbeelden.",
        "Je analyseert complexe gezondheidsproblemen met het biopsychosociaal model.",
        "Je herkent patronen in diagnostische gegevens in plaats van enkelvoudige lineaire oorzaken.",
        "Je past behandelstrategieën flexibel en iteratief aan veranderende context aan.",
        "Je herkent complexiteit ook bij ogenschijnlijk eenvoudige klachten.",
      ],
      authorExperts: [
        {
          name: "Tijdelijk voorbeeldmateriaal",
          role: "Geaccrediteerde e-learning broncontent voor demo/pilot",
          organization: "Fy Fit Academy demo-import",
        },
      ],
      accreditationRegister: "KRF NL / SKF Fysiotherapie",
      accreditationKind: "VAKINHOUDELIJK",
      versionDate: "2026-05-01T08:00:00.000Z",
      requiredQuestionCount: 5,
      studyLoadMinutes: 90,
      status: "PUBLISHED",
      isMandatory: false,
      publishedAt: "2026-05-01T08:00:00.000Z",
      revisionDueAt: "2026-11-01T08:00:00.000Z",
    },
    version: {
      versionNumber: "demo-12A.1",
      changeSummary:
        "Sprint 12A: tijdelijke demo-e-learning geïmporteerd met Module 1, video, afbeeldingen, leerdoelen, lessen, reflectiecasus en toetsvragen.",
      isActive: true,
    },
    modules: [
      {
        key: "module-1-complexiteit",
        title: "Module 1: Complexiteit in de manuele therapie",
        description:
          "Introductiemodule over complexiteitsdenken, patroonherkenning en iteratief handelen in manueeltherapeutische casuïstiek.",
        introduction:
          "Denk terug aan een patiënt bij wie het herstel anders verliep dan verwacht. Welke factoren speelden mee, hoe voorspelbaar was het beloop en wat zegt dit over het systeem waar je mee werkt?",
        summary:
          "Complexiteit betekent dat variabiliteit en onzekerheid geen vijand zijn, maar inherent onderdeel van het behandelproces. De manueeltherapeut kijkt breed, stuurt bij, werkt samen en ziet de mens achter de klacht.",
        order: 1,
        estimatedMinutes: 90,
        workForms: ["VIDEO", "TEKST", "CASUS", "REFLECTIE", "TOETS"],
        lessonSlugs: [
          "module-1-video-complexiteit",
          "module-1-wanneer-simpel-complex-wordt",
          "module-1-complexiteit-begrijpen",
          "module-1-bps-en-patroonherkenning",
          "module-1-intervenieren-in-complexiteit",
          "module-1-community-casusreflectie",
          "module-1-toets-complexiteit",
        ],
        assetPaths: [
          `${module1AssetRoot}/images/image1.png`,
          `${module1AssetRoot}/images/image2.png`,
          `${module1AssetRoot}/images/image3.png`,
          `${module1AssetRoot}/images/image4.png`,
        ],
      },
    ],
    learningObjectives: [
      {
        code: "M1-LO1",
        moduleKey: "module-1-complexiteit",
        text: "Na afloop kan de deelnemer het verschil tussen gecompliceerde en complexe systemen uitleggen.",
        order: 1,
      },
      {
        code: "M1-LO2",
        moduleKey: "module-1-complexiteit",
        text: "Na afloop kan de deelnemer de begrippen emergentie, niet-lineariteit en adaptiviteit beschrijven.",
        order: 2,
      },
      {
        code: "M1-LO3",
        moduleKey: "module-1-complexiteit",
        text: "Na afloop kan de deelnemer complexe gezondheidsproblemen analyseren met het biopsychosociaal model.",
        order: 3,
      },
      {
        code: "M1-LO4",
        moduleKey: "module-1-complexiteit",
        text: "Na afloop kan de deelnemer patronen herkennen in diagnostische gegevens in plaats van lineaire oorzaken te zoeken.",
        order: 4,
      },
      {
        code: "M1-LO5",
        moduleKey: "module-1-complexiteit",
        text: "Na afloop kan de deelnemer behandelstrategieën flexibel en iteratief aanpassen aan veranderende context.",
        order: 5,
      },
      {
        code: "M1-LO6",
        moduleKey: "module-1-complexiteit",
        text: "Na afloop kan de deelnemer complexiteit herkennen, ook bij ogenschijnlijk eenvoudige klachten.",
        order: 6,
      },
    ],
    literatureReferences: [
      {
        moduleKey: "module-1-complexiteit",
        title: "Embodied-enactive clinical reasoning in physical therapy",
        source: "Aangeleverde literatuur bij geaccrediteerde voorbeeldmodule",
        guideline: "Belichaamd-enactief klinisch redeneren",
        order: 1,
      },
      {
        moduleKey: "module-1-complexiteit",
        title: "Optimal Movement Variability: A New Theoretical Perspective for Neurologic Physical Therapy",
        source: "Stergiou & Decker",
        year: 2011,
        guideline: "Complexiteit, variabiliteit en adaptiviteit",
        order: 2,
      },
      {
        moduleKey: "module-1-complexiteit",
        title: "Health and disease-emergent states resulting from adaptive social and biological network interactions",
        source: "Sturmberg et al.",
        year: 2014,
        guideline: "Complexe systemen en emergentie in de zorg",
        order: 3,
      },
    ],
    competencyReferences: [
      {
        moduleKey: "module-1-complexiteit",
        name: "Klinisch redeneren en professioneel handelen",
        framework: "Kwaliteitshuis Fysiotherapie / manuele therapie competentieprofiel",
        description:
          "De deelnemer redeneert systemisch, betrekt biologische, psychologische en sociale factoren en past het behandelplan responsief aan.",
      },
    ],
    evaluationForm: {
      title: "Evaluatie tijdelijke demo-e-learning complexiteit",
      isRequired: true,
      questions: [
        { label: "Niveau/diepgang", type: "SCALE_1_5", order: 1, isRequired: true },
        { label: "Relevantie voor de praktijk", type: "SCALE_1_5", order: 2, isRequired: true },
        { label: "Toepasbaarheid", type: "SCALE_1_5", order: 3, isRequired: true },
        { label: "Kwaliteit van de leerstof", type: "SCALE_1_5", order: 4, isRequired: true },
        { label: "Toets passend bij de leerstof", type: "SCALE_1_5", order: 5, isRequired: true },
        { label: "Geschatte versus werkelijke studielast", type: "TEXT", order: 6, isRequired: true },
        { label: "Verbeterpunten", type: "TEXT", order: 7, isRequired: false },
      ],
    },
    lessons: [
      {
        slug: "module-1-video-complexiteit",
        title: "Video: inleiding complexiteit in de manuele therapie",
        description: "Bekijk de introductievideo bij Module 1.",
        type: "VIDEO",
        content: `Bekijk de video bij deze module.\n\nVideo: ${module1AssetRoot}/module-1-complexiteit.mp4`,
        assetPath: `${module1AssetRoot}/module-1-complexiteit.mp4`,
        order: 1,
        isRequired: true,
        estimatedMinutes: 8,
      },
      {
        slug: "module-1-wanneer-simpel-complex-wordt",
        title: "Les 1: Wanneer simpel complex wordt",
        description: "Drie scenario's laten zien hoe ogenschijnlijk vergelijkbare klachten verschillend kunnen verlopen.",
        type: "TEXT",
        content:
          "Een patiënt met eerste episode nekpijn na klussen kan voorspelbaar herstellen na mobilisaties en beweegadvies. Een tweede patiënt met dezelfde klacht blijkt terugkerende klachten, werkdruk, slecht slapen en frustratie te hebben. Een derde patiënt met lage rug- en beenklachten heeft comorbiditeit, beperkte gezondheidsvaardigheden en weinig sociale steun. Deze scenario's tonen verschillende niveaus van complexiteit en maken duidelijk dat onvoorspelbaar herstel vaak een kenmerk is van menselijke variabiliteit.",
        order: 2,
        isRequired: true,
        estimatedMinutes: 12,
      },
      {
        slug: "module-1-complexiteit-begrijpen",
        title: "Les 2: Complexiteit begrijpen",
        description: "Conceptuele duiding van emergentie, niet-lineariteit en adaptiviteit.",
        type: "TEXT",
        content:
          "Een klok is gecompliceerd: veel onderdelen, maar voorspelbaar. Het menselijk lichaam is complex: onderdelen werken continu op elkaar in en het geheel is meer dan de som der delen. Emergentie beschrijft nieuwe patronen uit interacties. Niet-lineariteit verklaart waarom kleine veranderingen grote effecten kunnen hebben en grote interventies soms weinig doen. Adaptiviteit beschrijft hoe levende systemen zich aanpassen aan interne en externe prikkels.\n\nAfbeeldingen bij deze les:\n- /lms/demo-geaccrediteerde-elearning/module-1/images/image1.png\n- /lms/demo-geaccrediteerde-elearning/module-1/images/image2.png",
        order: 3,
        isRequired: true,
        estimatedMinutes: 15,
      },
      {
        slug: "module-1-bps-en-patroonherkenning",
        title: "Les 3-4: Biopsychosociaal redeneren en patroonherkenning",
        description: "Gebruik het BPS-model als dynamisch raamwerk en zoek naar patronen in plaats van één oorzaak.",
        type: "TEXT",
        content:
          "Complexiteit komt in de kliniek tot uiting via biologische, psychologische en sociale factoren. Deze factoren beïnvloeden elkaar voortdurend. Diagnostisch denken verschuift daardoor van lineair oorzaak-gevolg redeneren naar patroonherkenning en systeemanalyse. Je formuleert een werkhypothese over samenhangende factoren en toetst die iteratief door de respons op interventies te monitoren.\n\nAfbeeldingen bij deze les:\n- /lms/demo-geaccrediteerde-elearning/module-1/images/image3.png\n- /lms/demo-geaccrediteerde-elearning/module-1/images/image4.png",
        order: 4,
        isRequired: true,
        estimatedMinutes: 15,
      },
      {
        slug: "module-1-intervenieren-in-complexiteit",
        title: "Les 5-6: Interveniëren in complexiteit en afronding",
        description: "Multifactoriële, iteratieve aanpak met ruimte om doelen bij te stellen.",
        type: "TEXT",
        content:
          "Interveniëren in complexiteit vraagt om meerdere aangrijpingspunten: manuele mobilisaties of oefentherapie, pijneducatie, stressmanagement, ontspanning en contextuele aanpassingen. Elke behandeling is ook een evaluatiemoment. Op basis van feedback stel je het plan bij. Succes meet je niet alleen als einddoel, maar ook als beter omgaan met fluctuaties, meer vertrouwen en verbeteringen in meerdere levensdomeinen.",
        order: 5,
        isRequired: true,
        estimatedMinutes: 15,
      },
      {
        slug: "module-1-community-casusreflectie",
        title: "Community-opdracht: casusreflectie en systeemanalyse",
        description: "Werk een fictieve schoudercasus systemisch uit.",
        type: "REFLECTION",
        content:
          "Casus: je behandelt een 39-jarige vrouw met langdurige schouderklachten. Na een aanvankelijke verbetering verslechtert de klacht onverwacht. Ze slaapt slecht, voelt zich overbelast door werk, jonge kinderen en mantelzorg, ervaart spanning en heeft weinig steun doordat haar partner veel in het buitenland werkt. Reflecteer op: 1) welke factoren maken het beloop onvoorspelbaar of niet-lineair? 2) welke werkhypothese past bij het biopsychosociaal model? 3) benoem drie interventies uit biologische, psychologische en sociale/contextuele domeinen en hoe je de respons monitort.",
        order: 6,
        isRequired: true,
        estimatedMinutes: 15,
      },
      {
        slug: "module-1-toets-complexiteit",
        title: "Toets: complexiteit in de manuele therapie",
        description: "Beantwoord de toetsvragen. Norm: 70%, maximaal 3 pogingen.",
        type: "ASSESSMENT",
        content: "Maak de toets om Module 1 af te ronden.",
        order: 7,
        isRequired: true,
        estimatedMinutes: 10,
      },
    ],
    assessment: {
      title: "Kennistoets Module 1: Complexiteit in de manuele therapie",
      description: "Toets op complexiteitsdenken, belichaamd-enactief redeneren, variabiliteit en emergentie.",
      passPercentage: 70,
      maxAttempts: 3,
      timeLimitMinutes: 20,
      shuffleQuestions: true,
      shuffleOptions: true,
      showFeedbackImmediately: true,
      isRequiredForCompletion: true,
      lessonSlug: "module-1-toets-complexiteit",
      questions: [
        {
          key: "m1-q1",
          type: "MULTIPLE_CHOICE",
          prompt:
            "Welke visie op het lichaam en klinisch redeneren sluit aan bij embodied-enactive clinical reasoning en complexiteitsdenken?",
          explanation:
            "Een belichaamd-enactieve benadering ziet de patiënt als levend subject dat actief betekenis geeft aan de ervaring, passend bij complexiteitsdenken.",
          points: 1,
          learningObjectiveCodes: ["M1-LO2", "M1-LO6"],
          options: [
            { label: "Het lichaam is een machine waarbij klachten objectief en lineair opgelost worden.", isCorrect: false },
            { label: "De patiënt wordt holistisch en actief benaderd als mens in context.", isCorrect: true },
            { label: "Klinisch redeneren richt zich uitsluitend op biomechanische dysfuncties.", isCorrect: false },
            { label: "De patiënt is vooral passieve ontvanger van behandeling.", isCorrect: false },
          ],
        },
        {
          key: "m1-q2",
          type: "MULTIPLE_CHOICE",
          prompt: "Wat benadrukken Stergiou & Decker over bewegingsvariabiliteit?",
          explanation:
            "Gezonde motoriek vraagt optimale variabiliteit: niet te rigide, niet chaotisch, maar adaptief.",
          points: 1,
          learningObjectiveCodes: ["M1-LO2"],
          options: [
            { label: "Variabiliteit is altijd ongewenste ruis.", isCorrect: false },
            { label: "Optimale variabiliteit ondersteunt adaptiviteit; extremen kunnen pathologie weerspiegelen.", isCorrect: true },
            { label: "Een volledig stabiel bewegingspatroon is altijd gezond.", isCorrect: false },
            { label: "Variabiliteit heeft niets te maken met gezondheid of functioneren.", isCorrect: false },
          ],
        },
        {
          key: "m1-q3",
          type: "MULTIPLE_CHOICE",
          prompt: "Welke uitspraak past het best bij complexiteitsdenken in de klinische praktijk?",
          explanation:
            "In complexe systemen werk je cyclisch: behandeling levert informatie op waarmee hypothese en plan worden bijgesteld.",
          points: 1,
          learningObjectiveCodes: ["M1-LO4", "M1-LO5"],
          options: [
            { label: "Analyseer elk onderdeel afzonderlijk; het geheel is de optelsom van delen.", isCorrect: false },
            { label: "Gebruik een iteratieve aanpak waarin elke behandeling ook een test is.", isCorrect: true },
            { label: "Volg altijd een vast protocol om onzekerheid te vermijden.", isCorrect: false },
            { label: "Elimineer variabiliteit omdat dit vooral foutenmarge is.", isCorrect: false },
          ],
        },
        {
          key: "m1-q4",
          type: "MULTIPLE_CHOICE",
          prompt: "Wat is een kenmerk van een gezond complex systeem?",
          explanation:
            "Gezonde systemen balanceren tussen te veel en te weinig variabiliteit, waardoor flexibiliteit en adaptatie mogelijk blijven.",
          points: 1,
          learningObjectiveCodes: ["M1-LO1", "M1-LO2"],
          options: [
            { label: "Hoe minder variatie, hoe gezonder het systeem.", isCorrect: false },
            { label: "Een optimale mate van variabiliteit ondersteunt flexibiliteit en adaptatie.", isCorrect: true },
            { label: "Gezonde systemen zijn volledig voorspelbaar.", isCorrect: false },
            { label: "Variabiliteit moet zoveel mogelijk worden geëlimineerd.", isCorrect: false },
          ],
        },
        {
          key: "m1-q5",
          type: "MULTIPLE_CHOICE",
          prompt: "Wat betekent emergentie binnen een complex systeem?",
          explanation:
            "Emergentie betekent dat nieuwe eigenschappen of patronen ontstaan uit interacties tussen onderdelen en niet terug te brengen zijn tot één oorzaak.",
          points: 1,
          learningObjectiveCodes: ["M1-LO2", "M1-LO3"],
          options: [
            { label: "Het gedrag is volledig voorspelbaar als je alle onderdelen kent.", isCorrect: false },
            { label: "Problemen ontstaan altijd door één dominante oorzaak.", isCorrect: false },
            { label: "Nieuwe patronen ontstaan uit interacties tussen componenten.", isCorrect: true },
            { label: "Je voorkomt complexiteit door elk onderdeel apart te behandelen.", isCorrect: false },
          ],
        },
      ],
    },
  };
}
