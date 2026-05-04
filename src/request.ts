import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import type { BookingRequestFile } from "./types.js";

export const LIST_SLOTS_DEFAULT_URL =
	"https://calendar-pa.clients6.google.com/$rpc/google.internal.calendar.v1.AppointmentBookingService/ListAvailableSlots?%24httpHeaders=X-Goog-Api-Key%3AAIzaSyA7GKm43l8WNxlLTjsldq9z9n80CL6KW4U%0D%0AContent-Type%3Aapplication%2Fjson%2Bprotobuf%0D%0AX-User-Agent%3Agrpc-web-javascript%2F0.1%0D%0A";

const LIST_SLOTS_DEFAULT_HEADERS: Record<string, string> = {
	"content-type": "application/x-www-form-urlencoded;charset=UTF-8",
	origin: "https://calendar.google.com",
	referer: "https://calendar.google.com/",
	"user-agent":
		"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
	accept: "*/*",
	"accept-language": "en-GB,en-US;q=0.9,en;q=0.8",
	"sec-fetch-dest": "empty",
	"sec-fetch-mode": "cors",
	"sec-fetch-site": "same-site",
	"x-browser-channel": "stable",
	"x-browser-copyright": "Copyright 2026 Google LLC. All Rights Reserved.",
	"x-browser-year": "2026",
};

const LIST_SLOTS_BODY_TEMPLATE: unknown[] = [
	null,
	null,
	null,
	null,
	[
		[1777161600],
		[1780790400],
	],
];

function defaultListSlotsBody(scheduleId: string): string {
	if (!scheduleId) {
		throw new Error("Set BOOKING_SCHEDULE_ID in .env");
	}
	const arr = structuredClone(LIST_SLOTS_BODY_TEMPLATE);
	if (!Array.isArray(arr) || arr.length < 3) {
		throw new Error("default list-slots body template is invalid");
	}
	arr[2] = scheduleId;
	return JSON.stringify(arr);
}

export function at(obj: unknown, dotPath: string | null | undefined): unknown {
	if (dotPath == null || dotPath === "") return obj;
	let cur: unknown = obj;
	for (const s of String(dotPath).replace(/\[(\d+)\]/g, ".$1").split(".").filter(Boolean)) {
		if (cur == null || typeof cur !== "object") return undefined;
		cur = (cur as Record<string, unknown>)[s];
	}
	return cur;
}

export function parseBody(text: string): unknown {
	const t = text.trim();
	const json = t.startsWith(")]}'") ? t.slice(t.indexOf("\n") + 1).trim() : t;
	return JSON.parse(json) as unknown;
}

export function buildBody(c: BookingRequestFile, scheduleId: string): string | undefined {
	if (c.bodyFile) {
		const raw = readFileSync(resolve(process.cwd(), c.bodyFile), "utf8").trim();
		const arr = JSON.parse(raw) as unknown;
		if (!Array.isArray(arr) || arr.length < 3) {
			throw new Error("bodyFile must be a JSON array with length >= 3");
		}
		if (!scheduleId) {
			throw new Error("Set scheduleId in config or BOOKING_SCHEDULE_ID in .env");
		}
		arr[2] = scheduleId;
		return JSON.stringify(arr);
	}
	if (c.body != null && c.body !== "") {
		return typeof c.body === "string" ? c.body : JSON.stringify(c.body);
	}
	return defaultListSlotsBody(scheduleId);
}

function mergeHeaders(
	fileHeaders: BookingRequestFile["headers"],
): Record<string, string> {
	const base: Record<string, string> = { ...LIST_SLOTS_DEFAULT_HEADERS };
	for (const [k, v] of Object.entries(fileHeaders ?? {})) {
		if (v != null) base[k] = String(v);
	}
	const extra = process.env.BOOKING_HEADERS_JSON?.trim();
	if (extra) {
		let parsed: Record<string, unknown>;
		try {
			parsed = JSON.parse(extra) as Record<string, unknown>;
		} catch {
			throw new Error("BOOKING_HEADERS_JSON must be valid JSON");
		}
		for (const [k, v] of Object.entries(parsed)) {
			if (v != null) base[k] = String(v);
		}
	}
	if (process.env.BOOKING_COOKIE) base.cookie = process.env.BOOKING_COOKIE;
	return Object.fromEntries(Object.entries(base).map(([k, v]) => [k.toLowerCase(), v]));
}

export function buildHeaders(c: BookingRequestFile): Record<string, string> {
	return mergeHeaders(c.headers);
}
