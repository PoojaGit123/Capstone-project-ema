import decorateSocialLinks from '../social-links/social-links.js';
import { loadCSS } from '../../scripts/aem.js';

/**
 * Author-bio variant: the text cell holds a run of single-link paragraphs
 * (social icons). Group them into a real social-links block so that dedicated
 * block owns the icon markup + styling (single source of truth). Runs on the
 * `.author-bio` variant only, so the base columns block is unaffected.
 * @param {Element} block the columns block (already carrying .author-bio)
 */
function decorateAuthorBio(block) {
  // The social row is rendered by the shared social-links block, so its
  // stylesheet must be present too.
  loadCSS(`${window.hlx.codeBasePath}/blocks/social-links/social-links.css`);

  // Mirror the variant class onto the block wrapper. aem.js only adds the base
  // "columns-wrapper" (from block.classList[0]), so the contributor-card grid
  // guard — which keys off adjacent author-bio wrappers — has nothing to match
  // without this. Nested :has() is invalid CSS, so the wrapper needs a real
  // class rather than a :has(> .columns.author-bio) selector.
  const wrapper = block.closest('.columns-wrapper');
  if (wrapper) wrapper.classList.add('author-bio');

  const isSocialPara = (el) => el
    && el.tagName === 'P'
    && el.children.length === 1
    && el.firstElementChild.tagName === 'A'
    && el.textContent.trim() === el.firstElementChild.textContent.trim();

  block.querySelectorAll(':scope > div > div').forEach((cell) => {
    let run = [];
    const flush = () => {
      if (run.length >= 2) {
        // Each authored link paragraph becomes one social-links block row.
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
      if (isSocialPara(child)) run.push(child);
      else flush();
    });
    flush();
  });
}

export default function decorate(block) {
  const cols = [...block.firstElementChild.children];
  block.classList.add(`columns-${cols.length}-cols`);

  // setup image columns
  [...block.children].forEach((row) => {
    [...row.children].forEach((col) => {
      const pic = col.querySelector('picture');
      if (pic) {
        const picWrapper = pic.closest('div');
        if (picWrapper && picWrapper.children.length === 1) {
          // picture is only content in column
          picWrapper.classList.add('columns-img-col');
        }
      }
    });
  });

  // Author-bio variant (Columns (author-bio)): compose the social row.
  if (block.classList.contains('author-bio')) {
    decorateAuthorBio(block);
  }
}
