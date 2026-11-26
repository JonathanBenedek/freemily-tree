// ===================================================================
// CHANGE REQUESTS — suggestions from people who can view but not edit
// -------------------------------------------------------------------
// Someone signed in who can only view the tree fills in the usual add /
// edit forms. Instead of saving, the app prepares an email to the tree's
// admin (Gmail compose link, mailto: or copy). The person sends it from
// their own email. Nothing goes through a server and no extra Google
// permission is needed.
//
// The email carries a link: ?sheet=<id>#request=<base64url JSON>. The
// request sits after the #, so it never reaches the web server. Opening
// the link shows a review dialog; an editor taps Apply and the change is
// saved with the same code as the forms.
//
// Where requests go: the sheet's Drive file properties ftRequestsTo (an
// email) and ftRequests=off, set by editors in the Share dialog. Without
// them, requests go to the sheet's owner.
// Depends on app.js globals (state, $, escHtml, showToast, canEdit,
// requestMode, requestGoogleToken, ensureEditAccess, updateSignInBtn,
// addPersonWithRelations, savePersonFields, removePerson, ...) and on
// share.js (treeLink).
// ===================================================================

const REQUEST_FIELDS = ['firstName', 'lastName', 'picture', 'comments'];
const REQUEST_FIELD_LABELS = { firstName: 'First name', lastName: 'Last name', picture: 'Photo URL', comments: 'Comments' };
const REQUEST_TEXT_MAX = 500;  // comments and note: keeps the email link short enough
const REQUEST_NAME_MAX = 200;
const REQUEST_SESSION_CAP = 5; // requests per tree per browser session

const reqFindPerson = id => state.people.find(p => String(p.id) === String(id));
const reqPersonName = p => p ? (`${p.firstName || ''} ${p.lastName || ''}`.trim() || `#${p.id}`) : '';
const reqText = (v, max = REQUEST_TEXT_MAX) => String(v ?? '').trim().slice(0, max);
const reqPicture = v => { const s = reqText(v, 1000); return /^https?:\/\//i.test(s) ? s : ''; };

// ── Where requests go ─────────────────────────────────────────────────
function requestTargetFrom(res) {
  const props  = res.properties || {};
  const custom = (props.ftRequestsTo || '').trim();
  return {
    email: custom || res.owner?.emailAddress || '',
    name:  custom ? '' : (res.owner?.displayName || ''),
    off:   props.ftRequests === 'off',
  };
}

function requestsAvailable() {
  const t = state.requestTo;
  return !!(t && t.email && !t.off);
}

// ── Building a request ────────────────────────────────────────────────
function sentRequestsKey() { return `ftRequestsSent:${state.sheetId}`; }
function sentRequestCount() {
  try { return Number(sessionStorage.getItem(sentRequestsKey())) || 0; } catch { return 0; }
}
function countSentRequest() {
  try { sessionStorage.setItem(sentRequestsKey(), String(sentRequestCount() + 1)); } catch {}
}

// Checks the typed values. Returns an error message, or '' when fine.
function checkRequestFields(f) {
  if (f.firstName != null && f.firstName.length > REQUEST_NAME_MAX) return 'That first name is too long.';
  if (f.lastName  != null && f.lastName.length  > REQUEST_NAME_MAX) return 'That last name is too long.';
  if (f.comments  != null && f.comments.length  > REQUEST_TEXT_MAX) return `Please keep comments under ${REQUEST_TEXT_MAX} characters in a request.`;
  if (f.picture && !/^https?:\/\//i.test(f.picture)) return 'The photo URL must start with http:// or https://';
  return '';
}

// Returns the request object, or an error message (string) to show in the form.
function buildRequest({ kind, personId, changes, relation, relatedTo, parent2, newPerson, note }) {
  if (!requestsAvailable()) return "This tree isn't taking change requests right now.";
  if (sentRequestCount() >= REQUEST_SESSION_CAP) return "You've already prepared several requests. Please wait for the admin to look at them first.";
  note = String(note || '').trim();
  if (note.length > REQUEST_TEXT_MAX) return `Please keep the note under ${REQUEST_TEXT_MAX} characters.`;

  const req = {
    v: 1, kind, sheet: state.sheetId,
    from: { name: state.googleName?.full || '', email: state.googleEmail || '' },
    note, at: new Date().toISOString(),
  };
  if (kind === 'edit' || kind === 'remove') {
    const p = reqFindPerson(personId);
    if (!p) return 'That person is no longer in the tree.';
    req.person = { id: String(p.id), name: reqPersonName(p) };
  }
  if (kind === 'edit') {
    const err = checkRequestFields(Object.fromEntries(Object.entries(changes).map(([f, c]) => [f, c.new])));
    if (err) return err;
    req.changes = {};
    for (const [f, c] of Object.entries(changes)) req.changes[f] = { old: reqText(c.old), new: c.new };
  }
  if (kind === 'add') {
    const err = checkRequestFields(newPerson);
    if (err) return err;
    const rel = reqFindPerson(relatedTo);
    if (!rel) return 'That person is no longer in the tree.';
    req.relation  = relation;
    req.relatedTo = { id: String(rel.id), name: reqPersonName(rel) };
    const p2 = parent2 ? reqFindPerson(parent2) : null;
    if (relation === 'child' && p2) req.parent2 = { id: String(p2.id), name: reqPersonName(p2) };
    req.newPerson = { ...newPerson };
  }
  return req;
}

// Cleans a request read from a link (anyone can make a link, so trust nothing)
function sanitizeRequest(r) {
  if (!r || typeof r !== 'object' || r.v !== 1 || !['add', 'edit', 'remove'].includes(r.kind)) return null;
  const ref = x => (x && x.id != null && String(x.id).trim()) ? { id: reqText(x.id, 50), name: reqText(x.name, REQUEST_NAME_MAX) } : null;
  const out = {
    v: 1, kind: r.kind, sheet: reqText(r.sheet, 200), note: reqText(r.note), at: reqText(r.at, 40),
    from: { name: reqText(r.from?.name, REQUEST_NAME_MAX), email: reqText(r.from?.email, REQUEST_NAME_MAX) },
  };
  if (r.kind === 'edit' || r.kind === 'remove') {
    out.person = ref(r.person);
    if (!out.person) return null;
  }
  if (r.kind === 'edit') {
    out.changes = {};
    for (const f of REQUEST_FIELDS) {
      const c = r.changes?.[f];
      if (!c || typeof c !== 'object') continue;
      const max = f === 'comments' ? REQUEST_TEXT_MAX : REQUEST_NAME_MAX;
      out.changes[f] = { old: reqText(c.old), new: f === 'picture' ? reqPicture(c.new) : reqText(c.new, max) };
    }
    if (!Object.keys(out.changes).length) return null;
    if (out.changes.firstName && !out.changes.firstName.new) return null;
  }
  if (r.kind === 'add') {
    if (!['child', 'spouse', 'parent'].includes(r.relation)) return null;
    out.relation  = r.relation;
    out.relatedTo = ref(r.relatedTo);
    out.parent2   = r.relation === 'child' ? ref(r.parent2) : null;
    const np = r.newPerson || {};
    out.newPerson = {
      firstName: reqText(np.firstName, REQUEST_NAME_MAX), lastName: reqText(np.lastName, REQUEST_NAME_MAX),
      picture: reqPicture(np.picture), comments: reqText(np.comments),
    };
    if (!out.relatedTo || !out.newPerson.firstName) return null;
  }
  return out;
}

// ── Link encoding (UTF-8 JSON → base64url) ────────────────────────────
function encodeRequest(req) {
  const bytes = new TextEncoder().encode(JSON.stringify(req));
  let bin = '';
  bytes.forEach(b => { bin += String.fromCharCode(b); });
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function decodeRequest(str) {
  try {
    const b64 = str.replace(/-/g, '+').replace(/_/g, '/');
    const bin = atob(b64 + '='.repeat((4 - b64.length % 4) % 4));
    return JSON.parse(new TextDecoder().decode(Uint8Array.from(bin, c => c.charCodeAt(0))));
  } catch { return null; }
}

function requestLink(req) {
  return `${treeLink(req.sheet)}#request=${encodeRequest(req)}`;
}

// ── Email text ────────────────────────────────────────────────────────
const reqShort = (v, max = 150) => { const s = String(v || ''); return s.length > max ? s.slice(0, max) + '…' : s; };
const reqQuoted = v => v ? `"${reqShort(v)}"` : '(empty)';
const relationWords = req => req.relation === 'child'
  ? `child of ${req.relatedTo.name}${req.parent2 ? ` and ${req.parent2.name}` : ''}`
  : `${req.relation} of ${req.relatedTo.name}`;

function requestTitle(req) {
  if (req.kind === 'edit')   return `Change ${req.person.name}`;
  if (req.kind === 'remove') return `Remove ${req.person.name}`;
  return `Add ${`${req.newPerson.firstName} ${req.newPerson.lastName || ''}`.trim()}`;
}

function requestSummary(req) {
  const lines = [];
  if (req.kind === 'edit') {
    lines.push(`Change ${req.person.name} (#${req.person.id}):`);
    for (const [f, c] of Object.entries(req.changes)) lines.push(`  ${REQUEST_FIELD_LABELS[f]}: ${reqQuoted(c.old)} → ${reqQuoted(c.new)}`);
  } else if (req.kind === 'remove') {
    lines.push(`Remove ${req.person.name} (#${req.person.id}) from the tree.`);
  } else {
    const np = req.newPerson;
    lines.push(`Add ${`${np.firstName} ${np.lastName || ''}`.trim()} as ${relationWords(req)}.`);
    if (np.picture)  lines.push(`  Photo URL: ${reqShort(np.picture)}`);
    if (np.comments) lines.push(`  Comments: ${reqShort(np.comments)}`);
  }
  return lines.join('\n');
}

function requestEmail(req) {
  const to   = state.requestTo || {};
  const who  = req.from.name ? `${req.from.name} (${req.from.email})` : req.from.email || 'Someone';
  const hi   = to.name ? `Hi ${to.name.split(' ')[0]},` : 'Hi,';
  const body = [
    hi, '',
    `${who} is asking for a change to the family tree "${treeTitle(req.sheet)}":`, '',
    requestSummary(req), '',
    ...(req.note ? [`Note: ${req.note}`, ''] : []),
    'To review the change and add it to the tree, open this link and sign in as an editor:',
    requestLink(req), '',
    'Nothing has changed in the tree yet.',
    '— Sent with Freemily Tree',
  ].join('\n');
  return { to: to.email, subject: `Family tree change request: ${requestTitle(req)}`, body };
}

// ── Send screen (requester) ───────────────────────────────────────────
let sendingRequest = null; // { req, counted }

function showSendScreen(req) {
  const mail = requestEmail(req);
  sendingRequest = { req, counted: false, mail };
  const to = state.requestTo || {};
  $('request-send-to').textContent = to.name ? `${to.name} (${to.email})` : to.email;
  $('request-send-summary').textContent = requestSummary(req) + (req.note ? `\n\nNote: ${req.note}` : '');
  const enc = encodeURIComponent;
  const account = state.googleEmail ? `&authuser=${enc(state.googleEmail)}` : '';
  $('request-gmail-btn').href  = `https://mail.google.com/mail/?view=cm&fs=1${account}&to=${enc(mail.to)}&su=${enc(mail.subject)}&body=${enc(mail.body)}`;
  $('request-mailto-btn').href = `mailto:${enc(mail.to)}?subject=${enc(mail.subject)}&body=${enc(mail.body)}`;
  $('request-send-done').classList.add('hidden');
  $('request-copy-btn').textContent = 'Copy message';
  $('request-send-modal').classList.remove('hidden');
}

function closeSendScreen() {
  $('request-send-modal').classList.add('hidden');
  sendingRequest = null;
}

function markRequestSent() {
  if (!sendingRequest) return;
  if (!sendingRequest.counted) { countSentRequest(); sendingRequest.counted = true; }
  $('request-send-done').classList.remove('hidden');
}

async function copyRequestMessage() {
  if (!sendingRequest) return;
  const { mail } = sendingRequest;
  const text = `To: ${mail.to}\nSubject: ${mail.subject}\n\n${mail.body}`;
  try {
    await navigator.clipboard.writeText(text);
    $('request-copy-btn').textContent = '✓ Copied';
    markRequestSent();
    showToast(`Copied. Paste it into an email to ${mail.to}.`, 'success');
  } catch {
    showToast("Couldn't copy. Try Send with Gmail or Other email app.", 'error');
  }
}

// ── Review dialog (admin) ─────────────────────────────────────────────
let reviewRequest = null;

// Called after a tree loads from a link (applyUrlParams)
function openReviewFromHash() {
  const m = window.location.hash.match(/^#request=([A-Za-z0-9_-]+)$/);
  if (!m) return;
  const req = sanitizeRequest(decodeRequest(m[1]));
  if (!req) {
    clearRequestHash();
    showToast('This change request link is broken or incomplete. Ask the sender to send it again.', 'error');
    return;
  }
  if (req.sheet && req.sheet !== state.sheetId) {
    clearRequestHash();
    showToast('This change request is for a different family tree.', 'error');
    return;
  }
  reviewRequest = req;
  hideError($('request-review-error'));
  renderReview();
  $('request-review-modal').classList.remove('hidden');
}

function clearRequestHash() {
  try {
    if (window.location.hash) history.replaceState(null, '', window.location.pathname + window.location.search);
  } catch {}
}

function closeReview() {
  reviewRequest = null;
  $('request-review-modal').classList.add('hidden');
  clearRequestHash();
}

function refreshReviewModal() {
  if (reviewRequest && !$('request-review-modal').classList.contains('hidden')) renderReview();
}

// Returns { html, blocker } describing the request against the tree as it is now
function describeReview(req) {
  const rows = [];
  let blocker = '';
  let intro = '';
  const cell = v => v ? escHtml(v) : '<span class="review-empty">(empty)</span>';

  if (req.kind === 'edit') {
    const p = reqFindPerson(req.person.id);
    intro = `Change <strong>${escHtml(p ? reqPersonName(p) : req.person.name)}</strong>`;
    if (!p) blocker = `${escHtml(req.person.name)} is no longer in the tree.`;
    for (const [f, c] of Object.entries(req.changes)) {
      const now = p ? (p[f] || '') : '';
      let flag = '';
      if (p && now === c.new) flag = '<div class="review-flag ok">Already like this</div>';
      else if (p && now.slice(0, REQUEST_TEXT_MAX) !== c.old) flag = `<div class="review-flag">Changed since the request was sent (it was ${cell(c.old)})</div>`;
      rows.push(`<tr><th>${REQUEST_FIELD_LABELS[f]}</th><td>${cell(now)}</td><td><strong>${cell(c.new)}</strong>${flag}</td></tr>`);
    }
  } else if (req.kind === 'remove') {
    const p = reqFindPerson(req.person.id);
    intro = `Remove <strong>${escHtml(p ? reqPersonName(p) : req.person.name)}</strong> from the tree`;
    if (!p) blocker = `${escHtml(req.person.name)} is no longer in the tree.`;
  } else {
    const rel = reqFindPerson(req.relatedTo.id);
    const p2  = req.parent2 ? reqFindPerson(req.parent2.id) : null;
    const np  = req.newPerson;
    const relWords = req.relation === 'child'
      ? `child of ${escHtml(rel ? reqPersonName(rel) : req.relatedTo.name)}${p2 ? ` and ${escHtml(reqPersonName(p2))}` : ''}`
      : `${req.relation} of ${escHtml(rel ? reqPersonName(rel) : req.relatedTo.name)}`;
    intro = `Add <strong>${escHtml(`${np.firstName} ${np.lastName || ''}`.trim())}</strong> as ${relWords}`;
    if (!rel) blocker = `${escHtml(req.relatedTo.name)} is no longer in the tree.`;
    else if (req.relation === 'spouse' && rel.spouse) blocker = `${escHtml(reqPersonName(rel))} already has a spouse in the tree.`;
    else if (req.relation === 'parent' && rel.parent1 && rel.parent2) blocker = `${escHtml(reqPersonName(rel))} already has two parents in the tree.`;
    for (const f of REQUEST_FIELDS) {
      if (np[f]) rows.push(`<tr><th>${REQUEST_FIELD_LABELS[f]}</th><td colspan="2"><strong>${cell(np[f])}</strong></td></tr>`);
    }
    if (req.parent2 && !p2) rows.push(`<tr><td colspan="3" class="review-flag">${escHtml(req.parent2.name)} (second parent) is no longer in the tree and will be left out.</td></tr>`);
  }

  const when = req.at && !isNaN(Date.parse(req.at)) ? new Date(req.at).toLocaleDateString() : '';
  const head = req.kind === 'edit'
    ? '<tr class="review-head"><th></th><th>Now in the tree</th><th>Requested</th></tr>' : '';
  const html = `
    <p class="review-from">From <strong>${escHtml(req.from.name || req.from.email || 'unknown')}</strong>
      ${req.from.name && req.from.email ? `<span>${escHtml(req.from.email)}</span>` : ''}
      ${when ? `<span>· ${escHtml(when)}</span>` : ''}
      <span class="review-hint">(as written in the request; check who the email came from)</span></p>
    <p class="review-intro">${intro}</p>
    ${rows.length ? `<table class="review-table">${head}${rows.join('')}</table>` : ''}
    ${req.note ? `<blockquote class="review-note">${escHtml(req.note)}</blockquote>` : ''}
    ${blocker ? `<p class="review-blocker">${blocker}</p>` : ''}`;
  return { html, blocker };
}

function renderReview() {
  const req = reviewRequest;
  if (!req) return;
  const { html, blocker } = describeReview(req);
  const content = $('request-review-content');
  const btn = $('request-apply-btn');
  const knownViewer = !!state.googleAccessToken && state.requestOnlySheetId === state.sheetId;
  let extra = '';
  btn.disabled = false;
  if (blocker) {
    btn.textContent = 'Apply';
    btn.disabled = true;
  } else if (canEdit()) {
    btn.textContent = req.kind === 'remove' ? 'Remove' : 'Apply';
  } else if (knownViewer) {
    btn.textContent = 'Apply';
    btn.disabled = true;
    extra = `<p class="review-blocker">Only the tree's editors can apply this. You're signed in as ${escHtml(state.googleEmail || 'someone else')}.</p>`;
  } else {
    btn.textContent = 'Sign in to apply';
    extra = '<p class="share-hint">Sign in with a Google account that can edit this tree to apply the change.</p>';
  }
  content.innerHTML = html + extra;
}

async function onReviewApply() {
  const req = reviewRequest;
  if (!req) return;
  const errEl = $('request-review-error');
  hideError(errEl);

  if (!canEdit()) { // must stay synchronous until requestGoogleToken (popup)
    try {
      const token = await requestGoogleToken();
      await ensureEditAccess(token);
    } catch (err) {
      showError(errEl, err.message);
    }
    updateSignInBtn();
    renderReview();
    return;
  }

  const { blocker } = describeReview(req);
  if (blocker) { renderReview(); return; }
  if (req.kind === 'remove' && !confirm(`Remove "${req.person.name}" from the family tree? This cannot be undone.`)) return;

  const btn = $('request-apply-btn');
  btn.disabled = true;
  btn.textContent = 'Applying…';
  try {
    let anchor;
    if (req.kind === 'edit') {
      const p = reqFindPerson(req.person.id);
      const fields = Object.fromEntries(REQUEST_FIELDS.map(f => [f, p[f] || '']));
      for (const [f, c] of Object.entries(req.changes)) fields[f] = c.new;
      await savePersonFields(p.id, fields);
      anchor = p.id;
    } else if (req.kind === 'remove') {
      anchor = await removePerson(req.person.id);
    } else {
      const p2 = req.parent2 ? reqFindPerson(req.parent2.id) : null;
      const { newId, relatedPerson } = await addPersonWithRelations(req.newPerson, req.relation, req.relatedTo.id, p2 ? String(p2.id) : '');
      anchor = relatedPerson?.id ?? newId;
    }
    closeReview();
    rerenderCurrentView(anchor);
    if (!state.importMode) {
      showToast('Done! The change is now in the tree.', 'success');
      syncFromSheetQuietly(anchor, 2000);
    }
  } catch (err) {
    showError(errEl, err.message || 'Could not apply the change.');
    renderReview();
  }
}

// ── Wiring ────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  // "Please sign in" message
  $('signin-gate-continue').addEventListener('click', onSigninGateContinue);
  $('signin-gate-cancel').addEventListener('click', closeSigninGate);
  $('signin-gate-modal').addEventListener('click', (e) => { if (e.target === $('signin-gate-modal')) closeSigninGate(); });

  // Send screen
  $('request-gmail-btn').addEventListener('click', markRequestSent);
  $('request-mailto-btn').addEventListener('click', markRequestSent);
  $('request-copy-btn').addEventListener('click', copyRequestMessage);
  $('request-send-close').addEventListener('click', closeSendScreen);
  $('request-send-done-btn').addEventListener('click', closeSendScreen);
  $('request-send-modal').addEventListener('click', (e) => { if (e.target === $('request-send-modal')) closeSendScreen(); });

  // Review dialog
  $('request-apply-btn').addEventListener('click', onReviewApply);
  $('request-ignore-btn').addEventListener('click', closeReview);
  $('request-review-close').addEventListener('click', closeReview);
});
