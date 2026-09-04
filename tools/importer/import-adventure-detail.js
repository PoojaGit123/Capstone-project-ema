/* eslint-disable */
/* global WebImporter */

// PARSER IMPORTS
import carouselHeroParser from './parsers/carousel-hero.js';
import adventureDetailsParser from './parsers/adventure-details.js';
import tabsParser from './parsers/tabs.js';

// TRANSFORMER IMPORTS
import cleanupTransformer from './transformers/wknd-cleanup.js';
import sectionsTransformer from './transformers/wknd-sections.js';

// ADVENTURE CATEGORY METADATA
// The adventures listing (article-list) block filters cards by category
// (Climbing/Cycling/Skiing/Surfing/Travel). That grouping is editorial: it is
// NOT exposed in an adventure-detail page's own <head>/DOM — it only exists as
// the tab structure on the listing page. To make category assignment
// self-updating (a newly published adventure lands in the right tab without
// re-importing the listing), each adventure-detail page publishes its own
// `category` so helix-query.yaml can harvest it into /query-index.json.
//
// CATEGORY_BY_SLUG is transcribed verbatim from the wknd.site adventures
// listing tab panels (https://wknd.site/us/en/adventures.html). Keep it in sync
// with that page; the same grouping is emitted as the listing block's `filters`
// config fallback by parsers/adventure-list.js. An adventure may belong to more
// than one category (e.g. Cycling Tuscany is Cycling + Travel) -> comma-joined.
// An adventure in no category (e.g. Cycling Southern Utah) gets no row and never
// appears under a category tab.
const CATEGORY_BY_SLUG = {
  'bali-surf-camp': ['Surfing'],
  'beervana-portland': ['Travel'],
  'climbing-new-zealand': ['Climbing'],
  'colorado-rock-climbing': ['Climbing'],
  // cycling-southern-utah intentionally omitted (source lists it only under All).
  'cycling-tuscany': ['Cycling', 'Travel'],
  'downhill-skiing-wyoming': ['Skiing'],
  'gastronomic-marais-tour': ['Travel'],
  'napa-wine-tasting': ['Travel'],
  'riverside-camping-australia': ['Travel'],
  'ski-touring-mont-blanc': ['Skiing'],
  'surf-camp-costa-rica': ['Surfing'],
  'tahoe-skiing': ['Skiing'],
  'west-coast-cycling': ['Cycling'],
  'whistler-mountain-biking': ['Cycling'],
  'yosemite-backpacking': ['Travel'],
};

/** Last non-empty path segment of a URL/path, minus a trailing .html. */
function slugFromUrl(rawUrl) {
  if (!rawUrl) return '';
  let pathname = rawUrl;
  try {
    pathname = new URL(rawUrl).pathname;
  } catch (e) {
    // rawUrl may already be a bare path
  }
  const segments = pathname.replace(/\.html$/, '').replace(/\/$/, '').split('/');
  return segments[segments.length - 1] || '';
}

/**
 * Append a `Category` row to the page's Metadata block (built by
 * WebImporter.rules.createMetadata). EDS turns this into
 * <meta name="category" content="...">, which helix-query.yaml harvests into
 * /query-index.json. No-op when the adventure has no category or no
 * Metadata block; idempotent (won't add a second Category row).
 */
function addAdventureCategory(main, document, rawUrl) {
  const categories = CATEGORY_BY_SLUG[slugFromUrl(rawUrl)];
  if (!categories || !categories.length) return;

  const metaTable = [...main.querySelectorAll('table')].find((table) => {
    const firstCell = table.querySelector('tr td, tr th');
    return firstCell && firstCell.textContent.trim().toLowerCase() === 'metadata';
  });
  if (!metaTable) return;

  const hasCategory = [...metaTable.querySelectorAll('tr')].some((tr) => {
    const key = tr.querySelector('td, th');
    return key && key.textContent.trim().toLowerCase() === 'category';
  });
  if (hasCategory) return;

  const tbody = metaTable.querySelector('tbody') || metaTable;
  const row = document.createElement('tr');
  const keyCell = document.createElement('td');
  keyCell.textContent = 'Category';
  const valCell = document.createElement('td');
  valCell.textContent = categories.join(', ');
  row.append(keyCell, valCell);
  tbody.append(row);
}

// PAGE TEMPLATE CONFIGURATION - Embedded from page-templates.json
const PAGE_TEMPLATE = {
  name: 'adventure-detail',
  description: 'Adventure trip detail page: breadcrumb, hero image carousel, title, adventure details list, and tabbed content.',
  urls: [
    'https://wknd.site/us/en/adventures/bali-surf-camp.html',
  ],
  blocks: [
    { name: 'carousel-hero', instances: ['div.carousel.panelcontainer.cmp-carousel--mini'] },
    { name: 'adventure-details', instances: ['div.contentfragment.cmp-contentfragment--elements'] },
    { name: 'tabs', instances: ['div.tabs.panelcontainer'] },
  ],
  sections: [
    { id: 'ad2', name: 'hero-carousel', selector: 'div.carousel.panelcontainer.cmp-carousel--mini', style: null, blocks: ['carousel-hero'], defaultContent: ['nav.cmp-breadcrumb'] },
    { id: 'ad4', name: 'adventure-details', selector: 'div.contentfragment.cmp-contentfragment--elements', style: null, blocks: ['adventure-details'], defaultContent: ['div.title.cmp-title--underline'] },
    { id: 'ad7', name: 'adventure-tabs', selector: 'div.tabs.panelcontainer', style: null, blocks: ['tabs'], defaultContent: ['div.sharing'] },
  ],
};

// PARSER REGISTRY
const parsers = {
  'carousel-hero': carouselHeroParser,
  'adventure-details': adventureDetailsParser,
  tabs: tabsParser,
};

// TRANSFORMER REGISTRY
const transformers = [
  cleanupTransformer,
  ...(PAGE_TEMPLATE.sections && PAGE_TEMPLATE.sections.length > 1 ? [sectionsTransformer] : []),
];

function executeTransformers(hookName, element, payload) {
  const enhancedPayload = { ...payload, template: PAGE_TEMPLATE };
  transformers.forEach((transformerFn) => {
    try {
      transformerFn.call(null, hookName, element, enhancedPayload);
    } catch (e) {
      console.error(`Transformer failed at ${hookName}:`, e);
    }
  });
}

function findBlocksOnPage(document, template) {
  const pageBlocks = [];
  template.blocks.forEach((blockDef) => {
    blockDef.instances.forEach((selector) => {
      const elements = document.querySelectorAll(selector);
      if (elements.length === 0) {
        console.warn(`Block "${blockDef.name}" selector not found: ${selector}`);
      }
      elements.forEach((element) => {
        pageBlocks.push({
          name: blockDef.name, selector, element, section: blockDef.section || null,
        });
      });
    });
  });
  console.log(`Found ${pageBlocks.length} block instances on page`);
  return pageBlocks;
}

export default {
  transform: (payload) => {
    const {
      document, url, html, params,
    } = payload;

    const main = document.body;

    executeTransformers('beforeTransform', main, payload);

    const pageBlocks = findBlocksOnPage(document, PAGE_TEMPLATE);
    pageBlocks.forEach((block) => {
      if (!block.element.parentNode) return;
      const parser = parsers[block.name];
      if (parser) {
        try {
          parser(block.element, { document, url, params });
        } catch (e) {
          console.error(`Failed to parse ${block.name} (${block.selector}):`, e);
        }
      } else {
        console.warn(`No parser found for block: ${block.name}`);
      }
    });

    executeTransformers('afterTransform', main, payload);

    const hr = document.createElement('hr');
    main.appendChild(hr);
    WebImporter.rules.createMetadata(main, document);
    // Add the adventure's editorial category to the Metadata block so it is
    // published as <meta name="category"> and harvested into the index.
    addAdventureCategory(main, document, params.originalURL);
    WebImporter.rules.transformBackgroundImages(main, document);
    WebImporter.rules.adjustImageUrls(main, url, params.originalURL);

    const path = WebImporter.FileUtils.sanitizePath(
      new URL(params.originalURL).pathname.replace(/\/$/, '').replace(/\.html$/, ''),
    );

    return [{
      element: main,
      path,
      report: {
        title: document.title,
        template: PAGE_TEMPLATE.name,
        blocks: pageBlocks.map((b) => b.name),
      },
    }];
  },
};
