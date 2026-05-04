import type { AppConfig } from "../core/config.js";
import type { ParsedSlot } from "../core/types.js";
import { at, buildListSlotsBody, parseBody } from "../core/http.js";
import { ts } from "../core/functions.js";
import { leafSlotList, slotsToParsed, slotsToRows } from "./slots.js";

export async function fetchPollPayload(
	cfg: AppConfig,
): Promise<{ parsed: ParsedSlot[]; leaf: unknown[] } | null> {
	const { file: c, scheduleId, url, headers } = cfg;
	let body: string | undefined;
	try {
		body = buildListSlotsBody(c, scheduleId);
	} catch (e) {
		console.error(ts(), e instanceof Error ? e.message : String(e));
		return null;
	}
	const method = c.method ?? "POST";
	let res: Response;
	try {
		res = await fetch(url, { method, headers, ...(body !== undefined ? { body } : {}) });
	} catch (e) {
		console.error(ts(), e instanceof Error ? e.message : String(e));
		return null;
	}
	const text = await res.text();
	if (!res.ok) {
		const hint =
			res.status === 400 || res.status === 403
				? " (re-copy ListAvailableSlots from DevTools: cookie + full headers; keep fixtures body slot window from the same capture)"
				: "";
		console.error(ts(), res.status, text.slice(0, 400) + hint);
		return null;
	}
	let data: unknown;
	try {
		data = parseBody(text);
	} catch {
		console.error(ts(), "response not JSON", text.slice(0, 200));
		return null;
	}
	const slotsPath = process.env.BOOKING_SLOTS_ARRAY_PATH?.trim() ?? c.slotsArrayPath ?? "";
	const raw = at(data, slotsPath);
	if (!Array.isArray(raw)) {
		console.error("slots path must resolve to an array");
		process.exit(1);
	}
	const leaf = leafSlotList(raw);
	return { parsed: slotsToParsed(leaf), leaf };
}

export async function pollOnce(cfg: AppConfig): Promise<ParsedSlot[] | null> {
	const { displayTz } = cfg;
	const payload = await fetchPollPayload(cfg);
	if (payload == null) return null;
	const { parsed, leaf } = payload;
	if (parsed.length === 0) {
		console.log(ts(), "no slots available");
		return parsed;
	}
	const flat = slotsToRows(leaf, displayTz);
	console.log(ts(), `${flat.length} slot(s) (${displayTz})`);
	const json = JSON.stringify(flat, null, 2);
	const maxLength = 256;
	console.log(`${json.substring(0, maxLength)}${json.length > maxLength ? "…" : ""}`);
	return parsed;
}
