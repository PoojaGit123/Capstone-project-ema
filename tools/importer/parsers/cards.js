/* eslint-disable */
/* global WebImporter */
/**
 * Parser for variant: cards
 * Base block: cards
 * Source URL: https://wknd.site/us/en.html
 * Source selector: main.cmp-layout-container--fixed:nth-of-type(2) div.image-list.list
 * Generated: 2026-08-05
 *
 * Structure (from library-description.txt): 2 columns, multiple rows.
 *   Row 1: block name.
 *   Each subsequent row = one card:
 *     cell 1 = image (mandatory),
 *     cell 2 = text content (title link + description).
 *
 * Source is an AEM image-list of adventure cards. Each `.cmp-image-list__item`
 * has an image, a title link (`.cmp-image-list__item-title-link`), and a
 * description (`.cmp-image-list__item-description`).
 */
export default function parse(element, { document }) {
  const items = Array.from(element.querySelectorAll('.cmp-image-list__item'));

  const cells = [];

  items.forEach((item) => {
    // Image cell (mandatory).
    const image = item.querySelector('.cmp-image-list__item-image img, .cmp-image img, img');

    // Text cell: title link + description.
    const titleLink = item.querySelector('.cmp-image-list__item-title-link, a[href]');
    const description = item.querySelector('.cmp-image-list__item-description, [class*="description"]');

    const bodyCell = [];

    if (titleLink) {
      // Rebuild the title as a heading-wrapped link so the card renders a
      // linked title rather than a bare span inside an anchor.
      const href = titleLink.getAttribute('href');
      const titleText = (
        item.querySelector('.cmp-image-list__item-title') || titleLink
      ).textContent.trim();
      const h3 = document.createElement('h3');
      if (href) {
        const link = document.createElement('a');
        link.setAttribute('href', href);
        link.textContent = titleText;
        h3.append(link);
      } else {
        h3.textContent = titleText;
      }
      bodyCell.push(h3);
    }

    if (description) bodyCell.push(description);

    // Skip empty cards.
    if (!image && bodyCell.length === 0) return;

    // 2-column row: image cell + text cell. Pad to keep a uniform width.
    cells.push([image || '', bodyCell.length ? bodyCell : '']);
  });

  // Empty-block guard.
  if (cells.length === 0) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'cards', cells });
  element.replaceWith(block);
}
