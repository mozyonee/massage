import type { AppConfig } from "../core/config.js";
import { appointmentBookingRpcUrl, parseBody } from "../core/http.js";

export type BookSlotParams = {
	scheduleId: string;
	startSec: number;
	durationMin: number;
	appointmentTitle: string;
	email: string;
	first: string;
	last: string;
	recaptchaToken: string;
	bookContextId: string;
};

function walkBookContextId(x: unknown, scheduleId: string): string | null {
	if (!Array.isArray(x)) return null;
	if (
		x.length === 2 &&
		x[0] == null &&
		typeof x[1] === "string" &&
		x[1] !== scheduleId &&
		x[1].startsWith("AcZssZ")
	) {
		return x[1];
	}
	for (const y of x) {
		const found = walkBookContextId(y, scheduleId);
		if (found) return found;
	}
	return null;
}

export function extractBookContextId(definitionResponse: unknown, scheduleId: string): string | null {
	return walkBookContextId(definitionResponse, scheduleId);
}

export function extractAppointmentTitle(definitionResponse: unknown): string | null {
	const root = definitionResponse;
	if (!Array.isArray(root) || !Array.isArray(root[0])) return null;
	const row = root[0];
	if (!Array.isArray(row) || typeof row[1] !== "string") return null;
	return row[1];
}

export async function fetchAppointmentServiceDefinition(cfg: AppConfig): Promise<unknown> {
	const url = appointmentBookingRpcUrl(cfg.url, "GetAppointmentServiceDefinition");
	const body = JSON.stringify([null, null, cfg.scheduleId]);
	const res = await fetch(url, {
		method: "POST",
		headers: cfg.headers,
		body,
	});
	const text = await res.text();
	if (!res.ok) {
		throw new Error(`GetAppointmentServiceDefinition ${res.status}: ${text.slice(0, 400)}`);
	}
	return parseBody(text);
}

export function buildBookSlotBody(p: BookSlotParams): unknown[] {
	return [
		null,
		null,
		p.scheduleId,
		null,
		[[p.startSec], p.durationMin],
		null,
		[
			p.appointmentTitle,
			"",
			p.email,
			p.first,
			p.last,
			null,
			null,
			[],
			null,
			null,
			null,
			1,
			null,
			null,
			"",
		],
		p.recaptchaToken,
		1,
		null,
		null,
		null,
		p.bookContextId,
	];
}

export async function bookSlot(cfg: AppConfig, p: BookSlotParams): Promise<unknown> {
	const url = appointmentBookingRpcUrl(cfg.url, "BookSlot");
	const body = JSON.stringify(buildBookSlotBody(p));
	const res = await fetch(url, {
		method: "POST",
		headers: cfg.headers,
		body,
	});
	const text = await res.text();
	if (!res.ok) {
		throw new Error(`BookSlot ${res.status}: ${text.slice(0, 600)}`);
	}
	return parseBody(text);
}
