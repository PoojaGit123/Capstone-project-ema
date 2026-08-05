/* eslint-disable */
/* global WebImporter */

/**
 * Transformer: WKND site-wide cleanup.
 *
 * Removes non-authorable site chrome and leftover markup so the import
 * contains only page-level authorable content.
 *
 * All selectors below were verified against migration-work/cleaned.html
 * (scraped from https://wknd.site/us/en.html). None are guessed.
 */

const TransformHook = {
  beforeTransform: 'beforeTransform',
  afterTransform: 'afterTransform',
};

export default function transform(hookName, element, payload) {
  if (hookName === TransformHook.beforeTransform) {
    // Nothing on this page blocks block parsing (no cookie banner, modal, or
    // overlay in the captured DOM). Site chrome removal happens in
    // afterTransform so block parsers still see full context.
  }

  if (hookName === TransformHook.afterTransform) {
    // Non-authorable site chrome (verified in cleaned.html):
    // - <header class="...cmp-experiencefragment--header">  (line 5)
    //     contains sign-in buttons, language navigation, logo, main nav, search
    // - <footer class="...cmp-experiencefragment--footer">  (line 471)
    //     contains footer logo, footer nav, social buttons, copyright text
    // - #toggleNav        mobile hamburger toggle            (line 568)
    // - #mobileNav        mobile navigation drawer           (line 574)
    // - iframe#destination_publishing_iframe... (Adobe ID/demdex sync) (line 566)
    WebImporter.DOMUtils.remove(element, [
      'header',
      'footer',
      '#toggleNav',
      '#mobileNav',
      'iframe',
    ]);

    // Leftover empty <meta> tags rendered inside cmp-image wrappers
    // (6 occurrences in cleaned.html, e.g. lines 183, 204, 227, 271, 334, 378),
    // plus other non-authorable head-ish/media elements if present.
    WebImporter.DOMUtils.remove(element, [
      'meta',
      'link',
      'noscript',
      'source',
    ]);

    // Strip AEM data-layer / component tracking attributes that carry no
    // authorable meaning (present on <body> and various components in cleaned.html).
    element.querySelectorAll('*').forEach((el) => {
      [...el.attributes].forEach((attr) => {
        if (attr.name.startsWith('data-cmp-')) {
          el.removeAttribute(attr.name);
        }
      });
    });
  }
}
