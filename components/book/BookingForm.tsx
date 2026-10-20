"use client";

import { useMemo, useState } from "react";
import { Drawer } from "@/components/admin/ui";
import { supabase } from "@/lib/supabase";
import { waLink } from "@/lib/site";
import { addDays, fmtR, makeRef, type BookQuery, type R } from "@/lib/booking";

const fmtDate = (s?: string | null) => (s ? new Date(s + "T00:00:00").toLocaleDateString("en-ZA", { day: "numeric", month: "long", year: "numeric" }) : "—");

export default function BookingForm({ service, item, query, onClose, onBooked }: {
	service: string;
	item: R;
	query: BookQuery;
	onClose: () => void;
	onBooked: () => void;
}) {
	const [f, setF] = useState<Record<string, string>>({ contact_method: "WhatsApp" });
	const [roomIdx, setRoomIdx] = useState(0);
	const [pkgDate, setPkgDate] = useState("");
	const [consent, setConsent] = useState(false);
	const [busy, setBusy] = useState(false);
	const [ref, setRef] = useState<string | null>(null);
	const [err, setErr] = useState("");
	const [honey] = useState(() => Date.now());

	const set = (k: string, v: string) => setF((p) => ({ ...p, [k]: v }));
	const v = (k: string) => f[k] ?? "";

	const from = query.from || (item.dates?.[0] ?? "");
	const to = service === "accommodation" && (!query.to || query.to <= from) && from ? addDays(from, 1) : query.to || from;
	const days = Math.max(1, Math.round((new Date(to + "T00:00:00").getTime() - new Date(from + "T00:00:00").getTime()) / 86400000) + 1);
	const nights = Math.max(0, days - 1);
	const rooms: { name: string; price: number; qty: number; sleeps: number }[] = item.rooms ?? [];
	const room = rooms[roomIdx];

	const quote = useMemo(() => {
		if (service === "transport") {
			const km = Number(v("km")) || 0;
			if (km && item.per_km != null) return Math.max(item.min_charge ?? 0, km * Number(item.per_km));
			if (item.per_day != null) return Number(item.per_day) * days;
			return null;
		}
		if (service === "accommodation") return room?.price != null ? room.price * nights : null;
		return item.price_from != null ? Number(item.price_from) * query.pax : null;
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [service, f.km, roomIdx, days, nights, query.pax]);
	const deposit = service !== "transport" && service !== "accommodation" && item.deposit != null
		? Number(item.deposit) * query.pax : null;

	const title =
		service === "transport" ? `${item.make ?? ""} ${item.model ?? ""} (${item.vehicle_type ?? ""})`
		: service === "accommodation" ? item.name
		: item.title;

	const submit = async () => {
		const c = supabase();
		if (!c) { setErr("Not connected right now — WhatsApp us on 070 617 8269."); return; }
		if (!v("name").trim() || !v("phone").trim()) { setErr("Name and phone are required."); return; }
		if (service === "transport" && (!v("pickup").trim() || !v("dropoff").trim())) { setErr("Pickup and drop-off are required."); return; }
		if (!consent) { setErr("Please agree that we may contact you about this booking."); return; }
		if (Date.now() - honey < 1500) { setErr("Something went wrong — try again."); return; }
		setBusy(true);
		const r = makeRef(service);
		const selection: R = {};
		if (service === "accommodation" && room) selection.room = room.name;
		if (service !== "transport" && service !== "accommodation" && pkgDate) selection.date = pkgDate;
		if (v("km")) selection.est_km = Number(v("km"));
		if (query.event_id) selection.event_id = Number(query.event_id);
		const { error } = await c.from("service_bookings").insert({
			ref: r,
			service,
			item_id: item.id ?? null,
			item_title: title,
			date_from: from || null,
			date_to: to || null,
			pax: query.pax,
			pickup: v("pickup") || query.pickup || null,
			dropoff: v("dropoff") || query.dest || null,
			notes: v("notes") || null,
			selection,
			customer_name: v("name").trim(),
			customer_email: v("email") || null,
			customer_phone: v("phone").trim(),
			contact_method: v("contact_method") || "WhatsApp",
			quoted_total: quote,
			deposit_due: deposit,
			status: "Pending",
		});
		setBusy(false);
		if (error) { setErr(`Could not submit: ${error.message}`); return; }
		setRef(r);
		onBooked();
	};

	if (ref) {
		return (
			<Drawer title="Booking received" onClose={onClose}>
				<div className="gw-form__success">
					<h2>Booking request received!</h2>
					<p style={{ fontSize: "1.3rem" }}><strong>{ref}</strong></p>
					<p>{title} · {fmtDate(from)}{to !== from ? ` → ${fmtDate(to)}` : ""} · {query.pax} traveller{query.pax === 1 ? "" : "s"}</p>
					{quote != null && <p>Estimated total: <strong>{fmtR(quote)}</strong>{deposit != null ? ` · deposit ${fmtR(deposit)}` : ""}</p>}
					<p>We'll confirm on WhatsApp/phone within 24 hours.</p>
					<div className="gw-buttons">
						<a className="gw-btn gw-btn--gold" href={waLink(`Hi GiftWako, booking ref ${ref}`)} target="_blank" rel="noreferrer">Chat on WhatsApp</a>
						<button className="gw-btn gw-btn--outline gw-btn--outline-dark" onClick={onClose}>Done</button>
					</div>
				</div>
			</Drawer>
		);
	}

	const fld = (k: string, label: string, type = "text", ph?: string, req?: boolean) => (
		<div className="gw-form__field"><label className="gw-form__label">{label}{req ? " *" : ""}</label>
			<input type={type} value={v(k)} onChange={(e) => set(k, e.target.value)} placeholder={ph} />
		</div>
	);

	return (
		<Drawer title="Complete your booking" onClose={onClose} wide>
			<div className="gw-dlist" style={{ marginBottom: "1rem" }}>
				<div className="gw-dr"><span>Item</span><strong>{title}</strong></div>
				<div className="gw-dr"><span>Dates</span><strong>{fmtDate(from)}{to !== from ? ` → ${fmtDate(to)}` : ""} · {days} day{days === 1 ? "" : "s"}</strong></div>
				<div className="gw-dr"><span>Travellers</span><strong>{query.pax}</strong></div>
			</div>

			{service === "transport" && (
				<div className="gw-form__grid">
					{fld("pickup", "Pickup address", "text", "Where should we fetch you?", true)}
					{fld("dropoff", "Drop-off", "text", query.dest || "Destination", true)}
					{fld("km", "Estimated distance (km, optional)", "number")}
				</div>
			)}
			{service === "accommodation" && rooms.length > 0 && (
				<div className="gw-form__grid">
					<div className="gw-form__field"><label className="gw-form__label">Room type</label>
						<select value={roomIdx} onChange={(e) => setRoomIdx(Number(e.target.value))}>
							{rooms.map((r, i) => <option key={r.name} value={i}>{r.name} — sleeps {r.sleeps} · {fmtR(r.price)}/night</option>)}
						</select>
					</div>
				</div>
			)}
			{service !== "transport" && service !== "accommodation" && service !== "events" && (item.dates ?? []).length > 0 && (
				<div className="gw-form__grid">
					<div className="gw-form__field"><label className="gw-form__label">Departure date</label>
						<select value={pkgDate} onChange={(e) => setPkgDate(e.target.value)}>
							<option value="">Choose a date…</option>
							{(item.dates as string[]).map((d) => <option key={d} value={d}>{fmtDate(d)}</option>)}
						</select>
					</div>
				</div>
			)}

			<h4>Your details</h4>
			<div className="gw-form__grid">
				{fld("name", "Full name", "text", undefined, true)}
				{fld("phone", "Phone number", "tel", undefined, true)}
				{fld("email", "Email (optional)", "email")}
				<div className="gw-form__field"><label className="gw-form__label">Preferred contact</label>
					<select value={v("contact_method")} onChange={(e) => set("contact_method", e.target.value)}>
						<option>WhatsApp</option><option>Phone call</option><option>Email</option>
					</select>
				</div>
			</div>
			<div className="gw-form__field" style={{ marginTop: "0.6rem" }}>
				<label className="gw-form__label">Notes (optional)</label>
				<textarea rows={2} value={v("notes")} onChange={(e) => set("notes", e.target.value)} style={{ width: "100%", font: "inherit", padding: "0.5rem", border: "1px solid var(--gw-line)", borderRadius: 8 }} />
			</div>

			{quote != null && (
				<p style={{ margin: "0.8rem 0" }}>Estimated total: <strong>{fmtR(quote)}</strong>
					{deposit != null && <span className="gw-small"> · deposit {fmtR(deposit)} to secure your seat</span>}
				</p>
			)}
			<label className="gw-form__check">
				<input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} />{" "}
				I agree that GiftWako Travel may contact me about this booking. *
			</label>
			{err && <div className="gw-form__errors" role="alert" style={{ marginTop: "0.6rem" }}><ul><li>{err}</li></ul></div>}
			<div className="gw-buttons" style={{ marginTop: "1rem" }}>
				<button className="gw-btn gw-btn--gold" disabled={busy} onClick={() => void submit()}>
					{busy ? "Sending…" : "Submit booking request"}
				</button>
				<button className="gw-btn gw-btn--outline gw-btn--outline-dark" onClick={onClose}>Cancel</button>
			</div>
		</Drawer>
	);
}
