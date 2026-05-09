import test from "node:test";
import assert from "node:assert/strict";

import { getAudienceProfileLabel } from "../../src/lib/audience.ts";
import { isContentVisibleForUser } from "../../src/lib/content-visibility.ts";
import type { ContentVisibilityTarget, ContentVisibilityUser } from "../../src/lib/content-visibility.ts";

const user: ContentVisibilityUser = {
  id: "user-1",
  role: "MEDEWERKER",
  audienceProfile: "FYSIOTHERAPEUT",
};

const baseTarget: ContentVisibilityTarget = {
  visibleToAll: false,
  visibleToRoles: [],
  visibleToAudienceProfiles: [],
  visibleToUserIds: [],
};

test("content is zichtbaar voor iedereen bij visibleToAll", () => {
  assert.equal(isContentVisibleForUser({ ...baseTarget, visibleToAll: true }, user), true);
});

test("content is zichtbaar bij rolmatch", () => {
  assert.equal(isContentVisibleForUser({ ...baseTarget, visibleToRoles: ["MEDEWERKER"] }, user), true);
});

test("content is zichtbaar bij doelgroepmatch", () => {
  assert.equal(
    isContentVisibleForUser({ ...baseTarget, visibleToAudienceProfiles: ["FYSIOTHERAPEUT"] }, user),
    true,
  );
});

test("content is zichtbaar bij specifieke user match", () => {
  assert.equal(isContentVisibleForUser({ ...baseTarget, visibleToUserIds: ["user-1"] }, user), true);
});

test("content is niet zichtbaar zonder match", () => {
  assert.equal(
    isContentVisibleForUser(
      {
        ...baseTarget,
        visibleToRoles: ["TEAMLEIDER"],
        visibleToAudienceProfiles: ["FITCOACH"],
        visibleToUserIds: ["user-2"],
      },
      user,
    ),
    false,
  );
});

test("praktijkondersteuner label is beschikbaar", () => {
  assert.equal(getAudienceProfileLabel("PRAKTIJKONDERSTEUNER"), "Praktijkondersteuner");
});
