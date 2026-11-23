import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('invalid submission cancels an earlier lookup and preserves the error', async () => {
  const elements = new Map();
  for (const id of ['weather-search', 'city-input', 'search-button', 'message', 'weather',
    'city-name', 'temperature', 'condition', 'condition-icon', 'humidity', 'wind', 'observation-time']) {
    elements.set('#' + id, { dataset: {}, setAttribute() {}, focus() {},
      addEventListener(type, handler) { this.handler = handler; } });
  }
  const previousDocument = globalThis.document;
  const previousFetch = globalThis.fetch;
  let resolveFetch;
  let signal;
  let fetchCount = 0;
  globalThis.document = { querySelector: (selector) => elements.get(selector) };
  globalThis.fetch = (_url, options) => {
    fetchCount++;
    signal = options.signal;
    return new Promise((resolve) => { resolveFetch = resolve; });
  };
  try {
    const source = (await readFile(new URL('../weather-app.js', import.meta.url), 'utf8'))
      .replace('./weather-utils.mjs', new URL('../weather-utils.mjs', import.meta.url).href);
    await import('data:text/javascript;base64,' + Buffer.from(source).toString('base64'));
    const form = elements.get('#weather-search');
    const input = elements.get('#city-input');
    input.value = 'Paris';
    const pending = form.handler({ preventDefault() {} });
    input.value = '  ';
    await form.handler({ preventDefault() {} });
    assert.equal(signal.aborted, true);
    assert.equal(elements.get('#search-button').disabled, false);
    resolveFetch({ ok: true, json: async () => ({ results: [{ name: 'Paris', latitude: 1, longitude: 2 }] }) });
    await pending;
    assert.equal(fetchCount, 1, 'stale lookup must not start a forecast request');
    assert.match(elements.get('#message').textContent, /at least two characters/);
    assert.equal(elements.get('#message').dataset.kind, 'error');
  } finally {
    globalThis.document = previousDocument;
    globalThis.fetch = previousFetch;
  }
});
