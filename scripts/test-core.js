#!/usr/bin/env node
'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');

async function testApiClient() {
  const calls = [];
  const context = {
    window: {},
    AbortController,
    setTimeout,
    clearTimeout,
    fetch: async (url, options) => {
      calls.push({ url, options });
      if (url.includes('primary.example')) return { ok: false, status: 503, statusText: 'Unavailable', text: async () => 'try later' };
      return { ok: true, status: 200, statusText: 'OK', text: async () => JSON.stringify({ choices: [{ message: { content: 'ok' } }] }) };
    }
  };
  vm.runInNewContext(read('www/api-client.js'), context);
  const api = context.window.GoldWordAPI;
  assert.equal(api.normalizeBaseUrl('https://api.caisheng.art/v1/'), 'https://api.caisheng.art/v1');
  assert.equal(api.endpoint('https://example.com/v1/chat/completions'), 'https://example.com/v1/chat/completions');
  const result = await api.chat({
    baseUrl: 'https://primary.example/v1', model: 'one', apiKey: 'local-test',
    fallbackEnabled: true, fallbackBaseUrl: 'https://backup.example/v1', fallbackModel: 'two', timeoutMs: 3000
  }, { messages: [{ role: 'user', content: 'test' }] });
  assert.equal(result.provider, 'fallback');
  assert.equal(result.content, 'ok');
  assert.equal(calls.length, 2);
  assert.equal(JSON.parse(calls[1].options.body).model, 'two');
}

function testStaticContract() {
  const html = read('www/index.html');
  const app = read('www/app.js');
  const db = read('www/db.js');
  assert.match(html, /api-client\.js/);
  assert.match(html, /gptFallbackEnabled/);
  assert.match(app, /speechInProgress/);
  assert.match(app, /GoldWordAPI\.chat/);
  assert.match(db, /https:\/\/api\.caisheng\.art\/v1/);
  const trackedText = ['www/app.js', 'www/db.js', 'www/ui.js', 'www/index.html', 'www/built-in-models.js'].map(read).join('\n');
  assert.doesNotMatch(trackedText, /ilovecaishen|sk-a2a-/i);
}

(async () => {
  await testApiClient();
  testStaticContract();
  console.log('GoldWord core tests: PASS');
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
