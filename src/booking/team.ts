import type { AppConfig } from "../core/config.js";
import type { ParsedSlot } from "../core/types.js";
import { ts } from "../core/functions.js";
import {
	bookSlot,
	extractAppointmentTitle,
	extractBookContextId,
	fetchAppointmentServiceDefinition,
} from "./book.js";
import { resolveRecaptchaTokens } from "./recaptcha.js";

export type TeamMember = {
	first: string;
	last: string;
	email: string;
};

export const TEAM: TeamMember[] = [
	{ first: "Vadym", last: "Abakumov", email: "vadym.abakumov@precis.com" },
];

export function pickTeamForSlots(slotCount: number, team: TeamMember[]): TeamMember[] {
	const n = Math.min(Math.max(0, Math.floor(slotCount)), team.length);
	if (n === 0) return [];
	const copy = [...team];
	for (let i = copy.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[copy[i], copy[j]] = [copy[j], copy[i]];
	}
	return copy.slice(0, n);
}

export function pickBooker(slotCount: number, team: TeamMember[]): TeamMember {
	const pool = pickTeamForSlots(slotCount, team);
	if (pool.length === 0) throw new Error("TEAM is empty or slot count is 0");
	return pool[Math.floor(Math.random() * pool.length)]!;
}

export async function bookNewSlotsForTeam(
	cfg: AppConfig,
	newSlots: ParsedSlot[],
	assignees: TeamMember[],
): Promise<void> {
	const n = Math.min(newSlots.length, assignees.length);
	if (n === 0) return;
	let def: unknown;
	try {
		def = await fetchAppointmentServiceDefinition(cfg);
	} catch (e) {
		console.error(ts(), e instanceof Error ? e.message : e);
		return;
	}
	const title = extractAppointmentTitle(def) || "Appointment";
	const bookContextId = extractBookContextId(def, cfg.scheduleId);
	if (!bookContextId) {
		console.error(ts(), "could not parse internal id from GetAppointmentServiceDefinition");
		return;
	}
	const tokens = await resolveRecaptchaTokens(cfg, n);
	if (!tokens) {
		console.error(ts(), "recaptcha missing; run `npx playwright install chromium` after npm install");
		return;
	}
	for (let i = 0; i < n; i++) {
		const slot = newSlots[i]!;
		const m = assignees[i]!;
		const token = tokens[i]!;
		try {
			await bookSlot(cfg, {
				scheduleId: cfg.scheduleId,
				startSec: slot.startSec,
				durationMin: slot.durationMin,
				appointmentTitle: title,
				email: m.email,
				first: m.first,
				last: m.last,
				recaptchaToken: token,
				bookContextId,
			});
			console.log(ts(), `booked slot ${slot.startSec} for ${m.email}`);
		} catch (e) {
			console.error(ts(), `BookSlot failed (${m.email}):`, e instanceof Error ? e.message : e);
		}
	}
}
