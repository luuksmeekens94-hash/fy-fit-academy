import { PrismaPg } from "@prisma/adapter-pg";
import {
  PrismaClient,
  Role,
  ModuleStatus,
  LearningGoalStatus,
  OnboardingContentType,
  ModuleSectionType,
  DocumentType,
  Visibility,
} from "@prisma/client";

const prisma = new PrismaClient({
  adapter: new PrismaPg({
    connectionString:
      process.env.DIRECT_URL ??
      process.env.DATABASE_URL ??
      "postgresql://placeholder:placeholder@localhost:5432/fyfitacademy?schema=public",
  }),
});

async function main() {
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

  const [organisatie, communicatie, rug] = await Promise.all([
    prisma.category.create({
      data: { name: "Organisatie", icon: "Structuur", order: 1 },
    }),
    prisma.category.create({
      data: { name: "Communicatie", icon: "Gesprek", order: 2 },
    }),
    prisma.category.create({
      data: { name: "Lage rug", icon: "Rug", order: 3 },
    }),
  ]);

  const admin = await prisma.user.create({
    data: {
      name: "Heidi Staring",
      email: "heidi@fy-fitacademy.demo",
      role: Role.BEHEERDER,
      title: "Praktijkmanager",
      location: "Nijmegen",
      bio: "Stuurt de Academy aan en bewaakt de kwaliteit van onboarding, bibliotheek en teamontwikkeling.",
      avatarColor: "brand",
      isOnboarding: false,
    },
  });

  const teamlead = await prisma.user.create({
    data: {
      name: "Dave van Perlo",
      email: "dave@fy-fitacademy.demo",
      role: Role.TEAMLEIDER,
      title: "Sportfysiotherapeut",
      location: "Lankforst",
      bio: "Begeleidt teamleden op sportrevalidatie, casuistiek en persoonlijke ontwikkeling.",
      avatarColor: "teal",
      isOnboarding: false,
    },
  });

  const medewerker1 = await prisma.user.create({
    data: {
      name: "Ryan Wessels",
      email: "ryan@fy-fitacademy.demo",
      role: Role.MEDEWERKER,
      title: "Algemeen fysiotherapeut",
      location: "Weezenhof",
      teamleaderId: teamlead.id,
      buddyId: teamlead.id,
      bio: "Bouwt aan een stevige basis in behandelvisie, communicatie en het werken met de Fy-fit standaarden.",
      avatarColor: "amber",
      isOnboarding: true,
    },
  });

  const medewerker2 = await prisma.user.create({
    data: {
      name: "Fleur Frieling",
      email: "fleur@fy-fitacademy.demo",
      role: Role.MEDEWERKER,
      title: "Algemeen fysiotherapeut",
      location: "Meijhorst",
      teamleaderId: teamlead.id,
      bio: "Werkt actief aan consultvoering, geriatrische casuistiek en POP-doelen voor het komende kwartaal.",
      avatarColor: "sky",
      isOnboarding: false,
    },
  });

  const behandelvisie = await prisma.module.create({
    data: {
      title: "Behandelvisie van Fy-fit",
      description:
        "Een compacte introductie in de manier waarop Fy-fit persoonlijke benadering, educatie en activeren met elkaar verbindt.",
      thumbnailLabel: "Visie",
      status: "GEPUBLICEERD",
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
            content: "Vervang dit later door een echte video-embed of branded still.",
          },
          {
            order: 3,
            title: "Kennistoets",
            type: ModuleSectionType.QUIZ,
            content: "Kies per vraag het antwoord dat het beste aansluit bij de Fy-fit aanpak.",
            quizData: [
              {
                question: "Wat staat centraal in het eerste consult?",
                options: [
                  "Veel oefeningen meegeven",
                  "De patiënt actief meenemen in het verhaal en plan",
                  "Volledig standaardiseren zonder nuance",
                ],
                correctIndex: 1,
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
      status: "GEPUBLICEERD",
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
              "Een goed gesprek bij Fy-fit is warm, concreet en richtinggevend.",
          },
          {
            order: 2,
            title: "Voorbeeldzinnen die werken",
            type: ModuleSectionType.IMAGE,
            content:
              "Gebruik korte, rustige taal en maak verwachtingen concreet.",
          },
        ],
      },
    },
  });

  await prisma.module.create({
    data: {
      title: "Kernboodschap lage rugpijn",
      description:
        "Een korte module over consistente uitleg en geruststelling bij aspecifieke lage rugpijn.",
      thumbnailLabel: "Rug",
      status: "GEPUBLICEERD",
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
              "Patiënten moeten zich serieus genomen voelen en weten dat bewegen meestal helpend blijft.",
          },
          {
            order: 2,
            title: "Toon en framing",
            type: ModuleSectionType.TEXT,
            content:
              "Gebruik taal die normaliseert zonder te bagatelliseren.",
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
            description: "Start met de introductie en leer de toon van Fy-fit kennen.",
            contentType: OnboardingContentType.VIDEO,
            content: "Bekijk de korte welkomstvideo.",
            isRequired: true,
          },
          {
            order: 2,
            title: "Missie, visie en merkbelofte",
            description: "Leer de kernboodschap kennen.",
            contentType: OnboardingContentType.TEXT,
            content: "Fy-fit staat voor innovatieve behandelingen met een persoonlijke benadering.",
            isRequired: true,
          },
          {
            order: 3,
            title: "Jouw buddy en eerste week",
            description: "Plan een eerste evaluatiemoment met je buddy.",
            contentType: OnboardingContentType.CHECKLIST,
            content: "Plan een evaluatiemoment van 20 minuten met je buddy.",
            isRequired: true,
          },
          {
            order: 4,
            title: "Praktische werkafspraken",
            description: "Neem de basale afspraken door.",
            contentType: OnboardingContentType.DOCUMENT,
            content: "Lees de documenten in de bibliotheek.",
            isRequired: true,
          },
          {
            order: 5,
            title: "Behandelvisie module",
            description: "Volg de eerste academy-module.",
            contentType: OnboardingContentType.MODULE_LINK,
            content: behandelvisie.id,
            isRequired: true,
          },
        ],
      },
    },
    include: { steps: true },
  });

  await prisma.document.createMany({
    data: [
      {
        title: "Werkafspraken eerste consult",
        type: DocumentType.WERKAFSPRAAK,
        summary:
          "Heldere afspraken voor ontvangst, intake, verwachtingsmanagement en afsluiting van het eerste consult.",
        content: [
          "Start elk consult met een korte check-in.",
          "Vat in gewone taal samen wat je hebt gezien en wat de vervolgstap is.",
        ],
        version: "1.4",
        ownerId: admin.id,
        categoryId: communicatie.id,
        isPublished: true,
      },
      {
        title: "POP-format kwartaalgesprek",
        type: DocumentType.FORMAT,
        summary:
          "Basisformat om leerdoelen, bewijsstukken en evaluatievragen in één lijn te houden.",
        content: [
          "Beschrijf één inhoudelijk doel en één procesdoel.",
          "Gebruik concrete observaties en feedbackmomenten als bewijs.",
        ],
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
        status: ModuleStatus.BEZIG,
        score: 80,
        startedAt: new Date("2026-03-22"),
      },
      {
        userId: medewerker2.id,
        moduleId: behandelvisie.id,
        status: ModuleStatus.AFGEROND,
        score: 100,
        startedAt: new Date("2026-03-15"),
        completedAt: new Date("2026-03-16"),
      },
      {
        userId: medewerker1.id,
        moduleId: communicatieModule.id,
        status: ModuleStatus.NIET_GESTART,
        startedAt: new Date("2026-03-23"),
      },
    ],
  });

  await prisma.onboardingProgress.createMany({
    data: onboardingPath.steps.slice(0, 3).map((step) => ({
      userId: medewerker1.id,
      stepId: step.id,
      completed: true,
      completedAt: new Date("2026-03-20"),
      completedById: teamlead.id,
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
        description: "Notities uit intervisie, feedback en twee uitgewerkte casussen.",
        category: "Bewijs",
        visibility: Visibility.TEAM,
      },
      {
        userId: medewerker2.id,
        title: "Persoonlijke reflectienotitie",
        description: "Korte notitie over energieverdeling en ritme in de week.",
        category: "Reflectie",
        visibility: Visibility.PRIVATE,
      },
    ],
  });

  console.log("Seed voltooid");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
