type ParsedFont = {
  hardBlank: string;
  height: number;
  glyphs: Map<string, string[]>;
};

const FIRST_PRINTABLE_ASCII = 32;

export function renderFiglet(text: string, fontSource: string): string {
  const normalized = text.trim();
  if (!normalized) {
    return "";
  }

  const font = parseFlf(fontSource);
  const rows = Array.from({ length: font.height }, () => "");

  for (const char of normalized) {
    const glyph = getGlyph(font, char);
    for (let row = 0; row < font.height; row += 1) {
      rows[row] += glyph[row].replaceAll(font.hardBlank, " ");
    }
  }

  return rows.map((row) => row.trimEnd()).join("\n");
}

export function parseFlf(source: string): ParsedFont {
  const lines = source.replace(/\r\n/g, "\n").split("\n");
  const header = lines[0]?.match(/^[ft]lf2a(.)(?:\s+)(\d+)(?:\s+)(\d+)(?:\s+)(\d+)(?:\s+)(-?\d+)(?:\s+)(\d+)/);

  if (!header) {
    throw new Error("Invalid FLF header");
  }

  const [, hardBlank, heightRaw, , , , commentLinesRaw] = header;
  const height = Number(heightRaw);
  const commentLines = Number(commentLinesRaw);
  const glyphStart = 1 + commentLines;
  const glyphs = new Map<string, string[]>();

  for (let code = FIRST_PRINTABLE_ASCII, lineIndex = glyphStart; lineIndex < lines.length; code += 1) {
    const glyphLines = lines.slice(lineIndex, lineIndex + height);
    if (glyphLines.length < height) {
      break;
    }

    glyphs.set(String.fromCharCode(code), glyphLines.map(stripEndMarker));
    lineIndex += height;
  }

  return { hardBlank, height, glyphs };
}

function stripEndMarker(line: string): string {
  const marker = line.at(-1);
  if (!marker) {
    return line;
  }

  let end = line.length;
  while (end > 0 && line[end - 1] === marker) {
    end -= 1;
  }

  return line.slice(0, end);
}

function getGlyph(font: ParsedFont, char: string): string[] {
  const exactGlyph = font.glyphs.get(char);
  if (exactGlyph) {
    return exactGlyph;
  }

  const upperGlyph = font.glyphs.get(char.toUpperCase());
  if (upperGlyph) {
    return upperGlyph;
  }

  const fallback = font.glyphs.get(" ");
  if (fallback) {
    const center = Math.floor(font.height / 2);
    return fallback.map((line, index) => (index === center ? ` ${char} ` : line));
  }

  return Array.from({ length: font.height }, (_, index) => (index === Math.floor(font.height / 2) ? char : " "));
}
