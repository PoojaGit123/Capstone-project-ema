/* eslint-disable */
/* global WebImporter */

/**
 * Transformer: WKND section breaks and section metadata.
 *
 * Driven by payload.template.sections (from page-templates.json). For each
 * section it inserts an <hr> section break before every non-first section and,
 * for sections that declare a `style`, appends a Section Metadata block.
 *
 * All section selectors originate from the migrated page's captured DOM
 * (migration-work/cleaned.html + page-templates.json). None are guessed.
 *
 * Runs in afterTransform only (block parsers run between the two hooks and need
 * the untouched block DOM to build their cells).
 */

const TransformHook = {
  beforeTransform: 'beforeTransform',
  afterTransform: 'afterTransform',
};

// Resolve a section's DOM elements from its block selector plus any
// defaultContent selectors, in document order. This keeps section-heading and
// CTA default content (e.g. "Recent Articles" title, "All Articles" button)
// grouped with their block when computing section boundaries.
function resolveSectionElements(root, section) {
  const selectors = [section.selector, ...((section.defaultContent) || [])]
    .filter(Boolean);
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
    // el precedes current first → el becomes new first
    return (pos & Node.DOCUMENT_POSITION_PRECEDING) ? el : first;
  }, null);
}

function lastInDocumentOrder(els) {
  return els.reduce((last, el) => {
    if (!last) return el;
    const pos = last.compareDocumentPosition(el);
    // el follows current last → el becomes new last
    return (pos & Node.DOCUMENT_POSITION_FOLLOWING) ? el : last;
  }, null);
}

export default function transform(hookName, element, payload) {
  if (hookName === TransformHook.afterTransform) {
    const { document } = payload;
    const templateName = payload && payload.template && payload.template.name;

    // Preserve authored separators (WKND core "separator" component) as a
    // section break. Scoped to section-landing pages (magazine index), where the
    // source renders a thin rule mid-content between "Members Only" and the promo
    // teasers. NOT applied to the homepage, whose section-end separators are
    // reproduced via CSS (.cta-wrapper) — converting those would add empty
    // sections. Converting to a top-level <hr> makes the divider survive into the
    // doc markdown and the following content becomes its own section.
    if (templateName === 'section-landing') {
      element.querySelectorAll('.separator, .cmp-separator').forEach((sepEl) => {
        if (!sepEl.parentNode) return;
        const hr = document.createElement('hr');
        sepEl.replaceWith(hr);
      });
    }

    const sections = payload
      && payload.template
      && Array.isArray(payload.template.sections)
      ? payload.template.sections
      : [];

    if (sections.length < 2) return;

    // Process in reverse so earlier insertions do not shift later lookups.
    for (let i = sections.length - 1; i >= 0; i -= 1) {
      const section = sections[i];
      const els = resolveSectionElements(element, section);
      if (!els.length) continue;

      const firstEl = firstInDocumentOrder(els);
      const lastEl = lastInDocumentOrder(els);

      // Section Metadata block for styled sections (e.g. featured = light-grey).
      if (section.style && lastEl && lastEl.parentNode) {
        const smBlock = WebImporter.Blocks.createBlock(document, {
          name: 'Section Metadata',
          cells: { style: section.style },
        });
        lastEl.parentNode.insertBefore(smBlock, lastEl.nextSibling);
      }

      // Section break before every section except the first.
      if (i > 0 && firstEl && firstEl.parentNode) {
        const hr = document.createElement('hr');
        firstEl.parentNode.insertBefore(hr, firstEl);
      }
    }
  }
}
