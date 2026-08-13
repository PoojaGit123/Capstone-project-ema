import decorateSocialLinks from '../social-links/social-links.js';
import { loadCSS } from '../../scripts/aem.js';

export default function decorate(block) {
  // The author-bio's social row is rendered by the shared social-links block, so
  // its stylesheet must be present too.
  loadCSS(`${window.hlx.codeBasePath}/blocks/social-links/social-links.css`);

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
        // Render the grouped social links as a real social-links block so the
        // dedicated block owns the icon markup + styling (single source of
        // truth). Each authored link paragraph becomes one block row.
        const social = document.createElement('div');
        social.className = 'social-links block';
        social.dataset.blockName = 'social-links';
        run.forEach((p) => {
          const row = document.createElement('div');
          const cellDiv = document.createElement('div');
          cellDiv.append(p.querySelector('a'));
          row.append(cellDiv);
          social.append(row);
        });
        run[0].before(social);
        run.forEach((p) => p.remove());
        decorateSocialLinks(social);
        social.dataset.blockStatus = 'loaded';
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
