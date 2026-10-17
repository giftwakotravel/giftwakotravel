import { NextResponse } from "next/server";
import { appendFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

/*
 * Trip request intake — port of the WordPress [giftwako_trip_request] handler.
 *
 * Delivery order:
 *   1. RESEND_API_KEY + TRIP_REQUEST_EMAIL_TO  → email via Resend REST API
 *   2. TRIP_REQUEST_WEBHOOK_URL                → POST JSON to a webhook/CRM
 *   3. fallback                                → append to data/trip-requests.jsonl
 */

const FIELDS: Record<string, { label: string; req: boolean }> = {
	full_name: { label: "Full name", req: true },
	email: { label: "Email address", req: true },
	phone: { label: "Phone number", req: true },
	whatsapp: { label: "WhatsApp number", req: false },
	contact_method: { label: "Preferred contact method", req: true },
	country_residence: { label: "Country of residence", req: false },
	departure_location: { label: "Departure location", req: true },
	destination_country: { label: "Destination country", req: true },
	destination_area: { label: "Destination / area", req: false },
	trip_type: { label: "Type of trip", req: true },
	trip_type_other: { label: "Describe the trip", req: false },
	departure_date: { label: "Departure date", req: false },
	return_date: { label: "Return date", req: false },
	nights: { label: "Number of nights", req: false },
	date_flexibility: { label: "Are your dates flexible?", req: true },
	adults: { label: "Adults (18+)", req: true },
	children: { label: "Children (0–17)", req: false },
	children_ages: { label: "Children’s ages", req: false },
	rooms: { label: "Rooms needed", req: false },
	special_requirements: { label: "Special requirements", req: false },
	budget: { label: "Approximate budget", req: true },
	budget_basis: { label: "Budget is", req: true },
	accommodation: { label: "Accommodation preference", req: false },
	transport: { label: "Transport preference", req: false },
	notes: { label: "Anything else we should know?", req: false },
	consent: { label: "Consent", req: true },
};

const OPTIONS: Record<string, string[]> = {
	contact_method: ["WhatsApp", "Phone call", "Email"],
	trip_type: [
		"Holiday package", "Beach holiday", "Safari and wildlife", "City tour", "Adventure travel",
		"Business travel", "Honeymoon", "Family holiday", "International travel", "Airport transfer",
		"Accommodation only", "Other",
	],
	date_flexibility: ["Exact dates", "Flexible by a few days", "Flexible by a few weeks", "Not decided yet"],
	budget: [
		"Under R2,000", "R2,000–R5,000", "R5,001–R10,000", "R10,001–R20,000", "R20,001–R50,000",
		"Above R50,000", "Not sure yet",
	],
	budget_basis: ["For the whole group", "Per person"],
	accommodation: [
		"Budget accommodation", "Guesthouse or B&B", "3-star hotel", "4-star hotel", "5-star or luxury",
		"Self-catering", "No accommodation required", "Not sure yet",
	],
	transport: [
		"Bus or coach", "Private vehicle", "Car rental", "Flights", "Airport transfers",
		"No transport required", "Recommend the best option",
	],
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function clean(raw: FormDataEntryValue | null): string {
	if (raw === null || typeof raw !== "string") return "";
	return raw.replace(/<[^>]*>/g, "").trim();
}

function validate(fd: FormData) {
	const errors: Record<string, string> = {};
	const data: Record<string, string | string[]> = {};

	// spam traps — mirror the PHP honeypot + too-fast check
	if (clean(fd.get("website"))) return { data: {}, errors: { _spam: "honeypot" } };
	const ts = parseInt(clean(fd.get("gw_ts")) || "0", 10);
	if (ts && Date.now() - ts < 4000) return { data: {}, errors: { _spam: "too-fast" } };

	for (const name of Object.keys(FIELDS)) {
		if (name === "consent") {
			data[name] = clean(fd.get(name)) ? "yes" : "";
		} else if (name === "children_ages") {
			data[name] = fd.getAll("children_ages[]").map((a) => clean(a)).filter((a) => a !== "");
		} else {
			data[name] = clean(fd.get(name));
		}
	}

	for (const [name, f] of Object.entries(FIELDS)) {
		if (f.req && data[name] === "") errors[name] = "This field is required.";
	}

	if (data.email && !EMAIL_RE.test(data.email as string)) {
		errors.email = "Please enter a valid email address.";
	}

	const today = new Date();
	const todayISO = `${today.getUTCFullYear()}-${String(today.getUTCMonth() + 1).padStart(2, "0")}-${String(today.getUTCDate()).padStart(2, "0")}`;

	if (data.departure_date !== "") {
		const d = data.departure_date as string;
		if (!DATE_RE.test(d) || isNaN(Date.parse(d))) {
			errors.departure_date = "Please enter a valid date.";
		} else if (d < todayISO) {
			errors.departure_date = "Departure date cannot be in the past.";
		}
	}
	if (data.return_date !== "") {
		const d = data.return_date as string;
		if (!DATE_RE.test(d) || isNaN(Date.parse(d))) {
			errors.return_date = "Please enter a valid date.";
		} else if (data.departure_date !== "" && d < (data.departure_date as string)) {
			errors.return_date = "Return date must be on or after the departure date.";
		}
	}

	for (const [num, [lo, hi]] of Object.entries({ nights: [0, 60], adults: [1, 60], children: [0, 30], rooms: [0, 30] })) {
		const raw = data[num] as string;
		if (raw !== "") {
			const n = Number(raw);
			if (!Number.isFinite(n)) errors[num] = "Please enter a number.";
			else if (n < lo || n > hi) errors[num] = `Must be between ${lo} and ${hi}.`;
		}
	}

	if (data.trip_type === "Other" && data.trip_type_other === "") {
		errors.trip_type_other = "Please describe the trip.";
	}

	const ages = data.children_ages as string[];
	for (const a of ages) {
		const n = Number(a);
		if (!Number.isFinite(n) || n < 0 || n > 17) {
			errors.children_ages = "Children’s ages must be between 0 and 17.";
			break;
		}
	}

	for (const [name, choices] of Object.entries(OPTIONS)) {
		const val = data[name] as string;
		if (val !== "" && !choices.includes(val)) {
			data[name] = "";
			if (FIELDS[name].req) errors[name] = "Please choose an option.";
		}
	}

	if (data.consent !== "yes") errors.consent = "Please agree so we can plan your trip.";

	return { data, errors };
}

function mailBody(d: Record<string, string | string[]>) {
	const order = Object.keys(FIELDS).filter((k) => k !== "consent");
	const lines = [`New trip request submitted ${new Date().toISOString()}`, ""];
	for (const name of order) {
		let val = d[name];
		if (Array.isArray(val)) val = val.join(", ");
		if (val === "") continue;
		lines.push(`${FIELDS[name].label}: ${val}`);
	}
	return lines.join("\n");
}

async function deliver(data: Record<string, string | string[]>): Promise<boolean> {
	const dest = `${data.destination_country}${data.destination_area ? ` / ${data.destination_area}` : ""}`;
	const subject = `Trip request: ${dest} – ${data.full_name}`;
	const body = mailBody(data);

	// 1. Resend
	const resendKey = process.env.RESEND_API_KEY;
	const mailTo = process.env.TRIP_REQUEST_EMAIL_TO;
	if (resendKey && mailTo) {
		try {
			const res = await fetch("https://api.resend.com/emails", {
				method: "POST",
				headers: { Authorization: `Bearer ${resendKey}`, "Content-Type": "application/json" },
				body: JSON.stringify({
					from: process.env.TRIP_REQUEST_EMAIL_FROM ?? "website@giftwakotravel.co.za",
					to: [mailTo],
					reply_to: data.email as string,
					subject,
					text: body,
				}),
			});
			if (res.ok) return true;
			console.error("[trip-request] resend failed:", res.status, await res.text());
		} catch (e) {
			console.error("[trip-request] resend error:", e);
		}
	}

	// 2. Webhook
	const webhook = process.env.TRIP_REQUEST_WEBHOOK_URL;
	if (webhook) {
		try {
			const res = await fetch(webhook, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ subject, ...data }),
			});
			if (res.ok) return true;
			console.error("[trip-request] webhook failed:", res.status);
		} catch (e) {
			console.error("[trip-request] webhook error:", e);
		}
	}

	// 3. JSONL fallback (local/dev)
	try {
		const dir = path.join(process.cwd(), "data");
		await mkdir(dir, { recursive: true });
		await appendFile(
			path.join(dir, "trip-requests.jsonl"),
			JSON.stringify({ at: new Date().toISOString(), ...data }) + "\n",
		);
		return true;
	} catch (e) {
		console.error("[trip-request] jsonl fallback failed:", e);
		return false;
	}
}

function sb() {
	const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
	const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
	if (!url || !key) return null;
	return createClient(url, key);
}

async function saveToSupabase(data: Record<string, string | string[]>): Promise<string | null> {
	const supabase = sb();
	if (!supabase) return null;
	try {
		const ref = `TRQ-${Date.now().toString(36).toUpperCase()}${Math.random().toString(36).slice(2, 5).toUpperCase()}`;
		const row = {
			ref,
			full_name: data.full_name,
			email: data.email,
			phone: data.phone,
			whatsapp: data.whatsapp || null,
			contact_method: data.contact_method,
			country_residence: data.country_residence || null,
			departure_location: data.departure_location,
			destination_country: data.destination_country,
			destination_area: data.destination_area || null,
			trip_type: data.trip_type,
			trip_type_other: data.trip_type_other || null,
			departure_date: data.departure_date || null,
			return_date: data.return_date || null,
			nights: data.nights === "" ? null : Number(data.nights),
			date_flexibility: data.date_flexibility,
			adults: Number(data.adults) || 1,
			children: Number(data.children) || 0,
			children_ages: data.children_ages,
			rooms: data.rooms === "" ? null : Number(data.rooms),
			special_requirements: data.special_requirements || null,
			budget: data.budget,
			budget_basis: data.budget_basis,
			accommodation: data.accommodation || null,
			transport: data.transport || null,
			notes: data.notes || null,
		};
		const { error } = await supabase.from("trip_requests").insert(row);
		if (error) {
			console.error("[trip-request] supabase insert failed:", error.message);
			return null;
		}
		return ref;
	} catch (e) {
		console.error("[trip-request] supabase error:", e);
		return null;
	}
}

export async function POST(req: Request) {
	let fd: FormData;
	try {
		fd = await req.formData();
	} catch {
		return NextResponse.json({ ok: false }, { status: 400 });
	}

	const { data, errors } = validate(fd);

	if (errors._spam) {
		console.log(`[trip-request] spam-trapped (${errors._spam})`);
		return NextResponse.json({ ok: true }); // silently accept, like the WP version
	}
	if (Object.keys(errors).length > 0) {
		return NextResponse.json({ ok: false, errors, vals: data }, { status: 422 });
	}

	const ref = await saveToSupabase(data);
	const delivered = await deliver(data);
	if (!ref && !delivered) {
		return NextResponse.json({ ok: false }, { status: 502 });
	}
	return NextResponse.json({ ok: true, ref });
}
