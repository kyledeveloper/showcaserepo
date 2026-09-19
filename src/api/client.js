// Backend API client — PLACEHOLDER for the future dynamic site.
//
// The gallery currently renders from the static list in src/data/works.js.
// When the backend exists (user accounts, work uploads), wire these functions
// up and replace the static import in src/gallery.js with `listWorks()`.
//
// Conventions assumed here (adjust to the real backend when it lands):
// - Base URL from the `VITE_API_BASE` env var, defaulting to same-origin `/api`.
// - JSON REST over fetch; auth via HttpOnly session cookie set by login/register.
// - Images uploaded via multipart/form-data; the server returns a public URL.

const API_BASE = import.meta.env.VITE_API_BASE ?? '/api';

function notImplemented(name) {
  // Deliberately loud: calling a stub during development should fail fast.
  throw new Error(`[api] ${name} is not implemented — connect a backend first (see README.md).`);
}

async function request(path, { method = 'GET', body, headers = {} } = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    method,
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: body === undefined ? undefined : JSON.stringify(body)
  });
  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw new Error(`[api] ${method} ${path} -> ${response.status} ${text}`);
  }
  return response.status === 204 ? null : response.json();
}

// --- Auth ------------------------------------------------------------------
// POST /api/auth/register { name, email, password } -> { user }
export async function register(/* { name, email, password } */) {
  notImplemented('register');
  // return request('/auth/register', { method: 'POST', body: { name, email, password } });
}

// POST /api/auth/login { email, password } -> { user } (sets session cookie)
export async function login(/* { email, password } */) {
  notImplemented('login');
  // return request('/auth/login', { method: 'POST', body: { email, password } });
}

// POST /api/auth/logout -> 204
export async function logout() {
  notImplemented('logout');
  // return request('/auth/logout', { method: 'POST' });
}

// GET /api/auth/me -> { user } | 401
export async function currentUser() {
  notImplemented('currentUser');
  // return request('/auth/me');
}

// --- Works -----------------------------------------------------------------
// GET /api/works -> { works: Work[] }
// Work shape mirrors src/data/works.js:
// { id, date: {zh,en}, name: {zh,en}, description: {zh,en},
//   facts: [{zh,en}], link?: { href, label: {zh,en} },
//   website?: { href, label: {zh,en} }, privateNote?: {zh,en},
//   imageUrl, alt: {zh,en}, caption: {zh,en} }
export async function listWorks() {
  notImplemented('listWorks');
  // return request('/works');
}

// POST /api/works { ...work fields } -> { work } (auth required)
//
// FRONTEND HOOK: src/projectForm.js already collects new-project drafts and
// dispatches `gallery-add-project` on window with `detail: { draft }`, where
// draft = { sourceMode: 'github'|'manual', githubUrl, name, date, description,
// sourceUrl, websiteUrl, tags: string[] }. When the backend lands, wire it up:
//   window.addEventListener('gallery-add-project', (event) => {
//     createWork(normalizeDraft(event.detail.draft));
//   });
// normalizeDraft maps the flat draft to the Work shape above (splitting
// name/description into {zh,en} fields, tags into facts, etc.).
export async function createWork(/* work */) {
  notImplemented('createWork');
  // return request('/works', { method: 'POST', body: work });
}

// PATCH /api/works/:id { ...partial work } -> { work } (auth required)
export async function updateWork(/* id, patch */) {
  notImplemented('updateWork');
  // return request(`/works/${id}`, { method: 'PATCH', body: patch });
}

// DELETE /api/works/:id -> 204 (auth required)
export async function deleteWork(/* id */) {
  notImplemented('deleteWork');
  // return request(`/works/${id}`, { method: 'DELETE' });
}

// --- Image upload ----------------------------------------------------------
// POST /api/uploads (multipart: file) -> { url }
// Upload the screenshot first, then pass the returned URL as `imageUrl`
// when creating/updating a work.
export async function uploadImage(/* file: File */) {
  notImplemented('uploadImage');
  // const form = new FormData();
  // form.append('file', file);
  // const response = await fetch(`${API_BASE}/uploads`, { method: 'POST', credentials: 'include', body: form });
  // if (!response.ok) throw new Error(`[api] upload -> ${response.status}`);
  // return response.json();
}
