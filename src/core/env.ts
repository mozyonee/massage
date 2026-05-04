import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { config as loadEnv } from "dotenv";

function findProjectRoot(fromDir: string): string {
	let dir = fromDir;
	for (let i = 0; i < 10; i++) {
		if (existsSync(resolve(dir, "package.json"))) return dir;
		const parent = dirname(dir);
		if (parent === dir) break;
		dir = parent;
	}
	return fromDir;
}

export function loadProjectEnv(importMetaUrl: string): void {
	const root = findProjectRoot(dirname(fileURLToPath(importMetaUrl)));
	const envPath = resolve(root, ".env");
	const localPath = resolve(root, ".env.local");
	if (existsSync(envPath)) loadEnv({ path: envPath });
	if (existsSync(localPath)) loadEnv({ path: localPath, override: true });
}
