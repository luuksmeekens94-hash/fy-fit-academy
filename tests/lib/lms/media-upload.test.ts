import test from "node:test";
import assert from "node:assert/strict";

import {
  buildLmsUploadPath,
  getMediaKindFromMimeType,
  validateLmsUploadFile,
} from "../../../src/lib/lms/media-upload.ts";

test("validateLmsUploadFile accepts accreditation media and classifies type", () => {
  const result = validateLmsUploadFile({
    name: "Module 1 - intake video.mp4",
    size: 25 * 1024 * 1024,
    type: "video/mp4",
  });

  assert.deepEqual(result, {
    name: "Module 1 - intake video.mp4",
    extension: "mp4",
    mediaKind: "video",
    safeBaseName: "module-1-intake-video",
    size: 25 * 1024 * 1024,
    type: "video/mp4",
  });
});

test("validateLmsUploadFile rejects unsafe or too large uploads", () => {
  assert.throws(
    () => validateLmsUploadFile({ name: "script.exe", size: 1000, type: "application/octet-stream" }),
    /Bestandstype wordt niet ondersteund/,
  );

  assert.throws(
    () => validateLmsUploadFile({ name: "grote-video.mp4", size: 260 * 1024 * 1024, type: "video/mp4" }),
    /Bestand is te groot/,
  );
});

test("buildLmsUploadPath scopes files under a stable course lesson prefix", () => {
  assert.equal(
    buildLmsUploadPath({
      courseId: "course_123",
      lessonId: "lesson_456",
      safeBaseName: "module-1-intake-video",
      extension: "mp4",
      now: new Date("2026-05-18T13:30:00.000Z"),
    }),
    "lms/course-123/lesson-456/2026-05-18/module-1-intake-video.mp4",
  );
});

test("getMediaKindFromMimeType maps document image and video mime types", () => {
  assert.equal(getMediaKindFromMimeType("application/pdf"), "document");
  assert.equal(getMediaKindFromMimeType("image/png"), "image");
  assert.equal(getMediaKindFromMimeType("video/mp4"), "video");
  assert.equal(getMediaKindFromMimeType("text/html"), null);
});
