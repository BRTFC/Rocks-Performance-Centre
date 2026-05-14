// BRTFC Academy IDP - Data layer (localStorage)

const TECH  = ['Passing', 'Ball control', 'Shooting', 'Dribbling', 'Crossing', 'Heading'];
const PHYS  = ['Pace', 'Strength', 'Stamina', 'Agility', 'Balance'];
const TACT  = ['Positioning', 'Decision making', 'Work rate', 'Press resistance', 'Transition'];
const ATT   = ['Attitude', 'Effort', 'Coachability', 'Leadership'];

const ALL_ATTRS = { tech: TECH, phys: PHYS, tact: TACT, att: ATT };
const ATTR_LABELS = { tech: 'Technical', phys: 'Physical', tact: 'Tactical', att: 'Attitude & effort' };

let players = [];
let entries = [];
let goals   = {};

function loadData() {
  try { players = JSON.parse(localStorage.getItem('brtfc_players') || '[]'); } catch(e) { players = []; }
  try { entries  = JSON.parse(localStorage.getItem('brtfc_entries')  || '[]'); } catch(e) { entries  = []; }
  try { goals    = JSON.parse(localStorage.getItem('brtfc_goals')    || '{}'); } catch(e) { goals    = {}; }
}

function persistData() {
  localStorage.setItem('brtfc_players', JSON.stringify(players));
  localStorage.setItem('brtfc_entries',  JSON.stringify(entries));
  localStorage.setItem('brtfc_goals',    JSON.stringify(goals));
}

function addPlayer() {
  const fname  = document.getElementById('qk-fname').value.trim();
  const lname  = document.getElementById('qk-lname').value.trim();
  const group  = document.getElementById('qk-group').value;
  const pos    = document.getElementById('qk-pos').value;
  const email  = document.getElementById('qk-email').value.trim();
  const pemail = document.getElementById('qk-pemail').value.trim();
  if (!fname || !lname) { alert('Enter first and last name.'); return; }
  players.push({ id: Date.now(), fname, lname, group, pos, email, pemail });
  persistData();
  ['qk-fname','qk-lname','qk-email','qk-pemail'].forEach(id => document.getElementById(id).value = '');
  toggleAddPlayer();
  renderPlayers();
}

function removePlayer(id) {
  if (!confirm('Remove this player and all their data?')) return;
  players = players.filter(p => p.id !== id);
  entries  = entries.filter(e => e.pid !== id);
  delete goals[id];
  persistData();
  renderPlayers();
  renderAdminRoster();
}

function getPlayerById(id) {
  return players.find(p => p.id === id);
}

function initials(p) {
  return ((p.fname[0] || '') + (p.lname[0] || '')).toUpperCase();
}

function getWeekNumber(d) {
  d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  const y = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d - y) / 86400000) + 1) / 7);
}

function currentWeekStr() {
  const now = new Date();
  return `${now.getFullYear()}-W${String(getWeekNumber(now)).padStart(2, '0')}`;
}

function getAvgScores(pid) {
  const pe = entries.filter(e => e.pid === pid);
  if (!pe.length) return {};
  const avgs = {};
  Object.values(ALL_ATTRS).flat().forEach(attr => {
    const vals = pe.map(e => e.scores[attr] || 0).filter(v => v > 0);
    avgs[attr] = vals.length ? Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) / 10 : 0;
  });
  return avgs;
}

function getOverallAvg(pid) {
  const avgs = Object.values(getAvgScores(pid));
  if (!avgs.length) return null;
  const total = avgs.reduce((a, b) => a + b, 0);
  return (total / avgs.length).toFixed(1);
}
