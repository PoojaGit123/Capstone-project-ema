/* eslint-disable */
/* global WebImporter */

import heroParser from './parsers/hero.js';
import articleListParser from './parsers/article-list.js';
import columnsAuthorBioParser from './parsers/columns-author-bio.js';

import cleanupTransformer from './transformers/wknd-cleanup.js';
import sectionsTransformer from './transformers/wknd-sections.js';

const PAGE_TEMPLATE = {
  name: 'section-landing',
  description: 'Section landing page: magazine index (featured hero + live article list) and about-us (contributor bios).',
  urls: [
    'https://wknd.site/us/en/about-us.html',
    'https://wknd.site/us/en/magazine.html',
  ],
  blocks: [
    { name: 'hero', instances: ['div.teaser.cmp-teaser--featured'] },
    { name: 'article-list', instances: ['main div.image-list.list'] },
    { name: 'columns-author-bio', instances: ['.experiencefragment.cmp-experience-fragment--contributor'] },
  ],
  sections: [
    { id: 'sl-mag-feat', name: 'featured', selector: 'div.teaser.cmp-teaser--featured', style: null, blocks: ['hero'], defaultContent: [] },
    { id: 'sl-mag-list', name: 'all-articles', selector: 'main div.image-list.list', style: null, blocks: ['article-list'], defaultContent: ['main div.title.cmp-title--underline'] },
    { id: 'sl-au', name: 'contributors', selector: '.experiencefragment.cmp-experience-fragment--contributor', style: null, blocks: ['columns-author-bio'], defaultContent: ['main div.title.cmp-title--underline'] },
  ],
};

const parsers = {
  hero: heroParser,
  'article-list': articleListParser,
  'columns-author-bio': columnsAuthorBioParser,
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
    blockDef.instances.forEach((selector) => {
      const elements = document.querySelectorAll(selector);
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
