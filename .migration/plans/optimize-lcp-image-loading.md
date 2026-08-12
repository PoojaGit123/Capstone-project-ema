# LCP Optimization Plan

## Goal

Address the Lighthouse LCP insight on the migrated WKND site:

- *"Optimize LCP by making the LCP image discoverable from the HTML immediately, and avoiding lazy-loading."*
- *"`fetchpriority=high` should be applied."*

## Status

**Complete and verified across all page templates.** The code changes are in place, lint is clean, and every template was re-measured. Remaining open items are deployment-side only (push, run Lighthouse against the preview, open the PR), which require Execute mode.

## What was found & done

- **Discoverability:** the LCP image URL is already present in the initial page HTML (the hero/carousel blocks reposition columns, they don't rebuild the `<picture>`), so nothing was hiding it from the preloader.
- **Missing signal:** the LCP image had no priority hint and could start lazy. Fixed by setting `loading="eager"` + `fetchpriority="high"` on the first section's image in `scripts.js` `loadEager()`, *before* the image is fetched.
- **Defensive block-level backup:** the first carousel-hero slide and a first-in-page banner hero are also marked eager, so the LCP image is correct regardless of load order and template.
- **Surgical scope:** only the single true LCP candidate gets `fetchpriority="high"`; all other images stay lazy so the critical path isn't flooded (protects Speed Index).
- **Constraint honored:** `scripts/aem.js` was not modified (project rule); the fix lives in `scripts/scripts.js` + the `carousel-hero` / `hero` blocks.

## Verification results (local preview)

Every template shows the LCP image as `loading="eager"` + `fetchpriority="high"`, with exactly **one** high-priority image per page and no CLS regression:

| Template | CLS | LCP image |
|---|---|---|
| Home | 0 | eager + high |
| Article detail | 0 | eager + high |
| Adventure detail (banner) | 0 | eager + high |
| Magazine listing | 0 | eager + high |
| Adventures listing (tabs) | 0 | eager + high |
| FAQ | 0 | eager + high |
| About Us | 0.0008 | eager + high |

Full `npm run lint` (JS + CSS) passes clean.

## Checklist

- [x] Confirm the LCP element per template (home = carousel first slide; detail = banner hero)
- [x] Confirm the LCP image URL is already discoverable in the initial HTML (no build step hiding it)
- [x] Confirm `scripts/aem.js` must not be edited; place the fix in `scripts.js` / block JS
- [x] Set `loading="eager"` + `fetchpriority="high"` on the LCP image in `loadEager()` before fetch
- [x] Defensively eager-load the first carousel slide + first-in-page banner hero
- [x] Keep only the true LCP candidate high-priority; leave all other images lazy
- [x] Lint changed JS + CSS (`npm run lint` clean)
- [x] Verify the LCP `<img>` has `fetchpriority="high"` + `loading="eager"` on every template
- [x] Confirm exactly one high-priority image per page (critical path not flooded)
- [x] Confirm no CLS regression across all templates
- [ ] Push the branch so AEM Code Sync builds the feature preview
- [ ] Run Lighthouse/PageSpeed against the preview URL to confirm LCP improvement under lab conditions
- [ ] Open/refresh the PR with a preview link demonstrating the change
- [ ] Iterate on any residual LCP flags surfaced by the preview run

## Notes

- The implementation and local verification are finished; this plan-mode pass documents them and the remaining deployment steps.
- **Committing, pushing, opening the PR, and any further edits require Execute mode** — plan mode cannot modify files or run write commands.
- Authoritative confirmation is the Lighthouse run on the deployed preview, since lab timings differ from the local dev server. This LCP work complements the already-banked CLS (0.21 → ~0) and render-blocking-font fixes.
