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

export type DemoElearningAssessmentSpec = {
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
  assessments: DemoElearningAssessmentSpec[];
};

const module1AssetRoot = `${DEMO_ELEARNING_ASSET_ROOT}/module-1`;
const module2AssetRoot = `${DEMO_ELEARNING_ASSET_ROOT}/module-2`;

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
        "De deelnemer herkent complexiteit in manueeltherapeutische casuïstiek, redeneert systemisch en past interventies iteratief aan op basis van respons en context. De deelnemer past het biopsychosociaal model toe als dynamisch netwerk waarin biologische, psychologische en sociale factoren elkaar voortdurend beïnvloeden. De deelnemer vat de kernprincipes samen en vertaalt deze naar de eigen dagelijkse praktijk.",
      goal:
        "Inzicht geven in complexiteit binnen de manuele therapie en laten zien hoe een accreditatie-ready e-learning in de Fy-Fit Academy kan worden opgebouwd.",
      focus:
        "Complexe systemen, emergentie, niet-lineariteit, adaptiviteit, biopsychosociaal redeneren, patroonherkenning, terugkoppelingslussen en iteratief behandelen.",
      learnerOutcomes: [
        "Je legt het verschil uit tussen gecompliceerde en complexe systemen.",
        "Je beschrijft emergentie, niet-lineariteit en adaptiviteit in klinische voorbeelden.",
        "Je analyseert complexe gezondheidsproblemen met het biopsychosociaal model.",
        "Je herkent patronen in diagnostische gegevens in plaats van enkelvoudige lineaire oorzaken.",
        "Je past behandelstrategieën flexibel en iteratief aan veranderende context aan.",
        "Je herkent complexiteit ook bij ogenschijnlijk eenvoudige klachten.",
        "Je gebruikt het biopsychosociaal model als één samenhangend dynamisch systeem.",
        "Je herkent niet-lineaire effecten, adaptatie en terugkoppelingslussen in nekpijncasuïstiek.",
        "Je formuleert integrale interventies over biologische, psychologische en sociale domeinen heen.",
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
      requiredQuestionCount: 10,
      studyLoadMinutes: 210,
      status: "PUBLISHED",
      isMandatory: false,
      publishedAt: "2026-05-01T08:00:00.000Z",
      revisionDueAt: "2026-11-01T08:00:00.000Z",
    },
    version: {
      versionNumber: "demo-12C.1",
      changeSummary:
        "Sprint 12C: tijdelijke demo-e-learning afgerond met Module 3 voor samenvatting, praktijktransfer en evaluatie, plus modulegebonden toetsmomenten na de inhoudelijke modules.",
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
      {
        key: "module-2-bps-dynamisch-systeem",
        title: "Module 2: Het biopsychosociaal model als dynamisch systeem",
        description:
          "Verdieping op het BPS-model als geïntegreerd netwerk van biologische, psychologische en sociale factoren, toegepast op nekpijncasuïstiek.",
        introduction:
          "Denk terug aan een patiënt met een lichamelijke klacht waarbij psychosociale factoren zoals stress, emoties of context zichtbaar meespeelden. Wat zou je met een systeembril hetzelfde doen en wat anders?",
        summary:
          "Het BPS-model is geen optelsom van drie losse domeinen, maar een dynamisch netwerk. Klinisch redeneren vraagt patroonherkenning, werkhypothesen, iteratief bijstellen en interventies over meerdere domeinen heen.",
        order: 2,
        estimatedMinutes: 90,
        workForms: ["TEKST", "CASUS", "REFLECTIE", "TOETS"],
        lessonSlugs: [
          "module-2-inleiding-nekpijn-context",
          "module-2-bps-dynamisch-netwerk",
          "module-2-complexiteitsprincipes-bps",
          "module-2-klinisch-redeneren-bps",
          "module-2-integrale-flexibele-aanpak",
          "module-2-community-casusreflectie",
          "module-2-toets-bps-dynamisch-systeem",
        ],
        assetPaths: [
          `${module2AssetRoot}/images/image1.png`,
          `${module2AssetRoot}/images/image2.png`,
        ],
      },
      {
        key: "module-3-samenvatting-afsluiting",
        title: "Module 3: Samenvatting en afsluiting",
        description:
          "Afsluitende module met samenvatting van de kernprincipes, praktijktransfer en evaluatie-uitnodiging.",
        introduction:
          "Je vat de belangrijkste inzichten uit complexiteitsdenken en het BPS-model samen en vertaalt ze naar je dagelijkse praktijk.",
        summary:
          "De e-learning laat zien dat klachten en herstel vaak niet-lineair verlopen. De therapeut werkt als gids in een netwerk van invloeden, herkent patronen, stelt hypothesen bij en blijft flexibel handelen.",
        order: 3,
        estimatedMinutes: 30,
        workForms: ["TEKST", "REFLECTIE"],
        lessonSlugs: [
          "module-3-samenvatting-kernprincipes",
          "module-3-reflectie-praktijktransfer",
          "module-3-afsluiting-evaluatie",
        ],
        assetPaths: [],
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
      {
        code: "M2-LO1",
        moduleKey: "module-2-bps-dynamisch-systeem",
        text: "Na afloop kan de deelnemer uitleggen waarom het biopsychosociaal model als één samenhangend geheel gezien moet worden.",
        order: 7,
      },
      {
        code: "M2-LO2",
        moduleKey: "module-2-bps-dynamisch-systeem",
        text: "Na afloop kan de deelnemer beschrijven hoe biologische, psychologische en sociale factoren elkaar beïnvloeden bij musculoskeletale klachten zoals nekpijn.",
        order: 8,
      },
      {
        code: "M2-LO3",
        moduleKey: "module-2-bps-dynamisch-systeem",
        text: "Na afloop kan de deelnemer voorbeelden geven van niet-lineaire effecten, adaptatie en terugkoppelingslussen in een klinische casus.",
        order: 9,
      },
      {
        code: "M2-LO4",
        moduleKey: "module-2-bps-dynamisch-systeem",
        text: "Na afloop kan de deelnemer een patiëntcasus analyseren met nadruk op patroonherkenning en systeemanalyse.",
        order: 10,
      },
      {
        code: "M2-LO5",
        moduleKey: "module-2-bps-dynamisch-systeem",
        text: "Na afloop kan de deelnemer een integrale behandelstrategie opstellen en bijstellen op basis van patiëntrespons.",
        order: 11,
      },
      {
        code: "M2-LO6",
        moduleKey: "module-2-bps-dynamisch-systeem",
        text: "Na afloop kan de deelnemer herkennen bij welke patiënten een brede biopsychosociale benadering nodig is.",
        order: 12,
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
      {
        moduleKey: "module-2-bps-dynamisch-systeem",
        title: "An enactive approach to pain: beyond the biopsychosocial model",
        source: "Stilwell & Harman",
        year: 2019,
        guideline: "Pijn als relationeel en emergent proces",
        order: 4,
      },
      {
        moduleKey: "module-2-bps-dynamisch-systeem",
        title: "Person-centred care for musculoskeletal pain",
        source: "Hutting et al.",
        year: 2022,
        guideline: "Persoonsgerichte zorg en toepassing van het BPS-model",
        order: 5,
      },
      {
        moduleKey: "module-2-bps-dynamisch-systeem",
        title: "Health and disease-emergent states resulting from adaptive social and biological network interactions",
        source: "Sturmberg et al.",
        year: 2014,
        guideline: "Systeemdenken, niet-lineariteit en terugkoppelingslussen",
        order: 6,
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
      {
        moduleKey: "module-2-bps-dynamisch-systeem",
        name: "Biopsychosociaal klinisch redeneren en persoonsgerichte zorg",
        framework: "Kwaliteitshuis Fysiotherapie / manuele therapie competentieprofiel",
        description:
          "De deelnemer analyseert klachten als dynamisch biopsychosociaal netwerk en integreert biologische, psychologische en sociale interventies persoonsgericht.",
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
        title: "Kennischeck: complexiteit in de manuele therapie",
        description: "Korte kennischeck bij Module 1. De centrale toets loopt door na Module 2.",
        type: "ASSESSMENT",
        content: "Gebruik deze les als tussencheck. De formele toetsbank voor de tijdelijke demo wordt na Module 2 aangeboden en bevat vragen over Module 1 en 2.",
        order: 7,
        isRequired: true,
        estimatedMinutes: 10,
      },
      {
        slug: "module-2-inleiding-nekpijn-context",
        title: "Module 2 inleiding: nekpijn in biopsychosociale context",
        description: "Introductie van nekpijn als casus waarin lichamelijke, psychologische en contextuele factoren samenkomen.",
        type: "TEXT",
        content:
          "Module 2 verdiept het biopsychosociaal model als geïntegreerd en dynamisch systeem. De casus uit Module 1 wordt doorgetrokken: een 34-jarige man met terugkerende nekklachten waarbij werkdruk, slaap, frustratie en pijn elkaar beïnvloeden. De centrale vraag is niet welk domein de enige oorzaak is, maar hoe factoren elkaar versterken, afremmen en in de tijd veranderen.",
        order: 8,
        isRequired: true,
        estimatedMinutes: 10,
      },
      {
        slug: "module-2-bps-dynamisch-netwerk",
        title: "Les 1: Het biopsychosociaal model als dynamisch netwerk",
        description: "Het BPS-model niet als drie losse lijstjes, maar als een netwerk van interacties.",
        type: "TEXT",
        content:
          `Het biopsychosociaal model als dynamisch netwerk betekent dat biologische, psychologische en sociale factoren elkaar voortdurend beïnvloeden. Stress kan spierspanning en pijngevoeligheid verhogen; pijn kan frustratie en angst voeden; beperkte sociale steun kan herstelgedrag onder druk zetten. Het geheel is meer dan de som der delen.\n\nAfbeelding bij deze les:\n- ${module2AssetRoot}/images/image1.png`,
        order: 9,
        isRequired: true,
        estimatedMinutes: 15,
      },
      {
        slug: "module-2-complexiteitsprincipes-bps",
        title: "Les 2: Niet-lineariteit, adaptiviteit en terugkoppelingslussen",
        description: "Complexiteitsprincipes toegepast op het biopsychosociaal model.",
        type: "TEXT",
        content:
          `Niet-lineariteit verklaart waarom een kleine trigger zoals een slechte nacht of deadline disproportioneel veel pijn kan geven. Adaptiviteit beschrijft hoe de patiënt gedrag en lichaamshouding aanpast om pijn te vermijden; helpend op korte termijn, maar soms onderhoudend op lange termijn. Terugkoppelingslussen laten zien hoe pijn, angst, spierspanning, stress en vermijding elkaar kunnen versterken, maar ook hoe kleine positieve veranderingen een opwaartse spiraal kunnen starten.\n\nAfbeelding bij deze les:\n- ${module2AssetRoot}/images/image2.png`,
        order: 10,
        isRequired: true,
        estimatedMinutes: 15,
      },
      {
        slug: "module-2-klinisch-redeneren-bps",
        title: "Les 3: Klinisch redeneren in een biopsychosociaal systeem",
        description: "Van oorzaak zoeken naar patronen, werkhypothesen en iteratief toetsen.",
        type: "TEXT",
        content:
          "Diagnostiek in een biopsychosociaal systeem vraagt patroonherkenning: wanneer nemen klachten toe, wanneer verminderen ze en welke gebeurtenissen gingen eraan vooraf? Je formuleert een werkhypothese over samenhangende factoren en toetst die in de behandeling. Iedere sessie levert feedback op waarmee je het model bijstelt. Onzekerheid is daarbij geen fout, maar onderdeel van professioneel redeneren in complexe casuïstiek.",
        order: 11,
        isRequired: true,
        estimatedMinutes: 15,
      },
      {
        slug: "module-2-integrale-flexibele-aanpak",
        title: "Les 4: Integrale en flexibele aanpak",
        description: "Interventies combineren over biologische, psychologische en sociale domeinen.",
        type: "TEXT",
        content:
          "Een integrale aanpak combineert meerdere aangrijpingspunten. Biologisch kun je mobilisaties, oefentherapie en graded exposure inzetten. Psychologisch werk je aan veiligheid, pijneducatie, catastroferen, motivatie en vertrouwen. Sociaal/contextueel kijk je naar werkdruk, steun, ergonomie, belasting en participatie. Je hoeft niet alles tegelijk te doen; je kiest prioriteiten samen met de patiënt en stuurt bij op respons.",
        order: 12,
        isRequired: true,
        estimatedMinutes: 15,
      },
      {
        slug: "module-2-community-casusreflectie",
        title: "Community-opdracht: biopsychosociale analyse na whiplash",
        description: "Analyseer een casus met aanhoudende nek- en hoofdpijn na een kop-staartbotsing.",
        type: "REFLECTION",
        content:
          "Casus: een 28-jarige vrouw heeft zes maanden na een kop-staartbotsing nog nekpijn en hoofdpijn. Er is geen ernstige weefselschade gevonden, maar ze vermijdt autorijden, slaapt slecht, sport niet meer, werkt minder en blijft bang dat er iets ernstigs over het hoofd is gezien. Reflecteer op: 1) welke factoren maken het beloop onvoorspelbaar of niet-lineair? 2) welke werkhypothese past bij het samenspel tussen biologische, psychologische en sociale factoren? 3) noem drie interventies uit verschillende domeinen en beschrijf hoe je het effect monitort.",
        order: 13,
        isRequired: true,
        estimatedMinutes: 15,
      },
      {
        slug: "module-2-toets-bps-dynamisch-systeem",
        title: "Toets: BPS-model als dynamisch systeem",
        description: "Beantwoord de toetsvragen. Norm: 70%, maximaal 3 pogingen.",
        type: "ASSESSMENT",
        content: "Maak de Module 2-toets. De toets gebruikt 70% als norm, maximaal 3 pogingen en gerandomiseerde volgorde.",
        order: 14,
        isRequired: true,
        estimatedMinutes: 10,
      },
      {
        slug: "module-3-samenvatting-kernprincipes",
        title: "Samenvatting van de kernprincipes",
        description: "Overzicht van de belangrijkste inzichten uit Module 1 en Module 2.",
        type: "TEXT",
        content:
          "Module 1 liet zien dat klachten niet altijd lineair of voorspelbaar herstellen. Complexe systemen kenmerken zich door emergentie, niet-lineariteit en adaptiviteit. Module 2 verdiepte het biopsychosociaal model als dynamisch netwerk: biologische, psychologische en sociale factoren beïnvloeden elkaar voortdurend. Klinisch redeneren betekent daardoor denken in relaties, patronen en feedback in plaats van losse invuloefeningen.",
        order: 15,
        isRequired: true,
        estimatedMinutes: 10,
      },
      {
        slug: "module-3-reflectie-praktijktransfer",
        title: "Reflectie: praktijktransfer",
        description: "Vertaal de inzichten naar je eigen dagelijkse praktijk.",
        type: "REFLECTION",
        content:
          "Denk terug aan een patiënt uit je praktijk waarbij het herstel grillig verliep. Hoe kijk je nu, met de kennis uit deze e-learning, naar de factoren die mogelijk meespeelden? Welke verbanden zie je die je eerder misschien over het hoofd zag? En welk ander handelen zou je nu overwegen in je dagelijkse praktijk?",
        order: 16,
        isRequired: true,
        estimatedMinutes: 10,
      },
      {
        slug: "module-3-afsluiting-evaluatie",
        title: "Afsluiting en evaluatie",
        description: "Rond de tijdelijke demo-e-learning af en vul de evaluatie in.",
        type: "TEXT",
        content:
          "Deze afsluitende les markeert het einde van de tijdelijke demo-e-learning. De inhoud is bedoeld om praktijkhouders en reviewers te laten zien hoe een accreditatie-ready leerroute eruit kan zien. Vul na afronding de evaluatie in: algemene indruk, inhoudelijke beoordeling, praktische toepasbaarheid, didactiek, inzicht/bewustwording, verbeterpunten en aanbeveling.",
        order: 17,
        isRequired: true,
        estimatedMinutes: 10,
      },
    ],
    assessments: [
      {
        title: "Kennistoets Module 1: Complexiteit in de manuele therapie",
        description: "Toets na Module 1 op complexiteitsdenken, belichaamd-enactief redeneren, variabiliteit en emergentie.",
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
      {
        title: "Kennistoets Module 2: Het biopsychosociaal model als dynamisch systeem",
        description: "Toets na Module 2 op BPS als dynamisch netwerk, patroonherkenning, persoonsgerichte zorg en integrale interventies.",
        passPercentage: 70,
        maxAttempts: 3,
        timeLimitMinutes: 20,
        shuffleQuestions: true,
        shuffleOptions: true,
        showFeedbackImmediately: true,
        isRequiredForCompletion: true,
        lessonSlug: "module-2-toets-bps-dynamisch-systeem",
        questions: [
        {
          key: "m2-q1",
          type: "MULTIPLE_CHOICE",
          prompt:
            "Welke uitspraak sluit het best aan bij een enactive benadering van pijn en bij Module 2 over het BPS-model?",
          explanation:
            "Pijn wordt gezien als een relationeel en emergent proces van betekenisgeving via het levende lichaam in wisselwerking met de omgeving.",
          points: 1,
          learningObjectiveCodes: ["M2-LO1", "M2-LO2"],
          options: [
            { label: "Pijn is primair een lineair gevolg van weefselschade.", isCorrect: false },
            { label: "Het BPS-model moet volledig vervangen worden omdat het geen houvast biedt.", isCorrect: false },
            { label: "Pijn ontstaat relationeel en emergent in wisselwerking tussen lichaam, betekenis en omgeving.", isCorrect: true },
            { label: "Biologische, psychologische en sociale dimensies moeten strikt gescheiden worden.", isCorrect: false },
          ],
        },
        {
          key: "m2-q2",
          type: "MULTIPLE_CHOICE",
          prompt:
            "Welke houding past niet bij persoonsgerichte zorg bij musculoskeletale pijn?",
          explanation:
            "Persoonsgerichte zorg vraagt gezamenlijke besluitvorming, zelfmanagement en een sterke therapeutische relatie; de patiënt is geen passieve ontvanger.",
          points: 1,
          learningObjectiveCodes: ["M2-LO5", "M2-LO6"],
          options: [
            { label: "Een biopsychosociaal perspectief gebruiken binnen de context van iemands leven.", isCorrect: false },
            { label: "Open communicatie, empathie en vertrouwen centraal zetten.", isCorrect: false },
            { label: "De patiënt als passieve ontvanger zien die adviezen klakkeloos opvolgt.", isCorrect: true },
            { label: "Zelfmanagement en gezamenlijke besluitvorming ondersteunen.", isCorrect: false },
          ],
        },
        {
          key: "m2-q3",
          type: "MULTIPLE_CHOICE",
          prompt:
            "Wat is een belangrijk obstakel voor implementatie van persoonsgerichte zorg bij musculoskeletale pijn?",
          explanation:
            "Beperkte tijd, vaardigheden en hulpmiddelen worden genoemd als obstakels voor effectieve toepassing van het BPS-model.",
          points: 1,
          learningObjectiveCodes: ["M2-LO5", "M2-LO6"],
          options: [
            { label: "Een gebrek aan geavanceerde beeldvorming.", isCorrect: false },
            { label: "Het idee dat persoonsgerichte zorg nooit effectief is.", isCorrect: false },
            { label: "Beperkte tijd, vaardigheden en hulpmiddelen voor toepassing van het BPS-model.", isCorrect: true },
            { label: "Patiënten tonen meestal geen interesse in eigen regie.", isCorrect: false },
          ],
        },
        {
          key: "m2-q4",
          type: "MULTIPLE_CHOICE",
          prompt:
            "Wat betekent dat pijn relationeel en emergent is binnen een dynamisch biopsychosociaal systeem?",
          explanation:
            "Pijn ontstaat uit een veranderlijk samenspel tussen biologische processen, persoonlijke betekenisgeving en sociale context.",
          points: 1,
          learningObjectiveCodes: ["M2-LO2", "M2-LO3"],
          options: [
            { label: "Pijn ontstaat alleen bij weefselschade.", isCorrect: false },
            { label: "Pijn volgt een vaste lineaire relatie tussen biologie en interpretatie.", isCorrect: false },
            { label: "Pijn ontstaat uit dynamisch samenspel tussen lichaam, betekenisgeving en context.", isCorrect: true },
            { label: "Pijn wordt volledig bepaald door genetische en biologische factoren.", isCorrect: false },
          ],
        },
        {
          key: "m2-q5",
          type: "MULTIPLE_CHOICE",
          prompt:
            "Welke uitspraak past bij systeemdenken volgens Sturmberg et al. in relatie tot het BPS-model?",
          explanation:
            "Gezondheid en ziekte ontstaan uit dynamische interacties met niet-lineaire verbanden en terugkoppelingslussen.",
          points: 1,
          learningObjectiveCodes: ["M2-LO1", "M2-LO3", "M2-LO4"],
          options: [
            { label: "Losse domeinen apart analyseren levert vanzelf de juiste diagnose op.", isCorrect: false },
            { label: "Menselijk functioneren is de optelsom van afzonderlijke onderdelen.", isCorrect: false },
            { label: "Gezondheid en ziekte ontstaan uit dynamische interacties met feedback en niet-lineariteit.", isCorrect: true },
            { label: "Standaardprotocollen elimineren complexiteit grotendeels.", isCorrect: false },
          ],
        },
        ],
      },
    ],
  };
}
