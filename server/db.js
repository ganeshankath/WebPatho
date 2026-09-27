const fs = require('node:fs');
const path = require('node:path');
const { DatabaseSync } = require('node:sqlite');
const { randomUUID, randomBytes, scryptSync, timingSafeEqual, createHash } = require('node:crypto');

const databasePath = process.env.DATABASE_PATH || path.join(__dirname, 'data', 'circular-visit.sqlite');
fs.mkdirSync(path.dirname(databasePath), { recursive: true });
const db = new DatabaseSync(databasePath);
db.exec('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;');
db.exec(`
  CREATE TABLE IF NOT EXISTS users (id TEXT PRIMARY KEY, name TEXT NOT NULL, email TEXT NOT NULL UNIQUE, password_hash TEXT NOT NULL, role TEXT NOT NULL DEFAULT 'resident', created_at TEXT NOT NULL);
  CREATE TABLE IF NOT EXISTS sessions (token_hash TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id), expires_at TEXT NOT NULL);
  CREATE TABLE IF NOT EXISTS centres (id TEXT PRIMARY KEY, name TEXT NOT NULL, area TEXT NOT NULL, address TEXT NOT NULL, postcode TEXT NOT NULL, description TEXT NOT NULL, hours TEXT NOT NULL, slot_capacity INTEGER NOT NULL DEFAULT 4, active INTEGER NOT NULL DEFAULT 1);
  CREATE TABLE IF NOT EXISTS categories (id TEXT PRIMARY KEY, name TEXT NOT NULL, icon TEXT NOT NULL, description TEXT NOT NULL);
  CREATE TABLE IF NOT EXISTS centre_rules (centre_id TEXT NOT NULL REFERENCES centres(id), category_id TEXT NOT NULL REFERENCES categories(id), accepted INTEGER NOT NULL, note TEXT NOT NULL DEFAULT '', PRIMARY KEY (centre_id, category_id));
  CREATE TABLE IF NOT EXISTS bookings (id TEXT PRIMARY KEY, reference TEXT NOT NULL UNIQUE, user_id TEXT NOT NULL REFERENCES users(id), centre_id TEXT NOT NULL REFERENCES centres(id), date TEXT NOT NULL, time TEXT NOT NULL, items_json TEXT NOT NULL, vehicle TEXT NOT NULL, postcode TEXT NOT NULL, notes TEXT NOT NULL DEFAULT '', status TEXT NOT NULL DEFAULT 'confirmed', created_at TEXT NOT NULL, updated_at TEXT NOT NULL);
  CREATE INDEX IF NOT EXISTS bookings_slot_idx ON bookings(centre_id, date, time, status);
  CREATE TABLE IF NOT EXISTS audit (id TEXT PRIMARY KEY, actor_id TEXT, action TEXT NOT NULL, subject_id TEXT, details TEXT NOT NULL, created_at TEXT NOT NULL);
`);

const categories = [
  ['general', 'General household waste', 'Trash2', 'Bagged non-recyclable household items'],
  ['cardboard', 'Cardboard & paper', 'Package', 'Flattened boxes, newspapers and paper'],
  ['garden', 'Garden waste', 'Leaf', 'Grass cuttings, branches and plants'],
  ['electrical', 'Small electricals', 'Plug', 'Microwaves, kettles and small appliances'],
  ['fridge', 'Fridges & freezers', 'Refrigerator', 'Domestic refrigeration appliances'],
  ['furniture', 'Furniture', 'Sofa', 'Sofas, tables and household furniture'],
  ['wood', 'Wood & timber', 'Trees', 'Untreated domestic wood and timber'],
  ['metal', 'Scrap metal', 'Wrench', 'Domestic metal items'],
  ['glass', 'Glass', 'Wine', 'Glass bottles, jars and panes'],
  ['batteries', 'Batteries', 'Battery', 'Household batteries only'],
  ['paint', 'Paint & chemicals', 'Paintbrush', 'Household paint and limited chemicals'],
];
const centres = [
  ['north', 'Northside Recycling Centre', 'Northside', '18 Quarry Lane, Northside', 'RV1 2AB', 'A convenient centre for everyday recycling and bulky household items.', 'Mon–Sat · 08:00–17:00', 4],
  ['riverside', 'Riverside Recycling Centre', 'Riverside', '42 Mill Road, Riverside', 'RV2 4CD', 'Extended facilities for electricals and special household waste.', 'Mon–Sun · 09:00–18:00', 5],
  ['south', 'Southfield Recycling Centre', 'Southfield', '7 Orchard Way, Southfield', 'RV3 6EF', 'Easy access for garden, furniture and routine recycling.', 'Tue–Sun · 08:30–16:30', 3],
];
const accepted = {
  north: ['general', 'cardboard', 'garden', 'electrical', 'furniture', 'wood', 'metal', 'glass', 'batteries'],
  riverside: categories.map(([id]) => id),
  south: ['general', 'cardboard', 'garden', 'furniture', 'wood', 'metal', 'glass'],
};

if (db.prepare('SELECT COUNT(*) AS n FROM centres').get().n === 0) {
  const insertCentre = db.prepare('INSERT INTO centres VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)');
  const insertCategory = db.prepare('INSERT INTO categories VALUES (?, ?, ?, ?)');
  const insertRule = db.prepare('INSERT INTO centre_rules VALUES (?, ?, ?, ?)');
  db.exec('BEGIN');
  try {
    for (const row of centres) insertCentre.run(...row);
    for (const row of categories) insertCategory.run(...row);
    for (const centre of centres) for (const [category] of categories) {
      const yes = accepted[centre[0]].includes(category);
      const note = category === 'fridge' && yes ? 'Please keep the appliance upright where possible.' : category === 'paint' && yes ? 'Bring paint in sealed original containers.' : '';
      insertRule.run(centre[0], category, yes ? 1 : 0, note);
    }
    db.exec('COMMIT');
  } catch (error) { db.exec('ROLLBACK'); throw error; }
}

const now = () => new Date().toISOString();
function hashPassword(password) {
  const salt = randomBytes(16).toString('hex');
  return `${salt}:${scryptSync(password, salt, 64).toString('hex')}`;
}
function verifyPassword(password, stored) {
  const [salt, hash] = stored.split(':');
  const actual = scryptSync(password, salt, 64);
  return timingSafeEqual(actual, Buffer.from(hash, 'hex'));
}
function createUser({ name, email, password, role = 'resident' }) {
  const id = randomUUID();
  db.prepare('INSERT INTO users VALUES (?, ?, ?, ?, ?, ?)').run(id, name.trim(), email.trim().toLowerCase(), hashPassword(password), role, now());
  return { id, name: name.trim(), email: email.trim().toLowerCase(), role };
}
if (process.env.ADMIN_EMAIL && process.env.ADMIN_PASSWORD && !db.prepare('SELECT id FROM users WHERE email = ?').get(process.env.ADMIN_EMAIL.toLowerCase())) {
  createUser({ name: 'Administrator', email: process.env.ADMIN_EMAIL, password: process.env.ADMIN_PASSWORD, role: 'admin' });
}
function createSession(userId) {
  const token = randomBytes(32).toString('hex');
  const hash = createHash('sha256').update(token).digest('hex');
  const expires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
  db.prepare('INSERT INTO sessions VALUES (?, ?, ?)').run(hash, userId, expires);
  return token;
}
function sessionUser(token) {
  if (!token) return null;
  const hash = createHash('sha256').update(token).digest('hex');
  return db.prepare(`SELECT u.id, u.name, u.email, u.role FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.token_hash = ? AND s.expires_at > ?`).get(hash, now()) || null;
}
function audit(actorId, action, subjectId, details = {}) {
  db.prepare('INSERT INTO audit VALUES (?, ?, ?, ?, ?, ?)').run(randomUUID(), actorId || null, action, subjectId || null, JSON.stringify(details), now());
}
module.exports = { db, now, hashPassword, verifyPassword, createUser, createSession, sessionUser, audit, categories, centres };
