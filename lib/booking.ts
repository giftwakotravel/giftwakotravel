import { supabase } from "@/lib/supabase";

/* ---------- service catalogue ---------- */

export const SERVICE_OPTIONS = [
	{ key: "all", label: "All" },
	{ key: "tours", label: "Tours & Day Trips" },
	{ key: "getaways", label: "Getaways & Holidays" },
	{ key: "transport", label: "Transport" },
	{ key: "accommodation", label: "Accommodation" },
	{ key: "airways", label: "Airways" },
	{ key: "complete", label: "Complete Trips" },
	{ key: "groups", label: "Groups" },
	{ key: "events", label: "Events" },
] as const;
export type ServiceKey = (typeof SERVICE_OPTIONS)[number]["key"];

/* Accommodation type filter → real `properties.type` values (ilike patterns).
 * DB values seen: Hotel, Guesthouse, Hostel, Motel, Apartment, "Game lodge / chalet". */
export const ACCOM_TYPES: { label: string; match: string[] }[] = [
	{ label: "Hotels", match: ["hotel", "motel"] },
	{ label: "Lodges", match: ["lodge"] },
	{ label: "Guesthouses", match: ["guesthouse", "guest house", "hostel", "b&b", "bnb"] },
	{ label: "Resorts", match: ["resort"] },
	{ label: "Self-Catering", match: ["self", "apartment", "flat"] },
];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type R = Record<string, any>;

export interface BookQuery {
	service: ServiceKey;
	from: string;
	to: string;
	pax: number;
	type?: string;
	pickup?: string;
	event_id?: string;
	dest?: string;
}

export function overlaps(aFrom: string, aTo: string, bFrom: string, bTo: string) {
	return aFrom <= bTo && bFrom <= aTo;
}

export function makeRef(service: string) {
	const code = (service === "all" ? "SV" : service).slice(0, 2).toUpperCase();
	const abc = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
	let r = "";
	for (let i = 0; i < 6; i++) r += abc[Math.floor(Math.random() * abc.length)];
	return `GW-${code}-${r}`;
}

export const todayISO = () => new Date().toISOString().slice(0, 10);
export const addDays = (iso: string, n: number) => {
	const d = new Date(iso + "T00:00:00");
	d.setDate(d.getDate() + n);
	return d.toISOString().slice(0, 10);
};
export const fmtR = (n: number | null | undefined) =>
	n == null ? "Price on request" : `R${Number(n).toLocaleString("en-ZA").replace(/,/g, " ")}`;

const eachDay = (from: string, to: string) => {
	const out: string[] = [];
	const d = new Date(from + "T00:00:00");
	const end = new Date((to || from) + "T00:00:00");
	for (let i = 0; i < 60 && d <= end; i++) { out.push(d.toISOString().slice(0, 10)); d.setDate(d.getDate() + 1); }
	return out;
};

async function bookedSlots(service: string): Promise<R[]> {
	const c = supabase();
	if (!c) return [];
	const { data, error } = await c.from("booked_slots").select("*").eq("service", service);
	return error ? [] : (data ?? []);
}

/* ---------- A. transport ---------- */

export async function loadTransport(q: BookQuery): Promise<{ items: R[]; also?: R[]; reason?: string }> {
	const c = supabase();
	if (!c) return { items: [], reason: "offline" };
	const [v, busy, slots] = await Promise.all([
		c.from("bookable_vehicles").select("*"),
		c.from("driver_busy_dates").select("*"),
		bookedSlots("transport"),
	]);
	if (v.error) return { items: [], reason: v.error.message };
	const days = eachDay(q.from, q.to || q.from);
	const busyIds = new Set(
		(busy.data ?? []).filter((b: R) => days.includes(b.busy_on)).map((b: R) => b.driver_id),
	);
	const slotVeh = new Set(
		slots.filter((s) => s.item_id != null && overlaps(q.from, q.to || q.from, s.date_from, s.date_to)).map((s) => s.item_id),
	);
	const ok = (v.data ?? []).filter(
		(x: R) => (x.capacity ?? 0) >= q.pax && !busyIds.has(x.driver_id) && !slotVeh.has(x.id),
	);
	if (!q.pickup) return { items: ok };
	const needle = q.pickup.toLowerCase();
	const match = (x: R) =>
		[x.towns_served, x.driver_town, x.operating_province, x.driver_province]
			.flat().filter(Boolean).join(" ").toLowerCase().includes(needle);
	return { items: ok.filter(match), also: ok.filter((x: R) => !match(x)) };
}

/* ---------- B. accommodation ---------- */

export async function loadAccommodation(q: BookQuery): Promise<{ items: R[]; reason?: string }> {
	const c = supabase();
	if (!c) return { items: [], reason: "offline" };
	let query = c.from("properties").select("*").eq("status", "Live");
	const t = ACCOM_TYPES.find((x) => x.label === q.type);
	if (t) query = query.or(t.match.map((m) => `type.ilike.%${m}%`).join(","));
	const [p, b, slots] = await Promise.all([
		query,
		c.from("bookings").select("property,checkin,checkout,status").in("status", ["Pending", "Confirmed"]),
		bookedSlots("accommodation"),
	]);
	if (p.error) return { items: [], reason: p.error.message };
	// half-open [checkin, checkout) — a checkout on day X does not block a check-in on day X
	const reqTo = q.to && q.to > q.from ? q.to : addDays(q.from, 1);
	const overlapping = (name: string, id: number) =>
		(b.data ?? []).filter((x: R) => x.property === name && x.checkin < reqTo && x.checkout > q.from).length +
		slots.filter((s) => s.item_id === id && s.date_from < reqTo && s.date_to > q.from).length;
	const items = (p.data ?? []).filter((x: R) => {
		const totalRooms = ((x.rooms as { qty?: number }[] | null) ?? []).reduce((a, r) => a + (r.qty ?? 0), 0) || 1;
		return overlapping(x.name, x.id) < totalRooms;
	});
	return { items };
}

/* ---------- C. events ---------- */

export async function loadEvents(q: BookQuery): Promise<{ items: R[]; reason?: string }> {
	const c = supabase();
	if (!c) return { items: [], reason: "offline" };
	let query = c.from("events").select("*").eq("status", "published").order("event_date");
	const from = q.from || todayISO();
	query = query.gte("event_date", from);
	if (q.to) query = query.lte("event_date", q.to);
	const { data, error } = await query;
	if (error) return { items: [], reason: error.message };
	return { items: data ?? [] };
}

/* ---------- D/E/G/H. packages ---------- */

export async function loadPackages(q: BookQuery, category: string): Promise<{ items: R[]; reason?: string }> {
	const c = supabase();
	if (!c) return { items: [], reason: "offline" };
	const [pk, slots] = await Promise.all([
		c.from("packages").select("*").eq("status", "Active").eq("category", category).order("sort"),
		bookedSlots(category),
	]);
	if (pk.error) return { items: [], reason: pk.error.message };
	const to = q.to || q.from;
	const inRange = (d: string) => !q.from || (d >= q.from && d <= to);
	const items = (pk.data ?? []).filter((x: R) => {
		const dates: string[] = x.dates ?? [];
		if (dates.length && q.from && !dates.some(inRange)) return false;
		if (x.seats == null || !dates.length) return true;
		const d = q.from ? dates.find(inRange) ?? dates[0] : dates[0];
		const booked = slots
			.filter((s) => s.item_id === x.id && (s.selection?.date ?? s.date_from) === d)
			.reduce((a: number, s: R) => a + (s.pax ?? 0), 0);
		return booked + q.pax <= x.seats;
	});
	return { items };
}
