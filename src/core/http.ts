import type { BookingRequestFile, Wall } from "./types.js";

function zonedWall(utcSec: number, timeZone: string): Wall {
	const ms = utcSec * 1000;
	const p = new Intl.DateTimeFormat("en-US", {
		timeZone,
		year: "numeric",
		month: "2-digit",
		day: "2-digit",
		hour: "2-digit",
		minute: "2-digit",
		second: "2-digit",
		hour12: false,
	}).formatToParts(new Date(ms));
	const n = (t: string) => Number(p.find((x) => x.type === t)?.value ?? 0);
	return { y: n("year"), M: n("month"), d: n("day"), h: n("hour"), m: n("minute"), s: n("second") };
}

function cmpWall(a: Wall, b: Wall): number {
	if (a.y !== b.y) return a.y - b.y;
	if (a.M !== b.M) return a.M - b.M;
	if (a.d !== b.d) return a.d - b.d;
	if (a.h !== b.h) return a.h - b.h;
	if (a.m !== b.m) return a.m - b.m;
	return a.s - b.s;
}

function startOfZonedDayContainingUtcSec(utcSec: number, timeZone: string): number {
	const w = zonedWall(utcSec, timeZone);
	const midnight: Wall = { ...w, h: 0, m: 0, s: 0 };
	let lo = utcSec - 48 * 3600;
	let hi = utcSec + 48 * 3600;
	while (lo + 1 < hi) {
		const mid = Math.floor((lo + hi) / 2);
		if (cmpWall(zonedWall(mid, timeZone), midnight) < 0) lo = mid;
		else hi = mid;
	}
	return hi;
}

function listSlotsRangeUnix(
	nowUtcSec: number,
	timeZone: string,
	spanDays: number,
): { startSec: number; endSec: number } {
	const startSec = startOfZonedDayContainingUtcSec(nowUtcSec, timeZone);
	return { startSec, endSec: startSec + spanDays * 86400 };
}

export const LIST_SLOTS_DEFAULT_URL =
	"https://calendar-pa.clients6.google.com/$rpc/google.internal.calendar.v1.AppointmentBookingService/ListAvailableSlots?%24httpHeaders=X-Goog-Api-Key%3AAIzaSyA7GKm43l8WNxlLTjsldq9z9n80CL6KW4U%0D%0AContent-Type%3Aapplication%2Fjson%2Bprotobuf%0D%0AX-User-Agent%3Agrpc-web-javascript%2F0.1%0D%0A";

export function appointmentBookingRpcUrl(listSlotsUrl: string, rpcMethod: string): string {
	return listSlotsUrl.replace(
		/AppointmentBookingService\/[^?]+/,
		`AppointmentBookingService/${rpcMethod}`,
	);
}

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

const LIST_SLOTS_SPAN_DAYS = 42;

function defaultListSlotsBody(scheduleId: string, displayTz: string): string {
	if (!scheduleId) {
		throw new Error("Set BOOKING_SCHEDULE_ID in .env");
	}
	const nowSec = Math.floor(Date.now() / 1000);
	const { startSec, endSec } = listSlotsRangeUnix(nowSec, displayTz, LIST_SLOTS_SPAN_DAYS);
	return JSON.stringify([null, null, scheduleId, null, [[startSec], [endSec]]]);
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

export function buildListSlotsBody(scheduleId: string, displayTz: string): string {
	return defaultListSlotsBody(scheduleId, displayTz);
}

function mergeHeaders(
	fileHeaders: BookingRequestFile["headers"],
): Record<string, string> {
	const base: Record<string, string> = { ...LIST_SLOTS_DEFAULT_HEADERS };
	for (const [k, v] of Object.entries(fileHeaders ?? {})) {
		if (v != null) base[k] = String(v);
	}
	if (process.env.BOOKING_COOKIE) base.cookie = process.env.BOOKING_COOKIE;
	return Object.fromEntries(Object.entries(base).map(([k, v]) => [k.toLowerCase(), v]));
}

export function buildHeaders(c: BookingRequestFile): Record<string, string> {
	return mergeHeaders(c.headers);
}
