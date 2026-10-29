export const countWords = (text: string) =>
  text.trim().split(/\s+/).filter(Boolean).length;

/** A script's text without its markdown markup, for previews. */
export const plainText = (markdown: string) =>
  markdown.replace(/^\s*(#{1,3}|>|[-*+]|\d+[.)])\s+/gm, '').replace(/\*+/g, '');
