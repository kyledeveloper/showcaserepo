// Add-project entry panel: an in-page drawer (no navigation) next to the
// gallery heading. Two entry modes:
//
// - "From GitHub": paste a repository URL, hit "Fetch info", and the panel
//   pulls name / description / homepage / topics from the public GitHub REST
//   API (no auth) and prefills the form below.
// - "Manual": enter everything by hand for projects that are not on GitHub.
//
// Submitting renders a live draft-card preview and dispatches
// `gallery-add-project` (detail: { draft }) on window — the future backend
// will listen for that event and call createWork() in src/api/client.js.
//
// The button is visible by default. A minimal role hook remains for the
// future owner/viewer auth: `setGalleryViewerRole('viewer')` hides it again.

import { t, onLanguageChange } from './i18n.js';

const GITHUB_API = 'https://api.github.com/repos';

function parseGithubRepository(value) {
  const trimmed = value.trim();
  if (!trimmed) return null;
  // Tolerate pasting "github.com/owner/repo" without a scheme.
  const withScheme = /^[a-z][a-z0-9+.-]*:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  try {
    const parsed = new URL(withScheme);
    if (!['github.com', 'www.github.com'].includes(parsed.hostname.toLowerCase())) return null;
    const [owner, rawRepo] = parsed.pathname.split('/').filter(Boolean);
    if (!owner || !rawRepo) return null;
    const repo = rawRepo.replace(/\.git$/i, '');
    if (!repo) return null;
    return { owner, repo, url: `https://github.com/${owner}/${repo}` };
  } catch {
    return null;
  }
}

function prettifyRepoName(repo) {
  return repo
    .replace(/[-_]+/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function fill(template, values) {
  return Object.entries(values).reduce(
    (text, [key, value]) => text.replaceAll(`{${key}}`, value),
    template
  );
}

export function initProjectForm() {
  const openButton = document.getElementById('add-project-button');
  const drawer = document.getElementById('project-drawer');
  if (!openButton || !drawer) return;

  const backdrop = document.getElementById('project-drawer-backdrop');
  const closeButton = document.getElementById('project-drawer-close');
  const form = document.getElementById('project-form');
  const sourceTabs = [...drawer.querySelectorAll('.source-tab')];
  const githubPanel = document.getElementById('github-source-panel');
  const githubUrl = document.getElementById('github-url');
  const fetchButton = document.getElementById('github-fetch-button');
  const githubStatus = document.getElementById('github-status');
  const projectName = document.getElementById('project-name');
  const projectDate = document.getElementById('project-date');
  const projectDescription = document.getElementById('project-description');
  const projectSourceUrl = document.getElementById('project-source-url');
  const projectWebsiteUrl = document.getElementById('project-website-url');
  const projectTags = document.getElementById('project-tags');
  const draftPreview = document.getElementById('draft-preview');
  const draftPreviewName = document.getElementById('draft-preview-name');
  const draftPreviewDescription = document.getElementById('draft-preview-description');
  const draftPreviewLinks = document.getElementById('draft-preview-links');
  const backgroundNodes = [
    document.querySelector('main'),
    document.querySelector('.gallery-guide'),
    document.querySelector('.timeline-nav'),
    document.querySelector('.utility-controls')
  ];
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');

  let sourceMode = 'github'; // 'github' | 'manual'
  let statusState = 'waiting'; // waiting | fetching | ready | invalid | notfound | error | manual
  let statusRepo = '';
  let lastFocus = null;
  let autoProjectName = '';
  let fetchSeq = 0;

  // --- status line ---------------------------------------------------------
  const STATUS_KEYS = {
    waiting: 'githubWaiting',
    fetching: 'githubFetching',
    ready: 'githubReady',
    invalid: 'githubInvalid',
    notfound: 'githubNotFound',
    error: 'githubFetchError',
    manual: 'manualReady'
  };

  function updateStatus(state = statusState, repo = statusRepo) {
    statusState = state;
    statusRepo = repo;
    githubStatus.dataset.state =
      state === 'ready' ? 'ready' : ['invalid', 'notfound', 'error'].includes(state) ? 'error' : 'idle';
    const text = t(STATUS_KEYS[state] ?? STATUS_KEYS.waiting);
    githubStatus.textContent = state === 'ready' ? fill(text, { repo }) : text;
  }

  // --- gallery role (future owner/viewer auth hook) ------------------------
  function applyGalleryRole(role = 'owner') {
    const isOwner = role !== 'viewer';
    openButton.hidden = !isOwner;
    openButton.tabIndex = isOwner ? 0 : -1;
    openButton.setAttribute('aria-hidden', String(!isOwner));
    if (!isOwner && !drawer.hidden) closeDrawer();
  }

  // --- drawer open / close -------------------------------------------------
  function setBackgroundInert(inert) {
    backgroundNodes.forEach((node) => {
      if (node) node.inert = inert;
    });
  }

  function openDrawer() {
    lastFocus = document.activeElement;
    drawer.hidden = false;
    document.body.classList.add('add-project-open');
    setBackgroundInert(true);
    requestAnimationFrame(() => (sourceMode === 'github' ? githubUrl : projectName).focus());
  }

  function closeDrawer() {
    drawer.hidden = true;
    document.body.classList.remove('add-project-open');
    setBackgroundInert(false);
    if (lastFocus instanceof HTMLElement) lastFocus.focus();
  }

  // --- source mode tabs ----------------------------------------------------
  function setSourceMode(mode) {
    sourceMode = mode === 'manual' ? 'manual' : 'github';
    sourceTabs.forEach((tab) => {
      const selected = tab.dataset.sourceMode === sourceMode;
      tab.setAttribute('aria-selected', String(selected));
      tab.tabIndex = selected ? 0 : -1;
    });
    githubPanel.hidden = sourceMode === 'manual';
    updateStatus(sourceMode === 'manual' ? 'manual' : 'waiting');
  }

  // --- GitHub fetch --------------------------------------------------------
  async function fetchRepoInfo() {
    const repository = parseGithubRepository(githubUrl.value);
    if (!githubUrl.value.trim()) {
      updateStatus('waiting');
      return;
    }
    if (!repository) {
      updateStatus('invalid');
      return;
    }
    const seq = ++fetchSeq;
    updateStatus('fetching');
    fetchButton.disabled = true;
    try {
      const response = await fetch(`${GITHUB_API}/${repository.owner}/${repository.repo}`, {
        headers: { Accept: 'application/vnd.github+json' }
      });
      if (seq !== fetchSeq) return; // superseded by a newer fetch
      if (response.status === 404) {
        updateStatus('notfound');
        return;
      }
      if (!response.ok) throw new Error(`GitHub API ${response.status}`);
      const data = await response.json();
      applyGithubMetadata({
        name: data.name ? prettifyRepoName(data.name) : '',
        description: data.description ?? '',
        date: data.created_at ? data.created_at.slice(0, 7) : '',
        sourceUrl: data.html_url ?? repository.url,
        websiteUrl: data.homepage ?? '',
        tags: Array.isArray(data.topics) ? data.topics : []
      });
      autoProjectName = projectName.value;
      updateStatus('ready', `${repository.owner}/${repository.repo}`);
      window.dispatchEvent(
        new CustomEvent('gallery-project-github-lookup', {
          detail: { ...repository, metadata: data }
        })
      );
    } catch {
      if (seq !== fetchSeq) return;
      updateStatus('error');
    } finally {
      fetchButton.disabled = false;
    }
  }

  // Prefill form fields from GitHub metadata. Only fills fields the user has
  // not already edited (except sourceUrl, which is authoritative).
  function applyGithubMetadata(metadata = {}) {
    if (metadata.name && (!projectName.value || projectName.value === autoProjectName)) {
      autoProjectName = metadata.name;
      projectName.value = metadata.name;
    }
    if (metadata.description && !projectDescription.value) {
      projectDescription.value = metadata.description;
    }
    if (metadata.sourceUrl) projectSourceUrl.value = metadata.sourceUrl;
    if (metadata.websiteUrl && !projectWebsiteUrl.value) {
      projectWebsiteUrl.value = metadata.websiteUrl;
    }
    if (Array.isArray(metadata.tags) && metadata.tags.length && !projectTags.value) {
      projectTags.value = metadata.tags.join(', ');
    }
    if (metadata.date && !projectDate.value) projectDate.value = metadata.date;
  }

  // --- draft preview + submit ----------------------------------------------
  function getDraft() {
    return {
      sourceMode,
      githubUrl: githubUrl.value.trim(),
      name: projectName.value.trim(),
      date: projectDate.value,
      description: projectDescription.value.trim(),
      sourceUrl: projectSourceUrl.value.trim(),
      websiteUrl: projectWebsiteUrl.value.trim(),
      tags: projectTags.value.split(',').map((tag) => tag.trim()).filter(Boolean)
    };
  }

  function renderDraftPreview({ scroll = true } = {}) {
    const draft = getDraft();
    draftPreviewName.textContent = draft.name || t('untitledProject');
    draftPreviewDescription.textContent = draft.description || t('emptyDescription');
    draftPreviewLinks.replaceChildren();
    draft.tags.forEach((tag) => {
      const item = document.createElement('span');
      item.textContent = tag;
      draftPreviewLinks.append(item);
    });
    if (draft.sourceUrl) {
      const item = document.createElement('span');
      item.textContent = t('sourceLinkPreview');
      draftPreviewLinks.append(item);
    }
    if (draft.websiteUrl) {
      const item = document.createElement('span');
      item.textContent = t('websiteLinkPreview');
      draftPreviewLinks.append(item);
    }
    draftPreview.hidden = false;
    if (scroll) {
      draftPreview.scrollIntoView({ behavior: reducedMotion.matches ? 'auto' : 'smooth', block: 'nearest' });
    }
  }

  // --- wiring --------------------------------------------------------------
  openButton.addEventListener('click', openDrawer);
  closeButton.addEventListener('click', closeDrawer);
  backdrop.addEventListener('click', closeDrawer);
  sourceTabs.forEach((tab) => tab.addEventListener('click', () => setSourceMode(tab.dataset.sourceMode)));
  fetchButton.addEventListener('click', fetchRepoInfo);
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    // Enter inside the GitHub URL field means "fetch", not "preview".
    if (document.activeElement === githubUrl) {
      fetchRepoInfo();
      return;
    }
    const draft = getDraft();
    renderDraftPreview();
    window.dispatchEvent(new CustomEvent('gallery-add-project', { detail: { draft } }));
  });

  drawer.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      closeDrawer();
      return;
    }
    // Arrow-key navigation between the source-method tabs (roving tabindex).
    if (['ArrowLeft', 'ArrowRight'].includes(event.key) && event.target.classList?.contains('source-tab')) {
      event.preventDefault();
      const current = sourceTabs.indexOf(event.target);
      const step = event.key === 'ArrowRight' ? 1 : -1;
      const next = sourceTabs[(current + step + sourceTabs.length) % sourceTabs.length];
      next.focus();
      setSourceMode(next.dataset.sourceMode);
      return;
    }
    if (event.key !== 'Tab') return;
    const focusable = [...drawer.querySelectorAll(
      'a[href]:not([hidden]), button:not([hidden]):not([disabled]), input:not([hidden]):not([disabled]), textarea:not([hidden]):not([disabled]), select:not([hidden]):not([disabled]), [tabindex]:not([tabindex="-1"]):not([hidden])'
    )].filter((element) => !element.closest('[hidden]'));
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  });

  onLanguageChange(() => {
    updateStatus();
    if (!draftPreview.hidden) renderDraftPreview({ scroll: false });
  });

  setSourceMode('github');
  applyGalleryRole('owner'); // visible by default; future auth can switch to 'viewer'

  // Public handles (kept for the future backend script + auth flow).
  window.setGalleryViewerRole = (role) => applyGalleryRole(role);
  window.galleryProjectFormAdapter = { open: openDrawer, close: closeDrawer, getDraft, setGithubMetadata: applyGithubMetadata };

  return { openDrawer, closeDrawer, getDraft };
}
