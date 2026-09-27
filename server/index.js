const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { db, verifyPassword, createUser, createSession, sessionUser, audit } = require('./db');
const service = require('./service');
const { assist } = require('./assistant');

const port = Number(process.env.PORT || 9000);
const json = (res, status, data) => { res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' }); res.end(JSON.stringify(data)); };
const requireUser = req => {
  const user = sessionUser((req.headers.authorization || '').replace(/^Bearer\s+/i, ''));
  if (!user) throw new service.AppError(401, 'Please sign in');
  return user;
};
const requireAdmin = req => {
  const user = requireUser(req);
  if (user.role !== 'admin') throw new service.AppError(403, 'Administrator access required');
  return user;
};
async function body(req) {
  let text = '';
  for await (const chunk of req) {
    text += chunk;
    if (text.length > 20000) throw new service.AppError(413, 'Request is too large');
  }
  try { return text ? JSON.parse(text) : {}; } catch { throw new service.AppError(400, 'Invalid JSON'); }
}
function serveStatic(req, res, pathname) {
  const build = path.join(__dirname, '..', 'build');
  if (!fs.existsSync(build)) return json(res, 404, { error: 'Not found' });
  const safe = path.normalize(decodeURIComponent(pathname)).replace(/^(\.\.[/\\])+/, '');
  let file = path.resolve(build, '.' + safe);
  if (!file.startsWith(build + path.sep) && file !== build) return json(res, 403, { error: 'Forbidden' });
  if (!fs.existsSync(file) || fs.statSync(file).isDirectory()) file = path.join(build, 'index.html');
  const type = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png', '.ico': 'image/x-icon', '.json': 'application/json' }[path.extname(file)] || 'application/octet-stream';
  res.writeHead(200, { 'Content-Type': type, 'X-Content-Type-Options': 'nosniff' });
  fs.createReadStream(file).pipe(res);
}
async function handle(req, res) {
  const url = new URL(req.url, `http://localhost:${port}`);
  const route = url.pathname;
  try {
    if (route === '/api/health') return json(res, 200, { status: 'ok', aiConfigured: process.env.ENABLE_OPENAI === 'true' && Boolean(process.env.OPENAI_API_KEY) });
    if (route === '/api/bootstrap' && req.method === 'GET') return json(res, 200, { centres: service.listCentres(), categories: service.listCategories(), aiConfigured: process.env.ENABLE_OPENAI === 'true' && Boolean(process.env.OPENAI_API_KEY), demoData: true });
    if (route === '/api/auth/register' && req.method === 'POST') {
      const data = await body(req);
      if (typeof data.name !== 'string' || !data.name.trim() || data.name.length > 100 || typeof data.email !== 'string' || data.email.length > 254 || !/^\S+@\S+\.\S+$/.test(data.email) || typeof data.password !== 'string' || data.password.length < 8 || data.password.length > 128) throw new service.AppError(400, 'Enter a name, valid email and password of 8–128 characters');
      if (db.prepare('SELECT id FROM users WHERE email = ?').get(data.email.trim().toLowerCase())) throw new service.AppError(409, 'An account with this email already exists');
      const user = createUser({ name: data.name, email: data.email, password: data.password });
      audit(user.id, 'user.registered', user.id);
      return json(res, 201, { user, token: createSession(user.id) });
    }
    if (route === '/api/auth/login' && req.method === 'POST') {
      const data = await body(req);
      const row = db.prepare('SELECT * FROM users WHERE email = ?').get(String(data.email || '').trim().toLowerCase());
      if (!row || !verifyPassword(String(data.password || ''), row.password_hash)) throw new service.AppError(401, 'Incorrect email or password');
      const user = { id: row.id, name: row.name, email: row.email, role: row.role };
      audit(user.id, 'user.login', user.id);
      return json(res, 200, { user, token: createSession(user.id) });
    }
    if (route === '/api/auth/logout' && req.method === 'POST') {
      const token = (req.headers.authorization || '').replace(/^Bearer\s+/i, '');
      const user = sessionUser(token);
      if (user) {
        const { createHash } = require('node:crypto');
        db.prepare('DELETE FROM sessions WHERE token_hash = ?').run(createHash('sha256').update(token).digest('hex'));
      }
      return json(res, 200, { ok: true });
    }
    if (route === '/api/me' && req.method === 'GET') return json(res, 200, { user: requireUser(req) });
    if (route === '/api/centres' && req.method === 'GET') return json(res, 200, { centres: service.listCentres() });
    const slotsMatch = route.match(/^\/api\/centres\/([^/]+)\/slots$/);
    if (slotsMatch && req.method === 'GET') return json(res, 200, { slots: service.slots(slotsMatch[1], url.searchParams.get('date') || '') });
    if (route === '/api/bookings' && req.method === 'GET') return json(res, 200, { bookings: service.listBookings(requireUser(req)) });
    if (route === '/api/bookings' && req.method === 'POST') return json(res, 201, { booking: service.createBooking(requireUser(req), await body(req)) });
    const bookingMatch = route.match(/^\/api\/bookings\/([^/]+)\/(cancel|reschedule)$/);
    if (bookingMatch && req.method === 'POST') {
      const user = requireUser(req);
      const booking = bookingMatch[2] === 'cancel' ? service.cancelBooking(user, bookingMatch[1]) : (() => null)();
      if (booking) return json(res, 200, { booking });
      const data = await body(req);
      return json(res, 200, { booking: service.rescheduleBooking(user, bookingMatch[1], data.date, data.time) });
    }
    if (route === '/api/assistant' && req.method === 'POST') {
      requireUser(req);
      const data = await body(req);
      return json(res, 200, await assist(data.message, data.context));
    }
    if (route === '/api/admin/overview' && req.method === 'GET') {
      requireAdmin(req);
      const bookings = service.listBookings({ role: 'admin' });
      return json(res, 200, { bookings, residents: db.prepare("SELECT COUNT(*) AS n FROM users WHERE role = 'resident'").get().n, centres: service.listCentres().length, audit: db.prepare('SELECT action, subject_id, created_at FROM audit ORDER BY created_at DESC LIMIT 10').all() });
    }
    const centreMatch = route.match(/^\/api\/admin\/centres\/([^/]+)$/);
    if (centreMatch && req.method === 'PATCH') return json(res, 200, { centre: service.updateCentre(requireAdmin(req), centreMatch[1], await body(req)) });
    const ruleMatch = route.match(/^\/api\/admin\/centres\/([^/]+)\/rules\/([^/]+)$/);
    if (ruleMatch && req.method === 'PATCH') return json(res, 200, { rule: service.updateRule(requireAdmin(req), ruleMatch[1], ruleMatch[2], await body(req)) });
    if (route.startsWith('/api/')) return json(res, 404, { error: 'Endpoint not found' });
    if (req.method === 'GET') return serveStatic(req, res, route);
    return json(res, 405, { error: 'Method not allowed' });
  } catch (error) {
    if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') return json(res, 409, { error: 'This record already exists' });
    if (!(error instanceof service.AppError)) console.error(error);
    return json(res, error.status || 500, { error: error.status ? error.message : 'Something went wrong. Please try again.' });
  }
}
const server = http.createServer(handle);
if (require.main === module) server.listen(port, () => console.log(`Circular Visit API running on http://localhost:${port}`));
module.exports = { server, handle };
