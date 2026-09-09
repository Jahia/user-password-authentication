import { FilterXSS, getDefaultWhiteList } from "xss";

/**
 * Allow-list for the richtext properties of `upaui:authentication`, rendered through
 * `dangerouslySetInnerHTML`. It is the formatting set the Content Editor produces for these
 * fields: links (including the `target="_blank"` of the shipped defaults), paragraphs, inline
 * emphasis, lists and headings. Tags and attributes outside it are dropped, and `href`/`src`
 * values are kept only for the usual document schemes.
 *
 * `xss` is used rather than DOMPurify because it is a pure-JS tokenizer with no DOM dependency,
 * so the same allow-list applies in the server rendering engine and in the browser.
 */
const whiteList = {
  ...getDefaultWhiteList(),
  a: ["href", "title", "target", "rel"],
  p: ["class"],
  span: ["class"],
  img: ["src", "alt", "title", "width", "height"],
};
// The library scheme-filters `href` and `src`, not `poster`, and these fields carry no media.
delete (whiteList as Record<string, unknown>).video;
delete (whiteList as Record<string, unknown>).audio;

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
