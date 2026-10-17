"use client";

import Link from "next/link";
import { useState } from "react";

const SERVICES = [
	"All", "Tours & Day Trips", "Getaways & Holidays", "Transport", "Accommodation",
	"Airways", "Complete Trips", "Groups", "Events",
];

const EXPERIENCES: Record<string, string[]> = {
	"Tours & Day Trips": ["Wildlife & Safari", "Sightseeing", "Cultural Tours", "Adventure Activities", "City Tours", "Other"],
	"Getaways & Holidays": ["Weekend Getaway", "Family Holiday", "Romantic Getaway", "Beach Holiday", "International Holiday", "Other"],
	Transport: ["Airport Transfers", "Private Transfers", "Shuttle Services", "Bus Transport", "Vehicle Hire", "Other"],
	Accommodation: ["Hotels", "Lodges", "Guesthouses", "Resorts", "Self-Catering", "Other"],
	Airways: ["Domestic Flights", "International Flights", "Return Flights", "One-Way Flights", "Other"],
	"Complete Trips": ["All-Inclusive Holiday", "Flight + Accommodation", "Transport + Accommodation", "Tour + Transport", "Custom Travel Package"],
	Groups: ["School Trips", "Corporate Trips", "Family Groups", "Church Groups", "Tour Groups", "Other"],
	Events: ["Weddings", "Conferences", "Corporate Events", "Festivals", "Special Occasions", "Other"],
};

const BUDGETS = [
	"Under R2,000", "R2,000–R5,000", "R5,001–R10,000", "R10,001–R20,000",
	"R20,001–R50,000", "Above R50,000", "Not sure yet",
];
const ACCOM_PREF = ["Budget accommodation", "Guesthouse or B&B", "3-star hotel", "4-star hotel", "5-star or luxury", "Self-catering", "Not sure yet"];
const TRANSPORT_PREF = ["Bus or coach", "Private vehicle", "Car rental", "Flights", "Airport transfers", "Recommend the best option"];
const CONTACT_METHODS = ["WhatsApp", "Phone call", "Email"];

const STEP_TITLES = ["Choose your service", "Choose your experience", "Your trip", "Budget & preferences", "Your contact details", "Review your request"];

type Vals = Record<string, string>;

export default function ServiceSurvey() {
	const [step, setStep] = useState(0);
	const [vals, setVals] = useState<Vals>({});
	const [errors, setErrors] = useState<string[]>([]);
	const [status, setStatus] = useState<"idle" | "sending" | "sent">("idle");
	const [ref, setRef] = useState("");
	const [startedAt] = useState(() => Date.now());

	const set = (k: string, v: string) => setVals((p) => ({ ...p, [k]: v }));
	const v = (k: string) => vals[k] ?? "";

	const needsExp = v("service") && v("service") !== "All";

	const validateStep = (): boolean => {
		const errs: string[] = [];
		if (step === 0 && !v("service")) errs.push("Please choose a service");
		if (step === 1 && !v("experience")) errs.push("Please choose an experience");
		if (step === 4) {
			if (!v("full_name").trim()) errs.push("Full name is required");
			if (!v("email").includes("@")) errs.push("A valid email address is required");
			if (!v("phone").trim()) errs.push("Phone number is required");
		}
		if (step === 5 && v("consent") !== "yes") errs.push("Please agree to the privacy terms");
		setErrors(errs);
		return errs.length === 0;
	};

	const next = () => {
		if (!validateStep()) return;
		setStep((s) => {
			// "All" has no experience list — skip that step
			if (s === 0 && v("service") === "All") return 2;
			return Math.min(s + 1, STEP_TITLES.length - 1);
		});
		window.scrollTo({ top: 0, behavior: "smooth" });
	};
	const back = () => {
		setErrors([]);
		setStep((s) => (s === 2 && v("service") === "All" ? 0 : Math.max(0, s - 1)));
	};

	async function submit() {
		if (!validateStep()) return;
		setStatus("sending");
		const fd = new FormData();
		fd.set("gw_ts", String(startedAt));
		fd.set("full_name", v("full_name"));
		fd.set("email", v("email"));
		fd.set("phone", v("phone"));
		fd.set("whatsapp", v("whatsapp"));
		fd.set("contact_method", v("contact_method") || "WhatsApp");
		fd.set("departure_location", v("departure_location") || "Not specified");
		fd.set("destination_country", "South Africa");
		fd.set("destination_area", v("destination"));
		fd.set("trip_type", "Other");
		fd.set("trip_type_other", needsExp ? `${v("service")} — ${v("experience")}` : v("service") || "General enquiry");
		if (v("departure_date")) fd.set("departure_date", v("departure_date"));
		if (v("return_date")) fd.set("return_date", v("return_date"));
		if (v("nights")) fd.set("nights", v("nights"));
		fd.set("date_flexibility", v("departure_date") ? "Exact dates" : "Not decided yet");
		fd.set("adults", v("adults") || "1");
		fd.set("children", v("children") || "0");
		if (v("rooms")) fd.set("rooms", v("rooms"));
		fd.set("special_requirements", v("special_requirements"));
		fd.set("budget", v("budget") || "Not sure yet");
		fd.set("budget_basis", "For the whole group");
		if (v("accommodation")) fd.set("accommodation", v("accommodation"));
		if (v("transport")) fd.set("transport", v("transport"));
		const noteBits = [
			`Via service chooser: ${needsExp ? `${v("service")} — ${v("experience")}` : v("service") || "General"}`,
			v("company") && `Company/organisation: ${v("company")}`,
			v("package_pref") && `Preferred package: ${v("package_pref")}`,
			v("notes") && v("notes"),
		].filter(Boolean);
		fd.set("notes", noteBits.join("\n"));
		fd.set("consent", "yes");
		try {
			const res = await fetch("/api/trip-request", { method: "POST", body: fd });
			const json = await res.json();
			if (json.ok) {
				setRef(json.ref ?? "");
				setStatus("sent");
				window.scrollTo({ top: 0, behavior: "smooth" });
			} else {
				setErrors(["Could not send right now — please WhatsApp us on 070 617 8269."]);
				setStatus("idle");
			}
		} catch {
			setErrors(["Could not send right now — please WhatsApp us on 070 617 8269."]);
			setStatus("idle");
		}
	}

	/* ---------- step 7: success ---------- */
	if (status === "sent") {
		return (
			<div className="gw-form__success" style={{ maxWidth: "42rem", margin: "0 auto" }}>
				<h2>Thank you for choosing GiftWako Travel!</h2>
				<p>
					Your travel request has been submitted successfully. Our team will review your requirements
					and contact you regarding availability, pricing and the next steps.
				</p>
				{ref && <p><strong>Your request reference: {ref}</strong></p>}
				<div className="gw-review">
					<h4>Your request</h4>
					<ul className="gw-review__list">
						<li><strong>Service:</strong> {needsExp ? `${v("service")} — ${v("experience")}` : v("service")}</li>
						{v("destination") && <li><strong>To:</strong> {v("destination")}</li>}
						{v("departure_date") && <li><strong>When:</strong> {v("departure_date")}{v("return_date") ? ` → ${v("return_date")}` : ""}</li>}
						<li><strong>Travellers:</strong> {v("adults") || 1} adults{v("children") && v("children") !== "0" ? `, ${v("children")} children` : ""}</li>
						<li><strong>Contact:</strong> {v("full_name")} · {v("email")}</li>
					</ul>
				</div>
				<p>
					Need us sooner? WhatsApp us on{" "}
					<a href="https://wa.me/27706178269">070 617 8269</a> or email{" "}
					<a href="mailto:info@giftwakotravel.co.za">info@giftwakotravel.co.za</a>.
				</p>
				<Link className="gw-btn gw-btn--gold" href="/">Return to home</Link>
			</div>
		);
	}

	return (
		<div className="gw-survey">
			<ol className="gw-wiz" aria-label="Form progress">
				{STEP_TITLES.map((t, i) => (
					<li key={t} className={i === step ? "is-current" : i < step ? "is-done" : ""} aria-current={i === step ? "step" : undefined}>
						<span className="gw-wiz__dot">{i + 1}</span>
						<span className="gw-wiz__label">{t}</span>
					</li>
				))}
			</ol>
			<p className="gw-wiz__count">Step {step + 1} of {STEP_TITLES.length} — {STEP_TITLES[step]}</p>

			{errors.length > 0 && (
				<div className="gw-form__errors" role="alert">
					<ul>{errors.map((e) => <li key={e}>{e}</li>)}</ul>
				</div>
			)}

			{/* STEP 1 — service */}
			{step === 0 && (
				<div className="gw-survey__step">
					<h2>What are you looking for?</h2>
					<p className="gw-survey__lead">Select the service you need.</p>
					<div className="gw-survey__panel gw-survey__cards">
						{SERVICES.map((s) => (
							<button
								type="button"
								key={s}
								className={`gw-survey__card${v("service") === s ? " is-selected" : ""}`}
								onClick={() => { set("service", s); set("experience", ""); }}
							>{s}</button>
						))}
					</div>
				</div>
			)}

			{/* STEP 2 — experience */}
			{step === 1 && (
				<div className="gw-survey__step">
					<h2>What kind of {v("service").toLowerCase()}?</h2>
					<p className="gw-survey__lead">Pick the option closest to what you need.</p>
					<div className="gw-survey__panel gw-survey__cards">
						{(EXPERIENCES[v("service")] ?? []).map((x) => (
							<button
								type="button"
								key={x}
								className={`gw-survey__card${v("experience") === x ? " is-selected" : ""}`}
								onClick={() => set("experience", x)}
							>{x}</button>
						))}
					</div>
				</div>
			)}

			{/* STEP 3 — trip details */}
			{step === 2 && (
				<div className="gw-survey__step">
					<h2>Tell us about your trip</h2>
					<p className="gw-survey__lead">Fill in what you know — everything here is optional.</p>
					<div className="gw-survey__panel"><div className="gw-form__grid">
						<Field label="Departure location"><input value={v("departure_location")} onChange={(e) => set("departure_location", e.target.value)} placeholder="e.g. Tzaneen, Polokwane" /></Field>
						<Field label="Destination"><input value={v("destination")} onChange={(e) => set("destination", e.target.value)} placeholder="e.g. Cape Town, Kruger" /></Field>
						<Field label="Departure date"><input type="date" value={v("departure_date")} onChange={(e) => set("departure_date", e.target.value)} /></Field>
						<Field label="Return date (if applicable)"><input type="date" value={v("return_date")} onChange={(e) => set("return_date", e.target.value)} min={v("departure_date") || undefined} /></Field>
						<Field label="Number of adults"><input type="number" min={1} max={60} value={v("adults")} onChange={(e) => set("adults", e.target.value)} placeholder="1" /></Field>
						<Field label="Number of children"><input type="number" min={0} max={30} value={v("children")} onChange={(e) => set("children", e.target.value)} placeholder="0" /></Field>
						<Field label="Number of rooms (if applicable)"><input type="number" min={0} max={30} value={v("rooms")} onChange={(e) => set("rooms", e.target.value)} /></Field>
						<Field label="Number of nights (if applicable)"><input type="number" min={0} max={60} value={v("nights")} onChange={(e) => set("nights", e.target.value)} /></Field>
					</div></div>
				</div>
			)}

			{/* STEP 4 — budget & preferences */}
			{step === 3 && (
				<div className="gw-survey__step">
					<h2>Help us plan your trip</h2>
					<p className="gw-survey__lead">All optional — skip anything you are not sure about.</p>
					<div className="gw-survey__panel"><div className="gw-form__grid">
						<Field label="Estimated budget (ZAR)">
							<select value={v("budget")} onChange={(e) => set("budget", e.target.value)}>
								<option value="">Select…</option>
								{BUDGETS.map((o) => <option key={o}>{o}</option>)}
							</select>
						</Field>
						<Field label="Preferred accommodation standard">
							<select value={v("accommodation")} onChange={(e) => set("accommodation", e.target.value)}>
								<option value="">Select…</option>
								{ACCOM_PREF.map((o) => <option key={o}>{o}</option>)}
							</select>
						</Field>
						<Field label="Preferred transport type">
							<select value={v("transport")} onChange={(e) => set("transport", e.target.value)}>
								<option value="">Select…</option>
								{TRANSPORT_PREF.map((o) => <option key={o}>{o}</option>)}
							</select>
						</Field>
						<Field label="Preferred travel package"><input value={v("package_pref")} onChange={(e) => set("package_pref", e.target.value)} placeholder="e.g. Sun City 2-night package" /></Field>
					</div>
					<div className="gw-form__field gw-form__field--full" style={{ marginTop: "1rem" }}>
						<span className="gw-form__label">Special requirements</span>
						<textarea rows={2} value={v("special_requirements")} onChange={(e) => set("special_requirements", e.target.value)} placeholder="Accessibility, dietary, anything else" />
					</div>
					<div className="gw-form__field gw-form__field--full">
						<span className="gw-form__label">Additional information</span>
						<textarea rows={2} value={v("notes")} onChange={(e) => set("notes", e.target.value)} />
					</div></div>
				</div>
			)}

			{/* STEP 5 — contact */}
			{step === 4 && (
				<div className="gw-survey__step">
					<h2>How can we reach you?</h2>
					<p className="gw-survey__lead">We only need your name and one way to reach you.</p>
					<div className="gw-survey__panel"><div className="gw-form__grid">
						<Field label="Full name" req><input value={v("full_name")} onChange={(e) => set("full_name", e.target.value)} autoComplete="name" /></Field>
						<Field label="Email address" req><input type="email" value={v("email")} onChange={(e) => set("email", e.target.value)} autoComplete="email" /></Field>
						<Field label="Phone number" req><input type="tel" value={v("phone")} onChange={(e) => set("phone", e.target.value)} autoComplete="tel" /></Field>
						<Field label="WhatsApp number"><input type="tel" value={v("whatsapp")} onChange={(e) => set("whatsapp", e.target.value)} placeholder="If different" /></Field>
						<Field label="Company or organisation"><input value={v("company")} onChange={(e) => set("company", e.target.value)} /></Field>
						<Field label="Preferred contact method">
							<select value={v("contact_method")} onChange={(e) => set("contact_method", e.target.value)}>
								<option value="">Select…</option>
								{CONTACT_METHODS.map((o) => <option key={o}>{o}</option>)}
							</select>
						</Field>
					</div></div>
				</div>
			)}

			{/* STEP 6 — review */}
			{step === 5 && (
				<div className="gw-survey__step">
					<h2>Review your travel plans</h2>
					<div className="gw-review">
						<ul className="gw-review__list">
							<Row k="Service" v={needsExp ? `${v("service")} — ${v("experience")}` : v("service")} edit={() => setStep(0)} />
							{v("departure_location") && <Row k="From" v={v("departure_location")} edit={() => setStep(2)} />}
							{v("destination") && <Row k="To" v={v("destination")} edit={() => setStep(2)} />}
							{(v("departure_date") || v("return_date")) && <Row k="Dates" v={`${v("departure_date") || "?"} → ${v("return_date") || "open"}`} edit={() => setStep(2)} />}
							<Row k="Travellers" v={`${v("adults") || 1} adults · ${v("children") || 0} children${v("rooms") ? ` · ${v("rooms")} rooms` : ""}${v("nights") ? ` · ${v("nights")} nights` : ""}`} edit={() => setStep(2)} />
							{v("budget") && <Row k="Budget" v={v("budget")} edit={() => setStep(3)} />}
							{(v("special_requirements") || v("notes")) && <Row k="Notes" v={[v("special_requirements"), v("notes")].filter(Boolean).join(" — ")} edit={() => setStep(3)} />}
							<Row k="Contact" v={`${v("full_name")} · ${v("email")} · ${v("phone")}`} edit={() => setStep(4)} />
						</ul>
					</div>
					<div className="gw-form__consent" style={{ marginTop: "1rem" }}>
						<label className="gw-form__check">
							<input type="checkbox" checked={v("consent") === "yes"} onChange={(e) => set("consent", e.target.checked ? "yes" : "")} />{" "}
							I agree that GiftWako Travel may use these details to plan and quote for my trip, as described in the <Link href="/privacy/">privacy policy</Link>. *
						</label>
					</div>
				</div>
			)}

			{/* nav */}
			<div className="gw-form__actions" style={{ marginTop: "1.5rem" }}>
				{step > 0 && (
					<button type="button" className="gw-btn gw-btn--outline gw-btn--outline-dark" onClick={back}>
						← Back
					</button>
				)}
				{step < 5 ? (
					<button type="button" className="gw-form__submit" onClick={next}>Next →</button>
				) : (
					<button type="button" className="gw-form__submit" disabled={status === "sending"} onClick={submit}>
						{status === "sending" ? "Sending…" : "Submit trip request"}
					</button>
				)}
				<p className="gw-form__hint">Nothing is booked until you accept a written quote.</p>
			</div>
		</div>
	);
}

function Field({ label, req, children }: { label: string; req?: boolean; children: React.ReactNode }) {
	return (
		<div className="gw-form__field">
			<span className="gw-form__label">{label}{req ? <span className="gw-form__req" aria-hidden="true"> *</span> : null}</span>
			{children}
		</div>
	);
}

function Row({ k, v, edit }: { k: string; v: string; edit: () => void }) {
	return (
		<li>
			<strong>{k}:</strong> {v}
			<button type="button" className="gw-review__edit" onClick={edit}>Edit</button>
		</li>
	);
}
