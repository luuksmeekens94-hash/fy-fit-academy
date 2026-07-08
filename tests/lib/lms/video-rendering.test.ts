import test from "node:test";
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import path from "node:path";

import { getLocalVideoPosterPath } from "../../../src/lib/lms/video-rendering.ts";

test("getLocalVideoPosterPath gebruikt lokale thumbnails voor LMS-video's", () => {
  const posterPath = getLocalVideoPosterPath("/lms/pfp/llrom-dsdt.mp4");

  assert.equal(posterPath, "/lms/pfp/llrom-dsdt-poster.jpg");
  assert.equal(
    getLocalVideoPosterPath("/lms/pfp/klinische-kernpunten-pfp.mp4?v=20260708"),
    "/lms/pfp/klinische-kernpunten-pfp-poster.jpg?v=20260708",
  );
  assert.equal(existsSync(path.join(process.cwd(), "public", posterPath.replace(/^\//, ""))), true);
});

test("getLocalVideoPosterPath gebruikt geen verzonnen poster voor externe of niet-video bronnen", () => {
  assert.equal(getLocalVideoPosterPath("https://example.com/video.mp4"), null);
  assert.equal(getLocalVideoPosterPath("/lms/pfp/zelfstudie-literatuur.xlsx"), null);
});
