# Site Performance Improvement Plan

## Goal

Raise the Lighthouse performance score (currently <87) toward 100 by resolving the three flagged issues, using the migrated home page as the representative worst case:

- **Cumulative Layout Shift (CLS): 0.21** → target < 0.1
- **Render-blocking requests: ~790 ms est. saving** → move fonts off the critical path
- **Speed Index: 4.0 s** → shrink the critical path and eager work
- **LCP (unscored insight):** make the LCP image discoverable immediately, avoid lazy-loading, apply `fetchpriority=high`

## Status summary

The CLS, render-blocking, and LCP items are **implemented and verified locally**. What remains is optional Speed Index / TBT tuning, cross-template re-measurement, and deploying so the score can be confirmed under Lighthouse lab conditions (local timings are only indicative).

## Root causes found (measured via per-source layout-shift rects + network inspection)

- **CLS** — the lazily-loaded header. The eager stylesheet reserved only 64px; then the header's own CSS loaded (empty header collapsed to 0px) and its content decorated (expanded to ~213px desktop / ~109px mobile). Those two jumps shoved `<main>` up then down — essentially the whole 0.21.
- **Render-blocking** — the Google Fonts `<link>` + two preconnects in the page head (~790 ms on the critical path).
- **LCP** — the hero image was already in the HTML, but had no priority hint and could start lazy; it needed `loading="eager"` + `fetchpriority="high"` set before it is fetched.

## Approach

1. **Reserve header height at first paint** — `min-height` on `<header>` in the eager stylesheet (109px mobile / 213px desktop), released via `header:has(.header[data-block-status='loaded'])` once decorated, so the scroll-shrink still works.
2. **Hide sections until decorated** — standard `data-section-status` reveal rule so raw block markup doesn't paint then reflow.
3. **Reserve carousel-hero height** — `min-height` on the hero block so the LCP block doesn't reflow.
4. **Remove render-blocking fonts** — drop the Google Fonts stylesheet + preconnects from `head.html`; self-host Asar + Source Sans Pro (woff2), load lazily; add metric-matched fallback `@font-face` rules to eliminate font-swap shift.
5. **Prioritize the LCP image** — in `scripts.js` `loadEager()`, set `loading="eager"` + `fetchpriority="high"` on the first section's image before it is fetched; defensively eager-load the first carousel slide and a first-in-page banner hero; keep every other image lazy so only the true candidate is elevated.
6. **Speed Index / TBT tuning (remaining)** — review what runs in the eager phase, confirm nothing non-critical is loaded before LCP, and move safely-deferrable work to lazy/delayed.
7. **Verify & deploy** — lint, re-measure CLS/LCP across templates, push the branch, and run Lighthouse/PageSpeed against the preview URL; iterate on any remaining flags; open/refresh the PR with a preview link.

## Checklist

- [x] Diagnose the dominant CLS source via per-source layout-shift rects (lazy header collapse/expand)
- [x] Reserve header height at first paint via eager `min-height`, released once the header block loads
- [x] Add the section-reveal rule (hide sections until `data-section-status="loaded"`)
- [x] Reserve carousel-hero block height to prevent hero reflow
- [x] Remove render-blocking Google Fonts link + preconnects from the page head
- [x] Self-host Asar + Source Sans Pro (woff2), load fonts lazily
- [x] Add metric-matched fallback `@font-face` rules to eliminate font-swap shift
- [x] Set `loading="eager"` + `fetchpriority="high"` on the LCP image in `loadEager()` before fetch
- [x] Defensively eager-load the first carousel slide + first-in-page banner hero; keep other images lazy
- [x] Verify CLS locally: home ≈ 0 desktop / 0.013 mobile, article ≈ 0
- [x] Verify LCP image has `fetchpriority="high"` + `loading="eager"`, only 1 high-priority image per page
- [x] Verify the sticky header still shrinks on scroll (no regression)
- [x] Lint JS + CSS (full `npm run lint` clean)
- [ ] Review eager-phase work for Speed Index / TBT and defer anything non-critical to lazy/delayed
- [ ] Re-measure CLS/LCP on the remaining templates (magazine listing, adventures listing, FAQ, about)
- [ ] Push the branch and run Lighthouse/PageSpeed against the preview URL to confirm the score
- [ ] Iterate on any remaining flags surfaced by the preview run
- [ ] Open/refresh the PR with a preview link demonstrating the change

## Notes

- Items 1–5 (CLS + render-blocking + LCP) are complete and verified on the local preview; the code changes live in `styles/styles.css`, `styles/fonts.css`, `head.html`, `scripts/scripts.js`, and the `carousel-hero` / `hero` blocks. `scripts/aem.js` was intentionally not modified (project rule).
- The remaining Speed Index/TBT gains are expected to be smaller than the wins already banked. Committing, pushing, opening the PR, and any further edits **require Execute mode** — this plan-mode pass only documents the remaining steps.
- Authoritative confirmation is the Lighthouse run against the deployed preview, since lab conditions differ from local timings.
