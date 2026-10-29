/**
 * A deliberately small markdown subset for scripts: headings (# to ###),
 * **bold**, *italic*, - bullets, 1. numbers, > quotes and --- rules.
 * Line breaks inside a paragraph are kept, because scripts are written
 * line by line.
 */
export type Span = { text: string; bold?: boolean; italic?: boolean };

export type Block =
  | { type: 'heading'; level: 1 | 2 | 3; spans: Span[] }
  | { type: 'paragraph' | 'quote'; spans: Span[] }
  | { type: 'bullet'; spans: Span[] }
  | { type: 'number'; marker: string; spans: Span[] }
  | { type: 'rule' };

// As in CommonMark, a marker next to whitespace isn't emphasis, so "5 * 3 * 2"
// stays as typed. Nested emphasis isn't supported.
const WORD = String.raw`[^\s*](?:[^*\n]*[^\s*])?`;
const INLINE = new RegExp(
  String.raw`(\*\*\*${WORD}\*\*\*|\*\*${WORD}\*\*|\*${WORD}\*)`,
);

export function parseInline(text: string): Span[] {
  // `split` with a capture group puts the matches at the odd indexes.
  return text
    .split(INLINE)
    .map((part, index): Span => {
      if (index % 2 === 0) {
        return { text: part };
      }

      if (part.startsWith('***')) {
        return { text: part.slice(3, -3), bold: true, italic: true };
      }

      if (part.startsWith('**')) {
        return { text: part.slice(2, -2), bold: true };
      }

      return { text: part.slice(1, -1), italic: true };
    })
    .filter((span) => span.text);
}

export function parseMarkdown(source: string): Block[] {
  const blocks: Block[] = [];
  let pending: { type: 'paragraph' | 'quote'; lines: string[] } | null = null;

  const flush = () => {
    if (pending) {
      blocks.push({
        type: pending.type,
        spans: parseInline(pending.lines.join('\n')),
      });
      pending = null;
    }
  };

  const accumulate = (type: 'paragraph' | 'quote', line: string) => {
    if (pending?.type !== type) {
      flush();
      pending = { type, lines: [] };
    }

    pending.lines.push(line);
  };

  for (const raw of source.replace(/\r\n?/g, '\n').split('\n')) {
    const line = raw.trim();
    let match: RegExpExecArray | null;

    if (!line) {
      flush();
    } else if (/^([-*_])\1{2,}$/.test(line)) {
      flush();
      blocks.push({ type: 'rule' });
    } else if ((match = /^(#{1,3})\s+(.*)$/.exec(line))) {
      flush();
      blocks.push({
        type: 'heading',
        level: match[1]!.length as 1 | 2 | 3,
        spans: parseInline(match[2]!),
      });
    } else if ((match = /^>\s?(.*)$/.exec(line))) {
      accumulate('quote', match[1]!);
    } else if ((match = /^[-*+]\s+(.*)$/.exec(line))) {
      flush();
      blocks.push({ type: 'bullet', spans: parseInline(match[1]!) });
    } else if ((match = /^(\d+[.)])\s+(.*)$/.exec(line))) {
      flush();
      blocks.push({
        type: 'number',
        marker: match[1]!,
        spans: parseInline(match[2]!),
      });
    } else {
      accumulate('paragraph', line);
    }
  }

  flush();

  return blocks;
}
