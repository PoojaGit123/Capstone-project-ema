/* eslint-disable */
/* global WebImporter */
/**
 * Parser for variant: hero
 * Base block: hero
 * Source URL: https://wknd.site/us/en.html
 * Source selectors:
 *   div.teaser.cmp-teaser--featured
 *   div.teaser.cmp-teaser--hero.cmp-teaser--imagebottom
 * Generated: 2026-08-05
 *
 * Structure (from library-description.txt): 1 column, 3 rows.
 *   Row 1: block name.
 *   Row 2 (single cell): background image (optional).
 *   Row 3 (single cell): title + optional eyebrow/subheading + CTA.
 *
 * Source is an AEM teaser: optional pretitle (eyebrow), title (h2),
 * description, single CTA action link, and an image.
 */
export default function parse(element, { document }) {
  // Background image (optional).
  const image = element.querySelector('.cmp-teaser__image img, .cmp-image img, img');

  // Content pieces.
  const eyebrow = element.querySelector('.cmp-teaser__pretitle, [class*="pretitle"], [class*="eyebrow"]');
  // Heading selector deliberately excludes pretitle/eyebrow so it does not
  // collide with the eyebrow element ([class*="title"] would otherwise match
  // "cmp-teaser__pretitle" and select the same node).
  const heading = element.querySelector('.cmp-teaser__title, h1, h2, h3, [class*="title"]:not([class*="pretitle"]):not([class*="eyebrow"])');
  const description = element.querySelector('.cmp-teaser__description, [class*="description"]');
  const cta = element.querySelector('.cmp-teaser__action-link, .cmp-teaser__action-container a, a');

  // Empty-block guard: bail gracefully if nothing meaningful is present.
  if (!heading && !description && !image) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const cells = [];

  // Row 2: background image (only if present).
  if (image) cells.push([image]);

  // Row 3: text content in a single cell.
  const contentCell = [];
  if (eyebrow) contentCell.push(eyebrow);
  if (heading) contentCell.push(heading);
  if (description) contentCell.push(description);
  if (cta) contentCell.push(cta);
  cells.push([contentCell]);

  const block = WebImporter.Blocks.createBlock(document, { name: 'hero', cells });
  element.replaceWith(block);
}
