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

  // tools/importer/import-adventure-detail.js
  var import_adventure_detail_exports = {};
  __export(import_adventure_detail_exports, {
    default: () => import_adventure_detail_default
  });

  // tools/importer/parsers/carousel-hero.js
  function parse(element, { document }) {
    const slides = Array.from(element.querySelectorAll(".cmp-carousel__item"));
    const cells = [];
    slides.forEach((slide) => {
      const image = slide.querySelector(".cmp-teaser__image img, .cmp-image img, img");
      const heading = slide.querySelector('.cmp-teaser__title, h1, h2, h3, [class*="title"]');
      const description = slide.querySelector('.cmp-teaser__description, [class*="description"]');
      const cta = slide.querySelector(".cmp-teaser__action-link, .cmp-teaser__action-container a, a");
      const contentCell = [];
      if (heading) contentCell.push(heading);
      if (description) contentCell.push(description);
      if (cta) contentCell.push(cta);
      if (!image && contentCell.length === 0) return;
      cells.push([image || "", contentCell.length ? contentCell : ""]);
    });
    if (cells.length === 0) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const block = WebImporter.Blocks.createBlock(document, { name: "carousel-hero", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/adventure-details.js
  function parse2(element, { document }) {
    let elements = Array.from(element.querySelectorAll(".cmp-contentfragment__element"));
    if (elements.length === 0) {
      const dts = Array.from(element.querySelectorAll("dt"));
      elements = dts.map((dt) => dt.parentElement).filter(Boolean);
    }
    const cells = [];
    elements.forEach((el) => {
      const labelEl = el.querySelector(".cmp-contentfragment__element-title, dt");
      const valueEl = el.querySelector(".cmp-contentfragment__element-value, dd");
      const label = labelEl ? labelEl.textContent.trim() : "";
      const value = valueEl ? valueEl.textContent.trim() : "";
      if (!label && !value) return;
      cells.push([label, value]);
    });
    if (cells.length === 0) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const block = WebImporter.Blocks.createBlock(document, { name: "adventure-details", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/tabs.js
  function parse3(element, { document }) {
    const tabLabels = Array.from(element.querySelectorAll(".cmp-tabs__tablist .cmp-tabs__tab, .cmp-tabs__tablist > li"));
    const tabPanels = Array.from(element.querySelectorAll(".cmp-tabs__tabpanel"));
    const cells = [];
    tabPanels.forEach((panel, i) => {
      const labelEl = tabLabels[i];
      const label = labelEl ? labelEl.textContent.trim() : "";
      const contentSource = panel.querySelector(".cmp-contentfragment__elements") || panel.querySelector(".cmp-contentfragment") || panel;
      const contentCell = Array.from(contentSource.childNodes).filter((node) => {
        if (node.nodeType === 3) return node.textContent.trim().length > 0;
        return node.nodeType === 1;
      });
      if (!label && contentCell.length === 0) return;
      cells.push([label, contentCell.length ? contentCell : ""]);
    });
    if (cells.length === 0) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const block = WebImporter.Blocks.createBlock(document, { name: "tabs", cells });
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

  // tools/importer/import-adventure-detail.js
  var CATEGORY_BY_SLUG = {
    "bali-surf-camp": ["Surfing"],
    "beervana-portland": ["Travel"],
    "climbing-new-zealand": ["Climbing"],
    "colorado-rock-climbing": ["Climbing"],
    // cycling-southern-utah intentionally omitted (source lists it only under All).
    "cycling-tuscany": ["Cycling", "Travel"],
    "downhill-skiing-wyoming": ["Skiing"],
    "gastronomic-marais-tour": ["Travel"],
    "napa-wine-tasting": ["Travel"],
    "riverside-camping-australia": ["Travel"],
    "ski-touring-mont-blanc": ["Skiing"],
    "surf-camp-costa-rica": ["Surfing"],
    "tahoe-skiing": ["Skiing"],
    "west-coast-cycling": ["Cycling"],
    "whistler-mountain-biking": ["Cycling"],
    "yosemite-backpacking": ["Travel"]
  };
  function slugFromUrl(rawUrl) {
    if (!rawUrl) return "";
    let pathname = rawUrl;
    try {
      pathname = new URL(rawUrl).pathname;
    } catch (e) {
    }
    const segments = pathname.replace(/\.html$/, "").replace(/\/$/, "").split("/");
    return segments[segments.length - 1] || "";
  }
  function addAdventureCategory(main, document, rawUrl) {
    const categories = CATEGORY_BY_SLUG[slugFromUrl(rawUrl)];
    if (!categories || !categories.length) return;
    const metaTable = [...main.querySelectorAll("table")].find((table) => {
      const firstCell = table.querySelector("tr td, tr th");
      return firstCell && firstCell.textContent.trim().toLowerCase() === "metadata";
    });
    if (!metaTable) return;
    const hasCategory = [...metaTable.querySelectorAll("tr")].some((tr) => {
      const key = tr.querySelector("td, th");
      return key && key.textContent.trim().toLowerCase() === "category";
    });
    if (hasCategory) return;
    const tbody = metaTable.querySelector("tbody") || metaTable;
    const row = document.createElement("tr");
    const keyCell = document.createElement("td");
    keyCell.textContent = "Category";
    const valCell = document.createElement("td");
    valCell.textContent = categories.join(", ");
    row.append(keyCell, valCell);
    tbody.append(row);
  }
  var PAGE_TEMPLATE = {
    name: "adventure-detail",
    description: "Adventure trip detail page: breadcrumb, hero image carousel, title, adventure details list, and tabbed content.",
    urls: [
      "https://wknd.site/us/en/adventures/bali-surf-camp.html"
    ],
    blocks: [
      { name: "carousel-hero", instances: ["div.carousel.panelcontainer.cmp-carousel--mini"] },
      { name: "adventure-details", instances: ["div.contentfragment.cmp-contentfragment--elements"] },
      { name: "tabs", instances: ["div.tabs.panelcontainer"] }
    ],
    sections: [
      { id: "ad2", name: "hero-carousel", selector: "div.carousel.panelcontainer.cmp-carousel--mini", style: null, blocks: ["carousel-hero"], defaultContent: ["nav.cmp-breadcrumb"] },
      { id: "ad4", name: "adventure-details", selector: "div.contentfragment.cmp-contentfragment--elements", style: null, blocks: ["adventure-details"], defaultContent: ["div.title.cmp-title--underline"] },
      { id: "ad7", name: "adventure-tabs", selector: "div.tabs.panelcontainer", style: null, blocks: ["tabs"], defaultContent: ["div.sharing"] }
    ]
  };
  var parsers = {
    "carousel-hero": parse,
    "adventure-details": parse2,
    tabs: parse3
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
            section: blockDef.section || null
          });
        });
      });
    });
    console.log(`Found ${pageBlocks.length} block instances on page`);
    return pageBlocks;
  }
  var import_adventure_detail_default = {
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
      addAdventureCategory(main, document, params.originalURL);
      WebImporter.rules.transformBackgroundImages(main, document);
      WebImporter.rules.adjustImageUrls(main, url, params.originalURL);
      const path = WebImporter.FileUtils.sanitizePath(
        new URL(params.originalURL).pathname.replace(/\/$/, "").replace(/\.html$/, "")
      );
      return [{
        element: main,
        path,
        report: {
          title: document.title,
          template: PAGE_TEMPLATE.name,
          blocks: pageBlocks.map((b) => b.name)
        }
      }];
    }
  };
  return __toCommonJS(import_adventure_detail_exports);
})();
