export function ts(): string {
	return new Date().toISOString();
}

export function schedulePageUrl(scheduleId: string): string {
	return `https://calendar.google.com/calendar/u/0/appointments/schedules/${encodeURIComponent(scheduleId)}`;
}

export function delay(ms: number): Promise<void> {
	return new Promise((r) => setTimeout(r, ms));
}