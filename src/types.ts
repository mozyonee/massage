export type BookingRequestFile = {
	url?: string;
	method?: string;
	headers?: Record<string, string | number | boolean | null | undefined>;
	body?: unknown;
	bodyFile?: string;
	slotsArrayPath?: string | null;
	scheduleId?: string;
	displayTimezone?: string;
};

export type SlotRow = { start: string; duration: string };
