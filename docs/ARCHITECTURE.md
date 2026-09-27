# Circular Visit architecture

## Request path

`React UI → Node HTTP API → SQLite`

The optional OpenAI call is used only to extract waste items, date, postcode and time preference from natural language. The server then looks up its own waste rules, centres and slots. A resident must review the proposed visit and submit the booking form. The model never writes a booking or supplies the confirmed reference.

`server/db.js` creates the schema and seeds three clearly fictional centres. `server/service.js` contains policy and booking operations. `server/assistant.js` handles guided extraction and centre suggestions. `server/index.js` exposes the HTTP API and serves the built React app. The frontend is in `src/App.js`, with styles in `src/App.css` and `src/AppMore.css`.

## Data and invariants

- Users are residents or administrators. Public signup always creates a resident. Passwords are salted and hashed with scrypt.
- Sessions use random bearer tokens. Only a SHA-256 hash of each token is stored in SQLite. Tokens expire after 30 days.
- Centre rules map waste categories to accepted or rejected status. The operator can change a rule or slot capacity. Each change is audited.
- Slots are derived from centre opening hours in 30 minute increments. Confirmed bookings consume capacity; cancelled bookings do not.
- Booking creation uses `BEGIN IMMEDIATE`, then rechecks policy and slot capacity before inserting. This prevents two requests from exceeding capacity on the single SQLite writer.
- A resident can read or change only their own bookings. Operators can read all bookings and update centre controls.
- Demo eligibility uses the fictional `RV1`–`RV3` service area and centre-specific vehicle lists. Replace these with official policy data before a live service.

## API summary

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/api/bootstrap` | Public centres, categories and rules |
| POST | `/api/auth/register` | Resident signup |
| POST | `/api/auth/login` | Sign in |
| POST | `/api/auth/logout` | Revoke session |
| GET | `/api/me` | Current user |
| GET | `/api/centres/:id/slots?date=YYYY-MM-DD` | Current slot capacity |
| GET/POST | `/api/bookings` | List own bookings / create booking |
| POST | `/api/bookings/:id/cancel` | Cancel booking |
| POST | `/api/bookings/:id/reschedule` | Move to another available slot |
| POST | `/api/assistant` | Extract request and suggest valid slots |
| GET | `/api/admin/overview` | Operator bookings, counts and audit |
| PATCH | `/api/admin/centres/:id` | Change slot capacity |
| PATCH | `/api/admin/centres/:id/rules/:categoryId` | Change accepted waste |

All protected routes require `Authorization: Bearer <token>`. Errors return JSON `{ "error": "message" }` with a meaningful HTTP status.

## Scope for a live council integration

An adapter should implement `find centres`, `fetch rules`, `check availability`, `create`, `cancel` and `reschedule` against the authorised council system. The local SQLite service provides the contract and a working demonstration; it is not a gateway into any real authority's booking inventory. Add policy source URLs, effective dates, vehicle and residency rules, and data ownership before exposing it to residents. Replace local SQLite with a managed transactional database if operating across multiple server instances. Add a delivery provider and consent flow before sending email or SMS reminders.

## Evaluation

`npm run test:server` checks the key backend invariants. `npm run eval` prints a small, explicit baseline for the guided keyword extractor. It does not score the OpenAI path or measure end-to-end agent performance. Keep future LLM evaluation fixtures separate and report sample size, baseline and exact success definition with any metric.
