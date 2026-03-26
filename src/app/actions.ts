"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import {
  createDevelopmentDocument,
  createLearningGoal,
  toggleOnboardingStep,
  upsertModuleProgress,
} from "@/lib/demo-data";
import {
  getSessionUser,
  SESSION_COOKIE,
  validateDemoCredentials,
} from "@/lib/auth";

export async function loginAction(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "").trim();

  const user = validateDemoCredentials(email, password);

  if (!user) {
    redirect("/login?error=1");
  }

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, user.id, {
    httpOnly: true,
    sameSite: "lax",
    secure: false,
    path: "/",
  });

  redirect("/");
}

export async function logoutAction() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
  redirect("/login");
}

export async function addLearningGoalAction(formData: FormData) {
  const user = await getSessionUser();

  if (!user) {
    redirect("/login");
  }

  createLearningGoal({
    userId: user.id,
    title: String(formData.get("title") ?? "").trim(),
    description: String(formData.get("description") ?? "").trim(),
    status: "OPEN",
    targetDate: String(formData.get("targetDate") ?? "").trim() || undefined,
  });

  revalidatePath("/ontwikkeling");
  revalidatePath("/");
}

export async function addDevelopmentDocumentAction(formData: FormData) {
  const user = await getSessionUser();

  if (!user) {
    redirect("/login");
  }

  createDevelopmentDocument({
    userId: user.id,
    title: String(formData.get("title") ?? "").trim(),
    description: String(formData.get("description") ?? "").trim(),
    category: String(formData.get("category") ?? "").trim() || "POP",
    visibility:
      String(formData.get("visibility") ?? "TEAM") === "PRIVATE"
        ? "PRIVATE"
        : "TEAM",
  });

  revalidatePath("/ontwikkeling");
  revalidatePath("/");
}

export async function toggleModuleProgressAction(formData: FormData) {
  const user = await getSessionUser();

  if (!user) {
    redirect("/login");
  }

  const moduleId = String(formData.get("moduleId") ?? "");
  upsertModuleProgress(user.id, moduleId);
  revalidatePath("/academy");
  revalidatePath(`/academy/${moduleId}`);
  revalidatePath("/");
}

export async function toggleOnboardingStepAction(formData: FormData) {
  const user = await getSessionUser();

  if (!user) {
    redirect("/login");
  }

  const stepId = String(formData.get("stepId") ?? "");
  const targetUserId = String(formData.get("targetUserId") ?? user.id);
  toggleOnboardingStep(targetUserId, stepId, user.id);
  revalidatePath("/onboarding");
  revalidatePath("/");
}
