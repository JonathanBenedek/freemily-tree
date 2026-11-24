/* ============================================================
   Family Tree — app.js
   Reads from public Google Sheets CSV.
   Writes via Google Apps Script Web App (no-cors POST).
   ============================================================ */

// ===================================================================
// STATE
// ===================================================================
const state = {
  sheetId:          localStorage.getItem('ftSheetId')          || '',
  appsScriptUrl:    localStorage.getItem('ftAppsScriptUrl')    || '',
  googleClientId:   localStorage.getItem('ftGoogleClientId')   || '',
  allowedEmail:     localStorage.getItem('ftAllowedEmail')     || '',
  googleAccessToken: null,
  googleEmail: '',
  googleName: null,
  rememberedEmail: '',     // who signed in before on this device (for "Continue as …")
  treeOpen: false,         // a tree is shown (vs. the home panel)
  discovering: false,      // looking up the signed-in person's trees in Google Drive        // { given, family, full } from Google, used to name a new tree
  editAccessSheetId: null, // sheet the signed-in person is confirmed to be able to edit
  people: [],
  layout: null,
  viewMode: 'full',
  focusedName: null,
  importMode: false,   // true when data loaded from local CSV — writes are disabled
};

// The Google sign-in pass. Clearing it (expired, signed out) also clears the
// saved copy, so a reload doesn't bring back a dead pass. See KEEP SIGNED IN.
let _googleAccessToken = null;
Object.defineProperty(state, 'googleAccessToken', {
  get: () => _googleAccessToken,
  set: (v) => { _googleAccessToken = v; if (!v) clearSavedToken(); },
  enumerable: true,
});

// Pan/Zoom
const view = { x: 0, y: 0, scale: 1, dragging: false, startX: 0, startY: 0, startVX: 0, startVY: 0 };

// Active context-menu target
let ctxTarget = null;

// ===================================================================
// DOM REFS
// ===================================================================
const $ = (id) => document.getElementById(id);

const setupScreen  = $('setup-screen');
const treeScreen   = $('tree-screen');
const sheetIdInput = $('sheet-id-input');
const scriptInput  = $('script-url-input');
const clientIdInput    = $('client-id-input');
const allowedEmailInput = $('allowed-email-input');
const loadBtn      = $('load-btn');
const setupError   = $('setup-error');
const loadingOverlay = $('loading-overlay');
const treeSvg      = $('tree-svg');
const treeRoot     = $('tree-root');

const addModal     = $('add-modal');
const formRelation = $('form-relation');
const formRelatedTo = $('form-related-to');
const formFirstName = $('form-first-name');
const formLastName  = $('form-last-name');
const formPicture   = $('form-picture');
const formComments  = $('form-comments');
const formError    = $('form-error');
const addForm      = $('add-form');

const contextMenu  = $('context-menu');
const ctxAddChild  = $('ctx-add-child');
const ctxAddSpouse = $('ctx-add-spouse');
const ctxAddParent = $('ctx-add-parent');

const detailPanel  = $('detail-panel');
const detailAvatar = $('detail-avatar');
const detailName   = $('detail-name');
const detailMeta   = $('detail-meta');
const detailComments = $('detail-comments');

const helpModal    = $('help-modal');

// Toast
const toastEl = createToast();

// ===================================================================
// INIT
// ===================================================================
document.addEventListener('DOMContentLoaded', () => {
  // Pre-fill saved values
  sheetIdInput.value  = state.sheetId;
  scriptInput.value       = state.appsScriptUrl;
  clientIdInput.value     = state.googleClientId;
  allowedEmailInput.value = state.allowedEmail;

  // Setup screen events
  loadBtn.addEventListener('click', onLoadClick);
  sheetIdInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') onLoadClick(); });

  $('show-help-link').addEventListener('click', (e) => { e.preventDefault(); showHelp(); });
  $('help-close-btn').addEventListener('click', hideHelp);
  $('help-done-btn').addEventListener('click', hideHelp);
  $('copy-script-btn').addEventListener('click', copyScript);
  helpModal.addEventListener('click', (e) => { if (e.target === helpModal) hideHelp(); });

  // "How to get a Client ID" and the guide links are wired up in onboarding.js

  $('signin-btn').addEventListener('click', onSignInClick);

  // Navbar events
  $('refresh-btn').addEventListener('click', () => { resetToFullTree(); loadTree(state.sheetId); });
  $('change-sheet-btn').addEventListener('click', showSetupScreen);
  $('back-to-full-btn').addEventListener('click', resetToFullTree);

  // Zoom controls
  $('zoom-in-btn').addEventListener('click',    () => zoom(1.25));
  $('zoom-out-btn').addEventListener('click',   () => zoom(0.8));
  $('zoom-reset-btn').addEventListener('click', () => resetView());

  // SVG pan/zoom — mouse
  treeSvg.addEventListener('wheel', onWheel, { passive: false });
  treeSvg.addEventListener('mousedown', onMouseDown);
  window.addEventListener('mousemove',  onMouseMove);
  window.addEventListener('mouseup',    onMouseUp);

  // SVG pan/zoom — touch
  treeSvg.addEventListener('touchstart',  onTouchStart,  { passive: false });
  treeSvg.addEventListener('touchmove',   onTouchMove,   { passive: false });
  treeSvg.addEventListener('touchend',    onTouchEnd,    { passive: false });

  // Add form
  addModal.addEventListener('click', (e) => { if (e.target === addModal) hideAddModal(); });
  $('modal-close-btn').addEventListener('click', hideAddModal);
  $('form-cancel-btn').addEventListener('click', hideAddModal);
  addForm.addEventListener('submit', onAddFormSubmit);

  // Edit form
  const editModal = $('edit-modal');
  editModal.addEventListener('click', (e) => { if (e.target === editModal) closeEditModal(); });
  $('edit-modal-close-btn').addEventListener('click', closeEditModal);
  $('edit-form').addEventListener('submit', onEditFormSubmit);
  $('edit-form-delete-btn').addEventListener('click', onEditFormDelete);

  // Context menu
  ctxAddChild.addEventListener('click',  () => { const t = ctxTarget; hideContextMenu(); openAddModal('child',  t); });
  ctxAddSpouse.addEventListener('click', () => { const t = ctxTarget; hideContextMenu(); openAddModal('spouse', t); });
  ctxAddParent.addEventListener('click', () => { const t = ctxTarget; hideContextMenu(); openAddModal('parent', t); });
  document.addEventListener('click', hideContextMenu);

  // Detail panel close
  $('detail-close').addEventListener('click', () => detailPanel.classList.add('hidden'));

  // Help modal
  $('help-modal').addEventListener('click', (e) => { if (e.target === helpModal) hideHelp(); });

  // Export / Import
  $('export-btn').addEventListener('click', onExportClick);
  $('import-btn').addEventListener('click', () => $('import-file-input').click());
  $('import-file-input').addEventListener('change', onImportFileChange);

  // Search
  initSearch();
  initTreeSwitcher();

  // Auto-load: URL params take priority over saved state
  const _urlParams  = new URLSearchParams(window.location.search);
  const _urlSheet   = _urlParams.get('sheet');
  const _urlApiKey  = _urlParams.get('apikey');

  if (_urlSheet) {
    state.sheetId = _urlSheet;
    if (_urlApiKey) {
      // Treat apikey as Apps Script URL if it looks like one, otherwise Client ID
      if (_urlApiKey.startsWith('https://script.google.com')) {
        state.appsScriptUrl = _urlApiKey;
      } else {
        state.googleClientId = _urlApiKey;
      }
    }
  }

  // Clean up the old setup: the built-in Client ID saved as "your own"
  if (state.googleClientId === SHARED_GOOGLE.clientId) {
    state.googleClientId = '';
    clientIdInput.value  = '';
    try { localStorage.setItem('ftGoogleClientId', ''); } catch {}
  }

  // Still signed in from a moment ago (reload / new tab)? Restore it.
  const restoredToken = restoreSavedAuth();

  if (state.sheetId) {
    showTreeScreen();
    updateSignInBtn();
    loadTree(state.sheetId, { applyParams: true }); // turns editing on quietly when signed in
    if (restoredToken && usingSharedSignIn()) discoverTrees(restoredToken).catch(() => {});
  } else {
    showWelcomeScreen(); // onboarding.js
    if (restoredToken) afterSignIn(restoredToken).catch(() => {});
  }
});

// ===================================================================
// KEEP SIGNED IN — a Google sign-in pass lasts about an hour. Save it so a
// reload or a new tab within that hour stays signed in. After it expires the
// button offers "Continue as …" (one tap; Google remembers the account).
// ===================================================================
const AUTH_KEY = 'ftAuth';

function loadSavedAuth() {
  try { return JSON.parse(localStorage.getItem(AUTH_KEY) || 'null'); } catch { return null; }
}

function saveAuth(token, expiresInSec) {
  try {
    localStorage.setItem(AUTH_KEY, JSON.stringify({
      token,
      exp: Date.now() + (Number(expiresInSec) || 3600) * 1000 - 2 * 60 * 1000, // 2 min safety margin
      clientId: effectiveClientId(),
      email: state.googleEmail || '',
      name: state.googleName || null,
    }));
  } catch {}
  state.rememberedEmail = state.googleEmail || state.rememberedEmail || '';
}

// Expired/invalid: drop the pass but keep who it was, for "Continue as …"
function clearSavedToken() {
  const a = loadSavedAuth();
  if (!a || !a.token) return;
  try { localStorage.setItem(AUTH_KEY, JSON.stringify({ ...a, token: null, exp: 0 })); } catch {}
}

// Signed out: forget everything
function forgetAuth() {
  try { localStorage.removeItem(AUTH_KEY); } catch {}
  state.rememberedEmail = '';
}

function restoreSavedAuth() {
  const a = loadSavedAuth();
  if (!a) return null;
  state.rememberedEmail = a.email || '';
  state.googleName = a.name || null;
  if (a.token && a.exp > Date.now() && a.clientId === effectiveClientId()) {
    _googleAccessToken = a.token; // set directly: nothing to clear
    state.googleEmail = a.email || '';
    return a.token;
  }
  return null;
}

function rememberedName() {
  return state.googleName?.given || (state.rememberedEmail || '').split('@')[0] || 'you';
}

// ===================================================================
// SCREEN TRANSITIONS
// ===================================================================
// ===================================================================
// MY TREES — every tree opened or created on this device
// ===================================================================
const TREES_KEY = 'ftTrees';

function getTrees() {
  try {
    const t = JSON.parse(localStorage.getItem(TREES_KEY) || '[]');
    return Array.isArray(t) ? t.filter(x => x && x.id) : [];
  } catch { return []; }
}
function saveTrees(list) {
  try { localStorage.setItem(TREES_KEY, JSON.stringify(list.slice(0, 30))); } catch {}
}

// Put a tree at the top of the list (most recent first). The saved name shows
// right away; then the current name is fetched from Google (the public CSV the
// app reads has no title), so renaming the sheet in Google shows up here too.
function rememberTree(id, title = '') {
  if (!id) return;
  const list  = getTrees();
  const known = list.find(t => t.id === id);
  const entry = { id, title: title || known?.title || '', lastOpened: Date.now() };
  saveTrees([entry, ...list.filter(t => t.id !== id)]);
  updateTreeSwitcher();
  if (title) return; // just named by the app (Create my tree)
  fetchTreeTitle(id).then(name => {
    if (!name || name === getTrees().find(t => t.id === id)?.title) return;
    saveTrees(getTrees().map(t => (t.id === id ? { ...t, title: name } : t)));
    updateTreeSwitcher();
  });
}

function forgetTree(id) {
  saveTrees(getTrees().filter(t => t.id !== id));
  updateTreeSwitcher();
}

function treeTitle(id) {
  return getTrees().find(t => t.id === id)?.title || 'Family Tree';
}

// "Bendov Family Tree" → "Bendov Family Tree 2" if that name is already in the list
function uniqueTreeTitle(base) {
  const taken = new Set(getTrees().map(t => (t.title || '').toLowerCase()));
  if (!taken.has(base.toLowerCase())) return base;
  let n = 2;
  while (taken.has(`${base} ${n}`.toLowerCase())) n++;
  return `${base} ${n}`;
}

// Public sheets can be read with the site's browser key — no sign-in needed.
async function fetchTreeTitle(id) {
  try {
    const r = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(id)}?fields=properties.title&key=${SHARED_GOOGLE.apiKey}`);
    if (!r.ok) return null;
    return (await r.json()).properties?.title || null;
  } catch { return null; }
}

function updateTreeSwitcher() {
  const nameEl = $('tree-switcher-name');
  if (!nameEl) return;
  nameEl.textContent = state.importMode ? 'Imported file' : (state.treeOpen ? treeTitle(state.sheetId) : 'My trees');
  updateNavForTree();
  if (!$('tree-menu').classList.contains('hidden')) renderTreeMenu();
}

function renderTreeMenu() {
  const menu  = $('tree-menu');
  const trees = getTrees();
  const esc   = v => String(v).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const hint = !trees.length
    ? `<div class="tree-menu-empty">${state.googleAccessToken ? 'No trees yet.' : 'Sign in to see your trees from any device.'}</div>`
    : '';
  menu.innerHTML = `
    <div class="tree-menu-label">My trees${state.discovering ? ' · looking…' : ''}</div>
    ${hint}
    ${trees.map(t => `
      <div class="tree-menu-row${state.treeOpen && t.id === state.sheetId ? ' current' : ''}">
        <button type="button" class="tree-menu-item" data-tree-id="${esc(t.id)}" role="menuitem">
          <span class="tree-menu-check">${state.treeOpen && t.id === state.sheetId ? '✓' : ''}</span>
          <span class="tree-menu-name">${esc(t.title || 'Family Tree')}</span>
        </button>
        <a class="tree-menu-sheet" href="https://docs.google.com/spreadsheets/d/${encodeURIComponent(t.id)}/edit" target="_blank" rel="noopener" title="Open the Google Sheet in a new tab" aria-label="Open the Google Sheet for ${esc(t.title || 'this tree')} in a new tab">📊</a>
        ${state.treeOpen && t.id === state.sheetId ? '<span class="tree-menu-spacer"></span>' : `<button type="button" class="tree-menu-remove" data-forget-id="${esc(t.id)}" title="Remove from this list (the sheet itself is not deleted)" aria-label="Remove ${esc(t.title || 'tree')} from this list">✕</button>`}
      </div>`).join('')}
    <div class="tree-menu-sep"></div>
    <button type="button" class="tree-menu-item tree-menu-action" data-menu="new" role="menuitem"><span class="tree-menu-check">＋</span>Create a new tree</button>
    <button type="button" class="tree-menu-item tree-menu-action" data-menu="open" role="menuitem"><span class="tree-menu-check">📂</span>Open another tree</button>`;
}

function toggleTreeMenu(force) {
  const menu = $('tree-menu');
  const open = force ?? menu.classList.contains('hidden');
  if (open) renderTreeMenu();
  menu.classList.toggle('hidden', !open);
  $('tree-switcher-btn').setAttribute('aria-expanded', String(open));
}

function switchTree(id) {
  toggleTreeMenu(false);
  if (!id || (state.treeOpen && id === state.sheetId)) return;
  // A person/view in the address belongs to the old tree
  const url = new URL(window.location.href);
  ['node', 'mode', 'person', 'view'].forEach(k => url.searchParams.delete(k));
  history.replaceState(null, '', url);
  sheetIdInput.value = id; // the address bar's ?sheet= is updated once it loads
  onLoadClick();
}

// ===================================================================
// HOME — the tree screen with no tree open (first visit, signed out)
// ===================================================================
function showHome() {
  showScreen('tree-screen');
  detailPanel.classList.add('hidden');
  state.treeOpen = false;
  state.people = [];
  state.layout = null;
  treeRoot.innerHTML = '';
  document.querySelector('#tree-container .empty-state')?.remove();
  $('home-panel').classList.remove('hidden');
  updateTreeSwitcher();
  updateSignInBtn();
  updateHomePanel();
}

function hideHome() {
  $('home-panel')?.classList.add('hidden');
}

function updateNavForTree() {
  const open = state.treeOpen;
  $('share-btn')?.classList.toggle('hidden', !open || state.importMode || !state.sheetId);
  $('refresh-btn')?.classList.toggle('hidden', !open || state.importMode);
  document.querySelector('.search-container')?.classList.toggle('hidden', !open);
}

function updateHomePanel() {
  const panel = $('home-panel');
  if (!panel || panel.classList.contains('hidden')) return;
  const signedIn = !!state.googleAccessToken;
  const tagline  = $('home-tagline');
  const start    = $('guide-start-btn');
  $('home-signin-btn').classList.toggle('hidden', signedIn);
  $('home-signin-btn').innerHTML = state.rememberedEmail
    ? `Continue as ${escHtml(rememberedName())}<span class="welcome-btn-sub">Signed in before on this device</span>`
    : 'Sign in with Google<span class="welcome-btn-sub">See your family trees on any device</span>';
  $('home-perks').classList.toggle('hidden', signedIn);
  if (!signedIn) {
    tagline.textContent = 'See your whole family in one interactive tree — on your phone or computer. Free, and your data stays in your own Google Sheet.';
    start.classList.replace('btn-primary', 'btn-secondary');
  } else if (state.discovering) {
    tagline.textContent = 'Looking for your family trees…';
  } else {
    tagline.textContent = `Signed in as ${state.googleEmail || 'your Google account'}. You don't have any family trees yet. Start one, or open a sheet you already have.`;
    start.classList.replace('btn-secondary', 'btn-primary');
  }
}

// ===================================================================
// YOUR TREES IN GOOGLE DRIVE
// With the built-in sign-in (drive.file), Google lists exactly the sheets this
// person created or picked with the app — from their account, on any browser.
// ===================================================================
const TREES_FOLDER_NAME = 'Freemily Trees';
let treesFolderId = null;

async function driveApi(token, path, opts = {}) {
  const resp = await fetch(`https://www.googleapis.com/drive/v3/${path}`, {
    ...opts,
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', ...(opts.headers || {}) },
  });
  const body = await resp.json().catch(() => ({}));
  if (resp.status === 401) { state.googleAccessToken = null; updateSignInBtn(); }
  if (!resp.ok) throw new Error(body.error?.message || `Google Drive error ${resp.status}`);
  return body;
}

async function discoverTrees(token) {
  state.discovering = true;
  updateHomePanel();
  try {
    const q = encodeURIComponent("mimeType='application/vnd.google-apps.spreadsheet' and trashed=false");
    const { files = [] } = await driveApi(token,
      `files?q=${q}&orderBy=${encodeURIComponent('recency desc')}&pageSize=100` +
      `&fields=${encodeURIComponent('files(id,name,viewedByMeTime,modifiedTime)')}&includeItemsFromAllDrives=true&supportsAllDrives=true`);
    const list = getTrees();
    for (const f of files) {
      const known = list.find(t => t.id === f.id);
      if (known) known.title = f.name || known.title;
      else list.push({ id: f.id, title: f.name || '', lastOpened: Date.parse(f.viewedByMeTime || f.modifiedTime) || 0 });
    }
    list.sort((a, b) => (b.lastOpened || 0) - (a.lastOpened || 0));
    saveTrees(list);
    return files;
  } finally {
    state.discovering = false;
    updateTreeSwitcher();
    updateHomePanel();
  }
}

// The "Freemily Trees" folder in the person's Drive (created by the app the first time)
async function getTreesFolder(token) {
  if (treesFolderId) return treesFolderId;
  const q = encodeURIComponent(`mimeType='application/vnd.google-apps.folder' and name='${TREES_FOLDER_NAME}' and trashed=false`);
  const { files = [] } = await driveApi(token, `files?q=${q}&fields=files(id)&pageSize=1`);
  if (files[0]) return (treesFolderId = files[0].id);
  const folder = await driveApi(token, 'files?fields=id', {
    method: 'POST',
    body: JSON.stringify({ name: TREES_FOLDER_NAME, mimeType: 'application/vnd.google-apps.folder' }),
  });
  return (treesFolderId = folder.id);
}

// New trees: move the sheet itself into the folder
async function moveIntoTreesFolder(token, fileId) {
  const folder = await getTreesFolder(token);
  const { parents = [] } = await driveApi(token, `files/${encodeURIComponent(fileId)}?fields=parents`);
  if (parents.includes(folder)) return;
  await driveApi(token,
    `files/${encodeURIComponent(fileId)}?addParents=${folder}&removeParents=${encodeURIComponent(parents.join(','))}&fields=id`,
    { method: 'PATCH', body: '{}' });
}

// Sheets opened with the app (picked): add a shortcut in the folder, leave the sheet where it is
async function addShortcutToTreesFolder(token, fileId, name = '') {
  const folder = await getTreesFolder(token);
  const q = encodeURIComponent(`'${folder}' in parents and mimeType='application/vnd.google-apps.shortcut' and trashed=false`);
  const { files = [] } = await driveApi(token, `files?q=${q}&fields=${encodeURIComponent('files(shortcutDetails(targetId))')}&pageSize=200`);
  if (files.some(f => f.shortcutDetails?.targetId === fileId)) return;
  await driveApi(token, 'files?fields=id', {
    method: 'POST',
    body: JSON.stringify({
      name: name || treeTitle(fileId),
      mimeType: 'application/vnd.google-apps.shortcut',
      parents: [folder],
      shortcutDetails: { targetId: fileId },
    }),
  });
}

// Keep ?sheet=<id> in the address bar, so a reload or a copied address opens this tree.
function syncAddressBar(id) {
  try {
    const url = new URL(window.location.href);
    if (url.searchParams.get('sheet') === id) return;
    url.searchParams.set('sheet', id);
    history.replaceState(null, '', url);
  } catch { /* address bar is a nicety only */ }
}

// Keep &person= / &view= in the address bar in step with what's on screen,
// so copying the address (or reloading) gives the same view.
function syncViewInAddressBar() {
  try {
    const url = new URL(window.location.href);
    url.searchParams.delete('node');
    url.searchParams.delete('mode');
    if ((state.viewMode === 'ancestors' || state.viewMode === 'descendants') && state.focusId != null) {
      url.searchParams.set('person', state.focusId);
      url.searchParams.set('view', state.viewMode === 'ancestors' ? 'up' : 'down');
    } else {
      url.searchParams.delete('person');
      url.searchParams.delete('view');
    }
    if (url.href !== window.location.href) history.replaceState(null, '', url);
  } catch {}
}

function initTreeSwitcher() {
  $('tree-switcher-btn').addEventListener('click', (e) => { e.stopPropagation(); toggleTreeMenu(); });
  $('tree-menu').addEventListener('click', (e) => {
    e.stopPropagation();
    if (e.target.closest('.tree-menu-sheet')) { setTimeout(() => toggleTreeMenu(false), 0); return; }
    const forget = e.target.closest('[data-forget-id]');
    if (forget) { forgetTree(forget.dataset.forgetId); return; }
    const item = e.target.closest('[data-tree-id]');
    if (item) { switchTree(item.dataset.treeId); return; }
    const action = e.target.closest('[data-menu]');
    if (!action) return;
    toggleTreeMenu(false);
    clearGuide();
    if (action.dataset.menu === 'new')  openGuide({ returnTo: 'tree', answers: { start: 'new' }, pos: 1 });
    if (action.dataset.menu === 'open') openGuide({ returnTo: 'tree', answers: { start: 'own' }, pos: 1 });
  });
  document.addEventListener('click', () => toggleTreeMenu(false));
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') toggleTreeMenu(false); });
  updateTreeSwitcher();
}

// Show exactly one of the full-page screens (welcome, guide, setup, tree).
function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.toggle('active', s.id === id));
}

// Accept a full Google Sheets link, a freemilytree.com ?sheet= link, or a bare ID.
function parseSheetId(input) {
  const v = (input || '').trim();
  const m = v.match(/\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/);
  if (m) return m[1];
  try {
    const fromParam = new URL(v).searchParams.get('sheet');
    if (fromParam) return fromParam.trim();
  } catch { /* not a URL */ }
  return v;
}

function showSetupScreen() {
  detailPanel.classList.add('hidden');
  showScreen('setup-screen');
  // Keep the Advanced section open for people who already use their own setup
  $('setup-advanced').open = !!(state.googleClientId || state.appsScriptUrl);
  sheetIdInput.value  = state.sheetId;
  scriptInput.value       = state.appsScriptUrl;
  clientIdInput.value     = state.googleClientId;
  allowedEmailInput.value = state.allowedEmail;
  hideError(setupError);
}

function showTreeScreen() {
  showScreen('tree-screen');
}

// ===================================================================
// LOAD FLOW
// ===================================================================
async function onLoadClick() {
  const id           = parseSheetId(sheetIdInput.value);
  sheetIdInput.value = id;
  const url          = scriptInput.value.trim();
  const clientId     = clientIdInput.value.trim();
  const allowedEmail = allowedEmailInput.value.trim();

  if (!id) {
    showError(setupError, 'Please paste your Google Sheet link.');
    return;
  }

  hideError(setupError);
  state.sheetId         = id;
  state.appsScriptUrl   = url;
  state.googleClientId  = clientId;
  state.allowedEmail    = allowedEmail;
  state.importMode      = false;
  // Reset token if client ID changed
  if (clientId !== (localStorage.getItem('ftGoogleClientId') || '')) {
    state.googleAccessToken = null;
    googleTokenClient = null;
  }
  localStorage.setItem('ftSheetId',        id);
  localStorage.setItem('ftAppsScriptUrl',  url);
  localStorage.setItem('ftGoogleClientId', clientId);
  localStorage.setItem('ftAllowedEmail',   allowedEmail);

  showTreeScreen();
  updateSignInBtn();
  await loadTree(id, { applyParams: true });
}

async function loadTree(sheetId, { applyParams = false, restorePersonId = null, restoreMode = null } = {}) {
  setLoading(true);
  hideHome();
  try {
    const people = await fetchSheet(sheetId);
    state.people = people;
    state.treeOpen = true;
    // A freshly opened tree starts on the whole tree (a link's &person= is applied below)
    if (state.viewMode !== 'full') {
      state.viewMode = 'full'; state.focusedName = null; state.focusId = null;
      updateModeBar();
    }
    renderFamilyTree(people, null, null, { startFocus: !restorePersonId });
    rememberTree(sheetId);
    syncAddressBar(sheetId);
    updateNavForTree();
    updateSignInBtn(); // "Sign in" → "✏️ Sign in to edit" now that a tree is open
    // Already signed in? Turn editing on quietly if Google says this person may edit
    if (state.googleAccessToken && state.editAccessSheetId !== sheetId) {
      ensureEditAccess(state.googleAccessToken, { interactive: false }).then(updateSignInBtn).catch(() => {});
    }
    if (applyParams) applyUrlParams();
    if (restorePersonId) restorePersonFocus(restorePersonId, restoreMode);
  } catch (err) {
    console.error(err);
    showError(setupError, `Could not load sheet: ${err.message}`);
    // Not the settings form: the guide explains what's wrong in plain words (onboarding.js)
    showTreeLoadProblem(sheetId);
  } finally {
    setLoading(false);
  }
}

// Resolve a person by URL param value: try exact ID match first, then
// case-insensitive name prefix search (first match wins).
function findPersonByParam(value) {
  const v = value.trim();
  // Exact ID match
  const byId = state.people.find(p => String(p.id) === v);
  if (byId) return byId;
  // Name search (same logic as autocomplete)
  const lower = v.toLowerCase();
  return state.people.find(p =>
    `${p.firstName} ${p.lastName || ''}`.toLowerCase().includes(lower)
  ) || null;
}

function restorePersonFocus(personId, mode) {
  const person = state.people.find(p => String(p.id) === String(personId));
  if (!person) return;
  if (mode === 'descendants') {
    focusDescendants(person, { includeParents: true });
  } else if (mode === 'ancestors') {
    focusAncestors(person);
  } else {
    requestAnimationFrame(() => searchFocusPerson(person));
  }
}

// Link parameters:  &person=<id or name>  &view=up|down   (view defaults to up)
// Older links still work: &node=<id or name>  &mode=up|down  (no mode = whole tree, centred on them)
function applyUrlParams() {
  const params = new URLSearchParams(window.location.search);
  const personParam = params.get('person') ?? params.get('node');
  const viewParam   = (params.get('view') ?? params.get('mode') ?? '').toLowerCase();
  if (!personParam) return; // a view without a person → ignore

  const person = findPersonByParam(personParam);
  if (!person) { showToast(`Couldn't find "${personParam}" in this tree.`, 'error'); return; }

  if (viewParam === 'down') {
    focusDescendants(person);
  } else if (viewParam === 'up' || params.has('person')) {
    focusAncestors(person);
  } else {
    searchFocusPerson(person); // old &node= link without a mode
    return;
  }
  // Open zoomed in on them (after the view has been laid out)
  requestAnimationFrame(() => requestAnimationFrame(() => zoomToPerson(person.id)));
}

function setLoading(on) {
  loadingOverlay.classList.toggle('hidden', !on);
}

// ===================================================================
// GOOGLE SHEETS — READ
// ===================================================================
async function fetchSheet(sheetId) {
  // 1) The public "anyone with the link" CSV — works for everyone, no sign-in
  const url = `https://docs.google.com/spreadsheets/d/${encodeURIComponent(sheetId)}/gviz/tq?tqx=out:csv&gid=0`;
  let publicError;
  try {
    const resp = await fetch(url);
    if (resp.ok) {
      const text = await resp.text();
      if (!/^\s*</.test(text)) return parseCSV(text);
      publicError = new Error('The sheet is not shared with a link.');
    } else {
      publicError = new Error(`HTTP ${resp.status}`);
    }
  } catch (err) {
    publicError = err; // private sheets redirect to a Google sign-in page, which the browser blocks
  }
  // 2) Signed in: read it as that person through Google (works for their own private sheets)
  if (state.googleAccessToken && usesSheetsAPI()) {
    const r = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(sheetId)}/values/A:H`, {
      headers: { Authorization: `Bearer ${state.googleAccessToken}` },
    });
    if (r.ok) {
      const { values = [] } = await r.json();
      const csv = values.map(row => row.map(v => `"${String(v ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
      return parseCSV(csv);
    }
  }
  throw publicError;
}

function parseCSV(raw) {
  const rows = splitCSVRows(raw);
  if (rows.length < 2) return [];

  // Skip header row
  return rows.slice(1)
    .map(cols => ({
      id:        cols[0]?.trim() ?? '',
      firstName: cols[1]?.trim() ?? '',
      lastName:  cols[2]?.trim() ?? '',
      parent1:   cols[3]?.trim() || null,
      parent2:   cols[4]?.trim() || null,
      spouse:    cols[5]?.trim() || null,
      picture:   cols[6]?.trim() || null,
      comments:  cols[7]?.trim() || null,
    }))
    .filter(p => p.id !== '');
}

function splitCSVRows(text) {
  const rows = [];
  let row = [], field = '', inQ = false;

  for (let i = 0; i < text.length; i++) {
    const c = text[i], n = text[i + 1];
    if (inQ) {
      if (c === '"' && n === '"') { field += '"'; i++; }
      else if (c === '"')          inQ = false;
      else                         field += c;
    } else {
      if      (c === '"')                        inQ = true;
      else if (c === ',')                        { row.push(field); field = ''; }
      else if (c === '\r' && n === '\n')         { row.push(field); rows.push(row); row = []; field = ''; i++; }
      else if (c === '\n' || c === '\r')         { row.push(field); rows.push(row); row = []; field = ''; }
      else                                        field += c;
    }
  }
  if (field !== '' || row.length > 0) { row.push(field); rows.push(row); }
  return rows;
}

// ===================================================================
// GOOGLE SHEETS — WRITE
// ===================================================================

// --- OAuth (Google Identity Services) ---
// Everyone signs in through the site's own Google project ("shared" sign-in),
// unless they entered their own Client ID under Settings → Advanced.
// Shared sign-in asks only for drive.file: access to sheets the person created
// with this app or picked once in Google's file picker (Google's recommended,
// non-sensitive scope). Own Client IDs keep the old full-spreadsheets scope.
// Site settings come from config.js (see config.example.js). They are not
// secrets — every visitor's browser receives them — but each deployment needs
// its own, tied to its own domain in Google Cloud.
const SHARED_GOOGLE = {
  clientId: window.FREEMILY_CONFIG?.googleClientId || '',
  apiKey:   window.FREEMILY_CONFIG?.googleApiKey   || '',  // browser key for the Google Picker
  appId:    window.FREEMILY_CONFIG?.googleAppId    || '',  // Google Cloud project number
};
const SCOPE_DRIVE_FILE = 'https://www.googleapis.com/auth/drive.file';
const SCOPE_SHARED = `${SCOPE_DRIVE_FILE} email profile`;
const SCOPE_OWN    = 'https://www.googleapis.com/auth/spreadsheets email';

let googleTokenClient = null;
let pendingToken = null; // { resolve, reject }
let needConsentScreen = false; // true after someone left a permission unticked

// A saved "own" Client ID that is just the built-in one (left over from the
// old setup) counts as the built-in sign-in, with its basic permissions.
function usingSharedSignIn() { return !state.googleClientId || state.googleClientId === SHARED_GOOGLE.clientId; }

// The guide's Google actions (create a tree, pick from Drive, fix sharing) need
// the built-in sign-in. Choosing them switches off an old "own Client ID" setting.
// Must stay synchronous: it runs right before the sign-in popup opens.
function useBuiltInSignIn() {
  if (!state.googleClientId) return;
  state.googleClientId    = '';
  clientIdInput.value     = '';
  try { localStorage.setItem('ftGoogleClientId', ''); } catch {}
  state.googleAccessToken = null;
  state.editAccessSheetId = null;
  googleTokenClient       = null;
}
function effectiveClientId()  { return state.googleClientId || SHARED_GOOGLE.clientId; }

// Google sign-in is the write path unless the user set up only an Apps Script URL.
function usesSheetsAPI() { return !!state.googleClientId || !state.appsScriptUrl; }

// Can the + / ✎ buttons be used right now?
function canEdit() {
  if (state.importMode) return true;                      // local-only edits
  if (state.appsScriptUrl && !state.googleClientId) return true;
  return !!state.googleAccessToken && state.editAccessSheetId === state.sheetId;
}

function updateEditMode() {
  document.body.classList.toggle('can-edit', canEdit());
}

function finishToken(token, err) {
  const p = pendingToken;
  pendingToken = null;
  if (!p) return;
  if (err) p.reject(err); else p.resolve(token);
}

function getTokenClient() {
  if (!googleTokenClient && typeof google !== 'undefined' && google.accounts?.oauth2) {
    googleTokenClient = google.accounts.oauth2.initTokenClient({
      client_id: effectiveClientId(),
      scope: usingSharedSignIn() ? SCOPE_SHARED : SCOPE_OWN,
      // Don't merge in permissions granted to older versions of the app (the
      // full "all your Sheets" scope), which would bring back Google's
      // "unverified app" warning. Ask for exactly the basic scopes above.
      include_granted_scopes: false,
      hint: state.googleEmail || state.rememberedEmail || undefined, // skip the account chooser when we know it
      callback: async (resp) => {
        if (resp.error) {
          finishToken(null, new Error('Google sign-in failed: ' + resp.error));
          return;
        }
        // People can untick permissions on Google's consent screen. Without
        // drive.file the built-in sign-in can't open, create or share sheets.
        if (usingSharedSignIn() && !google.accounts.oauth2.hasGrantedAllScopes(resp, SCOPE_DRIVE_FILE)) {
          needConsentScreen = true; // next try must show Google's screen again, not reuse this answer
          finishToken(null, new Error('Google didn\'t give the app access to your family sheet. Tap the button again, and on the Google screen tick the box "See, edit, create, and delete only the specific Google Drive files you use with this app", then tap Continue.'));
          return;
        }
        needConsentScreen = false;
        state.googleAccessToken = resp.access_token;
        // Optional extra lock: only one email may edit (Settings → Advanced)
        try {
          const info = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
            headers: { Authorization: `Bearer ${resp.access_token}` },
          }).then(r => r.json());
          state.googleEmail = info.email || '';
          state.googleName  = { given: info.given_name || '', family: info.family_name || '', full: info.name || '' };
          const allowed = (state.allowedEmail || '').trim().toLowerCase();
          if (allowed && info.email?.toLowerCase() !== allowed) {
            state.googleAccessToken = null;
            updateSignInBtn();
            finishToken(null, new Error(`Editing is restricted. Signed in as ${info.email}, which isn't allowed.`));
            return;
          }
        } catch { /* userinfo is optional — the token is still valid */ }
        saveAuth(resp.access_token, resp.expires_in);
        updateSignInBtn();
        finishToken(resp.access_token);
      },
      error_callback: (err) => {
        // Popup closed or blocked
        finishToken(null, new Error(err?.type === 'popup_closed' ? 'Sign-in was cancelled.' : 'Google sign-in could not open. Allow pop-ups for this site and try again.'));
      },
    });
  }
  return googleTokenClient;
}

function updateSignInBtn() {
  const btn = $('signin-btn');
  if (!btn) return;
  updateEditMode();
  if (state.importMode) {
    btn.classList.remove('hidden');
    btn.classList.add('btn-import-mode');
    btn.textContent = '⚠ Import Mode — edits not saved';
    return;
  }
  btn.classList.remove('btn-import-mode');
  if (!usesSheetsAPI()) {          // Apps Script only: no sign-in needed
    btn.classList.add('hidden');
    return;
  }
  btn.classList.remove('hidden');
  const again = !state.googleAccessToken && state.rememberedEmail ? `Continue as ${rememberedName()}` : '';
  if (!state.treeOpen) {
    btn.textContent = state.googleAccessToken ? '✓ Signed in' : (again || 'Sign in');
  } else {
    btn.textContent = canEdit() ? '✓ Editing on' : (state.googleAccessToken ? 'Signed in · view only' : (again ? `✏️ ${again}` : '✏️ Sign in to edit'));
  }
  if (typeof updateHomePanel === 'function') updateHomePanel();
}

async function onSignInClick() {
  if (state.importMode) return;
  if (state.googleAccessToken) {
    // Sign out (on this device). Not revoked on purpose: revoking would also
    // drop the per-sheet permissions from the Google picker.
    forgetAuth();
    state.googleAccessToken = null;
    state.editAccessSheetId = null;
    state.googleEmail = '';
    state.googleName = null;
    googleTokenClient = null;
    updateSignInBtn();
    showToast('Signed out', '');
    return;
  }
  try {
    const token = await requestGoogleToken();
    if (state.treeOpen && !state.importMode) await ensureEditAccess(token);
    await afterSignIn(token);
  } catch (err) {
    showToast(err.message, 'error');
  }
  updateSignInBtn();
}

// After sign-in: find this person's trees in Google Drive (any browser), and
// if no tree is open yet, open the most recent one.
async function afterSignIn(token) {
  if (!usingSharedSignIn()) return;
  const found = await discoverTrees(token).catch(() => null);
  if (!state.treeOpen && !state.importMode) {
    const next = getTrees()[0];
    if (next) { sheetIdInput.value = next.id; onLoadClick(); }
    else updateHomePanel();
  }
  return found;
}

function requestGoogleToken() {
  return new Promise((resolve, reject) => {
    if (state.googleAccessToken) { resolve(state.googleAccessToken); return; }
    if (!effectiveClientId()) {
      reject(new Error("Google sign-in isn't set up on this website yet. The site owner needs to add config.js (see the README)."));
      return;
    }
    const client = getTokenClient();
    if (!client) { reject(new Error('Google sign-in is still loading. Try again in a moment.')); return; }
    pendingToken = { resolve, reject };
    client.requestAccessToken({ prompt: needConsentScreen ? 'consent' : '' });
  });
}

// ── Edit access check ────────────────────────────────────────────────
// Asks Google whether the signed-in person may edit the current sheet.
// With the shared sign-in, the app can only see a sheet after it was picked
// once in Google's file picker (or created by the app), so if Google says
// "not found" we open the picker showing just this sheet.
async function driveCanEdit(token, fileId) {
  const resp = await fetch(
    `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}?fields=name,capabilities(canEdit)&supportsAllDrives=true`,
    { headers: { Authorization: `Bearer ${token}` } });
  if (resp.status === 401) { state.googleAccessToken = null; throw new Error('Your Google session expired. Tap Sign in to edit again.'); }
  if (resp.status === 404 || resp.status === 403) return { found: false };
  if (!resp.ok) throw new Error(`Google Drive error ${resp.status}`);
  const meta = await resp.json();
  return { found: true, canEdit: !!meta.capabilities?.canEdit, name: meta.name };
}

async function ensureEditAccess(token, { interactive = true } = {}) {
  if (!state.sheetId) return;
  if (!usingSharedSignIn()) {               // own Client ID: full-sheets scope, trust Google on write
    state.editAccessSheetId = state.sheetId;
    return;
  }
  let res = await driveCanEdit(token, state.sheetId);
  if (!res.found && !interactive) return; // never open the picker on its own
  if (!res.found) {
    showToast('Google will ask you to confirm your family tree sheet. Tap it, then tap Select.', '');
    const picked = await pickSheetWithGoogle(token, state.sheetId);
    if (!picked) throw new Error('Editing stays off until you select your sheet.');
    res = await driveCanEdit(token, state.sheetId);
    if (!res.found) {
      throw new Error(picked !== state.sheetId
        ? 'That was a different sheet. Tap Sign in to edit again and choose this tree\'s sheet.'
        : `This sheet isn't shared with ${state.googleEmail || 'your Google account'}. Ask the owner to add you as an Editor.`);
    }
    addShortcutToTreesFolder(token, state.sheetId, res.name).catch(() => {});
  }
  if (!res.canEdit) {
    if (!interactive) return;
    throw new Error(`You can view this tree, but ${state.googleEmail || 'your account'} can't edit it. Ask the owner to share the sheet with you as an Editor.`);
  }
  state.editAccessSheetId = state.sheetId;
  if (interactive) showToast('Editing is on. Tap + or ✎ on anyone in the tree.', 'success');
}

// ── Google file picker ───────────────────────────────────────────────
let pickerLoaded = null;
function loadPicker() {
  if (!pickerLoaded) {
    pickerLoaded = new Promise((resolve, reject) => {
      const done = () => window.gapi.load('picker', { callback: resolve, onerror: () => reject(new Error('Google file picker failed to load.')) });
      if (window.gapi) return done();
      const s = document.createElement('script');
      s.src = 'https://apis.google.com/js/api.js';
      s.onload = done;
      s.onerror = () => { pickerLoaded = null; reject(new Error('Google file picker failed to load. Check your connection.')); };
      document.head.appendChild(s);
    });
  }
  return pickerLoaded;
}

// Resolves with the picked file ID, or null if the person cancelled.
async function pickSheetWithGoogle(token, onlyFileId = null) {
  await loadPicker();
  return new Promise((resolve, reject) => {
    const view = new google.picker.DocsView(google.picker.ViewId.SPREADSHEETS)
      .setMode(google.picker.DocsViewMode.LIST)
      .setIncludeFolders(false);
    if (onlyFileId) view.setFileIds(onlyFileId);
    const picker = new google.picker.PickerBuilder()
      .addView(view)
      .setOAuthToken(token)
      .setDeveloperKey(SHARED_GOOGLE.apiKey)
      .setAppId(SHARED_GOOGLE.appId)
      .setTitle(onlyFileId ? 'Select your family tree sheet' : 'Choose your family tree sheet')
      .setCallback((data) => {
        if (data.action === google.picker.Action.PICKED) resolve(data.docs?.[0]?.id || null);
        else if (data.action === google.picker.Action.CANCEL) resolve(null);
        else if (data.action === 'error') {
          // e.g. "The API developer key is invalid": a problem with the site's Google setup, not the user
          reject(new Error("Google's file picker couldn't start because of a problem with this website's Google setup. Please tell the site owner. (You can still view the tree.)"));
        }
      })
      .build();
    picker.setVisible(true);
  });
}

// ── Create a brand-new tree (sheet + sharing) in the person's Drive ──
async function createTreeSheet({ firstName, lastName, title }) {
  const token = await requestGoogleToken();
  const cell  = v => (typeof v === 'number' ? { userEnteredValue: { numberValue: v } } : { userEnteredValue: { stringValue: v } });
  const header = ['id', 'firstName', 'lastName', 'parent1', 'parent2', 'spouse', 'picture', 'comments'];
  const resp = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      properties: { title },
      sheets: [{
        properties: { sheetId: 0, title: 'Family', gridProperties: { frozenRowCount: 1 } },
        data: [{ startRow: 0, startColumn: 0, rowData: [
          { values: header.map(cell) },
          { values: [cell(1), cell(firstName), cell(lastName)] },
        ] }],
      }],
    }),
  });
  if (resp.status === 401) { state.googleAccessToken = null; throw new Error('Your Google session expired. Please try again.'); }
  if (!resp.ok) {
    const body = await resp.json().catch(() => ({}));
    throw new Error('Could not create your sheet: ' + (body.error?.message || resp.status));
  }
  const { spreadsheetId } = await resp.json();

  // Keep the person's trees together in one Drive folder (best effort)
  await moveIntoTreesFolder(token, spreadsheetId).catch(() => {});

  // Make it viewable by anyone with the link, so the tree (and links you send) can be opened.
  try {
    await makeSheetViewableByLink(token, spreadsheetId);
  } catch (err) {
    throw new Error('Your sheet was created, but it could not be shared (' + err.message +
      '). Open it in Google Sheets and set Share → Anyone with the link → Viewer.');
  }
  return spreadsheetId;
}

// Share → General access → "Anyone with the link" (Viewer), done through the Drive API.
async function makeSheetViewableByLink(token, fileId) {
  const resp = await fetch(`https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}/permissions?supportsAllDrives=true`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ role: 'reader', type: 'anyone' }),
  });
  if (resp.status === 401) { state.googleAccessToken = null; throw new Error('your Google session expired'); }
  if (!resp.ok) {
    const body = await resp.json().catch(() => ({}));
    throw new Error(body.error?.message || `error ${resp.status}`);
  }
}

async function appendToSheetAPI(personData) {
  const token = await requestGoogleToken();
  const values = [[
    personData.id,
    personData.firstName,
    personData.lastName,
    personData.parent1  || '',
    personData.parent2  || '',
    personData.spouse   || '',
    personData.picture  || '',
    personData.comments || '',
  ]];

  const url = `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(state.sheetId)}/values/A1:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`;
  const resp = await fetch(url, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ values }),
  });

  if (resp.status === 401) {
    state.googleAccessToken = null;
    updateSignInBtn();
    throw new Error('Google session expired — please sign in again.');
  }
  if (!resp.ok) {
    const body = await resp.json().catch(() => ({}));
    throw new Error(body.error?.message || `Sheets API error ${resp.status}`);
  }
}

async function appendToSheet(personData) {
  if (state.importMode) return; // no-op in import mode
  if (usesSheetsAPI()) {
    return appendToSheetAPI(personData);
  }
  if (!state.appsScriptUrl) {
    throw new Error('No write method configured. Add a Google Client ID or Apps Script URL in Settings.');
  }
  // Apps Script fallback — fire and forget (no-cors)
  await fetch(state.appsScriptUrl, {
    method: 'POST',
    mode:   'no-cors',
    headers: { 'Content-Type': 'text/plain' },
    body:    JSON.stringify(personData),
  });
}

// ===================================================================
// LAYOUT
// ===================================================================
const NW  = 160;  // node width
const NH  = 90;   // node height
const CG  = 12;   // couple gap (between spouses)
const HG  = 60;   // horizontal gap between family units
const VG  = 140;  // vertical gap between generations
const PAD = 60;   // canvas padding

function computeLayout(people, genOverride = null, focalId = null, viewMode = 'full') {
  if (!people.length) return { positions: {}, rows: [], childrenOf: {} };

  const byId = {};
  people.forEach(p => { byId[p.id] = p; });

  // Normalise spouse links to be bidirectional within this subset.
  // The sheet may only store the link on one side; without this, the person
  // whose row has an empty spouse column is treated as single and the two
  // never form a couple item.
  people.forEach(p => {
    if (p.spouse && byId[p.spouse] && !byId[p.spouse].spouse) {
      byId[p.spouse] = { ...byId[p.spouse], spouse: p.id };
    }
  });

  // --- children map ---
  const childrenOf = {}; // parentId -> [childId, ...]
  people.forEach(p => {
    [p.parent1, p.parent2].forEach(pid => {
      if (!pid || !byId[pid]) return;
      if (!childrenOf[pid]) childrenOf[pid] = [];
      if (!childrenOf[pid].includes(p.id)) childrenOf[pid].push(p.id);
    });
  });

  // --- assign generations (recursive from parents + spouse equalization) ---
  //
  // Strategy:
  //  1. Recursively compute each person's generation from their parents.
  //     A person with no parents in the data gets gen 0.
  //  2. Iteratively equalize spouses to the same generation (take the max).
  //  3. After equalization, re-raise any child whose parents moved up.
  //  4. Repeat 2-3 until stable (handles cascading spouse equalizations).
  //
  // This correctly handles the case where one spouse has recorded ancestry
  // and the other doesn't — e.g. Limor (parents 419+420) and Nadav (deep tree).

  const genOf = {};

  if (genOverride) {
    // Use caller-supplied generation map (e.g. depth-from-focal for focus views).
    people.forEach(p => { genOf[p.id] = genOverride[p.id] ?? 0; });
    // Equalize spouses to the same generation so they always form a couple item.
    // Without this, a married pair reached via different branch depths ends up on
    // different rows and can never sit next to each other.
    let changed = true;
    while (changed) {
      changed = false;
      people.forEach(p => {
        if (!p.spouse || !byId[p.spouse]) return;
        const myG = genOf[p.id] ?? 0, spouseG = genOf[p.spouse] ?? 0;
        if (myG !== spouseG) {
          const newG = Math.max(myG, spouseG);
          genOf[p.id] = newG; genOf[p.spouse] = newG;
          changed = true;
        }
      });
    }
  } else {
    // --- recursive generation assignment from parents + spouse equalization ---
    const computing = new Set();

    function computeGen(id) {
      if (genOf[id] !== undefined) return genOf[id];
      if (computing.has(id)) return 0;
      computing.add(id);
      const p = byId[id];
      if (!p) { computing.delete(id); return 0; }
      const g1 = (p.parent1 && byId[p.parent1]) ? computeGen(p.parent1) : -1;
      const g2 = (p.parent2 && byId[p.parent2]) ? computeGen(p.parent2) : -1;
      let g;
      if      (g1 === -1 && g2 === -1) g = 0;
      else if (g1 === -1)              g = g2 + 1;
      else if (g2 === -1)              g = g1 + 1;
      else                             g = Math.max(g1, g2) + 1;
      genOf[id] = g;
      computing.delete(id);
      return g;
    }

    people.forEach(p => computeGen(p.id));

    let changed = true;
    while (changed) {
      changed = false;
      people.forEach(p => {
        if (!p.spouse || !byId[p.spouse]) return;
        const myG = genOf[p.id] ?? 0, spouseG = genOf[p.spouse] ?? 0;
        if (myG !== spouseG) {
          const newG = Math.max(myG, spouseG);
          genOf[p.id] = newG; genOf[p.spouse] = newG;
          changed = true;
        }
      });
      people.forEach(p => {
        const g1 = (p.parent1 && byId[p.parent1]) ? (genOf[p.parent1] ?? 0) : -1;
        const g2 = (p.parent2 && byId[p.parent2]) ? (genOf[p.parent2] ?? 0) : -1;
        let exp;
        if      (g1 === -1 && g2 === -1) exp = 0;
        else if (g1 === -1)              exp = g2 + 1;
        else if (g2 === -1)              exp = g1 + 1;
        else                             exp = Math.max(g1, g2) + 1;
        if (exp > (genOf[p.id] ?? 0)) { genOf[p.id] = exp; changed = true; }
      });
    }
  }

  const maxGen = Math.max(...Object.values(genOf));

  // --- build rows of items ---
  const used = new Set();
  const rows = [];

  for (let g = 0; g <= maxGen; g++) {
    const row = [];
    const genPeople = people
      .filter(p => genOf[p.id] === g && !used.has(p.id))
      .sort((a, b) => numericCompare(a.id, b.id));

    genPeople.forEach(p => {
      if (used.has(p.id)) return;
      used.add(p.id);

      const spouseHere = p.spouse && byId[p.spouse] && genOf[p.spouse] === g && !used.has(p.spouse);
      if (spouseHere) {
        used.add(p.spouse);
        row.push({ type: 'couple', ids: [p.id, p.spouse] });
      } else {
        row.push({ type: 'single', ids: [p.id] });
      }
    });

    rows.push(row);
  }

  // --- Sort rows to minimise line crossings ---
  // Track each person's column index within their row so children can be
  // sorted by their parents' average column position.
  // Row sort — direction depends on view mode.
  //
  // Descendants / full tree: top-down sort.
  //   Seed colOf from row 0 (roots), then sort each lower row so children
  //   appear beneath their parents (minimises top→down line crossings).
  //
  // Ancestors: bottom-up sort.
  //   Seed colOf from the focal row (bottom), then sort each higher row so
  //   parents appear above the child that references them.  Couple members
  //   get fractional column offsets (+0 / +0.5) so the LEFT vs RIGHT spouse
  //   can distinguish their respective parents above them.
  const colOf = {};

  // Helper: record column for every member of a row (couple gets fractional)
  function recordCols(row) {
    row.forEach((item, i) => {
      item.ids.forEach((id, j) => { colOf[id] = i + j * 0.5; });
    });
  }

  if (viewMode === 'ancestors') {
    // Bottom-up: start from the focal (bottom) row and work upward
    recordCols(rows[rows.length - 1]);
    for (let g = rows.length - 2; g >= 0; g--) {
      const row = rows[g];
      row.forEach(item => {
        // Sort key = average column of biological children (one row below)
        const childCols = [];
        item.ids.forEach(id => {
          (childrenOf[id] || []).forEach(cid => {
            if (colOf[cid] !== undefined) childCols.push(colOf[cid]);
          });
        });
        item._sortKey = childCols.length
          ? childCols.reduce((s, v) => s + v, 0) / childCols.length
          : Infinity;
      });
      row.sort((a, b) => a._sortKey - b._sortKey);
      recordCols(row);
    }
  } else {
    // Top-down: start from row 0 (roots) and work downward
    recordCols(rows[0]);
    for (let g = 1; g < rows.length; g++) {
      const row = rows[g];
      row.forEach(item => {
        const parentCols = [];
        item.ids.forEach(id => {
          const p = byId[id];
          [p?.parent1, p?.parent2].forEach(pid => {
            if (pid && colOf[pid] !== undefined) parentCols.push(colOf[pid]);
          });
        });
        item._sortKey = parentCols.length
          ? parentCols.reduce((s, v) => s + v, 0) / parentCols.length
          : Infinity;
      });
      row.sort((a, b) => a._sortKey - b._sortKey);
      recordCols(row);
    }
  }

  // --- assign positions ---
  const positions = {};

  function itemW(item) {
    return item.type === 'couple' ? 2 * NW + CG : NW;
  }

  function setItemLeft(item, newLeft) {
    if (item.type === 'couple') {
      positions[item.ids[0]].x = newLeft;
      positions[item.ids[1]].x = newLeft + NW + CG;
    } else {
      positions[item.ids[0]].x = newLeft;
    }
  }

  function resolveRowOverlaps(row) {
    // Left-to-right: push right if overlapping
    for (let i = 1; i < row.length; i++) {
      const prev     = row[i - 1];
      const prevRight = positions[prev.ids[prev.ids.length - 1]].x + NW + HG;
      const curr     = row[i];
      if (positions[curr.ids[0]].x < prevRight) {
        const delta = prevRight - positions[curr.ids[0]].x;
        curr.ids.forEach(id => { positions[id].x += delta; });
      }
    }
  }

  // Shift an item AND all its descendants right by delta.
  // Also shifts each person's spouse so couples always stay adjacent.
  function shiftSubtree(ids, delta) {
    const visited = new Set();
    function shift(id) {
      if (visited.has(id) || !positions[id]) return;
      visited.add(id);
      positions[id].x += delta;
      // Keep spouse next to this person
      const sp = byId[id]?.spouse;
      if (sp && !visited.has(sp) && positions[sp]) shift(sp);
      (childrenOf[id] || []).forEach(shift);
    }
    ids.forEach(shift);
  }

  function resolveRowOverlapsSubtree(row) {
    for (let i = 1; i < row.length; i++) {
      const prev      = row[i - 1];
      const prevRight = positions[prev.ids[prev.ids.length - 1]].x + NW + HG;
      const curr      = row[i];
      if (positions[curr.ids[0]].x < prevRight) {
        const delta = prevRight - positions[curr.ids[0]].x;
        shiftSubtree(curr.ids, delta);
      }
    }
  }

  // Initial left-to-right placement
  rows.forEach((row, g) => {
    let x = PAD;
    const y = PAD + g * (NH + VG);
    row.forEach(item => {
      if (item.type === 'couple') {
        positions[item.ids[0]] = { x,              y };
        positions[item.ids[1]] = { x: x + NW + CG, y };
      } else {
        positions[item.ids[0]] = { x, y };
      }
      x += itemW(item) + HG;
    });
  });

  // ── Centering strategy ──────────────────────────────────────────────────────
  //
  // Descendants / ancestors (focus modes):
  //   Single bottom-up pass with SUBTREE shifts.  When a parent is pushed right
  //   to avoid overlap, all its children move with it — so children always stay
  //   centred under their parents.  One pass is sufficient; no top-down needed.
  //
  // Full tree:
  //   10 bidirectional passes with plain overlap resolution.  Top-down corrects
  //   children after parents move; multiple passes converge the layout.

  if (viewMode === 'descendants') {
    // Single bottom-up pass with SUBTREE shifts.
    // When a parent is pushed right to avoid overlap, all its biological
    // descendants move with it — so children always stay centred underneath.
    // One pass is sufficient for a strict top-down tree.
    for (let g = maxGen; g >= 0; g--) {
      if (g < maxGen) {
        rows[g].forEach(item => {
          const allKids = new Set();
          item.ids.forEach(pid => (childrenOf[pid] || []).forEach(c => allKids.add(c)));
          if (!allKids.size) return;
          const xs = [...allKids].map(c => positions[c]).filter(Boolean).map(p => p.x + NW / 2);
          if (!xs.length) return;
          const childCenter = (Math.min(...xs) + Math.max(...xs)) / 2;
          setItemLeft(item, childCenter - itemW(item) / 2);
        });
      }
      resolveRowOverlapsSubtree(rows[g]);
    }
  } else {
    // Ancestors mode and full-tree: 10 bidirectional passes with plain overlap
    // resolution (no subtree-shift — the inverted ancestor tree would drag the
    // focal node along if we cascaded shifts downward).
    for (let pass = 0; pass < 10; pass++) {
      // Bottom-up
      for (let g = maxGen; g >= 0; g--) {
        if (g < maxGen) {
          rows[g].forEach(item => {
            const allKids = new Set();
            item.ids.forEach(pid => (childrenOf[pid] || []).forEach(c => allKids.add(c)));
            if (!allKids.size) return;
            const xs = [...allKids].map(c => positions[c]).filter(Boolean).map(p => p.x + NW / 2);
            if (!xs.length) return;
            const childCenter = (Math.min(...xs) + Math.max(...xs)) / 2;
            setItemLeft(item, childCenter - itemW(item) / 2);
          });
        }
        resolveRowOverlaps(rows[g]);
      }
      // Top-down
      for (let g = 0; g <= maxGen; g++) {
        if (g > 0) {
          rows[g].forEach(item => {
            const parentXs = [];
            item.ids.forEach(id => {
              const p = byId[id];
              [p?.parent1, p?.parent2].forEach(pid => {
                if (pid && positions[pid]) parentXs.push(positions[pid].x + NW / 2);
              });
            });
            if (!parentXs.length) return;
            const parentCenter = (Math.min(...parentXs) + Math.max(...parentXs)) / 2;
            setItemLeft(item, parentCenter - itemW(item) / 2);
          });
        }
        resolveRowOverlaps(rows[g]);
      }
    }
  }

  // 1. Normalise: the overlap-resolution passes only ever push items rightward,
  //    causing massive coordinate drift.  Shift everything back so the
  //    leftmost node sits at PAD.
  {
    let leftmostX = Infinity;
    Object.values(positions).forEach(p => { leftmostX = Math.min(leftmostX, p.x); });
    if (Math.abs(leftmostX - PAD) > 0.5) {
      const d = PAD - leftmostX;
      Object.values(positions).forEach(p => { p.x += d; });
    }
  }

  // 2. In focus modes, horizontally centre the focal node's own row over the
  //    span of every other node in the layout (its descendants or ancestors).
  if (focalId && positions[focalId]) {
    const focalGenIdx = genOf[focalId];
    const focalRow    = rows[focalGenIdx];

    const otherXs = [];
    Object.keys(positions).forEach(id => {
      if (genOf[id] !== focalGenIdx) otherXs.push(positions[id].x + NW / 2);
    });

    if (otherXs.length) {
      const otherCenterX = (Math.min(...otherXs) + Math.max(...otherXs)) / 2;

      let fRowMin = Infinity, fRowMax = -Infinity;
      focalRow.forEach(item => item.ids.forEach(id => {
        if (positions[id]) {
          fRowMin = Math.min(fRowMin, positions[id].x);
          fRowMax = Math.max(fRowMax, positions[id].x + NW);
        }
      }));
      const fRowCenterX = (fRowMin + fRowMax) / 2;
      const shift = otherCenterX - fRowCenterX;

      if (Math.abs(shift) > 0.5) {
        focalRow.forEach(item => item.ids.forEach(id => {
          if (positions[id]) positions[id].x += shift;
        }));
      }
    }
  }

  return { positions, rows, childrenOf, byId };
}

function numericCompare(a, b) {
  const na = parseFloat(a), nb = parseFloat(b);
  if (!isNaN(na) && !isNaN(nb)) return na - nb;
  return String(a).localeCompare(String(b));
}

// ===================================================================
// RENDER
// ===================================================================
function renderFamilyTree(people, genOverride = null, focalId = null, { preserveView = false, anchorId = null, startFocus = false } = {}) {
  // Save the anchor node's old tree-space position BEFORE clearing the layout,
  // so we can shift the view afterwards to keep it visually fixed on screen.
  let oldAnchorPos = null;
  if (preserveView && anchorId && state.layout?.positions?.[anchorId]) {
    oldAnchorPos = { ...state.layout.positions[anchorId] };
  }

  // Clear previous
  treeRoot.innerHTML = '';
  detailPanel.classList.add('hidden');

  if (!people.length) {
    showEmptyState();
    return;
  }

  const layout = computeLayout(people, genOverride, focalId, state.viewMode);
  state.layout = layout;
  const { positions, rows, childrenOf, byId } = layout;

  // Compute canvas size and remove any previous viewBox
  let maxX = 0, maxY = 0;
  Object.values(positions).forEach(p => {
    maxX = Math.max(maxX, p.x + NW);
    maxY = Math.max(maxY, p.y + NH);
  });
  const canvasW = maxX + PAD;
  const canvasH = maxY + PAD;
  treeSvg.removeAttribute('viewBox'); // positions are already in px; no viewBox needed

  // Store for reset button
  state.canvasW = canvasW;
  state.canvasH = canvasH;

  if (preserveView && anchorId && oldAnchorPos) {
    // Shift the view so the anchor node stays at the exact same screen position.
    const newPos = positions[anchorId];
    if (newPos) {
      view.x += (oldAnchorPos.x - newPos.x) * view.scale;
      view.y += (oldAnchorPos.y - newPos.y) * view.scale;
      applyTransform();
    }
  } else if (startFocus) {
    // First view after loading: start zoomed in on one person instead of
    // shrinking the whole tree to fit (which is unreadable on big trees).
    const startPerson = pickStartPerson(people, byId, childrenOf);
    whenTreeSized(() => {
      if (startPerson) zoomToPerson(startPerson.id);
      else resetView(canvasW, canvasH);
    });
  } else if (!preserveView) {
    // Fit tree to viewport; if a focal node is given, centre it horizontally
    const focalCX = focalId ? (positions[focalId]?.x ?? 0) + NW / 2 : null;
    requestAnimationFrame(() => resetView(canvasW, canvasH, focalCX));
  }

  // Helper: append a line element to a group
  function addLine(group, cls, x1, y1, x2, y2) {
    const l = svgEl('line');
    l.setAttribute('class', cls);
    l.setAttribute('x1', x1); l.setAttribute('y1', y1);
    l.setAttribute('x2', x2); l.setAttribute('y2', y2);
    group.appendChild(l);
  }

  // 1. Draw connection lines (behind nodes)
  const linesGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  linesGroup.setAttribute('class', 'lines-group tree-enter');
  treeRoot.appendChild(linesGroup);

  // Spouse lines (dashed horizontal)
  rows.forEach(row => {
    row.forEach(item => {
      if (item.type !== 'couple') return;
      const pos1 = positions[item.ids[0]];
      const pos2 = positions[item.ids[1]];
      if (!pos1 || !pos2) return;
      addLine(linesGroup, 'line-spouse',
        pos1.x + NW, pos1.y + NH / 2,
        pos2.x,      pos2.y + NH / 2);
    });
  });

  // Parent-child lines — one bezier curve per parent→child connection.
  // Each curve has its own unique path so lines from different families
  // never share segments and never visually merge.
  const drawnConnections = new Set();

  rows.forEach(row => {
    row.forEach(item => {
      const allKids = new Set();
      item.ids.forEach(pid => (childrenOf[pid] || []).forEach(c => allKids.add(c)));
      if (!allKids.size) return;

      const key = item.ids.join('-');
      if (drawnConnections.has(key)) return;
      drawnConnections.add(key);

      const firstPos = positions[item.ids[0]];
      const lastPos  = positions[item.ids[item.ids.length - 1]];
      if (!firstPos) return;

      // Origin = bottom-center of the couple / single parent
      const originX = (firstPos.x + lastPos.x + NW) / 2;
      const originY = firstPos.y + NH;

      const kidsData = [...allKids]
        .map(c => ({ id: c, pos: positions[c] }))
        .filter(k => k.pos);

      if (!kidsData.length) return;

      // Draw one cubic bezier from couple-origin to each child's top-center.
      // Control points both at the vertical midpoint so the curve bows
      // horizontally — each line fans out independently with no shared segment.
      kidsData.forEach(({ pos }) => {
        const cx   = pos.x + NW / 2;
        const cy   = pos.y;
        const midY = originY + (cy - originY) / 2;
        const path = svgEl('path');
        path.setAttribute('class', 'line-parent');
        path.setAttribute('d', `M ${originX} ${originY} C ${originX} ${midY}, ${cx} ${midY}, ${cx} ${cy}`);
        linesGroup.appendChild(path);
      });
    });
  });

  // 2. Draw person nodes (on top of lines)
  const nodesGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  nodesGroup.setAttribute('class', 'nodes-group tree-enter');
  treeRoot.appendChild(nodesGroup);

  navHints = computeNavHints(people);
  people.forEach(person => {
    const pos = positions[person.id];
    if (!pos) return;
    const node = createPersonNode(person, pos.x, pos.y);
    nodesGroup.appendChild(node);
  });
}

// ── ▲ / ▼ hints: is there more family in that direction than is on screen? ──
// 'more'  → has parents/children that the current view hides (button is highlighted)
// 'shown' → they're all on screen
// 'none'  → nobody recorded in that direction (button is faded)
let navHints = null;
function computeNavHints(visiblePeople) {
  const all = new Set(state.people.map(p => String(p.id)));
  const visible = new Set(visiblePeople.map(p => String(p.id)));
  const childrenOf = {};
  state.people.forEach(p => [p.parent1, p.parent2].forEach(pid => {
    if (pid && all.has(String(pid))) (childrenOf[String(pid)] ||= []).push(String(p.id));
  }));
  return { all, visible, childrenOf };
}
function navStateFor(person) {
  if (!navHints) return { up: 'shown', down: 'shown', upCount: 0, downCount: 0 };
  const { all, visible, childrenOf } = navHints;
  const parents = [person.parent1, person.parent2].filter(pid => pid && all.has(String(pid))).map(String);
  const kids    = childrenOf[String(person.id)] || [];
  const hiddenParents = parents.filter(id => !visible.has(id)).length;
  const hiddenKids    = kids.filter(id => !visible.has(id)).length;
  return {
    up:   !parents.length ? 'none' : (hiddenParents ? 'more' : 'shown'),
    down: !kids.length    ? 'none' : (hiddenKids    ? 'more' : 'shown'),
    upCount: hiddenParents, downCount: hiddenKids,
    // every parent / child is off screen → no real line in that direction
    upAllHidden: parents.length > 0 && hiddenParents === parents.length,
    downAllHidden: kids.length > 0 && hiddenKids === kids.length,
  };
}

// A short dashed line leaving the box with a dot at the end: "the tree goes on
// this way". Drawn only where no real line exists. Tapping it opens that direction.
const STUB_LEN = 34;
function makeStub(direction, onClick, tip) {
  const up = direction === 'up';
  const g = svgEl('g');
  g.setAttribute('class', `tree-stub tree-stub--${direction}`);
  const y0 = up ? 0 : NH, y1 = up ? -STUB_LEN : NH + STUB_LEN;
  const hit = svgEl('rect'); // wider invisible tap target
  hit.setAttribute('x', NW / 2 - 12); hit.setAttribute('width', 24);
  hit.setAttribute('y', Math.min(y0, y1)); hit.setAttribute('height', STUB_LEN);
  hit.setAttribute('class', 'tree-stub-hit');
  const line = svgEl('line');
  line.setAttribute('x1', NW / 2); line.setAttribute('x2', NW / 2);
  line.setAttribute('y1', y0); line.setAttribute('y2', y1);
  line.setAttribute('class', 'tree-stub-line');
  const dot = svgEl('circle');
  dot.setAttribute('cx', NW / 2); dot.setAttribute('cy', y1); dot.setAttribute('r', 3.5);
  dot.setAttribute('class', 'tree-stub-dot');
  const t = svgEl('title'); t.textContent = tip;
  g.append(t, hit, line, dot);
  g.addEventListener('click', e => { e.stopPropagation(); onClick(); });
  return g;
}

// ===================================================================
// FOCUS MODES — ancestors / descendants
// ===================================================================

function buildByIdAndChildren() {
  const byId = {};
  const childrenOf = {};
  state.people.forEach(p => {
    byId[p.id] = p;
  });
  // Normalize spouse links to be bidirectional
  state.people.forEach(p => {
    if (p.spouse && byId[p.spouse] && !byId[p.spouse].spouse) {
      byId[p.spouse] = { ...byId[p.spouse], spouse: p.id };
    }
  });
  state.people.forEach(p => {
    [p.parent1, p.parent2].forEach(pid => {
      if (!pid || !byId[pid]) return;
      if (!childrenOf[pid]) childrenOf[pid] = [];
      if (!childrenOf[pid].includes(p.id)) childrenOf[pid].push(p.id);
    });
  });
  return { byId, childrenOf };
}

function focusAncestors(person, { preserveView = false } = {}) {
  const { byId } = buildByIdAndChildren();

  // --- depth from focal node (0 = focal, 1 = parents, 2 = grandparents, …) ---
  // Using minimum depth ensures correct placement when both paths to the same
  // ancestor have different lengths (endogamy edge case).
  const depthOf = {};

  function assignDepth(id, d) {
    if (!id || !byId[id]) return;
    if (depthOf[id] !== undefined && depthOf[id] <= d) return; // keep minimum
    depthOf[id] = d;
    const p = byId[id];
    if (p.parent1 && byId[p.parent1]) assignDepth(p.parent1, d + 1);
    if (p.parent2 && byId[p.parent2]) assignDepth(p.parent2, d + 1);
  }
  assignDepth(person.id, 0);

  // Always include the focal person's spouse at depth 0
  const focalSpouseId = byId[person.id]?.spouse;
  if (focalSpouseId && byId[focalSpouseId]) {
    depthOf[focalSpouseId] = 0;
  }

  // Collect subset (everyone with a depth)
  const subset = new Set(Object.keys(depthOf));

  // Add spouses of ancestors at the same depth
  [...subset].forEach(id => {
    const p = byId[id];
    if (p?.spouse && byId[p.spouse] && depthOf[p.spouse] === undefined) {
      depthOf[p.spouse] = depthOf[id];
      subset.add(p.spouse);
    }
  });

  // Equalize spouse depths (take the minimum = closer to focal)
  let changed = true;
  while (changed) {
    changed = false;
    [...subset].forEach(id => {
      const p = byId[id];
      if (!p?.spouse || depthOf[p.spouse] === undefined) return;
      const best = Math.min(depthOf[id], depthOf[p.spouse]);
      if (depthOf[id] !== best || depthOf[p.spouse] !== best) {
        depthOf[id] = best; depthOf[p.spouse] = best;
        changed = true;
      }
    });
  }

  // Convert depth → generation: focal person at the bottom row (maxDepth),
  // oldest ancestors at row 0 (top). gen = maxDepth - depth.
  const maxDepth  = Math.max(...Object.values(depthOf), 0);
  const genOverride = {};
  [...subset].forEach(id => { genOverride[id] = maxDepth - (depthOf[id] ?? 0); });

  state.viewMode    = 'ancestors';
  state.focusId     = person.id;
  state.focusIncludeParents = false;
  state.focusedName = `${person.firstName} ${person.lastName || ''}`.trim();
  updateModeBar();
  renderFamilyTree(state.people.filter(p => subset.has(p.id)), genOverride, person.id, { preserveView, anchorId: preserveView ? person.id : null });
}

function focusDescendants(person, { includeParents = false, preserveView = false } = {}) {
  const { byId, childrenOf } = buildByIdAndChildren();

  // focal person starts at gen 1 when parents are shown, gen 0 otherwise
  const focalGen = includeParents ? 1 : 0;
  const depthOf  = {};

  function assignDepth(id, d) {
    if (!id || !byId[id]) return;
    if (depthOf[id] !== undefined && depthOf[id] <= d) return;
    depthOf[id] = d;
    const p = byId[id];
    if (p.spouse && byId[p.spouse]) assignDepth(p.spouse, d);
    (childrenOf[id] || []).forEach(c => assignDepth(c, d + 1));
  }
  assignDepth(person.id, focalGen);

  // Always include the focal person's spouse at the same gen (handles one-directional links)
  const focalSpouse = byId[person.id]?.spouse;
  if (focalSpouse && byId[focalSpouse] && depthOf[focalSpouse] === undefined) {
    depthOf[focalSpouse] = focalGen;
  }

  // Include parents (and their spouses) at gen 0
  if (includeParents) {
    [person.parent1, person.parent2].forEach(pid => {
      if (!pid || !byId[pid]) return;
      depthOf[pid] = 0;
      const parent = byId[pid];
      if (parent.spouse && byId[parent.spouse] && depthOf[parent.spouse] === undefined) {
        depthOf[parent.spouse] = 0;
      }
    });
  }

  const subset = new Set(Object.keys(depthOf));

  const genOverride = {};
  [...subset].forEach(id => { genOverride[id] = depthOf[id] ?? focalGen; });

  state.viewMode    = 'descendants';
  state.focusId     = person.id;
  state.focusIncludeParents = includeParents;
  state.focusedName = `${person.firstName} ${person.lastName || ''}`.trim();
  updateModeBar();
  renderFamilyTree(state.people.filter(p => subset.has(p.id)), genOverride, person.id, { preserveView, anchorId: preserveView ? person.id : null });
}

// ── Redraw after a change, without moving the view ──────────────────
// After add / edit / delete: redraw the same view (full tree, or ancestors /
// descendants of the same person) and keep the anchor person at the exact same
// spot on screen, at the same zoom. No reload, no new starting position.
function centerPersonId(exceptId = null) {
  const pos = state.layout?.positions;
  if (!pos) return null;
  const rect = treeSvg.getBoundingClientRect();
  const cx = (rect.width / 2 - view.x) / view.scale, cy = (rect.height / 2 - view.y) / view.scale;
  let best = null, bestD = Infinity;
  for (const [id, p] of Object.entries(pos)) {
    if (String(id) === String(exceptId)) continue;
    const d = (p.x + NW / 2 - cx) ** 2 + (p.y + NH / 2 - cy) ** 2;
    if (d < bestD) { bestD = d; best = id; }
  }
  return best;
}

function rerenderCurrentView(anchorId = null) {
  const byIdNow = new Set(state.people.map(p => String(p.id)));
  if (!anchorId || !byIdNow.has(String(anchorId)) || !state.layout?.positions?.[anchorId]) anchorId = centerPersonId();
  const focal = state.focusId != null ? state.people.find(p => String(p.id) === String(state.focusId)) : null;
  if (state.viewMode === 'ancestors' && focal) {
    focusAncestors(focal, { preserveView: true });
  } else if (state.viewMode === 'descendants' && focal) {
    focusDescendants(focal, { includeParents: state.focusIncludeParents, preserveView: true });
  } else {
    if (state.viewMode !== 'full') { state.viewMode = 'full'; state.focusedName = null; state.focusId = null; updateModeBar(); }
    renderFamilyTree(state.people, null, null, { preserveView: true, anchorId });
  }
}

// After a save: read the sheet again in the background (fresh through Google when
// signed in) and redraw in place, so the tree matches the sheet. Never moves the view.
let syncTimer = null;
function syncFromSheetQuietly(anchorId, delay = 1500) {
  clearTimeout(syncTimer);
  syncTimer = setTimeout(async () => {
    if (state.importMode || !state.sheetId) return;
    try {
      let people;
      if (state.googleAccessToken && usesSheetsAPI()) {
        const r = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(state.sheetId)}/values/A:H`, {
          headers: { Authorization: `Bearer ${state.googleAccessToken}` },
        });
        if (!r.ok) return;
        const { values = [] } = await r.json();
        people = parseCSV(values.map(row => row.map(v => `"${String(v ?? '').replace(/"/g, '""')}"`).join(',')).join('\n'));
      } else {
        people = await fetchSheet(state.sheetId);
      }
      if (!people.length) return;
      state.people = people;
      rerenderCurrentView(anchorId);
    } catch { /* keep what's on screen */ }
  }, delay);
}

function resetToFullTree() {
  state.viewMode  = 'full';
  state.focusedName = null;
  state.focusId   = null;
  updateModeBar();
  renderFamilyTree(state.people);
}

// The top bar wraps to two rows on phones, so measure it (and the mode bar)
// instead of assuming 52px; the CSS positions everything from these values.
function syncBarHeights() {
  const root = document.documentElement.style;
  const nav  = document.querySelector('.navbar');
  const bar  = $('mode-bar');
  if (nav) root.setProperty('--nav-h', `${nav.offsetHeight}px`);
  if (bar) root.setProperty('--mode-h', bar.classList.contains('hidden') ? '0px' : `${bar.offsetHeight}px`);
}
if (typeof ResizeObserver !== 'undefined') {
  document.addEventListener('DOMContentLoaded', () => {
    const ro = new ResizeObserver(syncBarHeights);
    [document.querySelector('.navbar'), $('mode-bar')].forEach(el => el && ro.observe(el));
  });
}
window.addEventListener('resize', syncBarHeights);

function updateModeBar() {
  const bar = $('mode-bar');
  if (state.viewMode === 'full') {
    bar.classList.add('hidden');
    treeScreen.classList.remove('mode-active');
  } else {
    const icon  = state.viewMode === 'ancestors' ? '▲' : '▼';
    const label = state.viewMode === 'ancestors'
      ? `${icon} Ancestors of ${state.focusedName}`
      : `${icon} Descendants of ${state.focusedName}`;
    $('mode-label').innerHTML = `${escHtml(label)}<span class="mode-hint">Coloured ${state.viewMode === 'ancestors' ? '▼' : '▲'} = more family that way</span>`;
    bar.classList.remove('hidden');
    treeScreen.classList.add('mode-active');
  }
  syncBarHeights();
  if (state.treeOpen && !state.importMode) syncViewInAddressBar();
}

// ===================================================================
// NODE CREATION HELPERS
// ===================================================================

function makeNavBtn(cx, cy, symbol, onClick, hint = 'shown', tip = '') {
  const g = svgEl('g');
  g.setAttribute('transform', `translate(${cx},${cy})`);
  g.setAttribute('class', `nav-btn-group nav-btn--${hint}`);
  if (tip) { const t = svgEl('title'); t.textContent = tip; g.appendChild(t); }

  const c = svgEl('circle');
  c.setAttribute('r', 10);
  c.setAttribute('class', 'nav-btn-circle');
  g.appendChild(c);

  const t = svgEl('text');
  t.setAttribute('y', 1);
  t.setAttribute('class', 'nav-btn-label');
  t.textContent = symbol;
  g.appendChild(t);

  g.addEventListener('click', e => { e.stopPropagation(); onClick(); });
  return g;
}

function createPersonNode(person, x, y) {
  const g = svgEl('g');
  g.setAttribute('transform', `translate(${x},${y})`);
  g.setAttribute('class', 'node-group');
  g.dataset.id = person.id;

  const stubState = navStateFor(person);
  if (stubState.upAllHidden) {
    g.appendChild(makeStub('up', () => focusAncestors(person, { preserveView: true }), 'Parents not shown here. Tap to see ancestors'));
  }
  if (stubState.downAllHidden) {
    g.appendChild(makeStub('down', () => focusDescendants(person, { preserveView: true }), 'Children not shown here. Tap to see descendants'));
  }

  // Background rect
  const rect = svgEl('rect');
  rect.setAttribute('width',  NW);
  rect.setAttribute('height', NH);
  rect.setAttribute('rx',     10);
  rect.setAttribute('class',  'node-rect');
  g.appendChild(rect);

  // Avatar area — photo if available
  const avatarX = 12, avatarY = NH / 2, avatarR = 22;
  const avatarCX = avatarX + avatarR; // = 34

  if (person.picture) {
    const clipId = `clip-${person.id}`;
    const defs   = treeSvg.querySelector('defs');
    // Remove any existing clipPath with this id (stale from previous render)
    const existing = defs.querySelector(`#${clipId}`);
    if (existing) existing.remove();
    const clip   = svgEl('clipPath');
    clip.setAttribute('id', clipId);
    const clipC  = svgEl('circle');
    // Coordinates must be relative to the node's <g> local space, not absolute
    clipC.setAttribute('cx', avatarCX);
    clipC.setAttribute('cy', avatarY);
    clipC.setAttribute('r',  avatarR);
    clip.appendChild(clipC);
    defs.appendChild(clip);

    const img = svgEl('image');
    img.setAttribute('x',    avatarCX - avatarR);
    img.setAttribute('y',    avatarY  - avatarR);
    img.setAttribute('width',  avatarR * 2);
    img.setAttribute('height', avatarR * 2);
    img.setAttribute('href',   person.picture);
    img.setAttribute('clip-path', `url(#${clipId})`);
    img.setAttribute('preserveAspectRatio', 'xMidYMid slice');
    g.appendChild(img);
  }

  // Name — start after avatar if picture present, otherwise left-aligned
  const textX    = person.picture ? avatarCX + avatarR + 8 : 12;
  const maxChars = person.picture ? 10 : 14;

  const firstName = svgEl('text');
  firstName.setAttribute('x',     textX);
  firstName.setAttribute('y',     NH / 2 - 10);
  firstName.setAttribute('class', 'person-name');
  firstName.textContent = truncate(person.firstName || '', maxChars);
  g.appendChild(firstName);

  const lastName = svgEl('text');
  lastName.setAttribute('x',     textX);
  lastName.setAttribute('y',     NH / 2 + 7);
  lastName.setAttribute('class', 'person-last-name');
  lastName.textContent = truncate(person.lastName || '', maxChars);
  g.appendChild(lastName);

  if (person.comments) {
    const meta = svgEl('text');
    meta.setAttribute('x',     textX);
    meta.setAttribute('y',     NH / 2 + 22);
    meta.setAttribute('class', 'person-meta');
    meta.textContent = truncate(person.comments, person.picture ? 12 : 18);
    g.appendChild(meta);
  }

  // Click to show detail panel
  g.addEventListener('click', (e) => {
    e.stopPropagation();
    hideContextMenu();
    showDetail(person);
  });

  // ▲ Ancestors (top-right) / ▼ Descendants (bottom-right). Highlighted when
  // this person has parents / children that the current view doesn't show.
  const nav = navStateFor(person);
  const upTip = { more: `Has ${nav.upCount === 1 ? 'a parent' : 'parents'} not shown here. Tap to see ancestors`, shown: 'Show ancestors', none: 'No parents recorded' }[nav.up];
  const downTip = { more: `Has ${nav.downCount === 1 ? 'a child' : `${nav.downCount} children`} not shown here. Tap to see descendants`, shown: 'Show descendants', none: 'No children recorded' }[nav.down];
  g.appendChild(makeNavBtn(NW - 13, 13, '▲', () => focusAncestors(person, { preserveView: true }), nav.up, upTip));
  g.appendChild(makeNavBtn(NW - 13, NH - 13, '▼', () => focusDescendants(person, { preserveView: true }), nav.down, downTip));

  // + Add — bottom-left corner (always shown when editing configured)
  { // shown only in edit mode (body.can-edit), see updateEditMode()
    const ag = svgEl('g');
    ag.setAttribute('transform', `translate(13,${NH - 13})`);
    ag.setAttribute('class', 'add-btn-group');
    const ac = svgEl('circle');
    ac.setAttribute('r', 10);
    ac.setAttribute('class', 'add-btn-circle');
    ag.appendChild(ac);
    const at = svgEl('text');
    at.setAttribute('class', 'add-btn-label');
    at.textContent = '+';
    ag.appendChild(at);
    ag.addEventListener('click', e => { e.stopPropagation(); showContextMenu(e, person); });
    g.appendChild(ag);
  }

  // ✎ Edit — top-left corner (only when editing is configured)
  { // shown only in edit mode (body.can-edit), see updateEditMode()
    const eg = svgEl('g');
    eg.setAttribute('transform', `translate(13,13)`);
    eg.setAttribute('class', 'edit-btn-group');
    const ec = svgEl('circle');
    ec.setAttribute('r', 10);
    ec.setAttribute('class', 'edit-btn-circle');
    eg.appendChild(ec);
    const et = svgEl('text');
    et.setAttribute('class', 'edit-btn-label');
    et.textContent = '✎';
    eg.appendChild(et);
    eg.addEventListener('click', e => { e.stopPropagation(); openEditModal(person); });
    g.appendChild(eg);
  }

  return g;
}

// ===================================================================
// DETAIL PANEL
// ===================================================================
function showDetail(person) {
  detailPanel.classList.remove('hidden');

  if (person.picture) {
    detailAvatar.innerHTML = `<img src="${escHtml(person.picture)}" alt="${escHtml(person.firstName)}" />`;
  } else {
    detailAvatar.textContent = (person.firstName || '?')[0].toUpperCase();
  }

  detailName.textContent = `${person.firstName || ''} ${person.lastName || ''}`.trim() || '(Unknown)';

  const meta = [];
  if (person.id) meta.push(`ID: ${person.id}`);
  if (person.spouse) {
    const sp = state.people.find(p => p.id === person.spouse);
    if (sp) meta.push(`Spouse: ${sp.firstName} ${sp.lastName}`);
  }
  detailMeta.textContent = meta.join(' · ');
  detailComments.textContent = person.comments || '';
  detailComments.style.display = person.comments ? '' : 'none';
}

// ===================================================================
// CONTEXT MENU
// ===================================================================
function showContextMenu(e, person) {
  ctxTarget = person;
  e.preventDefault();

  const hasSpouse    = !!person.spouse;
  const parentCount  = (person.parent1 ? 1 : 0) + (person.parent2 ? 1 : 0);
  ctxAddSpouse.style.display = hasSpouse    ? 'none' : 'block';
  ctxAddParent.style.display = parentCount >= 2 ? 'none' : 'block';

  contextMenu.style.left = `${e.clientX}px`;
  contextMenu.style.top  = `${e.clientY}px`;
  contextMenu.classList.remove('hidden');
}

function hideContextMenu() {
  contextMenu.classList.add('hidden');
  ctxTarget = null;
}

// ===================================================================
// ADD MODAL
// ===================================================================
function openAddModal(relation, relatedPerson) {
  if (!canEdit()) {
    showToast('Tap "Sign in to edit" at the top first.', 'error');
    return;
  }

  formRelation.value   = relation;
  formRelatedTo.value  = relatedPerson?.id ?? '';
  formFirstName.value  = '';
  formLastName.value   = '';
  formPicture.value    = '';
  formComments.value   = '';
  hideError(formError);

  const relName = relatedPerson ? `${relatedPerson.firstName || ''} ${relatedPerson.lastName || ''}`.trim() : '';
  const label = relation === 'child'  ? `Add child of ${relName}`
              : relation === 'parent' ? `Add parent of ${relName}`
              :                         `Add spouse of ${relName}`;
  $('modal-title').textContent = label.trim();

  // Show parent section only when adding a child
  const parentsSection = $('form-parents-section');
  if (relation === 'child' && relatedPerson) {
    parentsSection.classList.remove('hidden');
    $('form-parent1-display').textContent =
      `${relatedPerson.firstName || ''} ${relatedPerson.lastName || ''}`.trim();
    // Pre-fill parent2 with existing spouse if any
    const spouse = relatedPerson.spouse
      ? state.people.find(p => p.id === relatedPerson.spouse)
      : null;
    $('form-parent2-id').value     = spouse?.id     ?? '';
    $('form-parent2-search').value = spouse
      ? `${spouse.firstName || ''} ${spouse.lastName || ''}`.trim()
      : '';
    $('form-parent2-dropdown').classList.add('hidden');
  } else {
    parentsSection.classList.add('hidden');
    $('form-parent2-id').value     = '';
    $('form-parent2-search').value = '';
  }

  addModal.classList.remove('hidden');
}

function hideAddModal() {
  addModal.classList.add('hidden');
}

async function onAddFormSubmit(e) {
  e.preventDefault();
  hideError(formError);

  const firstName = formFirstName.value.trim();
  const lastName  = formLastName.value.trim();
  const picture   = formPicture.value.trim();
  const comments  = formComments.value.trim();
  const relation  = formRelation.value;
  const relatedId = formRelatedTo.value;

  if (!firstName) {
    showError(formError, 'First name is required.');
    return;
  }

  const newId = generateId(state.people);
  const relatedPerson = state.people.find(p => p.id === relatedId);

  let parent1 = '', parent2 = '', spouse = '';
  const parent2Id = $('form-parent2-id').value;

  if (relation === 'child') {
    parent1 = relatedId;
    parent2 = parent2Id || (relatedPerson?.spouse ?? '');
  } else if (relation === 'spouse') {
    spouse = relatedId;
  }
  // 'parent': new person has no parents; child's parent slot is updated below

  const newPerson = { id: newId, firstName, lastName, parent1, parent2, spouse, picture, comments };

  const btn = $('form-submit-btn');
  btn.disabled    = true;
  btn.textContent = 'Saving…';

  try {
    await appendToSheet(newPerson);

    state.people.push(newPerson);

    if (relation === 'spouse' && relatedPerson) {
      relatedPerson.spouse = newId;
      await appendSpouseUpdate(relatedPerson, newId);
    }

    // If a second parent was chosen, link the two parents as spouses of each other
    if (relation === 'child' && parent2Id) {
      const p1 = relatedPerson;
      const p2 = state.people.find(p => p.id === parent2Id);
      if (p1 && p2 && p1.spouse !== p2.id) {
        await appendSpouseUpdate(p1, p2.id);
        await appendSpouseUpdate(p2, p1.id);
      }
    }

    // Adding a parent: fill child's empty parent slot; link with existing parent as spouse
    if (relation === 'parent' && relatedPerson) {
      const slot = !relatedPerson.parent1 ? 'parent1' : 'parent2';
      relatedPerson[slot] = newId;
      await appendParentUpdate(relatedPerson.id, slot, newId);
      // If filling parent2 and parent1 exists, link as spouses
      if (slot === 'parent2' && relatedPerson.parent1) {
        const existingParent = state.people.find(p => p.id === relatedPerson.parent1);
        if (existingParent && existingParent.spouse !== newId) {
          await appendSpouseUpdate(existingParent, newId);
          await appendSpouseUpdate(newPerson, existingParent.id);
        }
      }
    }

    hideAddModal();
    rerenderCurrentView(relatedPerson?.id ?? newId);
    if (!state.importMode) {
      showToast(`${firstName} added!`, 'success');
      syncFromSheetQuietly(relatedPerson?.id ?? newId, 2000);
    }
  } catch (err) {
    showError(formError, err.message || 'Failed to save. Please check your Apps Script URL.');
  } finally {
    btn.disabled    = false;
    btn.textContent = 'Add Person';
  }
}

async function appendSpouseUpdate(person, newSpouseId) {
  if (state.importMode) return;
  if (usesSheetsAPI()) {
    await updateSpouseViaAPI(person.id, newSpouseId);
  } else if (state.appsScriptUrl) {
    // fire-and-forget (no-cors — can't read response)
    await fetch(state.appsScriptUrl, {
      method: 'POST',
      mode:   'no-cors',
      headers: { 'Content-Type': 'text/plain' },
      body:    JSON.stringify({ action: 'updateSpouse', id: person.id, spouse: newSpouseId }),
    });
  }
}

async function updateSpouseViaAPI(personId, newSpouseId) {
  const token = await requestGoogleToken();
  const base  = `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(state.sheetId)}`;
  const row   = await findSheetRow(personId, token, base);
  const putResp = await fetch(`${base}/values/F${row}?valueInputOption=USER_ENTERED`, {
    method:  'PUT',
    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
    body:    JSON.stringify({ values: [[String(newSpouseId)]] }),
  });
  if (!putResp.ok) {
    const body = await putResp.json().catch(() => ({}));
    throw new Error('Could not update spouse in sheet: ' + (body.error?.message || putResp.status));
  }
}

async function appendParentUpdate(childId, slot, parentId) {
  if (state.importMode) return;
  if (usesSheetsAPI()) {
    await updateParentViaAPI(childId, slot, parentId);
  } else if (state.appsScriptUrl) {
    await fetch(state.appsScriptUrl, {
      method: 'POST',
      mode:   'no-cors',
      headers: { 'Content-Type': 'text/plain' },
      body:    JSON.stringify({ action: 'updateParent', id: childId, slot, parentId }),
    });
  }
}

async function updateParentViaAPI(childId, slot, parentId) {
  const token = await requestGoogleToken();
  const base  = `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(state.sheetId)}`;
  const row   = await findSheetRow(childId, token, base);
  // parent1 → col D, parent2 → col E
  const col   = slot === 'parent2' ? 'E' : 'D';
  const putResp = await fetch(`${base}/values/${col}${row}?valueInputOption=USER_ENTERED`, {
    method:  'PUT',
    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
    body:    JSON.stringify({ values: [[String(parentId)]] }),
  });
  if (!putResp.ok) {
    const body = await putResp.json().catch(() => ({}));
    throw new Error('Could not update parent in sheet: ' + (body.error?.message || putResp.status));
  }
}

// ===================================================================
// EDIT PERSON — modal UI
// ===================================================================
function openEditModal(person) {
  $('edit-form-id').value         = person.id;
  $('edit-form-first-name').value = person.firstName || '';
  $('edit-form-last-name').value  = person.lastName  || '';
  $('edit-form-picture').value    = person.picture   || '';
  $('edit-form-comments').value   = person.comments  || '';
  hideError($('edit-form-error'));
  $('edit-modal').classList.remove('hidden');
}

function closeEditModal() {
  $('edit-modal').classList.add('hidden');
}

async function onEditFormSubmit(e) {
  e.preventDefault();
  const id        = $('edit-form-id').value;
  const firstName = $('edit-form-first-name').value.trim();
  const lastName  = $('edit-form-last-name').value.trim();
  const picture   = $('edit-form-picture').value.trim();
  const comments  = $('edit-form-comments').value.trim();
  const errEl     = $('edit-form-error');
  if (!firstName) { showError(errEl, 'First name is required.'); return; }

  const btn = $('edit-form-submit-btn');
  btn.disabled = true;
  btn.textContent = 'Saving…';
  hideError(errEl);

  try {
    if (!state.importMode) {
      if (usesSheetsAPI())          await updatePersonViaAPI(id, firstName, lastName, picture, comments);
      else if (state.appsScriptUrl) await updatePersonViaScript(id, firstName, lastName, picture, comments);
    }
    // Show the change right away, in the same view and at the same spot
    const person = state.people.find(p => String(p.id) === String(id));
    if (person) { person.firstName = firstName; person.lastName = lastName; person.picture = picture; person.comments = comments; }
    closeEditModal();
    rerenderCurrentView(id);
    if (!state.importMode) {
      showToast('Saved!', 'success');
      syncFromSheetQuietly(id);
    }
  } catch (err) {
    showError(errEl, err.message || 'Failed to save.');
  } finally {
    btn.disabled = false;
    btn.textContent = 'Save';
  }
}

async function onEditFormDelete() {
  const id   = $('edit-form-id').value;
  const person = state.people.find(p => String(p.id) === String(id));
  const name = person ? `${person.firstName} ${person.lastName || ''}`.trim() : id;
  if (!confirm(`Remove "${name}" from the family tree? This cannot be undone.`)) return;

  const errEl = $('edit-form-error');
  const btn   = $('edit-form-delete-btn');
  btn.disabled = true;
  btn.textContent = 'Removing…';
  hideError(errEl);

  try {
    if (!state.importMode) {
      if (usesSheetsAPI())          await deletePersonViaAPI(id);
      else if (state.appsScriptUrl) await deletePersonViaScript(id);
    }
    // Keep a close relative (or whoever is nearest the middle) fixed on screen
    const anchor = [person?.spouse, person?.parent1, person?.parent2,
      ...state.people.filter(p => String(p.parent1) === String(id) || String(p.parent2) === String(id)).map(p => p.id)]
      .find(a => a && state.layout?.positions?.[a]) || centerPersonId(id);
    state.people = state.people.filter(p => String(p.id) !== String(id));
    if (String(state.focusId) === String(id)) { state.viewMode = 'full'; state.focusId = null; state.focusedName = null; updateModeBar(); }
    closeEditModal();
    detailPanel.classList.add('hidden');
    rerenderCurrentView(anchor);
    if (!state.importMode) {
      showToast('Removed!', 'success');
      syncFromSheetQuietly(anchor);
    }
  } catch (err) {
    showError(errEl, err.message || 'Failed to remove.');
    btn.disabled = false;
    btn.textContent = '🗑 Remove';
  }
}

// ===================================================================
// EDIT PERSON — write via Sheets API
// ===================================================================
async function updatePersonViaAPI(personId, firstName, lastName, picture, comments) {
  const token = await requestGoogleToken();
  const base  = `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(state.sheetId)}`;
  const row   = await findSheetRow(personId, token, base);
  // Update B:C (name), G (picture) and H (comments) in one values:batchUpdate
  const resp = await fetch(`${base}/values:batchUpdate`, {
    method:  'POST',
    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      valueInputOption: 'USER_ENTERED',
      data: [
        { range: `B${row}:C${row}`, values: [[firstName, lastName]] },
        { range: `G${row}`,         values: [[picture || '']] },
        { range: `H${row}`,         values: [[comments]] },
      ],
    }),
  });
  if (!resp.ok) {
    const body = await resp.json().catch(() => ({}));
    throw new Error('Could not update person: ' + (body.error?.message || resp.status));
  }
}

async function deletePersonViaAPI(personId) {
  const token  = await requestGoogleToken();
  const base   = `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(state.sheetId)}`;
  const row    = await findSheetRow(personId, token, base);

  // Fetch sheetId (gid) for the first sheet
  const metaResp = await fetch(`${base}?fields=sheets.properties`, {
    headers: { 'Authorization': `Bearer ${token}` },
  });
  if (!metaResp.ok) throw new Error('Could not fetch sheet metadata.');
  const meta   = await metaResp.json();
  const sheetGid = meta.sheets?.[0]?.properties?.sheetId ?? 0;

  const resp = await fetch(`${base}:batchUpdate`, {
    method:  'POST',
    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
    body:    JSON.stringify({
      requests: [{
        deleteDimension: {
          range: { sheetId: sheetGid, dimension: 'ROWS', startIndex: row - 1, endIndex: row },
        },
      }],
    }),
  });
  if (!resp.ok) {
    const body = await resp.json().catch(() => ({}));
    throw new Error('Could not delete person: ' + (body.error?.message || resp.status));
  }
}

// Shared helper: find the 1-based row index of personId in column A
async function findSheetRow(personId, token, base) {
  const resp = await fetch(`${base}/values/A:A`, {
    headers: { 'Authorization': `Bearer ${token}` },
  });
  if (!resp.ok) {
    const body = await resp.json().catch(() => ({}));
    throw new Error('Could not read sheet: ' + (body.error?.message || resp.status));
  }
  const { values = [] } = await resp.json();
  for (let i = 0; i < values.length; i++) {
    if (String(values[i][0]).trim() === String(personId).trim()) return i + 1;
  }
  throw new Error(`Could not find person ID ${personId} in sheet.`);
}

// ===================================================================
// EDIT PERSON — write via Apps Script
// ===================================================================
async function updatePersonViaScript(personId, firstName, lastName, picture, comments) {
  await fetch(state.appsScriptUrl, {
    method: 'POST', mode: 'no-cors',
    headers: { 'Content-Type': 'text/plain' },
    body: JSON.stringify({ action: 'updatePerson', id: personId, firstName, lastName, picture, comments }),
  });
}

async function deletePersonViaScript(personId) {
  await fetch(state.appsScriptUrl, {
    method: 'POST', mode: 'no-cors',
    headers: { 'Content-Type': 'text/plain' },
    body: JSON.stringify({ action: 'deletePerson', id: personId }),
  });
}

// ===================================================================
// ID GENERATION
// ===================================================================
function generateId(people) {
  const nums = people.map(p => parseFloat(p.id)).filter(n => !isNaN(n));
  return nums.length ? String(Math.max(...nums) + 1) : String(Date.now());
}

// ===================================================================
// PAN / ZOOM
// ===================================================================
function applyTransform() {
  treeRoot.setAttribute('transform', `translate(${view.x},${view.y}) scale(${view.scale})`);
}

function zoom(factor, cx, cy) {
  const rect = treeSvg.getBoundingClientRect();
  const px   = cx ?? rect.width  / 2;
  const py   = cy ?? rect.height / 2;

  const newScale = Math.min(Math.max(view.scale * factor, 0.1), 4);
  const ratio    = newScale / view.scale;

  view.x     = px - ratio * (px - view.x);
  view.y     = py - ratio * (py - view.y);
  view.scale = newScale;
  applyTransform();
}

function resetView(canvasW, canvasH, focalCX = null) {
  const rect = treeSvg.getBoundingClientRect();
  if (!rect.width) return;

  const cW = canvasW ?? state.canvasW ?? 1000;
  const cH = canvasH ?? state.canvasH ?? 600;

  const scaleX = (rect.width  - 80) / cW;
  const scaleY = (rect.height - 80) / cH;
  view.scale   = Math.min(scaleX, scaleY, 1);

  if (focalCX !== null) {
    // Horizontally centre on the focal node; vertically fit the full tree
    view.x = rect.width  / 2 - focalCX * view.scale;
    view.y = (rect.height - cH * view.scale) / 2;
  } else {
    view.x = (rect.width  - cW * view.scale) / 2;
    view.y = (rect.height - cH * view.scale) / 2;
  }
  applyTransform();
}

// Pick the person to centre on when a tree first loads: a random person who
// has at least one relative, so the opening view shows a family, not a lone box.
function pickStartPerson(people, byId, childrenOf) {
  if (!people.length) return null;
  const named = p => p.firstName && !/^(unknown|\?+)$/i.test(p.firstName.trim());
  const connected = people.filter(p => named(p) && (
    (p.parent1 && byId[p.parent1]) ||
    (p.parent2 && byId[p.parent2]) ||
    (p.spouse  && byId[p.spouse])  ||
    (childrenOf[p.id] && childrenOf[p.id].length)
  ));
  const pool = connected.length ? connected : people;
  return pool[Math.floor(Math.random() * pool.length)];
}

// Run fn once the tree area has been laid out (it has no size for a frame or
// two right after the tree screen is shown, which would centre on the wrong spot).
function whenTreeSized(fn, tries = 60) {
  requestAnimationFrame(() => {
    const r = treeSvg.getBoundingClientRect();
    if ((r.width > 50 && r.height > 50) || tries <= 0) fn();
    else whenTreeSized(fn, tries - 1);
  });
}

// Readable zoom level: about 3 boxes across on a phone, full size on a desktop.
function readableScale() {
  const rect = treeSvg.getBoundingClientRect();
  return Math.min(1, Math.max(0.55, rect.width / (NW * 3.2)));
}

function zoomToPerson(personId) {
  const pos = state.layout?.positions?.[personId];
  if (!pos) return;
  view.scale = readableScale();
  panToPosition(pos.x + NW / 2, pos.y + NH / 2);
  highlightNode(personId);
}

function onWheel(e) {
  e.preventDefault();
  const rect   = treeSvg.getBoundingClientRect();
  const factor = e.deltaY < 0 ? 1.1 : 0.9;
  zoom(factor, e.clientX - rect.left, e.clientY - rect.top);
}

function onMouseDown(e) {
  if (e.button !== 0) return;
  view.dragging = true;
  view.startX   = e.clientX;
  view.startY   = e.clientY;
  view.startVX  = view.x;
  view.startVY  = view.y;
}

function onMouseMove(e) {
  if (!view.dragging) return;
  view.x = view.startVX + (e.clientX - view.startX);
  view.y = view.startVY + (e.clientY - view.startY);
  applyTransform();
}

function onMouseUp() {
  view.dragging = false;
}

// ── Touch pan & pinch-zoom ────────────────────────────────────────
let touch1 = null, touch2 = null, pinchStartDist = null, pinchStartScale = null;
let tapStartTime = 0, tapStartX = 0, tapStartY = 0, tapMoved = false;
const TAP_THRESHOLD = 8;   // px movement before it's a drag
const TAP_MAX_MS    = 300; // ms max duration for a tap

function touchMidpoint(a, b) {
  return { x: (a.clientX + b.clientX) / 2, y: (a.clientY + b.clientY) / 2 };
}
function touchDist(a, b) {
  return Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
}

function onTouchStart(e) {
  e.preventDefault();
  const rect = treeSvg.getBoundingClientRect();
  if (e.touches.length === 1) {
    touch1 = e.touches[0];
    touch2 = null;
    view.dragging = false; // don't start dragging until movement threshold
    view.startX  = touch1.clientX;
    view.startY  = touch1.clientY;
    view.startVX = view.x;
    view.startVY = view.y;
    tapStartTime = Date.now();
    tapStartX    = touch1.clientX;
    tapStartY    = touch1.clientY;
    tapMoved     = false;
  } else if (e.touches.length === 2) {
    touch1 = e.touches[0];
    touch2 = e.touches[1];
    view.dragging   = false;
    tapMoved        = true; // suppress tap on pinch-end
    pinchStartDist  = touchDist(touch1, touch2);
    pinchStartScale = view.scale;
    const mid    = touchMidpoint(touch1, touch2);
    view.startX  = mid.x - rect.left;
    view.startY  = mid.y - rect.top;
    view.startVX = view.x;
    view.startVY = view.y;
  }
}

function onTouchMove(e) {
  e.preventDefault();
  const rect = treeSvg.getBoundingClientRect();
  if (e.touches.length === 1) {
    const t  = e.touches[0];
    const dx = t.clientX - view.startX;
    const dy = t.clientY - view.startY;
    if (!tapMoved && Math.hypot(t.clientX - tapStartX, t.clientY - tapStartY) > TAP_THRESHOLD) {
      tapMoved = true;
      view.dragging = true;
    }
    if (view.dragging) {
      view.x = view.startVX + dx;
      view.y = view.startVY + dy;
      applyTransform();
    }
  } else if (e.touches.length === 2 && pinchStartDist !== null) {
    const a = e.touches[0], b = e.touches[1];
    const newScale = Math.min(Math.max(pinchStartScale * (touchDist(a, b) / pinchStartDist), 0.1), 4);
    const mid = touchMidpoint(a, b);
    const cx  = mid.x - rect.left;
    const cy  = mid.y - rect.top;
    const contentX = (view.startX - view.startVX) / pinchStartScale;
    const contentY = (view.startY - view.startVY) / pinchStartScale;
    view.x     = cx - contentX * newScale;
    view.y     = cy - contentY * newScale;
    view.scale = newScale;
    applyTransform();
  }
}

function onTouchEnd(e) {
  e.preventDefault();
  // Tap detection — fire a click on the element under the finger
  if (e.changedTouches.length === 1 && !tapMoved && Date.now() - tapStartTime < TAP_MAX_MS) {
    const t      = e.changedTouches[0];
    const target = document.elementFromPoint(t.clientX, t.clientY);
    if (target) {
      target.dispatchEvent(new MouseEvent('click', {
        bubbles: true, cancelable: true,
        clientX: t.clientX, clientY: t.clientY,
        screenX: t.screenX, screenY: t.screenY,
      }));
    }
  }
  if (e.touches.length === 0) {
    view.dragging   = false;
    pinchStartDist  = null;
    touch1 = touch2 = null;
  } else if (e.touches.length === 1) {
    // One finger lifted during pinch — switch back to single-finger pan
    pinchStartDist = null;
    touch1 = e.touches[0];
    view.dragging = false;
    tapMoved     = true; // don't fire a tap at end of pinch
    view.startX  = touch1.clientX;
    view.startY  = touch1.clientY;
    view.startVX = view.x;
    view.startVY = view.y;
  }
}

// ===================================================================
// EMPTY STATE
// ===================================================================
function showEmptyState() {
  const container = $('tree-container');
  const div = document.createElement('div');
  div.className = 'empty-state';
  div.innerHTML = `
    <div class="emoji">🌳</div>
    <h3>No family members found</h3>
    <p>Make sure your Google Sheet is public and has at least one row of data (after the header row).</p>
  `;
  container.appendChild(div);
}

// ===================================================================
// HELP MODALS
// ===================================================================
function showHelp()      { helpModal.classList.remove('hidden'); }
function hideHelp()      { helpModal.classList.add('hidden'); }

function copyScript() {
  const code = $('apps-script-code').textContent;
  navigator.clipboard.writeText(code).then(() => {
    showToast('Script copied to clipboard!', 'success');
  });
}

// ===================================================================
// TOAST
// ===================================================================
function createToast() {
  const el = document.createElement('div');
  el.id = 'toast';
  document.body.appendChild(el);
  return el;
}

let toastTimer;
function showToast(msg, type = '') {
  toastEl.textContent = msg;
  toastEl.className   = `show ${type}`;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { toastEl.className = ''; }, 3500);
}

// ===================================================================
// EXPORT / IMPORT
// ===================================================================
function peopleToCSV(people) {
  const header = 'id,firstName,lastName,parent1,parent2,spouse,picture,comments';
  const escape = (v) => {
    const s = String(v ?? '');
    return s.includes(',') || s.includes('"') || s.includes('\n')
      ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const rows = people.map(p =>
    [p.id, p.firstName, p.lastName, p.parent1, p.parent2, p.spouse, p.picture, p.comments]
      .map(escape).join(',')
  );
  return [header, ...rows].join('\r\n');
}

function onExportClick() {
  if (!state.people.length) { showToast('No data to export.', 'error'); return; }
  const csv  = peopleToCSV(state.people);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = 'family-tree.csv';
  a.click();
  URL.revokeObjectURL(url);
}

function onImportFileChange(e) {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (ev) => {
    const people = parseCSV(ev.target.result);
    if (!people.length) { showToast('Could not parse CSV — check the file format.', 'error'); return; }
    state.people     = people;
    state.importMode = true;
    state.treeOpen   = true;
    hideHome();
    // Reset file input so the same file can be re-imported
    e.target.value = '';
    showTreeScreen();
    updateSignInBtn();
    renderFamilyTree(people, null, null, { startFocus: true });
    updateTreeSwitcher();
    showToast(`Imported ${people.length} people (local only — edits won't sync to Google Sheets).`, '');
  };
  reader.readAsText(file);
}

// ===================================================================
// SEARCH
// ===================================================================
let searchActiveIdx = -1;

function initSearch() {
  const input = $('search-input');
  if (!input) return;
  input.addEventListener('input', onSearchInput);
  input.addEventListener('keydown', onSearchKeydown);
  input.addEventListener('blur', () => setTimeout(closeSearchDropdown, 150));

  // Parent 2 autocomplete in add modal
  const p2input    = $('form-parent2-search');
  const p2dropdown = $('form-parent2-dropdown');
  if (p2input && p2dropdown) {
    p2input.addEventListener('input', () => {
      const q = p2input.value.trim().toLowerCase();
      if (!q) { p2dropdown.classList.add('hidden'); return; }
      const matches = state.people.filter(p => {
        const full = `${p.firstName} ${p.lastName || ''}`.toLowerCase();
        return full.includes(q);
      }).slice(0, 10);
      if (!matches.length) { p2dropdown.classList.add('hidden'); return; }
      p2dropdown.innerHTML = '';
      matches.forEach(p => {
        const btn  = document.createElement('button');
        btn.className = 'search-item';
        const full  = `${p.firstName} ${p.lastName || ''}`.trim();
        const lower = full.toLowerCase();
        const start = lower.indexOf(q);
        if (start >= 0) {
          btn.innerHTML =
            escHtml(full.slice(0, start)) +
            `<mark>${escHtml(full.slice(start, start + q.length))}</mark>` +
            escHtml(full.slice(start + q.length));
        } else {
          btn.textContent = full;
        }
        btn.addEventListener('mousedown', (e) => {
          e.preventDefault();
          $('form-parent2-id').value     = p.id;
          p2input.value                  = full;
          p2dropdown.classList.add('hidden');
        });
        p2dropdown.appendChild(btn);
      });
      p2dropdown.classList.remove('hidden');
    });
    p2input.addEventListener('blur', () => setTimeout(() => p2dropdown.classList.add('hidden'), 150));
  }
}

function onSearchInput() {
  const q = $('search-input').value.trim().toLowerCase();
  const dropdown = $('search-dropdown');
  searchActiveIdx = -1;

  if (!q) { closeSearchDropdown(); return; }

  const matches = state.people.filter(p => {
    const full = `${p.firstName} ${p.lastName || ''}`.toLowerCase();
    return full.includes(q);
  }).slice(0, 10);

  if (!matches.length) { closeSearchDropdown(); return; }

  dropdown.innerHTML = '';
  matches.forEach(p => {
    const btn = document.createElement('button');
    btn.className = 'search-item';

    const full  = `${p.firstName} ${p.lastName || ''}`.trim();
    const lower = full.toLowerCase();
    const start = lower.indexOf(q);
    if (start >= 0) {
      btn.innerHTML =
        escHtml(full.slice(0, start)) +
        `<mark>${escHtml(full.slice(start, start + q.length))}</mark>` +
        escHtml(full.slice(start + q.length));
    } else {
      btn.textContent = full;
    }

    btn.addEventListener('mousedown', (e) => { e.preventDefault(); searchFocusPerson(p); });
    dropdown.appendChild(btn);
  });

  dropdown.classList.remove('hidden');
}

function onSearchKeydown(e) {
  const dropdown = $('search-dropdown');
  if (dropdown.classList.contains('hidden')) return;

  const items = dropdown.querySelectorAll('.search-item');
  if (!items.length) return;

  if (e.key === 'ArrowDown') {
    e.preventDefault();
    searchActiveIdx = Math.min(searchActiveIdx + 1, items.length - 1);
    updateSearchActive(items);
  } else if (e.key === 'ArrowUp') {
    e.preventDefault();
    searchActiveIdx = Math.max(searchActiveIdx - 1, 0);
    updateSearchActive(items);
  } else if (e.key === 'Enter') {
    e.preventDefault();
    const target = searchActiveIdx >= 0 ? items[searchActiveIdx] : items[0];
    if (target) target.dispatchEvent(new MouseEvent('mousedown'));
  } else if (e.key === 'Escape') {
    closeSearchDropdown();
    $('search-input').blur();
  }
}

function updateSearchActive(items) {
  items.forEach((el, i) => el.classList.toggle('active', i === searchActiveIdx));
}

function closeSearchDropdown() {
  const dropdown = $('search-dropdown');
  if (dropdown) dropdown.classList.add('hidden');
  searchActiveIdx = -1;
}

function searchFocusPerson(person) {
  $('search-input').value = '';
  closeSearchDropdown();
  focusDescendants(person, { includeParents: true });
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      const pos = state.layout?.positions?.[person.id];
      if (pos) {
        panToPosition(pos.x + NW / 2, pos.y + NH / 2);
        highlightNode(person.id);
      }
    });
  });
}

function panToPosition(cx, cy) {
  const rect = treeSvg.getBoundingClientRect();
  view.x = rect.width  / 2 - cx * view.scale;
  view.y = rect.height / 2 - cy * view.scale;
  applyTransform();
}


function highlightNode(personId) {
  document.querySelectorAll('.node-rect.highlighted').forEach(el => el.classList.remove('highlighted'));
  const group = treeRoot.querySelector(`[data-id="${CSS.escape(personId)}"]`);
  if (!group) return;
  const rect = group.querySelector('.node-rect');
  if (rect) {
    rect.classList.add('highlighted');
    setTimeout(() => rect.classList.remove('highlighted'), 2500);
  }
}

// ===================================================================
// HELPERS
// ===================================================================
function svgEl(tag) {
  return document.createElementNS('http://www.w3.org/2000/svg', tag);
}

function escHtml(str) {
  return (str || '').replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
}

function truncate(str, max) {
  return str.length > max ? str.slice(0, max - 1) + '…' : str;
}

function showError(el, msg) {
  el.textContent = msg;
  el.classList.remove('hidden');
}

function hideError(el) {
  el.textContent = '';
  el.classList.add('hidden');
}
