"use client";

import { useState } from "react";

interface Route {
	name: string;
	price: number | null;
	note: string | null;
}

export interface EvDetail {
	id: number;
	title: string;
	location: string | null;
	venue: string | null;
	featuring: string | null;
	presented_by: string | null;
	event_date: string | null;
	price: number | null;
	routes: Route[] | null;
}

const EXPERIENCES = [
	{ key: "General Admission", label: "General Admission", sub: "Attend the event", icon: "🎫" },
	{ key: "Transport Only", label: "Transport Only", sub: "Travel to and from the event", icon: "🚐" },
	{ key: "Ticket & Transport", label: "Ticket & Transport", sub: "Book transport and get event tickets", icon: "🎫+🚐" },
];

const STEPS = ["Choose your experience", "Choose your route", "Passenger details", "Booking summary"];

function fmt(n: number) { return `R${n.toLocaleString("en-ZA")}`; }

export default function EventBooking({ ev }: { ev: EvDetail }) {
	const [step, setStep] = useState(0);
	const [experience, setExperience] = useState("");
	const [route, setRoute] = useState<Route | null>(null);
	const [f, setF] = useState({ name: "", phone: "", email: "", pax: "1", pickup: "", contact: "WhatsApp" });
	const [errors, setErrors] = useState<string[]>([]);
	const [status, setStatus] = useState<"idle" | "sending" | "sent">("idle");
	const [ref, setRef] = useState("");
	const [startedAt] = useState(() => Date.now());

	const set = (k: keyof typeof f, v: string) => setF((p) => ({ ...p, [k]: v }));
	const routes = ev.routes ?? [];
	const needsRoute = experience !== "General Admission";
	const pax = Math.max(1, Number(f.pax) || 1);

	// per-person price
	const unit: number | null =
		experience === "General Admission" ? ev.price
		: experience === "Transport Only" ? route?.price ?? null
		: experience === "Ticket & Transport" ? (ev.price != null && route?.price != null ? ev.price + route.price : null)
		: null;
	const total = unit != null ? unit * pax : null;

	const next = () => {
		const errs: string[] = [];
		if (step === 0 && !experience) errs.push("Please choose an experience");
		if (step === 1 && needsRoute && !route) errs.push("Please choose a route");
		if (step === 2) {
			if (!f.name.trim()) errs.push("Full name is required");
			if (!f.phone.trim()) errs.push("Phone number is required");
			if (!f.pickup.trim() && needsRoute) errs.push("Pickup location is required");
		}
		setErrors(errs);
		if (errs.length) return;
		if (step === 0 && experience === "General Admission") { setStep(2); window.scrollTo({ top: 0 }); return; }
		setStep((s) => Math.min(s + 1, STEPS.length - 1));
		window.scrollTo({ top: 0 });
	};
	const back = () => {
		setErrors([]);
		setStep((s) => (s === 2 && experience === "General Admission" ? 0 : Math.max(0, s - 1)));
	};

	async function submit() {
		setStatus("sending");
		const fd = new FormData();
		fd.set("gw_ts", String(startedAt));
		fd.set("full_name", f.name);
		fd.set("phone", f.phone);
		fd.set("contact_method", f.contact || "WhatsApp");
		fd.set("email", f.email.includes("@") ? f.email : "eventbooking@giftwakotravel.co.za"); // phone-first flow
		fd.set("departure_location", f.pickup || route?.name || "Not specified");
		fd.set("destination_country", "South Africa");
		fd.set("destination_area", `${ev.title}${ev.venue || ev.location ? ` — ${ev.venue ?? ev.location}` : ""}`);
		fd.set("trip_type", "Other");
		fd.set("trip_type_other", `Event booking — ${ev.title} (${experience}${route ? `, ${route.name}` : ""})`);
		if (ev.event_date) fd.set("departure_date", ev.event_date);
		fd.set("date_flexibility", "Exact dates");
		fd.set("adults", String(pax));
		fd.set("children", "0");
		fd.set("budget", "Not sure yet");
		fd.set("budget_basis", "For the whole group");
		fd.set("consent", "yes");
		fd.set("notes", [
			`EVENT BOOKING — ${ev.title}`,
			`Experience: ${experience}`,
			route && `Route: ${route.name} (${route.price ? fmt(route.price) + " pp" : "price TBC"}${route.note ? ` — ${route.note}` : ""})`,
			`Passengers: ${pax}`,
			`Pickup: ${f.pickup || "—"}`,
			total != null ? `Estimated total: ${fmt(total)}` : "Estimated total: to be confirmed with the event organiser",
			`Preferred contact: ${f.contact}`,
		].filter(Boolean).join("\n"));
		try {
			const res = await fetch("/api/trip-request", { method: "POST", body: fd });
			const json = await res.json();
			if (json.ok) { setRef(json.ref ?? ""); setStatus("sent"); window.scrollTo({ top: 0 }); return; }
		} catch { /* fallthrough */ }
		setErrors(["Could not submit right now — please WhatsApp us on 070 617 8269."]);
		setStatus("idle");
	}

	if (status === "sent") {
		return (
			<div className="gw-form__success">
				<h2>Booking request received!</h2>
				<p>We will confirm availability and pricing with the organiser, then contact you on {f.contact === "Phone call" ? "a phone call" : "WhatsApp"}.</p>
				{ref && <p><strong>Reference: {ref}</strong></p>}
				<p><strong>{ev.title}</strong> — {experience}{route ? ` · ${route.name}` : ""} · {pax} passenger{pax === 1 ? "" : "s"}</p>
			</div>
		);
	}

	return (
		<div className="gw-evbook">
			<ol className="gw-wiz" aria-label="Booking progress">
				{STEPS.map((t, i) => (
					<li key={t} className={i === step ? "is-current" : i < step ? "is-done" : ""}>
						<span className="gw-wiz__dot">{i + 1}</span>
						<span className="gw-wiz__label">{t}</span>
					</li>
				))}
			</ol>

			{errors.length > 0 && (
				<div className="gw-form__errors" role="alert"><ul>{errors.map((e) => <li key={e}>{e}</li>)}</ul></div>
			)}

			{/* step 0 — experience */}
			{step === 0 && (
				<div className="gw-survey__panel">
					<h3>Choose your experience</h3>
					<div className="gw-survey__cards" style={{ marginTop: "0.8rem" }}>
						{EXPERIENCES.map((x) => (
							<button type="button" key={x.key} className={`gw-survey__card${experience === x.key ? " is-selected" : ""}`} onClick={() => { setExperience(x.key); setRoute(null); }}>
								<span className="gw-evbook__icn">{x.icon}</span>
								{x.label}
								<small>{x.sub}</small>
							</button>
						))}
					</div>
					<p className="gw-form__hint" style={{ marginTop: "0.8rem" }}>Ticket prices and availability are confirmed with the event organiser before we take payment.</p>
				</div>
			)}

			{/* step 1 — route */}
			{step === 1 && (
				<div className="gw-survey__panel">
					<h3>Choose your transport route</h3>
					{routes.length === 0 ? (
						<p className="gw-small">No routes configured for this event yet — continue and tell us where you are travelling from.</p>
					) : (
						<div className="gw-survey__cards" style={{ marginTop: "0.8rem" }}>
							{routes.map((r) => (
								<button type="button" key={r.name} className={`gw-survey__card${route?.name === r.name ? " is-selected" : ""}`} onClick={() => { setRoute(r); if (!f.pickup) set("pickup", r.name); }}>
									{r.name}
									<small>{r.note ? `${r.note} — ` : ""}{r.price != null ? `${fmt(r.price)} per person` : "Price on request"}</small>
								</button>
							))}
						</div>
					)}
					<div className="gw-form__grid" style={{ marginTop: "1rem" }}>
						<div className="gw-form__field">
							<label className="gw-form__label">Departure / pickup area</label>
							<input value={f.pickup} onChange={(e) => set("pickup", e.target.value)} placeholder="e.g. Bolobedu Matipane taxi rank" />
						</div>
						<div className="gw-form__field">
							<label className="gw-form__label">Number of passengers</label>
							<input type="number" min={1} max={60} value={f.pax} onChange={(e) => set("pax", e.target.value)} />
						</div>
					</div>
				</div>
			)}

			{/* step 2 — passenger details */}
			{step === 2 && (
				<div className="gw-survey__panel">
					<h3>Passenger details</h3>
					<div className="gw-form__grid" style={{ marginTop: "0.8rem" }}>
						<div className="gw-form__field"><label className="gw-form__label">Full name *</label><input value={f.name} onChange={(e) => set("name", e.target.value)} autoComplete="name" /></div>
						<div className="gw-form__field"><label className="gw-form__label">Phone number *</label><input type="tel" value={f.phone} onChange={(e) => set("phone", e.target.value)} autoComplete="tel" /></div>
						<div className="gw-form__field"><label className="gw-form__label">Number of passengers</label><input type="number" min={1} max={60} value={f.pax} onChange={(e) => set("pax", e.target.value)} /></div>
						<div className="gw-form__field"><label className="gw-form__label">Pickup location</label><input value={f.pickup} onChange={(e) => set("pickup", e.target.value)} placeholder="e.g. Matipane bus stop" /></div>
						<div className="gw-form__field"><label className="gw-form__label">Email (optional)</label><input type="email" value={f.email} onChange={(e) => set("email", e.target.value)} /></div>
						<div className="gw-form__field"><label className="gw-form__label">Preferred contact</label>
							<select value={f.contact} onChange={(e) => set("contact", e.target.value)}>
								<option>WhatsApp</option>
								<option>Phone call</option>
							</select>
						</div>
					</div>
				</div>
			)}

			{/* step 3 — summary */}
			{step === 3 && (
				<div className="gw-survey__panel">
					<h3>Booking summary</h3>
					<ul className="gw-review__list" style={{ marginTop: "0.6rem" }}>
						<li><strong>Event:</strong> {ev.title}</li>
						<li><strong>Experience:</strong> {experience}</li>
						{route && <li><strong>Route:</strong> {route.name}{route.note ? ` (${route.note})` : ""}</li>}
						<li><strong>Passengers:</strong> {pax}</li>
						{unit != null && <li><strong>Price per person:</strong> {fmt(unit)}</li>}
						<li><strong>Estimated total:</strong> {total != null ? fmt(total) : "To be confirmed"}</li>
						<li><strong>Contact:</strong> {f.name} · {f.phone} · {f.contact}</li>
					</ul>
					<p className="gw-form__hint" style={{ marginTop: "0.8rem" }}>This is a booking request — your seat is confirmed once we confirm availability and you accept the quote.</p>
				</div>
			)}

			<div className="gw-form__actions" style={{ marginTop: "1.2rem" }}>
				{step > 0 && <button type="button" className="gw-btn gw-btn--outline gw-btn--outline-dark" onClick={back}>← Back</button>}
				{step < 3 ? (
					<button type="button" className="gw-form__submit" onClick={next}>Next →</button>
				) : (
					<button type="button" className="gw-form__submit" disabled={status === "sending"} onClick={submit}>
						{status === "sending" ? "Sending…" : "Continue to booking"}
					</button>
				)}
			</div>
		</div>
	);
}
