/* eslint-disable */
/* global WebImporter */
/**
 * Parser for variant: Columns (author-bio)
 * Base block: columns (blocks/columns/ — decorated by the .author-bio variant)
 * Source URL: https://wknd.site/us/en/magazine/arctic-surfing.html
 * Source selector: main.cmp-layout-container--fixed div[class*="cmp-experiencefragment--"]
 * Generated: 2026-08-05
 *
 * Structure (from library-description.txt): Columns block — first row is the
 * block name, subsequent rows split content into side-by-side columns.
 * This variant renders an author-bio card as a single 2-column content row:
 *   Row 1: block name ("Columns (author-bio)").
 *   Row 2:
 *     cell 1 = portrait image (author photo),
 *     cell 2 = text (author name as heading + role/occupations + social links).
 *
 * Source is an AEM byline experience fragment (cmp-byline):
 *   - portrait: `.cmp-byline__image img`
 *   - name:     `.cmp-byline__name` (h2)
 *   - role:     `.cmp-byline__occupations` (p, e.g. "Skater, Writer")
 *   - social:   `.cmp-buildingblock--btn-list .cmp-button` anchors (Facebook, Twitter, Instagram)
 */
export default function parse(element, { document }) {
  // Image cell: the portrait/byline image (mandatory for the card layout).
  const image = element.querySelector(
    '.cmp-byline__image img, .cmp-byline img, .cmp-image img, img',
  );

  // Text cell contents.
  const textCell = [];

  // Author name → heading.
  const nameEl = element.querySelector('.cmp-byline__name, h1, h2, h3');
  const nameText = nameEl ? nameEl.textContent.trim() : '';
  if (nameText) {
    const h2 = document.createElement('h2');
    h2.textContent = nameText;
    textCell.push(h2);
  }

  // Role / occupations (e.g. "Skater, Writer"). The article byline uses
  // `.cmp-byline__occupations`; the about-us contributor XF uses an <h5>
  // (`.cmp-title__text` inside an h5) below the name <h3>.
  let roleEl = element.querySelector('.cmp-byline__occupations, .cmp-byline p');
  if (!roleEl) {
    const h5 = element.querySelector('h5');
    roleEl = h5 && h5 !== nameEl ? h5 : null;
  }
  const roleText = roleEl ? roleEl.textContent.trim() : '';
  if (roleText) {
    const p = document.createElement('p');
    p.textContent = roleText;
    textCell.push(p);
  }

  // Social links: rebuild each as a clean labelled anchor. The source buttons
  // carry the network label in `.cmp-button__text`; the visible label is also a
  // reasonable fallback from the icon class.
  const socialButtons = Array.from(
    element.querySelectorAll('.cmp-buildingblock--btn-list a.cmp-button, .cmp-button'),
  );
  socialButtons.forEach((btn) => {
    const href = btn.getAttribute('href');
    if (!href) return;
    const labelEl = btn.querySelector('.cmp-button__text');
    const label = labelEl ? labelEl.textContent.trim() : btn.textContent.trim();
    if (!label) return;
    const link = document.createElement('a');
    link.setAttribute('href', href);
    link.textContent = label;
    textCell.push(link);
  });

  // Empty-block guard: if there's no meaningful bio content, unwrap the element.
  if (!image && textCell.length === 0) {
    element.replaceWith(...element.childNodes);
    return;
  }

  // Single 2-column content row: image | text. Pad empties to keep width uniform.
  const cells = [[image || '', textCell.length ? textCell : '']];

  const block = WebImporter.Blocks.createBlock(document, { name: 'Columns (author-bio)', cells });
  element.replaceWith(block);
}
