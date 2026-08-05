import { createOptimizedPicture, readBlockConfig } from '../../scripts/aem.js';

// Folder the articles live in. Rows in the index whose path is under this
// folder are eligible. Authors set this via the "source" row.
const DEFAULT_SOURCE = '/magazine/';
// The query index to read. Authors set this via the "index" row.
const DEFAULT_INDEX = '/query-index.json';
const DEFAULT_LIMIT = 4;

/**
 * Normalize a path for comparison (strip trailing .html and trailing slash).
 * @param {string} path
 * @returns {string}
 */
function normalizePath(path) {
  if (!path) return '';
  try {
    // Accept absolute URLs and bare paths alike.
    const { pathname } = new URL(path, window.location.origin);
    return pathname.replace(/\.html$/, '').replace(/\/$/, '');
  } catch (e) {
    return path.replace(/\.html$/, '').replace(/\/$/, '');
  }
}

/**
 * Whether an index row's path lives inside the source folder (and is not the
 * folder's own landing page).
 * @param {object} row index row
 * @param {string} folder normalized source folder (no trailing slash)
 * @returns {boolean}
 */
function inFolder(row, folder) {
  if (!folder) return true;
  const path = normalizePath(row.path);
  return path.startsWith(`${folder}/`) && path !== folder;
}

/**
 * Fetch the live query-index and return its rows.
 * @param {string} source path to the query-index.json
 * @returns {Promise<Array>} index rows (empty array on failure)
 */
async function fetchIndex(source) {
  try {
    const resp = await fetch(source);
    if (!resp.ok) return [];
    const json = await resp.json();
    return Array.isArray(json.data) ? json.data : [];
  } catch (e) {
    // A missing/unpublished index must not break the page.
    return [];
  }
}

/**
 * Sort index rows newest-first using lastModified, then publisheddate.
 * @param {Array} rows
 * @returns {Array} sorted copy
 */
function sortNewestFirst(rows) {
  const ts = (row) => {
    const lm = Number(row.lastModified);
    if (!Number.isNaN(lm) && lm > 0) return lm;
    const pd = Date.parse(row.publisheddate || '');
    return Number.isNaN(pd) ? 0 : pd / 1000;
  };
  return [...rows].sort((a, b) => ts(b) - ts(a));
}

/**
 * Build a single article card element from an index row.
 * @param {object} row index row (path, title, image, description)
 * @returns {HTMLElement}
 */
function renderCard(row) {
  const li = document.createElement('li');
  const href = normalizePath(row.path);

  if (row.image) {
    const imageLink = document.createElement('a');
    imageLink.href = href;
    imageLink.className = 'article-list-card-image';
    imageLink.setAttribute('aria-label', row.title || '');
    imageLink.append(createOptimizedPicture(row.image, row.title || '', false, [{ width: '750' }]));
    li.append(imageLink);
  }

  const body = document.createElement('div');
  body.className = 'article-list-card-body';

  const titleLink = document.createElement('a');
  titleLink.href = href;
  const h3 = document.createElement('h3');
  h3.textContent = row.title || '';
  titleLink.append(h3);
  body.append(titleLink);

  if (row.description) {
    const p = document.createElement('p');
    p.textContent = row.description;
    body.append(p);
  }

  li.append(body);
  return li;
}

/**
 * loads and decorates the article list
 * @param {Element} block The block element
 */
export default async function decorate(block) {
  // 1. Read author configuration from key/value rows:
  //    source = folder the articles live in (e.g. /us/en/magazine/)
  //    index  = query-index.json to read (e.g. /query-index.json)
  //    limit  = max number of cards to show
  const config = readBlockConfig(block);
  const source = normalizePath(config.source || DEFAULT_SOURCE);
  const index = config.index || DEFAULT_INDEX;
  const limit = parseInt(config.limit, 10) || DEFAULT_LIMIT;

  // 2. Collect any author-pinned article links (rows that contain links).
  //    These are rendered first; the live index fills the remaining slots.
  //    Preserve the authored link text (and any adjacent description) so the
  //    card still reads well when the index has no entry for this path yet.
  const pinned = [...block.querySelectorAll('a[href]')]
    .map((a) => {
      const path = normalizePath(a.getAttribute('href'));
      if (!path) return null;
      const title = a.textContent.trim();
      // A sibling paragraph in the same row, if any, is the description.
      const cell = a.closest('div');
      const descEl = cell && [...cell.querySelectorAll('p')].find((p) => !p.contains(a));
      const description = descEl ? descEl.textContent.trim() : '';
      return { path, title, description };
    })
    .filter(Boolean);

  // 3. Fetch the live index, keep only rows under the source folder, sort
  //    newest-first.
  const allRows = await fetchIndex(index);
  const indexRows = sortNewestFirst(allRows.filter((row) => inFolder(row, source)));
  const byPath = new Map(indexRows.map((row) => [normalizePath(row.path), row]));

  // 4. Compose the final list: pinned first (in author order, using index
  //    metadata where available), then newest live articles, deduped, capped.
  const seen = new Set();
  const selected = [];

  const push = (row) => {
    if (!row) return;
    const key = normalizePath(row.path);
    if (!key || seen.has(key)) return;
    seen.add(key);
    selected.push(row);
  };

  pinned.forEach(({ path, title, description }) => {
    const indexed = byPath.get(path);
    // Prefer live index metadata (image, fresh description); fall back to the
    // authored title/description when the article is not yet in the index.
    if (indexed) {
      push({ ...indexed, title: indexed.title || title });
    } else {
      push({ path, title: title || path.split('/').pop(), description });
    }
  });
  indexRows.forEach((row) => {
    if (selected.length < limit) push(row);
  });

  // 5. Render.
  const ul = document.createElement('ul');
  selected.slice(0, limit).forEach((row) => ul.append(renderCard(row)));

  block.replaceChildren(ul);

  // Nothing to show (e.g. index not yet published and no pinned links).
  if (!selected.length) {
    block.classList.add('article-list-empty');
  }
}
