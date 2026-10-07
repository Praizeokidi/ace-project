const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const sourcePath = 'ace-main/api/priority-list.js';
const source = fs.readFileSync(sourcePath, 'utf8').replace(
  'export default async function handler',
  'async function handler',
);

function makeResponse() {
  return {
    statusCode: 200,
    headers: {},
    payload: undefined,
    setHeader(name, value) { this.headers[name] = value; },
    status(code) { this.statusCode = code; return this; },
    json(payload) { this.payload = payload; return this; },
  };
}

async function run(fetchImpl) {
  const context = {
    console,
    URLSearchParams,
    Promise,
    process: {
      env: {
        RESEND_API_KEY: 'test-key',
        SENDING_EMAIL: 'newsletter@send.acedpconsulting-ltd.com',
        RECEIVING_EMAIL: 'praizeokidi@gmail.com',
      },
    },
    fetch: fetchImpl,
  };
  vm.runInNewContext(`${source}\nthis.handler = handler;`, context, {
    filename: sourcePath,
  });
  const response = makeResponse();
  await context.handler({
    method: 'POST',
    body: {
      first_name: 'Ada',
      organisation: 'Example Ltd',
      email: 'Ada@Example.com',
      source_page: 'DPIA Made Easy priority list',
      updates_consent: 'yes',
    },
    headers: {},
  }, response);
  return response;
}

(async () => {
  const successPayloads = [];
  const success = await run(async (url, options) => {
    successPayloads.push(JSON.parse(options.body));
    return { ok: true, status: 200, async json() { return { id: 'test' }; } };
  });
  assert.equal(success.statusCode, 200);
  assert.equal(success.payload.ok, true);
  assert.equal(successPayloads.length, 2);
  assert.equal(successPayloads[0].from, 'newsletter@send.acedpconsulting-ltd.com');
  assert.equal(successPayloads[0].to[0], 'praizeokidi@gmail.com');
  assert.equal(successPayloads[1].to[0], 'ada@example.com');
  assert.match(successPayloads[1].html, /Hi Ada/);
  console.log('PASS priority success path; Resend calls=2');

  const failure = await run(async (url, options) => ({
    ok: false,
    status: 403,
    async json() { return { message: 'Sender domain is not verified' }; },
  }));
  assert.equal(failure.statusCode, 502);
  assert.equal(failure.payload.ok, false);
  console.log('PASS priority Resend failure path; HTTP=502');
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
