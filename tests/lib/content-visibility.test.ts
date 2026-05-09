import test from "node:test";
import assert from "node:assert/strict";

import { getAudienceProfileLabel } from "../../src/lib/audience.ts";
import {
  applyContentVisibilityPreset,
  CONTENT_VISIBILITY_PRESET_OPTIONS,
  getContentVisibilityPresetLabel,
  isContentVisibilityPreset,
  isContentVisibleForUser,
} from "../../src/lib/content-visibility.ts";
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

test("zichtbaarheidspresets maken veilige startsets voor admin content", () => {
  assert.deepEqual(applyContentVisibilityPreset("ALL"), {
    visibleToAll: true,
    visibleToRoles: [],
    visibleToAudienceProfiles: [],
    visibleToUserIds: [],
  });
  assert.deepEqual(applyContentVisibilityPreset("FYSIOTHERAPEUT"), {
    visibleToAll: false,
    visibleToRoles: [],
    visibleToAudienceProfiles: ["FYSIOTHERAPEUT"],
    visibleToUserIds: [],
  });
  assert.deepEqual(applyContentVisibilityPreset("PRAKTIJKONDERSTEUNER"), {
    visibleToAll: false,
    visibleToRoles: [],
    visibleToAudienceProfiles: ["PRAKTIJKONDERSTEUNER"],
    visibleToUserIds: [],
  });
  assert.deepEqual(applyContentVisibilityPreset("FITCOACH"), {
    visibleToAll: false,
    visibleToRoles: [],
    visibleToAudienceProfiles: ["FITCOACH"],
    visibleToUserIds: [],
  });
});

test("zichtbaarheidspresets zijn gelabeld en valideerbaar", () => {
  assert.deepEqual(
    CONTENT_VISIBILITY_PRESET_OPTIONS.map((option) => option.value),
    ["MANUAL", "ALL", "FYSIOTHERAPEUT", "PRAKTIJKONDERSTEUNER", "FITCOACH"],
  );
  assert.equal(getContentVisibilityPresetLabel("PRAKTIJKONDERSTEUNER"), "Alleen praktijkondersteuners");
  assert.equal(isContentVisibilityPreset("FITCOACH"), true);
  assert.equal(isContentVisibilityPreset("EPD"), false);
});
