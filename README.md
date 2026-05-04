# Project Overview

`massage` is a TypeScript/Node.js utility designed to poll Google Calendar appointment schedules for available slots. It mimics the internal RPC calls used by the Google Calendar web interface to identify booking opportunities, specifically tailored for finding massage sessions.

## Core Technologies
- **Runtime:** Node.js (ESM)
- **Language:** TypeScript
- **Dependencies:** `dotenv` for configuration, `fetch` for networking.

## Architecture

Layout is three layers: shared **core**, feature **polling**, and feature **booking**.

| Path | Responsibility |
|------|----------------|
| `src/index.ts` | Poller loop: each tick runs `pollOnce`. First successful tick only records the slot snapshot (no bookings). Later ticks compare to that snapshot; if `TEAM` in `booking/team.ts` is non-empty, **new** slots trigger up to `min(newSlots, TEAM.length)` `BookSlot` calls—earliest new times first, one assignee per slot via `pickTeamForSlots` and `bookNewSlotsForTeam`. |
| `src/core/env.ts` | Resolve project root (walk up to `package.json`) and load `.env` / `.env.local` so compiled output under `dist/` still finds config. |
| `src/core/types.ts` | `BookingRequestFile`, `SlotRow`, `ParsedSlot`, `slotKey`. |
| `src/core/functions.ts` | Shared helpers (e.g. `ts()` for log timestamps). |
| `src/core/config.ts` | Read `BOOKING_SCHEDULE_ID`, `POLL_MS`; display / list window use `Europe/Stockholm` in code. |
| `src/core/http.ts` | Browser-like defaults: `buildHeaders`, `buildListSlotsBody` (42-day window from start of “today” in the display zone via `Intl`), `parseBody`, `at`, `appointmentBookingRpcUrl`, default Calendar list-slots URL. |
| `src/polling/poll.ts` | `fetchPollPayload` + `pollOnce`: POST `ListAvailableSlots`, parse to `ParsedSlot[]`, log rows. |
| `src/polling/slots.ts` | Unwrap nested RPC arrays, `slotsToParsed` / `slotsToRows` for logs. |
| `src/booking/book.ts` | Booking RPCs: `GetAppointmentServiceDefinition` (context id + title), `buildBookSlotBody`, `bookSlot` (`BookSlot`). |
| `src/booking/team.ts` | `TEAM`, `pickTeamForSlots`, `pickBooker`, and `bookNewSlotsForTeam` (batch `BookSlot` for `npm start`; token from `recaptcha.ts` via Playwright on the schedule page). |

**Flows:** `polling` does not import `booking`; `index.ts` imports `booking/team.ts` for auto-book after polls. Shared RPC URL shaping lives in `core/http.ts` (`appointmentBookingRpcUrl`).

# Building and Running

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



# Development Conventions

- **Type Safety:** Strict TypeScript configuration (`strict: true`).
- **Module System:** Uses ECMAScript Modules (`"type": "module"`).
- **Network Interactions:** Mimics browser-like requests including specific user-agents and headers to avoid RPC rejection.
- **Error Handling:** Graceful handling of network failures and invalid response formats during polling.
