import { getMetadata } from '../../scripts/aem.js';
import { loadFragment } from '../fragment/fragment.js';

/**
 * loads and decorates the footer
 * @param {Element} block The footer block element
 */
export default async function decorate(block) {
  // load footer as fragment (localhost /content path first, then DA/EDS path)
  const footerMeta = getMetadata('footer');
  const footerPath = footerMeta ? new URL(footerMeta, window.location).pathname : '/footer';
  let fragment = await loadFragment('/content/footer');
  if (!fragment) fragment = await loadFragment(footerPath);

  block.textContent = '';
  const footer = document.createElement('div');
  while (fragment.firstElementChild) footer.append(fragment.firstElementChild);

  // Tag the three content sections: brand (logo + nav), social (Follow Us),
  // and legal (copyright + fine print).
  const classes = ['brand', 'social', 'legal'];
  classes.forEach((c, i) => {
    const section = footer.children[i];
    if (section) section.classList.add(`footer-${c}`);
  });

  // Footer images are authored relative to the fragment
  // (e.g. "images/wknd-logo-light.svg"); resolve to the content root so they
  // load from any page depth.
  footer.querySelectorAll('img').forEach((img) => {
    const src = img.getAttribute('src');
    if (src && !src.startsWith('/') && !src.startsWith('http') && !src.startsWith('data:')) {
      img.setAttribute('src', `/content/${src.replace(/^\.?\//, '')}`);
    }
  });

  // Mark the social list so CSS can render the icon row
  const social = footer.querySelector('.footer-social ul');
  if (social) social.classList.add('footer-social-icons');

  // Group brand + social into one top row (matches the source's single-row
  // header band: logo + nav left, Follow Us + social right).
  const brand = footer.querySelector('.footer-brand');
  const socialSection = footer.querySelector('.footer-social');
  if (brand && socialSection) {
    const topRow = document.createElement('div');
    topRow.className = 'footer-top';
    brand.replaceWith(topRow);
    topRow.append(brand, socialSection);
  }

  block.append(footer);
}
