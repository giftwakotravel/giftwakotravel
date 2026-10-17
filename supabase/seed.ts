/**
 * Seed the Supabase tables with the demo datasets.
 * Run AFTER applying supabase/schema.sql in the SQL editor:
 *   npm run db:seed
 */
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";
import {
	D_BOOKINGS, D_CUSTOMERS, D_DESTINATIONS, D_NOTIFS, D_OWNERS, D_PROMOS, D_PROPERTIES, D_REVIEWS, D_TICKETS,
} from "../lib/admin-data";
import {
	S_ANNOUNCEMENTS, S_ASSIGNMENTS, S_ATTENDANCE, S_DOCS, S_DRIVERS, S_EMPLOYEES, S_GUIDES, S_LEAVE, S_REGISTRATIONS, S_VEHICLES,
} from "../lib/staff-data";

const env = Object.fromEntries(
	readFileSync(".env.local", "utf8")
		.split("\n")
		.filter((l) => l.includes("=") && !l.startsWith("#"))
		.map((l) => l.split("=", 2).map((s) => s.trim())),
);
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function seed(table: string, rows: object[]) {
	const { error } = await sb.from(table).upsert(rows as never[]);
	console.log(`${error ? "✗" : "✓"} ${table} (${rows.length})${error ? ` — ${error.message}` : ""}`);
}

async function main() {
	await seed("properties", D_PROPERTIES.map(({ id, ...p }) => ({ ...p })));
	await seed("owners", D_OWNERS.map(({ id, bookings30d, revenue30d, commissionPct, ...o }) => ({ ...o, bookings_30d: bookings30d, revenue_30d: revenue30d, commission_pct: commissionPct })));
	await seed("customers", D_CUSTOMERS.map(({ id, ...c }) => ({ ...c })));
	await seed("bookings", D_BOOKINGS.map((b) => ({ ...b })));
	await seed("reviews", D_REVIEWS.map(({ id, ...r }) => ({ ...r })));
	await seed("destinations", D_DESTINATIONS.map(({ id, ...d }) => ({ ...d })));
	await seed("promotions", D_PROMOS.map(({ id, ...p }) => ({ ...p })));
	await seed("tickets", D_TICKETS.map((t) => ({ ...t })));
	await seed("notifications", D_NOTIFS.map(({ id, isNew, ...n }) => ({ ...n, is_new: isNew })));

	await seed("employees", S_EMPLOYEES.map(({ id, startDate, ...e }) => ({ ...e, start_date: startDate })));
	await seed("drivers", S_DRIVERS.map(({ id, licenceCat, licenceExpiry, prdpExpiry, employStatus, ...d }) => ({ ...d, licence_cat: licenceCat, licence_expiry: licenceExpiry, prdp_expiry: prdpExpiry, employ_status: employStatus })));
	await seed("guides", S_GUIDES.map(({ id, employStatus, ...g }) => ({ ...g, employ_status: employStatus })));
	await seed("registrations", S_REGISTRATIONS.map(({ id, ...r }) => ({ ...r })));
	await seed("vehicles", S_VEHICLES.map(({ id, licenceDisc, ...v }) => ({ ...v, licence_disc: licenceDisc })));
	await seed("assignments", S_ASSIGNMENTS.map(({ bookingRef, ...a }) => ({ ...a, booking_ref: bookingRef })));
	await seed("attendance", S_ATTENDANCE.map(({ in: ci, out: co, ...a }) => ({ ...a, check_in: ci, check_out: co })));
	await seed("staff_documents", S_DOCS.map(({ id, expires, ...d }) => ({ ...d, expires: expires === "—" ? null : expires })));
	await seed("leave_requests", S_LEAVE.map(({ id, from, to, ...l }) => ({ ...l, from_date: from, to_date: to })));
	await seed("announcements", S_ANNOUNCEMENTS.map(({ id, ...a }) => ({ ...a })));

	console.log("\nDone — check the tables in your Supabase dashboard.");
}

main().catch((e) => {
	console.error(e);
	process.exit(1);
});
