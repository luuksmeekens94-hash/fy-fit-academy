import assert from "node:assert/strict";
import { test } from "node:test";

import { parseLessonRichText } from "../../../src/lib/lms/lesson-rich-text.ts";

test("parseLessonRichText keeps regular paragraphs", () => {
  const blocks = parseLessonRichText("Intro alinea.\n\nVervolg alinea.");

  assert.deepEqual(blocks, [
    { type: "paragraph", text: "Intro alinea." },
    { type: "paragraph", text: "Vervolg alinea." },
  ]);
});

test("parseLessonRichText restores labelled source paragraphs as bullet lists", () => {
  const blocks = parseLessonRichText(
    "Biologisch: fysieke factoren.\n\nPsychologisch: gedachten en gedrag.\n\nSociaal: context en steun.\n\nVolgende paragraaf."
  );

  assert.deepEqual(blocks, [
    {
      type: "bulletList",
      items: [
        { label: "Biologisch", text: "fysieke factoren." },
        { label: "Psychologisch", text: "gedachten en gedrag." },
        { label: "Sociaal", text: "context en steun." },
      ],
    },
    { type: "paragraph", text: "Volgende paragraaf." },
  ]);
});

test("parseLessonRichText renders explicit bullet markers as bullet lists", () => {
  const blocks = parseLessonRichText("- Eerste punt\n\n• Tweede punt\n\nSlot.");

  assert.deepEqual(blocks, [
    {
      type: "bulletList",
      items: [{ text: "Eerste punt" }, { text: "Tweede punt" }],
    },
    { type: "paragraph", text: "Slot." },
  ]);
});

test("parseLessonRichText keeps wrapped figure captions together", () => {
  const blocks = parseLessonRichText(
    "Figuur 3 Evidence-based klinische benaderingen voor PFP en PT. Optimale behandeling en tijdspaden met\n" +
      "oefentherapie als hoeksteen gedurende respectievelijk de eerste 6 en 12 weken voor PFP en PT.\n\n" +
      "Literatuur:",
  );

  assert.deepEqual(blocks, [
    {
      type: "paragraph",
      text: "Figuur 3 Evidence-based klinische benaderingen voor PFP en PT. Optimale behandeling en tijdspaden met oefentherapie als hoeksteen gedurende respectievelijk de eerste 6 en 12 weken voor PFP en PT.",
    },
    { type: "paragraph", text: "Literatuur:" },
  ]);
});
