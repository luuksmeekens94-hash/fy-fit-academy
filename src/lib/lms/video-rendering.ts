export function getLocalVideoPosterPath(src: string) {
  const suffixMatch = src.match(/([?#].*)$/);
  const pathPart = suffixMatch?.index === undefined ? src : src.slice(0, suffixMatch.index);
  const suffix = suffixMatch?.[0] ?? "";

  if (!pathPart.startsWith("/lms/") || !/\.mp4$/i.test(pathPart)) {
    return null;
  }

  return `${pathPart.replace(/\.mp4$/i, "-poster.jpg")}${suffix}`;
}
