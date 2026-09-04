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
 * Parse the optional `filters` config value into an ordered list of category
 * definitions. The adventures listing authors this so the tab grid can be
 * filtered by category; other article-list uses omit it. Card data always comes
 * live from the index — this only supplies the editorial category membership
 * (which is not present in the index), keyed by article slug (last path
 * segment). Format: "Label=slugA,slugB;Label2=slugC" (semicolon-separated
 * categories, each "Label=comma,separated,slugs").
 * @param {string} value
 * @returns {Array<{label: string, slugs: Set<string>}>}
 */
function parseFilters(value) {
  if (!value || typeof value !== 'string') return [];
  return value
    .split(';')
    .map((part) => {
      const eq = part.indexOf('=');
      if (eq < 0) return null;
      const label = part.slice(0, eq).trim();
      const slugs = part
        .slice(eq + 1)
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
      return label && slugs.length ? { label, slugs: new Set(slugs) } : null;
    })
    .filter(Boolean);
}

/** Last path segment (slug) for an index row's path. */
function slugOf(row) {
  return normalizePath(row.path).split('/').filter(Boolean).pop() || '';
}

/**
 * Derive category filters from the live index rows' `category` field. This is
 * the self-updating source of truth: as adventures are published with a
 * `category` meta, they appear under the right tab with no re-import of the
 * listing. `category` may be a comma-separated list (an item can be in several
 * categories). Categories are ordered by first appearance in the (already
 * newest-first) rows. Returns [] when no row carries a category, so the caller
 * can fall back to the authored `filters` config during rollout.
 * @param {Array} rows index rows
 * @returns {Array<{label: string, slugs: Set<string>}>}
 */
function categoriesFromRows(rows) {
  const order = [];
  const byLabel = new Map();
  rows.forEach((row) => {
    const raw = row.category;
    if (!raw || typeof raw !== 'string') return;
    raw.split(',').map((c) => c.trim()).filter(Boolean).forEach((label) => {
      if (!byLabel.has(label)) {
        byLabel.set(label, new Set());
        order.push(label);
      }
      byLabel.get(label).add(slugOf(row));
    });
  });
  return order.map((label) => ({ label, slugs: byLabel.get(label) }));
}

/**
 * Show only the cards whose slug is in `slugs`; pass null to show all.
 * @param {HTMLElement} ul the card list
 * @param {Set<string>|null} slugs
 */
function applyFilter(ul, slugs) {
  [...ul.children].forEach((li) => {
    li.hidden = !!slugs && !slugs.has(li.dataset.slug);
  });
}

/**
 * Build an accessible tablist that filters the card list by category.
 * @param {Array<{label: string, slugs: Set<string>}>} filters
 * @param {HTMLElement} ul the card list to filter
 * @returns {HTMLElement} the tablist nav
 */
function buildFilterTabs(filters, ul) {
  const nav = document.createElement('div');
  nav.className = 'article-list-filters';
  nav.setAttribute('role', 'tablist');
  nav.setAttribute('aria-label', 'Filter by category');

  // "All" first, then each authored category, in source order.
  const tabs = [{ label: 'All', slugs: null }, ...filters];
  const buttons = tabs.map((tab, i) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'article-list-filter';
    btn.setAttribute('role', 'tab');
    btn.textContent = tab.label;
    const selected = i === 0;
    btn.setAttribute('aria-selected', String(selected));
    btn.setAttribute('tabindex', selected ? '0' : '-1');
    if (selected) btn.classList.add('is-selected');

    const select = () => {
      buttons.forEach((b) => {
        b.setAttribute('aria-selected', 'false');
        b.setAttribute('tabindex', '-1');
        b.classList.remove('is-selected');
      });
      btn.setAttribute('aria-selected', 'true');
      btn.setAttribute('tabindex', '0');
      btn.classList.add('is-selected');
      applyFilter(ul, tab.slugs);
    };
    btn.addEventListener('click', select);
    return btn;
  });

  // Roving-tabindex arrow-key navigation between tabs.
  nav.addEventListener('keydown', (e) => {
    const current = buttons.findIndex((b) => b.getAttribute('tabindex') === '0');
    let next = -1;
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') next = (current + 1) % buttons.length;
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') next = (current - 1 + buttons.length) % buttons.length;
    else if (e.key === 'Home') next = 0;
    else if (e.key === 'End') next = buttons.length - 1;
    if (next < 0) return;
    e.preventDefault();
    buttons[next].focus();
    buttons[next].click();
  });

  buttons.forEach((btn) => nav.append(btn));
  return nav;
}

const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/**
 * Format an index date into the WKND long form, e.g. "Thursday, 9 Jul 2020".
 * Accepts an ISO date ("2019-08-13") or an epoch-seconds string. Returns '' when
 * the value is missing or unparseable. Built from fixed UTC parts (not
 * toLocaleDateString) so the output matches the source exactly ("Sep", not
 * locale variants like "Sept") and the day never shifts across time zones.
 * @param {string|number} value publisheddate or date field
 * @returns {string}
 */
function formatArticleDate(value) {
  if (!value) return '';
  let ms;
  const num = Number(value);
  if (!Number.isNaN(num) && num > 0) {
    ms = num * 1000; // index stores epoch seconds
  } else {
    ms = Date.parse(`${value}T00:00:00Z`);
    if (Number.isNaN(ms)) ms = Date.parse(value);
  }
  if (Number.isNaN(ms)) return '';
  const d = new Date(ms);
  return `${WEEKDAYS[d.getUTCDay()]}, ${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

/**
 * Build a single article card element from an index row.
 * @param {object} row index row (path, title, image, description, publisheddate)
 * @param {object} [opts] rendering options
 * @param {boolean} [opts.showDate] append the publish date under the title
 * @param {boolean} [opts.compact] text-only card (no image/description) — used
 *   by the article-detail "Share this story" rail, which the source renders as
 *   a plain title + date list.
 * @returns {HTMLElement}
 */
function renderCard(row, opts = {}) {
  const li = document.createElement('li');
  const href = normalizePath(row.path);
  // Last path segment — used as the key for category filtering.
  li.dataset.slug = href.split('/').filter(Boolean).pop() || '';

  if (row.image && !opts.compact) {
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

  // Related-stories cards show the publish date beneath the title (matches
  // source). Uses <time> for semantics; only rendered when a date is available.
  if (opts.showDate) {
    const label = formatArticleDate(row.publisheddate || row.date);
    if (label) {
      const time = document.createElement('time');
      time.className = 'article-list-card-date';
      const iso = row.publisheddate || row.date;
      if (/^\d{4}-\d{2}-\d{2}/.test(iso)) time.setAttribute('datetime', iso);
      time.textContent = label;
      body.append(time);
    }
  }

  if (row.description && !opts.compact) {
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
  //    limit  = max number of cards to show. Omit the row (or set "all"/0) to
  //             show every match — the "All Articles" listing uses this so it
  //             grows automatically as articles are added. A positive number
  //             caps the list (e.g. the homepage "Recent Articles" uses 4).
  const config = readBlockConfig(block);
  const source = normalizePath(config.source || DEFAULT_SOURCE);
  const index = config.index || DEFAULT_INDEX;
  const rawLimit = (config.limit || '').toString().trim().toLowerCase();
  const parsedLimit = parseInt(rawLimit, 10);
  let limit;
  if (!rawLimit || rawLimit === 'all' || rawLimit === 'none' || parsedLimit === 0) {
    // No limit row, or an explicit "show all" -> render every matching article.
    limit = Infinity;
  } else if (!Number.isNaN(parsedLimit) && parsedLimit > 0) {
    limit = parsedLimit;
  } else {
    limit = DEFAULT_LIMIT;
  }

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

  // 5. Render. On article-detail pages this block is the "related stories"
  //    sidebar, where the source shows a publish date under each title; on the
  //    homepage / section-landing "Recent Articles" listing it does not. The
  //    author-bio variant only exists on article-detail pages, so use it as the
  //    signal (also settable explicitly via a "dates" config row).
  const isArticleDetail = !!document.querySelector('main .columns.author-bio, main .article-detail');
  const showDate = (config.dates || '').toLowerCase() === 'true' || isArticleDetail;
  if (showDate) block.classList.add('article-list-with-dates');

  // In the article-detail right rail ("Share this story"), the source renders
  // each related story as a plain title + date — no thumbnail, no description.
  // decorateArticleLayout() has already moved this block into .article-rail by
  // the time it decorates, so detect that to switch to the compact layout.
  const compact = !!block.closest('.article-rail');
  if (compact) block.classList.add('article-list-compact');

  const ul = document.createElement('ul');
  selected.slice(0, limit).forEach((row) => ul.append(renderCard(row, { showDate, compact })));

  // 6. Optional category filter tabs (adventures listing). Categories come
  //    primarily from the live index `category` field (self-updating as
  //    adventures are published); the authored `filters` config is a fallback
  //    used only before the index carries category data (rollout). The cards
  //    themselves are always index-driven. Only rendered when categories exist
  //    and there are cards, so other article-list uses are unaffected.
  let filters = [];
  if (!compact) {
    const indexCategories = categoriesFromRows(selected);
    filters = indexCategories.length ? indexCategories : parseFilters(config.filters);
  }
  if (filters.length && selected.length) {
    block.classList.add('article-list-filtered');
    block.replaceChildren(buildFilterTabs(filters, ul), ul);
  } else {
    block.replaceChildren(ul);
  }

  // Nothing to show (e.g. index not yet published and no pinned links).
  if (!selected.length) {
    block.classList.add('article-list-empty');
  }
}
