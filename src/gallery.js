// Stacked-card gallery: renders project cards from src/data/works.js and manages
// the 3D stack (hero screen + one card per project).
//
// Interaction model (rebuilt from the shipped single-file behavior):
// - Wheel / arrow keys / PageUp-PageDown / Home-End / touch swipe / right-side
//   timeline dots flip through screens: hero -> project 1 -> 2 -> 3.
// - Preview state shows only the project name; on desktop, hovering (or keyboard
//   focus within) the active card reveals details, on touch devices tapping the
//   active card toggles them (CSS :hover/:focus-within + .is-open class).
// - Top progress bar + "01 / 03" counter track position.
// - Emits `portfolio-scroll` (detail: 0..1) so the Three.js background can fly
//   the camera through the tunnel in sync.

import { works } from './data/works.js';
import { getLanguage, t, onLanguageChange } from './i18n.js';

const EXTERNAL_ICON =
  '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M14 4h6v6M20 4l-9 9M18 13v6a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>';

function cardHtml(work, index, language) {
  const facts = work.facts
    .map((fact) => `<li>${fact[language]}</li>`)
    .join('');
  const links = [];
  if (work.link) {
    links.push(`<a class="project-link" href="${work.link.href}" target="_blank" rel="noopener">${work.link.label[language]} ${EXTERNAL_ICON}</a>`);
  }
  if (work.website) {
    links.push(`<a class="project-link secondary" href="${work.website.href}" target="_blank" rel="noopener">${work.website.label[language]} ${EXTERNAL_ICON}</a>`);
  }
  const action =
    links.length > 0
      ? links.join('')
      : `<span class="private-note">${work.privateNote[language]}</span>`;
  return `
    <div class="project-shell">
      <article class="project-card" tabindex="0" aria-label="${work.name[language]}">
        <div class="project-copy">
          <div class="project-topline">
            <span class="project-index">${String(index + 1).padStart(2, '0')}</span>
            <span class="date">${work.date[language]}</span>
          </div>
          <h2>${work.name[language]}</h2>
          <p class="tagline">${work.description[language]}</p>
          <ul class="facts" aria-label="${t('projectFeatures')}">${facts}</ul>
          <div class="actions">${action}</div>
        </div>
        <div class="project-visual" aria-hidden="true">
          <div class="visual-stage">
            <span class="preview-tag">${work.previewLabel[language]}</span>
            <figure class="project-shot ${work.shot.kind}">
              <img src="${work.shot.src}" alt="${work.alt[language]}" loading="lazy" />
            </figure>
          </div>
          <p class="visual-caption">${work.caption[language]}</p>
        </div>
      </article>
    </div>`;
}

export function initGallery() {
  const hero = document.getElementById('screen-hero');
  const stack = document.getElementById('stack');
  const progress = document.getElementById('progress');
  const counter = document.getElementById('stack-counter');
  const guide = document.querySelector('.gallery-guide');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const touchLike = matchMedia('(hover: none)');

  // Render one chapter per project.
  stack.innerHTML = works
    .map(
      (work, index) => `
      <section class="chapter" id="chapter-${work.id}" data-project="${work.id}" aria-roledescription="slide" aria-label="${work.name[getLanguage()]}">
        ${cardHtml(work, index, getLanguage())}
      </section>`
    )
    .join('');

  const chapters = [...stack.querySelectorAll('.chapter[data-project]')];
  const navButtons = [...document.querySelectorAll('.timeline-nav button')];
  const screens = ['hero', ...works.map((work) => work.id)];

  let active = -1; // -1 = hero, 0..n-1 = project index
  let wheelTotal = 0;
  let locked = false;
  let touchStartY = 0;

  // The add-project drawer (projectForm.js) toggles this class on <body>;
  // while it is open the gallery must not steal wheel / keys / swipes.
  const drawerOpen = () => document.body.classList.contains('add-project-open');

  const scrollPosition = () => (active + 1) / works.length; // hero=0 .. last=1

  function announcePosition() {
    counter.textContent =
      active < 0
        ? `00 / ${String(works.length).padStart(2, '0')}`
        : `${String(active + 1).padStart(2, '0')} / ${String(works.length).padStart(2, '0')}`;
    progress.style.transform = `scaleX(${scrollPosition()})`;
  }

  function renderStack() {
    const onHero = active < 0;
    hero.classList.toggle('is-active', onHero);
    hero.setAttribute('aria-hidden', onHero ? 'false' : 'true');
    document.body.classList.toggle('is-hero', onHero);
    if (guide) guide.classList.toggle('is-hidden', onHero);

    chapters.forEach((chapter, index) => {
      const relative = index - active;
      const card = chapter.querySelector('.project-card');
      const links = chapter.querySelectorAll('a, button');
      chapter.classList.toggle('is-active', relative === 0);
      chapter.classList.toggle('is-behind', relative > 0);
      chapter.classList.toggle('is-past', relative < 0);
      chapter.style.zIndex = String(relative < 0 ? 0 : chapters.length - relative);

      if (relative < 0) {
        chapter.style.transform = `translate3d(0, -64%, ${reduced ? 0 : 90}px) rotateX(${reduced ? 0 : 58}deg) scale(.94)`;
        chapter.style.opacity = '0';
      } else {
        const offset = innerWidth <= 760 ? 18 : 34;
        const depth = reduced ? 0 : relative * -76;
        const scale = 1 - relative * 0.032;
        chapter.style.transform = `translate3d(0, ${relative * offset}px, ${depth}px) rotateX(${reduced ? 0 : relative * -1.8}deg) scale(${scale})`;
        chapter.style.opacity = String(Math.max(0.44, 1 - relative * 0.2));
      }

      chapter.setAttribute('aria-hidden', relative === 0 ? 'false' : 'true');
      card.tabIndex = relative === 0 ? 0 : -1;
      if (relative !== 0) card.classList.remove('is-open');
      links.forEach((link) => {
        link.tabIndex = relative === 0 ? 0 : -1;
      });
    });

    navButtons.forEach((button) => {
      const target = button.dataset.target;
      const targetIndex = screens.indexOf(target) - 1; // hero -> -1
      button.setAttribute('aria-current', targetIndex === active ? 'true' : 'false');
    });

    announcePosition();
    window.dispatchEvent(new CustomEvent('portfolio-scroll', { detail: scrollPosition() }));
  }

  function edgeBump() {
    const target = active < 0 ? hero : chapters[active];
    target.classList.remove('edge-bump');
    void target.offsetWidth;
    target.classList.add('edge-bump');
    setTimeout(() => target.classList.remove('edge-bump'), 300);
  }

  function setActive(next) {
    const clamped = Math.max(-1, Math.min(works.length - 1, next));
    if (clamped === active) {
      edgeBump();
      return;
    }
    active = clamped;
    renderStack();
  }

  function goToTarget(target) {
    setActive(screens.indexOf(target) - 1);
  }

  navButtons.forEach((button) => {
    button.addEventListener('click', () => goToTarget(button.dataset.target));
  });

  const startButton = document.getElementById('start-browsing');
  if (startButton) startButton.addEventListener('click', () => setActive(0));
  const scrollCue = document.getElementById('scroll-cue');
  if (scrollCue) scrollCue.addEventListener('click', () => setActive(0));

  function bindCardInteractions(chapter, index) {
    const card = chapter.querySelector('.project-card');
    card.addEventListener('click', (event) => {
      if (index !== active || event.target.closest('a, button') || !touchLike.matches) return;
      card.classList.toggle('is-open');
    });
    card.addEventListener('keydown', (event) => {
      if (index !== active || !['Enter', ' '].includes(event.key) || event.target.closest('a, button')) return;
      event.preventDefault();
      card.classList.toggle('is-open');
    });
  }

  // Touch devices: tap the active card to expand / collapse details.
  chapters.forEach((chapter, index) => bindCardInteractions(chapter, index));

  addEventListener(
    'wheel',
    (event) => {
      if (drawerOpen()) return;
      if (Math.abs(event.deltaY) < Math.abs(event.deltaX)) return;
      event.preventDefault();
      if (locked) return;
      wheelTotal += event.deltaY;
      if (Math.abs(wheelTotal) < 46) return;
      const direction = wheelTotal > 0 ? 1 : -1;
      wheelTotal = 0;
      locked = true;
      setActive(active + direction);
      setTimeout(() => {
        locked = false;
      }, reduced ? 120 : 620);
    },
    { passive: false }
  );

  addEventListener('touchstart', (event) => {
    touchStartY = event.changedTouches[0].clientY;
  }, { passive: true });
  addEventListener('touchend', (event) => {
    if (drawerOpen()) return;
    const delta = touchStartY - event.changedTouches[0].clientY;
    if (Math.abs(delta) > 56) setActive(active + (delta > 0 ? 1 : -1));
  }, { passive: true });

  addEventListener('keydown', (event) => {
    if (event.target.closest('a, button, input, textarea, select, [contenteditable]')) return;
    if (drawerOpen()) return;
    if (['ArrowDown', 'PageDown'].includes(event.key)) {
      event.preventDefault();
      setActive(active + 1);
    } else if (['ArrowUp', 'PageUp'].includes(event.key)) {
      event.preventDefault();
      setActive(active - 1);
    } else if (event.key === 'Home') {
      event.preventDefault();
      setActive(-1);
    } else if (event.key === 'End') {
      event.preventDefault();
      setActive(works.length - 1);
    }
  });

  addEventListener('resize', () => renderStack(), { passive: true });

  // Re-render card copy when the language changes (preserve expand state).
  onLanguageChange((language) => {
    chapters.forEach((chapter, index) => {
      const work = works[index];
      const wasOpen = chapter.querySelector('.project-card').classList.contains('is-open');
      chapter.setAttribute('aria-label', work.name[language]);
      chapter.querySelector('.project-shell').outerHTML = cardHtml(work, index, language);
      if (wasOpen) chapter.querySelector('.project-card').classList.add('is-open');
      bindCardInteractions(chapter, index);
    });
    renderStack();
  });

  renderStack();
  return { setActive, goToTarget };
}
