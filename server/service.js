const { randomUUID } = require('node:crypto');
const { db, now, audit } = require('./db');

class AppError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}
const datePattern = /^\d{4}-\d{2}-\d{2}$/;
const timePattern = /^\d{2}:\d{2}$/;
const postcodePattern = /^[A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2}$/i;
const bookingFields = 'b.*, c.name AS centre_name, c.address AS centre_address, c.postcode AS centre_postcode, u.name AS resident_name, u.email AS resident_email';

function listCentres() {
  return db.prepare('SELECT * FROM centres WHERE active = 1 ORDER BY name').all().map(c => ({ ...c, categories: db.prepare('SELECT category_id, accepted, note FROM centre_rules WHERE centre_id = ?').all(c.id) }));
}
function listCategories() { return db.prepare('SELECT * FROM categories ORDER BY name').all(); }
function centreFor(id) {
  const centre = db.prepare('SELECT * FROM centres WHERE id = ? AND active = 1').get(id);
  if (!centre) throw new AppError(404, 'Centre not found');
  return centre;
}
function acceptedRules(centreId, items) {
  if (!Array.isArray(items) || !items.length || items.length > 12) throw new AppError(400, 'Choose at least one waste item');
  const ids = [...new Set(items.map(x => typeof x === 'string' ? x : x.categoryId))];
  for (const id of ids) {
    const rule = db.prepare('SELECT accepted, note FROM centre_rules WHERE centre_id = ? AND category_id = ?').get(centreId, id);
    if (!rule) throw new AppError(400, `Unknown waste category: ${id}`);
    if (!rule.accepted) throw new AppError(400, `${db.prepare('SELECT name FROM categories WHERE id = ?').get(id).name} is not accepted at this centre`);
  }
  return ids.map(id => ({ categoryId: id, quantity: 1 }));
}
function assertDate(date) {
  const parsed = datePattern.test(date || '') ? new Date(`${date}T12:00:00Z`) : null;
  if (!parsed || Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== date) throw new AppError(400, 'Choose a valid date');
  const ukDate = value => new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/London', year: 'numeric', month: '2-digit', day: '2-digit' }).format(value);
  const today = ukDate(new Date());
  const latest = ukDate(new Date(Date.now() + 30 * 86400000));
  if (date < today || date > latest) throw new AppError(400, 'Bookings are available for the next 30 days');
}
function opening(centre, date) {
  const day = new Date(`${date}T12:00:00Z`).getUTCDay();
  if (centre.id === 'north' && day === 0) return null;
  if (centre.id === 'south' && day === 1) return null;
  if (centre.id === 'riverside') return [9 * 60, 18 * 60];
  if (centre.id === 'south') return [8 * 60 + 30, 16 * 60 + 30];
  return [8 * 60, 17 * 60];
}
function slots(centreId, date) {
  assertDate(date);
  const centre = centreFor(centreId);
  const window = opening(centre, date);
  if (!window) return [];
  const counts = new Map(db.prepare("SELECT time, COUNT(*) AS count FROM bookings WHERE centre_id = ? AND date = ? AND status = 'confirmed' GROUP BY time").all(centreId, date).map(r => [r.time, r.count]));
  const result = [];
  for (let minute = window[0]; minute < window[1]; minute += 30) {
    const time = `${String(Math.floor(minute / 60)).padStart(2, '0')}:${String(minute % 60).padStart(2, '0')}`;
    const remaining = Math.max(0, centre.slot_capacity - (counts.get(time) || 0));
    const ukNow = new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/London', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(new Date());
    const todayUk = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/London', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
    const future = date > todayUk || (date === todayUk && time > ukNow);
    result.push({ time, remaining: future ? remaining : 0, available: future && remaining > 0 });
  }
  return result;
}
function hydrateBooking(row) { return row ? { ...row, items: JSON.parse(row.items_json) } : null; }
function getBooking(id) { return hydrateBooking(db.prepare(`SELECT ${bookingFields} FROM bookings b JOIN centres c ON c.id = b.centre_id JOIN users u ON u.id = b.user_id WHERE b.id = ?`).get(id)); }
function listBookings(user) {
  const base = `SELECT ${bookingFields} FROM bookings b JOIN centres c ON c.id = b.centre_id JOIN users u ON u.id = b.user_id`;
  return (user.role === 'admin' ? db.prepare(`${base} ORDER BY b.date DESC, b.time DESC`).all() : db.prepare(`${base} WHERE b.user_id = ? ORDER BY b.date DESC, b.time DESC`).all(user.id)).map(hydrateBooking);
}
function reference() { return `CV-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 5).toUpperCase()}`; }
function validateBooking(input) {
  const centre = centreFor(input.centreId);
  assertDate(input.date);
  if (!timePattern.test(input.time || '')) throw new AppError(400, 'Choose a valid time');
  const items = acceptedRules(centre.id, input.items);
  if (!String(input.vehicle || '').trim()) throw new AppError(400, 'Select your vehicle type');
  if (!postcodePattern.test(String(input.postcode || '').trim())) throw new AppError(400, 'Enter a valid UK postcode');
  if (!/^RV[1-3]\s*\d[A-Z]{2}$/i.test(String(input.postcode || '').trim())) throw new AppError(400, 'Demo bookings are limited to the RV1–RV3 service area');
  const allowedVehicles = centre.id === 'riverside' ? ['Car', 'Small van', 'Van', 'Vehicle with trailer', 'On foot / bicycle'] : centre.id === 'north' ? ['Car', 'Small van', 'On foot / bicycle'] : ['Car', 'On foot / bicycle'];
  if (!allowedVehicles.includes(input.vehicle)) throw new AppError(400, 'This centre cannot accept the selected vehicle type');
  if (String(input.notes || '').length > 500) throw new AppError(400, 'Notes must be under 500 characters');
  if (!slots(centre.id, input.date).find(s => s.time === input.time && s.available)) throw new AppError(409, 'This slot is no longer available');
  return { centre, items };
}
function createBooking(user, input) {
  db.exec('BEGIN IMMEDIATE');
  try {
    const { items } = validateBooking(input);
    if (db.prepare("SELECT id FROM bookings WHERE user_id = ? AND centre_id = ? AND date = ? AND time = ? AND status = 'confirmed'").get(user.id, input.centreId, input.date, input.time)) throw new AppError(409, 'You already have a booking at this centre and time');
    const id = randomUUID();
    const timestamp = now();
    db.prepare('INSERT INTO bookings VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)').run(id, reference(), user.id, input.centreId, input.date, input.time, JSON.stringify(items), String(input.vehicle).trim(), String(input.postcode).trim().toUpperCase(), String(input.notes || '').trim(), 'confirmed', timestamp, timestamp);
    audit(user.id, 'booking.created', id, { centreId: input.centreId, date: input.date, time: input.time });
    db.exec('COMMIT');
    return getBooking(id);
  } catch (error) { db.exec('ROLLBACK'); throw error; }
}
function cancelBooking(user, id) {
  const booking = getBooking(id);
  if (!booking) throw new AppError(404, 'Booking not found');
  if (user.role !== 'admin' && booking.user_id !== user.id) throw new AppError(403, 'You cannot change this booking');
  if (booking.status !== 'confirmed') throw new AppError(400, 'This booking is already closed');
  db.prepare("UPDATE bookings SET status = 'cancelled', updated_at = ? WHERE id = ?").run(now(), id);
  audit(user.id, 'booking.cancelled', id);
  return getBooking(id);
}
function rescheduleBooking(user, id, date, time) {
  db.exec('BEGIN IMMEDIATE');
  try {
    const booking = getBooking(id);
    if (!booking) throw new AppError(404, 'Booking not found');
    if (user.role !== 'admin' && booking.user_id !== user.id) throw new AppError(403, 'You cannot change this booking');
    if (booking.status !== 'confirmed') throw new AppError(400, 'This booking is already closed');
    if (booking.date === date && booking.time === time) throw new AppError(400, 'Choose a different slot');
    assertDate(date);
    if (!timePattern.test(time || '') || !slots(booking.centre_id, date).find(s => s.time === time && s.available)) throw new AppError(409, 'This slot is no longer available');
    db.prepare('UPDATE bookings SET date = ?, time = ?, updated_at = ? WHERE id = ?').run(date, time, now(), id);
    audit(user.id, 'booking.rescheduled', id, { date, time });
    db.exec('COMMIT');
    return getBooking(id);
  } catch (error) { db.exec('ROLLBACK'); throw error; }
}
function updateCentre(user, id, input) {
  centreFor(id);
  const capacity = Number(input.slotCapacity);
  if (!Number.isInteger(capacity) || capacity < 1 || capacity > 50) throw new AppError(400, 'Capacity must be between 1 and 50');
  db.prepare('UPDATE centres SET slot_capacity = ? WHERE id = ?').run(capacity, id);
  audit(user.id, 'centre.updated', id, { slotCapacity: capacity });
  return centreFor(id);
}
function updateRule(user, centreId, categoryId, input) {
  centreFor(centreId);
  if (typeof input.accepted !== 'boolean' || String(input.note || '').length > 300) throw new AppError(400, 'Invalid rule');
  const result = db.prepare('UPDATE centre_rules SET accepted = ?, note = ? WHERE centre_id = ? AND category_id = ?').run(input.accepted ? 1 : 0, String(input.note || '').trim(), centreId, categoryId);
  if (!result.changes) throw new AppError(404, 'Rule not found');
  audit(user.id, 'rule.updated', `${centreId}:${categoryId}`, input);
  return { centreId, categoryId, ...input };
}
module.exports = { AppError, listCentres, listCategories, centreFor, acceptedRules, slots, getBooking, listBookings, createBooking, cancelBooking, rescheduleBooking, updateCentre, updateRule };
