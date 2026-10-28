const NAMED_ENTITIES: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: " ",
  deg: "°",
  times: "×",
  ndash: "–",
  mdash: "—",
  hellip: "…",
  laquo: "«",
  raquo: "»",
  lsquo: "‘",
  rsquo: "’",
  ldquo: "“",
  rdquo: "”",
  copy: "©",
  reg: "®",
  trade: "™",
};

/** Woo returns names HTML-escaped (e.g. "Pots &amp; Pans"); titles are plain text here. */
export function decodeEntities(text: string): string {
  return text.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (match, body: string) => {
    if (body[0] === "#") {
      const code = body[1].toLowerCase() === "x" ? parseInt(body.slice(2), 16) : parseInt(body.slice(1), 10);
      return Number.isFinite(code) ? String.fromCodePoint(code) : match;
    }
    return NAMED_ENTITIES[body.toLowerCase()] ?? match;
  });
}

/**
 * Plain text from Woo rich-text fields (descriptions), so they render without
 * dangerouslySetInnerHTML. Block ends and <br> become line breaks, list items get
 * a bullet, everything else is dropped. Blank runs collapse to one empty line.
 */
export function htmlToText(html: string): string {
  const text = html
    .replace(/<(script|style)\b[\s\S]*?<\/\1\s*>/gi, "")
    // Source whitespace is insignificant in HTML; only tags make line breaks.
    .replace(/\s+/g, " ")
    .replace(/<\/(p|h[1-6]|blockquote|ul|ol)\s*>/gi, "\n\n")
    .replace(/<br\s*\/?>|<\/(div|li|tr)\s*>/gi, "\n")
    .replace(/<li\b[^>]*>/gi, "• ")
    .replace(/<[^>]*>/g, "");
  return decodeEntities(text)
    .split("\n")
    .map((line) => line.replace(/[ \t ]+/g, " ").trim())
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
