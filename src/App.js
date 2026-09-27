import React, { useCallback, useEffect, useState } from 'react';
import { ArrowRight, ArrowUpRight, CalendarDays, Check, CheckCircle2, ChevronRight, Clock3, LogOut, MapPin, Menu, MessageCircle, Package, Recycle, Search, Send, ShieldCheck, Sparkles, Truck, UserRound, Users, X } from 'lucide-react';
import './App.css';
import './AppMore.css';
const tokenKey = 'circular_visit_token';
async function api(path, options = {}) {
  const token = localStorage.getItem(tokenKey);
  const response = await fetch(`/api${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? {
        Authorization: `Bearer ${token}`
      } : {}),
      ...options.headers
    }
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || 'Something went wrong');
  return data;
}
const tomorrow = () => {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().slice(0, 10);
};
const maxDate = () => {
  const d = new Date();
  d.setDate(d.getDate() + 30);
  return d.toISOString().slice(0, 10);
};
const niceDate = date => date ? new Date(`${date}T12:00:00`).toLocaleDateString('en-GB', {
  weekday: 'short',
  day: 'numeric',
  month: 'short',
  year: 'numeric'
}) : '';
const canTake = (centre, items) => centre && items.every(id => centre.categories.some(rule => rule.category_id === id && rule.accepted));
function AuthModal({
  close,
  signedIn
}) {
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const data = await api(`/auth/${mode}`, {
        method: 'POST',
        body: JSON.stringify(form)
      });
      localStorage.setItem(tokenKey, data.token);
      signedIn(data.user);
      close();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }
  return <div className="modal-backdrop" onMouseDown={close}><div className="auth-modal" role="dialog" aria-modal="true" onMouseDown={e => e.stopPropagation()}><button className="icon-button modal-close" onClick={close} aria-label="Close"><X size={19} /></button><span className="eyebrow">YOUR CIRCULAR VISIT ACCOUNT</span><h2>{mode === 'login' ? 'Welcome back.' : 'Let’s get started.'}</h2><p className="muted">{mode === 'login' ? 'Sign in to manage your visits.' : 'Create an account to book and manage visits.'}</p><form onSubmit={submit} className="auth-form">{mode === 'register' && <label>Full name<input required autoComplete="name" placeholder="Your name" value={form.name} onChange={e => setForm({
            ...form,
            name: e.target.value
          })} /></label>}<label>Email address<input required type="email" autoComplete="email" placeholder="you@example.com" value={form.email} onChange={e => setForm({
            ...form,
            email: e.target.value
          })} /></label><label>Password<input required type="password" minLength={mode === 'register' ? 8 : undefined} autoComplete={mode === 'register' ? 'new-password' : 'current-password'} placeholder={mode === 'register' ? 'At least 8 characters' : 'Your password'} value={form.password} onChange={e => setForm({
            ...form,
            password: e.target.value
          })} /></label>{error && <div className="notice error">{error}</div>}<button className="button primary full" disabled={busy}>{busy ? 'Please wait…' : mode === 'login' ? 'Sign in' : 'Create account'} <ArrowRight size={17} /></button></form><p className="switch-auth">{mode === 'login' ? 'New here?' : 'Already registered?'} <button onClick={() => {
          setMode(mode === 'login' ? 'register' : 'login');
          setError('');
        }}>{mode === 'login' ? 'Create an account' : 'Sign in'}</button></p></div></div>;
}
function Header({
  page,
  navigate,
  user,
  signIn,
  logout
}) {
  const [menu, setMenu] = useState(false);
  const links = user?.role === 'admin' ? [['admin', 'Overview'], ['centres', 'Centres']] : [['home', 'Home'], ['centres', 'Find a centre'], ['book', 'Book a visit'], ['assistant', 'Ask the assistant'], ...(user ? [['visits', 'My visits']] : [])];
  return <header className="site-header"><div className="header-inner"><button className="brand" onClick={() => navigate(user?.role === 'admin' ? 'admin' : 'home')}><span className="brand-mark"><Recycle size={22} /></span><span>Circular<span className="brand-light">Visit</span><small>RECYCLING MADE SIMPLE</small></span></button><nav className={menu ? 'navigation open' : 'navigation'}>{links.map(([id, label]) => <button key={id} className={page === id ? 'nav-active' : ''} onClick={() => {
          navigate(id);
          setMenu(false);
        }}>{label}</button>)}</nav><div className="header-actions">{user ? <><span className="user-pill"><UserRound size={16} />{user.name.split(' ')[0]}</span><button className="icon-button" onClick={logout} aria-label="Sign out"><LogOut size={18} /></button></> : <button className="button header-signin" onClick={signIn}>Sign in <ArrowRight size={16} /></button>}<button className="icon-button mobile-menu" onClick={() => setMenu(!menu)} aria-label="Toggle menu">{menu ? <X size={21} /> : <Menu size={21} />}</button></div></div></header>;
}
function Home({
  centres,
  categories,
  navigate,
  book
}) {
  return <><section className="hero"><div className="hero-copy"><div className="hero-kicker"><span className="live-dot" /> A smarter way to recycle</div><h1>Your next recycling visit, <em>sorted.</em></h1><p>Tell us what you need to bring. We’ll help you find the right centre, understand the rules and book a time that works.</p><div className="hero-actions"><button className="button lime" onClick={() => navigate('assistant')}><Sparkles size={18} /> Plan with the assistant <ArrowRight size={18} /></button><button className="button outline-light" onClick={() => book()}>Book manually <ArrowUpRight size={18} /></button></div><div className="hero-proof"><span><CheckCircle2 size={16} /> Clear waste guidance</span><span><CheckCircle2 size={16} /> Live demo slots</span></div></div><div className="hero-art" aria-hidden="true"><div className="orbit orbit-one" /><div className="orbit orbit-two" /><div className="hero-center"><Recycle size={82} strokeWidth={1.4} /></div><div className="floating-card card-one"><span className="float-icon"><Package size={20} /></span><div><strong>Know what goes where</strong><small>Guidance for each centre</small></div><Check size={17} /></div><div className="floating-card card-two"><span className="float-icon"><CalendarDays size={20} /></span><div><strong>Saturday · 10:00 AM</strong><small>Your visit, neatly planned</small></div><Check size={17} /></div></div></section><section className="stats-strip"><div><strong>3</strong><span>demo centres</span></div><div><strong>{categories.length}</strong><span>waste categories</span></div><div><strong>30 days</strong><span>advance booking</span></div><div className="strip-note"><ShieldCheck size={25} /><span>Rules and slots checked by the booking service</span></div></section><section className="section-wrap"><div className="section-heading"><div><span className="eyebrow">HOW IT WORKS</span><h2>One visit. Three simple steps.</h2></div><p>Everything you need to plan a smooth trip, in one place.</p></div><div className="step-grid">{[[Package, 'Tell us what you have', 'Describe your household waste or select items from the list.'], [MapPin, 'Find the right centre', 'See centres that accept your items, with rules shown up front.'], [CalendarDays, 'Choose a time', 'Pick an available slot and keep your booking in your account.']].map(([Icon, title, text], i) => <div className="step-card" key={title}><span className="step-num">0{i + 1}</span><span className={`step-icon step-${i}`}><Icon size={27} /></span><h3>{title}</h3><p>{text}</p></div>)}</div></section><section className="section-wrap featured"><div className="section-heading"><div><span className="eyebrow">EXPLORE LOCALLY</span><h2>Find your recycling centre.</h2></div><button className="text-link" onClick={() => navigate('centres')}>View all centres <ArrowRight size={17} /></button></div><div className="centre-preview-grid">{centres.map((c, i) => <div className={`preview-card preview-${i}`} key={c.id}><div className="preview-top"><span className="centre-graphic"><Recycle size={30} /></span><span className="demo-tag">DEMO CENTRE</span></div><div><span className="area-label"><MapPin size={14} />{c.area}</span><h3>{c.name}</h3><p>{c.description}</p></div><div className="preview-bottom"><span><Clock3 size={15} />{c.hours}</span><button onClick={() => book(c.id)} aria-label={`Book ${c.name}`}><ArrowUpRight size={19} /></button></div></div>)}</div></section><section className="cta-band"><div><span className="eyebrow">READY WHEN YOU ARE</span><h2>Less guessing. More recycling.</h2><p>Start with a quick conversation or build your visit step by step.</p></div><button className="button lime" onClick={() => book()}>Book a visit <ArrowRight size={18} /></button></section></>;
}
function Centres({
  centres,
  categories,
  book
}) {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const filtered = centres.filter(c => (!category || canTake(c, [category])) && `${c.name} ${c.area} ${c.postcode}`.toLowerCase().includes(search.toLowerCase()));
  return <main className="page-shell"><div className="page-title"><span className="eyebrow">DISCOVER A CENTRE</span><h1>Find a place for your items.</h1><p>Explore our demonstration centres and check which household materials they accept.</p></div><div className="filter-bar"><div className="search-field"><Search size={18} /><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search centre, area or postcode" /></div><select value={category} onChange={e => setCategory(e.target.value)} aria-label="Filter by waste type"><option value="">All waste types</option>{categories.map(c => <option value={c.id} key={c.id}>{c.name}</option>)}</select></div><div className="directory-grid">{filtered.map((c, i) => <article className="directory-card" key={c.id}><div className={`directory-illustration illustration-${i}`}><Recycle size={56} strokeWidth={1.4} /></div><div className="directory-content"><div className="directory-heading"><div><span className="area-label"><MapPin size={14} />{c.area}</span><h2>{c.name}</h2></div><span className="demo-tag">DEMO</span></div><p>{c.description}</p><div className="info-line"><MapPin size={16} />{c.address}, {c.postcode}</div><div className="info-line"><Clock3 size={16} />{c.hours}</div><div className="accepted-list"><strong>ACCEPTS</strong><div>{categories.filter(cat => canTake(c, [cat.id])).slice(0, 6).map(cat => <span key={cat.id}>{cat.name}</span>)}</div></div><button className="button primary full" onClick={() => book(c.id)}>Book this centre <ArrowRight size={16} /></button></div></article>)}</div>{!filtered.length && <div className="empty-state"><Search size={30} /><h3>No matching centres</h3><p>Try another search or waste category.</p></div>}<div className="notice info"><ShieldCheck size={18} /> Centre names, addresses and rules are demonstration data. Check with your local council before making a real journey.</div></main>;
}
function Booking({
  centres,
  categories,
  user,
  prefill,
  signIn,
  booked
}) {
  const [form, setForm] = useState({
    centreId: prefill?.centreId || '',
    items: prefill?.items || [],
    date: prefill?.date || tomorrow(),
    time: prefill?.time || '',
    vehicle: '',
    postcode: prefill?.postcode || '',
    notes: ''
  });
  const [slots, setSlots] = useState([]);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    if (prefill) setForm(f => ({
      ...f,
      ...prefill,
      items: prefill.items || f.items
    }));
  }, [prefill]);
  useEffect(() => {
    if (!form.centreId || !form.date) return setSlots([]);
    let active = true;
    api(`/centres/${form.centreId}/slots?date=${form.date}`).then(d => {
      if (active) setSlots(d.slots);
    }).catch(e => {
      if (active) {
        setSlots([]);
        setError(e.message);
      }
    });
    return () => {
      active = false;
    };
  }, [form.centreId, form.date]);
  const eligible = centres.filter(c => canTake(c, form.items));
  const selected = centres.find(c => c.id === form.centreId);
  const vehicleOptions = selected?.id === 'riverside' ? ['Car', 'Small van', 'Van', 'Vehicle with trailer', 'On foot / bicycle'] : selected?.id === 'north' ? ['Car', 'Small van', 'On foot / bicycle'] : ['Car', 'On foot / bicycle'];
  function toggleItem(id) {
    setForm(f => {
      const items = f.items.includes(id) ? f.items.filter(x => x !== id) : [...f.items, id];
      return {
        ...f,
        items,
        centreId: f.centreId && canTake(centres.find(c => c.id === f.centreId), items) ? f.centreId : '',
        time: ''
      };
    });
  }
  async function submit(e) {
    e.preventDefault();
    setError('');
    if (!user) return signIn();
    setBusy(true);
    try {
      const result = await api('/bookings', {
        method: 'POST',
        body: JSON.stringify(form)
      });
      booked(result.booking);
    } catch (err) {
      setError(err.message);
      if (/slot/i.test(err.message)) setForm(f => ({
        ...f,
        time: ''
      }));
    } finally {
      setBusy(false);
    }
  }
  return <main className="page-shell booking-page"><div className="page-title"><span className="eyebrow">PLAN YOUR VISIT</span><h1>Book a recycling visit.</h1><p>A few simple details, and you’re on your way.</p></div><div className="booking-layout"><form className="booking-form" onSubmit={submit}><section className="form-section"><div className="form-section-head"><span>01</span><div><h2>What are you bringing?</h2><p>Select every household waste type in your load.</p></div></div><div className="waste-grid">{categories.map(c => <button type="button" key={c.id} className={`waste-chip ${form.items.includes(c.id) ? 'selected' : ''}`} onClick={() => toggleItem(c.id)}><span>{form.items.includes(c.id) ? <Check size={16} /> : <Package size={16} />}</span>{c.name}</button>)}</div></section><section className="form-section"><div className="form-section-head"><span>02</span><div><h2>Choose a centre</h2><p>Only centres accepting your items are shown.</p></div></div><div className="centre-choice-grid">{eligible.map(c => <button type="button" key={c.id} className={`centre-choice ${form.centreId === c.id ? 'selected' : ''}`} onClick={() => setForm(f => ({
              ...f,
              centreId: c.id,
              time: '',
              vehicle: ''
            }))}><span className="radio-dot" /><strong>{c.name}</strong><small><MapPin size={13} />{c.area} · {c.postcode}</small></button>)}</div>{!eligible.length && <div className="notice warning">No demonstration centre accepts this combination. Consider separate visits.</div>}{selected && <div className="notice info"><ShieldCheck size={16} /> Accepted vehicles: {vehicleOptions.join(", ")}. {selected.categories.filter(rule => form.items.includes(rule.category_id) && rule.note).map(rule => rule.note).join(" ")}</div>}</section><section className="form-section"><div className="form-section-head"><span>03</span><div><h2>Pick a day and time</h2><p>Availability is checked against current capacity.</p></div></div><label className="field-label">Visit date<input type="date" min={new Date().toISOString().slice(0, 10)} max={maxDate()} value={form.date} onChange={e => setForm(f => ({
              ...f,
              date: e.target.value,
              time: ''
            }))} required /></label>{form.centreId && <><span className="field-label">Available slots</span><div className="slot-grid">{slots.filter(s => s.available).map(s => <button type="button" key={s.time} className={`slot ${form.time === s.time ? 'selected' : ''}`} onClick={() => setForm(f => ({
                ...f,
                time: s.time
              }))}>{s.time}<small>{s.remaining} left</small></button>)}</div>{slots.length > 0 && !slots.some(s => s.available) && <div className="notice warning">No slots on this date. Choose another day.</div>}</>}</section><section className="form-section"><div className="form-section-head"><span>04</span><div><h2>Your visit details</h2><p>We’ll use these details to manage your booking.</p></div></div><div className="field-row"><label className="field-label">Vehicle type<select required value={form.vehicle} onChange={e => setForm(f => ({
                ...f,
                vehicle: e.target.value
              }))}><option value="">Select a vehicle</option>{vehicleOptions.map(vehicle => <option key={vehicle}>{vehicle}</option>)}</select></label><label className="field-label">Home postcode<input required value={form.postcode} onChange={e => setForm(f => ({
                ...f,
                postcode: e.target.value.toUpperCase()
              }))} placeholder="e.g. RV1 2AB" /></label></div><label className="field-label">Additional notes <span>(optional)</span><textarea maxLength={500} rows={3} value={form.notes} onChange={e => setForm(f => ({
              ...f,
              notes: e.target.value
            }))} placeholder="Anything useful for the centre to know" /></label></section>{error && <div className="notice error">{error}</div>}<button className="button primary submit-booking" disabled={busy || !form.items.length || !form.centreId || !form.time}>{busy ? 'Confirming…' : user ? 'Confirm booking' : 'Sign in to confirm'} <ArrowRight size={18} /></button></form><aside className="booking-aside"><div className="summary-card"><span className="eyebrow">YOUR VISIT AT A GLANCE</span><h3>Booking summary</h3>{[[Package, 'Items', form.items.length ? `${form.items.length} selected` : 'Not selected'], [MapPin, 'Centre', selected?.name || 'Not selected'], [CalendarDays, 'Date', niceDate(form.date)], [Clock3, 'Time', form.time || 'Not selected']].map(([Icon, label, value]) => <div className="summary-row" key={label}><span><Icon size={17} />{label}</span><strong>{value}</strong></div>)}<div className="summary-footer"><ShieldCheck size={20} /> Demo service area: RV1–RV3. Eligibility and availability are checked again when you confirm.</div></div><div className="aside-help"><Sparkles size={23} /><h3>Need a hand?</h3><p>The assistant can turn a simple description into a suggested visit.</p></div></aside></div></main>;
}
function Assistant({
  user,
  signIn,
  choose,
  aiConfigured
}) {
  const [messages, setMessages] = useState([{
    role: 'assistant',
    text: 'Hi! Tell me what household items you need to bring and when you’d like to visit. I’ll check centre rules and available slots.'
  }]);
  const [context, setContext] = useState({});
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  async function send(text) {
    if (!user) return signIn();
    if (!text.trim() || busy) return;
    setInput('');
    setError('');
    setMessages(m => [...m, {
      role: 'user',
      text
    }]);
    setBusy(true);
    try {
      const result = await api('/assistant', {
        method: 'POST',
        body: JSON.stringify({
          message: text,
          context
        })
      });
      setContext(result.state);
      setMessages(m => [...m, {
        role: 'assistant',
        text: result.message,
        options: result.centres,
        state: result.state
      }]);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  return <main className="page-shell assistant-page"><div className="page-title"><span className="eyebrow">YOUR BOOKING COMPANION</span><h1>Just tell us what’s in your load.</h1><p>Ask naturally. We’ll check the demonstration centre rules and current slots.</p></div><div className="assistant-layout"><div className="chat-panel"><div className="chat-top"><span className="assistant-avatar"><Sparkles size={21} /></span><div><strong>Circular Visit assistant</strong><small>{aiConfigured ? 'AI interpretation configured · booking data verified' : 'Guided mode · booking data verified'}</small></div><span className="online-dot" /></div><div className="chat-messages">{messages.map((m, i) => <div key={i} className={`message-row ${m.role}`}><div className="message-bubble">{m.text}</div>{m.options?.length > 0 && <div className="chat-options">{m.options.map(c => <div className="chat-option" key={c.id}><strong>{c.name}</strong><small><MapPin size={12} />{c.area} · {c.address}</small><div className="chat-slots">{c.slots.map(s => <button key={s.time} onClick={() => choose({
                    centreId: c.id,
                    items: m.state.items,
                    date: m.state.date,
                    time: s.time,
                    postcode: m.state.postcode || ''
                  })}>{s.time} <ArrowUpRight size={13} /></button>)}</div>{c.notes?.map((note, j) => <small className="policy-note" key={j}>{note}</small>)}</div>)}</div>}</div>)}{busy && <div className="message-row assistant"><div className="message-bubble">Checking centre rules and slots…</div></div>}</div><div className="chat-compose">{error && <div className="notice error">{error}</div>}<form onSubmit={e => {
            e.preventDefault();
            send(input);
          }}><input value={input} onChange={e => setInput(e.target.value)} placeholder="e.g. I have a sofa and boxes for Saturday" aria-label="Message the assistant" /><button disabled={busy || !input.trim()} aria-label="Send message"><Send size={18} /></button></form><small>The assistant suggests options. A booking is made only after you review and confirm it.</small></div></div><aside className="assistant-side"><div className="tip-card"><span className="tip-icon"><MessageCircle size={22} /></span><h3>Try asking…</h3>{['A sofa and cardboard this Saturday', 'Can I bring a fridge tomorrow?', 'Garden waste next Tuesday morning'].map(x => <button key={x} onClick={() => send(x)}>{x}<ArrowUpRight size={15} /></button>)}</div><div className="trust-card"><ShieldCheck size={26} /><h3>Answers you can trust</h3><p>Waste rules, open slots and booking confirmations come from the booking service. The assistant interprets your request.</p></div></aside></div></main>;
}
function Visits({
  user,
  book
}) {
  const [bookings, setBookings] = useState([]);
  const [error, setError] = useState('');
  const [reschedule, setReschedule] = useState(null);
  const [slots, setSlots] = useState([]);
  const [date, setDate] = useState(tomorrow());
  const [time, setTime] = useState('');
  const refresh = useCallback(() => api('/bookings').then(d => setBookings(d.bookings)).catch(e => setError(e.message)), []);
  useEffect(() => {
    refresh();
  }, [refresh]);
  useEffect(() => {
    if (reschedule) api(`/centres/${reschedule.centre_id}/slots?date=${date}`).then(d => setSlots(d.slots)).catch(e => setError(e.message));
  }, [reschedule, date]);
  async function cancel(id) {
    if (!window.confirm('Cancel this booking?')) return;
    try {
      await api(`/bookings/${id}/cancel`, {
        method: 'POST'
      });
      refresh();
    } catch (e) {
      setError(e.message);
    }
  }
  async function save() {
    try {
      await api(`/bookings/${reschedule.id}/reschedule`, {
        method: 'POST',
        body: JSON.stringify({
          date,
          time
        })
      });
      setReschedule(null);
      setTime('');
      refresh();
    } catch (e) {
      setError(e.message);
    }
  }
  return <main className="page-shell"><div className="page-title title-with-action"><div><span className="eyebrow">YOUR ACCOUNT</span><h1>My visits.</h1><p>Everything you need for your upcoming and past bookings.</p></div><button className="button primary" onClick={book}>New booking <ArrowRight size={17} /></button></div>{error && <div className="notice error">{error}</div>}{!bookings.length ? <div className="empty-state"><CalendarDays size={34} /><h3>No visits yet, {user.name.split(' ')[0]}.</h3><p>When you book a recycling visit, it will appear here.</p><button className="button primary" onClick={book}>Book your first visit <ArrowRight size={17} /></button></div> : <div className="visit-list">{bookings.map(b => <article className="visit-card" key={b.id}><div className="visit-date"><strong>{new Date(`${b.date}T12:00:00`).toLocaleDateString('en-GB', {
              day: '2-digit'
            })}</strong><span>{new Date(`${b.date}T12:00:00`).toLocaleDateString('en-GB', {
              month: 'short'
            }).toUpperCase()}</span></div><div className="visit-main"><div className="visit-meta"><span className={`status ${b.status}`}>{b.status}</span><span>{b.reference}</span></div><h3>{b.centre_name}</h3><p><Clock3 size={15} />{niceDate(b.date)} at {b.time}</p><p><MapPin size={15} />{b.centre_address}</p><p><Package size={15} />{b.items.length} waste {b.items.length === 1 ? 'type' : 'types'} · {b.vehicle}</p></div>{b.status === 'confirmed' && <div className="visit-actions"><button className="button subtle" onClick={() => {
            setReschedule(b);
            setDate(tomorrow());
            setTime('');
          }}>Reschedule</button><button className="button danger" onClick={() => cancel(b.id)}>Cancel</button></div>}</article>)}</div>}{reschedule && <div className="modal-backdrop" onMouseDown={() => setReschedule(null)}><div className="auth-modal" onMouseDown={e => e.stopPropagation()}><button className="icon-button modal-close" onClick={() => setReschedule(null)} aria-label="Close reschedule dialog"><X size={19} /></button><span className="eyebrow">CHANGE YOUR VISIT</span><h2>Choose a new time.</h2><p className="muted">{reschedule.centre_name} · {reschedule.reference}</p><label className="field-label">New date<input type="date" min={new Date().toISOString().slice(0, 10)} max={maxDate()} value={date} onChange={e => {
            setDate(e.target.value);
            setTime('');
          }} /></label><div className="slot-grid modal-slots">{slots.filter(s => s.available && !(date === reschedule.date && s.time === reschedule.time)).map(s => <button className={`slot ${time === s.time ? 'selected' : ''}`} key={s.time} onClick={() => setTime(s.time)}>{s.time}</button>)}</div>{!slots.some(s => s.available) && <div className="notice warning">No slots on this date.</div>}{error && <div className="notice error">{error}</div>}<button className="button primary full" disabled={!time} onClick={save}>Save new time <ArrowRight size={17} /></button></div></div>}</main>;
}
function Admin({
  centres,
  categories,
  refreshData,
  page
}) {
  const [data, setData] = useState({
    bookings: [],
    residents: 0,
    audit: []
  });
  const [error, setError] = useState('');
  const [selected, setSelected] = useState(centres[0]?.id || '');
  const refresh = useCallback(() => api('/admin/overview').then(setData).catch(e => setError(e.message)), []);
  useEffect(() => {
    refresh();
  }, [refresh]);
  useEffect(() => {
    if (!selected && centres.length) setSelected(centres[0].id);
  }, [selected, centres]);
  const current = centres.find(c => c.id === selected);
  async function capacity(value) {
    try {
      await api(`/admin/centres/${selected}`, {
        method: 'PATCH',
        body: JSON.stringify({
          slotCapacity: Number(value)
        })
      });
      refreshData();
    } catch (e) {
      setError(e.message);
    }
  }
  async function toggle(rule) {
    try {
      await api(`/admin/centres/${selected}/rules/${rule.category_id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          accepted: !rule.accepted,
          note: rule.note
        })
      });
      refreshData();
    } catch (e) {
      setError(e.message);
    }
  }
  return <main className="page-shell admin-page"><div className="page-title"><span className="eyebrow">OPERATIONS WORKSPACE</span><h1>{page === 'admin' ? 'Good overview, better decisions.' : 'Manage centre rules.'}</h1><p>Keep booking capacity and accepted waste in sync with your service.</p></div>{error && <div className="notice error">{error}</div>}{page === 'admin' ? <><div className="admin-stats"><div><CalendarDays size={24} /><strong>{data.bookings.filter(b => b.status === 'confirmed').length}</strong><span>Confirmed visits</span></div><div><Users size={24} /><strong>{data.residents}</strong><span>Resident accounts</span></div><div><MapPin size={24} /><strong>{centres.length}</strong><span>Active centres</span></div></div><div className="admin-table-card"><div className="table-title"><h2>All bookings</h2><span>{data.bookings.length} total</span></div><div className="table-scroll"><table><thead><tr><th>Reference</th><th>Resident</th><th>Centre</th><th>When</th><th>Status</th></tr></thead><tbody>{data.bookings.map(b => <tr key={b.id}><td><strong>{b.reference}</strong></td><td>{b.resident_name}<small>{b.resident_email}</small></td><td>{b.centre_name}</td><td>{niceDate(b.date)} · {b.time}</td><td><span className={`status ${b.status}`}>{b.status}</span></td></tr>)}</tbody></table>{!data.bookings.length && <div className="empty-table">No bookings yet.</div>}</div></div><div className="audit-card"><h2>Recent activity</h2>{data.audit.map((a, i) => <div key={i}><ShieldCheck size={16} /><span>{a.action.replace('.', ' · ')}</span><small>{new Date(a.created_at).toLocaleString('en-GB')}</small></div>)}</div></> : <div className="rules-layout"><aside className="centre-sidebar">{centres.map(c => <button key={c.id} className={selected === c.id ? 'selected' : ''} onClick={() => setSelected(c.id)}><MapPin size={17} />{c.name}<ChevronRight size={16} /></button>)}</aside>{current && <div className="rules-main"><span className="eyebrow">CENTRE SETTINGS</span><h2>{current.name}</h2><p>{current.address}</p><div className="capacity-control"><div><strong>Capacity per 30-minute slot</strong><p>Changes affect future availability immediately.</p></div><select value={current.slot_capacity} onChange={e => capacity(e.target.value)}>{Array.from({
              length: 20
            }, (_, i) => i + 1).map(n => <option key={n} value={n}>{n} visits</option>)}</select></div><h3>Accepted waste</h3><p className="muted">Toggle categories to update booking eligibility.</p><div className="rule-list">{categories.map(c => {
            const rule = current.categories.find(r => r.category_id === c.id);
            return <div key={c.id}><span className="rule-icon"><Package size={18} /></span><div><strong>{c.name}</strong><small>{rule?.note || c.description}</small></div><button className={`toggle ${rule?.accepted ? 'on' : ''}`} onClick={() => toggle(rule)} aria-label={`${rule?.accepted ? 'Disable' : 'Enable'} ${c.name}`} aria-pressed={Boolean(rule?.accepted)}><span /></button></div>;
          })}</div></div>}</div>}</main>;
}
function Success({
  booking,
  navigate,
  book
}) {
  return <main className="success-page"><div className="success-icon"><Check size={39} /></div><span className="eyebrow">BOOKING CONFIRMED</span><h1>You’re all set.</h1><p>Your visit is confirmed. You can find it in My visits whenever you need it.</p><div className="confirmation-card"><span>BOOKING REFERENCE</span><strong>{booking.reference}</strong><div><MapPin size={18} />{booking.centre_name}</div><div><CalendarDays size={18} />{niceDate(booking.date)} · {booking.time}</div><div><Truck size={18} />{booking.vehicle}</div></div><div className="success-actions"><button className="button primary" onClick={() => navigate('visits')}>View my visits <ArrowRight size={17} /></button><button className="button subtle" onClick={book}>Book another</button></div></main>;
}
function Footer({
  navigate
}) {
  return <footer className="site-footer"><div className="footer-inner"><div><div className="footer-brand"><Recycle size={23} /> CircularVisit</div><p>A simpler way to plan your next recycling visit.</p><small>Demonstration product. Centre data is illustrative.</small></div><div className="footer-links"><button onClick={() => navigate('centres')}>Find a centre</button><button onClick={() => navigate('book')}>Book a visit</button><button onClick={() => navigate('assistant')}>Ask the assistant</button></div></div><div className="footer-bottom">© {new Date().getFullYear()} Circular Visit <span>Made for a more circular tomorrow.</span></div></footer>;
}
export default function App() {
  const [page, setPage] = useState('home');
  const [data, setData] = useState({
    centres: [],
    categories: [],
    aiConfigured: false
  });
  const [user, setUser] = useState(null);
  const [authOpen, setAuthOpen] = useState(false);
  const [prefill, setPrefill] = useState(null);
  const [success, setSuccess] = useState(null);
  const [error, setError] = useState('');
  const refreshData = useCallback(() => api('/bootstrap').then(setData).catch(e => setError(`Could not connect to the booking service: ${e.message}`)), []);
  useEffect(() => {
    refreshData();
    if (localStorage.getItem(tokenKey)) api('/me').then(d => {
      setUser(d.user);
      if (d.user.role === 'admin') setPage('admin');
    }).catch(() => localStorage.removeItem(tokenKey));
  }, [refreshData]);
  const navigate = id => {
    setPage(id);
    setSuccess(null);
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };
  const book = (centreId = '') => {
    setPrefill({
      centreId,
      items: [],
      date: tomorrow(),
      time: ''
    });
    navigate('book');
  };
  const choose = value => {
    setPrefill(value);
    navigate('book');
  };
  async function logout() {
    await api('/auth/logout', {
      method: 'POST'
    }).catch(() => {});
    localStorage.removeItem(tokenKey);
    setUser(null);
    navigate('home');
  }
  let content;
  if (success) content = <Success booking={success} navigate={navigate} book={() => book()} />;else if (user?.role === 'admin') content = <Admin centres={data.centres} categories={data.categories} refreshData={refreshData} page={page === 'centres' ? 'centres' : 'admin'} />;else if (page === 'centres') content = <Centres centres={data.centres} categories={data.categories} book={book} />;else if (page === 'book') content = <Booking centres={data.centres} categories={data.categories} user={user} prefill={prefill} signIn={() => setAuthOpen(true)} booked={setSuccess} />;else if (page === 'assistant') content = <Assistant user={user} signIn={() => setAuthOpen(true)} choose={choose} aiConfigured={data.aiConfigured} />;else if (page === 'visits' && user) content = <Visits user={user} book={() => book()} />;else content = <Home centres={data.centres} categories={data.categories} navigate={navigate} book={book} />;
  return <div className="app"><Header page={page} navigate={navigate} user={user} signIn={() => setAuthOpen(true)} logout={logout} />{error && <div className="global-error notice error">{error} <button onClick={refreshData}>Retry</button></div>}{content}<Footer navigate={navigate} />{authOpen && <AuthModal close={() => setAuthOpen(false)} signedIn={setUser} />}</div>;
}
