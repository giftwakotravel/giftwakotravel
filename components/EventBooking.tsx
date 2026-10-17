"use client";

import { useState } from "react";

interface Route {
	name: string;
	pickup: string | null;
	time: string | null;
	return: boolean;
	transport_type: string | null;
	price: number | null;
	seats: number | null;
	provider: string | null;
	status: string | null;
}

interface Ticket {
	type: string;
	price: number | null;
	quantity: number | null;
}

export interface EvDetail {
	id: number;
	title: string;
	location: string | null;
	venue: string | null;
	event_date: string | null;
	price: number | null;
	tickets: Ticket[] | null;
	routes: Route[] | null;
	transport_offered: boolean | null;
	bookings_enabled: boolean | null;
	allow_ticket_only: boolean | null;
	allow_transport_only: boolean | null;
	allow_ticket_transport: boolean | null;
	max_pax: number | null;
	confirm_method: string | null;
	whatsapp_number: string | null;
}

type Exp = "ticket" | "transport" | "both";

const fmt = (n: number) => `R${n.toLocaleString("en-ZA")}`;

export default function EventBooking({ ev }: { ev: EvDetail }) {
	const [step, setStep] = useState(0);
	const [exp, setExp] = useState<Exp | null>(null);
	const [ticket, setTicket] = useState<Ticket | null>(null);
	const [route, setRoute] = useState<Route | null>(null);
	const [f, setF] = useState({ name: "", phone: "", email: "", pax: "1", pickup: "", contact: "WhatsApp" });
	const [errors, setErrors] = useState<string[]>([]);
	const [status, setStatus] = useState<"idle" | "sending" | "sent">("idle");
	const [ref, setRef] = useState("");
	const [startedAt] = useState(() => Date.now());

	const set = (k: keyof typeof f, v: string) => setF((p) => ({ ...p, [k]: v }));

	const tickets = ev.tickets ?? [];
	const routes = (ev.routes ?? []).filter((r) => (r.status ?? "Active") === "Active");
	const canTicket = tickets.length > 0 || ev.price != null;
	const canTransport = ev.transport_offered !== false && routes.length > 0;

	const options: { key: Exp; label: string; sub: string }[] = [
		...(canTicket && ev.allow_ticket_only !== false ? [{ key: "ticket" as Exp, label: "Ticket only", sub: "Attend the event" }] : []),
		...(canTransport && ev.allow_transport_only !== false ? [{ key: "transport" as Exp, label: "Transport only", sub: "Travel to and from the event" }] : []),
		...(canTicket && canTransport && ev.allow_ticket_transport !== false ? [{ key: "both" as Exp, label: "Ticket & transport", sub: "Book transport and get event tickets" }] : []),
	];

	const hasTickets = exp !== "transport";
	const hasTransport = exp !== "ticket";
	const pickTicket = hasTickets && tickets.length > 1;
	const maxPax = ev.max_pax ?? 8;
	const pax = Math.max(1, Math.min(maxPax, Number(f.pax) || 1));

	// steps: 0 exp · 1 ticket type (if needed) · 2 route (if transport) · 3 details · 4 summary
	const seq: string[] = ["exp"];
	if (pickTicket) seq.push("ticket");
	if (hasTransport) seq.push("route");
	seq.push("details", "summary");
	const cur = seq[step] ?? "exp";

	const ticketPrice = tickets.length === 1 ? tickets[0] : ticket;
	const unit: number | null =
		exp === "ticket" ? ticketPrice?.price ?? ev.price ?? null
		: exp === "transport" ? route?.price ?? null
		: exp === "both" && (ticketPrice?.price ?? ev.price) != null && route?.price != null
			? (ticketPrice?.price ?? ev.price)! + route.price
			: null;
	const total = unit != null ? unit * pax : null;

	const next = () => {
		const errs: string[] = [];
		if (cur === "exp" && !exp) errs.push("Please choose an experience");
		if (cur === "ticket" && !ticket) errs.push("Please choose a ticket type");
		if (cur === "route" && !route) errs.push("Please choose a route");
		if (cur === "details") {
			if (!f.name.trim()) errs.push("Full name is required");
			if (!f.phone.trim()) errs.push("Phone number is required");
			if (hasTransport && !f.pickup.trim()) errs.push("Pickup location is required");
		}
		setErrors(errs);
		if (!errs.length) { setStep((s) => s + 1); window.scrollTo({ top: 0 }); }
	};
	const back = () => { setErrors([]); setStep((s) => Math.max(0, s - 1)); };

	async function submit() {
		setStatus("sending");
		const fd = new FormData();
		fd.set("gw_ts", String(startedAt));
		fd.set("full_name", f.name);
		fd.set("phone", f.phone);
		fd.set("email", f.email.includes("@") ? f.email : "eventbooking@giftwakotravel.co.za");
		fd.set("contact_method", f.contact || ev.confirm_method || "WhatsApp");
		fd.set("departure_location", f.pickup || route?.name || "Not specified");
		fd.set("destination_country", "South Africa");
		fd.set("destination_area", `${ev.title}${ev.venue || ev.location ? ` — ${ev.venue ?? ev.location}` : ""}`);
		fd.set("trip_type", "Other");
		const expLabel = exp === "ticket" ? `Ticket — ${ticketPrice?.type ?? "General"}` : exp === "transport" ? `Transport — ${route?.name}` : `Ticket + transport — ${ticketPrice?.type ?? "General"} + ${route?.name}`;
		fd.set("trip_type_other", `Event booking — ${ev.title} (${expLabel})`);
		if (ev.event_date) fd.set("departure_date", ev.event_date);
		fd.set("date_flexibility", "Exact dates");
		fd.set("adults", String(pax));
		fd.set("children", "0");
		fd.set("budget", "Not sure yet");
		fd.set("budget_basis", "For the whole group");
		fd.set("consent", "yes");
		fd.set("notes", [
			`EVENT BOOKING — ${ev.title}`,
			exp !== "transport" && `Ticket: ${ticketPrice?.type ?? "Admission"}${ticketPrice?.price ? ` (${fmt(ticketPrice.price)} pp)` : ""}`,
			route && `Route: ${route.name}${route.pickup ? ` — ${route.pickup}` : ""}${route.time ? ` at ${route.time}` : ""} (${route.price ? fmt(route.price) + " pp" : "price TBC"})`,
			route?.transport_type && `Transport type: ${route.transport_type}`,
			`Passengers: ${pax}`,
			`Pickup: ${f.pickup || "—"}`,
			total != null ? `Estimated total: ${fmt(total)}` : "Estimated total: to be confirmed with the organiser",
			`Preferred contact: ${f.contact}`,
			"Status: Pending (booking request — confirm with organiser)",
		].filter(Boolean).join("\n"));
		try {
			const res = await fetch("/api/trip-request", { method: "POST", body: fd });
			const json = await res.json();
			if (json.ok) { setRef(json.ref ?? ""); setStatus("sent"); window.scrollTo({ top: 0 }); return; }
		} catch { /* fallthrough */ }
		setErrors(["Could not submit right now — please WhatsApp us on 070 617 8269."]);
		setStatus("idle");
	}

	/* bookings disabled */
	if (ev.bookings_enabled === false) {
		return (
			<div className="gw-survey__panel">
				<h3>Bookings are closed</h3>
				<p className="gw-small">Online bookings for this event are not open right now.
					<a href={`https://wa.me/${(ev.whatsapp_number ?? "27706178269").replace(/\D/g, "")}`}> WhatsApp us</a> if you have a question.</p>
			</div>
		);
	}

	if (status === "sent") {
		return (
			<div className="gw-form__success">
				<h2>Booking request received!</h2>
				<p>Your request is <strong>Pending</strong> — we will confirm ticket availability and pricing with the organiser, then contact you.</p>
				{ref && <p><strong>Reference: {ref}</strong></p>}
				<p><strong>{ev.title}</strong>{ticketPrice ? ` — ${ticketPrice.type}` : ""}{route ? ` · ${route.name}` : ""} · {pax} passenger{pax === 1 ? "" : "s"}</p>
			</div>
		);
	}

	if (options.length === 0) {
		return (
			<div className="gw-survey__panel">
				<p className="gw-small">Booking options are being finalised — check back soon or WhatsApp us.</p>
			</div>
		);
	}

	return (
		<div className="gw-evbook">
			{errors.length > 0 && (
				<div className="gw-form__errors" role="alert"><ul>{errors.map((e) => <li key={e}>{e}</li>)}</ul></div>
			)}

			{cur === "exp" && (
				<div className="gw-survey__panel">
					<h3>Choose your experience</h3>
					<div className="gw-survey__cards" style={{ marginTop: "0.8rem" }}>
						{options.map((x) => (
							<button type="button" key={x.key} className={`gw-survey__card${exp === x.key ? " is-selected" : ""}`} onClick={() => { setExp(x.key); setTicket(null); setRoute(null); }}>
								<span className="gw-evbook__icn">{x.key === "ticket" ? "🎫" : x.key === "transport" ? "🚐" : "🎫+🚐"}</span>
								{x.label}
								<small>{x.sub}</small>
							</button>
						))}
					</div>
					<p className="gw-form__hint" style={{ marginTop: "0.8rem" }}>Prices and availability are confirmed with the organiser before we take a booking — nothing is paid online.</p>
				</div>
			)}

			{cur === "ticket" && (
				<div className="gw-survey__panel">
					<h3>Choose your ticket</h3>
					<div className="gw-survey__cards" style={{ marginTop: "0.8rem" }}>
						{tickets.map((t) => (
							<button type="button" key={t.type} className={`gw-survey__card${ticket?.type === t.type ? " is-selected" : ""}`} onClick={() => setTicket(t)}>
								{t.type}
								<small>{t.price != null ? `${fmt(t.price)} per person` : "Price on request"}{t.quantity != null ? ` · ${t.quantity} available` : ""}</small>
							</button>
						))}
					</div>
				</div>
			)}

			{cur === "route" && (
				<div className="gw-survey__panel">
					<h3>Choose your transport route</h3>
					<div className="gw-survey__cards" style={{ marginTop: "0.8rem" }}>
						{routes.map((r) => (
							<button type="button" key={r.name} className={`gw-survey__card${route?.name === r.name ? " is-selected" : ""}`} onClick={() => { setRoute(r); if (!f.pickup) set("pickup", r.pickup || r.name); }}>
								{r.name}
								<small>
									{[r.pickup, r.time, r.transport_type].filter(Boolean).join(" · ")}
									{r.price != null ? ` — ${fmt(r.price)} pp` : " — price on request"}
									{r.seats != null ? ` · ${r.seats} seats` : ""}
								</small>
							</button>
						))}
					</div>
					<div className="gw-form__grid" style={{ marginTop: "1rem" }}>
						<div className="gw-form__field"><label className="gw-form__label">Pickup point</label><input value={f.pickup} onChange={(e) => set("pickup", e.target.value)} placeholder="Where should we pick you up?" /></div>
						<div className="gw-form__field"><label className="gw-form__label">Passengers (max {maxPax})</label><input type="number" min={1} max={maxPax} value={f.pax} onChange={(e) => set("pax", e.target.value)} /></div>
					</div>
				</div>
			)}

			{cur === "details" && (
				<div className="gw-survey__panel">
					<h3>Passenger details</h3>
					<div className="gw-form__grid" style={{ marginTop: "0.8rem" }}>
						<div className="gw-form__field"><label className="gw-form__label">Full name *</label><input value={f.name} onChange={(e) => set("name", e.target.value)} autoComplete="name" /></div>
						<div className="gw-form__field"><label className="gw-form__label">Phone number *</label><input type="tel" value={f.phone} onChange={(e) => set("phone", e.target.value)} autoComplete="tel" /></div>
						<div className="gw-form__field"><label className="gw-form__label">Number of passengers (max {maxPax})</label><input type="number" min={1} max={maxPax} value={f.pax} onChange={(e) => set("pax", e.target.value)} /></div>
						<div className="gw-form__field"><label className="gw-form__label">Pickup location</label><input value={f.pickup} onChange={(e) => set("pickup", e.target.value)} /></div>
						<div className="gw-form__field"><label className="gw-form__label">Email (optional)</label><input type="email" value={f.email} onChange={(e) => set("email", e.target.value)} /></div>
						<div className="gw-form__field"><label className="gw-form__label">Preferred contact</label>
							<select value={f.contact} onChange={(e) => set("contact", e.target.value)}>
								<option>WhatsApp</option><option>Phone call</option><option>Email</option>
							</select>
						</div>
					</div>
				</div>
			)}

			{cur === "summary" && (
				<div className="gw-survey__panel">
					<h3>Booking summary</h3>
					<ul className="gw-review__list" style={{ marginTop: "0.6rem" }}>
						<li><strong>Event:</strong> {ev.title}</li>
						{ticketPrice && <li><strong>Ticket:</strong> {ticketPrice.type}{ticketPrice.price ? ` — ${fmt(ticketPrice.price)} pp` : ""}</li>}
						{route && <li><strong>Route:</strong> {route.name}{route.time ? ` · ${route.time}` : ""}{route.price ? ` — ${fmt(route.price)} pp` : ""}</li>}
						<li><strong>Passengers:</strong> {pax}</li>
						{unit != null && <li><strong>Price per person:</strong> {fmt(unit)}</li>}
						<li><strong>Estimated total:</strong> {total != null ? fmt(total) : "To be confirmed"}</li>
						<li><strong>Contact:</strong> {f.name} · {f.phone} · {f.contact}</li>
					</ul>
					<p className="gw-form__hint" style={{ marginTop: "0.8rem" }}>Booking request — your spot is confirmed once we verify availability and you accept the quote.</p>
				</div>
			)}

			<div className="gw-form__actions" style={{ marginTop: "1.2rem" }}>
				{step > 0 && <button type="button" className="gw-btn gw-btn--outline gw-btn--outline-dark" onClick={back}>← Back</button>}
				{cur !== "summary" ? (
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
