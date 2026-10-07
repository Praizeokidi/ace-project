const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const sourcePath = 'ace-main/api/newsletter.js';
const source = fs.readFileSync(sourcePath, 'utf8').replace('export default async function handler', 'async function handler');
const context = {
  console,
  __dirname: path.resolve('ace-main/api'),
  require,
  process: {
    env: {
      RESEND_API_KEY: 'test-resend-key',
      SENDING_EMAIL: 'hello@example.com',
      RECEIVING_EMAIL: 'owner@example.com',
    },
  },
  URLSearchParams,
  Promise,
  fetch: async (url, options) => {
    fetchCalls.push({ url, options, payload: JSON.parse(options.body) });
    return { ok: true, status: 200, async json() { return { id: 'test-email-id' }; } };
  },
};
const fetchCalls = [];
vm.runInNewContext(`${source}\nthis.handler = handler;`, context, { filename: sourcePath });

const request = {
  method: 'POST',
  body: { email: 'Subscriber@Example.com', source: 'ace-footer-home' },
  headers: {},
};
const response = {
  statusCode: 200,
  headers: {},
  setHeader(name, value) { this.headers[name] = value; },
  status(code) { this.statusCode = code; return this; },
  json(payload) { this.payload = payload; return this; },
};

(async () => {
  await context.handler(request, response);
  assert.equal(response.statusCode, 200);
  assert.equal(response.payload.ok, true);
  assert.equal(response.payload.message, 'You are now subscribed to ACE updates and resources.');
  assert.equal(fetchCalls.length, 2);
  assert.equal(fetchCalls[0].payload.to[0], 'owner@example.com');
  assert.equal(fetchCalls[1].payload.to[0], 'subscriber@example.com');
  assert.match(fetchCalls[1].payload.html, /Welcome to the ACE updates list/);
  assert.match(fetchCalls[1].payload.html, /background:#0c5661/);
  assert.match(fetchCalls[1].payload.text, /Thank you for subscribing/);
  console.log('PASS local newsletter handler test');
  console.log(`Resend calls: ${fetchCalls.length}`);
  console.log(`Subscriber HTML bytes: ${Buffer.byteLength(fetchCalls[1].payload.html, 'utf8')}`);
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
