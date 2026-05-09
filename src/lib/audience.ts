import type { AudienceProfile } from "@/lib/types";

export const AUDIENCE_PROFILES = [
  "FYSIOTHERAPEUT",
  "PRAKTIJKONDERSTEUNER",
  "FITCOACH",
] as const satisfies AudienceProfile[];

const AUDIENCE_PROFILE_LABELS: Record<AudienceProfile, string> = {
  FYSIOTHERAPEUT: "Fysiotherapeut",
  PRAKTIJKONDERSTEUNER: "Praktijkondersteuner",
  FITCOACH: "Fitcoach",
};

export const AUDIENCE_PROFILE_OPTIONS = AUDIENCE_PROFILES.map((value) => ({
  value,
  label: AUDIENCE_PROFILE_LABELS[value],
}));

export function getAudienceProfileLabel(profile: AudienceProfile) {
  return AUDIENCE_PROFILE_LABELS[profile];
}

export function isAudienceProfile(value: unknown): value is AudienceProfile {
  return typeof value === "string" && AUDIENCE_PROFILES.includes(value as AudienceProfile);
}
