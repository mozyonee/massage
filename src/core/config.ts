import { buildHeaders, LIST_SLOTS_DEFAULT_URL } from "./http.js";
import type { BookingRequestFile } from "./types.js";

export type AppConfig = {
	file: BookingRequestFile;
	pollMs: number;
	scheduleId: string;
	displayTz: string;
	url: string;
	headers: Record<string, string>;
};

function numEnv(name: string, fallback: number): number {
	const v = process.env[name];
	if (v == null || v === "") return fallback;
	const n = Number(v);
	return Number.isFinite(n) && n > 0 ? n : fallback;
}

export function loadConfig(): AppConfig {
	const scheduleId = (process.env.BOOKING_SCHEDULE_ID ?? "").trim();
	if (!scheduleId) {
		throw new Error("Set BOOKING_SCHEDULE_ID in .env");
	}
	const displayTz = "Europe/Stockholm";
	const file: BookingRequestFile = {
		url: LIST_SLOTS_DEFAULT_URL,
		scheduleId,
		displayTimezone: displayTz,
	};
	const headers = buildHeaders(file);
	return {
		file,
		pollMs: numEnv("POLL_MS", 5_000),
		scheduleId,
		displayTz,
		url: LIST_SLOTS_DEFAULT_URL,
		headers,
	};
}
