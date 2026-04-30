import { config } from "dotenv";
config({ path: ".env.local" });
config();

import { PrismaPg } from "@prisma/adapter-pg";
import {
  DocumentType,
  LearningGoalStatus,
  ModulePublicationStatus,
  ModuleSectionType,
  PrismaClient,
  Role,
  Visibility,
} from "@prisma/client";

import { buildLmsSeedSpec } from "./lms-seed-data.ts";
import { hashPassword } from "../src/lib/password.ts";

const prisma = new PrismaClient({
  adapter: new PrismaPg({
    connectionString:
      process.env.DIRECT_URL ??
      process.env.DATABASE_URL ??
      "postgresql://placeholder:***@localhost:5432/fyfitacademy?schema=public",
  }),
});

async function main() {
  await prisma.assessmentAnswer.deleteMany();
  await prisma.assessmentAttempt.deleteMany();
  await prisma.questionLearningObjective.deleteMany();
  await prisma.questionOption.deleteMany();
  await prisma.question.deleteMany();
  await prisma.assessment.deleteMany();
  await prisma.evaluationAnswer.deleteMany();
  await prisma.evaluationSubmission.deleteMany();
  await prisma.evaluationQuestion.deleteMany();
  await prisma.evaluationForm.deleteMany();
  await prisma.lessonProgress.deleteMany();
  await prisma.enrollment.deleteMany();
  await prisma.certificate.deleteMany();
  await prisma.lesson.deleteMany();
  await prisma.learningObjective.deleteMany();
  await prisma.literatureReference.deleteMany();
  await prisma.competencyReference.deleteMany();
  await prisma.courseModule.deleteMany();
  await prisma.courseChangeLog.deleteMany();
  await prisma.courseVersion.deleteMany();
  await prisma.course.deleteMany();
  await prisma.moduleProgress.deleteMany();
  await prisma.onboardingProgress.deleteMany();
  await prisma.learningGoal.deleteMany();
  await prisma.developmentDocument.deleteMany();
  await prisma.moduleSection.deleteMany();
  await prisma.module.deleteMany();
  await prisma.document.deleteMany();
  await prisma.onboardingStep.deleteMany();
  await prisma.onboardingPath.deleteMany();
  await prisma.category.deleteMany();
  await prisma.user.deleteMany();

  const passwordHash = await hashPassword("fyfit-demo");

  const categories = await Promise.all([
    prisma.category.create({ data: { name: "Organisatie", icon: "Structuur", order: 1 } }),
    prisma.category.create({ data: { name: "Communicatie", icon: "Gesprek", order: 2 } }),
    prisma.category.create({ data: { name: "Lage rug", icon: "Rug", order: 3 } }),
    prisma.category.create({ data: { name: "Onboarding", icon: "Start", order: 4 } }),
  ]);

  const [organisatie, communicatie, rug] = categories;

  const admin = await prisma.user.create({
    data: {
      email: "marion@fysiotherapienijmegen.nl",
      passwordHash,
      name: "Marion Brouwer",
      role: Role.BEHEERDER,
      team: "Academy",
      title: "Praktijkmanager",
      location: "Nijmegen",
      bio: "Stuurt de Academy aan en bewaakt de kwaliteit van onboarding, bibliotheek en teamontwikkeling.",
      avatarColor: "bg-[var(--brand)]",
      isOnboarding: false,
      isActive: true,
    },
  });

  const teamlead = await prisma.user.create({
    data: {
      email: "sjoerd@fysiotherapienijmegen.nl",
      passwordHash,
      name: "Sjoerd Hendriks",
      role: Role.TEAMLEIDER,
      team: "Sport",
      title: "Sportfysiotherapeut",
      location: "Lankforst",
      bio: "Begeleidt teamleden op sportrevalidatie, casuistiek en persoonlijke ontwikkeling.",
      avatarColor: "bg-[var(--teal)]",
      isOnboarding: false,
      isActive: true,
    },
  });

  const reviewer = await prisma.user.create({
    data: {
      email: "accreditatie@fysiotherapienijmegen.nl",
      passwordHash,
      name: "Accreditatiecommissie Reviewer",
      role: Role.REVIEWER,
      team: "Academy",
      title: "Reviewer accreditatiecommissie",
      location: "Extern",
      bio:
        "Reviewer-account voor accreditatiecommissie: inzage in e-learningstructuur zonder echte gebruikersdata te vervuilen.",
      avatarColor: "bg-slate-500",
      isOnboarding: false,
      isActive: true,
    },
  });

  const medewerker1 = await prisma.user.create({
    data: {
      email: "luuk@fysiotherapienijmegen.nl",
      passwordHash,
      name: "Luuk Smeekens",
      role: Role.MEDEWERKER,
      team: "Algemeen",
      title: "Algemeen fysiotherapeut",
      location: "Weezenhof",
      bio: "Bouwt aan een stevige basis in behandelvisie, communicatie en het werken met de Fy-fit standaarden.",
      avatarColor: "bg-amber-500",
      buddyId: teamlead.id,
      teamleaderId: teamlead.id,
      isOnboarding: true,
      isActive: true,
    },
  });

  const medewerker2 = await prisma.user.create({
    data: {
      email: "bram@fysiotherapienijmegen.nl",
      passwordHash,
      name: "Bram Heldens",
      role: Role.MEDEWERKER,
      team: "Algemeen",
      title: "Algemeen fysiotherapeut",
      location: "Meijhorst",
      bio: "Werkt actief aan consultvoering, geriatrische casuistiek en POP-doelen voor het komende kwartaal.",
      avatarColor: "bg-sky-500",
      teamleaderId: teamlead.id,
      isOnboarding: false,
      isActive: true,
    },
  });

  const behandelvisie = await prisma.module.create({
    data: {
      title: "Behandelvisie van Fy-fit",
      description:
        "Een compacte introductie in de manier waarop Fy-fit persoonlijke benadering, educatie en activeren met elkaar verbindt.",
      thumbnailLabel: "Visie",
      status: ModulePublicationStatus.GEPUBLICEERD,
      isRequired: true,
      estimatedMinutes: 18,
      authorId: admin.id,
      categoryId: organisatie.id,
      sections: {
        create: [
          {
            order: 1,
            title: "Onze leidraad in elk behandeltraject",
            type: ModuleSectionType.TEXT,
            content:
              "Fy-fit werkt vanuit een heldere combinatie van deskundigheid, persoonlijke aandacht en actieve betrokkenheid van de patiënt.",
          },
          {
            order: 2,
            title: "Video: zo klinkt de Fy-fit stijl",
            type: ModuleSectionType.VIDEO,
            content:
              "Gebruik hier later een echte video-embed of branded still die laat zien hoe een consult in toon en ritme wordt opgebouwd.",
          },
          {
            order: 3,
            title: "Kennistoets",
            type: ModuleSectionType.QUIZ,
            content: "Kies per vraag het antwoord dat het beste aansluit bij de Fy-fit aanpak.",
            quizData: [
              {
                id: "q1",
                question: "Wat staat in het eerste consult centraal?",
                options: [
                  "Zoveel mogelijk oefeningen direct meegeven",
                  "De patiënt actief meenemen in het verhaal achter de klacht en het plan",
                  "De intake standaard afwerken zonder nuance",
                ],
                correctIndex: 1,
                explanation: "De Fy-fit toon combineert duidelijkheid, uitleg en gezamenlijke regie.",
              },
            ],
          },
        ],
      },
    },
  });

  const communicatieModule = await prisma.module.create({
    data: {
      title: "Communicatie met patiënten",
      description:
        "Praktische richtlijnen voor verwachtingsmanagement, samenvatten en heldere uitleg in een consult.",
      thumbnailLabel: "Gesprek",
      status: ModulePublicationStatus.GEPUBLICEERD,
      isRequired: true,
      estimatedMinutes: 22,
      authorId: teamlead.id,
      categoryId: communicatie.id,
      sections: {
        create: [
          {
            order: 1,
            title: "Van intake naar gezamenlijk plan",
            type: ModuleSectionType.TEXT,
            content:
              "Een goed gesprek bij Fy-fit is warm, concreet en richtinggevend. De patiënt moet begrijpen wat je onderzoekt en welke volgende stap logisch is.",
          },
          {
            order: 2,
            title: "Voorbeeldzinnen die werken",
            type: ModuleSectionType.IMAGE,
            content:
              "Gebruik korte, rustige taal. Bijvoorbeeld: 'Ik vat even samen wat ik tot nu toe hoor' of 'We kiezen nu eerst voor een stap die jou vandaag al helpt'.",
          },
        ],
      },
    },
  });

  const lageRugModule = await prisma.module.create({
    data: {
      title: "Kernboodschap lage rugpijn",
      description:
        "Een korte module over consistente uitleg en geruststelling bij aspecifieke lage rugpijn.",
      thumbnailLabel: "Rug",
      status: ModulePublicationStatus.GEPUBLICEERD,
      isRequired: false,
      estimatedMinutes: 14,
      authorId: teamlead.id,
      categoryId: rug.id,
      sections: {
        create: [
          {
            order: 1,
            title: "Wat willen we dat patiënten meenemen?",
            type: ModuleSectionType.TEXT,
            content:
              "Bij lage rugpijn willen we dat patiënten zich serieus genomen voelen, begrijpen dat bewegen meestal helpend blijft en weten welke signalen extra alertheid vragen.",
          },
          {
            order: 2,
            title: "Toon en framing",
            type: ModuleSectionType.TEXT,
            content:
              "Gebruik taal die normaliseert zonder te bagatelliseren. Sluit aan bij zorgen, benoem herstelkansen en maak verwachtingen concreet.",
          },
        ],
      },
    },
  });

  const onboardingPath = await prisma.onboardingPath.create({
    data: {
      name: "Fy-fit warm welkom",
      description:
        "Een duidelijk eerste traject voor nieuwe collega's met aandacht voor cultuur, kwaliteit en de eerste behandelmodules.",
      isActive: true,
      steps: {
        create: [
          {
            order: 1,
            title: "Welkom bij Fy-fit",
            description:
              "Start met de introductievideo en leer hoe Fy-fit persoonlijke aandacht combineert met innovatieve zorg.",
            contentType: "VIDEO",
            content:
              "Bekijk de korte welkomstvideo en noteer twee dingen die je direct opvallen aan de Fy-fit benadering.",
            isRequired: true,
          },
          {
            order: 2,
            title: "Missie, visie en merkbelofte",
            description:
              "Leer de kernboodschap kennen die in consulten, intake en teamoverleg terugkomt.",
            contentType: "TEXT",
            content:
              "Fy-fit staat voor innovatieve behandelingen met een persoonlijke benadering. Koppel dit aan jouw eigen manier van werken.",
            isRequired: true,
          },
          {
            order: 3,
            title: "Jouw buddy en eerste week",
            description:
              "Stem met je buddy af wat je deze week observeert en welke vragen je meeneemt.",
            contentType: "CHECKLIST",
            content:
              "Plan een eerste evaluatiemoment van 20 minuten met je buddy aan het einde van je eerste week.",
            isRequired: true,
          },
          {
            order: 4,
            title: "Praktische werkafspraken",
            description:
              "Neem de basale afspraken door over verslaglegging, overdracht en patiëntcontact.",
            contentType: "DOCUMENT",
            content:
              "Lees de documenten in de bibliotheek en bevestig dat je weet waar je de actuele versies vindt.",
            isRequired: true,
          },
          {
            order: 5,
            title: "Behandelvisie module",
            description: "Volg de eerste academy-module over de Fy-fit behandelvisie.",
            contentType: "MODULE_LINK",
            content: behandelvisie.id,
            isRequired: true,
          },
        ],
      },
    },
    include: {
      steps: {
        orderBy: {
          order: "asc",
        },
      },
    },
  });

  await prisma.document.createMany({
    data: [
      {
        title: "Werkafspraken eerste consult",
        type: DocumentType.WERKAFSPRAAK,
        summary:
          "Heldere afspraken voor ontvangst, intake, verwachtingsmanagement en afsluiting van het eerste consult.",
        content:
          "<p>Start elk consult met een korte check-in en maak direct duidelijk wat de patiënt van dit moment kan verwachten.</p><p>Vat na het onderzoek in gewone taal samen wat je hebt gezien, welke hypotheses logisch zijn en welke vervolgstap je voorstelt.</p><p>Sluit af met één concrete afspraak voor thuis en een heldere verwachting voor het volgende contactmoment.</p>",
        tags: ["consult", "communicatie", "intake"],
        version: "1.4",
        ownerId: admin.id,
        categoryId: communicatie.id,
        isPublished: true,
      },
      {
        title: "Kernboodschap aspecifieke lage rugpijn",
        type: DocumentType.KERNBOODSCHAP,
        summary:
          "Een compacte richtlijn voor consistente uitleg, geruststelling en activatie bij lage rugpijn.",
        content:
          "<p>Normaliseer de klacht waar passend, zonder de ervaring van de patiënt te verkleinen.</p><p>Benoem dat bewegen vaak onderdeel van herstel is en koppel het advies direct aan de hulpvraag.</p><p>Gebruik geruststelling in combinatie met een duidelijk plan: wat doen we nu, wat verwachten we de komende week en wanneer schalen we op?</p>",
        tags: ["rug", "educatie", "patiëntuitleg"],
        version: "0.9",
        ownerId: teamlead.id,
        categoryId: rug.id,
        isPublished: true,
      },
      {
        title: "POP-format kwartaalgesprek",
        type: DocumentType.FORMAT,
        summary:
          "Basisformat om leerdoelen, bewijsstukken en evaluatievragen in één lijn te houden.",
        content:
          "<p>Beschrijf één inhoudelijk doel, één procesdoel en het bewijs dat laat zien dat je vooruitgang boekt.</p><p>Maak het klein genoeg om binnen één kwartaal te bespreken en groot genoeg om zichtbaar verschil te maken in je werk.</p><p>Gebruik concrete observaties, casussen of feedbackmomenten om je voortgang te onderbouwen.</p>",
        tags: ["pop", "ontwikkeling", "gesprek"],
        version: "1.1",
        ownerId: admin.id,
        categoryId: organisatie.id,
        isPublished: true,
      },
    ],
  });

  await prisma.moduleProgress.createMany({
    data: [
      {
        userId: medewerker1.id,
        moduleId: behandelvisie.id,
        status: "BEZIG",
        score: 80,
        startedAt: new Date("2026-03-22"),
      },
      {
        userId: medewerker1.id,
        moduleId: communicatieModule.id,
        status: "NIET_GESTART",
        startedAt: new Date("2026-03-23"),
      },
      {
        userId: medewerker2.id,
        moduleId: behandelvisie.id,
        status: "AFGEROND",
        score: 100,
        startedAt: new Date("2026-03-15"),
        completedAt: new Date("2026-03-16"),
      },
      {
        userId: medewerker2.id,
        moduleId: lageRugModule.id,
        status: "BEZIG",
        startedAt: new Date("2026-03-24"),
      },
    ],
  });

  await prisma.onboardingProgress.createMany({
    data: onboardingPath.steps.slice(0, 4).map((step, index) => ({
      userId: medewerker1.id,
      stepId: step.id,
      completed: true,
      completedAt: new Date(`2026-03-${20 + index}`),
      completedById: teamlead.id,
      notes: index === 2 ? "Buddygesprek ingepland voor vrijdagmiddag." : null,
    })),
  });

  await prisma.learningGoal.createMany({
    data: [
      {
        userId: medewerker1.id,
        title: "Zelfstandig een eerste consult structureren volgens Fy-fit stijl",
        description:
          "Ik wil mijn openingsfase, samenvatting en gezamenlijke planvorming consistenter maken.",
        status: LearningGoalStatus.BEZIG,
        targetDate: new Date("2026-04-15"),
      },
      {
        userId: medewerker2.id,
        title: "Sterker worden in geriatrische casusbespreking",
        description:
          "Ik wil in teamoverleg scherper benoemen wat mijn hypothese is en welke vervolgstap ik voorstel.",
        status: LearningGoalStatus.OPEN,
        targetDate: new Date("2026-05-01"),
      },
      {
        userId: medewerker2.id,
        title: "POP bewijs verzamelen voor kwartaalgesprek",
        description:
          "Ik wil drie praktijkvoorbeelden en feedbackmomenten bundelen in mijn ontwikkelmap.",
        status: LearningGoalStatus.BEZIG,
        targetDate: new Date("2026-04-08"),
      },
    ],
  });

  await prisma.developmentDocument.createMany({
    data: [
      {
        userId: medewerker1.id,
        title: "POP Q2 - eerste 6 weken",
        description:
          "Startdocument met leerdoel, buddy-afspraken en observatiepunten uit de eerste consulten.",
        category: "POP",
        visibility: Visibility.TEAM,
      },
      {
        userId: medewerker2.id,
        title: "Bewijsmap consultvoering",
        description: "Notities uit intervisie, feedback van Sjoerd en twee uitgewerkte casussen.",
        category: "Bewijs",
        visibility: Visibility.TEAM,
      },
      {
        userId: medewerker2.id,
        title: "Persoonlijke reflectienotitie",
        description:
          "Korte notitie over energieverdeling en ritme in de week. Alleen zichtbaar voor de medewerker zelf.",
        category: "Reflectie",
        visibility: Visibility.PRIVATE,
      },
    ],
  });

  const lmsSeed = buildLmsSeedSpec();
  const usersByEmail = new Map([
    [admin.email, admin],
    [teamlead.email, teamlead],
    [reviewer.email, reviewer],
    [medewerker1.email, medewerker1],
    [medewerker2.email, medewerker2],
  ]);

  const seededCourse = await prisma.course.create({
    data: {
      title: lmsSeed.course.title,
      slug: lmsSeed.course.slug,
      description: lmsSeed.course.description,
      audience: lmsSeed.course.audience,
      learningObjectives: lmsSeed.course.learningObjectives,
      goal: lmsSeed.course.goal,
      focus: lmsSeed.course.focus,
      learnerOutcomes: lmsSeed.course.learnerOutcomes,
      accreditationRegister: lmsSeed.course.accreditationRegister,
      accreditationKind: lmsSeed.course.accreditationKind,
      versionDate: new Date(lmsSeed.course.versionDate),
      authorExperts: lmsSeed.course.authorExperts,
      requiredQuestionCount: lmsSeed.course.requiredQuestionCount,
      studyLoadMinutes: lmsSeed.course.studyLoadMinutes,
      status: lmsSeed.course.status,
      isMandatory: lmsSeed.course.isMandatory,
      authorId: admin.id,
      reviewerId: reviewer.id,
      publishedAt: new Date(lmsSeed.course.publishedAt),
      revisionDueAt: new Date(lmsSeed.course.revisionDueAt),
      versions: {
        create: {
          versionNumber: lmsSeed.version.versionNumber,
          changeSummary: lmsSeed.version.changeSummary,
          isActive: lmsSeed.version.isActive,
          createdById: admin.id,
        },
      },
    },
    include: {
      versions: true,
    },
  });

  const activeVersion = seededCourse.versions[0];
  const modulesByKey = new Map<string, { id: string }>();

  for (const moduleSpec of lmsSeed.modules) {
    const courseModule = await prisma.courseModule.create({
      data: {
        courseVersionId: activeVersion.id,
        title: moduleSpec.title,
        description: moduleSpec.description,
        introduction: moduleSpec.introduction,
        summary: moduleSpec.summary,
        order: moduleSpec.order,
        estimatedMinutes: moduleSpec.estimatedMinutes,
        workForms: moduleSpec.workForms,
      },
    });
    modulesByKey.set(moduleSpec.key, courseModule);
  }

  const objectivesByCode = new Map<string, { id: string }>();

  for (const objectiveSpec of lmsSeed.learningObjectives) {
    const courseModule = modulesByKey.get(objectiveSpec.moduleKey);
    const objective = await prisma.learningObjective.create({
      data: {
        courseVersionId: activeVersion.id,
        moduleId: courseModule?.id,
        code: objectiveSpec.code,
        text: objectiveSpec.text,
        order: objectiveSpec.order,
      },
    });
    objectivesByCode.set(objectiveSpec.code, objective);
  }

  for (const literatureSpec of lmsSeed.literatureReferences) {
    const courseModule = modulesByKey.get(literatureSpec.moduleKey);
    await prisma.literatureReference.create({
      data: {
        courseVersionId: activeVersion.id,
        moduleId: courseModule?.id,
        title: literatureSpec.title,
        source: literatureSpec.source,
        url: literatureSpec.url,
        guideline: literatureSpec.guideline,
        year: literatureSpec.year,
        order: literatureSpec.order,
      },
    });
  }

  for (const competencySpec of lmsSeed.competencyReferences) {
    const courseModule = modulesByKey.get(competencySpec.moduleKey);
    await prisma.competencyReference.create({
      data: {
        courseVersionId: activeVersion.id,
        moduleId: courseModule?.id,
        name: competencySpec.name,
        framework: competencySpec.framework,
        description: competencySpec.description,
      },
    });
  }

  await prisma.evaluationForm.create({
    data: {
      courseVersionId: activeVersion.id,
      title: lmsSeed.evaluationForm.title,
      isRequired: lmsSeed.evaluationForm.isRequired,
      questions: {
        create: lmsSeed.evaluationForm.questions.map((question) => ({
          label: question.label,
          type: question.type,
          order: question.order,
          isRequired: question.isRequired,
        })),
      },
    },
  });

  const lessonModuleBySlug = new Map<string, string>();
  for (const moduleSpec of lmsSeed.modules) {
    const courseModule = modulesByKey.get(moduleSpec.key);
    if (!courseModule) {
      continue;
    }
    for (const slug of moduleSpec.lessonSlugs) {
      lessonModuleBySlug.set(slug, courseModule.id);
    }
  }

  const seededLessons = await Promise.all(
    lmsSeed.lessons.map((lesson) =>
      prisma.lesson.create({
        data: {
          courseVersionId: activeVersion.id,
          moduleId: lessonModuleBySlug.get(lesson.slug),
          title: lesson.title,
          slug: lesson.slug,
          description: lesson.description,
          type: lesson.type,
          content: lesson.content,
          order: lesson.order,
          isRequired: lesson.isRequired,
          estimatedMinutes: lesson.estimatedMinutes,
          publishedAt: new Date(lmsSeed.course.publishedAt),
        },
      })
    )
  );

  await prisma.courseChangeLog.create({
    data: {
      courseId: seededCourse.id,
      courseVersionId: activeVersion.id,
      changedById: admin.id,
      changeType: "PUBLISHED",
      summary: "Eerste accreditatie-ready LMS seedversie gepubliceerd.",
      details: {
        versionNumber: lmsSeed.version.versionNumber,
        accreditationRegister: lmsSeed.course.accreditationRegister,
      },
    },
  });

  const lessonsBySlug = new Map(seededLessons.map((lesson) => [lesson.slug, lesson]));
  const assessmentLesson = lessonsBySlug.get(lmsSeed.assessment.lessonSlug);

  if (!assessmentLesson) {
    throw new Error(`Assessment lesson not found for slug ${lmsSeed.assessment.lessonSlug}`);
  }

  const seededAssessment = await prisma.assessment.create({
    data: {
      courseVersionId: activeVersion.id,
      lessonId: assessmentLesson.id,
      title: lmsSeed.assessment.title,
      description: lmsSeed.assessment.description,
      passPercentage: lmsSeed.assessment.passPercentage,
      maxAttempts: lmsSeed.assessment.maxAttempts,
      timeLimitMinutes: lmsSeed.assessment.timeLimitMinutes,
      shuffleQuestions: lmsSeed.assessment.shuffleQuestions,
      shuffleOptions: lmsSeed.assessment.shuffleOptions,
      showFeedbackImmediately: lmsSeed.assessment.showFeedbackImmediately,
      isRequiredForCompletion: lmsSeed.assessment.isRequiredForCompletion,
      questions: {
        create: lmsSeed.assessment.questions.map((question, index) => ({
          type: question.type,
          prompt: question.prompt,
          explanation: question.explanation,
          order: index + 1,
          points: question.points,
          options: {
            create: question.options.map((option, optionIndex) => ({
              label: option.label,
              isCorrect: option.isCorrect,
              order: optionIndex + 1,
            })),
          },
        })),
      },
    },
    include: {
      questions: {
        orderBy: { order: "asc" },
        include: {
          options: {
            orderBy: { order: "asc" },
          },
        },
      },
    },
  });

  for (const [index, questionSpec] of lmsSeed.assessment.questions.entries()) {
    const seededQuestion = seededAssessment.questions[index];
    if (!seededQuestion) {
      continue;
    }

    await prisma.questionLearningObjective.createMany({
      data: questionSpec.learningObjectiveCodes.map((code) => {
        const objective = objectivesByCode.get(code);
        if (!objective) {
          throw new Error(`Learning objective not found for code ${code}`);
        }
        return {
          questionId: seededQuestion.id,
          learningObjectiveId: objective.id,
        };
      }),
    });
  }

  const enrollmentsByKey = new Map<string, { id: string; userId: string }>();

  for (const fixture of lmsSeed.enrollmentFixtures) {
    const assignee = usersByEmail.get(fixture.assigneeEmail);

    if (!assignee) {
      throw new Error(`No user found for LMS fixture assignee ${fixture.assigneeEmail}`);
    }

    const enrollment = await prisma.enrollment.create({
      data: {
        userId: assignee.id,
        courseId: seededCourse.id,
        assignedById: teamlead.id,
        assignmentType: fixture.assignmentType,
        deadlineAt: fixture.deadlineAt ? new Date(fixture.deadlineAt) : null,
        status: fixture.status,
        startedAt: new Date(fixture.startedAt),
        completedAt: fixture.completedAt ? new Date(fixture.completedAt) : null,
      },
    });

    enrollmentsByKey.set(fixture.key, { id: enrollment.id, userId: assignee.id });

    if (fixture.completedLessonSlugs.length > 0) {
      await prisma.lessonProgress.createMany({
        data: fixture.completedLessonSlugs.map((slug, index) => {
          const lesson = lessonsBySlug.get(slug);

          if (!lesson) {
            throw new Error(`No lesson found for completed LMS lesson slug ${slug}`);
          }

          const startedBase = new Date(fixture.startedAt);
          startedBase.setHours(startedBase.getHours() + index);
          const completedBase = fixture.completedAt ? new Date(fixture.completedAt) : new Date(fixture.startedAt);
          completedBase.setHours(completedBase.getHours() - (fixture.completedLessonSlugs.length - index));

          return {
            userId: assignee.id,
            lessonId: lesson.id,
            status: "COMPLETED",
            startedAt: startedBase,
            completedAt: completedBase,
            lastViewedAt: completedBase,
          };
        }),
      });
    }

    if (fixture.inProgressLessonSlug) {
      const inProgressLesson = lessonsBySlug.get(fixture.inProgressLessonSlug);

      if (!inProgressLesson) {
        throw new Error(`No lesson found for in-progress LMS lesson slug ${fixture.inProgressLessonSlug}`);
      }

      await prisma.lessonProgress.create({
        data: {
          userId: assignee.id,
          lessonId: inProgressLesson.id,
          status: "IN_PROGRESS",
          startedAt: new Date(fixture.startedAt),
          lastViewedAt: new Date("2026-04-10T14:00:00.000Z"),
        },
      });
    }
  }

  const completedFixture = lmsSeed.enrollmentFixtures.find((fixture) => fixture.key === "completed");
  const completedEnrollment = enrollmentsByKey.get("completed");

  if (!completedFixture || !completedEnrollment) {
    throw new Error("Completed LMS fixture not created correctly.");
  }

  const totalQuestionPoints = lmsSeed.assessment.questions.reduce(
    (sum, question) => sum + question.points,
    0
  );

  const completedAttempt = await prisma.assessmentAttempt.create({
    data: {
      assessmentId: seededAssessment.id,
      userId: completedEnrollment.userId,
      courseVersionId: activeVersion.id,
      attemptNumber: 1,
      startedAt: new Date("2026-04-05T14:00:00.000Z"),
      submittedAt: new Date("2026-04-05T14:12:00.000Z"),
      scoreRaw: totalQuestionPoints,
      scorePercentage: lmsSeed.certificateFixture.scorePercentage,
      passed: true,
    },
  });

  await prisma.assessmentAnswer.createMany({
    data: seededAssessment.questions.map((question, index) => ({
      attemptId: completedAttempt.id,
      questionId: question.id,
      selectedOptionIds: question.options.filter((option) => option.isCorrect).map((option) => option.id),
      textAnswer: null,
      isCorrect: true,
      awardedPoints: lmsSeed.assessment.questions[index].points,
    })),
  });

  const certificate = await prisma.certificate.create({
    data: {
      userId: completedEnrollment.userId,
      courseId: seededCourse.id,
      courseVersionId: activeVersion.id,
      issuedAt: new Date(completedFixture.completedAt ?? "2026-04-05T16:00:00.000Z"),
      scorePercentage: lmsSeed.certificateFixture.scorePercentage,
      studyLoadMinutes: lmsSeed.certificateFixture.studyLoadMinutes,
    },
  });

  await prisma.enrollment.update({
    where: { id: completedEnrollment.id },
    data: { certificateId: certificate.id },
  });

  console.log("Seed voltooid. Demo accounts gebruiken wachtwoord: fyfit-demo");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
