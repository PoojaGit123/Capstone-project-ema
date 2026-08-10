/* eslint-disable */
/* global WebImporter */
/**
 * Parser for variant: tabs
 * Base block: tabs
 * Source URL: https://wknd.site/us/en/adventures/bali-surf-camp.html
 * Source selector: div.tabs.panelcontainer
 * Generated: 2026-08-05
 *
 * Structure (from library-description.txt): 2-column table.
 * Row 1: block name. Each subsequent row = one tab:
 *   cell 1 = tab label (mandatory), cell 2 = tab panel content (mandatory).
 *
 * Source is an AEM cmp-tabs component:
 *   - <ol class="cmp-tabs__tablist"> with <li class="cmp-tabs__tab"> tab labels
 *     ("Overview", "Itinerary", "What to Bring"), in display order.
 *   - <div class="cmp-tabs__tabpanel"> panels, one per tab, in the same order.
 * Tab labels are paired with panels by index.
 *
 * The local blocks/tabs/tabs.js expects each block row's first cell to be the tab
 * button label and the row's panel content to follow.
 */
export default function parse(element, { document }) {
  // Tab labels, in order.
  const tabLabels = Array.from(element.querySelectorAll('.cmp-tabs__tablist .cmp-tabs__tab, .cmp-tabs__tablist > li'));
  // Tab panels, in order (mutually exclusive with the tablist above).
  const tabPanels = Array.from(element.querySelectorAll('.cmp-tabs__tabpanel'));

  const cells = [];

  tabPanels.forEach((panel, i) => {
    const labelEl = tabLabels[i];
    const label = labelEl ? labelEl.textContent.trim() : '';

    // Panel content cell: the article's element list holds the actual content
    // (paragraphs, images, lists). Fall back to the whole panel if not present.
    const contentSource = panel.querySelector('.cmp-contentfragment__elements')
      || panel.querySelector('.cmp-contentfragment')
      || panel;

    // Collect meaningful child nodes (paragraphs, images, lists, headings).
    // Empty AEM grid placeholder divs contribute nothing to markdown.
    const contentCell = Array.from(contentSource.childNodes).filter((node) => {
      if (node.nodeType === 3) return node.textContent.trim().length > 0; // text
      return node.nodeType === 1; // element
    });

    // Skip a tab that has neither a label nor content.
    if (!label && contentCell.length === 0) return;

    // 2-column row: label cell + content cell. Keep width uniform if content is empty.
    cells.push([label, contentCell.length ? contentCell : '']);
  });

  // Empty-block guard: no tabs found — unwrap rather than emit an empty block.
  if (cells.length === 0) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'tabs', cells });
  element.replaceWith(block);
}
