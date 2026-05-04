# Project Overview

`massage` is a TypeScript/Node.js utility designed to poll Google Calendar appointment schedules for available slots. It mimics the internal RPC calls used by the Google Calendar web interface to identify booking opportunities, specifically tailored for finding massage sessions.

## Core Technologies
- **Runtime:** Node.js (ESM)
- **Language:** TypeScript
- **Dependencies:** `dotenv` for configuration, `fetch` for networking.

## Architecture
- **Entry Point (`src/index.ts`):** Initializes environment variables, loads configuration, and starts the polling loop.
- **Configuration (`src/config.ts`):** Manages environment variable validation and application settings.
- **Polling Logic (`src/poll.ts`):** Orchestrates a single poll cycle: executing the request, parsing the response, and logging results.
- **Request Builder (`src/request.ts`):** Constructs the complex headers and JSON-RPC bodies required to interact with Google's internal appointment services.
- **Slot Parser (`src/slots.ts`):** Extracts and formats human-readable time slots from the deeply nested RPC response arrays.

# Building and Running

## Installation
```bash
npm install
```

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

The application is configured via environment variables. See [.env.example](.env.example) for the full list of available variables, descriptions, and defaults.



# Development Conventions

- **Type Safety:** Strict TypeScript configuration (`strict: true`).
- **Module System:** Uses ECMAScript Modules (`"type": "module"`).
- **Network Interactions:** Mimics browser-like requests including specific user-agents and headers to avoid RPC rejection.
- **Error Handling:** Graceful handling of network failures and invalid response formats during polling.
