/* eslint-disable */
/* global WebImporter */

// PARSER IMPORTS
import carouselHeroParser from './parsers/carousel-hero.js';
import heroParser from './parsers/hero.js';
import articleListParser from './parsers/article-list.js';
import cardsParser from './parsers/cards.js';

// TRANSFORMER IMPORTS
import cleanupTransformer from './transformers/wknd-cleanup.js';
import sectionsTransformer from './transformers/wknd-sections.js';

// PAGE TEMPLATE CONFIGURATION - Embedded from page-templates.json
const PAGE_TEMPLATE = {
  name: 'homepage',
  description: 'WKND locale landing page: hero carousel, featured article teaser, live recent-articles list, adventure hero banner, and next-adventures list.',
  urls: [
    'https://wknd.site/us/en.html',
  ],
  blocks: [
    {
      name: 'carousel-hero',
      instances: ['div.carousel.panelcontainer.cmp-carousel--hero'],
    },
    {
      name: 'hero',
      instances: [
        'div.teaser.cmp-teaser--featured',
        'div.teaser.cmp-teaser--hero.cmp-teaser--imagebottom',
      ],
    },
    {
      name: 'article-list',
      instances: ['main.cmp-layout-container--fixed:nth-of-type(1) div.image-list.list'],
    },
    {
      name: 'cards',
      instances: ['main.cmp-layout-container--fixed:nth-of-type(2) div.image-list.list'],
    },
  ],
  sections: [
    {
      id: 'rc2',
      name: 'hero-carousel',
      selector: 'div.carousel.panelcontainer.cmp-carousel--hero',
      style: null,
      blocks: ['carousel-hero'],
      defaultContent: [],
    },
    {
      id: 'rc3',
      name: 'featured-article',
      selector: 'div.teaser.cmp-teaser--featured',
      style: 'light-grey',
      blocks: ['hero'],
      defaultContent: [],
    },
    {
      id: 'rc4',
      name: 'recent-articles',
      selector: 'main.cmp-layout-container--fixed:nth-of-type(1) div.image-list.list',
      style: null,
      blocks: ['article-list'],
      defaultContent: [
        'div.title.cmp-title--underline:nth-of-type(2)',
        'main.cmp-layout-container--fixed:nth-of-type(1) div.button.cmp-button--primary',
      ],
    },
    {
      id: 'rc9',
      name: 'next-adventures',
      selector: 'main.cmp-layout-container--fixed:nth-of-type(2) div.image-list.list',
      style: null,
      blocks: ['hero', 'cards'],
      defaultContent: [
        'div.title.cmp-title--underline:nth-of-type(6)',
        'main.cmp-layout-container--fixed:nth-of-type(2) div.title',
        'main.cmp-layout-container--fixed:nth-of-type(2) div.button.cmp-button--primary',
      ],
    },
  ],
};

// PARSER REGISTRY
const parsers = {
  'carousel-hero': carouselHeroParser,
  hero: heroParser,
  'article-list': articleListParser,
  cards: cardsParser,
};

// TRANSFORMER REGISTRY - cleanup runs first, section transformer last
const transformers = [
  cleanupTransformer,
  ...(PAGE_TEMPLATE.sections && PAGE_TEMPLATE.sections.length > 1 ? [sectionsTransformer] : []),
];

/**
 * Execute all page transformers for a specific hook
 * @param {string} hookName - 'beforeTransform' or 'afterTransform'
 * @param {Element} element - DOM element to transform
 * @param {Object} payload - { document, url, html, params }
 */
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

/**
 * Find all blocks on the page based on the embedded template configuration
 * @param {Document} document
 * @param {Object} template
 * @returns {Array}
 */
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
          name: blockDef.name,
          selector,
          element,
          section: blockDef.section || null,
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

    // 1. beforeTransform (initial cleanup)
    executeTransformers('beforeTransform', main, payload);

    // 2. Find blocks on page
    const pageBlocks = findBlocksOnPage(document, PAGE_TEMPLATE);

    // 3. Parse each block. Skip elements already detached by a prior parser.
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

    // 4. afterTransform (final cleanup + section breaks/metadata)
    executeTransformers('afterTransform', main, payload);

    // 5. Built-in importer rules
    const hr = document.createElement('hr');
    main.appendChild(hr);
    WebImporter.rules.createMetadata(main, document);
    WebImporter.rules.transformBackgroundImages(main, document);
    WebImporter.rules.adjustImageUrls(main, url, params.originalURL);

    // 6. Sanitized path
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
