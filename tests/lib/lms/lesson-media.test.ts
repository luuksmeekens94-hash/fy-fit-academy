import test from "node:test";
import assert from "node:assert/strict";

import { extractLessonMedia } from "../../../src/lib/lms/lesson-media.ts";

test("extractLessonMedia separates video paths from learner-facing text", () => {
  const result = extractLessonMedia(
    "Bekijk de video bij deze module.\n\nVideo: /lms/demo-geaccrediteerde-elearning/module-1/module-1-complexiteit.mp4"
  );

  assert.equal(result.text, "Bekijk de video bij deze module.");
  assert.deepEqual(result.videos, ["/lms/demo-geaccrediteerde-elearning/module-1/module-1-complexiteit.mp4"]);
  assert.deepEqual(result.images, []);
  assert.deepEqual(result.blocks, [
    { type: "text", text: "Bekijk de video bij deze module." },
    { type: "video", src: "/lms/demo-geaccrediteerde-elearning/module-1/module-1-complexiteit.mp4" },
  ]);
});

test("extractLessonMedia renders image blocks at their original content position", () => {
  const result = extractLessonMedia(
    "Intro voor afbeelding.\n\nFiguur 1. Emergentie\n\n/lms/demo-geaccrediteerde-elearning/module-1/images/image1.png\n\nTekst na afbeelding."
  );

  assert.equal(result.text, "Intro voor afbeelding.\n\nFiguur 1. Emergentie\n\nTekst na afbeelding.");
  assert.deepEqual(result.videos, []);
  assert.deepEqual(result.images, ["/lms/demo-geaccrediteerde-elearning/module-1/images/image1.png"]);
  assert.deepEqual(result.blocks, [
    { type: "text", text: "Intro voor afbeelding.\n\nFiguur 1. Emergentie" },
    { type: "image", src: "/lms/demo-geaccrediteerde-elearning/module-1/images/image1.png" },
    { type: "text", text: "Tekst na afbeelding." },
  ]);
});

test("extractLessonMedia separates image paths and removes the image reference block", () => {
  const result = extractLessonMedia(
    "Een klok is gecompliceerd.\n\nAfbeeldingen bij deze les:\n- /lms/demo-geaccrediteerde-elearning/module-1/images/image1.png\n- /lms/demo-geaccrediteerde-elearning/module-1/images/image2.png"
  );

  assert.equal(result.text, "Een klok is gecompliceerd.");
  assert.deepEqual(result.videos, []);
  assert.deepEqual(result.images, [
    "/lms/demo-geaccrediteerde-elearning/module-1/images/image1.png",
    "/lms/demo-geaccrediteerde-elearning/module-1/images/image2.png",
  ]);
  assert.deepEqual(result.blocks, [
    { type: "text", text: "Een klok is gecompliceerd." },
    { type: "image", src: "/lms/demo-geaccrediteerde-elearning/module-1/images/image1.png" },
    { type: "image", src: "/lms/demo-geaccrediteerde-elearning/module-1/images/image2.png" },
  ]);
});
