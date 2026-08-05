/**
 * Hero / Teaser block.
 *
 * Authored structure (2 rows):
 *   row 1: image cell  -> <picture>
 *   row 2: content cell -> [optional eyebrow <p>], <h2>, <p> description, <p><a> CTA
 *
 * Two variants share this block:
 *   - "featured": has a leading eyebrow paragraph (e.g. "Featured Article").
 *     Rendered as a 2-column layout: image beside a light-grey content panel.
 *   - "adventure": no eyebrow. Rendered full-bleed: image on top, text below.
 *
 * @param {Element} block The hero block element
 */
export default async function decorate(block) {
  const rows = [...block.children];

  // Identify the image row and the content row.
  const imageRow = rows.find((row) => row.querySelector('picture'));
  const contentRow = rows.find((row) => row !== imageRow);

  if (imageRow) imageRow.classList.add('hero-image');
  if (!contentRow) return;

  contentRow.classList.add('hero-content');

  const contentCell = contentRow.firstElementChild || contentRow;
  const heading = contentCell.querySelector('h1, h2, h3, h4, h5, h6');
  const firstEl = contentCell.firstElementChild;

  // An eyebrow is a paragraph that appears before the heading and is not a
  // button/CTA wrapper.
  const headingIsAfterFirst = heading
    && firstEl
    && [...contentCell.children].indexOf(firstEl) < [...contentCell.children].indexOf(heading);
  const hasEyebrow = firstEl
    && firstEl.tagName === 'P'
    && headingIsAfterFirst
    && !firstEl.querySelector('a');

  if (hasEyebrow) {
    firstEl.classList.add('eyebrow');
    block.classList.add('hero-featured');
  } else {
    block.classList.add('hero-adventure');
  }
}
