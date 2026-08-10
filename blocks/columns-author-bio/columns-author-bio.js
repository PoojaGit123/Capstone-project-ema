// Inline brand-mark SVGs for the social icon tiles. The source WKND site uses
// an icon font (wknd-icon-font) that isn't available here, so we render the
// equivalent glyphs as inline SVG. Keyed by the platform detected from the
// link text/href.
const SOCIAL_ICONS = {
  facebook: '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path fill="currentColor" d="M13.5 21v-8h2.7l.4-3.1h-3.1V7.9c0-.9.25-1.5 1.55-1.5H16.7V3.6c-.29-.04-1.3-.12-2.47-.12-2.44 0-4.11 1.49-4.11 4.23v2.36H7.4V13h2.72v8z"/></svg>',
  twitter: '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path fill="currentColor" d="M21 5.9c-.66.29-1.37.49-2.12.58a3.7 3.7 0 0 0 1.62-2.04c-.71.42-1.5.73-2.34.9a3.69 3.69 0 0 0-6.29 3.36A10.47 10.47 0 0 1 4.2 4.66a3.69 3.69 0 0 0 1.14 4.92c-.6-.02-1.16-.18-1.65-.46v.05c0 1.79 1.27 3.28 2.96 3.62-.31.08-.64.13-.98.13-.24 0-.47-.02-.7-.07a3.7 3.7 0 0 0 3.45 2.56A7.4 7.4 0 0 1 3 17.48a10.44 10.44 0 0 0 5.66 1.66c6.79 0 10.5-5.62 10.5-10.5v-.48c.72-.52 1.35-1.17 1.84-1.9z"/></svg>',
  instagram: '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path fill="currentColor" d="M12 2.16c3.2 0 3.58.01 4.85.07 1.17.05 1.8.25 2.23.41.56.22.96.48 1.38.9.42.42.68.82.9 1.38.16.42.36 1.06.41 2.23.06 1.27.07 1.65.07 4.85s-.01 3.58-.07 4.85c-.05 1.17-.25 1.8-.41 2.23-.22.56-.48.96-.9 1.38-.42.42-.82.68-1.38.9-.42.16-1.06.36-2.23.41-1.27.06-1.65.07-4.85.07s-3.58-.01-4.85-.07c-1.17-.05-1.8-.25-2.23-.41a3.72 3.72 0 0 1-1.38-.9 3.72 3.72 0 0 1-.9-1.38c-.16-.42-.36-1.06-.41-2.23C2.17 15.58 2.16 15.2 2.16 12s.01-3.58.07-4.85c.05-1.17.25-1.8.41-2.23.22-.56.48-.96.9-1.38.42-.42.82-.68 1.38-.9.42-.16 1.06-.36 2.23-.41C8.42 2.17 8.8 2.16 12 2.16zm0 1.62c-3.15 0-3.52.01-4.76.07-.99.05-1.53.21-1.89.35-.47.19-.81.4-1.16.75-.35.35-.56.69-.75 1.16-.14.36-.3.9-.35 1.89-.06 1.24-.07 1.61-.07 4.76s.01 3.52.07 4.76c.05.99.21 1.53.35 1.89.19.47.4.81.75 1.16.35.35.69.56 1.16.75.36.14.9.3 1.89.35 1.24.06 1.61.07 4.76.07s3.52-.01 4.76-.07c.99-.05 1.53-.21 1.89-.35.47-.19.81-.4 1.16-.75.35-.35.56-.69.75-1.16.14-.36.3-.9.35-1.89.06-1.24.07-1.61.07-4.76s-.01-3.52-.07-4.76c-.05-.99-.21-1.53-.35-1.89a3.12 3.12 0 0 0-.75-1.16 3.12 3.12 0 0 0-1.16-.75c-.36-.14-.9-.3-1.89-.35-1.24-.06-1.61-.07-4.76-.07zm0 2.76a5.3 5.3 0 1 1 0 10.6 5.3 5.3 0 0 1 0-10.6zm0 1.62a3.68 3.68 0 1 0 0 7.36 3.68 3.68 0 0 0 0-7.36zm5.48-2.9a1.24 1.24 0 1 1 0 2.48 1.24 1.24 0 0 1 0-2.48z"/></svg>',
};

/**
 * Detect the social platform for a link from its text label or href, and
 * replace its text with the matching inline SVG icon (keeping an accessible
 * label). Falls back to leaving the text untouched for unknown platforms.
 * @param {HTMLAnchorElement} a
 */
function iconifySocialLink(a) {
  const hint = `${a.textContent} ${a.getAttribute('href') || ''}`.toLowerCase();
  const platform = Object.keys(SOCIAL_ICONS).find((p) => hint.includes(p));
  if (!platform) return;
  const label = a.textContent.trim() || platform;
  a.setAttribute('aria-label', label);
  a.classList.add(`columns-author-bio-social-${platform}`);
  a.textContent = '';
  a.insertAdjacentHTML('beforeend', SOCIAL_ICONS[platform]);
}

export default function decorate(block) {
  const cols = [...block.firstElementChild.children];
  block.classList.add(`columns-author-bio-${cols.length}-cols`);

  // setup image columns
  [...block.children].forEach((row) => {
    [...row.children].forEach((col) => {
      const pic = col.querySelector('picture');
      if (pic) {
        const picWrapper = pic.closest('div');
        if (picWrapper && picWrapper.children.length === 1) {
          // picture is only content in column
          picWrapper.classList.add('columns-author-bio-img-col');
        }
      }
    });
  });

  // group runs of consecutive single-link paragraphs (e.g. social icon links)
  // into a shared row so they render inline rather than stacked.
  const isSocialPara = (el) => el
    && el.tagName === 'P'
    && el.children.length === 1
    && el.firstElementChild.tagName === 'A'
    && el.textContent.trim() === el.firstElementChild.textContent.trim();

  block.querySelectorAll(':scope > div > div').forEach((cell) => {
    let run = [];
    const flush = () => {
      if (run.length >= 2) {
        const social = document.createElement('div');
        social.className = 'columns-author-bio-social';
        run[0].before(social);
        run.forEach((p) => {
          const a = p.querySelector('a');
          iconifySocialLink(a);
          social.append(a);
          p.remove();
        });
      }
      run = [];
    };
    [...cell.children].forEach((child) => {
      if (isSocialPara(child)) {
        run.push(child);
      } else {
        flush();
      }
    });
    flush();
  });
}
