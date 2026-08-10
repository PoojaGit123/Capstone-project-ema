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

  // tools/importer/import-faq.js
  var import_faq_exports = {};
  __export(import_faq_exports, {
    default: () => import_faq_default
  });

  // tools/importer/parsers/accordion.js
  function parse(element, { document }) {
    const items = element.querySelectorAll('.cmp-accordion__item, [class*="accordion__item"]');
    const cells = [];
    items.forEach((item) => {
      const titleEl = item.querySelector(".cmp-accordion__title, .cmp-accordion__button, .cmp-accordion__header");
      const panel = item.querySelector('.cmp-accordion__panel, [class*="accordion__panel"]');
      if (!titleEl && !panel) return;
      const titleCell = document.createElement("p");
      titleCell.textContent = titleEl ? titleEl.textContent.trim() : "";
      const contentCell = [];
      if (panel) {
        const contentNodes = panel.querySelectorAll(
          ".cmp-text > *, .cmp-text"
        );
        if (contentNodes.length) {
          contentNodes.forEach((node) => {
            const isEmpty = !node.textContent.replace(/ /g, " ").trim() && !node.querySelector("img, a, picture, video, iframe");
            if (isEmpty) return;
            if (!node.classList || !node.classList.contains("cmp-text")) {
              contentCell.push(node);
            } else if (!panel.querySelector(".cmp-text > *")) {
              contentCell.push(node);
            }
          });
        }
        if (!contentCell.length) {
          contentCell.push(...panel.childNodes);
        }
      }
      cells.push([titleCell, contentCell.length ? contentCell : ""]);
    });
    if (!cells.length) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const block = WebImporter.Blocks.createBlock(document, { name: "accordion", cells });
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
      const sections = payload && payload.template && Array.isArray(payload.template.sections) ? payload.template.sections : [];
      if (sections.length < 2) return;
      const { document } = payload;
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

  // tools/importer/import-faq.js
  var PAGE_TEMPLATE = {
    name: "faq",
    description: "FAQ page: title, intro image + text, accordion of Q&A, and a contact/help section.",
    urls: ["https://wknd.site/us/en/faqs.html"],
    blocks: [
      { name: "accordion", instances: ["div.accordion.panelcontainer"] }
    ],
    sections: [
      { id: "fa", name: "faq-accordion", selector: "div.accordion.panelcontainer", style: null, blocks: ["accordion"], defaultContent: ["main div.title.cmp-title--underline"] }
    ]
  };
  var parsers = {
    accordion: parse
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
  var import_faq_default = {
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
  return __toCommonJS(import_faq_exports);
})();
