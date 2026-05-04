import type { AppConfig } from "../core/config.js";
import type { Browser, Page } from "playwright";
import { chromium } from "playwright";
import { delay, schedulePageUrl } from "../core/functions.js";

const RECAPTCHA_ACTION = "BookSlot";
const PAGE_LOAD_TIMEOUT_MS = 120_000;
const GRECAPTCHA_READY_TIMEOUT_MS = 90_000;

function cookiesFromCookieHeader(header: string) {
	return header
		.split(";")
		.map((p) => {
			const i = p.indexOf("=");
			if (i === -1) return null;
			const name = p.slice(0, i).trim();
			const value = p.slice(i + 1).trim();
			if (!name) return null;
			return {
				name,
				value,
				domain: ".google.com",
				path: "/",
				secure: true,
				sameSite: "Lax" as const,
			};
		})
		.filter((c): c is NonNullable<typeof c> => Boolean(c));
}


async function waitForGrecaptchaExecute(page: Page, timeoutMs: number): Promise<void> {
	const deadline = Date.now() + timeoutMs;
	while (Date.now() < deadline) {
		const ok = await page.evaluate(
			() => typeof (window as unknown as { grecaptcha?: { execute?: unknown } }).grecaptcha?.execute ===
				"function",
		);
		if (ok) return;
		await delay(300);
	}
	throw new Error("grecaptcha.execute did not become available (timeout)");
}

async function siteKeysFromRecaptchaCfg(page: Page): Promise<string[]> {
	return page.evaluate(() => {
		const w = window as unknown as {
			___grecaptcha_cfg?: { clients?: Record<string, unknown> };
		};
		const clients = w.___grecaptcha_cfg?.clients;
		if (!clients) return [];
		const out = new Set<string>();
		function walk(o: unknown): void {
			if (!o || typeof o !== "object") return;
			const rec = o as Record<string, unknown>;
			if (typeof rec.sitekey === "string" && rec.sitekey.length > 0) out.add(rec.sitekey);
			for (const v of Object.values(rec)) walk(v);
		}
		for (const c of Object.values(clients)) walk(c);
		return [...out];
	});
}

type GrecaptchaApi = {
	ready: (cb: () => void) => void;
	execute: (siteKey: string, opts: { action: string }) => Promise<string>;
};

async function executeRecaptchaOnPage(page: Page, siteKey: string, action: string): Promise<string> {
	return page.evaluate(
		async ({ siteKey, action }: { siteKey: string; action: string }) => {
			const g = (window as unknown as { grecaptcha: GrecaptchaApi }).grecaptcha;
			return await new Promise<string>((resolve, reject) => {
				g.ready(async () => {
					try {
						resolve(await g.execute(siteKey, { action }));
					} catch (e) {
						reject(e);
					}
				});
			});
		},
		{ siteKey, action },
	);
}

export async function resolveRecaptchaTokens(
	cfg: AppConfig,
	count: number,
): Promise<string[] | null> {
	if (count <= 0) return [];
	const scheduleId = cfg.scheduleId?.trim();
	if (!scheduleId) return null;

	const cookieHeader = cfg.headers["cookie"]?.trim();
	let browser: Browser | null = null;
	try {
		browser = await chromium.launch({
			headless: true,
			args: ["--disable-blink-features=AutomationControlled"],
		});
		const context = await browser.newContext({
			userAgent: cfg.headers["user-agent"],
			locale: "en-GB",
		});
		if (cookieHeader) {
			await context.addCookies(cookiesFromCookieHeader(cookieHeader));
		}
		const page = await context.newPage();
		await page.goto(schedulePageUrl(scheduleId), {
			waitUntil: "networkidle",
			timeout: PAGE_LOAD_TIMEOUT_MS,
		});
		await waitForGrecaptchaExecute(page, GRECAPTCHA_READY_TIMEOUT_MS);
		const siteKeys = await siteKeysFromRecaptchaCfg(page);
		const siteKey = siteKeys[0];
		if (!siteKey) return null;

		const tokens: string[] = [];
		for (let i = 0; i < count; i++) {
			const raw = await executeRecaptchaOnPage(page, siteKey, RECAPTCHA_ACTION);
			const t = raw.trim();
			if (!t) return null;
			tokens.push(t);
		}
		return tokens;
	} catch {
		return null;
	} finally {
		await browser?.close().catch(() => {});
	}
}
