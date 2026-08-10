var CustomImportScript = (() => {
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
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

  // tools/importer/import-article-detail.js
  var import_article_detail_exports = {};
  __export(import_article_detail_exports, {
    default: () => import_article_detail_default
  });

  // tools/importer/parsers/columns-author-bio.js
  function parse(element, { document }) {
    const image = element.querySelector(
      ".cmp-byline__image img, .cmp-byline img, .cmp-image img, img"
    );
    const textCell = [];
    const nameEl = element.querySelector(".cmp-byline__name, h1, h2, h3");
    const nameText = nameEl ? nameEl.textContent.trim() : "";
    if (nameText) {
      const h2 = document.createElement("h2");
      h2.textContent = nameText;
      textCell.push(h2);
    }
    let roleEl = element.querySelector(".cmp-byline__occupations, .cmp-byline p");
    if (!roleEl) {
      const h5 = element.querySelector("h5");
      roleEl = h5 && h5 !== nameEl ? h5 : null;
    }
    const roleText = roleEl ? roleEl.textContent.trim() : "";
    if (roleText) {
      const p = document.createElement("p");
      p.textContent = roleText;
      textCell.push(p);
    }
    const socialButtons = Array.from(
      element.querySelectorAll(".cmp-buildingblock--btn-list a.cmp-button, .cmp-button")
    );
    socialButtons.forEach((btn) => {
      const href = btn.getAttribute("href");
      if (!href) return;
      const labelEl = btn.querySelector(".cmp-button__text");
      const label = labelEl ? labelEl.textContent.trim() : btn.textContent.trim();
      if (!label) return;
      const link = document.createElement("a");
      link.setAttribute("href", href);
      link.textContent = label;
      textCell.push(link);
    });
    if (!image && textCell.length === 0) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const cells = [[image || "", textCell.length ? textCell : ""]];
    const block = WebImporter.Blocks.createBlock(document, { name: "columns-author-bio", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/article-list.js
  function parse2(element, { document, params }) {
    const INDEX = "/query-index.json";
    const items = Array.from(
      element.querySelectorAll(".cmp-image-list__item, .cmp-list__item")
    );
    const extract = (item) => {
      const titleLink = item.querySelector(
        ".cmp-image-list__item-title-link, .cmp-list__item-link, a[href]"
      );
      if (!titleLink) return null;
      const href = titleLink.getAttribute("href");
      if (!href) return null;
      const titleEl = item.querySelector(
        ".cmp-image-list__item-title, .cmp-list__item-title"
      );
      const titleText = (titleEl ? titleEl.textContent : titleLink.textContent).trim();
      return { href, titleText: titleText || href };
    };
    const articles = items.map(extract).filter(Boolean);
    const firstHref = articles.length ? articles[0].href : "";
    let sourceFolder = "";
    const m = firstHref.match(/^(.*\/magazine)\//);
    if (m) {
      sourceFolder = `${m[1]}/`;
    } else {
      const pagePath = params && params.originalURL ? new URL(params.originalURL).pathname : "/us/en.html";
      const loc = pagePath.match(/^\/([^/]+)\/([^/]+)/);
      sourceFolder = loc ? `/${loc[1]}/${loc[2]}/magazine/` : "/magazine/";
    }
    const cells = [];
    cells.push(["source", sourceFolder]);
    cells.push(["index", INDEX]);
    cells.push(["limit", String(articles.length || 4)]);
    articles.forEach(({ href, titleText }) => {
      const link = document.createElement("a");
      link.setAttribute("href", href);
      link.textContent = titleText;
      cells.push([link]);
    });
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

  // tools/importer/transformers/wknd-metadata.js
  var TransformHook3 = {
    beforeTransform: "beforeTransform",
    afterTransform: "afterTransform"
  };
  var DATE_BY_SLUG = {
    "western-australia": "2020-07-09",
    "guide-la-skateparks": "2020-09-30",
    "ski-touring": "2020-09-30",
    "san-diego-surf": "2020-07-09",
    // arctic-surfing exposes no date in its own DOM or on the live site; the WKND
    // demo dates it to mid-2019 (oldest of the set). Supplied manually here.
    "arctic-surfing": "2019-08-13"
  };
  var PLACEHOLDER_DATE = "2020-01-01";
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
  function extractAuthor(element) {
    const h4s = [...element.querySelectorAll("h4")];
    const byline = h4s.find((h) => /^\s*by\s+/i.test(h.textContent || ""));
    if (!byline) return "";
    return byline.textContent.replace(/^\s*by\s+/i, "").trim();
  }
  function findLeadImage(element) {
    return element.querySelector("div.image.aem-GridColumn:first-of-type img.cmp-image__image") || element.querySelector("img.cmp-image__image") || element.querySelector("img");
  }
  function removeExistingMetadataBlock(element) {
    element.querySelectorAll("table").forEach((table) => {
      const firstCell = table.querySelector("tr td, tr th");
      if (firstCell && firstCell.textContent.trim().toLowerCase() === "metadata") {
        table.remove();
      }
    });
  }
  function transform3(hookName, element, payload) {
    if (hookName !== TransformHook3.afterTransform) return;
    const doc = payload && payload.document || element.ownerDocument;
    if (!doc) return;
    const rawUrl = payload && payload.params && payload.params.originalURL || payload && payload.url || "";
    const h1 = element.querySelector("h1");
    const title = h1 ? h1.textContent.trim() : "";
    const descMeta = doc.querySelector('head meta[name="description"]');
    const description = descMeta ? (descMeta.getAttribute("content") || "").trim() : "";
    const author = extractAuthor(element);
    const leadImg = findLeadImage(element);
    const slug = slugFromUrl(rawUrl);
    const publisheddate = DATE_BY_SLUG[slug] || PLACEHOLDER_DATE;
    const cells = {};
    if (title) cells.Title = title;
    if (description) cells.Description = description;
    if (leadImg) {
      const imgClone = leadImg.cloneNode(true);
      const originalAlt = (imgClone.getAttribute("alt") || "").trim();
      const alt = title || (originalAlt.length > 120 ? `${originalAlt.slice(0, 117)}...` : originalAlt);
      if (alt) imgClone.setAttribute("alt", alt);
      cells.Image = imgClone;
    }
    if (author) cells.Author = author;
    cells.Publisheddate = publisheddate;
    if (Object.keys(cells).length === 0) return;
    removeExistingMetadataBlock(element);
    const metadataBlock = WebImporter.Blocks.createBlock(doc, {
      name: "Metadata",
      cells
    });
    const lastChild = element.lastElementChild;
    if (lastChild && lastChild.tagName !== "HR") {
      element.append(doc.createElement("hr"));
    }
    element.append(metadataBlock);
  }

  // tools/importer/import-article-detail.js
  var PAGE_TEMPLATE = {
    name: "article-detail",
    description: "Magazine article detail page: breadcrumb, title + author, article body (paragraphs, pull quote, subheadings), author bio, and related-stories list.",
    urls: [
      "https://wknd.site/us/en/magazine/guide-la-skateparks.html",
      "https://wknd.site/us/en/magazine/ski-touring.html",
      "https://wknd.site/us/en/magazine/arctic-surfing.html",
      "https://wknd.site/us/en/magazine/san-diego-surf.html",
      "https://wknd.site/us/en/magazine/western-australia.html"
    ],
    blocks: [
      {
        name: "columns-author-bio",
        instances: ['main.cmp-layout-container--fixed div[class*="cmp-experiencefragment--"]']
      },
      {
        name: "article-list",
        instances: ["aside div.list.cmp-list--upnext"]
      }
    ],
    sections: [
      { id: "as5", name: "article-body", selector: "article.contentfragment", style: null, blocks: [], defaultContent: ["nav.cmp-breadcrumb", "article.contentfragment"] },
      { id: "as6", name: "author-bio", selector: 'main.cmp-layout-container--fixed div[class*="cmp-experiencefragment--"]', style: null, blocks: ["columns-author-bio"], defaultContent: [] },
      { id: "as8", name: "related-stories", selector: "aside div.list.cmp-list--upnext", style: null, blocks: ["article-list"], defaultContent: ["aside.cmp-layoutcontainer--sidebar div.sharing"] }
    ]
  };
  var parsers = {
    "columns-author-bio": parse,
    "article-list": parse2
  };
  var transformers = [
    transform,
    ...PAGE_TEMPLATE.sections && PAGE_TEMPLATE.sections.length > 1 ? [transform2] : [],
    transform3
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
  var import_article_detail_default = {
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
  return __toCommonJS(import_article_detail_exports);
})();
