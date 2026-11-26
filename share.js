// ===================================================================
// SHARE — "Share" button: view link + invite people to edit
// -------------------------------------------------------------------
// View link: anyone with it can see the tree (the sheet is "anyone with
// the link can view"). Editors: added as Editors of the Google Sheet through
// the Drive API, which works with the built-in sign-in for sheets that were
// created or picked with the app. Google emails each invited person.
// Depends on app.js globals: $, state, showToast, canEdit, usingSharedSignIn,
// requestGoogleToken, ensureEditAccess, updateSignInBtn, treeTitle, escHtml,
// requestMode; and requests.js: requestsAvailable.
// ===================================================================

function treeLink(id = state.sheetId) {
  return `${window.location.origin}${window.location.pathname}?sheet=${encodeURIComponent(id)}`;
}

// ── "Open the link on": whole tree, or a person + up/down ─────────────
const personLabel = p => `${p.firstName} ${p.lastName || ''}`.trim() + ` · #${p.id}`;

function shareTargetPerson() {
  const m = $('share-person-input').value.match(/#(\S+)\s*$/);
  return m ? state.people.find(p => String(p.id) === m[1]) : null;
}

// The link shown in the dialog, with &person= / &view= when a person is chosen
function shareLink() {
  let link = treeLink();
  if ($('share-target-mode').value === 'person') {
    const person = shareTargetPerson();
    if (person) {
      const dir = document.querySelector('input[name="share-dir"]:checked')?.value || 'up';
      link += `&person=${encodeURIComponent(person.id)}&view=${dir}`;
    }
  }
  return link;
}

function updateShareLink() {
  const personMode = $('share-target-mode').value === 'person';
  $('share-person-row').classList.toggle('hidden', !personMode);
  const missing = personMode && !shareTargetPerson();
  $('share-person-error').classList.toggle('hidden', !(missing && $('share-person-input').value.trim()));
  $('share-link-input').value = shareLink();
}

// Start from what's on screen: an ancestors / descendants view pre-selects that person
function prefillShareTarget() {
  $('share-person-list').innerHTML = state.people
    .map(p => `<option value="${escHtml(personLabel(p))}"></option>`).join('');
  const focal = state.focusId != null ? state.people.find(p => String(p.id) === String(state.focusId)) : null;
  if (focal && (state.viewMode === 'ancestors' || state.viewMode === 'descendants')) {
    $('share-target-mode').value = 'person';
    $('share-person-input').value = personLabel(focal);
    document.querySelector(`input[name="share-dir"][value="${state.viewMode === 'ancestors' ? 'up' : 'down'}"]`).checked = true;
  } else {
    $('share-target-mode').value = 'tree';
    $('share-person-input').value = '';
    document.querySelector('input[name="share-dir"][value="up"]').checked = true;
  }
  updateShareLink();
}

function sheetEditUrl(id = state.sheetId) {
  return `https://docs.google.com/spreadsheets/d/${encodeURIComponent(id)}/edit`;
}

function openShareModal() {
  if (!state.sheetId || state.importMode) return;
  $('share-title').textContent = `Share "${treeTitle(state.sheetId)}"`;
  prefillShareTarget();
  $('share-native-btn').classList.toggle('hidden', !navigator.share);
  $('share-invite-error').classList.add('hidden');
  $('share-modal').classList.remove('hidden');
  renderEditorsSection();
}

function closeShareModal() { $('share-modal').classList.add('hidden'); }

async function copyShareLink() {
  const btn = $('share-copy-btn');
  try {
    await navigator.clipboard.writeText($('share-link-input').value);
    btn.textContent = '✓ Copied';
    setTimeout(() => { btn.textContent = 'Copy'; }, 1600);
  } catch {
    $('share-link-input').select();
    showToast('Select the link and copy it yourself.', 'error');
  }
}

async function nativeShare() {
  try {
    await navigator.share({
      title: treeTitle(state.sheetId),
      text: `Here's our family tree: ${treeTitle(state.sheetId)}`,
      url: shareLink(),
    });
  } catch { /* cancelled */ }
}

// ── Editors ───────────────────────────────────────────────────────────
async function driveFetch(path, opts = {}) {
  const token = await requestGoogleToken();
  const resp = await fetch(`https://www.googleapis.com/drive/v3/${path}`, {
    ...opts,
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', ...(opts.headers || {}) },
  });
  if (resp.status === 401) { state.googleAccessToken = null; updateSignInBtn(); throw new Error('Your Google session expired. Sign in again.'); }
  const body = await resp.json().catch(() => ({}));
  if (!resp.ok) {
    const err = new Error(body.error?.message || `Google Drive error ${resp.status}`);
    err.status = resp.status;
    throw err;
  }
  return body;
}

async function listEditors(id) {
  const data = await driveFetch(`files/${encodeURIComponent(id)}/permissions?supportsAllDrives=true&fields=permissions(id,type,role,emailAddress,displayName)`);
  return (data.permissions || [])
    .filter(p => p.type === 'user' && (p.role === 'owner' || p.role === 'writer' || p.role === 'organizer' || p.role === 'fileOrganizer'))
    .sort((a, b) => (a.role === 'owner' ? -1 : b.role === 'owner' ? 1 : 0));
}

async function inviteEditor(id, email) {
  const message = `I've added you as an editor of our family tree "${treeTitle(id)}". ` +
    `Open it here: ${treeLink(id)} and tap "Sign in to edit".`;
  return driveFetch(
    `files/${encodeURIComponent(id)}/permissions?supportsAllDrives=true&sendNotificationEmail=true&emailMessage=${encodeURIComponent(message)}`,
    { method: 'POST', body: JSON.stringify({ type: 'user', role: 'writer', emailAddress: email }) });
}

const manageInSheetsLink = () =>
  `<a href="${sheetEditUrl()}" target="_blank" rel="noopener">Manage sharing in Google Sheets ↗</a>`;

async function renderEditorsSection() {
  const box = $('share-editors');
  const inviteRow = $('share-invite-row');

  renderRequestsSection();

  // Signed in, can only view: they can suggest changes (requests.js)
  if (requestMode()) {
    inviteRow.classList.add('hidden');
    box.innerHTML = requestsAvailable()
      ? `<p class="share-hint">You can view this tree. To suggest a change, tap <strong>+</strong> or <strong>✎</strong> on anyone in the tree. The tree's admin will review it.</p>`
      : `<p class="share-hint">You can view this tree. To make changes, ask the person who shared it to add you as an editor.</p>`;
    return;
  }

  // Not signed in / can't edit yet
  if (!canEdit()) {
    inviteRow.classList.add('hidden');
    box.innerHTML = `
      <p class="share-hint">Only people you add as editors can change the tree. Sign in to see who can edit and to invite people.</p>
      <button type="button" class="btn btn-secondary share-signin-btn" id="share-signin-btn">✏️ Sign in to edit</button>`;
    return;
  }
  // Own Client ID / Apps Script: no Drive access from the app
  if (!usingSharedSignIn() || !state.googleAccessToken) {
    inviteRow.classList.add('hidden');
    box.innerHTML = `<p class="share-hint">To let someone edit, open your sheet, click <strong>Share</strong>, and add their email as <strong>Editor</strong>.</p>
      <p class="share-hint">${manageInSheetsLink()}</p>`;
    return;
  }

  inviteRow.classList.remove('hidden');
  box.innerHTML = '<p class="share-hint">Loading who can edit…</p>';
  try {
    const editors = await listEditors(state.sheetId);
    const me = (state.googleEmail || '').toLowerCase();
    box.innerHTML = `
      <ul class="share-editor-list">
        ${editors.map(p => `
          <li>
            <span class="share-avatar">${escHtml(String(p.displayName || p.emailAddress || '?').trim()[0]?.toUpperCase() || '?')}</span>
            <span class="share-person">
              <strong>${escHtml(p.displayName || p.emailAddress)}${p.emailAddress?.toLowerCase() === me ? ' (you)' : ''}</strong>
              ${p.displayName && p.emailAddress ? `<span>${escHtml(p.emailAddress)}</span>` : ''}
            </span>
            <span class="share-role">${p.role === 'owner' ? 'Owner' : 'Editor'}</span>
          </li>`).join('')}
      </ul>
      <p class="share-hint share-manage">To remove someone: ${manageInSheetsLink()}</p>`;
  } catch (err) {
    box.innerHTML = `<p class="share-hint">Couldn't load the list of editors (${escHtml(err.message)}). You can still invite people below, or ${manageInSheetsLink()}.</p>`;
  }
}

// ── Change requests: where suggestions from viewers are emailed ───────
// Stored on the sheet's Drive file as properties, so every visitor's app
// can read them: ftRequestsTo (email; empty = the owner) and ftRequests=off.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

async function renderRequestsSection() {
  const box = $('share-requests');
  box.innerHTML = '';
  if (!canEdit() || !usingSharedSignIn() || !state.googleAccessToken) return;
  const sheetId = state.sheetId;
  let meta;
  try {
    meta = await driveFetch(`files/${encodeURIComponent(sheetId)}?supportsAllDrives=true&fields=owners(displayName,emailAddress),properties`);
  } catch { return; } // the rest of the dialog still works
  if (sheetId !== state.sheetId) return;
  const props = meta.properties || {};
  const ownerEmail = meta.owners?.[0]?.emailAddress || '';
  const to = props.ftRequestsTo || ownerEmail;
  const off = props.ftRequests === 'off';
  box.innerHTML = `
    <h3 class="share-section">📨 Change requests</h3>
    <p class="share-hint" style="margin-top:0">People who can only view the tree can suggest changes with <strong>+</strong> and <strong>✎</strong>. The app prepares an email for them to send to:</p>
    <div class="share-link-row" style="margin-top:8px">
      <input type="email" id="share-requests-to" value="${escHtml(to)}" placeholder="admin@gmail.com" autocomplete="email" />
      <button type="button" id="share-requests-save" class="btn btn-secondary">Save</button>
    </div>
    <label class="share-check"><input type="checkbox" id="share-requests-off" ${off ? 'checked' : ''} /> Don't take change requests</label>
    <div id="share-requests-error" class="error-msg hidden"></div>
    <p class="share-hint">The email shows this address and the sender's email. Each request has a link: open it, check the change, and tap <strong>Apply</strong>.</p>`;
  box.dataset.owner = ownerEmail;
}

async function saveRequestSettings() {
  const input = $('share-requests-to');
  const errEl = $('share-requests-error');
  const btn   = $('share-requests-save');
  const email = input.value.trim();
  const off   = $('share-requests-off').checked;
  errEl.classList.add('hidden');
  if (email && !EMAIL_RE.test(email)) {
    errEl.textContent = 'Please type a full email address, like name@gmail.com.';
    errEl.classList.remove('hidden');
    return;
  }
  const owner = $('share-requests').dataset.owner || '';
  btn.disabled = true;
  try {
    await driveFetch(`files/${encodeURIComponent(state.sheetId)}?supportsAllDrives=true&fields=id`, {
      method: 'PATCH',
      body: JSON.stringify({ properties: {
        ftRequestsTo: email && email.toLowerCase() !== owner.toLowerCase() ? email : null, // null removes it
        ftRequests:   off ? 'off' : null,
      } }),
    });
    showToast(off ? 'Change requests are off.' : `Change requests will be emailed to ${email || owner}.`, 'success');
  } catch (err) {
    errEl.textContent = `Couldn't save: ${err.message}`;
    errEl.classList.remove('hidden');
  } finally {
    btn.disabled = false;
  }
}

async function onInviteClick() {
  const input = $('share-invite-input');
  const btn   = $('share-invite-btn');
  const errEl = $('share-invite-error');
  const email = input.value.trim();
  errEl.classList.add('hidden');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errEl.textContent = 'Please type a full email address, like name@gmail.com.';
    errEl.classList.remove('hidden');
    return;
  }
  btn.disabled = true;
  btn.textContent = 'Inviting…';
  try {
    await inviteEditor(state.sheetId, email);
    input.value = '';
    showToast(`Invited ${email}. Google will email them a link.`, 'success');
    renderEditorsSection();
  } catch (err) {
    errEl.innerHTML = err.status === 403
      ? `You can't add editors to this sheet (only its owner, or editors the owner allows, can). ${manageInSheetsLink()}`
      : `Couldn't invite ${escHtml(email)}: ${escHtml(err.message)}`;
    errEl.classList.remove('hidden');
  } finally {
    btn.disabled = false;
    btn.textContent = 'Invite';
  }
}

async function onShareSignIn() {
  try {
    const token = await requestGoogleToken();
    await ensureEditAccess(token);
  } catch (err) {
    showToast(err.message, 'error');
  }
  updateSignInBtn();
  renderEditorsSection();
}

// ── Wiring ────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  $('share-btn').addEventListener('click', openShareModal);
  $('share-close-btn').addEventListener('click', closeShareModal);
  $('share-modal').addEventListener('click', (e) => { if (e.target === $('share-modal')) closeShareModal(); });
  $('share-copy-btn').addEventListener('click', copyShareLink);
  $('share-target-mode').addEventListener('change', () => {
    updateShareLink();
    if ($('share-target-mode').value === 'person' && !shareTargetPerson()) $('share-person-input').focus();
  });
  $('share-person-input').addEventListener('input', updateShareLink);
  document.querySelectorAll('input[name="share-dir"]').forEach(r => r.addEventListener('change', updateShareLink));
  $('share-native-btn').addEventListener('click', nativeShare);
  $('share-invite-btn').addEventListener('click', onInviteClick);
  $('share-invite-input').addEventListener('keydown', (e) => { if (e.key === 'Enter') onInviteClick(); });
  $('share-editors').addEventListener('click', (e) => {
    if (e.target.closest('#share-signin-btn')) onShareSignIn();
  });
  $('share-requests').addEventListener('click', (e) => {
    if (e.target.closest('#share-requests-save')) saveRequestSettings();
  });
  $('share-requests').addEventListener('change', (e) => {
    if (e.target.id === 'share-requests-off') saveRequestSettings();
  });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeShareModal(); });
});
