export function downloadFilename(header: unknown, fallback: string): string {
  let filename = fallback;
  if (typeof header === "string") {
    const extended = /filename\*\s*=\s*(?:"([^"\r\n]*)"|([^;\r\n]*))/i.exec(header);
    const regular = /(?:^|;)\s*filename\s*=\s*(?:"([^"\r\n]*)"|([^;\r\n]*))/i.exec(header);
    const value = extended?.[1] ?? extended?.[2];
    if (value) {
      const encoded = /^UTF-8'[^']*'(.*)$/i.exec(value.trim());
      try {
        filename = encoded ? decodeURIComponent(encoded[1]) : regular?.[1] ?? regular?.[2] ?? fallback;
      } catch {
        filename = regular?.[1] ?? regular?.[2] ?? fallback;
      }
    } else {
      filename = regular?.[1] ?? regular?.[2] ?? fallback;
    }
  }

  const basename = filename.trim().split(/[\\/]/).pop() ?? "";
  const safe = Array.from(basename)
    .filter((character) => character.charCodeAt(0) >= 32 && character.charCodeAt(0) !== 127)
    .join("")
    .replace(/[<>:"|?*]/g, "_")
    .replace(/[. ]+$/g, "");
  const name = safe && safe !== "." && safe !== ".." ? safe : fallback;
  return name.toLowerCase().endsWith(".csv") ? name : `${name}.csv`;
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  try {
    anchor.href = url;
    anchor.download = filename;
    document.body.append(anchor);
    anchor.click();
  } finally {
    anchor.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
}
