import { loadProjectEnv } from "../core/env.js";
import { loadConfig } from "../core/config.js";
import { pickBooker, TEAM } from "./team.js";
import {
	bookSlot,
	extractAppointmentTitle,
	extractBookContextId,
	fetchAppointmentServiceDefinition,
} from "./book.js";

loadProjectEnv(import.meta.url);

function req(name: string): string {
	const v = process.env[name]?.trim();
	if (!v) throw new Error(`Set ${name} for one-shot BookSlot`);
	return v;
}

function num(name: string): number {
	const v = req(name);
	const n = Number(v);
	if (!Number.isFinite(n)) throw new Error(`${name} must be a number`);
	return n;
}

const cfg = loadConfig();
const slotCount = Math.max(0, Math.floor(Number(process.env.BOOKING_AVAILABLE_SLOTS ?? "1")));
const { email, first, last } =
	TEAM.length > 0
		? pickBooker(slotCount || 1, TEAM)
		: { email: req("BOOKING_EMAIL"), first: req("BOOKING_FIRST"), last: req("BOOKING_LAST") };
const recaptcha = req("BOOKING_RECAPTCHA_TOKEN");
const startSec = num("BOOKING_START_UNIX");
const durationMin = num("BOOKING_DURATION_MINUTES");

const def = await fetchAppointmentServiceDefinition(cfg);
const title =
	process.env.BOOKING_APPOINTMENT_TITLE?.trim() ||
	extractAppointmentTitle(def) ||
	"Appointment";
const bookContextId =
	process.env.BOOKING_CONTEXT_ID?.trim() || extractBookContextId(def, cfg.scheduleId);
if (!bookContextId) {
	console.error(
		"Could not parse book context id from GetAppointmentServiceDefinition; set BOOKING_CONTEXT_ID",
	);
	process.exit(1);
}

const out = await bookSlot(cfg, {
	scheduleId: cfg.scheduleId,
	startSec,
	durationMin,
	appointmentTitle: title,
	email,
	first,
	last,
	recaptchaToken: recaptcha,
	bookContextId,
});
console.log(JSON.stringify(out, null, 2));
