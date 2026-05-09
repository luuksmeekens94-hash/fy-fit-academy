import { getAudienceProfileLabel } from "@/lib/audience";
import { getRoleLabel } from "@/lib/roles";
import type { AudienceProfile, Role } from "@/lib/types";

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
