import { at, buildBody, parseBody } from "./request.js";
import { leafSlotList, slotsToRows } from "./slots.js";
import type { AppConfig } from "./config.js";

function ts(): string {
	return new Date().toISOString();
}

export async function pollOnce(cfg: AppConfig): Promise<void> {
	const { file: c, scheduleId, displayTz, url, headers } = cfg;
	let body: string | undefined;
	try {
		body = buildBody(c, scheduleId);
	} catch (e) {
		console.error(ts(), e instanceof Error ? e.message : String(e));
		return;
	}
	const method = c.method ?? "POST";
	let res: Response;
	try {
		res = await fetch(url, { method, headers, ...(body !== undefined ? { body } : {}) });
	} catch (e) {
		console.error(ts(), e instanceof Error ? e.message : String(e));
		return;
	}
	const text = await res.text();
	if (!res.ok) {
		const hint =
			res.status === 400 || res.status === 403
				? " (re-copy ListAvailableSlots from DevTools: cookie + full headers; keep fixtures body slot window from the same capture)"
				: "";
		console.error(ts(), res.status, text.slice(0, 400) + hint);
		return;
	}
	let data: unknown;
	try {
		data = parseBody(text);
	} catch {
		console.error(ts(), "response not JSON", text.slice(0, 200));
		return;
	}
	const slotsPath = process.env.BOOKING_SLOTS_ARRAY_PATH?.trim() ?? c.slotsArrayPath ?? "";
	const raw = at(data, slotsPath);
	if (!Array.isArray(raw)) {
		console.error("slots path must resolve to an array");
		process.exit(1);
	}
	const slots = leafSlotList(raw);
	if (slots.length === 0) {
		console.log(ts(), "no slots available");
	} else {
		const flat = slotsToRows(slots, displayTz);
		console.log(ts(), `${flat.length} slot(s) (${displayTz})`);
		const json = JSON.stringify(flat, null, 2);
		const maxLength = 256;
		console.log(`${json.substring(0, maxLength)}${json.length > maxLength ? "…" : ""}`);
	}
}
