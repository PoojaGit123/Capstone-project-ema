# Site Performance Improvement Plan

## Goal

Raise the Lighthouse performance score (currently <87) toward 100 by fixing the three flagged issues on **https://wknd.site**'s migrated equivalent (home page as the representative worst case):

- **Cumulative Layout Shift (CLS): 0.21** → target < 0.1
- **Render-blocking requests: ~790 ms est. saving** → remove fonts from the critical path
- **Speed Index: 4.0 s** → reduce by shrinking the critical path and eager work

## Status

The CLS and render-blocking items have already been implemented and verified locally. The remaining work is Speed Index / LCP tuning, cross-page verification, and deploying so the score can be re-measured on the real preview environment (local Lighthouse numbers are indicative but the CI/preview run is what counts).

## Root-cause findings (measured locally)

- **CLS** was the lazily-loaded page header. The eager stylesheet only reserved 64px; then the header's own CSS loaded (collapsing the empty header to 0px) and its content decorated (expanding to ~213px desktop / ~109px mobile). Those two jumps shoved `<main>` up then down — essentially the whole 0.21.
- **Render-blocking** was the Google Fonts `<link>` in the page head plus its two preconnects (~790 ms on the critical path).

## Approach

1. **Reserve header height at first paint** — set `min-height` on `<header>` in the eager stylesheet (mobile/desktop values), released via a `:has(.header[data-block-status='loaded'])` rule once the block decorates, so scroll-shrink still works.
2. **Hide sections until decorated** — add the standard `data-section-status` reveal rule so raw block markup doesn't paint then reflow.
3. **Reserve hero/carousel height** — `min-height` on the carousel-hero block so the LCP block doesn't reflow.
4. **Remove render-blocking fonts** — drop the Google Fonts stylesheet + preconnects from the head; self-host the woff2 subsets and load them lazily; add metric-matched fallback `@font-face` rules so fallback text occupies the web-font's space (no swap shift).
5. **Speed Index / LCP tuning** — confirm the LCP image loads eager with explicit width/height, verify no unnecessary eager JS/CSS, and check no other block reserves-then-reflows.
6. **Verify & deploy** — lint, re-measure CLS/LCP across page templates locally, then push to the feature branch and run the Lighthouse/PageSpeed check against the preview URL.

## Checklist

- [x] Diagnose the dominant CLS source using per-source layout-shift rects (identified: lazy header collapse/expand)
- [x] Reserve header height at first paint via eager `min-height`, released once the header block loads
- [x] Add the section-reveal rule (hide sections until `data-section-status="loaded"`)
- [x] Reserve carousel-hero block height to prevent hero reflow
- [x] Remove render-blocking Google Fonts link + preconnects from the page head
- [x] Self-host Asar + Source Sans Pro (woff2), load fonts lazily
- [x] Add metric-matched fallback `@font-face` rules to eliminate font-swap shift
- [x] Verify CLS locally: home ≈ 0.004 desktop / 0.013 mobile, article ≈ 0
- [x] Verify the sticky header still shrinks on scroll (no regression)
- [x] Lint the changed CSS files (clean)
- [ ] Confirm the LCP image is eager with explicit dimensions and review remaining eager JS/CSS for Speed Index
- [ ] Re-measure CLS/LCP on the other page templates (adventure detail, magazine listing, adventures listing, FAQ, about) locally
- [ ] Push the branch and run Lighthouse/PageSpeed against the preview URL to confirm the score, then iterate on any remaining flags
- [ ] Open the PR with a preview link demonstrating the change

## Notes

- Items 1–4 (CLS + render-blocking + font self-hosting) are complete and verified on the local preview. Committing, pushing, and opening the PR — plus any file edits for the remaining Speed Index/LCP tuning — **require Execute mode**; this plan-mode pass only documents the remaining steps.
- The remaining Speed Index gains are expected to be smaller than the CLS/render-blocking wins already banked; the real confirmation is the Lighthouse run against the deployed preview, since local timings differ from lab conditions.
