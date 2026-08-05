I'd like to clarify a couple of things before I put together the migration plan.# WKND Site Analysis Plan

## Goal

Analyze the reference site **https://wknd.site/us/en.html** to understand its structure before any content import. This is an **analysis-only** pass: no HTML content will be generated or imported, and no code will be committed. The output is a set of migration-planning artifacts (URL inventory, page templates, block catalog, design tokens) that a later execution phase can build on.

Priority is **content + design**: alongside content structure, the analysis will capture the visual design (design tokens, block styling references) so the eventual migration can match the original look.

## Scope

- **In scope:** URL discovery, page-template grouping (site catalog), per-template page structure analysis (sections, blocks, authoring decisions), block inventory, and design-token/styling capture from representative pages.
- **Out of scope (this phase):** Generating import HTML, running the bulk import script, writing/modifying blocks or CSS, navigation/footer instrumentation, pushing branches, or opening PRs.

## Approach

1. **URL discovery** — pull the full URL list from the WKND sitemap (fall back to crawling if needed).
2. **Site catalog / templates** — group discovered URLs into page templates (e.g. homepage, article/adventure detail, magazine listing, generic content) and record a representative URL per template.
3. **Per-template page analysis** — for one representative page per template, analyze content structure: sections, content sequences, default content vs. blocks, and authoring decisions.
4. **Block inventory** — survey blocks available in this project + the block collection, and note which existing blocks map to the WKND content vs. which would need new variants.
5. **Design capture** — from the homepage and one detail page, extract design tokens (colors, typography, spacing) and note block-level styling that the migration would need to match.
6. **Scope report** — consolidate findings into a single analysis/scope report summarizing templates, blocks, reusable vs. new work, and a recommended migration order.

## Checklist

- [ ] Confirm the migration workspace/site config (existing `.migration` project points to `capstone-project-ema` / `poojagit123`)
- [ ] Discover all URLs for wknd.site/us/en (sitemap-first, crawl fallback)
- [ ] Group URLs into page templates and produce a site catalog
- [ ] Select one representative URL per template for deeper analysis
- [ ] Analyze content structure per representative page (sections, sequences, default content vs. blocks, authoring decisions)
- [ ] Inventory available blocks and map WKND content to existing blocks; flag gaps needing new variants
- [ ] Capture design tokens (color, typography, spacing) and block styling references from homepage + one detail page
- [ ] Produce a consolidated analysis/scope report (templates, blocks, reuse vs. new, recommended migration order)
- [ ] Review findings with the user and decide whether to proceed to a content-import/design-migration phase

## Notes

- This plan is analysis-only and read-only by design. **Executing the actual content import and design migration requires Execute mode** and a follow-up plan built on the scope report produced here.
