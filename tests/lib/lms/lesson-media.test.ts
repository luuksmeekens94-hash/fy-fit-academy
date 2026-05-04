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
});
