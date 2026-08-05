/* eslint-disable */
/* global WebImporter */
/**
 * Parser for variant: carousel-hero
 * Base block: carousel-hero (carousel)
 * Source URL: https://wknd.site/us/en.html
 * Source selector: div.carousel.panelcontainer.cmp-carousel--hero
 * Generated: 2026-08-05
 *
 * Structure (from library-description.txt): 2-column table.
 * Row 1: block name. Each subsequent row = one slide:
 *   cell 1 = image (mandatory), cell 2 = content (heading + description + CTA).
 *
 * Source is an AEM carousel: each `.cmp-carousel__item` holds a teaser with a
 * title (h2), description, single CTA action link, and a background image.
 */
export default function parse(element, { document }) {
  // Each carousel item is a slide.
  const slides = Array.from(element.querySelectorAll('.cmp-carousel__item'));

  const cells = [];

  slides.forEach((slide) => {
    // Image cell (mandatory). Fallback to any img within the slide.
    const image = slide.querySelector('.cmp-teaser__image img, .cmp-image img, img');

    // Content cell: heading + description + CTA.
    const heading = slide.querySelector('.cmp-teaser__title, h1, h2, h3, [class*="title"]');
    const description = slide.querySelector('.cmp-teaser__description, [class*="description"]');
    const cta = slide.querySelector('.cmp-teaser__action-link, .cmp-teaser__action-container a, a');

    const contentCell = [];
    if (heading) contentCell.push(heading);
    if (description) contentCell.push(description);
    if (cta) contentCell.push(cta);

    // Only emit a slide row if it has meaningful content.
    if (!image && contentCell.length === 0) return;

    // 2-column row: image cell + content cell. Pad empty cells to keep width uniform.
    cells.push([image || '', contentCell.length ? contentCell : '']);
  });

  // Empty-block guard: no slides found — unwrap rather than emit an empty block.
  if (cells.length === 0) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'carousel-hero', cells });
  element.replaceWith(block);
}
