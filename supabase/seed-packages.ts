/**
 * Seed `packages` from lib/data.ts (TRIPS + relevant SERVICE_PAGES).
 * Run AFTER applying supabase/booking-flow.sql:
 *   npx tsx supabase/seed-packages.ts
 */
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";
import { TRIPS, SERVICE_PAGES, type Trip } from "../lib/data";

const env = Object.fromEntries(
	readFileSync(".env.local", "utf8")
		.split("\n")
		.filter((l) => l.includes("=") && !l.startsWith("#"))
		.map((l) => l.split("=", 2).map((s) => s.trim())),
);
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

const MONTHS: Record<string, string> = {
	january: "01", february: "02", march: "03", april: "04", may: "05", june: "06",
	july: "07", august: "08", september: "09", october: "10", november: "11", december: "12",
};

function parseDates(meta: string): string[] {
	const out: string[] = [];
	const year = /20\d\d/.exec(meta)?.[0] ?? "2026";
	// "24–25 October", "16 December", "16–18 October 2026"
	for (const m of meta.matchAll(/(\d{1,2})\s*(?:[–-]\s*\d{1,2})?\s*(January|February|March|April|May|June|July|August|September|October|November|December)/gi)) {
		out.push(`${year}-${MONTHS[m[2].toLowerCase()]}-${m[1].padStart(2, "0")}`);
	}
	return [...new Set(out)];
}

function num(s: string): number | null {
	const m = s.replace(/,/g, "").match(/\d+/);
	return m ? Number(m[0]) : null;
}

const priceNums = (rows?: [string, string, string][]) =>
	(rows ?? []).map((r) => num(r[1])).filter((n): n is number => n != null);
const depositNums = (rows?: [string, string, string][]) =>
	(rows ?? []).map((r) => num(r[2])).filter((n): n is number => n != null);

function category(t: Trip): string {
	const s = `${t.slug} ${t.title} ${t.blurb}`.toLowerCase();
	if (/scholar|school|church|group|organisation/.test(s)) return "groups";
	if (/sun city|complete/.test(s)) return "complete";
	if (/night|2 days|3 days|getaway/.test(t.caption + " " + t.title)) return "getaways";
	return "tours";
}

function row(t: Trip) {
	const cap = t.caption.split("·").map((x) => x.trim());
	const dur = /(\d+)\s*day/.exec(t.caption)?.[1];
	const nig = /(\d+)\s*night/.exec(t.caption)?.[1];
	return {
		slug: t.slug,
		category: category(t),
		title: t.title,
		subtitle: t.caption,
		description: t.blurb,
		image: t.image,
		image_alt: t.alt,
		destination: cap[0] ?? null,
		province: null,
		duration_days: dur ? Number(dur) : 1,
		nights: nig ? Number(nig) : 0,
		price_from: Math.min(...priceNums(t.priceRows), Infinity) === Infinity ? null : Math.min(...priceNums(t.priceRows)),
		price_rows: (t.priceRows ?? []).map(([label, price, note]) => ({ label, price: num(price), note })),
		includes: (t.ticks ?? []).map((x) => (typeof x === "string" ? x : `${x.strong}${x.rest}`)),
		dates: parseDates(t.meta),
		seats: null,
		deposit: depositNums(t.priceRows).length ? Math.min(...depositNums(t.priceRows)) : null,
		note: t.note ?? null,
		status: "Active" as const,
	};
}

async function main() {
	const probe = await sb.from("packages").select("id").limit(1);
	if (probe.error) {
		console.error(`packages table not available: ${probe.error.message}`);
		console.error("Run supabase/booking-flow.sql in the SQL editor first.");
		process.exit(1);
	}

	const rows: Record<string, unknown>[] = TRIPS.map(row);
	// one generic on-request package for the groups/organisations service page
	const grp = SERVICE_PAGES.find((p) => p.slug === "groups-and-organisations");
	if (grp && !rows.some((r) => r.slug === "group-organisation-travel")) {
		rows.push({
			slug: "group-organisation-travel",
			category: "groups",
			title: "Group & organisation travel",
			subtitle: "On request · churches, schools, stokvels, companies",
			description: grp.lead,
			image: grp.heroImage,
			image_alt: grp.heroAlt,
			destination: null,
			province: "Limpopo",
			duration_days: 1,
			nights: 0,
			price_from: null,
			price_rows: [],
			includes: grp.ticks,
			dates: [],
			seats: null,
			deposit: null,
			note: null,
			status: "Active" as const,
		});
	}

	console.log(`\n  ${"slug".padEnd(30)} ${"category".padEnd(10)} ${"days".padEnd(5)} ${"n".padEnd(3)} ${"from".padEnd(8)} dates`);
	for (const r of rows) {
		const { error } = await sb.from("packages").upsert(r, { onConflict: "slug" });
		const dates = r.dates as string[];
		console.log(
			`  ${error ? "✗" : "✓"} ${String(r.slug).padEnd(30)} ${String(r.category).padEnd(10)} ${String(r.duration_days).padEnd(5)} ${String(r.nights).padEnd(3)} ${String(r.price_from ?? "—").padEnd(8)} ${dates.join(", ") || "on request"}` +
			(error ? `  — ${error.message}` : ""),
		);
	}
	console.log("\nDone.");
}

main().catch((e) => { console.error(e); process.exit(1); });
