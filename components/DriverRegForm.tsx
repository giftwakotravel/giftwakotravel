"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "@/components/Toaster";

const STEPS = [
	"Personal information", "Driver's licence", "Vehicle information",
	"Vehicle documents", "Transport services", "Banking & submission",
];

const VEHICLE_TYPES = ["Sedan", "Hatchback", "SUV", "Bakkie", "Minibus", "Minibus Taxi", "Coaster", "Bus", "Luxury Vehicle", "Other"];
const SERVICES = ["Airport Transfers", "Local Transport", "Long-Distance Transport", "Event Transport", "Tours & Sightseeing", "Holiday Packages", "Group Transport", "Corporate Transport", "School Transport"];
const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const PRICING = ["Per kilometre", "Per trip", "Per hour", "Per passenger", "Custom quotation"];

type F = Record<string, string | string[] | boolean>;

export default function DriverRegForm() {
	const [step, setStep] = useState(0);
	const [f, setF] = useState<F>({ nationality: "South African", aircon: true });
	const [files, setFiles] = useState<Record<string, File | null>>({});
	const [errors, setErrors] = useState<string[]>([]);
	const [status, setStatus] = useState<"idle" | "saving" | "sent">("idle");

	const set = (k: string, v: string | boolean) => setF((p) => ({ ...p, [k]: v }));
	const tog = (k: string, v: string) => setF((p) => {
		const a = new Set((p[k] as string[] | undefined) ?? []);
		a.has(v) ? a.delete(v) : a.add(v);
		return { ...p, [k]: [...a] };
	});
	const has = (k: string, v: string) => ((f[k] as string[] | undefined) ?? []).includes(v);
	const s = (k: string) => (f[k] as string) ?? "";
	const file = (k: string) => files[k];

	async function uploadAll(): Promise<Record<string, string> | null> {
		const c = supabase();
		if (!c) return null;
		const urls: Record<string, string> = {};
		for (const [k, fl] of Object.entries(files)) {
			if (!fl) continue;
			const path = `driver-docs/${Date.now()}-${k}-${fl.name.replace(/[^\w.-]+/g, "-")}`;
			const { error } = await c.storage.from("media").upload(path, fl, { upsert: true });
			if (error) { setErrors([`Upload failed (${fl.name}): ${error.message}`]); return null; }
			urls[k] = c.storage.from("media").getPublicUrl(path).data.publicUrl;
		}
		return urls;
	}

	const next = () => {
		const errs: string[] = [];
		if (step === 0 && (!s("full_name") || !s("surname") || !s("mobile") || !s("email") || !s("address"))) errs.push("Complete name, mobile, email and address fields");
		if (step === 1 && !s("licence_number")) errs.push("Licence number is required");
		if (step === 2 && (!s("vehicle_make") || !s("vehicle_model") || !s("vehicle_reg") || !s("vehicle_type") || !s("passenger_capacity"))) errs.push("Complete the vehicle details");
		if (step === 4 && ((f.services as string[] | undefined) ?? []).length === 0) errs.push("Select at least one service");
		if (step === 5 && (!f.conf_accurate || !f.conf_verify || !f.conf_terms || !f.conf_privacy)) errs.push("All confirmations are required");
		setErrors(errs);
		if (!errs.length) { setStep((s2) => Math.min(s2 + 1, 5)); window.scrollTo({ top: 0 }); }
	};
	const back = () => { setErrors([]); setStep((s2) => Math.max(0, s2 - 1)); };

	async function submit() {
		setStatus("saving");
		const c = supabase();
		if (!c) { setErrors(["Not connected right now — WhatsApp us on 070 617 8269."]); setStatus("idle"); return; }
		const urls = await uploadAll();
		if (urls === null) { setStatus("idle"); return; }
		const row = {
			full_name: s("full_name"), surname: s("surname"), dob: s("dob") || null, sa_id: s("sa_id") || null,
			gender: s("gender") || null, nationality: s("nationality") || null, mobile: s("mobile"), whatsapp: s("whatsapp") || null,
			email: s("email"), address: s("address"), province: s("province") || null, town: s("town") || null,
			id_doc_url: urls.id_doc ?? null, selfie_url: urls.selfie ?? null,
			licence_number: s("licence_number"), licence_code: s("licence_code") || null, licence_expiry: s("licence_expiry") || null,
			prdp_number: s("prdp_number") || null, prdp_expiry: s("prdp_expiry") || null,
			licence_doc_url: urls.licence_doc ?? null, prdp_doc_url: urls.prdp_doc ?? null,
			vehicle_make: s("vehicle_make"), vehicle_model: s("vehicle_model"), vehicle_year: s("vehicle_year") || null,
			vehicle_colour: s("vehicle_colour") || null, vehicle_reg: s("vehicle_reg"), vehicle_type: s("vehicle_type"),
			passenger_capacity: s("passenger_capacity") ? Number(s("passenger_capacity")) : null,
			doors: s("doors") ? Number(s("doors")) : null, aircon: !!f.aircon, luggage: s("luggage") || null, fuel_type: s("fuel_type") || null,
			reg_cert_url: urls.reg_cert ?? null, ownership_url: urls.ownership ?? null, roadworthy_url: urls.roadworthy ?? null,
			licence_disc_url: urls.licence_disc ?? null, insurance_url: urls.insurance ?? null, operating_licence_url: urls.op_licence ?? null,
			licence_disc_expiry: s("licence_disc_expiry") || null, roadworthy_expiry: s("roadworthy_expiry") || null,
			insurance_expiry: s("insurance_expiry") || null, op_licence_expiry: s("op_licence_expiry") || null,
			services: (f.services as string[] | undefined) ?? [], operating_province: s("operating_province") || null,
			towns_served: s("towns_served") || null, pickup_locations: s("pickup_locations") || null,
			max_distance: s("max_distance") || null, available_days: (f.days as string[] | undefined) ?? [],
			working_hours: s("working_hours") || null, pricing: s("pricing") || null,
			account_holder: s("account_holder") || null, bank_name: s("bank_name") || null,
			account_type: s("account_type") || null, account_number: s("account_number") || null,
			branch_code: s("branch_code") || null, bank_proof_url: urls.bank_proof ?? null,
		};
		const { error } = await c.from("driver_registrations").insert(row);
		if (error) { setErrors([`Submission failed: ${error.message}`]); setStatus("idle"); return; }
		setStatus("sent");
		window.scrollTo({ top: 0 });
	}

	const Fld = ({ k, label, type = "text", ph }: { k: string; label: string; type?: string; ph?: string }) => (
		<div className="gw-form__field"><label className="gw-form__label">{label}</label>
			<input type={type} value={s(k)} onChange={(e) => set(k, e.target.value)} placeholder={ph} />
		</div>
	);
	const Sel = ({ k, label, opts }: { k: string; label: string; opts: string[] }) => (
		<div className="gw-form__field"><label className="gw-form__label">{label}</label>
			<select value={s(k)} onChange={(e) => set(k, e.target.value)}><option value="">Select…</option>{opts.map((o) => <option key={o}>{o}</option>)}</select>
		</div>
	);
	const Up = ({ k, label, req }: { k: string; label: string; req?: boolean }) => (
		<div className="gw-form__field"><label className="gw-form__label">{label}{req ? " *" : ""}</label>
			<input type="file" accept="image/*,.pdf" onChange={(e) => setFiles((p) => ({ ...p, [k]: e.target.files?.[0] ?? null }))} />
			{file(k) && <p className="gw-form__hint">✓ {file(k)!.name}</p>}
		</div>
	);

	if (status === "sent") {
		return (
			<div className="gw-form__success">
				<h2>Registration received!</h2>
				<p>Thank you for registering with GiftWako Travel. Our team will verify your documents and contact you about approval and pricing.</p>
			</div>
		);
	}

	return (
		<div className="gw-survey">
			<ol className="gw-wiz" aria-label="Progress">
				{STEPS.map((t, i) => (
					<li key={t} className={i === step ? "is-current" : i < step ? "is-done" : ""}>
						<span className="gw-wiz__dot">{i + 1}</span><span className="gw-wiz__label">{t}</span>
					</li>
				))}
			</ol>

			{errors.length > 0 && (
				<div className="gw-form__errors" role="alert"><ul>{errors.map((e) => <li key={e}>{e}</li>)}</ul></div>
			)}

			{/* 1 — personal */}
			{step === 0 && (
				<div className="gw-survey__panel">
					<h3>Driver's identity</h3>
					<div className="gw-form__grid" style={{ marginTop: "0.8rem" }}>
						<Fld k="full_name" label="Full name *" />
						<Fld k="surname" label="Surname *" />
						<Fld k="dob" label="Date of birth" type="date" />
						<Fld k="sa_id" label="SA ID number" />
						<Sel k="gender" label="Gender (optional)" opts={["Male", "Female", "Other"]} />
						<Fld k="nationality" label="Nationality" />
						<Fld k="mobile" label="Mobile number *" type="tel" />
						<Fld k="whatsapp" label="WhatsApp number" type="tel" />
						<Fld k="email" label="Email address *" type="email" />
						<Fld k="address" label="Residential address *" />
						<Fld k="province" label="Province" ph="Limpopo" />
						<Fld k="town" label="City / town" ph="Tzaneen" />
					</div>
					<h4>Identity documents</h4>
					<div className="gw-form__grid">
						<Up k="id_doc" label="SA ID document or passport" req />
						<Up k="selfie" label="Selfie for identity verification (optional)" />
					</div>
				</div>
			)}

			{/* 2 — licence */}
			{step === 1 && (
				<div className="gw-survey__panel">
					<h3>Driving credentials</h3>
					<div className="gw-form__grid" style={{ marginTop: "0.8rem" }}>
						<Fld k="licence_number" label="Driver's licence number *" />
						<Sel k="licence_code" label="Licence code" opts={["A", "A1", "B", "EB", "C1", "EC1", "C", "EC"]} />
						<Fld k="licence_expiry" label="Licence expiry date" type="date" />
						<Fld k="prdp_number" label="PrDP number (if applicable)" />
						<Fld k="prdp_expiry" label="PrDP expiry date" type="date" />
					</div>
					<div className="gw-form__grid">
						<Up k="licence_doc" label="Upload driver's licence" req />
						<Up k="prdp_doc" label="Upload PrDP (if applicable)" />
					</div>
				</div>
			)}

			{/* 3 — vehicle */}
			{step === 2 && (
				<div className="gw-survey__panel">
					<h3>Register your vehicle</h3>
					<div className="gw-form__grid" style={{ marginTop: "0.8rem" }}>
						<Fld k="vehicle_make" label="Vehicle make *" ph="Toyota" />
						<Fld k="vehicle_model" label="Model *" ph="Quantum" />
						<Fld k="vehicle_year" label="Year" ph="2023" />
						<Fld k="vehicle_colour" label="Colour" ph="White" />
						<Fld k="vehicle_reg" label="Registration number *" ph="ABC 123 L" />
						<Sel k="vehicle_type" label="Vehicle type *" opts={VEHICLE_TYPES} />
						<Fld k="passenger_capacity" label="Passenger capacity (excl. driver) *" type="number" />
						<Fld k="doors" label="Number of doors" type="number" />
						<Sel k="luggage" label="Luggage capacity" opts={["Small", "Medium", "Large"]} />
						<Sel k="fuel_type" label="Fuel type" opts={["Petrol", "Diesel", "Hybrid", "Electric"]} />
					</div>
					<label className="gw-form__check"><input type="checkbox" checked={!!f.aircon} onChange={(e) => set("aircon", e.target.checked)} /> Air conditioning</label>
				</div>
			)}

			{/* 4 — vehicle docs */}
			{step === 3 && (
				<div className="gw-survey__panel">
					<h3>Upload vehicle documents</h3>
					<div className="gw-form__grid" style={{ marginTop: "0.8rem" }}>
						<Up k="reg_cert" label="Vehicle registration certificate" req />
						<Up k="ownership" label="Proof of ownership or authorisation" req />
						<Up k="roadworthy" label="Roadworthiness certificate" />
						<Up k="licence_disc" label="Vehicle licence disc" req />
						<Up k="insurance" label="Passenger liability insurance" req />
						<Up k="op_licence" label="Operating licence or permit" />
					</div>
					<div className="gw-form__grid">
						<Fld k="licence_disc_expiry" label="Licence disc expiry" type="date" />
						<Fld k="roadworthy_expiry" label="Roadworthiness expiry" type="date" />
						<Fld k="insurance_expiry" label="Insurance expiry" type="date" />
						<Fld k="op_licence_expiry" label="Operating licence expiry" type="date" />
					</div>
				</div>
			)}

			{/* 5 — services */}
			{step === 4 && (
				<div className="gw-survey__panel">
					<h3>What services do you offer?</h3>
					<div className="gw-survey__cards" style={{ marginTop: "0.8rem" }}>
						{SERVICES.map((sv) => (
							<button type="button" key={sv} className={`gw-survey__card${has("services", sv) ? " is-selected" : ""}`} onClick={() => tog("services", sv)}>{sv}</button>
						))}
					</div>
					<div className="gw-form__grid" style={{ marginTop: "1rem" }}>
						<Fld k="operating_province" label="Operating province" ph="Limpopo" />
						<Fld k="towns_served" label="Towns or cities served" ph="Tzaneen, Polokwane" />
						<Fld k="pickup_locations" label="Available pickup locations" />
						<Fld k="max_distance" label="Maximum travel distance" ph="e.g. 500 km" />
						<Fld k="working_hours" label="Preferred working hours" ph="e.g. 06:00–18:00" />
						<Sel k="pricing" label="How do you price?" opts={PRICING} />
					</div>
					<div className="gw-form__field">
						<label className="gw-form__label">Available days</label>
						<div className="gw-form__checklist">
							{DAYS.map((d) => (
								<label className="gw-form__check" key={d}>
									<input type="checkbox" checked={has("days", d)} onChange={() => tog("days", d)} /> {d}
								</label>
							))}
						</div>
					</div>
					<p className="gw-form__hint">GiftWako Travel approves or negotiates pricing before you receive bookings.</p>
				</div>
			)}

			{/* 6 — banking */}
			{step === 5 && (
				<div className="gw-survey__panel">
					<h3>Payment and agreement</h3>
					<div className="gw-form__grid" style={{ marginTop: "0.8rem" }}>
						<Fld k="account_holder" label="Account holder name" />
						<Fld k="bank_name" label="Bank name" />
						<Sel k="account_type" label="Account type" opts={["Cheque", "Savings", "Transmission"]} />
						<Fld k="account_number" label="Account number" />
						<Fld k="branch_code" label="Branch code" />
					</div>
					<Up k="bank_proof" label="Proof of bank account (optional)" />
					<div className="gw-form__field" style={{ marginTop: "0.8rem" }}>
						{([
							["conf_accurate", "I confirm that the information provided is accurate."],
							["conf_verify", "I agree to the driver and vehicle verification process."],
							["conf_terms", "I agree to the platform's terms and conditions."],
							["conf_privacy", "I consent to the processing of my personal information for registration and verification."],
						] as [string, string][]).map(([k, t]) => (
							<label className="gw-form__check" key={k}>
								<input type="checkbox" checked={!!f[k]} onChange={(e) => set(k, e.target.checked)} /> {t} *
							</label>
						))}
					</div>
				</div>
			)}

			<div className="gw-form__actions" style={{ marginTop: "1.2rem" }}>
				<button type="button" className="gw-btn gw-btn--outline gw-btn--outline-dark" onClick={() => toast("Drafts are not saved yet — complete and submit.")}>Save draft</button>
				{step > 0 && <button type="button" className="gw-btn gw-btn--outline gw-btn--outline-dark" onClick={back}>← Previous</button>}
				{step < 5 ? (
					<button type="button" className="gw-form__submit" onClick={next}>Next →</button>
				) : (
					<button type="button" className="gw-form__submit" disabled={status === "saving"} onClick={submit}>
						{status === "saving" ? "Submitting…" : "Submit registration"}
					</button>
				)}
			</div>
		</div>
	);
}
