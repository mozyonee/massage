import { loadProjectEnv } from "./core/env.js";
import { loadConfig, type AppConfig } from "./core/config.js";
import { bookNewSlotsForTeam, TEAM, pickTeamForSlots } from "./booking/team.js";
import { pollOnce } from "./polling/poll.js";
import { slotKey, type ParsedSlot } from "./core/types.js";
import { schedulePageUrl } from "./core/functions.js";

loadProjectEnv(import.meta.url);

let cfg: AppConfig;
try {
	cfg = loadConfig();
} catch (e) {
	console.error(e instanceof Error ? e.message : e);
	process.exit(1);
}
const scheduleId = cfg.scheduleId;
const targetLabel = scheduleId
	? schedulePageUrl(scheduleId)
	: cfg.url.slice(0, 80);

let pollWarm = true;
let lastSlotKeys = new Set<string>();

async function tick(): Promise<void> {
	const parsed = await pollOnce(cfg);
	if (parsed == null) return;

	if (pollWarm) {
		pollWarm = false;
		lastSlotKeys = new Set(parsed.map(slotKey));
		return;
	}

	const keys = new Set(parsed.map(slotKey));
	const newSlots: ParsedSlot[] = [];
	for (const s of parsed) {
		if (!lastSlotKeys.has(slotKey(s))) newSlots.push(s);
	}
	lastSlotKeys = keys;

	if (newSlots.length === 0 || TEAM.length === 0) return;

	const n = Math.min(newSlots.length, TEAM.length);
	const sorted = [...newSlots].sort((a, b) => a.startSec - b.startSec);
	const slotsToBook = sorted.slice(0, n);
	const assignees = pickTeamForSlots(n, TEAM);

	await bookNewSlotsForTeam(cfg, slotsToBook, assignees);
}

console.log(`polling | ${targetLabel} | every ${cfg.pollMs}ms`);
await tick();
setInterval(() => {
	void tick();
}, cfg.pollMs);
