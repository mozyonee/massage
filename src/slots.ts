import type { SlotRow } from "./types.js";

export function leafSlotList(x: unknown): unknown[] {
	let s: unknown = x;
	for (let d = 0; d < 16; d++) {
		if (!Array.isArray(s) || s.length !== 1 || !Array.isArray(s[0])) break;
		s = s[0];
	}
	return s as unknown[];
}

function collectNumbers(t: unknown, out: number[]): void {
	if (t == null) return;
	if (typeof t === "number" && Number.isFinite(t)) out.push(t);
	if (typeof t === "string" && /^\d{9,12}$/.test(t)) out.push(Number(t));
	if (Array.isArray(t)) for (const x of t) collectNumbers(x, out);
}

function parseSlotEntry(entry: unknown): { startSec: number; durationMin: number | undefined } | null {
	const nums: number[] = [];
	collectNumbers(entry, nums);
	const startSec = nums.find((n) => n >= 1e9 && n < 1e11);
	const durationMin = nums.find((n) => n > 0 && n <= 24 * 60 && n !== startSec);
	if (startSec == null) return null;
	return { startSec, durationMin };
}

function formatStartDot(sec: number, timeZone: string): string {
	const d = new Date(sec * 1000);
	const f = new Intl.DateTimeFormat("en-GB", {
		timeZone,
		day: "2-digit",
		month: "2-digit",
		year: "numeric",
		hour: "2-digit",
		minute: "2-digit",
		hour12: false,
	});
	const p = Object.fromEntries(f.formatToParts(d).map((x) => [x.type, x.value]));
	return `${p.day}.${p.month}.${p.year} ${p.hour}:${p.minute}`;
}

export function slotsToRows(slots: unknown[], timeZone: string): SlotRow[] {
	const rows: SlotRow[] = [];
	for (const entry of slots) {
		const v = parseSlotEntry(entry);
		if (!v) continue;
		rows.push({
			start: formatStartDot(v.startSec, timeZone),
			duration: v.durationMin == null ? "unknown" : `${v.durationMin} minutes`,
		});
	}
	return rows;
}
