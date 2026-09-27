const test = require('node:test');
const assert = require('node:assert/strict');
const os = require('node:os');
const path = require('node:path');
const { randomUUID } = require('node:crypto');

process.env.DATABASE_PATH = path.join(os.tmpdir(), `circular-visit-test-${randomUUID()}.sqlite`);
process.env.ADMIN_EMAIL = 'operator@example.test';
process.env.ADMIN_PASSWORD = 'SecureDemoPassword123';
delete process.env.OPENAI_API_KEY;
const { server } = require('./index');

test('resident booking, policy, capacity and account isolation', async () => {
  await new Promise(resolve => server.listen(0, resolve));
  const base = `http://localhost:${server.address().port}/api`;
  const call = async (route, method = 'GET', payload, token) => {
    const response = await fetch(base + route, { method, headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body: payload ? JSON.stringify(payload) : undefined });
    return { status: response.status, data: await response.json() };
  };
  try {
    const bootstrap = await call('/bootstrap');
    assert.equal(bootstrap.status, 200);
    assert.equal(bootstrap.data.centres.length, 3);
    const date = new Date(Date.now() + 3 * 86400000).toISOString().slice(0, 10);
    const slotData = await call(`/centres/riverside/slots?date=${date}`);
    assert.equal(slotData.status, 200);
    const time = slotData.data.slots.find(s => s.available).time;
    const payload = { centreId: 'riverside', date, time, items: ['cardboard', 'fridge'], postcode: 'RV1 2AB', vehicle: 'Car', notes: '' };
    const tokens = [];
    for (let i = 0; i < 6; i++) {
      const registered = await call('/auth/register', 'POST', { name: `Resident ${i}`, email: `resident${i}@example.test`, password: 'longpassword123' });
      assert.equal(registered.status, 201);
      tokens.push(registered.data.token);
    }
    const rejected = await call('/bookings', 'POST', { ...payload, centreId: 'north' }, tokens[0]);
    assert.equal(rejected.status, 400);
    const wrongArea = await call('/bookings', 'POST', { ...payload, postcode: 'SW1A 1AA' }, tokens[0]);
    assert.equal(wrongArea.status, 400);
    const first = await call('/bookings', 'POST', payload, tokens[0]);
    assert.equal(first.status, 201);
    assert.equal(first.data.booking.status, 'confirmed');
    const duplicate = await call('/bookings', 'POST', payload, tokens[0]);
    assert.equal(duplicate.status, 409);
    const otherAccount = await call('/bookings', 'GET', undefined, tokens[1]);
    assert.equal(otherAccount.data.bookings.length, 0);
    const unauthorizedCancel = await call(`/bookings/${first.data.booking.id}/cancel`, 'POST', undefined, tokens[1]);
    assert.equal(unauthorizedCancel.status, 403);
    for (let i = 1; i < 5; i++) assert.equal((await call('/bookings', 'POST', payload, tokens[i])).status, 201);
    assert.equal((await call('/bookings', 'POST', payload, tokens[5])).status, 409);
    const cancelled = await call(`/bookings/${first.data.booking.id}/cancel`, 'POST', undefined, tokens[0]);
    assert.equal(cancelled.data.booking.status, 'cancelled');
    const replacement = await call('/bookings', 'POST', payload, tokens[5]);
    assert.equal(replacement.status, 201);
    const admin = await call('/auth/login', 'POST', { email: process.env.ADMIN_EMAIL, password: process.env.ADMIN_PASSWORD });
    const overview = await call('/admin/overview', 'GET', undefined, admin.data.token);
    assert.equal(overview.status, 200);
    assert.equal(overview.data.bookings.length, 6);
    const assistant = await call('/assistant', 'POST', { message: `I have a fridge and cardboard on ${date} morning`, context: {} }, tokens[0]);
    assert.equal(assistant.status, 200);
    assert.deepEqual(assistant.data.state.items.sort(), ['cardboard', 'fridge']);
    assert(assistant.data.centres.every(c => c.id === 'riverside'));
    const secondSlot = slotData.data.slots.find(s => s.available && s.time !== time).time;
    const moved = await call(`/bookings/${replacement.data.booking.id}/reschedule`, 'POST', { date, time: secondSlot }, tokens[5]);
    assert.equal(moved.status, 200);
    assert.equal(moved.data.booking.time, secondSlot);
    const capacity = await call('/admin/centres/riverside', 'PATCH', { slotCapacity: 3 }, admin.data.token);
    assert.equal(capacity.status, 200);
    const afterCapacity = await call(`/centres/riverside/slots?date=${date}`);
    assert.equal(afterCapacity.data.slots.find(s => s.time === time).available, false);
    const rule = await call('/admin/centres/riverside/rules/fridge', 'PATCH', { accepted: false, note: 'Temporarily unavailable' }, admin.data.token);
    assert.equal(rule.status, 200);
    assert.equal((await call('/bookings', 'POST', { ...payload, time: secondSlot }, tokens[0])).status, 400);
  } finally { await new Promise(resolve => server.close(resolve)); }
});

test('AI extraction uses structured output while centre and slot facts remain local', async () => {
  const { assist } = require('./assistant');
  const originalFetch = global.fetch;
  process.env.OPENAI_API_KEY = 'test-key';
  process.env.ENABLE_OPENAI = 'true';
  let request;
  global.fetch = async (url, options) => {
    assert.equal(url, 'https://api.openai.com/v1/responses');
    request = JSON.parse(options.body);
    return { ok: true, json: async () => ({ output: [{ content: [{ type: 'output_text', text: JSON.stringify({ items: ['fridge'], date: new Date(Date.now() + 3 * 86400000).toISOString().slice(0, 10), postcode: 'RV2 4CD', area: 'riverside', timeWindow: 'morning' }) }] }] }) };
  };
  try {
    const result = await assist('My large white cooling appliance on Wednesday morning');
    assert.equal(request.text.format.type, 'json_schema');
    assert.deepEqual(result.state.items, ['fridge']);
    assert(result.centres.every(c => c.id === 'riverside'));
  } finally { global.fetch = originalFetch; delete process.env.OPENAI_API_KEY; delete process.env.ENABLE_OPENAI; }
});
