import { getAudienceProfileLabel } from "@/lib/audience";
import { getRoleLabel } from "@/lib/roles";
import type { AudienceProfile, Role } from "@/lib/types";

export const CONTENT_VISIBILITY_PRESETS = [
  "MANUAL",
  "ALL",
  "FYSIOTHERAPEUT",
  "PRAKTIJKONDERSTEUNER",
  "FITCOACH",
] as const;

export type ContentVisibilityPreset = (typeof CONTENT_VISIBILITY_PRESETS)[number];

const CONTENT_VISIBILITY_PRESET_LABELS: Record<ContentVisibilityPreset, string> = {
  MANUAL: "Handmatig instellen",
  ALL: "Iedereen",
  FYSIOTHERAPEUT: "Alleen fysiotherapeuten",
  PRAKTIJKONDERSTEUNER: "Alleen praktijkondersteuners",
  FITCOACH: "Alleen fitcoaches",
};

export const CONTENT_VISIBILITY_PRESET_OPTIONS = CONTENT_VISIBILITY_PRESETS.map((value) => ({
  value,
  label: CONTENT_VISIBILITY_PRESET_LABELS[value],
}));

export type ContentVisibilityUser = {
  id: string;
  role: Role;
  audienceProfile: AudienceProfile;
};

export type ContentVisibilityTarget = {
  visibleToAll: boolean;
  visibleToRoles: Role[];
  visibleToAudienceProfiles: AudienceProfile[];
  visibleToUserIds: string[];
};

export function isContentVisibleForUser(
  target: ContentVisibilityTarget,
  user: ContentVisibilityUser,
): boolean {
  return (
    target.visibleToAll ||
    target.visibleToRoles.includes(user.role) ||
    target.visibleToAudienceProfiles.includes(user.audienceProfile) ||
    target.visibleToUserIds.includes(user.id)
  );
}

export function getContentVisibilityPresetLabel(preset: ContentVisibilityPreset) {
  return CONTENT_VISIBILITY_PRESET_LABELS[preset];
}

export function isContentVisibilityPreset(value: unknown): value is ContentVisibilityPreset {
  return typeof value === "string" && CONTENT_VISIBILITY_PRESETS.includes(value as ContentVisibilityPreset);
}

export function applyContentVisibilityPreset(preset: Exclude<ContentVisibilityPreset, "MANUAL">): ContentVisibilityTarget {
  if (preset === "ALL") {
    return {
      visibleToAll: true,
      visibleToRoles: [],
      visibleToAudienceProfiles: [],
      visibleToUserIds: [],
    };
  }

  return {
    visibleToAll: false,
    visibleToRoles: [],
    visibleToAudienceProfiles: [preset],
    visibleToUserIds: [],
  };
}

export function summarizeContentVisibility(target: ContentVisibilityTarget) {
  if (target.visibleToAll) {
    return "Iedereen";
  }

  const parts = [
    ...target.visibleToRoles.map(getRoleLabel),
    ...target.visibleToAudienceProfiles.map(getAudienceProfileLabel),
  ];

  if (target.visibleToUserIds.length > 0) {
    parts.push(`${target.visibleToUserIds.length} specifieke account${target.visibleToUserIds.length === 1 ? "" : "s"}`);
  }

  return parts.length ? parts.join(", ") : "Niet zichtbaar voor learners";
}
