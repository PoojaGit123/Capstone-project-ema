/* eslint-disable */
/* global WebImporter */
/**
 * Parser for variant: article-list
 * Base block: article-list (custom project block; not in the library catalog)
 * Source URLs:
 *   - https://wknd.site/us/en.html (homepage recent-articles: image-list)
 *   - https://wknd.site/us/en/magazine/*.html (related-stories sidebar: cmp-list)
 * Source selectors (union across templates):
 *   - main.cmp-layout-container--fixed:nth-of-type(1) div.image-list.list
 *   - aside div.list.cmp-list--upnext
 * Generated: 2026-08-05
 *
 * The target `article-list` block (blocks/article-list/) is LIVE query-index
 * driven and author-pinnable:
 *   - It reads `Source` and `Limit` via readBlockConfig (2-column key/value rows).
 *   - It collects author-pinned articles from any `a[href]` in the block; pinned
 *     articles render first, the live index fills/refreshes the remaining slots.
 *
 * Emitted table:
 *   Row 1: block name.
 *   Row 2: source | <magazine folder>
 *   Row 3: index  | /query-index.json
 *   Row 4: limit  | <count of source articles>
 *   Rows 5+: one pinned article link per single-cell row (title text + href).
 *
 * This parser is robust to BOTH source markups:
 *   - Homepage image-list: `.cmp-image-list__item` with
 *     `.cmp-image-list__item-title-link` / `.cmp-image-list__item-title`.
 *   - Related-stories cmp-list: `.cmp-list__item` with
 *     `.cmp-list__item-link` wrapping `.cmp-list__item-title` (+ a date span).
 */
export default function parse(element, { document, params }) {
  const INDEX = '/query-index.json';

  // Collect the source article items from either markup. The two item classes
  // are mutually exclusive (a given source uses one or the other), so a comma
  // selector will not double-count.
  const items = Array.from(
    element.querySelectorAll('.cmp-image-list__item, .cmp-list__item'),
  );

  // Per-item extraction that handles both the image-list and cmp-list shapes.
  const extract = (item) => {
    const titleLink = item.querySelector(
      '.cmp-image-list__item-title-link, .cmp-list__item-link, a[href]',
    );
    if (!titleLink) return null;
    const href = titleLink.getAttribute('href');
    if (!href) return null;

    // Prefer an explicit title span; fall back to the link text. For cmp-list
    // the link also contains a date span, so read the dedicated title span
    // rather than the link's full textContent (which would append the date).
    const titleEl = item.querySelector(
      '.cmp-image-list__item-title, .cmp-list__item-title',
    );
    const titleText = (titleEl ? titleEl.textContent : titleLink.textContent).trim();

    return { href, titleText: titleText || href };
  };

  const articles = items.map(extract).filter(Boolean);

  // Derive the magazine folder from the first article link, relative to the
  // page locale (e.g. /us/en/magazine/). Fall back to the page path's locale.
  const firstHref = articles.length ? articles[0].href : '';
  let sourceFolder = '';
  const m = firstHref.match(/^(.*\/magazine)\//);
  if (m) {
    sourceFolder = `${m[1]}/`;
  } else {
    // Derive locale prefix from the page being imported.
    const pagePath = params && params.originalURL
      ? new URL(params.originalURL).pathname
      : '/us/en.html';
    const loc = pagePath.match(/^\/([^/]+)\/([^/]+)/);
    sourceFolder = loc ? `/${loc[1]}/${loc[2]}/magazine/` : '/magazine/';
  }

  const cells = [];

  // Config rows (2-column key/value) — consumed by readBlockConfig in the block.
  cells.push(['source', sourceFolder]);
  cells.push(['index', INDEX]);
  cells.push(['limit', String(articles.length || 4)]);

  // Pinned article rows — one clean link per single-cell row.
  articles.forEach(({ href, titleText }) => {
    const link = document.createElement('a');
    link.setAttribute('href', href);
    link.textContent = titleText;
    cells.push([link]);
  });

  // Empty-block guard: if no articles were found, keep only the config rows.
  const block = WebImporter.Blocks.createBlock(document, { name: 'article-list', cells });
  element.replaceWith(block);
}
