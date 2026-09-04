/* eslint-disable */
var CustomImportScript = (() => {
  var __defProp = Object.defineProperty;
  var __defProps = Object.defineProperties;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropDescs = Object.getOwnPropertyDescriptors;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __getOwnPropSymbols = Object.getOwnPropertySymbols;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __propIsEnum = Object.prototype.propertyIsEnumerable;
  var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
  var __spreadValues = (a, b) => {
    for (var prop in b || (b = {}))
      if (__hasOwnProp.call(b, prop))
        __defNormalProp(a, prop, b[prop]);
    if (__getOwnPropSymbols)
      for (var prop of __getOwnPropSymbols(b)) {
        if (__propIsEnum.call(b, prop))
          __defNormalProp(a, prop, b[prop]);
      }
    return a;
  };
  var __spreadProps = (a, b) => __defProps(a, __getOwnPropDescs(b));
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

  // tools/importer/import-adventure-listing.js
  var import_adventure_listing_exports = {};
  __export(import_adventure_listing_exports, {
    default: () => import_adventure_listing_default
  });

  // tools/importer/parsers/hero.js
  function parse(element, { document }) {
    const image = element.querySelector(".cmp-teaser__image img, .cmp-image img, img");
    const eyebrow = element.querySelector('.cmp-teaser__pretitle, [class*="pretitle"], [class*="eyebrow"]');
    const heading = element.querySelector('.cmp-teaser__title, h1, h2, h3, [class*="title"]:not([class*="pretitle"]):not([class*="eyebrow"])');
    const description = element.querySelector('.cmp-teaser__description, [class*="description"]');
    const cta = element.querySelector(".cmp-teaser__action-link, .cmp-teaser__action-container a, a");
    if (!heading && !description && !image) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const cells = [];
    if (image) cells.push([image]);
    const contentCell = [];
    if (eyebrow) contentCell.push(eyebrow);
    if (heading) contentCell.push(heading);
    if (description) contentCell.push(description);
    if (cta) contentCell.push(cta);
    cells.push([contentCell]);
    const block = WebImporter.Blocks.createBlock(document, { name: "hero", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/adventure-list.js
  function slugFromHref(href) {
    if (!href) return "";
    return href.replace(/[?#].*$/, "").replace(/\.html$/, "").replace(/\/$/, "").split("/").filter(Boolean).pop() || "";
  }
  function extractFilters(element) {
    const tablist = element.querySelector('[role="tablist"], ol.cmp-tabs__tablist, ol');
    if (!tablist) return "";
    const tabDefs = [...tablist.querySelectorAll('[role="tab"], li, a')].map((tab) => {
      const id = tab.id || tab.getAttribute("aria-controls") || "";
      const label = (tab.textContent || "").trim();
      return label ? { id, label } : null;
    }).filter(Boolean);
    const panels = [...element.querySelectorAll('[role="tabpanel"], .cmp-tabs__tabpanel')];
    const parts = [];
    tabDefs.forEach(({ id, label }) => {
      if (/^all$/i.test(label)) return;
      let panel = panels.find((p) => {
        const lbl = p.getAttribute("aria-labelledby") || "";
        return id && (lbl === id || lbl === `${id}-tab` || `${lbl}-tab` === id);
      });
      if (!panel) panel = panels[tabDefs.indexOf(tabDefs.find((t) => t.label === label))];
      if (!panel) return;
      const slugs = [];
      panel.querySelectorAll('a[href*="/adventures/"]').forEach((a) => {
        const slug = slugFromHref(a.getAttribute("href"));
        if (slug && slug !== "adventures" && !slugs.includes(slug)) slugs.push(slug);
      });
      if (slugs.length) parts.push(`${label}=${slugs.join(",")}`);
    });
    return parts.join(";");
  }
  function parse2(element, { document, params }) {
    const INDEX = "/query-index.json";
    const pagePath = params && params.originalURL ? new URL(params.originalURL).pathname : "/us/en/adventures.html";
    const loc = pagePath.match(/^\/([^/]+)\/([^/]+)/);
    const sourceFolder = loc ? `/${loc[1]}/${loc[2]}/adventures/` : "/us/en/adventures/";
    const cells = [
      ["source", sourceFolder],
      ["index", INDEX]
    ];
    const filters = extractFilters(element);
    if (filters) cells.push(["filters", filters]);
    const block = WebImporter.Blocks.createBlock(document, { name: "article-list", cells });
    element.replaceWith(block);
  }

  // tools/importer/transformers/wknd-cleanup.js
  var TransformHook = {
    beforeTransform: "beforeTransform",
    afterTransform: "afterTransform"
  };
  function transform(hookName, element, payload) {
    if (hookName === TransformHook.beforeTransform) {
    }
    if (hookName === TransformHook.afterTransform) {
      WebImporter.DOMUtils.remove(element, [
        "header",
        "footer",
        "#toggleNav",
        "#mobileNav",
        "iframe"
      ]);
      WebImporter.DOMUtils.remove(element, [
        "meta",
        "link",
        "noscript",
        "source"
      ]);
      element.querySelectorAll("*").forEach((el) => {
        [...el.attributes].forEach((attr) => {
          if (attr.name.startsWith("data-cmp-")) {
            el.removeAttribute(attr.name);
          }
        });
      });
    }
  }

  // tools/importer/transformers/wknd-sections.js
  var TransformHook2 = {
    beforeTransform: "beforeTransform",
    afterTransform: "afterTransform"
  };
  function resolveSectionElements(root, section) {
    const selectors = [section.selector, ...section.defaultContent || []].filter(Boolean);
    const els = [];
    selectors.forEach((sel) => {
      let el = null;
      try {
        el = root.querySelector(sel);
      } catch (e) {
        el = null;
      }
      if (el && !els.includes(el)) els.push(el);
    });
    return els;
  }
  function firstInDocumentOrder(els) {
    return els.reduce((first, el) => {
      if (!first) return el;
      const pos = first.compareDocumentPosition(el);
      return pos & Node.DOCUMENT_POSITION_PRECEDING ? el : first;
    }, null);
  }
  function lastInDocumentOrder(els) {
    return els.reduce((last, el) => {
      if (!last) return el;
      const pos = last.compareDocumentPosition(el);
      return pos & Node.DOCUMENT_POSITION_FOLLOWING ? el : last;
    }, null);
  }
  function transform2(hookName, element, payload) {
    if (hookName === TransformHook2.afterTransform) {
      const { document } = payload;
      const templateName = payload && payload.template && payload.template.name;
      if (templateName === "section-landing") {
        element.querySelectorAll(".separator, .cmp-separator").forEach((sepEl) => {
          if (!sepEl.parentNode) return;
          const hr = document.createElement("hr");
          sepEl.replaceWith(hr);
        });
      }
      const sections = payload && payload.template && Array.isArray(payload.template.sections) ? payload.template.sections : [];
      if (sections.length < 2) return;
      for (let i = sections.length - 1; i >= 0; i -= 1) {
        const section = sections[i];
        const els = resolveSectionElements(element, section);
        if (!els.length) continue;
        const firstEl = firstInDocumentOrder(els);
        const lastEl = lastInDocumentOrder(els);
        if (section.style && lastEl && lastEl.parentNode) {
          const smBlock = WebImporter.Blocks.createBlock(document, {
            name: "Section Metadata",
            cells: { style: section.style }
          });
          lastEl.parentNode.insertBefore(smBlock, lastEl.nextSibling);
        }
        if (i > 0 && firstEl && firstEl.parentNode) {
          const hr = document.createElement("hr");
          firstEl.parentNode.insertBefore(hr, firstEl);
        }
      }
    }
  }

  // tools/importer/import-adventure-listing.js
  var PAGE_TEMPLATE = {
    name: "adventure-listing",
    description: "Adventures listing page: intro hero teaser and a live, query-index-driven adventure list.",
    urls: ["https://wknd.site/us/en/adventures.html"],
    blocks: [
      { name: "hero", instances: ["div.teaser.cmp-teaser--hero"] },
      // The whole source tabbed card grid (category tab nav + every per-category
      // panel) is replaced by a single dynamic article-list block driven by
      // /query-index.json (see parsers/adventure-list.js). Target the tabs
      // container itself so no leftover category lists remain.
      { name: "article-list", instances: ["div.tabs.panelcontainer"] }
    ],
    sections: [
      { id: "av2", name: "intro-teaser", selector: "div.teaser.cmp-teaser--hero", style: null, blocks: ["hero"], defaultContent: ["main div.title:has(#title-e8e3276d1e)"] },
      { id: "av4", name: "adventures-listing", selector: "div.tabs.panelcontainer", style: null, blocks: ["article-list"], defaultContent: ["div.title.cmp-title--underline:has(#title-dffa0ffaf3)"] }
    ]
  };
  var parsers = {
    hero: parse,
    "article-list": parse2
  };
  var transformers = [
    transform,
    ...PAGE_TEMPLATE.sections && PAGE_TEMPLATE.sections.length > 1 ? [transform2] : []
  ];
  function executeTransformers(hookName, element, payload) {
    const enhancedPayload = __spreadProps(__spreadValues({}, payload), { template: PAGE_TEMPLATE });
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
        name: blockDef.name,
        selector: matched.selector,
        element: matched.el,
        section: blockDef.section || null
      });
    });
    console.log(`Found ${pageBlocks.length} block instances on page`);
    return pageBlocks;
  }
  var import_adventure_listing_default = {
    transform: (payload) => {
      const {
        document,
        url,
        html,
        params
      } = payload;
      const main = document.body;
      executeTransformers("beforeTransform", main, payload);
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
      executeTransformers("afterTransform", main, payload);
      const hr = document.createElement("hr");
      main.appendChild(hr);
      WebImporter.rules.createMetadata(main, document);
      WebImporter.rules.transformBackgroundImages(main, document);
      WebImporter.rules.adjustImageUrls(main, url, params.originalURL);
      const path = WebImporter.FileUtils.sanitizePath(
        new URL(params.originalURL).pathname.replace(/\/$/, "").replace(/\.html$/, "")
      );
      return [{
        element: main,
        path,
        report: { title: document.title, template: PAGE_TEMPLATE.name, blocks: pageBlocks.map((b) => b.name) }
      }];
    }
  };
  return __toCommonJS(import_adventure_listing_exports);
})();
