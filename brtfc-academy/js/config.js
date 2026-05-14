// BRTFC Academy IDP - Config
// Edit DEFAULT_PIN to set the initial coach PIN before deploying

const DEFAULT_PIN = '1234';

function getConfig() {
  return {
    pin: localStorage.getItem('brtfc_pin') || DEFAULT_PIN,
    sheetId: localStorage.getItem('brtfc_sheet_id') || '',
    apiKey: localStorage.getItem('brtfc_api_key') || ''
  };
}

function saveConfig() {
  const sheetId = document.getElementById('sheet-id').value.trim();
  const apiKey = document.getElementById('api-key').value.trim();
  if (!sheetId || !apiKey) {
    showStatus('import-status', 'Enter both Sheet ID and API key.', false);
    return;
  }
  localStorage.setItem('brtfc_sheet_id', sheetId);
  localStorage.setItem('brtfc_api_key', apiKey);
  showStatus('import-status', 'Config saved.', true);
}

function changePIN() {
  const np = document.getElementById('new-pin').value.trim();
  const cp = document.getElementById('confirm-pin').value.trim();
  if (!np || np.length < 4) {
    showStatus('pin-status', 'PIN must be at least 4 digits.', false);
    return;
  }
  if (np !== cp) {
    showStatus('pin-status', 'PINs do not match.', false);
    return;
  }
  localStorage.setItem('brtfc_pin', np);
  document.getElementById('new-pin').value = '';
  document.getElementById('confirm-pin').value = '';
  showStatus('pin-status', 'PIN updated. Share the new PIN with your coaches.', true);
}

function checkPIN() {
  const entered = document.getElementById('pin-input').value;
  const cfg = getConfig();
  if (entered === cfg.pin) {
    document.getElementById('pin-screen').classList.add('hidden');
    document.getElementById('app').classList.remove('hidden');
    document.getElementById('pin-input').value = '';
    document.getElementById('pin-error').textContent = '';
    initApp();
  } else {
    document.getElementById('pin-error').textContent = 'Incorrect PIN. Try again.';
    document.getElementById('pin-input').value = '';
  }
}

document.addEventListener('keydown', function(e) {
  if (e.key === 'Enter' && !document.getElementById('pin-screen').classList.contains('hidden')) {
    checkPIN();
  }
});

function logout() {
  document.getElementById('app').classList.add('hidden');
  document.getElementById('pin-screen').classList.remove('hidden');
}

function showStatus(elId, msg, ok) {
  const el = document.getElementById(elId);
  if (!el) return;
  el.textContent = msg;
  el.className = 'status-msg ' + (ok ? 'status-ok' : 'status-err');
}
