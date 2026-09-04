/* eslint-disable */
/* global WebImporter */
/**
 * Parser for variant: adventure-list (article-list block, adventures listing).
 * Base block: article-list (custom project block; blocks/article-list/).
 * Source URL:
 *   - https://wknd.site/us/en/adventures.html (static card grid -> dynamic list)
 * Source selector:
 *   - div.tabs.panelcontainer (the tabbed adventure card grid)
 * Generated: 2026-09-03
 *
 * Unlike the magazine `article-list` parser, this variant is PURELY
 * query-index driven: it emits NO pinned article links. Every card on the
 * adventures listing comes from the live adventure query-index at runtime, so
 * the grid updates on its own when adventure pages are added/removed — nothing
 * is copied out of the source page content.
 *
 * Emitted table:
 *   Row 1: block name (article-list)
 *   Row 2: source  | /<loc>/<lang>/adventures/   (folder the block filters to)
 *   Row 3: index   | /adventure-index.json       (dedicated adventures index)
 *   Row 4: filters | Label=slugA,slugB;Label2=…  (category tab membership)
 *   (no limit row -> the block shows every matching adventure)
 *
 * The `filters` row carries the editorial category membership read from the
 * source tab panels (Climbing/Cycling/Skiing/Surfing/Travel). This grouping is
 * NOT present in the query index, so it is captured here as plain text (no
 * links, so the block does not treat it as pinned articles). The block renders
 * these as filter tabs; the cards themselves remain index-driven.
 */

/** Slug (last path segment, no .html) for an adventure href. */
function slugFromHref(href) {
  if (!href) return '';
  return href
    .replace(/[?#].*$/, '')
    .replace(/\.html$/, '')
    .replace(/\/$/, '')
    .split('/')
    .filter(Boolean)
    .pop() || '';
}

/**
 * Read the category tabs from the source tabs container and return a
 * "Label=slug,slug;Label2=…" string. Skips the "All" tab (the block adds its
 * own "All"). Returns '' when the structure is not the expected tabbed grid.
 */
function extractFilters(element) {
  const tablist = element.querySelector('[role="tablist"], ol.cmp-tabs__tablist, ol');
  if (!tablist) return '';

  // Map each tab (by its id) to its label, in source order.
  const tabDefs = [...tablist.querySelectorAll('[role="tab"], li, a')]
    .map((tab) => {
      const id = tab.id || tab.getAttribute('aria-controls') || '';
      const label = (tab.textContent || '').trim();
      return label ? { id, label } : null;
    })
    .filter(Boolean);

  const panels = [...element.querySelectorAll('[role="tabpanel"], .cmp-tabs__tabpanel')];
  const parts = [];

  tabDefs.forEach(({ id, label }) => {
    if (/^all$/i.test(label)) return; // block supplies its own "All"
    // Find the panel this tab controls: by aria-labelledby match, else by order.
    let panel = panels.find((p) => {
      const lbl = p.getAttribute('aria-labelledby') || '';
      return id && (lbl === id || lbl === `${id}-tab` || `${lbl}-tab` === id);
    });
    if (!panel) panel = panels[tabDefs.indexOf(tabDefs.find((t) => t.label === label))];
    if (!panel) return;

    const slugs = [];
    panel.querySelectorAll('a[href*="/adventures/"]').forEach((a) => {
      const slug = slugFromHref(a.getAttribute('href'));
      if (slug && slug !== 'adventures' && !slugs.includes(slug)) slugs.push(slug);
    });
    if (slugs.length) parts.push(`${label}=${slugs.join(',')}`);
  });

  return parts.join(';');
}

export default function parse(element, { document, params }) {
  const INDEX = '/adventure-index.json';

  // Derive the adventures folder from the page locale being imported
  // (e.g. /us/en/adventures/). Fall back to /us/en if the path is unusual.
  const pagePath = params && params.originalURL
    ? new URL(params.originalURL).pathname
    : '/us/en/adventures.html';
  const loc = pagePath.match(/^\/([^/]+)\/([^/]+)/);
  const sourceFolder = loc
    ? `/${loc[1]}/${loc[2]}/adventures/`
    : '/us/en/adventures/';

  // Config rows only — no pinned links. readBlockConfig in the block consumes
  // these; the live adventure-index.json fills the entire list.
  const cells = [
    ['source', sourceFolder],
    ['index', INDEX],
  ];

  // Category filter tabs, read from the source tab structure (if present).
  const filters = extractFilters(element);
  if (filters) cells.push(['filters', filters]);

  const block = WebImporter.Blocks.createBlock(document, { name: 'article-list', cells });
  element.replaceWith(block);
}
