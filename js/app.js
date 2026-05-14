// BRTFC Academy IDP - Main app

let activeGroup = 'all';
let tempGoals   = [];

function initApp() {
  loadData();

  // Set current week
  const now = new Date();
  document.getElementById('week-label').textContent =
    `Week ${getWeekNumber(now)}, ${now.getFullYear()}`;

  // Pre-fill admin config fields
  const cfg = getConfig();
  if (cfg.sheetId) document.getElementById('sheet-id').value = cfg.sheetId;

  renderPlayers();
  renderAdminRoster();
  populateIDPSelect();
}

// ── VIEW SWITCHING ──────────────────────────────────────────────

function showView(v, btn) {
  document.querySelectorAll('.view').forEach(el => {
    el.classList.remove('active');
    el.classList.add('hidden');
  });
  const el = document.getElementById('view-' + v);
  el.classList.remove('hidden');
  el.classList.add('active');

  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');

  if (v === 'input')  initInputForm();
  if (v === 'idp')    populateIDPSelect();
  if (v === 'admin')  renderAdminRoster();
}

// ── PLAYERS VIEW ────────────────────────────────────────────────

function filterGroup(g, btn) {
  activeGroup = g;
  document.querySelectorAll('.group-tabs .tab').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  renderPlayers();
}

function renderPlayers() {
  const list     = document.getElementById('player-list');
  const filtered = activeGroup === 'all' ? players : players.filter(p => p.group === activeGroup);

  if (!filtered.length) {
    list.innerHTML = '<p class="empty-msg">No players in this group yet.</p>';
    return;
  }

  list.innerHTML = filtered.map(p => {
    const avg = getOverallAvg(p.id);
    const sessionCount = entries.filter(e => e.pid === p.id).length;
    return `<div class="player-card" onclick="openPlayerIDP(${p.id})">
      <div class="avatar">${initials(p)}</div>
      <div class="player-info">
        <div class="player-name">${p.fname} ${p.lname}</div>
        <div class="player-meta">
          <span class="badge badge-pos">${p.pos}</span>
          &nbsp;<span class="badge badge-group">${p.group}</span>
        </div>
      </div>
      <div class="player-score">
        ${avg
          ? `<div class="score-num">${avg}</div><div style="font-size:11px;color:var(--text3);">/5 avg</div>`
          : `<div style="font-size:12px;color:var(--text3);">No data</div>`}
        <div style="font-size:11px;color:var(--text3);">${sessionCount} session${sessionCount !== 1 ? 's' : ''}</div>
      </div>
      <div class="chevron">›</div>
    </div>`;
  }).join('');
}

function openPlayerIDP(id) {
  showView('idp', document.querySelectorAll('.nav-btn')[2]);
  document.getElementById('idp-player-sel').value = id;
  renderIDP();
}

function toggleAddPlayer() {
  const form = document.getElementById('add-player-form');
  form.classList.toggle('hidden');
}

// ── COACH INPUT ─────────────────────────────────────────────────

function filterInputPlayers() {
  const grp = document.getElementById('inp-group').value;
  const sel = document.getElementById('inp-player');
  sel.innerHTML = '<option value="">Select player...</option>';
  (grp ? players.filter(p => p.group === grp) : players).forEach(p => {
    sel.innerHTML += `<option value="${p.id}">${p.fname} ${p.lname} (${p.group})</option>`;
  });
}

function initInputForm() {
  filterInputPlayers();
  document.getElementById('inp-week').value = currentWeekStr();
  document.getElementById('inp-notes').value = '';
  tempGoals = [];

  Object.entries(ALL_ATTRS).forEach(([cat, attrs]) => {
    const grid = document.getElementById(cat + '-grid');
    grid.innerHTML = attrs.map(a => {
      const sid = `star_${cat}_${a.replace(/\s/g, '_')}`;
      return `<div class="attr-item">
        <div class="attr-name">${a}</div>
        <div class="star-row" id="${sid}" data-val="3">
          ${[1,2,3,4,5].map(i =>
            `<span class="star${i <= 3 ? ' on' : ''}" onclick="setStar('${sid}', ${i})">★</span>`
          ).join('')}
          <span class="star-val" id="${sid}_val">3/5</span>
        </div>
      </div>`;
    }).join('');
  });

  renderGoalsList();
}

function setStar(sid, val) {
  const row = document.getElementById(sid);
  if (!row) return;
  row.dataset.val = val;
  row.querySelectorAll('.star').forEach((s, i) => s.classList.toggle('on', i < val));
  const lbl = document.getElementById(sid + '_val');
  if (lbl) lbl.textContent = val + '/5';
}

function getScores() {
  const scores = {};
  Object.entries(ALL_ATTRS).forEach(([cat, attrs]) => {
    attrs.forEach(a => {
      const sid = `star_${cat}_${a.replace(/\s/g, '_')}`;
      const row = document.getElementById(sid);
      scores[a] = row ? parseInt(row.dataset.val || 3) : 3;
    });
  });
  return scores;
}

function addGoal() {
  const inp = document.getElementById('new-goal');
  const val = inp.value.trim();
  if (!val) return;
  tempGoals.push(val);
  inp.value = '';
  renderGoalsList();
}

function removeGoal(i) {
  tempGoals.splice(i, 1);
  renderGoalsList();
}

function renderGoalsList() {
  const el = document.getElementById('goals-list');
  if (!tempGoals.length) {
    el.innerHTML = '<p style="font-size:13px;color:var(--text3);margin-bottom:6px;">No goals added yet.</p>';
    return;
  }
  el.innerHTML = tempGoals.map((g, i) =>
    `<div class="goal-line">
      <span>${g}</span>
      <button class="goal-remove" onclick="removeGoal(${i})">✕</button>
    </div>`
  ).join('');
}

function saveEntry() {
  const pid = parseInt(document.getElementById('inp-player').value);
  if (!pid) { alert('Select a player first.'); return; }

  const week  = document.getElementById('inp-week').value;
  const pos   = document.getElementById('inp-pos').value;
  const notes = document.getElementById('inp-notes').value.trim();
  const scores = getScores();

  // Replace existing entry for same player + week
  entries = entries.filter(e => !(e.pid === pid && e.week === week));
  entries.push({ pid, week, pos, notes, scores });

  // Add new goals (avoid dupes)
  if (tempGoals.length) {
    if (!goals[pid]) goals[pid] = [];
    tempGoals.forEach(g => {
      if (!goals[pid].find(x => x.text === g)) {
        goals[pid].push({ text: g, progress: 0 });
      }
    });
  }

  persistData();
  tempGoals = [];
  renderGoalsList();
  alert('Entry saved.');
}

function previewIDP() {
  const pid = parseInt(document.getElementById('inp-player').value);
  if (!pid) { alert('Select a player first.'); return; }
  openPlayerIDP(pid);
}

// ── IDP VIEW ─────────────────────────────────────────────────────

function populateIDPSelect() {
  const sel = document.getElementById('idp-player-sel');
  const cur = sel.value;
  sel.innerHTML = '<option value="">Select player...</option>';
  players.forEach(p => {
    sel.innerHTML += `<option value="${p.id}">${p.fname} ${p.lname} (${p.group})</option>`;
  });
  if (cur) sel.value = cur;
}

function renderIDP() {
  const pid     = parseInt(document.getElementById('idp-player-sel').value);
  const content = document.getElementById('idp-content');
  const actions = document.getElementById('idp-actions');

  if (!pid) {
    content.innerHTML = '<p class="empty-msg">Select a player to view their IDP.</p>';
    actions.classList.add('hidden');
    return;
  }

  const p = getPlayerById(pid);
  if (!p) { content.innerHTML = '<p class="empty-msg">Player not found.</p>'; return; }

  const pe           = entries.filter(e => e.pid === pid);
  const avgScores    = getAvgScores(pid);
  const overallAvg   = getOverallAvg(pid) || 'N/A';
  const playerGoals  = goals[pid] || [];
  const latest       = pe[pe.length - 1];
  const goalsmet     = playerGoals.filter(g => g.progress >= 100).length;

  content.innerHTML = `
    <div class="idp-header">
      <div class="idp-avatar">${initials(p)}</div>
      <div>
        <div class="idp-name">${p.fname} ${p.lname}</div>
        <div class="idp-sub">
          <span class="badge badge-pos">${p.pos}</span>
          &nbsp;<span class="badge badge-group">${p.group}</span>
          &nbsp;${pe.length} session${pe.length !== 1 ? 's' : ''} recorded
        </div>
      </div>
    </div>

    <div class="metric-grid">
      <div class="metric-card"><div class="metric-val">${overallAvg}</div><div class="metric-lbl">Overall avg</div></div>
      <div class="metric-card"><div class="metric-val">${pe.length}</div><div class="metric-lbl">Sessions</div></div>
      <div class="metric-card"><div class="metric-val">${playerGoals.length}</div><div class="metric-lbl">Goals set</div></div>
      <div class="metric-card"><div class="metric-val">${goalsmet}</div><div class="metric-lbl">Goals met</div></div>
    </div>

    ${Object.entries(ALL_ATTRS).map(([cat, attrs]) => `
      <div class="card">
        <div class="section-label">${ATTR_LABELS[cat]}</div>
        ${attrs.map(a => {
          const v   = avgScores[a] || 0;
          const pct = Math.round((v / 5) * 100);
          return `<div class="attr-bar">
            <div class="attr-bar-top"><span>${a}</span><span>${v || 'N/A'}/5</span></div>
            <div class="bar-track"><div class="bar-fill" style="width:${pct}%"></div></div>
          </div>`;
        }).join('')}
      </div>
    `).join('')}

    ${latest && latest.notes ? `
      <div class="card">
        <div class="section-label">Latest coach notes</div>
        <div class="notes-block">${latest.notes}</div>
      </div>
    ` : ''}

    ${playerGoals.length ? `
      <div class="card">
        <div class="section-label">Term goals</div>
        ${playerGoals.map((g, i) => `
          <div class="goal-idp">
            <div class="goal-idp-title">${g.text}</div>
            <div class="goal-progress-row">
              <div class="prog-track"><div class="prog-fill" style="width:${g.progress}%"></div></div>
              <span>${g.progress}%</span>
              <input type="range" min="0" max="100" step="10" value="${g.progress}" style="width:80px;"
                oninput="updateGoalProgress(${pid}, ${i}, this.value)">
            </div>
          </div>
        `).join('')}
      </div>
    ` : ''}
  `;

  actions.classList.remove('hidden');
}

function updateGoalProgress(pid, idx, val) {
  if (!goals[pid] || !goals[pid][idx]) return;
  goals[pid][idx].progress = parseInt(val);
  persistData();
  renderIDP();
}

function emailIDP() {
  const pid = parseInt(document.getElementById('idp-player-sel').value);
  const p   = getPlayerById(pid);
  if (!p) return;

  const avg    = getOverallAvg(pid) || 'N/A';
  const avgs   = getAvgScores(pid);
  const pg     = goals[pid] || [];
  const pe     = entries.filter(e => e.pid === pid);
  const latest = pe[pe.length - 1];

  const attrSummary = Object.entries(ALL_ATTRS).map(([cat, attrs]) =>
    `${ATTR_LABELS[cat]}: ${attrs.map(a => `${a} ${avgs[a] || 'N/A'}/5`).join(', ')}`
  ).join('\n');

  const goalSummary = pg.length
    ? pg.map(g => `- ${g.text} (${g.progress}% complete)`).join('\n')
    : 'No goals set yet.';

  const notes = latest && latest.notes ? latest.notes : 'No notes recorded.';

  const prompt = `Write a warm but honest Individual Development Plan email for ${p.fname} ${p.lname} (${p.group}, ${p.pos}) at Bognor Regis Town FC Academy. Address it to the player and parent.

Player data:
- Overall average score: ${avg}/5
- Sessions recorded: ${pe.length}

Attribute scores:
${attrSummary}

Term goals:
${goalSummary}

Latest coach notes:
${notes}

Write it in plain text, suitable to paste into an email. Include a subject line. Be direct, specific, and constructive. Highlight strengths and give 2 to 3 clear areas to work on. End with encouragement.`;

  window.sendPrompt && window.sendPrompt(prompt);
}

// ── ADMIN ────────────────────────────────────────────────────────

function renderAdminRoster() {
  const el = document.getElementById('admin-roster');
  if (!players.length) {
    el.innerHTML = '<p class="empty-msg">No players added yet.</p>';
    return;
  }
  el.innerHTML = `
    <table class="roster-table">
      <thead>
        <tr>
          <th>Name</th><th>Group</th><th>Pos</th><th>Email</th><th></th>
        </tr>
      </thead>
      <tbody>
        ${players.map(p => `
          <tr>
            <td>${p.fname} ${p.lname}</td>
            <td><span class="badge badge-group">${p.group}</span></td>
            <td>${p.pos}</td>
            <td style="color:var(--text2);font-size:12px;">${p.email || 'N/A'}</td>
            <td><button class="del-btn" onclick="removePlayer(${p.id})" title="Remove">✕</button></td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
}
