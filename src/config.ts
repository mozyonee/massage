import { buildHeaders, LIST_SLOTS_DEFAULT_URL } from "./request.js";
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

function strEnv(name: string, fallback: string): string {
	return process.env[name]?.trim() || fallback;
}

function optionalEnv(name: string): string | undefined {
	const v = process.env[name]?.trim();
	return v || undefined;
}

export function loadConfig(): AppConfig {
	const url = process.env.BOOKING_URL?.trim() || LIST_SLOTS_DEFAULT_URL;
	const scheduleId = strEnv("BOOKING_SCHEDULE_ID", "");
	const slotsArrayPath = process.env.BOOKING_SLOTS_ARRAY_PATH;
	const file: BookingRequestFile = {
		url,
		method: optionalEnv("BOOKING_METHOD"),
		bodyFile: optionalEnv("BOOKING_BODY_FILE"),
		slotsArrayPath: slotsArrayPath !== undefined ? slotsArrayPath : "",
		scheduleId: scheduleId || undefined,
		displayTimezone: strEnv("BOOKING_TZ", "Europe/Stockholm"),
	};
	if (!scheduleId) {
		throw new Error("Set BOOKING_SCHEDULE_ID in .env");
	}
	const headers = buildHeaders(file);
	return {
		file,
		pollMs: numEnv("POLL_MS", 5_000),
		scheduleId,
		displayTz: strEnv("BOOKING_TZ", file.displayTimezone || "Europe/Stockholm"),
		url,
		headers,
	};
}
