/* eslint-disable */
/* global WebImporter */

import heroParser from './parsers/hero.js';
import adventureListParser from './parsers/adventure-list.js';

import cleanupTransformer from './transformers/wknd-cleanup.js';
import sectionsTransformer from './transformers/wknd-sections.js';

const PAGE_TEMPLATE = {
  name: 'adventure-listing',
  description: 'Adventures listing page: intro hero teaser and a live, query-index-driven adventure list.',
  urls: ['https://wknd.site/us/en/adventures.html'],
  blocks: [
    { name: 'hero', instances: ['div.teaser.cmp-teaser--hero'] },
    // The whole source tabbed card grid (category tab nav + every per-category
    // panel) is replaced by a single dynamic article-list block driven by
    // /query-index.json (see parsers/adventure-list.js). Target the tabs
    // container itself so no leftover category lists remain.
    { name: 'article-list', instances: ['div.tabs.panelcontainer'] },
  ],
  sections: [
    { id: 'av2', name: 'intro-teaser', selector: 'div.teaser.cmp-teaser--hero', style: null, blocks: ['hero'], defaultContent: ['main div.title:has(#title-e8e3276d1e)'] },
    { id: 'av4', name: 'adventures-listing', selector: 'div.tabs.panelcontainer', style: null, blocks: ['article-list'], defaultContent: ['div.title.cmp-title--underline:has(#title-dffa0ffaf3)'] },
  ],
};

const parsers = {
  hero: heroParser,
  'article-list': adventureListParser,
};

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
    // For blocks with fallback selectors, take the FIRST that matches (avoid
    // duplicating the same grid via multiple selectors).
    let matched = null;
    blockDef.instances.forEach((selector) => {
      if (matched) return;
      const el = document.querySelector(selector);
      if (el) matched = { selector, el };
    });
    if (!matched) {
      console.warn(`Block "${blockDef.name}" no selector matched`);
      return;
    }
    pageBlocks.push({
      name: blockDef.name, selector: matched.selector, element: matched.el, section: blockDef.section || null,
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
    WebImporter.rules.transformBackgroundImages(main, document);
    WebImporter.rules.adjustImageUrls(main, url, params.originalURL);

    const path = WebImporter.FileUtils.sanitizePath(
      new URL(params.originalURL).pathname.replace(/\/$/, '').replace(/\.html$/, ''),
    );

    return [{
      element: main,
      path,
      report: { title: document.title, template: PAGE_TEMPLATE.name, blocks: pageBlocks.map((b) => b.name) },
    }];
  },
};
