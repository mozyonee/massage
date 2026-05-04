export type BookingRequestFile = {
	url?: string;
	headers?: Record<string, string | number | boolean | null | undefined>;
	scheduleId?: string;
	displayTimezone?: string;
};

export type SlotRow = { start: string; duration: string };

export type ParsedSlot = { startSec: number; durationMin: number };

export function slotKey(s: ParsedSlot): string {
	return `${s.startSec}:${s.durationMin}`;
}

export type Wall = { y: number; M: number; d: number; h: number; m: number; s: number };