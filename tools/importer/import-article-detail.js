/* eslint-disable */
/* global WebImporter */

// PARSER IMPORTS
import columnsAuthorBioParser from './parsers/columns-author-bio.js';
import articleListParser from './parsers/article-list.js';

// TRANSFORMER IMPORTS
import cleanupTransformer from './transformers/wknd-cleanup.js';
import sectionsTransformer from './transformers/wknd-sections.js';
import metadataTransformer from './transformers/wknd-metadata.js';

// PAGE TEMPLATE CONFIGURATION - Embedded from page-templates.json
const PAGE_TEMPLATE = {
  name: 'article-detail',
  description: 'Magazine article detail page: breadcrumb, title + author, article body (paragraphs, pull quote, subheadings), author bio, and related-stories list.',
  urls: [
    'https://wknd.site/us/en/magazine/guide-la-skateparks.html',
    'https://wknd.site/us/en/magazine/ski-touring.html',
    'https://wknd.site/us/en/magazine/arctic-surfing.html',
    'https://wknd.site/us/en/magazine/san-diego-surf.html',
    'https://wknd.site/us/en/magazine/western-australia.html',
  ],
  blocks: [
    {
      name: 'columns-author-bio',
      instances: ['main.cmp-layout-container--fixed div[class*="cmp-experiencefragment--"]'],
    },
    {
      name: 'article-list',
      instances: ['aside div.list.cmp-list--upnext'],
    },
  ],
  sections: [
    { id: 'as5', name: 'article-body', selector: 'article.contentfragment', style: null, blocks: [], defaultContent: ['nav.cmp-breadcrumb', 'article.contentfragment'] },
    { id: 'as6', name: 'author-bio', selector: 'main.cmp-layout-container--fixed div[class*="cmp-experiencefragment--"]', style: null, blocks: ['columns-author-bio'], defaultContent: [] },
    { id: 'as8', name: 'related-stories', selector: 'aside div.list.cmp-list--upnext', style: null, blocks: ['article-list'], defaultContent: ['aside.cmp-layoutcontainer--sidebar div.sharing'] },
  ],
};

// PARSER REGISTRY
const parsers = {
  'columns-author-bio': columnsAuthorBioParser,
  'article-list': articleListParser,
};

// TRANSFORMER REGISTRY - cleanup → sections → metadata (metadata owns the Metadata block)
const transformers = [
  cleanupTransformer,
  ...(PAGE_TEMPLATE.sections && PAGE_TEMPLATE.sections.length > 1 ? [sectionsTransformer] : []),
  metadataTransformer,
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

    // Built-in rules. NOTE: wknd-metadata.js owns the Metadata block, so we do
    // NOT call WebImporter.rules.createMetadata here (would create a duplicate).
    const hr = document.createElement('hr');
    main.appendChild(hr);
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
