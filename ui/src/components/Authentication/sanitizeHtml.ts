import { FilterXSS } from "xss";

/**
 * Allow-list for the richtext properties of `upaui:authentication`, rendered through
 * `dangerouslySetInnerHTML`. It names the formatting these fields are meant to carry: links
 * (including the `target="_blank"` of the shipped defaults), paragraphs, inline emphasis, lists
 * and headings. Every other tag and attribute is dropped, and `href` keeps only the usual
 * document schemes.
 *
 * `xss` is used rather than DOMPurify because it is a pure-JS tokenizer with no DOM dependency,
 * so the same allow-list applies in the server rendering engine and in the browser.
 */
const whiteList: Record<string, string[]> = {
  a: ["href", "title", "target", "rel"],
  p: ["class"],
  span: ["class"],
  b: [],
  strong: [],
  i: [],
  em: [],
  u: [],
  s: [],
  br: [],
  ul: [],
  ol: [],
  li: [],
  h1: [],
  h2: [],
  h3: [],
  h4: [],
  h5: [],
  h6: [],
};

const filter = new FilterXSS({
  whiteList,
  stripIgnoreTag: true,
  stripIgnoreTagBody: ["script", "style"],
});

/**
 * Returns `html` reduced to the allow-list above, and `""` for an empty value so callers can
 * keep testing the result for truthiness.
 */
export function sanitizeHtml(html: string | null | undefined): string {
  if (!html) return "";
  return filter.process(html);
}
