# Circular Visit

Circular Visit is a household waste recycling appointment application. Residents can check which demonstration centres accept their items, see current slots, book a visit, and manage it afterwards. The booking assistant turns a natural-language request into suggested centres and slots. An operator workspace shows bookings and lets administrators adjust capacity and accepted waste.

## Run locally

Requires Node.js 26. The local database uses Node's built-in `node:sqlite` module.

```sh
npm install
copy .env.example .env
npm run dev
```

Open `http://localhost:3000`. The React development server proxies `/api` to the Node service on port 9000. To serve the production build from one process:

```sh
npm run build
npm run server
```

Then open `http://localhost:9000`.

If Docker is available, `docker compose up --build` serves the same production build on port 9000 with a persistent SQLite volume. Docker is not installed in the current workspace, so this path has not been run here.

### Configuration

Set `ADMIN_EMAIL` and `ADMIN_PASSWORD` in `.env` before first server start to create an operator account. Public registration creates resident accounts only. Set `ENABLE_OPENAI=true` and `OPENAI_API_KEY` to enable LLM extraction of waste, date, time preference and location in the assistant; `OPENAI_MODEL` defaults to `gpt-4.1-mini`. The service uses the [OpenAI Responses API structured output format](https://platform.openai.com/docs/api-reference/responses) and falls back to guided keyword extraction if the key or API is unavailable. Keys stay on the server. `DATABASE_PATH` can override the SQLite file, which defaults to `server/data/circular-visit.sqlite`.

The UI clearly labels the three seeded centres as demonstration data. Their names, addresses, postcode area, waste rules and slots are **not live council information**. Demo booking eligibility is restricted to `RV1`–`RV3` postcodes. A real deployment needs approved centres, verified policies, geographic eligibility rules and a council booking adapter or authority to operate its own booking inventory.

## Current workflows

- Resident registration and sign in; password hashing with scrypt and expiring server sessions.
- Centre search and filtering by waste category.
- Centre rules, opening days, 30 minute slots and capacity checks.
- Resident booking, confirmation, history, cancellation and rescheduling.
- Server-side validation of waste acceptance, postcode, vehicle and slot; immediate transaction prevents overbooking.
- Guided assistant that collects missing information and proposes actual open slots. LLM interpretation is optional; the LLM cannot write a booking or invent availability.
- Administrator overview, audit activity, slot capacity and accepted-waste controls.

The React client lives in `src/App.js`; the Node API, SQLite schema, booking logic and assistant live in `server/`. The older pathology UI files remain in the repository for reference but are no longer imported by the active app.

## Verify

```sh
npm run test:server
npm run build
```

The server test exercises registration, waste and area policy rejection, booking ownership, duplicate and capacity protection, cancellation, administrator visibility and assistant suggestions.

## Before a real launch

This is a working product prototype, not a live council service. A launch needs verified centre data and policy ownership, real availability and booking integrations, transactional email/SMS providers for confirmations and reminders, privacy and accessibility review, operational monitoring, backups, and production hosting. The shared concept’s 92% completion, 37% invalid-action reduction and 34% latency reduction are not supported by this repository; establish an evaluation set and baseline before reporting metrics.
