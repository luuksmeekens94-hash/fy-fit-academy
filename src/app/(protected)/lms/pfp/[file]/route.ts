import { readFile } from "node:fs/promises";
import path from "node:path";

import { notFound } from "next/navigation";

import { requireUser } from "@/lib/auth";

const allowedFiles = new Set([
  "review-complete.pdf",
  "aanleiding-en-doel.pdf",
  "lesopzet-en-leerdoelen.pdf",
  "urenoverzicht.pdf",
  "evaluatieformulier.pdf",
  "zelfstudie-onderdelen.docx",
  "zelfstudie-literatuur.xlsx",
  "ophey-guideline.pdf",
  "dye-2005-homeostasis.pdf",
  "module-1.pdf",
  "module-2.pdf",
  "module-3.pdf",
  "module-4.pdf",
  "llrom-dsdt.mp4",
  "klinische-kernpunten-pfp.mp4",
]);

const contentTypes: Record<string, string> = {
  ".pdf": "application/pdf",
  ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ".mp4": "video/mp4",
};

type PfpAssetRouteProps = {
  params: Promise<{ file: string }>;
};

export async function GET(_request: Request, { params }: PfpAssetRouteProps) {
  await requireUser();

  const { file } = await params;
  const safeFile = path.basename(file);

  if (safeFile !== file || !allowedFiles.has(safeFile)) {
    notFound();
  }

  const extension = path.extname(safeFile).toLowerCase();
  const filePath = path.join(process.cwd(), "public", "lms", "pfp", safeFile);
  const body = await readFile(filePath).catch(() => null);

  if (!body) {
    notFound();
  }

  return new Response(body, {
    headers: {
      "Content-Type": contentTypes[extension] ?? "application/octet-stream",
      "Content-Disposition": `inline; filename="${safeFile}"`,
      "Cache-Control": "private, max-age=0, must-revalidate",
    },
  });
}
