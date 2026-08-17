import {
  loadHeader,
  loadFooter,
  decorateIcons,
  decorateSections,
  decorateBlock,
  decorateBlocks,
  decorateTemplateAndTheme,
  waitForFirstImage,
  loadBlock,
  loadSection,
  loadSections,
  loadCSS,
  buildBlock,
} from './aem.js';

if (window.trustedTypes && window.trustedTypes.createPolicy) {
  const innerTT = window.trustedTypes.createPolicy('tt-inner', {
    createHTML: (s) => s, // avoid stack overflow
  });

  window.trustedTypes.createPolicy('default', {
    createHTML: (input, type, sink) => {
      let processedInput = input;
      if (/srcdoc\s*=/i.test(processedInput)) {
        const doc = new DOMParser().parseFromString(innerTT.createHTML(processedInput), 'text/html');
        doc.querySelectorAll('iframe[srcdoc]').forEach((el) => el.removeAttribute('srcdoc'));
        processedInput = doc.body.innerHTML;
      }
      if (sink.includes('createContextualFragment') || sink.includes('Document write')) {
        const doc = new DOMParser().parseFromString(innerTT.createHTML(processedInput), 'text/html');
        doc.querySelectorAll('script').forEach((el) => el.remove());
        processedInput = doc.body.innerHTML;
      }
      return processedInput;
    },
    createScriptURL: (input) => input,
    createScript: (input) => input,
  });
}

/**
 * load fonts.css and set a session storage flag
 */
async function loadFonts() {
  await loadCSS(`${window.hlx.codeBasePath}/styles/fonts.css`);
  try {
    if (!window.location.hostname.includes('localhost')) sessionStorage.setItem('fonts-loaded', 'true');
  } catch (e) {
    // do nothing
  }
}

/**
 * Turns `/widgets/...` links into widget blocks.
 * @param {Element} main The container element
 */
function buildWidgetAutoBlocks(main) {
  const widgetLinks = [...main.querySelectorAll('a[href*="/widgets/"]')];
  widgetLinks.forEach((link) => {
    if (link.closest('.widget')) return;
    const newLink = link.cloneNode(true);
    const widgetBlock = buildBlock('widget', { elems: [newLink] });
    const p = link.closest('p');
    if (
      p
      && p.querySelectorAll('a').length === 1
      && p.querySelector('a') === link
      && p.textContent.trim() === link.textContent.trim()
    ) {
      p.replaceWith(widgetBlock);
    } else {
      link.replaceWith(widgetBlock);
    }
  });
}

/**
 * Builds a tabs block from the adventure-listing filter pattern: an ordered list
 * of category labels (All, Climbing, …) immediately followed by a `.cards` grid
 * (the "All" panel) and one `<ul>` per remaining category. The source renders
 * these as filter tabs; the import leaves them as flat default content, so we
 * group them into a real tabs block that tabs.js then decorates.
 * @param {Element} main The container element
 */
function buildAdventureTabs(main) {
  main.querySelectorAll('ol').forEach((ol) => {
    const cards = ol.nextElementSibling;
    if (!cards || !cards.classList || !cards.classList.contains('cards')) return;

    const labels = [...ol.querySelectorAll(':scope > li')]
      .map((li) => li.textContent.trim())
      .filter(Boolean);
    if (labels.length < 2) return;

    // Panels, in label order: "All" = the cards grid, then the category <ul>s.
    const panels = [cards];
    let sib = cards.nextElementSibling;
    while (sib && sib.tagName === 'UL') {
      const next = sib.nextElementSibling;
      panels.push(sib);
      sib = next;
    }
    // Only build when every label has a matching panel (otherwise leave as-is).
    if (panels.length !== labels.length) return;

    const rows = labels.map((label, i) => [label, { elems: [panels[i]] }]);
    const tabsBlock = buildBlock('tabs', rows);
    tabsBlock.classList.add('tabs-cards');
    ol.replaceWith(tabsBlock);

    // The "All" panel wraps a `.cards` block. decorateBlocks only reaches
    // top-level blocks (div.section > div > div), so decorate + load this
    // nested one explicitly, otherwise its cards never build into a grid.
    tabsBlock.querySelectorAll('.cards').forEach((nested) => {
      decorateBlock(nested);
      loadBlock(nested);
    });
  });
}

/**
 * Builds all synthetic blocks in a container element.
 * @param {Element} main The container element
 */
function buildAutoBlocks(main) {
  try {
    buildAdventureTabs(main);
    // auto load `*/fragments/*` references
    const fragments = [...main.querySelectorAll('a[href*="/fragments/"]')].filter((f) => !f.closest('.fragment'));
    if (fragments.length > 0) {
      // eslint-disable-next-line import/no-cycle
      import('../blocks/fragment/fragment.js').then(({ loadFragment }) => {
        fragments.forEach(async (fragment) => {
          try {
            const { pathname } = new URL(fragment.href);
            const frag = await loadFragment(pathname);
            fragment.parentElement.replaceWith(...frag.children);
          } catch (error) {
            // eslint-disable-next-line no-console
            console.error('Fragment loading failed', error);
          }
        });
      });
    }
    buildWidgetAutoBlocks(main);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Auto Blocking failed', error);
  }
}

/**
 * Decorates formatted links to style them as buttons.
 * @param {HTMLElement} main The main container element
 */
function decorateButtons(main) {
  main.querySelectorAll('p a[href]').forEach((a) => {
    a.title = a.title || a.textContent;
    const p = a.closest('p');
    const text = a.textContent.trim();

    // quick structural checks
    if (a.querySelector('img') || p.textContent.trim() !== text) return;

    // skip URL display links
    try {
      if (new URL(a.href).href === new URL(text, window.location).href) return;
    } catch { /* continue */ }

    // require authored formatting for buttonization
    const strong = a.closest('strong');
    const em = a.closest('em');
    if (!strong && !em) {
      // A standalone link that is the whole paragraph inside default content
      // (e.g. "All Articles", "All Trips") is a section CTA — the source
      // renders these as solid WKND buttons. Hero/teaser CTAs live inside
      // blocks, so this only catches block-less default content.
      if (p.closest('.default-content-wrapper')) {
        p.classList.add('button-wrapper', 'cta-wrapper');
        a.className = 'button cta';
      }
      return;
    }

    p.className = 'button-wrapper';
    a.className = 'button';
    if (strong && em) { // high-impact call-to-action
      a.classList.add('accent');
      const outer = strong.contains(em) ? strong : em;
      outer.replaceWith(a);
    } else if (strong) {
      a.classList.add('primary');
      strong.replaceWith(a);
    } else {
      a.classList.add('secondary');
      em.replaceWith(a);
    }
  });
}

/**
 * Tags the article breadcrumb list so it can be styled to match the source
 * (uppercase items, yellow "▶" separators, dark links). The WKND import renders
 * the breadcrumb as a plain <ol> — links to ancestor pages followed by a
 * text-only item for the current page — placed before the article <h1>. We only
 * mark that specific shape so ordinary ordered lists in body copy are untouched.
 * @param {HTMLElement} main The main container element
 */
function decorateBreadcrumb(main) {
  main.querySelectorAll('ol').forEach((ol) => {
    if (ol.closest('.block')) return; // never touch lists inside blocks
    const items = [...ol.children].filter((li) => li.tagName === 'LI');
    if (items.length < 2) return;

    // Breadcrumb shape: every item is a lone link or plain text, at least one
    // is a link, and the last item is the current page (text, no link).
    const isCrumb = items.every((li) => {
      const links = li.querySelectorAll('a');
      return links.length <= 1 && (links.length === 1 || !!li.textContent.trim());
    });
    const hasLink = items.some((li) => li.querySelector('a'));
    const lastIsText = !items[items.length - 1].querySelector('a');

    // Only a leading breadcrumb: no heading appears among the list's preceding
    // siblings (it sits above the article title, not inside body copy).
    let sib = ol.previousElementSibling;
    let headingBefore = false;
    while (sib) {
      if (/^H[1-6]$/.test(sib.tagName)) { headingBefore = true; break; }
      sib = sib.previousElementSibling;
    }

    if (isCrumb && hasLink && lastIsText && !headingBefore) {
      ol.classList.add('breadcrumb');
    }
  });
}

/**
 * Removes the redundant article title the WKND import duplicates. Source article
 * pages show the title once (as the <h1>) followed by the byline; our import adds
 * a second heading (an <h3>) that repeats the title just below the byline. Drop
 * that <h3> when it echoes the <h1> (whitespace/case-insensitive) and sits near
 * the top of the article, so the page matches the source's single title.
 * @param {HTMLElement} main The main container element
 */
function removeDuplicateTitle(main) {
  const h1 = main.querySelector('h1');
  if (!h1) return;
  const norm = (s) => s.replace(/\s+/g, '').toLowerCase();
  const titleKey = norm(h1.textContent);
  if (!titleKey) return;

  // Only look at early headings (title + byline + duplicate live together at the
  // top); this avoids matching a genuine body-section heading later in the copy.
  const headings = [...main.querySelectorAll('h2, h3')].slice(0, 3);
  headings.forEach((h) => {
    if (h.tagName === 'H3' && norm(h.textContent) === titleKey) {
      h.remove();
    }
  });
}

/**
 * Reflows the article-detail page into the source's two-column layout: the
 * article prose (and author bio) on the left, and a right rail holding "SHARE
 * THIS STORY" + the related-stories list. The import produces these as stacked
 * sections; we group them into an .article-layout wrapper that CSS lays out as
 * a grid (single column on mobile). Runs only on article-detail pages and only
 * when the expected pieces are present, so other templates are untouched.
 * @param {HTMLElement} main The main container element
 */
function decorateArticleLayout(main) {
  if (!document.body.classList.contains('article-detail')) return;

  // The hero section carries the prose (+ author bio); the related list is its
  // own section. Identify each by the containers the pipeline adds.
  // The author bio is a Columns (author-bio) variant, so its section carries
  // the columns-container class and its block wrapper is .columns-wrapper. Fall
  // back to the legacy columns-author-bio container/wrapper so this works before
  // and after the DA content is migrated to the variant.
  const heroSection = main.querySelector('.section.columns-container')
    || main.querySelector('.section.columns-author-bio-container')
    || main.querySelector('.section:has(h1)');
  const relatedSection = main.querySelector('.section.article-list-container');
  if (!heroSection || !relatedSection) return;

  // The prose lives in a default-content-wrapper (leading image, breadcrumb,
  // H1, byline, body). The "SHARE THIS STORY" heading is a separate trailing
  // wrapper; the author bio is its own block wrapper.
  const wrappers = [...heroSection.querySelectorAll(':scope > .default-content-wrapper')];
  const proseWrapper = wrappers.find((w) => w.querySelector('h1'));
  const shareWrapper = wrappers.find((w) => w !== proseWrapper && w.querySelector('h5'));
  const authorWrapper = heroSection.querySelector(':scope > .columns-wrapper.author-bio')
    || heroSection.querySelector(':scope > .columns-author-bio-wrapper')
    || heroSection.querySelector(':scope > .columns-wrapper');
  if (!proseWrapper) return;

  // Full-width header (spans both columns, matches source): the leading hero
  // image and breadcrumb sit above the two-column split. Move everything that
  // precedes the H1 out of the prose wrapper and into the header.
  const header = document.createElement('div');
  header.className = 'article-header';
  const h1 = proseWrapper.querySelector('h1');
  while (proseWrapper.firstElementChild && proseWrapper.firstElementChild !== h1) {
    header.append(proseWrapper.firstElementChild);
  }

  const layout = document.createElement('div');
  layout.className = 'article-layout';
  const left = document.createElement('div');
  left.className = 'article-main';
  const rail = document.createElement('aside');
  rail.className = 'article-rail';
  layout.append(left, rail);

  // Left column: the prose (now starting at the H1) + the author bio.
  left.append(proseWrapper);
  if (authorWrapper) left.append(authorWrapper);
  // Right rail: share heading, then the related-stories list.
  if (shareWrapper) rail.append(shareWrapper);
  rail.append(...relatedSection.children);

  // Mount the full-width header (when present) above the two-column grid, then
  // drop the now-empty related section.
  if (header.children.length) heroSection.append(header, layout);
  else heroSection.append(layout);
  relatedSection.remove();
}

/**
 * Decorates the main element.
 * @param {Element} main The main element
 */
// eslint-disable-next-line import/prefer-default-export
export function decorateMain(main) {
  decorateIcons(main);
  buildAutoBlocks(main);
  decorateSections(main);
  decorateBlocks(main);
  decorateButtons(main);
  decorateBreadcrumb(main);
  removeDuplicateTitle(main);
  decorateArticleLayout(main);
}

/**
 * Loads everything needed to get to LCP.
 * @param {Element} doc The container element
 */
async function loadEager(doc) {
  document.documentElement.lang = 'en';
  decorateTemplateAndTheme();
  const main = doc.querySelector('main');
  if (main) {
    decorateMain(main);
    document.body.classList.add('appear');

    // Prioritize the LCP image. Its URL is already in the initial HTML, so the
    // only thing missing is a strong signal: mark the first section's first
    // image eager (never lazy) and fetchpriority="high" *before* loadSection
    // requests it, so the browser puts it at the front of the network queue.
    // Only this single candidate is elevated; every other image stays lazy so
    // the critical path isn't flooded.
    const lcpImg = main.querySelector('.section img');
    if (lcpImg) {
      lcpImg.setAttribute('loading', 'eager');
      lcpImg.setAttribute('fetchpriority', 'high');
    }

    await loadSection(main.querySelector('.section'), waitForFirstImage);
  }

  try {
    /* if desktop (proxy for fast connection) or fonts already loaded, load fonts.css */
    if (window.innerWidth >= 900 || sessionStorage.getItem('fonts-loaded')) {
      loadFonts();
    }
  } catch (e) {
    // do nothing
  }
}

/**
 * Loads everything that doesn't need to be delayed.
 * @param {Element} doc The container element
 */
async function loadLazy(doc) {
  loadHeader(doc.querySelector('body > header'));

  const main = doc.querySelector('main');
  await loadSections(main);

  const { hash } = window.location;
  const element = hash ? doc.getElementById(hash.substring(1)) : false;
  if (hash && element) element.scrollIntoView();

  loadFooter(doc.querySelector('body > footer'));

  loadCSS(`${window.hlx.codeBasePath}/styles/lazy-styles.css`);
  loadFonts();
}

/**
 * Loads everything that happens a lot later,
 * without impacting the user experience.
 */
function loadDelayed() {
  import('./consent-check.js');
  // load anything that can be postponed to the latest here
}

async function loadPage() {
  await loadEager(document);
  await loadLazy(document);
  loadDelayed();
}

loadPage();
