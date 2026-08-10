/* eslint-disable */
/* global WebImporter */
/**
 * Parser for variant: adventure-details
 * Base block: adventure-details (custom — no library convention; structure derived
 *   from source HTML and the local blocks/adventure-details/adventure-details.js block)
 * Source URL: https://wknd.site/us/en/adventures/bali-surf-camp.html
 * Source selector: div.contentfragment.cmp-contentfragment--elements
 * Generated: 2026-08-05
 *
 * Structure: 2-column table.
 * Row 1: block name. Each subsequent row = one detail key/value pair:
 *   cell 1 = label (dt), cell 2 = value (dd).
 *
 * Source is an AEM content fragment element list: a <dl class="cmp-contentfragment__elements">
 * containing <div class="cmp-contentfragment__element"> wrappers, each holding a
 * <dt class="cmp-contentfragment__element-title"> (label) and a
 * <dd class="cmp-contentfragment__element-value"> (value). Six pairs on this page:
 * Activity, Adventure Type, Trip Length, Group Size, Difficulty, Price.
 */
export default function parse(element, { document }) {
  // Each element wrapper is one detail row. Fall back to querying dt/dd pairs directly
  // if the wrapper class is absent on some pages.
  let elements = Array.from(element.querySelectorAll('.cmp-contentfragment__element'));
  if (elements.length === 0) {
    // Fallback: pair up dt/dd directly under the element list.
    const dts = Array.from(element.querySelectorAll('dt'));
    elements = dts.map((dt) => dt.parentElement).filter(Boolean);
  }

  const cells = [];

  elements.forEach((el) => {
    const labelEl = el.querySelector('.cmp-contentfragment__element-title, dt');
    const valueEl = el.querySelector('.cmp-contentfragment__element-value, dd');

    const label = labelEl ? labelEl.textContent.trim() : '';
    const value = valueEl ? valueEl.textContent.trim() : '';

    // Skip rows that have neither a label nor a value.
    if (!label && !value) return;

    // 2-column row: label cell + value cell.
    cells.push([label, value]);
  });

  // Empty-block guard: no detail pairs found — unwrap rather than emit an empty block.
  if (cells.length === 0) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'adventure-details', cells });
  element.replaceWith(block);
}
