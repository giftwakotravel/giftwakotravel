/**
 * One-off import: OSM Limpopo stays → properties table (status Pending).
 * Run: npx tsx supabase/import-osm-stays.ts
 */
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";
import { LIMPOPO_STAYS } from "../lib/limpopo-stays";

const env = Object.fromEntries(
	readFileSync(".env.local", "utf8")
		.split("\n")
		.filter((l) => l.includes("=") && !l.startsWith("#"))
		.map((l) => l.split("=", 2).map((s) => s.trim())),
);
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

const TYPE_MAP: Record<string, string> = {
	hotel: "Hotel",
	guest_house: "Guesthouse",
	apartment: "Apartment",
	motel: "Motel",
	hostel: "Hostel",
	chalet: "Game lodge / chalet",
};
const BOOKABLE = Object.keys(TYPE_MAP);

async function main() {
	const rows = LIMPOPO_STAYS.filter((s) => BOOKABLE.includes(s.type)).map((s) => ({
		name: s.name,
		owner: "OSM prospect — unverified",
		city: (s.city || "Limpopo").replace(" area", ""),
		province: "Limpopo",
		type: TYPE_MAP[s.type],
		stars: s.stars ? Number(s.stars) || null : null,
		price: null,
		status: "Pending",
		image: null,
		reviews: 0,
		facilities: [
			...(s.website ? [`web:${s.website}`] : []),
			...(s.phone ? [`tel:${s.phone}`] : []),
			...(s.email ? [`mail:${s.email}`] : []),
			"osm-prospect",
		],
		rooms: [],
	}));

	// avoid re-importing on repeat runs — delete existing OSM prospects first
	const { error: delErr } = await sb
		.from("properties")
		.delete()
		.eq("owner", "OSM prospect — unverified");
	if (delErr) console.log("cleanup:", delErr.message);

	const { error } = await sb.from("properties").insert(rows);
	if (error) { console.error("✗", error.message); process.exit(1); }
	console.log(`✓ imported ${rows.length} Limpopo stays as Pending properties`);
}

main();
