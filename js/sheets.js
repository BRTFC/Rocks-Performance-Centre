// BRTFC Academy IDP - Google Sheets integration
// Reads player data from a Google Sheet
// Expected sheet format (Sheet1):
// Row 1: Headers - FirstName | LastName | AgeGroup | Position | PlayerEmail | ParentEmail
// Row 2+: Player data

async function importFromSheets() {
  const cfg = getConfig();
  const statusEl = document.getElementById('import-status');

  const sheetId = document.getElementById('sheet-id').value.trim() || cfg.sheetId;
  const apiKey  = document.getElementById('api-key').value.trim()  || cfg.apiKey;

  if (!sheetId || !apiKey) {
    showStatus('import-status', 'Enter Sheet ID and API key first.', false);
    return;
  }

  showStatus('import-status', 'Importing...', true);

  const range  = 'Sheet1!A2:F500';
  const url    = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${range}?key=${apiKey}`;

  try {
    const res  = await fetch(url);
    const data = await res.json();

    if (data.error) {
      showStatus('import-status', `Error: ${data.error.message}`, false);
      return;
    }

    const rows = data.values || [];
    if (!rows.length) {
      showStatus('import-status', 'No player data found. Check sheet format.', false);
      return;
    }

    let added   = 0;
    let skipped = 0;

    rows.forEach(row => {
      const fname  = (row[0] || '').trim();
      const lname  = (row[1] || '').trim();
      const group  = (row[2] || '').trim();
      const pos    = (row[3] || '').trim();
      const email  = (row[4] || '').trim();
      const pemail = (row[5] || '').trim();

      if (!fname || !lname) { skipped++; return; }

      const exists = players.find(
        p => p.fname.toLowerCase() === fname.toLowerCase() &&
             p.lname.toLowerCase() === lname.toLowerCase()
      );

      if (exists) { skipped++; return; }

      const validGroups = ['U14','U15','U16','U18'];
      const validPos    = ['GK','CB','RB','LB','CDM','CM','CAM','RW','LW','ST'];

      players.push({
        id:     Date.now() + Math.random(),
        fname,
        lname,
        group:  validGroups.includes(group) ? group : 'U16',
        pos:    validPos.includes(pos) ? pos : 'CM',
        email,
        pemail
      });

      added++;
    });

    persistData();
    renderPlayers();
    renderAdminRoster();
    showStatus('import-status', `Done. ${added} player${added !== 1 ? 's' : ''} imported, ${skipped} skipped (already exist or blank).`, true);

  } catch (err) {
    showStatus('import-status', `Network error: ${err.message}`, false);
  }
}

// Write a single entry row back to Google Sheets (optional future feature)
// Sheet2 format: Timestamp | PlayerName | Group | Week | Attr | Score | Notes
async function syncEntryToSheets(entry, player) {
  const cfg = getConfig();
  if (!cfg.sheetId || !cfg.apiKey) return;

  // Note: Writing to Sheets via API key alone is read-only.
  // Full write support requires OAuth2 or a backend proxy.
  // This is a placeholder for future implementation.
  console.log('Sheets write requires OAuth2 - entry saved locally only.', entry, player);
}
