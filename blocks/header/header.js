import { getMetadata } from '../../scripts/aem.js';
import { loadFragment } from '../fragment/fragment.js';

// media query match that indicates desktop width
const isDesktop = window.matchMedia('(min-width: 900px)');

function closeOnEscape(e) {
  if (e.code === 'Escape') {
    const nav = document.getElementById('nav');
    const langToggle = nav.querySelector('.nav-lang[aria-expanded="true"]');
    if (langToggle) {
      langToggle.setAttribute('aria-expanded', 'false');
      langToggle.focus();
    }
  }
}

/**
 * Toggles the mobile menu open/closed.
 * @param {Element} nav
 * @param {Boolean|null} forceExpanded
 */
function toggleMenu(nav, forceExpanded = null) {
  const expanded = forceExpanded !== null
    ? !forceExpanded
    : nav.getAttribute('aria-expanded') === 'true';
  const button = nav.querySelector('.nav-hamburger button');
  document.body.style.overflowY = (expanded || isDesktop.matches) ? '' : 'hidden';
  nav.setAttribute('aria-expanded', expanded ? 'false' : 'true');
  if (button) {
    button.setAttribute('aria-label', expanded ? 'Open navigation' : 'Close navigation');
  }
}

/**
 * Collapses the header into a compact bar once the page is scrolled and
 * expands it back to full height at the top (matches the source's shrink-on-
 * scroll behavior). The page scroll container may be the body or the document,
 * so we read whichever reports a scroll offset.
 *
 * Uses hysteresis (separate enter/exit thresholds) so the state can't flip on
 * and off at the same scroll position. Without the gap, shrinking the header
 * makes the document shorter and the browser's scroll anchoring nudges the
 * scroll offset back across a single threshold, causing the header to shake.
 * The dead zone (EXIT..ENTER) is wider than the height the header loses when
 * collapsing, so that feedback loop can't happen.
 * @param {Element} header The header block element
 */
function setupScrollShrink(header) {
  const ENTER = 90; // add .scrolled once scrolled past this
  const EXIT = 10; // remove it only when back near the very top
  const getScrollTop = () => window.scrollY
    || document.documentElement.scrollTop
    || document.body.scrollTop
    || 0;
  let ticking = false;
  const update = () => {
    const y = getScrollTop();
    if (header.classList.contains('scrolled')) {
      if (y <= EXIT) header.classList.remove('scrolled');
    } else if (y >= ENTER) {
      header.classList.add('scrolled');
    }
    ticking = false;
  };
  const onScroll = () => {
    if (!ticking) {
      ticking = true;
      window.requestAnimationFrame(update);
    }
  };
  // Body is the scroll container when the page sets overflow on it; listen on
  // both so we catch whichever fires.
  window.addEventListener('scroll', onScroll, { passive: true });
  document.addEventListener('scroll', onScroll, { passive: true, capture: true });
  update();
}

/**
 * Builds the search form (form controls belong in JS, not the nav fragment).
 * @returns {HTMLElement}
 */
function buildSearch() {
  const search = document.createElement('div');
  search.className = 'nav-search';
  const form = document.createElement('form');
  form.setAttribute('role', 'search');
  form.action = '/us/en/search';
  form.innerHTML = `
    <button type="submit" class="nav-search-submit" aria-label="Search"></button>
    <input type="search" name="q" placeholder="SEARCH" aria-label="Search">
  `;
  form.addEventListener('submit', (e) => {
    const q = form.querySelector('input').value.trim();
    if (!q) e.preventDefault();
  });
  search.append(form);
  return search;
}

/**
 * loads and decorates the header, mainly the nav
 * @param {Element} block The header block element
 */
export default async function decorate(block) {
  // load nav as fragment (localhost /content path first, then DA/EDS path)
  const navMeta = getMetadata('nav');
  const navPath = navMeta ? new URL(navMeta, window.location).pathname : '/nav';
  let fragment = await loadFragment('/content/nav');
  if (!fragment) fragment = await loadFragment(navPath);

  block.textContent = '';
  const nav = document.createElement('nav');
  nav.id = 'nav';
  while (fragment.firstElementChild) nav.append(fragment.firstElementChild);

  const classes = ['brand', 'sections', 'tools'];
  classes.forEach((c, i) => {
    const section = nav.children[i];
    if (section) section.classList.add(`nav-${c}`);
  });

  // Nav images are authored with paths relative to the nav fragment
  // (e.g. "images/wknd-logo.svg"). Resolve them to the content root so they
  // work from any page depth.
  nav.querySelectorAll('img').forEach((img) => {
    const src = img.getAttribute('src');
    if (src && !src.startsWith('/') && !src.startsWith('http') && !src.startsWith('data:')) {
      img.setAttribute('src', `/content/${src.replace(/^\.?\//, '')}`);
    }
  });

  // Brand: unwrap the boilerplate button styling from the logo link
  const navBrand = nav.querySelector('.nav-brand');
  if (navBrand) {
    const brandLink = navBrand.querySelector('a.button');
    if (brandLink) {
      brandLink.className = '';
      const bc = brandLink.closest('.button-container');
      if (bc) bc.className = '';
    }
  }

  // Tools: first <p> link = Sign In; the <ul> = language/locale selector.
  // Sign In + language move to a dark utility bar (top band); search stays
  // in the main (white) bar next to the nav.
  const navTools = nav.querySelector('.nav-tools');
  const utility = document.createElement('div');
  utility.className = 'nav-utility';
  const utilityInner = document.createElement('div');
  utilityInner.className = 'nav-utility-inner';
  utility.append(utilityInner);

  if (navTools) {
    const signIn = navTools.querySelector('p a');
    if (signIn) {
      const signInWrap = signIn.parentElement;
      signInWrap.classList.add('nav-signin');
      utilityInner.append(signInWrap);
    }

    const localeList = navTools.querySelector('ul');
    if (localeList) {
      const langWrapper = document.createElement('div');
      langWrapper.className = 'nav-lang';
      langWrapper.setAttribute('aria-expanded', 'false');
      // trigger shows the current (first) locale
      const current = localeList.querySelector('li a');
      const trigger = document.createElement('button');
      trigger.type = 'button';
      trigger.className = 'nav-lang-toggle';
      trigger.setAttribute('aria-label', 'Choose language');
      trigger.innerHTML = current ? current.innerHTML : 'EN-US';
      trigger.addEventListener('click', () => {
        const open = langWrapper.getAttribute('aria-expanded') === 'true';
        langWrapper.setAttribute('aria-expanded', open ? 'false' : 'true');
      });
      localeList.classList.add('nav-lang-list');
      langWrapper.append(trigger, localeList);
      utilityInner.append(langWrapper);
    }

    // search form (built in JS) stays in the white main bar
    navTools.append(buildSearch());
  }

  // Hamburger for mobile
  const hamburger = document.createElement('div');
  hamburger.classList.add('nav-hamburger');
  hamburger.innerHTML = `<button type="button" aria-controls="nav" aria-label="Open navigation">
      <span class="nav-hamburger-icon"></span>
    </button>`;
  hamburger.addEventListener('click', () => toggleMenu(nav));
  nav.prepend(hamburger);
  nav.setAttribute('aria-expanded', 'false');

  // Reset menu / close dropdowns on breakpoint change
  const onViewportChange = () => {
    toggleMenu(nav, isDesktop.matches);
    const openLang = nav.querySelector('.nav-lang[aria-expanded="true"]');
    if (openLang) openLang.setAttribute('aria-expanded', 'false');
  };
  toggleMenu(nav, isDesktop.matches);
  isDesktop.addEventListener('change', onViewportChange);
  window.addEventListener('keydown', closeOnEscape);

  const navWrapper = document.createElement('div');
  navWrapper.className = 'nav-wrapper';
  // Dark utility bar (Sign In + language) sits above the white main bar.
  if (utilityInner.children.length) navWrapper.append(utility);
  navWrapper.append(nav);
  block.append(navWrapper);

  // Shrink the header on scroll, expand at the top (matches source).
  setupScrollShrink(block.closest('header') || block);
}
