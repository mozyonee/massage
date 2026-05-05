# Overview

`massage` is a TypeScript/Node.js utility designed to poll Google Calendar appointment schedules for available slots. It mimics the internal RPC calls used by the Google Calendar web interface to identify booking opportunities, specifically tailored for finding massage sessions.

## Technologies
- **Runtime:** Node.js (ESM)
- **Language:** TypeScript
- **Dependencies:** `dotenv` for configuration, `fetch` for networking.

## Structure

- **`src/index.ts`** — Entrypoint: poll loop, slot snapshot vs new slots, optional auto-book via booking when `TEAM` is set.
- **`src/core/`** — Env, config, types, shared HTTP/RPC helpers used by polling and booking.
- **`src/polling/`** — List available slots and parse responses for logging and comparison.
- **`src/booking/`** — Book slots, reCAPTCHA (Playwright), team roster and assignment in `team.ts`.

# Runtime

## Installation
```bash
npm install
npx playwright install chromium
```

With a non-empty `TEAM`, auto-booking needs Chromium once: `npx playwright install chromium`. reCAPTCHA tokens are produced by opening your schedule page in a headless browser (no extra env vars).

## Development
To compile the project and watch for changes:
```bash
npm run dev
```

## Production
To build and run the project:
```bash
npm run build
npm run start
```

# Configuration

Environment variables are minimal; see [.env.example](.env.example).

**Team:** Who can be auto-assigned to new slots is not configured via env. Edit the `TEAM` array in [`src/booking/team.ts`](src/booking/team.ts) (`TeamMember`: first name, last name, email).



# Conventions

- **Type Safety:** Strict TypeScript configuration (`strict: true`).
- **Module System:** Uses ECMAScript Modules (`"type": "module"`).
- **Network Interactions:** Mimics browser-like requests including specific user-agents and headers to avoid RPC rejection.
- **Error Handling:** Graceful handling of network failures and invalid response formats during polling.
