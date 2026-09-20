// Stacked-card gallery: renders project cards from src/data/works.js and manages
// the 3D stack (hero screen + one card per project).
//
// Interaction model (rebuilt from the shipped single-file behavior):
// - Wheel / arrow keys / PageUp-PageDown / Home-End / touch swipe / right-side
//   timeline dots flip through screens: hero -> project 1 -> 2 -> ... (one dot per work).
// - Preview state shows only the project name; on desktop, hovering (or keyboard
//   focus within) the active card reveals details, on touch devices tapping the
//   active card toggles them (CSS :hover/:focus-within + .is-open class).
// - Top progress bar + "01 / 04" counter track position.
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
          <div class="project-details">
            <p class="tagline">${work.description[language]}</p>
            <ul class="facts" aria-label="${t('projectFeatures')}">${facts}</ul>
            <div class="actions">${action}</div>
          </div>
          <span class="tap-hint" aria-hidden="true"><svg viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M4 6l4 4 4-4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>${t('expandHint')}</span>
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
  const screens = ['hero', ...works.map((work) => work.id)];

  // Timeline dots: one per screen (hero + each project), generated from data so
  // newly added projects automatically get a dot. Labels refresh on language change.
  const nav = document.querySelector('.timeline-nav');
  function renderNavDots(language) {
    nav.innerHTML = '';
    const dots = [
      { target: 'hero', label: t('goStart') },
      ...works.map((work) => ({ target: work.id, label: `${t('goTo')} ${work.name[language]}` }))
    ];
    dots.forEach(({ target, label }) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.dataset.target = target;
      button.dataset.label = label; // tooltip text via CSS attr(data-label)
      button.setAttribute('aria-label', label);
      button.addEventListener('click', () => goToTarget(target));
      nav.append(button);
    });
    return [...nav.querySelectorAll('button')];
  }
  let navButtons = renderNavDots(getLanguage());

  let active = -1; // -1 = hero, 0..n-1 = project index
  let wheelTotal = 0;
  let locked = false;
  let touchStartY = null; // legacy binary swipe (desktop touchscreens + reduced motion)
  let drag = null; // active drag-follow gesture (mobile only)
  let suppressNextTap = false; // set after a drag so its trailing click doesn't toggle expand

  const narrowView = () => innerWidth <= 760;
  // Drag-follow paging runs on mobile with motion enabled; everything else
  // keeps the old binary swipe jump.
  const dragPagingOn = () => narrowView() && !reduced;

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
    if (guide) {
      // Mobile: full header on the hero, slim mini bar on project screens.
      // Desktop keeps the old behavior (hidden on hero).
      const narrow = innerWidth <= 760;
      guide.classList.toggle('is-hidden', onHero && !narrow);
      guide.classList.toggle('is-mini', !onHero && narrow);
    }

    // Mobile page-turn: flat vertical slide + fade + subtle scale with an
    // expo ease (see CSS). Desktop keeps the 3D tunnel math below untouched.
    const mobileView = innerWidth <= 760;

    chapters.forEach((chapter, index) => {
      const relative = index - active;
      const card = chapter.querySelector('.project-card');
      const links = chapter.querySelectorAll('a, button');
      chapter.classList.toggle('is-active', relative === 0);
      chapter.classList.toggle('is-behind', relative > 0);
      chapter.classList.toggle('is-past', relative < 0);
      chapter.style.zIndex = String(relative < 0 ? 0 : chapters.length - relative);

      if (relative < 0) {
        if (mobileView) {
          // Past cards: slide up and fade out (no 3D flip on mobile).
          chapter.style.transform = reduced ? 'none' : 'translate3d(0, -38%, 0) scale(.96)';
          chapter.style.opacity = '0';
        } else {
          chapter.style.transform = `translate3d(0, -64%, ${reduced ? 0 : 90}px) rotateX(${reduced ? 0 : 58}deg) scale(.94)`;
          chapter.style.opacity = '0';
        }
      } else if (mobileView) {
        // At most two cards peek behind the active one; the rest stay hidden.
        if (relative === 0) {
          chapter.style.transform = 'none';
          chapter.style.opacity = '1';
        } else if (relative <= 2) {
          // 24px peek keeps the behind card's pinned name legible instead of
          // clipping it mid-glyph.
          chapter.style.transform = reduced
            ? 'none'
            : `translate3d(0, ${relative * 24}px, 0) scale(${1 - relative * 0.04})`;
          chapter.style.opacity = String(Math.max(0.3, 1 - relative * 0.3));
        } else {
          chapter.style.transform = 'none';
          chapter.style.opacity = '0';
        }
      } else {
        const offset = 34;
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

  const startButton = document.getElementById('start-browsing');
  if (startButton) startButton.addEventListener('click', () => setActive(0));
  const scrollCue = document.getElementById('scroll-cue');
  if (scrollCue) scrollCue.addEventListener('click', () => setActive(0));

  function bindCardInteractions(chapter, index) {
    const card = chapter.querySelector('.project-card');
    card.addEventListener('click', (event) => {
      // A drag-follow gesture ends with a click on some browsers — swallow it
      // so a drag never accidentally toggles the card open.
      if (suppressNextTap) {
        suppressNextTap = false;
        return;
      }
      if (index !== active || event.target.closest('a, button') || !touchLike.matches) return;
      const willOpen = !card.classList.contains('is-open');
      card.classList.toggle('is-open');
      // Touch browsers move focus into the tapped card (or a link inside it),
      // and the sticky :focus-within would keep it expanded after .is-open is
      // removed. Blur on collapse so a second tap can actually close it.
      if (!willOpen) {
        const focused = document.activeElement;
        if (focused && card.contains(focused)) focused.blur();
      }
    });
    card.addEventListener('keydown', (event) => {
      if (index !== active || !['Enter', ' '].includes(event.key) || event.target.closest('a, button')) return;
      event.preventDefault();
      const willOpen = !card.classList.contains('is-open');
      card.classList.toggle('is-open');
      // Same sticky-focus guard for touch keyboards; non-touch keyboard users
      // keep the :focus-within expand behavior untouched.
      if (!willOpen && touchLike.matches) {
        const focused = document.activeElement;
        if (focused && card.contains(focused)) focused.blur();
      }
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
      if (locked || (drag && drag.moved)) return;
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
    if (drawerOpen() || event.touches.length !== 1) {
      // A second finger mid-drag aborts the gesture and snaps back.
      if (drag && drag.moved) {
        const aborted = drag;
        drag = null;
        aborted.el.style.transition = '';
        aborted.el.style.transform = '';
        locked = false;
        renderStack();
      } else {
        drag = null;
      }
      touchStartY = null;
      return;
    }
    const startY = event.touches[0].clientY;
    if (!dragPagingOn()) {
      drag = null;
      touchStartY = startY;
      return;
    }
    // Only the hero or the active chapter can start a page drag (behind
    // chapters have pointer-events: none, so they never receive touches).
    const el = hero.classList.contains('is-active') ? hero : chapters[active];
    // Leave controls alone (timeline dots, buttons, links, utility bar) —
    // swipes starting on them fall back to the legacy binary jump below.
    if (!el || event.target.closest('a, button, nav, .utility-controls')) {
      drag = null;
      touchStartY = startY;
      return;
    }
    touchStartY = null;
    // If the touch lands in a genuinely scrollable details region, native
    // scrolling wins while it can move in the drag direction; touchmove hands
    // the gesture back to paging once the scroll edge is reached.
    let scrollEl = null;
    const card = el.querySelector ? el.querySelector('.project-card') : null;
    const details = card && event.target.closest('.project-details');
    if (details) {
      const overflowY = getComputedStyle(details).overflowY;
      if (
        (overflowY === 'auto' || overflowY === 'scroll') &&
        details.scrollHeight > details.clientHeight + 1
      ) {
        scrollEl = details;
      }
    }
    const now = performance.now();
    drag = {
      el,
      startY,
      samples: [{ y: startY, t: now }],
      height: el.getBoundingClientRect().height || innerHeight,
      moved: false,
      scrollEl,
      atStart: active <= -1,
      atEnd: active >= works.length - 1
    };
  }, { passive: true });

  addEventListener('touchmove', (event) => {
    if (!drag) return;
    const now = performance.now();
    const y = event.touches[0].clientY;
    // Scroll handoff: the gesture started inside a scrollable details area.
    // While it can move in this direction, let native scrolling handle it —
    // never hijack. At the scroll edge, convert to a page drag from here.
    if (drag.scrollEl && !drag.moved) {
      const box = drag.scrollEl;
      const dy0 = y - drag.startY;
      const canScrollUp = dy0 < 0 && box.scrollTop + box.clientHeight < box.scrollHeight - 1;
      const canScrollDown = dy0 > 0 && box.scrollTop > 1;
      if (canScrollUp || canScrollDown) return;
      drag.startY = y;
      drag.samples = [{ y, t: now }];
      drag.scrollEl = null;
    }
    const dy = y - drag.startY;
    drag.samples.push({ y, t: now });
    while (drag.samples.length > 2 && now - drag.samples[0].t > 120) drag.samples.shift();
    if (!drag.moved) {
      if (Math.abs(dy) < 10) return; // still a tap — don't hijack
      drag.moved = true;
      drag.el.style.transition = 'none'; // follow the finger 1:1
      locked = true; // block wheel paging mid-drag
    }
    event.preventDefault();
    // Resistance when dragging past the first / last screen.
    const offset = (drag.atStart && dy > 0) || (drag.atEnd && dy < 0) ? dy * 0.32 : dy;
    drag.el.style.transform = `translate3d(0, ${offset}px, 0) scale(.985)`;
  }, { passive: false });

  function finishDrag(event, cancelled) {
    const d = drag;
    drag = null;
    if (!d) return;
    locked = false;
    if (!d.moved || cancelled) {
      if (!d.moved) {
        d.el.style.transition = '';
        d.el.style.transform = '';
        return; // tap — the click handler toggles expand
      }
      // Snap back: settle noticeably quicker than a full page turn.
      d.el.style.transition = 'transform .35s cubic-bezier(.16,1,.3,1), opacity .3s ease';
      d.el.style.transform = '';
      renderStack();
      const snapEl = d.el;
      setTimeout(() => {
        // Don't clobber a newer drag's 'none' transition mid-gesture; its
        // own finishDrag manages the transition from here.
        if (!drag || drag.el !== snapEl) snapEl.style.transition = '';
      }, 400);
      return;
    }
    d.el.style.transition = '';
    d.el.style.transform = '';
    const endY = event.changedTouches[0].clientY;
    const dy = endY - d.startY;
    const first = d.samples[0];
    const last = d.samples[d.samples.length - 1];
    const velocity = last.t > first.t ? (last.y - first.y) / (last.t - first.t) : 0;
    let direction = 0;
    if (Math.abs(dy) > d.height * 0.25) {
      direction = dy < 0 ? 1 : -1; // dragged past 25% of the card
    } else if (Math.abs(velocity) > 0.55 && Math.abs(dy) > 24) {
      direction = velocity < 0 ? 1 : -1; // flick
    }
    if (direction !== 0) {
      // Clearing the inline transform above lets renderStack()'s new
      // transform animate from the finger position with the expo ease.
      setActive(active + direction);
    } else {
      renderStack(); // snap back with the expo ease
    }
    suppressNextTap = true;
    setTimeout(() => {
      suppressNextTap = false;
    }, 250);
  }

  addEventListener('touchend', (event) => {
    if (drag) {
      finishDrag(event, false);
      return;
    }
    // Legacy binary swipe jump (desktop touchscreens + reduced motion).
    if (drawerOpen() || touchStartY == null) return;
    const delta = touchStartY - event.changedTouches[0].clientY;
    touchStartY = null;
    if (Math.abs(delta) > 56) setActive(active + (delta > 0 ? 1 : -1));
  }, { passive: true });
  addEventListener('touchcancel', (event) => finishDrag(event, true), { passive: true });

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

  addEventListener('resize', () => {
    // Abandon any in-flight drag (its measurements are stale after resize).
    if (drag) {
      drag.el.style.transition = '';
      drag.el.style.transform = '';
      drag = null;
      locked = false;
    }
    renderStack();
  }, { passive: true });

  // Re-render card copy when the language changes (preserve expand state).
  onLanguageChange((language) => {
    navButtons = renderNavDots(language);
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
