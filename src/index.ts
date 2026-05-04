import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { config as loadEnv } from "dotenv";
import { loadConfig, type AppConfig } from "./config.js";
import { pollOnce } from "./poll.js";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const envFiles = [resolve(projectRoot, ".env"), resolve(projectRoot, ".env.local")] as const;
for (let i = 0; i < envFiles.length; i++) {
	const path = envFiles[i];
	if (existsSync(path)) {
		loadEnv({ path, override: i > 0 });
	}
}

let cfg: AppConfig;
try {
	cfg = loadConfig();
} catch (e) {
	console.error(e instanceof Error ? e.message : e);
	process.exit(1);
}
const scheduleId = cfg.scheduleId;
const targetLabel = scheduleId
	? `https://calendar.google.com/calendar/u/0/appointments/schedules/${scheduleId}`
	: cfg.url.slice(0, 80);

console.log(`polling | ${targetLabel} | every ${cfg.pollMs}ms`);
await pollOnce(cfg);
setInterval(() => {
	void pollOnce(cfg);
}, cfg.pollMs);
