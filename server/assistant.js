const { listCategories, listCentres, slots } = require('./service');

const aliases = {
  general: ['rubbish', 'trash', 'general waste', 'bin bags'],
  cardboard: ['cardboard', 'paper', 'boxes', 'newspaper'],
  garden: ['garden', 'branches', 'grass', 'leaves', 'plants'],
  electrical: ['electrical', 'microwave', 'kettle', 'toaster', 'appliance'],
  fridge: ['fridge', 'freezer', 'refrigerator'],
  furniture: ['sofa', 'couch', 'chair', 'table', 'furniture', 'mattress'],
  wood: ['wood', 'timber', 'planks'],
  metal: ['metal', 'scrap'],
  glass: ['glass', 'bottles', 'jars'],
  batteries: ['battery', 'batteries'],
  paint: ['paint', 'chemicals'],
};

function localDate(offset = 0) {
  const date = new Date(Date.now() + offset * 86400000);
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/London', year: 'numeric', month: '2-digit', day: '2-digit' }).format(date);
}
function parseDate(text) {
  const iso = text.match(/\b(20\d{2}-\d{2}-\d{2})\b/);
  if (iso) return iso[1];
  if (/\btomorrow\b/i.test(text)) return localDate(1);
  if (/\btoday\b/i.test(text)) return localDate();
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const found = days.find(day => new RegExp(`\\b${day}\\b`, 'i').test(text));
  if (!found) return null;
  const today = new Date(`${localDate()}T12:00:00Z`).getUTCDay();
  let delta = (days.indexOf(found) - today + 7) % 7;
  if (delta === 0 || /next\s+/i.test(text)) delta += 7;
  return localDate(delta);
}
function fallbackExtract(message) {
  const lower = message.toLowerCase();
  const items = Object.entries(aliases).filter(([, names]) => names.some(name => lower.includes(name))).map(([id]) => id);
  const postcode = message.match(/\b[A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2}\b/i)?.[0] || null;
  const area = ['northside', 'riverside', 'southfield'].find(x => lower.includes(x)) || null;
  const timeWindow = /\bmorning\b/.test(lower) ? 'morning' : /\bafternoon\b/.test(lower) ? 'afternoon' : /\bevening\b/.test(lower) ? 'evening' : null;
  return { items, date: parseDate(message), postcode, area, timeWindow };
}
async function llmExtract(message, context) {
  if (process.env.ENABLE_OPENAI !== 'true' || !process.env.OPENAI_API_KEY) return null;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 12000);
  try {
    const response = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST', signal: controller.signal,
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || 'gpt-4.1-mini', store: false,
        text: { format: { type: 'json_schema', name: 'visit_request', strict: true, schema: { type: 'object', additionalProperties: false, properties: {
          items: { type: 'array', items: { type: 'string', enum: Object.keys(aliases) } },
          date: { type: ['string', 'null'] }, postcode: { type: ['string', 'null'] }, area: { type: ['string', 'null'] }, timeWindow: { type: ['string', 'null'] },
        }, required: ['items', 'date', 'postcode', 'area', 'timeWindow'] } } },
        instructions: `Extract a UK household recycling visit request. Return ONLY a JSON object with keys items (array of category IDs), date (YYYY-MM-DD or null), postcode (string or null), area (northside/riverside/southfield or null), timeWindow (morning/afternoon/evening or null). Allowed category IDs: ${Object.keys(aliases).join(', ')}. Do not invent information. Today's UK date is ${localDate()}. Existing context: ${JSON.stringify(context)}.`,
        input: message,
      }),
    });
    if (!response.ok) return null;
    const data = await response.json();
    const text = data.output?.flatMap(item => item.content || []).filter(item => item.type === 'output_text').map(item => item.text).join('') || '';
    const result = JSON.parse(text.replace(/^```(?:json)?|```$/g, '').trim());
    return {
      items: Array.isArray(result.items) ? result.items.filter(id => aliases[id]) : [],
      date: /^20\d{2}-\d{2}-\d{2}$/.test(result.date || '') ? result.date : null,
      postcode: typeof result.postcode === 'string' ? result.postcode : null,
      area: ['northside', 'riverside', 'southfield'].includes(result.area) ? result.area : null,
      timeWindow: ['morning', 'afternoon', 'evening'].includes(result.timeWindow) ? result.timeWindow : null,
    };
  } catch { return null; } finally { clearTimeout(timer); }
}
async function assist(message, context = {}) {
  if (typeof message !== 'string' || !message.trim() || message.length > 1000) throw new Error('Write a request under 1,000 characters');
  const extracted = (await llmExtract(message, context)) || fallbackExtract(message);
  const categories = listCategories();
  const state = {
    items: [...new Set([...(Array.isArray(context.items) ? context.items.filter(id => aliases[id]) : []), ...extracted.items])],
    date: extracted.date || context.date || null,
    postcode: extracted.postcode || context.postcode || null,
    area: extracted.area || context.area || null,
    timeWindow: extracted.timeWindow || context.timeWindow || null,
  };
  if (!state.area && state.postcode) state.area = ({ RV1: 'northside', RV2: 'riverside', RV3: 'southfield' })[state.postcode.replace(/\s/g, '').slice(0, 3).toUpperCase()] || null;
  const itemNames = state.items.map(id => categories.find(c => c.id === id)?.name || id);
  const centres = listCentres().filter(c => state.items.every(id => c.categories.some(rule => rule.category_id === id && rule.accepted)));
  const mode = process.env.ENABLE_OPENAI === 'true' && process.env.OPENAI_API_KEY ? 'ai' : 'guided';
  if (!state.items.length) return { message: 'What household items would you like to bring? You can describe them naturally, for example “a sofa and cardboard”.', state, centres: [], mode };
  if (!centres.length) return { message: `I found ${itemNames.join(' and ')}, but none of the demonstration centres accepts that combination. Try separate visits or review the centre rules.`, state, centres: [], mode };
  if (!state.date) return { message: `I found ${itemNames.join(' and ')}. Which day would you like to visit? You can say “Saturday” or give a date.`, state, centres: [], mode };
  let options = [];
  try {
    options = centres.map(c => {
      const available = slots(c.id, state.date).filter(s => s.available && (!state.timeWindow || (state.timeWindow === 'morning' ? s.time < '12:00' : state.timeWindow === 'afternoon' ? s.time >= '12:00' && s.time < '17:00' : s.time >= '17:00')));
      return { id: c.id, name: c.name, area: c.area, address: c.address, slots: available.slice(0, 4), notes: c.categories.filter(rule => state.items.includes(rule.category_id) && rule.note).map(rule => rule.note) };
    }).filter(c => c.slots.length);
  } catch (error) { return { message: error.message, state, centres: [], mode }; }
  if (state.area) options.sort((a, b) => Number(b.area.toLowerCase() === state.area) - Number(a.area.toLowerCase() === state.area));
  return {
    message: options.length ? `For ${itemNames.join(' and ')} on ${state.date}, these centres have matching slots. Choose one to review and confirm your booking.` : `The matching centres have no available ${state.timeWindow || ''} slots on ${state.date}. Try another day or time.`,
    state, centres: options, mode,
  };
}
module.exports = { assist, fallbackExtract, parseDate };
