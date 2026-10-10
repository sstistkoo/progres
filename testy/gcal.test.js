const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const html = fs.readFileSync(__dirname + '/../sichty.html', 'utf8');

test('Google Client ID: vlastní ID, validace a záloha', () => {
  assert.ok(html.includes('function gcalClientId()'));
  assert.ok(html.includes('client_id: gcalTokenClientId'));
  assert.ok(!/client_id:\s*GCAL_CLIENT_ID\b/.test(html));
  assert.ok(/'gcalClientId',\s*FIRMS_KEY/.test(html));
  const m = html.match(/GCAL_CLIENT_ID_PATTERN = (\/.*\/i);/);
  const re = eval(m[1]);
  assert.ok(re.test('1234567890-abc123.apps.googleusercontent.com'));
  assert.ok(!re.test('neco-jineho'));
  assert.ok(!re.test('abc.apps.googleusercontent.com'));
});

test('Google návod: modal a tlačítka v obou oknech', () => {
  assert.ok(html.includes('id="gcalSetupModal"'));
  assert.strictEqual((html.match(/showGcalSetupModal\(\)/g) || []).length >= 3, true);
});
