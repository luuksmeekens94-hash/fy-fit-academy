import test from "node:test";
import assert from "node:assert/strict";

import {
  AUDIENCE_PROFILES,
  getAudienceProfileLabel,
  isAudienceProfile,
} from "../../src/lib/audience.ts";

test("doelgroep-profielen bevatten de Sprint 2A profielen", () => {
  assert.deepEqual([...AUDIENCE_PROFILES], ["FYSIOTHERAPEUT", "PRAKTIJKONDERSTEUNER", "FITCOACH"]);
});

test("labels zijn Nederlandstalig en praktijkondersteuner dekt front/back office", () => {
  assert.equal(getAudienceProfileLabel("FYSIOTHERAPEUT"), "Fysiotherapeut");
  assert.equal(getAudienceProfileLabel("PRAKTIJKONDERSTEUNER"), "Praktijkondersteuner");
  assert.equal(getAudienceProfileLabel("FITCOACH"), "Fitcoach");
});

test("isAudienceProfile valideert enumwaarden", () => {
  assert.equal(isAudienceProfile("FYSIOTHERAPEUT"), true);
  assert.equal(isAudienceProfile("PRAKTIJKONDERSTEUNER"), true);
  assert.equal(isAudienceProfile("FITCOACH"), true);
  assert.equal(isAudienceProfile("FRONT_OFFICE"), false);
  assert.equal(isAudienceProfile(null), false);
});
