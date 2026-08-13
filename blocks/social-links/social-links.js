// Inline brand-mark SVGs for the social icon tiles. The source WKND site uses
// an icon font (wknd-icon-font) that isn't available here, so we render the
// equivalent glyphs as inline SVG, keyed by the platform detected from the
// link text/href.
const SOCIAL_ICONS = {
  facebook: '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path fill="currentColor" d="M13.5 21v-8h2.7l.4-3.1h-3.1V7.9c0-.9.25-1.5 1.55-1.5H16.7V3.6c-.29-.04-1.3-.12-2.47-.12-2.44 0-4.11 1.49-4.11 4.23v2.36H7.4V13h2.72v8z"/></svg>',
  twitter: '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path fill="currentColor" d="M21 5.9c-.66.29-1.37.49-2.12.58a3.7 3.7 0 0 0 1.62-2.04c-.71.42-1.5.73-2.34.9a3.69 3.69 0 0 0-6.29 3.36A10.47 10.47 0 0 1 4.2 4.66a3.69 3.69 0 0 0 1.14 4.92c-.6-.02-1.16-.18-1.65-.46v.05c0 1.79 1.27 3.28 2.96 3.62-.31.08-.64.13-.98.13-.24 0-.47-.02-.7-.07a3.7 3.7 0 0 0 3.45 2.56A7.4 7.4 0 0 1 3 17.48a10.44 10.44 0 0 0 5.66 1.66c6.79 0 10.5-5.62 10.5-10.5v-.48c.72-.52 1.35-1.17 1.84-1.9z"/></svg>',
  instagram: '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path fill="currentColor" d="M12 2.16c3.2 0 3.58.01 4.85.07 1.17.05 1.8.25 2.23.41.56.22.96.48 1.38.9.42.42.68.82.9 1.38.16.42.36 1.06.41 2.23.06 1.27.07 1.65.07 4.85s-.01 3.58-.07 4.85c-.05 1.17-.25 1.8-.41 2.23-.22.56-.48.96-.9 1.38-.42.42-.82.68-1.38.9-.42.16-1.06.36-2.23.41-1.27.06-1.65.07-4.85.07s-3.58-.01-4.85-.07c-1.17-.05-1.8-.25-2.23-.41a3.72 3.72 0 0 1-1.38-.9 3.72 3.72 0 0 1-.9-1.38c-.16-.42-.36-1.06-.41-2.23C2.17 15.58 2.16 15.2 2.16 12s.01-3.58.07-4.85c.05-1.17.25-1.8.41-2.23.22-.56.48-.96.9-1.38.42-.42.82-.68 1.38-.9.42-.16 1.06-.36 2.23-.41C8.42 2.17 8.8 2.16 12 2.16zm0 1.62c-3.15 0-3.52.01-4.76.07-.99.05-1.53.21-1.89.35-.47.19-.81.4-1.16.75-.35.35-.56.69-.75 1.16-.14.36-.3.9-.35 1.89-.06 1.24-.07 1.61-.07 4.76s.01 3.52.07 4.76c.05.99.21 1.53.35 1.89.19.47.4.81.75 1.16.35.35.69.56 1.16.75.36.14.9.3 1.89.35 1.24.06 1.61.07 4.76.07s3.52-.01 4.76-.07c.99-.05 1.53-.21 1.89-.35.47-.19.81-.4 1.16-.75.35-.35.56-.69.75-1.16.14-.36.3-.9.35-1.89.06-1.24.07-1.61.07-4.76s-.01-3.52-.07-4.76c-.05-.99-.21-1.53-.35-1.89a3.12 3.12 0 0 0-.75-1.16 3.12 3.12 0 0 0-1.16-.75c-.36-.14-.9-.3-1.89-.35-1.24-.06-1.61-.07-4.76-.07zm0 2.76a5.3 5.3 0 1 1 0 10.6 5.3 5.3 0 0 1 0-10.6zm0 1.62a3.68 3.68 0 1 0 0 7.36 3.68 3.68 0 0 0 0-7.36zm5.48-2.9a1.24 1.24 0 1 1 0 2.48 1.24 1.24 0 0 1 0-2.48z"/></svg>',
};

/**
 * Detect the social platform for a link from its text label or href.
 * @param {HTMLAnchorElement} a
 * @returns {string|undefined} platform key, or undefined if unknown
 */
function detectPlatform(a) {
  const hint = `${a.textContent} ${a.getAttribute('href') || ''}`.toLowerCase();
  return Object.keys(SOCIAL_ICONS).find((p) => hint.includes(p));
}

/**
 * Social Links block: a row of icon tiles linking to social profiles.
 *
 * Authored structure — one link per row (label or URL identifies the platform):
 *   | Social Links        |
 *   | [Facebook](url)     |
 *   | [Twitter](url)      |
 *   | [Instagram](url)    |
 *
 * Each link becomes a dark 48x48 icon tile (source WKND styling). Unknown
 * platforms keep their text label so nothing is silently dropped.
 * @param {Element} block The block element
 */
export default function decorate(block) {
  const links = [...block.querySelectorAll('a')];

  const list = document.createElement('ul');
  list.className = 'social-links-list';

  links.forEach((a) => {
    const platform = detectPlatform(a);
    const label = a.textContent.trim() || platform || 'social link';
    a.setAttribute('aria-label', label);
    a.className = 'social-links-tile';
    if (platform) {
      a.classList.add(`social-links-${platform}`);
      a.textContent = '';
      a.insertAdjacentHTML('beforeend', SOCIAL_ICONS[platform]);
    }
    const li = document.createElement('li');
    li.append(a);
    list.append(li);
  });

  block.replaceChildren(list);
  if (!links.length) block.classList.add('social-links-empty');
}
