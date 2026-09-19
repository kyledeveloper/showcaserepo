# Code Review — showcase-site (Vite + Three.js portfolio)

- **Date:** 2026-09-19
- **Target:** `~/workspace/showcase-site/` (Vite source; remote `kyledeveloper/showcaserepo` `main`)
- **Reviewer role:** independent reviewer (did not write this code)
- **Scope:** `src/gallery.js`, `src/projectForm.js`, `src/i18n.js`, `src/theme.js`,
  `src/scene.js`, `src/main.js`, `src/data/works.js`, `src/api/client.js`,
  `index.html`, `vite.config.js`, `src/styles/main.css`, `package.json`,
  `.github/workflows/deploy.yml`, `README.md`
- **Method:** read every source file, traced the gallery paging / card-expand /
  drawer / GitHub-fetch / preview-submit flows by hand. No files were modified.

## Verdict: NEEDS REWORK

The gallery core, i18n coverage, and security posture of the new panel are
solid, but the headline new feature — the add-project drawer — is functionally
broken in one visible way: the global wheel handler hijacks scrolling while
the drawer is open, so the (scrollable) drawer panel cannot be scrolled and
pages flip behind it (B1). The same missing "drawer open" guard affects the
keyboard (M1) and touch-swipe (M2) handlers. Separately, the local repo has no
`.gitignore` and has `node_modules/` committed (M3), and the README documents
a GitHub Actions deploy flow that does not exist in the remote repo (M4).
All of these have small, concrete fixes listed below.

---

## Blockers

### B1 — Global wheel handler hijacks the drawer; drawer panel can't be scrolled
- **File:** `src/gallery.js:190-206` (`addEventListener('wheel', …)`)
- **What's wrong:** The wheel listener is registered on `window`, calls
  `event.preventDefault()` for every vertical wheel event, and flips gallery
  chapters. It has no guard for the add-project drawer being open. But the
  drawer panel is scrollable (`.project-drawer-panel { overflow-y: auto; … }`,
  `src/styles/main.css:844-847`) and the form is long enough to need scrolling
  on smaller viewports. Result: (a) the drawer can never be scrolled with the
  wheel, and (b) attempting to scroll flips the gallery chapters behind the
  open drawer.
- **Fix:** Bail out early when the drawer is open. `projectForm.js` already
  toggles `document.body.classList.add('add-project-open')` on open/close, so
  at the top of the wheel handler (and see M1/M2) add:
  ```js
  if (document.body.classList.contains('add-project-open')) return;
  ```

## Major

### M1 — Arrow/PageUp/PageDown/Home/End keys fire while typing in the drawer
- **File:** `src/gallery.js:218-233`
- **What's wrong:** The global keydown guard is
  `if (event.target.closest('a, button')) return;` — it does not exclude
  `input`, `textarea`, or `select`. Pressing ArrowDown/PageDown inside the
  project-description textarea (or any drawer field) flips the gallery page
  behind the drawer.
- **Fix:** Extend the guard:
  ```js
  if (event.target.closest('a, button, input, textarea, select, [contenteditable]')) return;
  if (document.body.classList.contains('add-project-open')) return;
  ```

### M2 — Touch-swipe page flips fire while the drawer is open
- **File:** `src/gallery.js:208-216` (`touchstart`/`touchend` on window)
- **What's wrong:** Same missing drawer-open guard as B1/M1 — swiping inside
  the drawer on mobile changes the gallery page behind it.
- **Fix:** Same `add-project-open` early return.

### M3 — No `.gitignore`; `node_modules/`, `dist/`, `extracted/` committed locally
- **File:** repo root (`~/workspace/showcase-site/`), local commit `e4989ea`
- **What's wrong:** There is no `.gitignore`. `git ls-files` shows 1555
  tracked files: **1528 under `node_modules/`**, 6 under `dist/`, 3 under
  `extracted/` (a leftover intermediate from the refactor). Consequences:
  the local repo (the going-forward source of truth) is bloated; any future
  `git add -A` re-captures build output; and the API-based push helper would
  attempt 1500+ blob creations on the next push containing these paths.
  (The remote `main` is clean only because the push used a tarball that
  excluded these dirs — the local history still carries them.)
- **Fix:**
  ```bash
  printf 'node_modules/\ndist/\nextracted/\n.DS_Store\n' > .gitignore
  git rm -r --cached node_modules dist extracted
  git add .gitignore
  git commit -m "Add .gitignore; stop tracking node_modules, dist, and extracted/"
  ```

### M4 — README documents a deploy flow that doesn't exist
- **File:** `README.md:106-110`
- **What's wrong:** The "部署" section says `.github/workflows/deploy.yml`
  auto-deploys on push to `main` via GitHub Actions (Source = "GitHub
  Actions"). In reality the workflow file was never pushed to the remote repo
  (the token lacks `workflow` scope, so GitHub rejects workflow-file writes),
  and the live flow is: local `npm run build` → built files pushed to the
  `gh-pages` branch → Pages source = `gh-pages` (legacy). Following the README
  will mislead the next person deploying.
- **Fix:** Rewrite the section to describe the actual flow (build locally,
  update the `gh-pages` branch, Pages serves it), and note the workflow file
  as a future option once `workflow` scope is granted.

## Minor

### m1 — Dead CSS from the mockup era (~17 rules)
- **File:** `src/styles/main.css`
- **What's wrong:** `.phone`, `.latte-card`, `.cup`, `.coffee`, `.screen-head`,
  `.latte-meta` are defined but never referenced in `index.html` or any JS —
  leftovers from when screenshots were CSS mockups; real `.jpg` assets are
  used now.
- **Fix:** Delete those rule blocks.

### m2 — Dead exports / dead i18n keys
- **Files:** `src/data/works.js:8` (`export const PROJECT_IDS` — never
  imported), `src/theme.js:15` (`export function getTheme` — never called),
  `src/i18n.js:22,80` (`projectLabel` key — never used via `t()` or
  `data-i18n`).
- **Fix:** Remove them (or keep `getTheme` if a near-term use is planned —
  say so in a comment).

### m3 — Enter in the GitHub URL field submits the form instead of fetching
- **Files:** `index.html` (github-url input inside `#project-form`),
  `src/projectForm.js:247-252`
- **What's wrong:** The "获取信息" button is `type="button"`, so pressing
  Enter in the URL field triggers the form's submit handler → renders the
  draft preview and dispatches `gallery-add-project`, instead of fetching repo
  info. Users will expect Enter = fetch.
- **Fix:** In the submit handler, if `document.activeElement === githubUrl`
  (or the URL field is non-empty and no fetch has succeeded for it), call
  `fetchRepoInfo()` instead of previewing.

### m4 — Dead `metadata.date` branch
- **File:** `src/projectForm.js:214`
- **What's wrong:** `if (metadata.date) projectDate.value = metadata.date;`
  can never fire — `fetchRepoInfo` never passes `date` in the metadata object.
- **Fix:** Either pass a date (e.g. repo `created_at` year-month) or delete
  the branch.

### m5 — Focus-trap selector is narrower than the drawer needs
- **File:** `src/projectForm.js:277`
- **What's wrong:** The Tab-cycle query covers `button`, `input`, `textarea`
  only — not `select`, `a[href]`, generic `[tabindex]`, and not `:disabled`.
  It works today only because the drawer happens to contain none of those.
- **Fix:** Use a standard selector:
  ```js
  'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
  ```
  and keep the existing `[hidden]`-ancestor filter.

### m6 — Tabs use roving tabindex but have no arrow-key navigation
- **File:** `src/projectForm.js:141-148`
- **What's wrong:** `setSourceMode` sets `tabIndex` 0/-1 per the tab pattern,
  but Left/Right arrows don't move between the "GitHub import / Manual" tabs.
  Keyboard users can still Tab to the selected tab and click, so this is minor.
- **Fix:** Add ArrowLeft/ArrowRight handling in the tab keydown, or drop the
  roving tabindex and leave both tabs tabbable.

### m7 — `stackHint` copy is hover-centric on touch devices
- **File:** `src/i18n.js` (`stackHint`: '滚轮翻页 · 悬停展开' /
  'Wheel to flip · Hover to expand')
- **What's wrong:** On touch devices the card expands by tap, not hover.
- **Fix:** Swap the hint at runtime when `matchMedia('(hover: none)').matches`
  (new keys, e.g. `stackHintTouch`: '滑动翻页 · 点击展开').

### m8 — `fetchSeq` supersede guard is unreachable (and would wedge the button)
- **File:** `src/projectForm.js:161-193`
- **What's wrong:** `fetchButton.disabled = true` during fetch, and the button
  is the only caller of `fetchRepoInfo`, so `seq !== fetchSeq` can never
  happen via UI. If it ever did, the early returns skip the `finally`
  re-enable, leaving the button permanently disabled.
- **Fix:** Keep the guard but move `fetchButton.disabled = false` out of the
  `seq === fetchSeq` condition, or remove the guard as dead logic.

### m9 — WebGL fallback try/catch is too narrow
- **File:** `src/scene.js:62-72`
- **What's wrong:** Only the `WebGLRenderer` constructor is wrapped; later
  renderer calls (`setPixelRatio`, `setSize`, `render`) are outside the
  try/catch, so a context that fails lazily still throws uncaught.
- **Fix:** Minor; acceptable as-is, but a single lost-context listener
  (`canvas.addEventListener('webglcontextlost', …)`) would be more robust.

## Nits

- **n1** — `fill()` (`src/projectForm.js:38-43`) uses `String.replace` (first
  occurrence only) per placeholder. Fine for the single `{repo}` use; fragile
  if a template ever repeats a key. Consider `replaceAll`/`split().join()`.
- **n2** — `parseGithubRepository` (`src/projectForm.js:18-35`) requires an
  absolute URL; pasting `github.com/owner/repo` (no scheme) yields "invalid".
  Could prepend `https://` when no scheme is present.
- **n3** — `prettifyRepoName` title-cases on every `\b\w` — fine for
  `leaps-call` → `Leaps Call`; acronyms will look slightly off. Cosmetic.
- **n4** — CSS `.github-status::before { content: "↳"; }`
  (`src/styles/main.css:947`) is a decorative glyph, not a translatable
  string — fine, no i18n action needed.
- **n5** — Language toggle sets `textContent` to `'EN'`/`'中'`
  (`src/theme.js`) — language names, acceptable untranslated.
- **n6** — `src/api/client.js` is never imported (intentional placeholder);
  its `VITE_API_BASE ?? '/api'` default is fine. No action.

## Dimension summaries

### Correctness
Gallery paging (wheel/keys/timeline/touch), card expand (hover /
`:focus-within` / tap / Enter-Space), language re-render (state-preserving via
`outerHTML` swap + rebind — no listener leak since the old node is discarded),
and the drawer open/close/focus-trap/Escape/backdrop flows all trace
correctly. The GitHub fetch flow (parse → fetch → prefill-without-clobbering
→ status line → draft preview → `gallery-add-project` event) is logically
sound. The real defects are the missing drawer-open guards (B1/M1/M2) and the
Enter-key UX quirk (m3).

### Security — PASS (no XSS)
- Every user-controlled render path uses safe sinks: draft preview via
  `textContent`/`createElement` (`projectForm.js:230-246`); GitHub API data
  assigned via `.value` on inputs (`applyGithubMetadata`); status line via
  `textContent`. No `innerHTML` touches user data (the only `innerHTML` uses
  are static SVG icons and the trusted static `works.js` card template).
- `parseGithubRepository` is strict: exact hostname allowlist
  (`github.com`, `www.github.com` — no subdomain bypass like
  `github.com.evil.com`), `new URL` rejects `javascript:`/`data:` schemes
  (empty hostname → null), and the fetch URL is built only from validated
  path segments against `https://api.github.com`.
- All `target="_blank"` links carry `rel="noopener"` (`gallery.js:30-35`).
- Note for the future backend: `gallery-add-project` detail carries raw
  user input — `normalizeDraft` (per the `client.js` comment) must escape on
  render server-side. Nothing to fix in this repo today.

### i18n — PASS
Every user-visible string goes through the zh/en dictionary: static copy via
`data-i18n`/`data-i18n-aria-label`/`data-i18n-placeholder`
(`applyStaticCopy`), dynamic copy via `t()`, drawer status/preview re-render
on language change, `document.title` and `<html lang>` updated. Hardcoded
fallbacks in `index.html` match the dictionary defaults. Only dead key found:
`projectLabel` (m2). Touch-specific hint wording flagged (m7).

### Accessibility — GOOD with noted gaps
Present and correct: dialog semantics (`role="dialog"`, `aria-modal`,
`aria-labelledby`), focus trap with wrap-around, Escape + backdrop close,
background `inert`, focus save/restore, `aria-live` status + counter,
bilingual `alt` texts, `aria-hidden` + `tabIndex=-1` on inactive chapters,
`visibility:hidden` on the inactive hero (so its buttons leave the tab order),
visible `:focus-visible` outlines, and `prefers-reduced-motion` handling in
gallery, scene (single static frame), and drawer scrolling. Gaps: M1/M2/M5/M6/M7.

### Build / config — PASS with one docs caveat
- `vite.config.js`: `base: '/showcaserepo/'` is correct for project Pages;
  `assetsInlineLimit: 0` keeps screenshots as files; `target: 'es2020'`
  covers `??`/`import.meta.env`. Build passes.
- `package.json`: `three@^0.186.0` + `vite@^8.3.0`; scripts are minimal and
  correct. (Vite 8 needs Node ≥ 20.19 — the workflow pins `node-version: 20`,
  which resolves to latest 20.x, so fine.)
- `.github/workflows/deploy.yml`: syntactically correct Actions flow
  (checkout → setup-node with npm cache → `npm ci` → build →
  upload-pages-artifact → deploy-pages; permissions `contents: read`,
  `pages: write`, `id-token: write`). **Caveat:** the file is not in the
  remote repo (token lacks `workflow` scope), so this flow is aspirational
  until then — see M4.

## What's good (worth keeping)
- Clean module split (`gallery`/`scene`/`i18n`/`theme`/`projectForm`/
  `api/client`) with honest placeholder boundaries for the future backend.
- Prefill-without-clobbering in `applyGithubMetadata` (respects user edits)
  is a thoughtful touch.
- `aria-hidden` + roving `tabIndex` in the 3D stack, and reading the live DOM
  theme as the scene's initial tint (working around init-order), show care.

## Suggested fix order
1. B1 + M1 + M2 — drawer-open guards (one shared helper, ~5 lines).
2. M3 — `.gitignore` + untrack junk dirs.
3. M4 — rewrite README deploy section to match reality.
4. m3, m5, m6, m7 — drawer UX/a11y polish.
5. m1, m2, m4, m8 — dead-code cleanup.
