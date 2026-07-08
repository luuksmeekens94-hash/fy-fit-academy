import test from "node:test";
import assert from "node:assert/strict";

import { extractLessonMedia } from "../../../src/lib/lms/lesson-media.ts";

test("extractLessonMedia separates video paths from learner-facing text", () => {
  const result = extractLessonMedia(
    "Bekijk de video bij deze module.\n\nVideo: /lms/demo-geaccrediteerde-elearning/module-1/module-1-complexiteit.mp4",
  );

  assert.equal(result.text, "Bekijk de video bij deze module.");
  assert.deepEqual(result.videos, ["/lms/demo-geaccrediteerde-elearning/module-1/module-1-complexiteit.mp4"]);
  assert.deepEqual(result.images, []);
  assert.deepEqual(result.documents, []);
  assert.deepEqual(result.blocks, [
    { type: "text", text: "Bekijk de video bij deze module." },
    { type: "video", src: "/lms/demo-geaccrediteerde-elearning/module-1/module-1-complexiteit.mp4" },
  ]);
});

test("extractLessonMedia renders image blocks at their original content position", () => {
  const result = extractLessonMedia(
    "Intro voor afbeelding.\n\nFiguur 1. Emergentie\n\n/lms/demo-geaccrediteerde-elearning/module-1/images/image1.png\n\nTekst na afbeelding.",
  );

  assert.equal(result.text, "Intro voor afbeelding.\n\nFiguur 1. Emergentie\n\nTekst na afbeelding.");
  assert.deepEqual(result.videos, []);
  assert.deepEqual(result.images, ["/lms/demo-geaccrediteerde-elearning/module-1/images/image1.png"]);
  assert.deepEqual(result.documents, []);
  assert.deepEqual(result.blocks, [
    { type: "text", text: "Intro voor afbeelding.\n\nFiguur 1. Emergentie" },
    { type: "image", src: "/lms/demo-geaccrediteerde-elearning/module-1/images/image1.png" },
    { type: "text", text: "Tekst na afbeelding." },
  ]);
});

test("extractLessonMedia separates image paths and removes the image reference block", () => {
  const result = extractLessonMedia(
    "Een klok is gecompliceerd.\n\nAfbeeldingen bij deze les:\n- /lms/demo-geaccrediteerde-elearning/module-1/images/image1.png\n- /lms/demo-geaccrediteerde-elearning/module-1/images/image2.png",
  );

  assert.equal(result.text, "Een klok is gecompliceerd.");
  assert.deepEqual(result.videos, []);
  assert.deepEqual(result.images, [
    "/lms/demo-geaccrediteerde-elearning/module-1/images/image1.png",
    "/lms/demo-geaccrediteerde-elearning/module-1/images/image2.png",
  ]);
  assert.deepEqual(result.documents, []);
  assert.deepEqual(result.blocks, [
    { type: "text", text: "Een klok is gecompliceerd." },
    { type: "image", src: "/lms/demo-geaccrediteerde-elearning/module-1/images/image1.png" },
    { type: "image", src: "/lms/demo-geaccrediteerde-elearning/module-1/images/image2.png" },
  ]);
});

test("extractLessonMedia renders video image and document links as ordered blocks without raw references in text", () => {
  const media = extractLessonMedia(`Intro bij de les.
Video: /lms/module-1/uitleg.mp4
Bekijk ook het protocol: /lms/module-1/protocol.pdf
Afbeelding: /lms/module-1/schema.png
Afrondende tekst.`);

  assert.equal(media.text.includes("/lms/module-1/uitleg.mp4"), false);
  assert.equal(media.text.includes("/lms/module-1/protocol.pdf"), false);
  assert.deepEqual(media.videos, ["/lms/module-1/uitleg.mp4"]);
  assert.deepEqual(media.documents, ["/lms/module-1/protocol.pdf"]);
  assert.deepEqual(media.images, ["/lms/module-1/schema.png"]);
  assert.deepEqual(media.blocks, [
    { type: "text", text: "Intro bij de les." },
    { type: "video", src: "/lms/module-1/uitleg.mp4" },
    { type: "document", src: "/lms/module-1/protocol.pdf", label: "Bekijk ook het protocol" },
    { type: "image", src: "/lms/module-1/schema.png" },
    { type: "text", text: "Afrondende tekst." },
  ]);
});

test("extractLessonMedia accepts external media urls and preserves safe document labels", () => {
  const media = extractLessonMedia("Reader: https://cdn.example.nl/fyfit/reader.pdf\nVideo: https://video.example.nl/uitleg.mp4");

  assert.deepEqual(media.documents, ["https://cdn.example.nl/fyfit/reader.pdf"]);
  assert.deepEqual(media.videos, ["https://video.example.nl/uitleg.mp4"]);
  assert.deepEqual(media.blocks, [
    { type: "document", src: "https://cdn.example.nl/fyfit/reader.pdf", label: "Reader" },
    { type: "video", src: "https://video.example.nl/uitleg.mp4" },
  ]);
});

test("extractLessonMedia behoudt volledige Office-extensies voor PFP-bijlagen", () => {
  const media = extractLessonMedia(`Zelfstudie-onderdelen format: /lms/pfp/zelfstudie-onderdelen.docx
Onderbouwing zelfstudie/literatuur: /lms/pfp/zelfstudie-literatuur.xlsx`);

  assert.deepEqual(media.documents, [
    "/lms/pfp/zelfstudie-onderdelen.docx",
    "/lms/pfp/zelfstudie-literatuur.xlsx",
  ]);
  assert.deepEqual(media.blocks, [
    { type: "document", src: "/lms/pfp/zelfstudie-onderdelen.docx", label: "Zelfstudie-onderdelen format" },
    { type: "document", src: "/lms/pfp/zelfstudie-literatuur.xlsx", label: "Onderbouwing zelfstudie/literatuur" },
  ]);
});
