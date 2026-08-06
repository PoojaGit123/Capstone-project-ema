/* eslint-disable */
/* global WebImporter */
/**
 * Parser for variant: accordion
 * Base block: accordion
 * Source: https://wknd.site/us/en/faqs.html (div.accordion.panelcontainer)
 * Generated: 2026-08-05
 *
 * Library convention (accordion): 2-column table. First row is the block name.
 * Each subsequent row = [Title cell] | [Content cell], one per accordion item.
 *
 * Source is an AEM cmp-accordion: each `.cmp-accordion__item` has a
 * `.cmp-accordion__button > .cmp-accordion__title` (question) and a
 * `.cmp-accordion__panel` containing the answer (paragraphs / rich text).
 */
export default function parse(element, { document }) {
  // Each accordion item is one row (title + content). Fall back across
  // possible container variations.
  const items = element.querySelectorAll('.cmp-accordion__item, [class*="accordion__item"]');

  const cells = [];

  items.forEach((item) => {
    // Title: prefer the dedicated title span, then the button, then the header.
    const titleEl = item.querySelector('.cmp-accordion__title, .cmp-accordion__button, .cmp-accordion__header');
    // Content: everything inside the panel (paragraphs, headings, media).
    const panel = item.querySelector('.cmp-accordion__panel, [class*="accordion__panel"]');

    // Skip items with no usable title or content.
    if (!titleEl && !panel) return;

    // Build the title cell as plain text so the label stays a simple heading.
    const titleCell = document.createElement('p');
    titleCell.textContent = titleEl ? titleEl.textContent.trim() : '';

    // Build the content cell from the panel's meaningful content nodes.
    const contentCell = [];
    if (panel) {
      // Prefer the actual text/rich-text blocks; fall back to the whole panel.
      const contentNodes = panel.querySelectorAll(
        '.cmp-text > *, .cmp-text',
      );
      if (contentNodes.length) {
        contentNodes.forEach((node) => {
          // Skip empty nodes (e.g. <h3>&nbsp;</h3>) that add markdown noise.
          const isEmpty = !node.textContent.replace(/ /g, ' ').trim()
            && !node.querySelector('img, a, picture, video, iframe');
          if (isEmpty) return;
          // Avoid pushing a container and its own children twice.
          if (!node.classList || !node.classList.contains('cmp-text')) {
            contentCell.push(node);
          } else if (!panel.querySelector('.cmp-text > *')) {
            contentCell.push(node);
          }
        });
      }
      // Ultimate fallback: move the panel's child nodes directly.
      if (!contentCell.length) {
        contentCell.push(...panel.childNodes);
      }
    }

    cells.push([titleCell, contentCell.length ? contentCell : '']);
  });

  // Empty-block guard: if no accordion items were found, unwrap gracefully.
  if (!cells.length) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'accordion', cells });
  element.replaceWith(block);
}
