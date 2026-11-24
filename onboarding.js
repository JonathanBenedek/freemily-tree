// ===================================================================
// ONBOARDING — welcome screen + step-by-step "How to start" guide
// -------------------------------------------------------------------
// One plain-language question, then only the steps that fit:
//   new tree  → "Create my tree" (the app makes and shares the sheet)
//   own sheet → pick it from Google Drive, or paste its link
//   shared    → open the link; how to get edit access
// Sign-in uses the site's built-in Google sign-in (see SHARED_GOOGLE in
// app.js). The old "your own Client ID" walkthrough stays for Settings →
// Advanced. Progress is saved so people can leave and come back.
// Depends on app.js globals: $, state, showScreen, showSetupScreen,
// parseSheetId, splitCSVRows, onLoadClick, sheetIdInput, clientIdInput,
// showToast, requestGoogleToken, pickSheetWithGoogle, driveCanEdit,
// createTreeSheet, makeSheetViewableByLink, updateSignInBtn.
// ===================================================================

const GUIDE_KEY   = 'ftGuide';
const SITE_ORIGIN = window.location.origin; // this deployment's address
const HEADERS     = ['id', 'firstName', 'lastName', 'parent1', 'parent2', 'spouse', 'picture', 'comments'];

// Optional public "template" Google Sheet for the do-it-yourself path. Its
// /copy link opens Google's "Make a copy" screen. Empty = paste the titles.
const TEMPLATE_SHEET_ID = '';

const guide = {
  mode: 'full',        // 'full' | 'ownClientId' (Settings → Advanced → "How to get a Client ID")
  answers: {},         // { start: 'new'|'own', manual: true when they build the sheet themselves }
  pos: 0,              // index into buildFlow()
  returnTo: 'welcome', // screen to go back to when the guide is closed
};

// ── Flow: which screens to show, based on the answers so far ─────────
function buildFlow() {
  const a = guide.answers;
  if (guide.mode === 'ownClientId') {
    return ['cloudProject', 'cloudConsent', 'cloudClient', 'addEditors', 'connectEdit'];
  }
  const flow = ['qStart'];
  if (!a.start) return flow;
  if (a.start === 'own' || a.start === 'join') return flow.concat(['connectOwn']); // 'join' = saved progress from the old 3-option guide
  return flow.concat(a.manual ? ['makeSheet', 'connectView'] : ['createTree']);
}

// ── Small HTML helpers ────────────────────────────────────────────────
const esc       = v => String(v).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const copyBtn   = (text, label = 'Copy') =>
  `<button type="button" class="copy-chip" data-copy="${esc(text)}">📋 ${label}</button>`;
const ext       = (url, label) => `<a href="${url}" target="_blank" rel="noopener">${label}</a>`;
const consoleLink = ext('https://console.cloud.google.com', '<strong>console.cloud.google.com</strong>');
const headerChips = () =>
  `<div class="header-chips">${HEADERS.map(h => `<span>${h}</span>`).join('')}</div>` +
  copyBtn(HEADERS.join('\t'), 'Copy the titles');
const tip  = html => `<div class="guide-tip">💡 ${html}</div>`;
const note = html => `<div class="guide-note">${html}</div>`;
const signInNote = () => note(`✏️ <strong>To edit from the app:</strong> once your tree opens, tap <strong>Sign in to edit</strong> at the top.
  The first time, Google asks you to select your sheet. Tap it, then <strong>Select</strong>.`);

// ── Questions ─────────────────────────────────────────────────────────
const QUESTIONS = {
  qStart: {
    key: 'start',
    title: 'What brings you here?',
    options: [
      { value: 'new', icon: '🌱', title: 'Start a new family tree',     sub: "We'll create everything for you" },
      { value: 'own', icon: '📂', title: 'Open an existing family tree', sub: 'From your Google Drive, or a link someone sent you' },
    ],
  },
};

// ── Steps ─────────────────────────────────────────────────────────────
// widget: 'create' | 'drive+sheet' | 'sheet' | 'sheet+code' → form at the end of the step.
const STEPS = {
  createTree: {
    icon: '🌱', title: 'Create your family tree',
    widget: 'create',
    body: () => `
      <p>Tap the button and we'll:</p>
      <ul class="guide-checklist">
        <li>✅ Ask you to sign in with Google</li>
        <li>✅ Create your family sheet in <strong>your own</strong> Google Drive</li>
        <li>✅ Add you as the first person, using your Google name</li>
        <li>✅ Open your tree, ready to add your family</li>
      </ul>`,
    after: () => `
      ${note('🔒 Anyone you send the tree\'s link to can <strong>view</strong> it. Only people you add as Editors can change it.')}
      <p class="guide-alt"><button type="button" class="link-btn" data-action="manual">I'd rather set up the Google Sheet myself →</button></p>`,
  },

  makeSheet: {
    icon: '🗒️', title: 'Make your family sheet',
    body: () => `
      <ol>
        ${TEMPLATE_SHEET_ID ? `
          <li>Tap the button below. Google opens a <strong>"Copy document"</strong> screen. Click <strong>Make a copy</strong>.
            <span class="guide-sub">Sign in with your Google account if asked.</span>
            <a class="btn btn-primary guide-action" href="https://docs.google.com/spreadsheets/d/${TEMPLATE_SHEET_ID}/copy" target="_blank" rel="noopener">Make my sheet ↗</a>
            <span class="guide-sub">Your new sheet already has the right titles and 3 example people.</span></li>
        ` : `
          <li>Open ${ext('https://sheets.new', '<strong>sheets.new</strong>')}. It makes a new, empty Google Sheet. Sign in if asked.</li>
          <li>Click the first box, <strong>A1</strong>, then tap the copy button below and paste.
            <span class="guide-sub">Paste: ⌘+V on Mac · Ctrl+V on Windows · long-press → Paste on a phone</span>
            ${headerChips()}</li>
        `}
        <li>${TEMPLATE_SHEET_ID ? 'Replace the example people with your family' : 'Add your family, one person per row'}. Start with a few. You can add more anytime.</li>
      </ol>
      <details class="guide-details">
        <summary>How do I connect parents and partners?</summary>
        <p>Every person gets their own number in <strong>id</strong>. Then use those numbers:</p>
        <div class="example-table-wrap"><table class="example-table">
          <thead><tr><th>id</th><th>firstName</th><th>lastName</th><th>parent1</th><th>parent2</th><th>spouse</th></tr></thead>
          <tbody>
            <tr><td>1</td><td>Dana</td><td>Cohen</td><td>2</td><td>3</td><td></td></tr>
            <tr><td>2</td><td>Ruth</td><td>Cohen</td><td></td><td></td><td>3</td></tr>
            <tr><td>3</td><td>David</td><td>Cohen</td><td></td><td></td><td>2</td></tr>
          </tbody>
        </table></div>
        <p>Dana's parents are Ruth (2) and David (3), and Ruth and David are married. <strong>picture</strong> (a photo link) and <strong>comments</strong> (like a birth date) are optional.</p>
      </details>
      ${tip('You don\'t need to change the sharing. The next step does it for you if needed.')}
      <p class="guide-alt"><button type="button" class="link-btn" data-action="auto">← Let the app create the sheet for me instead</button></p>`,
  },

  connectView: {
    icon: '🎉', title: 'Open your family tree',
    widget: 'drive+sheet',
    body: () => `<p>Choose your sheet from Google Drive, or paste its link. We'll check that everything is set up right.</p>`,
    after: () => signInNote(),
  },

  connectOwn: {
    icon: '📂', title: 'Open your family tree',
    widget: 'drive+sheet',
    body: () => `<p>Choose the sheet from your Google Drive, or paste a link to it. A Google Sheets link or a freemilytree.com link both work. We'll check that everything is set up right.</p>`,
    after: () => `${signInNote()}
      <div class="guide-box">
        <div class="guide-box-title">💌 Got the tree from a relative and want to help edit?</div>
        Send them the email of your Google account (your Gmail) and ask them to tap <strong>🔗 Share → Invite</strong> in the app.
        Then open the tree and tap <strong>Sign in to edit</strong>.
      </div>`,
  },

  // ── Advanced: people who want their own Google Cloud Client ID ──────
  cloudProject: {
    icon: '🏗️', title: 'Your own setup 1 of 3: Create a Google project',
    body: () => `
      ${note('<strong>Most people don\'t need this.</strong> Editing already works with the built-in "Sign in to edit". Use this only if you want your own Google Cloud setup. It\'s free, takes about 10 minutes, and works best on a computer.')}
      <ol>
        <li>Open ${consoleLink} and sign in with the Google account that owns the sheet. If asked, agree to the terms.</li>
        <li>At the top, click the <strong>project picker</strong> (next to "Google Cloud") → <strong>New project</strong>.</li>
        <li>Name it <strong>Family Tree</strong> and click <strong>Create</strong>. Make sure it's selected at the top.</li>
        <li>In the search bar at the top, type <strong>Google Sheets API</strong>, open it, and click <strong>Enable</strong>.</li>
      </ol>`,
  },

  cloudConsent: {
    icon: '🪪', title: 'Your own setup 2 of 3: Set up the sign-in screen',
    body: () => `
      <p>This is the screen people see when they sign in.</p>
      <ol>
        <li>In the search bar, type <strong>OAuth consent screen</strong> and open it. Click <strong>Get started</strong>.</li>
        <li>App name: <strong>Family Tree</strong>. Support email: your email. Click <strong>Next</strong>.</li>
        <li>Audience: choose <strong>External</strong>. Click <strong>Next</strong>.</li>
        <li>Contact email: your email. Click <strong>Next</strong>, tick the agreement, and click <strong>Create</strong>.</li>
      </ol>`,
  },

  cloudClient: {
    icon: '🔑', title: 'Your own setup 3 of 3: Get your Client ID',
    body: () => `
      <ol>
        <li>In the menu on the left, click <strong>Clients</strong> → <strong>Create client</strong>.</li>
        <li>Application type: <strong>Web application</strong>. Name: <strong>Family Tree</strong>.</li>
        <li>Under <strong>Authorised JavaScript origins</strong>, click <strong>Add URI</strong> and paste this website's address:
          <div class="copy-row"><code>${SITE_ORIGIN}</code>${copyBtn(SITE_ORIGIN)}</div></li>
        <li>Click <strong>Create</strong>. Copy the <strong>Client ID</strong> (it ends with <code>.apps.googleusercontent.com</code>). You'll paste it in the last step.</li>
      </ol>`,
  },

  addEditors: {
    icon: '👥', title: 'Choose who can edit',
    body: () => `
      <p>With your own setup, everyone who edits, <strong>including you</strong>, must be added in <strong>two places</strong>:</p>
      <div class="guide-box">
        <div class="guide-box-title">1 · In your Google Sheet</div>
        Click <strong>Share</strong>, type the person's email, choose <strong>Editor</strong>, and click <strong>Send</strong>.
      </div>
      <div class="guide-box">
        <div class="guide-box-title">2 · In Google Cloud</div>
        In ${consoleLink}, type <strong>Audience</strong> in the search bar and open it. Under <strong>Test users</strong>, click <strong>Add users</strong>, add <strong>your own email and theirs</strong>, and click <strong>Save</strong>.
      </div>`,
  },

  connectEdit: {
    icon: '🎉', title: 'Connect with your Client ID',
    widget: 'sheet+code',
    body: () => `<p>Paste your sheet's link and your Client ID. We'll check that the sheet is set up right.</p>`,
    after: () => note(`Once your tree opens, tap <strong>Sign in to edit</strong>. If Google says <em>"Google hasn't verified this app"</em>, tap <strong>Continue</strong>. It's your own setup, so that's expected.`),
  },
};

// ── Persistence (never required — wrapped so private mode still works) ─
function saveGuide() {
  try { localStorage.setItem(GUIDE_KEY, JSON.stringify({ mode: guide.mode, answers: guide.answers, pos: guide.pos })); } catch {}
}
function loadSavedGuide() {
  try { return JSON.parse(localStorage.getItem(GUIDE_KEY) || 'null'); } catch { return null; }
}
function clearGuide() {
  try { localStorage.removeItem(GUIDE_KEY); } catch {}
}

// ── Screens ───────────────────────────────────────────────────────────
// The "home": the tree screen with no tree open, plus a welcome card (app.js showHome)
function showWelcomeScreen() {
  showHome();
  const saved = loadSavedGuide();
  const resume = $('guide-resume-btn');
  const start  = $('guide-start-btn');
  if (saved && saved.pos > 0) {
    resume.innerHTML = `Continue where you left off<span class="welcome-btn-sub">${progressLabelFor(saved)}</span>`;
    resume.classList.remove('hidden');
    start.classList.replace('btn-primary', 'btn-secondary');
    start.firstChild.textContent = 'Start the guide over ';
  } else {
    resume.classList.add('hidden');
    start.firstChild.textContent = 'How to start ';
  }
}

function openGuide({ mode = 'full', resume = false, returnTo = 'welcome', answers = {}, pos = 0 } = {}) {
  const saved = resume ? loadSavedGuide() : null;
  guide.mode     = (saved?.mode || mode) === 'ownClientId' ? 'ownClientId' : 'full';
  guide.answers  = saved?.answers || { ...answers };
  guide.pos      = saved?.pos || pos;
  guide.returnTo = returnTo;
  showScreen('guide-screen');
  renderGuide();
}

function closeGuide() {
  saveGuide();
  if (guide.returnTo === 'setup') showSetupScreen();
  else if (guide.returnTo === 'tree' && state.treeOpen) showTreeScreen();
  else showWelcomeScreen();
}

// "Step 2 of 5" / "One quick question" for a given guide state
function progressLabelFor(g) {
  const prev = { mode: guide.mode, answers: guide.answers };
  guide.mode = g.mode === 'ownClientId' ? 'ownClientId' : 'full';
  guide.answers = g.answers || {};
  const flow = buildFlow();
  guide.mode = prev.mode; guide.answers = prev.answers;
  const key = flow[Math.min(g.pos, flow.length - 1)];
  if (QUESTIONS[key]) return 'One quick question';
  const steps = flow.filter(k => STEPS[k]);
  return steps.length > 1 ? `Step ${steps.indexOf(key) + 1} of ${steps.length}` : 'Last step';
}

// ── Render ────────────────────────────────────────────────────────────
function renderGuide() {
  const flow = buildFlow();
  guide.pos  = Math.max(0, Math.min(guide.pos, flow.length - 1));
  const key  = flow[guide.pos];
  const body = $('guide-body');

  // Progress
  const steps = flow.filter(k => STEPS[k]);
  const stepIdx = steps.indexOf(key);
  $('guide-progress-label').textContent = QUESTIONS[key]
    ? 'One quick question'
    : (steps.length > 1 ? `Step ${stepIdx + 1} of ${steps.length}` : 'Last step');
  const pct = QUESTIONS[key] ? 10 : 30 + 70 * ((stepIdx + 1) / steps.length);
  $('guide-progress-bar').style.width = `${pct}%`;

  // Content
  body.innerHTML = QUESTIONS[key] ? renderQuestion(QUESTIONS[key]) : renderStep(STEPS[key]);
  body.scrollTop = 0;

  // Footer
  const isLast = guide.pos === flow.length - 1;
  const nextBtn = $('guide-next-btn');
  nextBtn.classList.toggle('hidden', !!QUESTIONS[key] || isLast);
  nextBtn.textContent = STEPS[key]?.nextLabel || 'Next step →';
  $('guide-back-btn').textContent = guide.pos === 0
    ? ({ setup: '← Settings', tree: '← My tree' }[guide.returnTo] || '← Home')
    : '← Back';

  // Prefill connect forms
  const sheetIn = $('guide-sheet-input');
  if (sheetIn && state.sheetId) sheetIn.value = state.sheetId;
  const codeIn = $('guide-code-input');
  if (codeIn && state.googleClientId) codeIn.value = state.googleClientId;

  saveGuide();
}

function renderQuestion(q) {
  const chosen = guide.answers[q.key];
  return `
    <h2 class="guide-title">${q.title}</h2>
    ${q.hint ? `<p class="guide-hint">${q.hint}</p>` : ''}
    <div class="guide-options">
      ${q.options.map(o => `
        <button type="button" class="guide-option${chosen === o.value ? ' selected' : ''}" data-answer="${o.value}">
          <span class="guide-option-icon">${o.icon}</span>
          <span class="guide-option-text"><strong>${o.title}</strong><span>${o.sub}</span></span>
          <span class="guide-option-arrow">›</span>
        </button>`).join('')}
    </div>`;
}

function renderWidget(type) {
  const errorBox = '<div id="guide-connect-error" class="error-msg hidden"></div>';
  if (type === 'create') {
    // Left as the default, the name becomes "<your last name> Family Tree" after sign-in
    const def = uniqueTreeTitle('My Family Tree');
    return `
      <div class="guide-connect">
        <label for="guide-title-input">Name your tree</label>
        <input type="text" id="guide-title-input" value="${esc(def)}" data-default="${esc(def)}" autocomplete="off" />
        <span class="guide-sub">Leave it as is and we'll name it after your family, like "Cohen Family Tree". Making one for another side of the family? Type a name, like "Mom's side".</span>
        ${errorBox}
        <button type="button" id="guide-create-btn" class="btn btn-primary">Sign in with Google &amp; create my tree</button>
      </div>`;
  }
  const withCode = type === 'sheet+code';
  const drive = type === 'drive+sheet' ? `
      <button type="button" id="guide-drive-btn" class="btn btn-primary">📂 Choose from my Google Drive</button>
      <div class="guide-or">or paste the link</div>` : '';
  return `
    <div class="guide-connect">
      ${drive}
      <label for="guide-sheet-input">${drive ? 'Link to the tree' : 'Google Sheet link'}</label>
      <input type="text" id="guide-sheet-input" placeholder="${drive ? 'Paste a Google Sheets or freemilytree.com link' : 'https://docs.google.com/spreadsheets/d/…'}" autocomplete="off" />
      ${withCode ? `
        <label for="guide-code-input">Your Client ID</label>
        <input type="text" id="guide-code-input" placeholder="…apps.googleusercontent.com" autocomplete="off" />` : ''}
      ${errorBox}
      <button type="button" id="guide-connect-btn" class="btn ${drive ? 'btn-secondary guide-wide' : 'btn-primary'}" data-with-code="${withCode}">Open my family tree</button>
    </div>`;
}

function renderStep(s) {
  return `
    <div class="guide-step-icon">${s.icon}</div>
    <h2 class="guide-title">${s.title}</h2>
    <div class="guide-content">${s.body()}</div>
    ${s.widget ? renderWidget(s.widget) : ''}
    ${s.after ? s.after() : ''}`;
}

// ── Navigation ────────────────────────────────────────────────────────
function answerQuestion(value) {
  const key = buildFlow()[guide.pos];
  const q = QUESTIONS[key];
  if (!q) return;
  if (guide.answers[q.key] !== value) guide.answers = {}; // a new start answer resets the rest
  guide.answers[q.key] = value;
  guide.pos += 1;
  renderGuide();
}

function guideNext() { guide.pos += 1; renderGuide(); }

function guideBack() {
  if (guide.pos === 0) { closeGuide(); return; }
  guide.pos -= 1;
  renderGuide();
}

// ── Sheet check ───────────────────────────────────────────────────────
// Read the sheet the same way the app does, so problems show up here — with
// the fix explained — instead of as a failed load on the settings screen.
async function checkSheet(id) {
  const url = `https://docs.google.com/spreadsheets/d/${encodeURIComponent(id)}/gviz/tq?tqx=out:csv&gid=0`;
  let text;
  try {
    const resp = await fetch(url);
    if (!resp.ok) return { problem: 'notShared' };
    text = await resp.text();
  } catch {
    return { problem: 'notShared' }; // private sheets redirect to a Google sign-in page, which the browser blocks
  }
  if (/^\s*</.test(text)) return { problem: 'notShared' };
  const rows = splitCSVRows(text);
  const titles = (rows[0] || []).map(c => String(c).trim());
  // The app reads columns by position, so only check the order loosely:
  // "First name", "first_name" and "firstName" all count.
  const norm = titles.map(t => t.toLowerCase().replace(/[\s_-]/g, ''));
  if (norm[0] !== 'id' || norm[1] !== 'firstname' || norm[3] !== 'parent1') {
    return { problem: 'wrongTitles', titles };
  }
  if (rows.slice(1).every(r => !String(r[0] || '').trim())) return { problem: 'empty' };
  return { ok: true };
}

// "Fix it for me" + do-it-yourself steps for a sheet that isn't shared with a link
const notSharedFix = (id) => `
    <button type="button" class="btn btn-primary guide-fix-btn" data-action="fix-sharing" data-id="${esc(id)}">Fix it for me</button>
    <span class="guide-sub">Signs you in with Google and sets the sheet to "Anyone with the link can view". Nobody can change it unless you make them an Editor.</span>
    <details class="guide-details"><summary>Or do it yourself</summary>
      <ol>
        <li>In your Google Sheet, click <strong>Share</strong> (top-right).</li>
        <li>Under <strong>General access</strong>, choose <strong>Anyone with the link</strong> (Viewer), then <strong>Done</strong>.</li>
        <li>Tap <strong>Open my family tree</strong> again.</li>
      </ol>
      Still not working? Make sure you copied the <strong>whole</strong> address of the sheet.
    </details>`;

const SHEET_PROBLEMS = {
  notShared: (r) => `
    <strong>We couldn't open your sheet.</strong> Most likely it isn't shared with a link yet.
    ${notSharedFix(r.id)}`,
  wrongTitles: (r) => `
    <strong>Your sheet's first row doesn't have the titles the app needs.</strong>
    ${r.titles.some(Boolean) ? `It starts with: <em>${r.titles.slice(0, 4).filter(Boolean).map(esc).join(', ')}</em>.` : 'It looks empty.'}
    Make row 1 exactly these, in this order, then try again:
    ${headerChips()}`,
  empty: () => `
    <strong>Your sheet has no people yet.</strong> Add at least one person in row 2 (for example, yourself with id <strong>1</strong>), then try again.`,
};

// ── Actions ───────────────────────────────────────────────────────────
function guideError(html) {
  const el = $('guide-connect-error');
  if (!el) { showToast(html.replace(/<[^>]+>/g, ''), 'error'); return; }
  el.innerHTML = html;
  el.classList.remove('hidden');
}
function clearGuideError() { $('guide-connect-error')?.classList.add('hidden'); }

async function withBusy(btn, label, fn) {
  const old = btn?.textContent;
  if (btn) { btn.disabled = true; btn.textContent = label; }
  try { return await fn(); }
  finally { if (btn && btn.isConnected) { btn.disabled = false; btn.textContent = old; } }
}

// Open a checked sheet in the app. canEdit=true when we already know the
// signed-in person may edit it (created or picked through the app).
async function openCheckedSheet(id, { code = null, canEdit = false } = {}) {
  sheetIdInput.value = id;
  if (code !== null) clientIdInput.value = code;
  if (canEdit) state.editAccessSheetId = id;
  clearGuide();
  await onLoadClick();
  updateSignInBtn();
}

// Paste-a-link path
async function guideConnect(withCode) {
  const btn  = $('guide-connect-btn');
  const id   = parseSheetId($('guide-sheet-input').value);
  const code = withCode ? $('guide-code-input').value.trim() : null;

  if (!id || id.length < 20 || /\s/.test(id)) {
    return guideError("That doesn't look like a Google Sheet link. Open your sheet and copy the whole address from the top of the browser.");
  }
  if (withCode && !/\.apps\.googleusercontent\.com$/.test(code)) {
    return guideError('The Client ID should end with <strong>.apps.googleusercontent.com</strong>. Check that you copied all of it.');
  }
  clearGuideError();
  const result = await withBusy(btn, 'Checking your sheet…', () => checkSheet(id));
  if (!result.ok) return guideError(SHEET_PROBLEMS[result.problem]({ ...result, id }));
  await openCheckedSheet(id, { code });
}

// "Choose from my Google Drive"
async function guideDrivePick() {
  const btn = $('guide-drive-btn');
  clearGuideError();
  useBuiltInSignIn();
  try {
    const token = await requestGoogleToken();
    const id = await withBusy(btn, 'Opening Google Drive…', () => pickSheetWithGoogle(token));
    if (!id) return; // cancelled
    await checkAndOpenWithToken(token, id, btn);
  } catch (err) {
    guideError(esc(err.message));
  }
}

// After a sheet was picked: share it if needed, check it, open it.
async function checkAndOpenWithToken(token, id, btn) {
  let result = await withBusy(btn, 'Checking your sheet…', () => checkSheet(id));
  if (result.problem === 'notShared') {
    await withBusy(btn, 'Sharing your sheet…', () => makeSheetViewableByLink(token, id));
    result = await withBusy(btn, 'Checking your sheet…', () => checkSheet(id));
  }
  if (!result.ok) return guideError(SHEET_PROBLEMS[result.problem]({ ...result, id }));
  const access = await driveCanEdit(token, id);
  if (access.found) addShortcutToTreesFolder(token, id, access.name).catch(() => {}); // shows up in "Freemily Trees"
  await openCheckedSheet(id, { canEdit: access.found && access.canEdit });
  if (access.found && access.canEdit) showToast('Editing is on. Tap + or ✎ on anyone in the tree.', 'success');
}

// "Fix it for me" on a sheet that isn't shared yet
async function guideFixSharing(id, btn) {
  useBuiltInSignIn();
  try {
    const token = await requestGoogleToken();
    let access = await driveCanEdit(token, id);
    if (!access.found) {
      const picked = await pickSheetWithGoogle(token, id);
      if (!picked) return;
      access = await driveCanEdit(token, id);
      if (!access.found) return guideError(`We still can't reach that sheet with ${esc(state.googleEmail || 'your Google account')}. Make sure you're signed in with the account that owns it.`);
    }
    await checkAndOpenWithToken(token, id, btn);
  } catch (err) {
    guideError(`Couldn't share the sheet: ${esc(err.message)}. You can do it yourself with the steps below.`);
  }
}

// "Sign in with Google & create my tree"
async function guideCreateTree() {
  const btn   = $('guide-create-btn');
  const input = $('guide-title-input');
  let title   = input.value.trim();
  clearGuideError();
  useBuiltInSignIn();
  try {
    // Sign in first (synchronously from the click, so the popup isn't blocked)
    await withBusy(btn, 'Signing in…', () => requestGoogleToken());
    const n     = state.googleName || {};
    const first = n.given || n.full || (state.googleEmail || '').split('@')[0] || 'Me';
    const last  = n.family || '';
    if (!title || title === input.dataset.default) {
      title = uniqueTreeTitle(last ? `${last} Family Tree` : (n.given ? `${n.given}'s Family Tree` : 'My Family Tree'));
    }
    const id = await withBusy(btn, 'Creating your tree…', () => createTreeSheet({ firstName: first, lastName: last, title }));
    rememberTree(id, title);
    await openCheckedSheet(id, { canEdit: true });
    showToast('Your tree is ready! Tap + on your box to add your family.', 'success');
  } catch (err) {
    guideError(esc(err.message));
  }
}

// A tree couldn't be opened (link to an unshared or deleted sheet, wrong link,
// a saved tree that stopped working): show the "Open your family tree" step with
// the link filled in and the reason, instead of the technical settings form.
async function showTreeLoadProblem(id) {
  clearGuide();
  openGuide({ answers: { start: 'own' }, pos: 1, returnTo: 'welcome' });
  const input = $('guide-sheet-input');
  if (input) input.value = id;
  guideError('<strong>We couldn\'t open this family tree.</strong> Checking why…');
  const result = await checkSheet(id);
  if (result.ok) {
    guideError(`<strong>We couldn't open this family tree</strong>, but the sheet looks fine now. Tap <strong>Open my family tree</strong> to try again.`);
  } else if (result.problem === 'notShared') {
    guideError(`<strong>We couldn't open this family tree.</strong> Either it isn't shared with a link yet, it was deleted, or the link is incomplete.
      <ul class="guide-problem-list">
        <li><strong>Is it your sheet?</strong> Tap <em>Fix it for me</em> below to share it.</li>
        <li><strong>Did someone send it to you?</strong> Ask them to open the tree and send you the link from <strong>🔗 Share</strong>.</li>
      </ul>
      ${notSharedFix(id)}`);
  } else {
    guideError(SHEET_PROBLEMS[result.problem]({ ...result, id }));
  }
}

function copyText(btn) {
  const text = btn.dataset.copy;
  const done = () => {
    const old = btn.innerHTML;
    btn.innerHTML = '✓ Copied';
    btn.classList.add('copied');
    setTimeout(() => { btn.innerHTML = old; btn.classList.remove('copied'); }, 1600);
  };
  if (navigator.clipboard?.writeText) {
    navigator.clipboard.writeText(text).then(done, () => showToast('Could not copy. Select the text and copy it yourself.', 'error'));
  } else {
    showToast('Could not copy. Select the text and copy it yourself.', 'error');
  }
}

// ── Wiring ────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  $('guide-start-btn').addEventListener('click', () => { clearGuide(); openGuide(); });
  $('guide-resume-btn').addEventListener('click', () => openGuide({ resume: true }));
  $('welcome-skip-btn').addEventListener('click', showSetupScreen);
  $('home-signin-btn').addEventListener('click', onSignInClick);
  $('howto-btn').addEventListener('click', () => {
    clearGuide();
    openGuide({ returnTo: state.treeOpen ? 'tree' : 'welcome' });
  });

  $('guide-close-btn').addEventListener('click', closeGuide);
  $('guide-back-btn').addEventListener('click', guideBack);
  $('guide-next-btn').addEventListener('click', guideNext);

  $('setup-open-guide-link').addEventListener('click', (e) => {
    e.preventDefault();
    clearGuide();
    openGuide({ returnTo: 'setup' });
  });
  $('show-oauth-help-link').addEventListener('click', (e) => {
    e.preventDefault();
    clearGuide();
    openGuide({ mode: 'ownClientId', returnTo: 'setup' });
  });

  $('guide-body').addEventListener('click', (e) => {
    const t = e.target;
    const opt = t.closest('[data-answer]');
    if (opt) return answerQuestion(opt.dataset.answer);
    const copy = t.closest('[data-copy]');
    if (copy) return copyText(copy);
    if (t.closest('#guide-connect-btn')) return guideConnect(t.closest('#guide-connect-btn').dataset.withCode === 'true');
    if (t.closest('#guide-drive-btn'))   return guideDrivePick();
    if (t.closest('#guide-create-btn'))  return guideCreateTree();
    const action = t.closest('[data-action]');
    if (!action) return;
    if (action.dataset.action === 'manual') { guide.answers.manual = true;  renderGuide(); }
    if (action.dataset.action === 'auto')   { guide.answers.manual = false; renderGuide(); }
    if (action.dataset.action === 'fix-sharing') guideFixSharing(action.dataset.id, action);
  });
  $('guide-body').addEventListener('keydown', (e) => {
    if (e.key !== 'Enter' || !e.target.matches('.guide-connect input')) return;
    ($('guide-create-btn') || $('guide-connect-btn'))?.click();
  });
});
