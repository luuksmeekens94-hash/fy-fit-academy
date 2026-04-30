"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  LearningGoalStatus,
  Role,
} from "@prisma/client";

import { clearSession, createSession, requireRole, requireUser } from "@/lib/auth";
import { getAuthUserByEmail, getUserById } from "@/lib/data";
import { hashPassword, verifyPassword } from "@/lib/password";
import { prisma } from "@/lib/prisma";
import { normalizeProfessionalRegistrationNumber } from "@/lib/lms/participant-report";

function getString(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function getOptionalString(formData: FormData, key: string) {
  const value = getString(formData, key);
  return value || undefined;
}

function getBoolean(formData: FormData, key: string) {
  return formData.get(key) === "on" || formData.get(key) === "true";
}

function getInt(formData: FormData, key: string, fallback = 0) {
  const value = Number.parseInt(getString(formData, key), 10);
  return Number.isFinite(value) ? value : fallback;
}

function ensureValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function ensureEnumValue<T extends string>(value: string, values: readonly T[], fallback: T) {
  return values.includes(value as T) ? (value as T) : fallback;
}

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

function parseModuleSections(source: string) {
  const lines = source
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  return lines.map((line, index) => {
    const [orderPart, title, typePart, ...contentParts] = line.split("||");
    const order = Number.parseInt(orderPart ?? "", 10);
    const type = ensureEnumValue(
      (typePart ?? "").trim().toUpperCase(),
      ["TEXT", "VIDEO", "QUIZ", "IMAGE"] as const,
      "TEXT",
    );
    const content = contentParts.join("||").trim();

    assert(title?.trim(), `Sectie ${index + 1} mist een titel.`);
    assert(content, `Sectie ${index + 1} mist inhoud.`);

    return {
      order: Number.isFinite(order) ? order : index + 1,
      title: title.trim(),
      type,
      content,
      quizData: type === "QUIZ" ? [] : undefined,
    };
  });
}

function parseOnboardingSteps(source: string) {
  const lines = source
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  return lines.map((line, index) => {
    const [orderPart, title, typePart, requiredPart, description, ...contentParts] =
      line.split("||");
    const order = Number.parseInt(orderPart ?? "", 10);
    const type = ensureEnumValue(
      (typePart ?? "").trim().toUpperCase(),
      ["TEXT", "VIDEO", "DOCUMENT", "MODULE_LINK", "CHECKLIST"] as const,
      "TEXT",
    );
    const content = contentParts.join("||").trim();
    const isRequired = (requiredPart ?? "ja").trim().toLowerCase() !== "nee";

    assert(title?.trim(), `Stap ${index + 1} mist een titel.`);
    assert(description?.trim(), `Stap ${index + 1} mist een beschrijving.`);
    assert(content, `Stap ${index + 1} mist inhoud.`);

    return {
      order: Number.isFinite(order) ? order : index + 1,
      title: title.trim(),
      contentType: type,
      isRequired,
      description: description.trim(),
      content,
    };
  });
}

function revalidateCorePages() {
  revalidatePath("/");
  revalidatePath("/academy");
  revalidatePath("/bibliotheek");
  revalidatePath("/ontwikkeling");
  revalidatePath("/onboarding");
  revalidatePath("/team");
  revalidatePath("/admin");
}

export async function loginAction(formData: FormData) {
  const email = getString(formData, "email").toLowerCase();
  const password = getString(formData, "password");
  const user = await getAuthUserByEmail(email);

  if (!user?.isActive) {
    redirect("/login?error=1");
  }

  const isValid = await verifyPassword(password, user.passwordHash);

  if (!isValid) {
    redirect("/login?error=1");
  }

  await createSession(user.id);
  redirect("/");
}

export async function logoutAction() {
  await clearSession();
  redirect("/login");
}

export async function addLearningGoalAction(formData: FormData) {
  const user = await requireUser();
  const title = getString(formData, "title");
  const description = getString(formData, "description");
  const targetDate = getOptionalString(formData, "targetDate");

  assert(title.length >= 3, "Titel moet minimaal 3 tekens hebben.");
  assert(description.length >= 10, "Omschrijving moet minimaal 10 tekens hebben.");

  await prisma.learningGoal.create({
    data: {
      userId: user.id,
      title,
      description,
      status: LearningGoalStatus.OPEN,
      targetDate: targetDate ? new Date(targetDate) : null,
    },
  });

  revalidatePath("/ontwikkeling");
  revalidatePath("/");
}

export async function addDevelopmentDocumentAction(formData: FormData) {
  const user = await requireUser();
  const title = getString(formData, "title");
  const description = getString(formData, "description");
  const category = getOptionalString(formData, "category") ?? "POP";
  const visibility = ensureEnumValue(
    getString(formData, "visibility"),
    ["PRIVATE", "TEAM"] as const,
    "TEAM",
  );

  assert(title.length >= 3, "Titel moet minimaal 3 tekens hebben.");
  assert(description.length >= 10, "Omschrijving moet minimaal 10 tekens hebben.");

  await prisma.developmentDocument.create({
    data: {
      userId: user.id,
      title,
      description,
      category,
      visibility,
    },
  });

  revalidatePath("/ontwikkeling");
  revalidatePath("/");
}

export async function toggleModuleProgressAction(formData: FormData) {
  const user = await requireUser();
  const moduleId = getString(formData, "moduleId");

  assert(moduleId, "Module ontbreekt.");

  const existing = await prisma.moduleProgress.findUnique({
    where: {
      userId_moduleId: {
        userId: user.id,
        moduleId,
      },
    },
  });

  if (!existing) {
    await prisma.moduleProgress.create({
      data: {
        userId: user.id,
        moduleId,
        status: "AFGEROND",
        startedAt: new Date(),
        completedAt: new Date(),
      },
    });
  } else {
    const nextStatus = existing.status === "AFGEROND" ? "BEZIG" : "AFGEROND";
    await prisma.moduleProgress.update({
      where: { id: existing.id },
      data: {
        status: nextStatus,
        completedAt: nextStatus === "AFGEROND" ? new Date() : null,
      },
    });
  }

  revalidatePath("/academy");
  revalidatePath(`/academy/${moduleId}`);
  revalidatePath("/");
}

export async function toggleOnboardingStepAction(formData: FormData) {
  const viewer = await requireUser();
  const stepId = getString(formData, "stepId");
  const targetUserId = getOptionalString(formData, "targetUserId") ?? viewer.id;
  const targetUser = await getUserById(targetUserId);

  assert(stepId, "Stap ontbreekt.");
  assert(targetUser, "Gebruiker niet gevonden.");

  const canManage =
    viewer.id === targetUser.id ||
    viewer.role === Role.BEHEERDER ||
    targetUser.teamleaderId === viewer.id;

  assert(canManage, "Niet toegestaan.");

  const existing = await prisma.onboardingProgress.findUnique({
    where: {
      userId_stepId: {
        userId: targetUser.id,
        stepId,
      },
    },
  });

  if (!existing) {
    await prisma.onboardingProgress.create({
      data: {
        userId: targetUser.id,
        stepId,
        completed: true,
        completedAt: new Date(),
        completedById: viewer.id,
      },
    });
  } else {
    const completed = !existing.completed;
    await prisma.onboardingProgress.update({
      where: { id: existing.id },
      data: {
        completed,
        completedAt: completed ? new Date() : null,
        completedById: completed ? viewer.id : null,
      },
    });
  }

  revalidatePath("/onboarding");
  revalidatePath("/");
}

export async function changePasswordAction(formData: FormData) {
  const user = await requireUser();
  const currentPassword = getString(formData, "currentPassword");
  const newPassword = getString(formData, "newPassword");
  const confirmPassword = getString(formData, "confirmPassword");
  const authUser = await getAuthUserByEmail(user.email);

  assert(authUser, "Gebruiker niet gevonden.");
  assert(await verifyPassword(currentPassword, authUser.passwordHash), "Huidig wachtwoord klopt niet.");
  assert(newPassword.length >= 8, "Nieuw wachtwoord moet minimaal 8 tekens hebben.");
  assert(newPassword === confirmPassword, "Nieuwe wachtwoorden zijn niet gelijk.");

  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordHash: await hashPassword(newPassword),
    },
  });

  revalidatePath("/mijn-gegevens");
}

export async function saveMyProfessionalRegistrationAction(formData: FormData) {
  const user = await requireUser();
  const professionalRegistrationNumber = normalizeProfessionalRegistrationNumber(
    getOptionalString(formData, "professionalRegistrationNumber"),
  );

  await prisma.user.update({
    where: { id: user.id },
    data: { professionalRegistrationNumber },
  });

  revalidatePath("/mijn-gegevens");
  revalidatePath("/lms");
}

export async function saveCategoryAction(formData: FormData) {
  await requireRole([Role.BEHEERDER]);
  const categoryId = getOptionalString(formData, "categoryId");
  const name = getString(formData, "name");
  const icon = getOptionalString(formData, "icon");
  const order = getInt(formData, "order");

  assert(name.length >= 2, "Categorienaam is te kort.");

  if (categoryId) {
    await prisma.category.update({
      where: { id: categoryId },
      data: { name, icon: icon ?? null, order },
    });
  } else {
    await prisma.category.create({
      data: { name, icon: icon ?? null, order },
    });
  }

  revalidateCorePages();
}

export async function deleteCategoryAction(formData: FormData) {
  await requireRole([Role.BEHEERDER]);
  const categoryId = getString(formData, "categoryId");

  assert(categoryId, "Categorie ontbreekt.");

  await prisma.category.delete({
    where: { id: categoryId },
  });

  revalidateCorePages();
}

export async function saveModuleAction(formData: FormData) {
  const user = await requireRole([Role.BEHEERDER]);
  const moduleId = getOptionalString(formData, "moduleId");
  const title = getString(formData, "title");
  const description = getString(formData, "description");
  const categoryId = getString(formData, "categoryId");
  const thumbnailLabel = getOptionalString(formData, "thumbnailLabel");
  const estimatedMinutes = getInt(formData, "estimatedMinutes");
  const isRequired = getBoolean(formData, "isRequired");
  const status = ensureEnumValue(
    getString(formData, "status"),
    ["CONCEPT", "GEPUBLICEERD", "GEARCHIVEERD"] as const,
    "CONCEPT",
  );
  const sections = parseModuleSections(getString(formData, "sections"));

  assert(title.length >= 3, "Moduletitel is te kort.");
  assert(description.length >= 10, "Modulebeschrijving is te kort.");
  assert(categoryId, "Categorie ontbreekt.");
  assert(sections.length > 0, "Voeg minimaal een sectie toe.");

  if (moduleId) {
    await prisma.module.update({
      where: { id: moduleId },
      data: {
        title,
        description,
        categoryId,
        thumbnailLabel: thumbnailLabel ?? null,
        estimatedMinutes,
        isRequired,
        status,
        sections: {
          deleteMany: {},
          create: sections,
        },
      },
    });
  } else {
    await prisma.module.create({
      data: {
        title,
        description,
        categoryId,
        thumbnailLabel: thumbnailLabel ?? null,
        estimatedMinutes,
        isRequired,
        status,
        authorId: user.id,
        sections: {
          create: sections,
        },
      },
    });
  }

  revalidateCorePages();
}

export async function deleteModuleAction(formData: FormData) {
  await requireRole([Role.BEHEERDER]);
  const moduleId = getString(formData, "moduleId");

  assert(moduleId, "Module ontbreekt.");

  await prisma.module.delete({
    where: { id: moduleId },
  });

  revalidateCorePages();
}

export async function setModuleStatusAction(formData: FormData) {
  await requireRole([Role.BEHEERDER]);
  const moduleId = getString(formData, "moduleId");
  const status = ensureEnumValue(
    getString(formData, "status"),
    ["CONCEPT", "GEPUBLICEERD", "GEARCHIVEERD"] as const,
    "CONCEPT",
  );

  await prisma.module.update({
    where: { id: moduleId },
    data: { status },
  });

  revalidateCorePages();
}

export async function saveDocumentAction(formData: FormData) {
  const user = await requireRole([Role.BEHEERDER]);
  const documentId = getOptionalString(formData, "documentId");
  const title = getString(formData, "title");
  const type = ensureEnumValue(
    getString(formData, "type"),
    ["PROTOCOL", "WERKAFSPRAAK", "KERNBOODSCHAP", "FORMAT", "OVERIG"] as const,
    "OVERIG",
  );
  const summary = getString(formData, "summary");
  const content = getString(formData, "content");
  const version = getString(formData, "version");
  const categoryId = getString(formData, "categoryId");
  const isPublished = getBoolean(formData, "isPublished");
  const tags = getString(formData, "tags")
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);

  assert(title.length >= 3, "Documenttitel is te kort.");
  assert(summary.length >= 10, "Samenvatting is te kort.");
  assert(content.length >= 10, "Inhoud is te kort.");
  assert(version.length >= 1, "Versie ontbreekt.");
  assert(categoryId, "Categorie ontbreekt.");

  if (documentId) {
    await prisma.document.update({
      where: { id: documentId },
      data: {
        title,
        type,
        summary,
        content,
        version,
        categoryId,
        isPublished,
        tags,
      },
    });
  } else {
    await prisma.document.create({
      data: {
        title,
        type,
        summary,
        content,
        version,
        categoryId,
        isPublished,
        tags,
        ownerId: user.id,
      },
    });
  }

  revalidateCorePages();
}

export async function deleteDocumentAction(formData: FormData) {
  await requireRole([Role.BEHEERDER]);
  const documentId = getString(formData, "documentId");

  await prisma.document.delete({
    where: { id: documentId },
  });

  revalidateCorePages();
}

export async function saveUserAction(formData: FormData) {
  await requireRole([Role.BEHEERDER]);
  const userId = getOptionalString(formData, "userId");
  const name = getString(formData, "name");
  const email = getString(formData, "email").toLowerCase();
  const role = ensureEnumValue(
    getString(formData, "role"),
    ["MEDEWERKER", "TEAMLEIDER", "BEHEERDER", "REVIEWER"] as const,
    "MEDEWERKER",
  );
  const team = getOptionalString(formData, "team");
  const professionalRegistrationNumber = normalizeProfessionalRegistrationNumber(
    getOptionalString(formData, "professionalRegistrationNumber"),
  );
  const title = getString(formData, "title");
  const location = getString(formData, "location");
  const bio = getString(formData, "bio");
  const avatarColor = getOptionalString(formData, "avatarColor") ?? "bg-[var(--brand)]";
  const buddyId = getOptionalString(formData, "buddyId");
  const teamleaderId = getOptionalString(formData, "teamleaderId");
  const isOnboarding = getBoolean(formData, "isOnboarding");
  const initialPassword = getOptionalString(formData, "initialPassword");

  assert(name.length >= 2, "Naam is te kort.");
  assert(ensureValidEmail(email), "Ongeldig e-mailadres.");
  assert(title.length >= 2, "Functietitel is te kort.");
  assert(location.length >= 2, "Locatie is te kort.");
  assert(bio.length >= 10, "Bio is te kort.");

  if (userId) {
    const data: Parameters<typeof prisma.user.update>[0]["data"] = {
      name,
      email,
      role,
      team: team ?? null,
      professionalRegistrationNumber,
      title,
      location,
      bio,
      avatarColor,
      buddyId: buddyId ?? null,
      teamleaderId: teamleaderId ?? null,
      isOnboarding,
    };

    if (initialPassword) {
      assert(initialPassword.length >= 8, "Wachtwoord moet minimaal 8 tekens hebben.");
      data.passwordHash = await hashPassword(initialPassword);
    }

    await prisma.user.update({
      where: { id: userId },
      data,
    });
  } else {
    assert(initialPassword && initialPassword.length >= 8, "Initieel wachtwoord moet minimaal 8 tekens hebben.");

    await prisma.user.create({
      data: {
        name,
        email,
        passwordHash: await hashPassword(initialPassword),
        role,
        team: team ?? null,
        professionalRegistrationNumber,
        title,
        location,
        bio,
        avatarColor,
        buddyId: buddyId ?? null,
        teamleaderId: teamleaderId ?? null,
        isOnboarding,
        isActive: true,
      },
    });
  }

  revalidateCorePages();
}

export async function deactivateUserAction(formData: FormData) {
  await requireRole([Role.BEHEERDER]);
  const userId = getString(formData, "userId");

  await prisma.user.update({
    where: { id: userId },
    data: { isActive: false },
  });

  revalidateCorePages();
}

export async function saveOnboardingPathAction(formData: FormData) {
  await requireRole([Role.BEHEERDER]);
  const pathId = getOptionalString(formData, "pathId");
  const name = getString(formData, "name");
  const description = getString(formData, "description");
  const isActive = getBoolean(formData, "isActive");
  const steps = parseOnboardingSteps(getString(formData, "steps"));

  assert(name.length >= 3, "Padnaam is te kort.");
  assert(description.length >= 10, "Beschrijving is te kort.");
  assert(steps.length > 0, "Voeg minimaal een stap toe.");

  if (isActive) {
    await prisma.onboardingPath.updateMany({
      data: { isActive: false },
      where: pathId ? { NOT: { id: pathId } } : undefined,
    });
  }

  if (pathId) {
    await prisma.onboardingPath.update({
      where: { id: pathId },
      data: {
        name,
        description,
        isActive,
        steps: {
          deleteMany: {},
          create: steps,
        },
      },
    });
  } else {
    await prisma.onboardingPath.create({
      data: {
        name,
        description,
        isActive,
        steps: {
          create: steps,
        },
      },
    });
  }

  revalidateCorePages();
}

export async function setOnboardingPathActiveAction(formData: FormData) {
  await requireRole([Role.BEHEERDER]);
  const pathId = getString(formData, "pathId");
  const isActive = getString(formData, "isActive") === "true";

  if (isActive) {
    await prisma.onboardingPath.updateMany({
      data: { isActive: false },
    });
  }

  await prisma.onboardingPath.update({
    where: { id: pathId },
    data: { isActive },
  });

  revalidateCorePages();
}
