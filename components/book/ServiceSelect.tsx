"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ACCOM_TYPES, SERVICE_OPTIONS, todayISO, type ServiceKey } from "@/lib/booking";

export default function ServiceSelect() {
	const router = useRouter();
	const [service, setService] = useState<ServiceKey | "">("");
	const [from, setFrom] = useState("");
	const [to, setTo] = useState("");
	const [pax, setPax] = useState(1);
	const [type, setType] = useState("");
	const [pickup, setPickup] = useState("");
	const [err, setErr] = useState("");

	const go = () => {
		if (!service) { setErr("Please choose a service"); return; }
		const q = new URLSearchParams();
		q.set("service", service);
		if (from) q.set("from", from);
		if (to) q.set("to", to);
		q.set("pax", String(Math.max(1, pax)));
		if (service === "accommodation" && type) q.set("type", type);
		if (service === "transport" && pickup) q.set("pickup", pickup);
		router.push(`/book/results?${q.toString()}`);
	};

	return (
		<div className="gw-survey">
			<div className="gw-survey__panel gw-survey__cards">
				{SERVICE_OPTIONS.map((s) => (
					<button
						type="button"
						key={s.key}
						className={`gw-survey__card${service === s.key ? " is-selected" : ""}`}
						onClick={() => { setService(s.key); setErr(""); }}
					>{s.label}</button>
				))}
			</div>

			<div className="gw-survey__panel" style={{ marginTop: "1rem" }}>
				<h3 style={{ marginTop: 0 }}>Your dates & travellers</h3>
				<div className="gw-form__grid">
					<div className="gw-form__field">
						<label className="gw-form__label">Date from</label>
						<input type="date" value={from} min={todayISO()} onChange={(e) => setFrom(e.target.value)} />
					</div>
					<div className="gw-form__field">
						<label className="gw-form__label">Date to (optional)</label>
						<input type="date" value={to} min={from || todayISO()} onChange={(e) => setTo(e.target.value)} />
					</div>
					<div className="gw-form__field">
						<label className="gw-form__label">Travellers</label>
						<input type="number" min={1} max={60} value={pax} onChange={(e) => setPax(Number(e.target.value) || 1)} />
					</div>
					{service === "accommodation" && (
						<div className="gw-form__field">
							<label className="gw-form__label">Accommodation type</label>
							<select value={type} onChange={(e) => setType(e.target.value)}>
								<option value="">Any type</option>
								{ACCOM_TYPES.map((t) => <option key={t.label}>{t.label}</option>)}
							</select>
						</div>
					)}
					{service === "transport" && (
						<div className="gw-form__field">
							<label className="gw-form__label">Pickup town (optional)</label>
							<input value={pickup} onChange={(e) => setPickup(e.target.value)} placeholder="e.g. Tzaneen" />
						</div>
					)}
				</div>
				{err && <div className="gw-form__errors" role="alert" style={{ marginTop: "0.8rem" }}><ul><li>{err}</li></ul></div>}
				<div className="gw-form__actions" style={{ marginTop: "1rem" }}>
					<button type="button" className="gw-form__submit" onClick={go}>Next →</button>
					<p className="gw-form__hint">Nothing is booked until you accept a written quote.</p>
				</div>
			</div>
		</div>
	);
}
