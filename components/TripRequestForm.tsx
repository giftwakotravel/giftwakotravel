"use client";

import { useEffect, useState } from "react";

const COUNTRIES = [
	"South Africa", "Botswana", "Zimbabwe", "Mozambique", "Namibia", "Eswatini", "Lesotho",
	"Zambia", "Malawi", "Mauritius", "United Kingdom", "United Arab Emirates", "United States", "Other",
];

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

type Errors = Record<string, string>;
type Vals = Record<string, string | string[]>;

const FIELD_IDS: Record<string, string> = {};
function fid(name: string) {
	if (!FIELD_IDS[name]) FIELD_IDS[name] = `gw-trip-${name.replace(/_/g, "-")}`;
	return FIELD_IDS[name];
}

function todayISO() {
	const d = new Date();
	return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

const STEP_TITLES = [
	"Your details",
	"Where do you want to go?",
	"Travel dates",
	"Travellers",
	"Budget and preferences",
	"Anything else?",
];

// required fields per step — checked client-side before advancing
const STEP_FIELDS: { fields: string[]; check?: (v: (n: string) => string, n: number) => string | null }[] = [
	{ fields: ["full_name", "email", "phone", "contact_method"], check: (v) => (v("email") && !v("email").includes("@") ? "Email address must be valid" : null) },
	{ fields: ["departure_location", "destination_country", "trip_type"], check: (v) => (v("trip_type") === "Other" && !v("trip_type_other").trim() ? "Describe the trip" : null) },
	{ fields: ["departure_date", "date_flexibility"], check: (v) => (v("departure_date") && v("departure_date") < todayISO() ? "Departure date must be today or later" : null) },
	{ fields: ["adults"], check: (v, n) => (n > 0 ? null : null) },
	{ fields: ["budget", "budget_basis"] },
	{ fields: ["consent"] },
];

const LABELS: Record<string, string> = {
	full_name: "Full name is required",
	email: "Email address is required",
	phone: "Phone number is required",
	contact_method: "Preferred contact method is required",
	departure_location: "Departure location is required",
	destination_country: "Destination country is required",
	trip_type: "Type of trip is required",
	departure_date: "Departure date is required",
	date_flexibility: "Please choose a date flexibility",
	adults: "At least 1 adult is required",
	budget: "Please choose an approximate budget",
	budget_basis: "Please choose a budget basis",
	consent: "Please agree to the privacy terms",
};

const FIELD_STEP: Record<string, number> = {};
STEP_FIELDS.forEach((s, i) => s.fields.forEach((f) => (FIELD_STEP[f] = i)));
FIELD_STEP.children_ages = 3;
FIELD_STEP.trip_type_other = 1;

export default function TripRequestForm() {
	const [vals, setVals] = useState<Vals>({ destination_country: "South Africa", adults: "1", children: "0" });
	const [errors, setErrors] = useState<Errors>({});
	const [status, setStatus] = useState<"idle" | "sending" | "sent" | "mail-error">("idle");
	const [startedAt] = useState(() => Date.now());
	const [childrenAges, setChildrenAges] = useState<string[]>([]);
	const [step, setStep] = useState(0);

	// Prefill from search-bar navigation, e.g. /plan-a-trip/?destination_area=…&departure_date=…
	useEffect(() => {
		const q = new URLSearchParams(window.location.search);
		const known = [
			"trip_type", "destination_area", "destination_country", "departure_location",
			"departure_date", "return_date", "nights", "adults", "children", "rooms",
		];
		const prefill: Vals = {};
		known.forEach((k) => {
			const val = q.get(k);
			if (val !== null && val !== "") prefill[k] = val;
		});
		if (Object.keys(prefill).length > 0) setVals((v) => ({ ...v, ...prefill }));
	}, []);

	const set = (name: string, value: string) => setVals((v) => ({ ...v, [name]: value }));
	const v = (name: string) => (vals[name] as string) ?? "";

	const nChildren = Math.max(0, Math.min(30, parseInt(v("children") || "0", 10) || 0));

	const setChildAge = (i: number, val: string) => {
		setChildrenAges((a) => {
			const next = [...a];
			next[i] = val;
			return next;
		});
	};

	const validateStep = (s: number): boolean => {
		const errs: Errors = {};
		STEP_FIELDS[s].fields.forEach((f) => {
			if (f === "adults") {
				if (!(parseInt(v(f) || "0", 10) >= 1)) errs[f] = LABELS[f];
			} else if (!v(f).trim()) {
				errs[f] = LABELS[f];
			}
		});
		const extra = STEP_FIELDS[s].check?.(v, nChildren);
		if (extra) errs[STEP_FIELDS[s].fields[0]] = extra;
		setErrors(errs);
		if (Object.keys(errs).length > 0) {
			setTimeout(() => document.querySelector(".gw-form__errors")?.scrollIntoView({ behavior: "smooth", block: "center" }), 50);
			return false;
		}
		return true;
	};

	const next = () => { if (validateStep(step)) setStep((s) => Math.min(s + 1, STEP_TITLES.length - 1)); };
	const prev = () => { setErrors({}); setStep((s) => Math.max(s - 1, 0)); };

	async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
		e.preventDefault();
		if (step !== STEP_TITLES.length - 1) { next(); return; }
		if (!validateStep(step)) return;
		setStatus("sending");
		setErrors({});
		const fd = new FormData(e.currentTarget);
		childrenAges.slice(0, nChildren).forEach((a) => fd.append("children_ages[]", a));
		try {
			const res = await fetch("/api/trip-request", { method: "POST", body: fd });
			const json = await res.json();
			if (json.ok) {
				setStatus("sent");
				window.scrollTo({ top: 0, behavior: "smooth" });
			} else if (json.errors) {
				setErrors(json.errors);
				setVals((prev) => ({ ...prev, ...json.vals }));
				// jump back to the step that holds the first invalid field
				const firstKey = Object.keys(json.errors)[0];
				if (firstKey in FIELD_STEP) setStep(FIELD_STEP[firstKey]);
				setStatus("idle");
				setTimeout(() => document.querySelector(".gw-form__errors")?.scrollIntoView({ behavior: "smooth" }), 50);
			} else {
				setStatus("mail-error");
			}
		} catch {
			setStatus("mail-error");
		}
	}

	if (status === "sent") {
		return (
			<div className="gw-form__success" id="trip-request">
				<h2>Thank you. Your trip request is on its way.</h2>
				<p>We will review it and come back to you with a written quote. Nothing is booked until you accept it.</p>
				<p>
					Need us sooner?{" "}
					<a href="https://wa.me/27706178269">WhatsApp us</a> on 070 617 8269.
				</p>
			</div>
		);
	}

	const errKeys = Object.keys(errors);

	return (
		<form className="gw-form gw-trip-form" onSubmit={onSubmit} noValidate>
			{status === "mail-error" && (
				<div className="gw-form__errors" role="alert">
					<p>
						<strong>We could not send your request right now.</strong> Please WhatsApp us on 070 617 8269
						or email <a href="mailto:info@giftwakotravel.co.za">info@giftwakotravel.co.za</a>.
					</p>
				</div>
			)}
			{errKeys.length > 0 && (
				<div className="gw-form__errors" role="alert" tabIndex={-1}>
					<p>
						<strong>Please fix the following:</strong>
					</p>
					<ul>
						{errKeys.map((k) => (
							<li key={k}>
								<a href={`#${fid(k)}`}>{errors[k]}</a>
							</li>
						))}
					</ul>
				</div>
			)}

			<input type="hidden" name="gw_ts" value={startedAt} />
			<div className="gw-form__hp" aria-hidden="true">
				<label>
					Website <input type="text" name="website" tabIndex={-1} autoComplete="off" />
				</label>
			</div>

			{/* step indicator */}
			<ol className="gw-wiz" aria-label="Form progress">
				{STEP_TITLES.map((t, i) => (
					<li key={t} className={i === step ? "is-current" : i < step ? "is-done" : ""} aria-current={i === step ? "step" : undefined}>
						<span className="gw-wiz__dot">{i + 1}</span>
						<span className="gw-wiz__label">{t}</span>
					</li>
				))}
			</ol>
			<p className="gw-wiz__count">Step {step + 1} of {STEP_TITLES.length} — {STEP_TITLES[step]}</p>

			{/* 1 — your details */}
			<fieldset className="gw-form__section" hidden={step !== 0}>
				<legend>
					<span className="gw-form__step">1</span> Your details
				</legend>
				<div className="gw-form__grid">
					<TextInput name="full_name" label="Full name" req errors={errors} value={v("full_name")} onChange={set} autoComplete="name" />
					<TextInput name="email" label="Email address" type="email" req errors={errors} value={v("email")} onChange={set} autoComplete="email" />
					<TextInput name="phone" label="Phone number" type="tel" req errors={errors} value={v("phone")} onChange={set} autoComplete="tel" />
					<TextInput name="whatsapp" label="WhatsApp number" type="tel" errors={errors} value={v("whatsapp")} onChange={set} hint="If different from your phone number" />
					<SelectInput name="contact_method" label="Preferred contact method" req errors={errors} value={v("contact_method")} onChange={set} />
					<TextInput name="country_residence" label="Country of residence" errors={errors} value={v("country_residence")} onChange={set} autoComplete="country-name" list="gw-countries" />
				</div>
			</fieldset>

			{/* 2 — destination */}
			<fieldset className="gw-form__section" hidden={step !== 1}>
				<legend>
					<span className="gw-form__step">2</span> Where do you want to go?
				</legend>
				<div className="gw-form__grid">
					<TextInput name="departure_location" label="Departure location" req errors={errors} value={v("departure_location")} onChange={set} placeholder="e.g. Tzaneen, Polokwane, Gaborone" />
					<TextInput name="destination_country" label="Destination country" req errors={errors} value={v("destination_country")} onChange={set} list="gw-countries" />
					<TextInput name="destination_area" label="Destination / area" errors={errors} value={v("destination_area")} onChange={set} placeholder="e.g. Panorama Route, Cape Town, Sun City" />
					<SelectInput name="trip_type" label="Type of trip" req errors={errors} value={v("trip_type")} onChange={set} />
					{v("trip_type") === "Other" && (
						<TextArea name="trip_type_other" label="Describe the trip" req rows={2} errors={errors} value={v("trip_type_other")} onChange={set} full />
					)}
				</div>
			</fieldset>

			{/* 3 — dates */}
			<fieldset className="gw-form__section" hidden={step !== 2}>
				<legend>
					<span className="gw-form__step">3</span> Travel dates
				</legend>
				<div className="gw-form__grid">
					<TextInput name="departure_date" label="Departure date" type="date" req errors={errors} value={v("departure_date")} onChange={set} min={todayISO()} />
					<TextInput name="return_date" label="Return date" type="date" errors={errors} value={v("return_date")} onChange={set} min={v("departure_date") || todayISO()} />
					<TextInput name="nights" label="Number of nights" type="number" errors={errors} value={v("nights")} onChange={set} min="0" max="60" />
					<SelectInput name="date_flexibility" label="Are your dates flexible?" req errors={errors} value={v("date_flexibility")} onChange={set} />
				</div>
			</fieldset>

			{/* 4 — travellers */}
			<fieldset className="gw-form__section" hidden={step !== 3}>
				<legend>
					<span className="gw-form__step">4</span> Travellers
				</legend>
				<div className="gw-form__grid">
					<TextInput name="adults" label="Adults (18+)" type="number" req errors={errors} value={v("adults")} onChange={set} min="1" max="60" />
					<TextInput name="children" label="Children (0–17)" type="number" errors={errors} value={v("children")} onChange={set} min="0" max="30" />
					{nChildren > 0 && (
						<div className={`gw-form__field gw-form__field--full gw-children-ages${errors.children_ages ? " is-invalid" : ""}`}>
							<span className="gw-form__label">Children’s ages</span>
							<div className="gw-children-ages__inputs">
								{Array.from({ length: nChildren }, (_, i) => (
									<label className="gw-form__agelabel" key={i}>
										Child {i + 1} age
										<input
											type="number"
											name="children_ages[]"
											min={0}
											max={17}
											value={childrenAges[i] ?? ""}
											onChange={(e) => setChildAge(i, e.target.value)}
										/>
									</label>
								))}
							</div>
							<FieldError name="children_ages" errors={errors} />
						</div>
					)}
					<TextInput name="rooms" label="Rooms needed" type="number" errors={errors} value={v("rooms")} onChange={set} min="0" max="30" />
					<TextArea name="special_requirements" label="Special requirements" errors={errors} value={v("special_requirements")} onChange={set} full hint="Accessibility needs, dietary requirements or anything else we should arrange" />
				</div>
			</fieldset>

			{/* 5 — budget */}
			<fieldset className="gw-form__section" hidden={step !== 4}>
				<legend>
					<span className="gw-form__step">5</span> Budget and preferences
				</legend>
				<div className="gw-form__grid">
					<SelectInput name="budget" label="Approximate budget" req errors={errors} value={v("budget")} onChange={set} />
					<div className={`gw-form__field${errors.budget_basis ? " is-invalid" : ""}`}>
						<span className="gw-form__label">
							Budget is <span className="gw-form__req" aria-hidden="true">*</span>
						</span>
						<div className="gw-form__radios" role="radiogroup">
							{OPTIONS.budget_basis.map((opt) => (
								<label className="gw-form__radio" key={opt} htmlFor={`${fid("budget_basis")}-${opt.replace(/\W+/g, "-").toLowerCase()}`}>
									<input
										type="radio"
										id={`${fid("budget_basis")}-${opt.replace(/\W+/g, "-").toLowerCase()}`}
										name="budget_basis"
										value={opt}
										checked={v("budget_basis") === opt}
										onChange={(e) => set("budget_basis", e.target.value)}
										required
									/>{" "}
									{opt}
								</label>
							))}
						</div>
						<FieldError name="budget_basis" errors={errors} />
					</div>
					<SelectInput name="accommodation" label="Accommodation preference" errors={errors} value={v("accommodation")} onChange={set} />
					<SelectInput name="transport" label="Transport preference" errors={errors} value={v("transport")} onChange={set} />
				</div>
			</fieldset>

			{/* 6 — notes + consent */}
			<fieldset className="gw-form__section" hidden={step !== 5}>
				<legend>
					<span className="gw-form__step">6</span> Anything else?
				</legend>
				<div className="gw-form__grid">
					<TextArea name="notes" label="Anything else we should know?" errors={errors} value={v("notes")} onChange={set} full />
					<div className={`gw-form__field gw-form__field--full gw-form__consent${errors.consent ? " is-invalid" : ""}`}>
						<label className="gw-form__check">
							<input
								type="checkbox"
								name="consent"
								value="yes"
								checked={v("consent") === "yes"}
								onChange={(e) => set("consent", e.target.checked ? "yes" : "")}
								required
							/>{" "}
							I agree that GiftWako Travel may use these details to plan and quote for my trip, as described in
							the <a href="/privacy/">privacy policy</a>. <span className="gw-form__req" aria-hidden="true">*</span>
						</label>
						<FieldError name="consent" errors={errors} />
					</div>
				</div>
			</fieldset>

			<div className="gw-form__actions">
				{step > 0 && (
					<button type="button" className="gw-btn gw-btn--outline gw-btn--outline-dark" onClick={prev}>
						← Previous
					</button>
				)}
				{step < STEP_TITLES.length - 1 ? (
					<button type="button" className="gw-form__submit" onClick={next}>
						Next →
					</button>
				) : (
					<button type="submit" className="gw-form__submit" disabled={status === "sending"}>
						{status === "sending" ? "Sending…" : "Send my trip request"}
					</button>
				)}
				<p className="gw-form__hint">Nothing is booked until you accept a written quote.</p>
			</div>

			<datalist id="gw-countries">
				{COUNTRIES.map((c) => (
					<option key={c} value={c} />
				))}
			</datalist>
		</form>
	);
}

/* ---------- field helpers ---------- */

interface FieldProps {
	name: string;
	label: string;
	type?: string;
	req?: boolean;
	errors: Errors;
	value: string;
	onChange: (name: string, value: string) => void;
	hint?: string;
	placeholder?: string;
	autoComplete?: string;
	min?: string;
	max?: string;
	list?: string;
	full?: boolean;
	rows?: number;
}

function cls(name: string, errors: Errors, full?: boolean) {
	return `gw-form__field${full ? " gw-form__field--full" : ""}${errors[name] ? " is-invalid" : ""}`;
}

function Label({ name, label, req }: { name: string; label: string; req?: boolean }) {
	return (
		<label className="gw-form__label" htmlFor={fid(name)}>
			{label}
			{req ? (
				<>
					{" "}
					<span className="gw-form__req" aria-hidden="true">*</span>
				</>
			) : null}
		</label>
	);
}

function FieldError({ name, errors }: { name: string; errors: Errors }) {
	if (!errors[name]) return null;
	return (
		<p className="gw-form__error" id={`${fid(name)}-err`}>
			{errors[name]}
		</p>
	);
}

function TextInput(p: FieldProps) {
	return (
		<div className={cls(p.name, p.errors, p.full)}>
			<Label name={p.name} label={p.label} req={p.req} />
			<input
				id={fid(p.name)}
				name={p.name}
				type={p.type ?? "text"}
				required={p.req}
				aria-required={p.req || undefined}
				aria-invalid={!!p.errors[p.name] || undefined}
				aria-describedby={p.errors[p.name] ? `${fid(p.name)}-err` : undefined}
				value={p.value}
				onChange={(e) => p.onChange(p.name, e.target.value)}
				placeholder={p.placeholder}
				autoComplete={p.autoComplete}
				min={p.min}
				max={p.max}
				list={p.list}
			/>
			{p.hint && <p className="gw-form__hint">{p.hint}</p>}
			<FieldError name={p.name} errors={p.errors} />
		</div>
	);
}

function TextArea(p: FieldProps) {
	return (
		<div className={cls(p.name, p.errors, p.full ?? true)}>
			<Label name={p.name} label={p.label} req={p.req} />
			<textarea
				id={fid(p.name)}
				name={p.name}
				rows={p.rows ?? 4}
				required={p.req}
				aria-required={p.req || undefined}
				aria-invalid={!!p.errors[p.name] || undefined}
				aria-describedby={p.errors[p.name] ? `${fid(p.name)}-err` : undefined}
				value={p.value}
				onChange={(e) => p.onChange(p.name, e.target.value)}
				placeholder={p.placeholder}
			/>
			{p.hint && <p className="gw-form__hint">{p.hint}</p>}
			<FieldError name={p.name} errors={p.errors} />
		</div>
	);
}

function SelectInput(p: FieldProps) {
	return (
		<div className={cls(p.name, p.errors, p.full)}>
			<Label name={p.name} label={p.label} req={p.req} />
			<select
				id={fid(p.name)}
				name={p.name}
				required={p.req}
				aria-required={p.req || undefined}
				aria-invalid={!!p.errors[p.name] || undefined}
				aria-describedby={p.errors[p.name] ? `${fid(p.name)}-err` : undefined}
				value={p.value}
				onChange={(e) => p.onChange(p.name, e.target.value)}
			>
				<option value="">Select…</option>
				{OPTIONS[p.name].map((opt) => (
					<option key={opt} value={opt}>
						{opt}
					</option>
				))}
			</select>
			{p.hint && <p className="gw-form__hint">{p.hint}</p>}
			<FieldError name={p.name} errors={p.errors} />
		</div>
	);
}
