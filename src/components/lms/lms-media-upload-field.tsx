"use client";

import { useMemo, useState } from "react";

type LmsMediaUploadFieldProps = {
  courseId: string;
  lessonId?: string | null;
  defaultLabel?: string;
  defaultUrl?: string;
  compact?: boolean;
};

type UploadResult = {
  url: string;
  mediaKind: "video" | "image" | "document";
  fileName: string;
};

function labelFromFileName(fileName: string) {
  return fileName.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " ").trim();
}

function getMediaKindFromUrl(url: string): UploadResult["mediaKind"] | null {
  if (/\.(mp4)(?:\?|$)/i.test(url)) return "video";
  if (/\.(png|jpe?g|webp)(?:\?|$)/i.test(url)) return "image";
  if (/\.(pdf|docx?|pptx?|xlsx?)(?:\?|$)/i.test(url)) return "document";
  return null;
}

export function LmsMediaUploadField({ courseId, lessonId, defaultLabel = "", defaultUrl = "", compact = false }: LmsMediaUploadFieldProps) {
  const [label, setLabel] = useState(defaultLabel);
  const [url, setUrl] = useState(defaultUrl);
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<"idle" | "uploading" | "done" | "error">("idle");
  const [message, setMessage] = useState("");
  const [uploadedKind, setUploadedKind] = useState<UploadResult["mediaKind"] | null>(null);

  const previewKind = uploadedKind ?? getMediaKindFromUrl(url);
  const canUpload = Boolean(file) && status !== "uploading";
  const helpText = compact
    ? "Upload of plak een bestaande URL. De URL wordt automatisch in dit formulier opgeslagen."
    : "Upload video/document of plak een bestaande URL. Na upload wordt de Blob-link automatisch ingevuld.";

  const accept = useMemo(
    () => [
      "video/mp4",
      "image/png",
      "image/jpeg",
      "image/webp",
      "application/pdf",
      ".doc",
      ".docx",
      ".ppt",
      ".pptx",
      ".xls",
      ".xlsx",
    ].join(","),
    [],
  );

  async function uploadSelectedFile() {
    if (!file) return;

    setStatus("uploading");
    setMessage("Uploaden naar Vercel Blob...");

    const formData = new FormData();
    formData.set("file", file);
    formData.set("courseId", courseId);
    if (lessonId) formData.set("lessonId", lessonId);

    try {
      const response = await fetch("/lms/media-upload", {
        method: "POST",
        body: formData,
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "Upload mislukt.");
      }

      const result = data as UploadResult;
      setUrl(result.url);
      setUploadedKind(result.mediaKind);
      setLabel((current) => current || labelFromFileName(result.fileName));
      setStatus("done");
      setMessage("Upload klaar. Link is ingevuld; vergeet de les niet op te slaan.");
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Upload mislukt.");
    }
  }

  return (
    <div className="grid gap-3 rounded-2xl border border-dashed border-[var(--border)] bg-[var(--sage-soft)]/40 p-3">
      <div className="grid gap-2 lg:grid-cols-[0.75fr_1.25fr]">
        <input
          name="lessonMediaLabel"
          value={label}
          onChange={(event) => setLabel(event.target.value)}
          placeholder="Mediatitel, bv. Video module 1"
          className="rounded-2xl border border-[var(--border)] px-4 py-3 text-sm"
        />
        <input
          name="lessonMediaUrl"
          value={url}
          onChange={(event) => {
            setUrl(event.target.value);
            setUploadedKind(null);
          }}
          placeholder="Wordt automatisch ingevuld na upload, of plak https://..."
          className="rounded-2xl border border-[var(--border)] px-4 py-3 text-sm"
        />
      </div>

      <div className="grid gap-2 lg:grid-cols-[1fr_auto]">
        <input
          type="file"
          accept={accept}
          onChange={(event) => {
            const selectedFile = event.target.files?.[0] ?? null;
            setFile(selectedFile);
            setStatus("idle");
            setMessage("");
            if (selectedFile && !label) {
              setLabel(labelFromFileName(selectedFile.name));
            }
          }}
          className="rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-sm"
        />
        <button
          type="button"
          onClick={uploadSelectedFile}
          disabled={!canUpload}
          className="rounded-full bg-slate-950 px-4 py-2 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          {status === "uploading" ? "Uploaden..." : "Uploaden"}
        </button>
      </div>

      <p className="text-xs leading-5 text-[var(--ink-soft)]">{helpText}</p>

      {message ? (
        <p className={`text-xs font-semibold ${status === "error" ? "text-red-700" : "text-[var(--teal)]"}`}>{message}</p>
      ) : null}

      {url && previewKind ? (
        <div className="rounded-2xl border border-[var(--border)] bg-white p-3 text-xs text-slate-700">
          {previewKind === "video" ? <video src={url} controls preload="metadata" className="w-full rounded-xl" /> : null}
          {previewKind === "image" ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={url} alt={label || "Media preview"} className="max-h-56 w-full rounded-xl object-contain" />
          ) : null}
          {previewKind === "document" ? (
            <a href={url} target="_blank" rel="noreferrer" className="font-semibold text-[var(--teal)] underline">
              Preview/open document: {label || "document"}
            </a>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
