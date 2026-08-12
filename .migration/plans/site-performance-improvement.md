I'll analyze the current mobile styling before building the plan. Let me inspect the relevant block CSS and compare the source vs. our preview at mobile width.Now let me compare the source's mobile view against our preview. I'll fetch the source and inspect our preview at mobile width for the key blocks (carousel-hero, hero/featured, cards, article-list).Let me measure the source's mobile computed styles and visual layout for the key blocks (carousel, featured hero, cards, section headings).Source mobile is clear on the key layouts. Now let me capture our preview's mobile equivalent for the same blocks to identify concrete diffs.# Homepage Mobile Parity Plan

## Goal

Match the **mobile** rendering of the migrated home page (`/us/en`) to the source **https://wknd.site/us/en.html** at phone widths (measured at 390px). This is a visual-parity pass on the home page's blocks; it does not touch the performance work already banked (CLS/render-blocking/LCP) except to preserve it.

## Findings — measured source vs. preview at 390px

| Area | Source (wknd.site) | Preview (ours) | Action |
|---|---|---|---|
| **Carousel hero image ratio** | 16:9 (`1600/900`), height ≈ 219px | `3/2`, height ≈ 260px | Change mobile image `aspect-ratio` to `16 / 9` so the hero image height matches |
| **Carousel hero heading** | 36px / line-height 54px | 28px / 42px | Increase the mobile carousel `h2` size to match source |
| **Section headings** (Recent Articles, Next Adventures, Where do you want to go?) | 36px | 28px | Match the mobile section-heading size to the source's 36px |
| **Featured hero stack order** | Text block **then** image (title top 801, image top 1195) | Image **then** text (image top 670, title top 961) | Reorder the `hero-featured` variant on mobile so text sits above the image |
| Carousel CTA | `display: block` | `inline-block` | Cosmetic only (both render ~139px wide) — leave as-is unless it visibly differs |
| Cards / article list | single column | single column | Already matches — no change |

The two clear, visible mismatches are the **featured-hero stack order** (image vs. text first) and the **heading sizes** (carousel + section headings render smaller than source on mobile). The carousel image ratio is a subtler height difference.

## Approach

1. **Carousel hero image** — in `blocks/carousel-hero/carousel-hero.css`, set the mobile slide image `aspect-ratio: 16 / 9` (currently `3 / 2`) so its height (~219px at 390px) matches the source; re-check the reserved `min-height` still covers it (no CLS regression).
2. **Carousel hero heading** — bump the mobile `.carousel-hero-slide-content h2` to ~36px / 54px line-height to match source.
3. **Section headings** — align the mobile size of standalone section `h2`s (Recent Articles / Next Adventures / etc.) to the source's 36px, scoped so it doesn't disturb card titles or the page `h1`.
4. **Featured hero order** — in `blocks/hero/hero.css`, for the `.hero-featured` variant at mobile, stack content above image (e.g. `flex-direction: column` with the content row ordered first, or `order`), matching the source's text-then-image layout. Confirm the eager-loading of the first-in-page hero image (LCP) is unaffected.
5. **Verify** — re-measure the same blocks at 390px against source (heading sizes, image heights, stack order), spot-check 360px and 414px, confirm no desktop/tablet regression at 900px+, and confirm CLS stays ~0.
6. **Lint** — run `npm run lint` (CSS).

## Checklist

- [x] Measure source mobile layout/styles at 390px (carousel, featured hero, section headings, cards)
- [x] Measure preview mobile layout/styles at 390px and diff against source
- [ ] Set carousel hero mobile image `aspect-ratio: 16 / 9` and re-verify reserved height (no CLS regression)
- [ ] Increase mobile carousel `h2` to ~36px / 54px to match source
- [ ] Match mobile section-heading (`h2`) size to source's 36px, scoped to standalone section headings
- [ ] Reorder the `hero-featured` variant on mobile so text sits above the image (match source)
- [ ] Confirm the featured hero's LCP image is still eager-loaded after the reorder
- [ ] Re-measure at 390px vs source; spot-check 360px + 414px; confirm no regression at ≥900px
- [ ] Confirm CLS remains ~0 on mobile after the changes
- [ ] Run `npm run lint` (CSS) clean
- [ ] Report the before/after comparison to the user

## Notes

- Scope is the home page's blocks (`carousel-hero`, `hero-featured`) and the shared section-heading rule in `styles/styles.css`. Changes are CSS-only and mobile-scoped (`< 900px`), so desktop/tablet parity and the performance fixes are preserved.
- Making the edits, linting, and any verification screenshots **require Execute mode** — this plan-mode pass only recorded the measured diffs and the fix approach.
- All measurements are from the local preview at 390px against the live source; a final eyeball at a couple of nearby phone widths is included to avoid over-fitting to one viewport.
