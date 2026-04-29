// Today's reference date for computing "days until expiry".
const TODAY = new Date('2026-04-29');

// Source data — mirrors the Connection Management screenshot, with two new
// fields: `credential` (Salesforce-style Named Credential) and `expiryDays`
// (days remaining until the auth token expires; null when already expired).
const connections = [
  { name: 'abc1',                source: 'Taboola for MI',          pipeline: 'abc1 1749106047',                credential: 'Taboola_US',           status: 'Active',  expiryDays: 87,  modified: '4/7/2026, 07:01 AM'  },
  { name: 'con1',                source: 'MI Mock',                 pipeline: '',                                credential: 'MI_Mock_Sandbox',      status: 'Active',  expiryDays: 210, modified: '3/2/2026, 04:45 AM'  },
  { name: 'con2',                source: 'MI Mock',                 pipeline: '',                                credential: 'MI_Mock_Sandbox',      status: 'Active',  expiryDays: 210, modified: '3/2/2026, 04:45 AM'  },
  { name: 'con3',                source: 'MI Mock',                 pipeline: '',                                credential: 'MI_Mock_Sandbox',      status: 'Active',  expiryDays: 198, modified: '3/2/2026, 04:46 AM'  },
  { name: 'conn5',               source: 'MI Mock',                 pipeline: 'conn5 1281563918',                credential: 'MI_Mock_Sandbox',      status: 'Active',  expiryDays: 175, modified: '3/3/2026, 04:11 AM'  },
  { name: 'conn6',               source: 'MI Mock',                 pipeline: 'conn6 864847048',                 credential: 'MI_Mock_Sandbox',      status: 'Active',  expiryDays: 175, modified: '3/3/2026, 04:11 AM'  },
  { name: 'GA4',                 source: 'Google Analytics For EMI',pipeline: 'GA4 667312831',                   credential: 'Google_Analytics_US',  status: 'Active',  expiryDays: 55,  modified: '4/28/2026, 11:58 PM' },
  { name: 'GoogleMock',          source: 'MI Mock',                 pipeline: '',                                credential: 'Google_Ads_US',        status: 'Active',  expiryDays: 44,  modified: '3/18/2026, 07:54 AM' },
  { name: 'kjl',                 source: 'LinkedIn Ads For EMI',    pipeline: 'kjl 671186990',                   credential: 'LinkedIn_Ads_US',      status: 'Expired', expiryDays: null,modified: '4/29/2026, 12:02 AM' },
  { name: 'lklklk',              source: 'Taboola for MI',          pipeline: 'lklklk 1728853758',               credential: 'Taboola_EU',           status: 'Active',  expiryDays: 12,  modified: '4/7/2026, 01:08 AM'  },
  { name: 'lklklklklklkl2112',   source: 'LinkedIn Ads For EMI',    pipeline: 'lklklklklklkl2112 1200553268',    credential: 'LinkedIn_Ads_EU',      status: 'Expired', expiryDays: null,modified: '4/19/2026, 12:03 AM' },
  { name: 'new linkedin',        source: 'LinkedIn Ads For EMI',    pipeline: 'new_linkedin 1289556458',         credential: 'LinkedIn_Ads_APAC',    status: 'Expired', expiryDays: null,modified: '4/29/2026, 12:03 AM' },
  { name: 'samir_conn1',         source: 'Meta Ads',                pipeline: 'samir_conn1 1200920001',          credential: 'Meta_Ads_US',          status: 'Active',  expiryDays: 87,  modified: '3/3/2026, 01:52 AM'  },
];

// Bucket the days-remaining value into the same Healthy / Warning / Error
// states used by the Connector Health card.
function expiryBucket(days) {
  if (days === null || days === undefined) return 'error';
  if (days <= 30) return 'warning';
  return 'healthy';
}

function expiryLabel(days) {
  if (days === null || days === undefined) return 'Expired';
  return `${days} days`;
}

function expiryNote(days) {
  const b = expiryBucket(days);
  if (b === 'error') {
    return { cls: 'error',   mark: '✕', text: 'Auth token expired. Dashboards showing stale data.' };
  }
  if (b === 'warning') {
    return { cls: 'warning', mark: '!', text: `Refresh token expires in ${days} days. Reauthorize to avoid interruption.` };
  }
  return null;
}

// Sort comparators keyed by header.
const comparators = {
  name:       (a, b) => a.name.localeCompare(b.name),
  source:     (a, b) => a.source.localeCompare(b.source),
  pipeline:   (a, b) => a.pipeline.localeCompare(b.pipeline),
  credential: (a, b) => a.credential.localeCompare(b.credential),
  status:     (a, b) => a.status.localeCompare(b.status),
  // Expired (null) sorts to the top — most urgent first.
  expiry:     (a, b) => (a.expiryDays ?? -1) - (b.expiryDays ?? -1),
  modified:   (a, b) => new Date(a.modified) - new Date(b.modified),
};

let sortKey = 'name';
let sortDir = 1;
let searchTerm = '';

function render() {
  const tbody = document.getElementById('tableBody');
  const term = searchTerm.trim().toLowerCase();

  const rows = connections
    .filter(c => !term || [c.name, c.source, c.pipeline, c.credential, c.status]
      .some(v => (v || '').toLowerCase().includes(term)))
    .slice()
    .sort((a, b) => sortDir * comparators[sortKey](a, b));

  document.getElementById('itemCount').textContent =
    `${rows.length} item${rows.length === 1 ? '' : 's'}`;

  tbody.innerHTML = rows.map((c, i) => {
    const statusClass = c.status.toLowerCase();
    const dotChar = c.status === 'Active' ? '✓' : '!';
    const bucket = expiryBucket(c.expiryDays);
    const note = expiryNote(c.expiryDays);

    return `
      <tr data-name="${escapeHtml(c.name)}">
        <td class="col-num">${i + 1}</td>
        <td><a class="link">${escapeHtml(c.name)}</a></td>
        <td>${escapeHtml(c.source)}</td>
        <td>${c.pipeline ? `<a class="link">${escapeHtml(c.pipeline)}</a>` : ''}</td>
        <td><a class="link">${escapeHtml(c.credential)}</a></td>
        <td>
          <span class="status ${statusClass}">
            <span class="dot">${dotChar}</span>${c.status}
          </span>
        </td>
        <td>
          <span class="expiry ${bucket}">
            <span class="pill-dot"></span>${expiryLabel(c.expiryDays)}
          </span>
          ${note ? `<span class="expiry-note ${note.cls}"><span class="mark">${note.mark}</span>${note.text}</span>` : ''}
        </td>
        <td>${escapeHtml(c.modified)}</td>
        <td class="col-action"><button class="row-action" title="Row actions" data-name="${escapeHtml(c.name)}">▾</button></td>
      </tr>
    `;
  }).join('');
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, ch => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[ch]));
}

// Wire up sort + search interactions.
document.querySelectorAll('th[data-sort]').forEach(th => {
  th.addEventListener('click', () => {
    const key = th.dataset.sort;
    if (sortKey === key) sortDir = -sortDir; else { sortKey = key; sortDir = 1; }
    document.querySelectorAll('th[data-sort] .arrow').forEach(a => a.remove());
    const arrow = document.createElement('span');
    arrow.className = 'arrow';
    arrow.textContent = sortDir === 1 ? '↑' : '↓';
    th.appendChild(arrow);
    render();
  });
});

document.getElementById('searchInput').addEventListener('input', e => {
  searchTerm = e.target.value;
  render();
});

// ===== Row action dropdown menu =====
const rowMenu = document.getElementById('rowMenu');
let menuTargetName = null;
let menuTargetBtn = null;

function openRowMenu(btn) {
  menuTargetBtn = btn;
  menuTargetName = btn.dataset.name;
  const r = btn.getBoundingClientRect();
  rowMenu.style.top  = (window.scrollY + r.bottom + 4) + 'px';
  // Anchor menu's right edge to button's right edge.
  rowMenu.style.left = (window.scrollX + r.right - 170) + 'px';
  rowMenu.hidden = false;
  btn.classList.add('open');
}
function closeRowMenu() {
  rowMenu.hidden = true;
  if (menuTargetBtn) menuTargetBtn.classList.remove('open');
  menuTargetBtn = null;
  menuTargetName = null;
}

document.addEventListener('click', e => {
  const btn = e.target.closest('.row-action');
  if (btn) {
    e.stopPropagation();
    if (btn === menuTargetBtn && !rowMenu.hidden) closeRowMenu();
    else { closeRowMenu(); openRowMenu(btn); }
    return;
  }
  if (!rowMenu.hidden && !e.target.closest('#rowMenu')) closeRowMenu();
});

rowMenu.addEventListener('click', e => {
  const action = e.target.dataset.action;
  if (!action || !menuTargetName) return;
  const conn = connections.find(c => c.name === menuTargetName);
  closeRowMenu();
  if (!conn) return;

  if (action === 'edit') {
    alert(`Edit "${conn.name}" — wire up to your edit form.`);
  } else if (action === 'reauth') {
    openNotifyModal([conn], `Reauthenticate ${conn.name}`);
  } else if (action === 'delete') {
    if (confirm(`Delete connection "${conn.name}"?`)) {
      const i = connections.indexOf(conn);
      connections.splice(i, 1);
      render();
      showToast(`Deleted ${conn.name}`);
    }
  }
});

// ===== Notify modal =====
const notifyModal     = document.getElementById('notifyModal');
const notifyTitle     = document.getElementById('notifyTitle');
const notifySummary   = document.getElementById('notifySummary');
const recipientsInput = document.getElementById('recipients');
const slackInput      = document.getElementById('slackChannel');
const subjectInput    = document.getElementById('msgSubject');
const bodyInput       = document.getElementById('msgBody');
const emailField      = document.getElementById('emailField');
const slackField      = document.getElementById('slackField');

let pendingTargets = [];

function openNotifyModal(targets, titleText) {
  pendingTargets = targets;
  notifyTitle.textContent = titleText || 'Notify owners';

  const lines = targets.map(t => {
    const label = t.expiryDays === null ? 'Expired'
      : t.expiryDays <= 30 ? `expires in ${t.expiryDays} days`
      : `expires in ${t.expiryDays} days`;
    return `• ${t.name} (${t.source}) — ${label}`;
  }).join('\n');

  notifySummary.textContent =
    `${targets.length} connection${targets.length === 1 ? '' : 's'} will be included in this notification.`;

  subjectInput.value = targets.length === 1
    ? `Action required: reauthenticate ${targets[0].name}`
    : `Action required: ${targets.length} marketing connections need reauthentication`;

  bodyInput.value =
    `Hi,\n\nThe following marketing connection${targets.length === 1 ? '' : 's'} ` +
    `need${targets.length === 1 ? 's' : ''} attention before the auth token expires:\n\n` +
    `${lines}\n\nPlease re-authenticate via Connection Management to avoid pipeline interruptions.\n\nThanks.`;

  recipientsInput.value = '';
  slackInput.value = '';
  // Reset to email channel on open
  document.querySelector('input[name="channel"][value="email"]').checked = true;
  emailField.hidden = false;
  slackField.hidden = true;

  notifyModal.hidden = false;
}

function closeNotifyModal() { notifyModal.hidden = true; pendingTargets = []; }

document.querySelectorAll('input[name="channel"]').forEach(r => {
  r.addEventListener('change', () => {
    const useEmail = document.querySelector('input[name="channel"]:checked').value === 'email';
    emailField.hidden = !useEmail;
    slackField.hidden = useEmail;
  });
});

document.getElementById('notifyClose').addEventListener('click', closeNotifyModal);
document.getElementById('notifyCancel').addEventListener('click', closeNotifyModal);
notifyModal.addEventListener('click', e => { if (e.target === notifyModal) closeNotifyModal(); });

document.getElementById('notifySend').addEventListener('click', () => {
  const channel = document.querySelector('input[name="channel"]:checked').value;
  const dest = channel === 'email'
    ? recipientsInput.value.trim()
    : slackInput.value.trim();
  if (!dest) {
    alert(channel === 'email' ? 'Please enter at least one recipient email.' : 'Please enter a Slack channel.');
    return;
  }
  // In a real app this would POST to a backend. Here we just confirm.
  const count = pendingTargets.length;
  closeNotifyModal();
  showToast(`Sent ${channel} notification for ${count} connection${count === 1 ? '' : 's'} → ${dest}`);
});

// ===== Bulk "Notify expiring" =====
document.getElementById('notifyExpiringBtn').addEventListener('click', () => {
  const targets = connections.filter(c =>
    c.expiryDays === null || (typeof c.expiryDays === 'number' && c.expiryDays <= 30)
  );
  if (targets.length === 0) {
    showToast('No connections are expiring or expired.');
    return;
  }
  openNotifyModal(targets, `Notify owners — ${targets.length} expiring connection${targets.length === 1 ? '' : 's'}`);
});

// ===== Toast =====
const toastEl = document.getElementById('toast');
let toastTimer = null;
function showToast(msg) {
  toastEl.textContent = msg;
  toastEl.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { toastEl.hidden = true; }, 3200);
}

render();
