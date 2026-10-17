"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "@/components/Toaster";

export interface Ticket { type: string; price: string; quantity: string }
export interface EvRoute {
	name: string; pickup: string; time: string; ret: boolean;
	transport_type: string; price: string; seats: string; provider: string; status: string;
}

const CATEGORIES = ["Music Festival", "Concert", "Party", "Tour", "Cultural Event", "Sports", "Other"];
const TYPES = ["Minibus", "Bus", "Car", "Shuttle", "Coach"];
const CONFIRM = ["WhatsApp", "Phone call", "Email"];
const SOURCES = ["GiftWako Travel", "External organiser"];

export interface EvForm {
	title: string; category: string; short_desc: string; description: string; organiser: string;
	featuring: string; image: string;
	event_date: string; end_date: string; doors_time: string; start_time: string; end_time: string;
	booking_opens: string; booking_closes: string;
	venue: string; province: string; location: string; street: string; maps_url: string; venue_contact: string;
	tickets: Ticket[]; sales_start: string; sales_end: string; max_per_customer: string; ticket_source: string;
	transport_offered: boolean; routes: EvRoute[];
	gallery: string[]; video_url: string; featured: boolean; badge: string;
	bookings_enabled: boolean; allow_ticket_only: boolean; allow_transport_only: boolean;
	allow_ticket_transport: boolean; max_pax: string; confirm_method: string; whatsapp_number: string;
	cancellation_policy: string; terms: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function evToForm(ev: any): EvForm {
	return {
		title: ev?.title ?? "", category: ev?.category ?? "", short_desc: ev?.short_desc ?? "",
		description: ev?.description ?? "", organiser: ev?.organiser ?? "", featuring: ev?.featuring ?? "",
		image: ev?.image ?? "",
		event_date: ev?.event_date ?? "", end_date: ev?.end_date ?? "",
		doors_time: ev?.doors_time ?? "", start_time: ev?.start_time ?? "", end_time: ev?.end_time ?? "",
		booking_opens: ev?.booking_opens ?? "", booking_closes: ev?.booking_closes ?? "",
		venue: ev?.venue ?? "", province: ev?.province ?? "", location: ev?.location ?? "",
		street: ev?.street ?? "", maps_url: ev?.maps_url ?? "", venue_contact: ev?.venue_contact ?? "",
		tickets: (ev?.tickets ?? []).map((t: { type: string; price: number; quantity: number }) => ({
			type: t.type, price: t.price?.toString() ?? "", quantity: t.quantity?.toString() ?? "",
		})),
		sales_start: ev?.sales_start ?? "", sales_end: ev?.sales_end ?? "",
		max_per_customer: ev?.max_per_customer?.toString() ?? "", ticket_source: ev?.ticket_source ?? "",
		transport_offered: ev?.transport_offered ?? (ev?.routes?.length ? true : false),
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		routes: (ev?.routes ?? []).map((r: any) => ({
			name: r.name ?? "", pickup: r.pickup ?? r.note ?? "", time: r.time ?? "", ret: r.ret ?? r.return ?? true,
			transport_type: r.transport_type ?? "", price: r.price?.toString() ?? "", seats: r.seats?.toString() ?? "",
			provider: r.provider ?? "", status: r.status ?? "Active",
		})),
		gallery: ev?.gallery ?? [], video_url: ev?.video_url ?? "",
		featured: ev?.featured ?? false, badge: ev?.badge ?? "",
		bookings_enabled: ev?.bookings_enabled ?? true,
		allow_ticket_only: ev?.allow_ticket_only ?? true,
		allow_transport_only: ev?.allow_transport_only ?? true,
		allow_ticket_transport: ev?.allow_ticket_transport ?? true,
		max_pax: ev?.max_pax?.toString() ?? "8", confirm_method: ev?.confirm_method ?? "WhatsApp",
		whatsapp_number: ev?.whatsapp_number ?? "", cancellation_policy: ev?.cancellation_policy ?? "",
		terms: ev?.terms ?? "",
	};
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function formToRow(f: EvForm, status: string) {
	return {
		title: f.title.trim(), category: f.category || null, short_desc: f.short_desc || null,
		description: f.description || null, organiser: f.organiser || null, featuring: f.featuring || null,
		image: f.image || null,
		event_date: f.event_date || null, end_date: f.end_date || null,
		doors_time: f.doors_time || null, start_time: f.start_time || null, end_time: f.end_time || null,
		booking_opens: f.booking_opens || null, booking_closes: f.booking_closes || null,
		venue: f.venue || null, province: f.province || null, location: f.location || null,
		street: f.street || null, maps_url: f.maps_url || null, venue_contact: f.venue_contact || null,
		tickets: f.tickets.filter((t) => t.type.trim()).map((t) => ({
			type: t.type.trim(), price: t.price ? Number(t.price) : null, quantity: t.quantity ? Number(t.quantity) : null,
		})),
		sales_start: f.sales_start || null, sales_end: f.sales_end || null,
		max_per_customer: f.max_per_customer ? Number(f.max_per_customer) : null,
		ticket_source: f.ticket_source || null,
		transport_offered: f.transport_offered,
		routes: f.transport_offered ? f.routes.filter((r) => r.name.trim()).map((r) => ({
			name: r.name.trim(), pickup: r.pickup || null, time: r.time || null, return: r.ret,
			transport_type: r.transport_type || null, price: r.price ? Number(r.price) : null,
			seats: r.seats ? Number(r.seats) : null, provider: r.provider || null, status: r.status,
		})) : [],
		gallery: f.gallery, video_url: f.video_url || null,
		featured: f.featured, badge: f.badge || null,
		bookings_enabled: f.bookings_enabled,
		allow_ticket_only: f.allow_ticket_only, allow_transport_only: f.allow_transport_only,
		allow_ticket_transport: f.allow_ticket_transport,
		max_pax: f.max_pax ? Number(f.max_pax) : 8, confirm_method: f.confirm_method || null,
		whatsapp_number: f.whatsapp_number || null, cancellation_policy: f.cancellation_policy || null,
		terms: f.terms || null,
		// keep legacy columns in sync for cards/search
		price: f.tickets[0]?.price ? Number(f.tickets[0].price) : null,
		status,
		visible: status === "published",
	};
}

const EMPTY_ROUTE: EvRoute = { name: "", pickup: "", time: "", ret: true, transport_type: "", price: "", seats: "", provider: "", status: "Active" };

export default function EventForm({ id, onDone }: { id: number | "new"; onDone: () => void }) {
	const [f, setF] = useState<EvForm | null>(() => (id === "new" ? evToForm(null) : null));
	const [evId, setEvId] = useState<number | null>(id === "new" ? null : id);
	const [loaded, setLoaded] = useState(id === "new");
	const [saving, setSaving] = useState("");
	const [uploading, setUploading] = useState(false);

	// eslint-disable-next-line react-hooks/rules-of-hooks
	if (loaded === false && id !== "new") {
		setLoaded(true);
		void supabase()?.from("events").select("*").eq("id", id).single().then(({ data }) => {
			if (data) setF(evToForm(data));
		});
	}

	if (f === null) return <p className="gw-small" style={{ padding: "2rem" }}>Loading event…</p>;

	const set = <K extends keyof EvForm>(k: K, v: EvForm[K]) => setF((p) => ({ ...p!, [k]: v }));
	const up = async (file: File, cb: (url: string) => void) => {
		const c = supabase();
		if (!c) { toast("Not connected to the database"); return; }
		setUploading(true);
		const fname = `events/${Date.now()}-${file.name.replace(/[^\w.-]+/g, "-")}`;
		const { error } = await c.storage.from("media").upload(fname, file, { upsert: true });
		setUploading(false);
		if (error) { toast(`Upload failed: ${error.message}`); return; }
		cb(c.storage.from("media").getPublicUrl(fname).data.publicUrl);
		toast("Image uploaded");
	};

	async function save(status: string) {
		const c = supabase();
		if (!c) { toast("Not connected to the database"); return; }
		if (!f!.title.trim()) { toast("Event name is required"); return; }
		setSaving(status);
		const row = formToRow(f!, status);
		const { data, error } = evId
			? await c.from("events").update(row).eq("id", evId).select("id").single()
			: await c.from("events").insert(row).select("id").single();
		setSaving("");
		if (error) { toast(`Save failed: ${error.message}`); return; }
		if (!evId && data) setEvId(data.id);
		toast(status === "published" ? "Event published" : "Draft saved");
		onDone();
	}

	const sec = (n: number, t: string, children: React.ReactNode) => (
		<fieldset className="gw-evform-sec" key={n}>
			<legend><span className="gw-evform-num">{n}</span> {t}</legend>
			{children}
		</fieldset>
	);
	const fld = (label: string, children: React.ReactNode, full?: boolean) => (
		<div className={`gw-form__field${full ? " gw-form__field--full" : ""}`}><label className="gw-form__label">{label}</label>{children}</div>
	);
	const bool = (label: string, v: boolean, k: keyof EvForm) => (
		<label className="gw-form__check" key={k}><input type="checkbox" checked={v} onChange={(e) => set(k, e.target.checked as never)} /> {label}</label>
	);

	return (
		<div className="gw-evform">
			{/* 1 — basic info */}
			{sec(1, "Basic event information", <>

				<div className="gw-form__grid">
					{fld("Event name *", <input value={f.title} onChange={(e) => set("title", e.target.value)} placeholder="Party Misava" />)}
					{fld("Category", <select value={f.category} onChange={(e) => set("category", e.target.value)}><option value="">Select…</option>{CATEGORIES.map((c) => <option key={c}>{c}</option>)}</select>)}
					{fld("Event organiser", <input value={f.organiser} onChange={(e) => set("organiser", e.target.value)} placeholder="e.g. Party Misava crew" />)}
					{fld("Featured artist(s) or guest(s)", <input value={f.featuring} onChange={(e) => set("featuring", e.target.value)} placeholder="e.g. King Monada" />)}
				</div>
				{fld("Short description", <input value={f.short_desc} onChange={(e) => set("short_desc", e.target.value)} placeholder="One line for the event card" />)}
				{fld("Full event description", <textarea rows={3} value={f.description} onChange={(e) => set("description", e.target.value)} />, true)}
				{fld("Event poster / cover image", <>
					<input type="file" accept="image/*" onChange={(e) => { const file = e.target.files?.[0]; if (file) void up(file, (u) => set("image", u)); }} />
					{f.image && (
						<div className="gw-evform-prev">
							{/* eslint-disable-next-line @next/next/no-img-element */}
							<img src={f.image} alt="Poster preview" style={{ height: 110, borderRadius: 8 }} />
							<button type="button" className="gw-btn gw-btn--outline gw-btn--outline-dark gw-btn--small" onClick={() => set("image", "")}>Remove</button>
						</div>
					)}
				</>)}
			</>)}

			{/* 2 — date & time */}
			{sec(2, "Date & time", <>

				<div className="gw-form__grid">
					{fld("Event start date", <input type="date" value={f.event_date} onChange={(e) => set("event_date", e.target.value)} />)}
					{fld("Event end date", <input type="date" value={f.end_date} onChange={(e) => set("end_date", e.target.value)} />)}
					{fld("Doors open time", <input type="time" value={f.doors_time} onChange={(e) => set("doors_time", e.target.value)} />)}
					{fld("Event start time", <input type="time" value={f.start_time} onChange={(e) => set("start_time", e.target.value)} />)}
					{fld("Event end time", <input type="time" value={f.end_time} onChange={(e) => set("end_time", e.target.value)} />)}
					{fld("Booking opening date", <input type="date" value={f.booking_opens} onChange={(e) => set("booking_opens", e.target.value)} />)}
					{fld("Booking closing date", <input type="date" value={f.booking_closes} onChange={(e) => set("booking_closes", e.target.value)} />)}
				</div>
			</>)}

			{/* 3 — venue */}
			{sec(3, "Venue & location", <>

				<div className="gw-form__grid">
					{fld("Venue name", <input value={f.venue} onChange={(e) => set("venue", e.target.value)} placeholder="Hayzaview Sports Ground" />)}
					{fld("Province", <input value={f.province} onChange={(e) => set("province", e.target.value)} placeholder="Limpopo" />)}
					{fld("City / town", <input value={f.location} onChange={(e) => set("location", e.target.value)} placeholder="Tzaneen" />)}
					{fld("Street address", <input value={f.street} onChange={(e) => set("street", e.target.value)} />)}
					{fld("Google Maps link", <input value={f.maps_url} onChange={(e) => set("maps_url", e.target.value)} placeholder="https://maps.google.com/…" />)}
					{fld("Venue contact number", <input type="tel" value={f.venue_contact} onChange={(e) => set("venue_contact", e.target.value)} />)}
				</div>
			</>)}

			{/* 4 — tickets */}
			{sec(4, "Tickets & pricing", <>

				{f.tickets.map((t, i) => (
					<div className="gw-form__grid" style={{ gridTemplateColumns: "1.4fr 100px 100px auto" }} key={i}>
						{fld(i === 0 ? "Ticket type" : "", <input value={t.type} onChange={(e) => set("tickets", f.tickets.map((x, j) => j === i ? { ...x, type: e.target.value } : x))} placeholder="General Admission" />)}
						{fld(i === 0 ? "Price (R)" : "", <input type="number" min={0} value={t.price} onChange={(e) => set("tickets", f.tickets.map((x, j) => j === i ? { ...x, price: e.target.value } : x))} />)}
						{fld(i === 0 ? "Quantity" : "", <input type="number" min={0} value={t.quantity} onChange={(e) => set("tickets", f.tickets.map((x, j) => j === i ? { ...x, quantity: e.target.value } : x))} />)}
						<button type="button" className="gw-btn gw-btn--outline gw-btn--outline-dark gw-btn--small" style={{ alignSelf: "end" }} onClick={() => set("tickets", f.tickets.filter((_, j) => j !== i))}>✕</button>
					</div>
				))}
				<button type="button" className="gw-btn gw-btn--outline gw-btn--outline-dark gw-btn--small" onClick={() => set("tickets", [...f.tickets, { type: "", price: "", quantity: "" }])}>+ Add ticket type</button>
				<div className="gw-form__grid" style={{ marginTop: "1rem" }}>
					{fld("Ticket sales start", <input type="date" value={f.sales_start} onChange={(e) => set("sales_start", e.target.value)} />)}
					{fld("Ticket sales end", <input type="date" value={f.sales_end} onChange={(e) => set("sales_end", e.target.value)} />)}
					{fld("Max tickets per customer", <input type="number" min={0} value={f.max_per_customer} onChange={(e) => set("max_per_customer", e.target.value)} />)}
					{fld("Tickets sold by", <select value={f.ticket_source} onChange={(e) => set("ticket_source", e.target.value)}><option value="">Select…</option>{SOURCES.map((s) => <option key={s}>{s}</option>)}</select>)}
				</div>
				<p className="gw-form__hint">Bookings are requests — nothing is paid online; you confirm availability with the organiser.</p>
			</>)}

			{/* 5 — transport */}
			{sec(5, "Transport & travel", <>

				<label className="gw-form__check" style={{ marginBottom: "0.8rem", display: "block" }}>
					<input type="checkbox" checked={f.transport_offered} onChange={(e) => set("transport_offered", e.target.checked)} />{" "}
					This event offers transport
				</label>
				{f.transport_offered && (
					<>
						<div className="gw-evform-routes">
							<div className="gw-evform-routes__head">
								<span>Pickup area</span><span>Pickup point</span><span>Time</span><span>Return</span><span>Type</span><span>R pp</span><span>Seats</span><span>Provider</span><span>Status</span><span></span>
							</div>
							{f.routes.map((r, i) => (
								<div className="gw-evform-routes__row" key={i}>
									<input value={r.name} onChange={(e) => set("routes", f.routes.map((x, j) => j === i ? { ...x, name: e.target.value } : x))} placeholder="Bolobedu Matipane" />
									<input value={r.pickup} onChange={(e) => set("routes", f.routes.map((x, j) => j === i ? { ...x, pickup: e.target.value } : x))} placeholder="Taxi rank" />
									<input type="time" value={r.time} onChange={(e) => set("routes", f.routes.map((x, j) => j === i ? { ...x, time: e.target.value } : x))} />
									<input type="checkbox" checked={r.ret} onChange={(e) => set("routes", f.routes.map((x, j) => j === i ? { ...x, ret: e.target.checked } : x))} title="Return trip" />
									<select value={r.transport_type} onChange={(e) => set("routes", f.routes.map((x, j) => j === i ? { ...x, transport_type: e.target.value } : x))}>
										<option value="">Type</option>{TYPES.map((t) => <option key={t}>{t}</option>)}
									</select>
									<input type="number" min={0} value={r.price} onChange={(e) => set("routes", f.routes.map((x, j) => j === i ? { ...x, price: e.target.value } : x))} placeholder="R" />
									<input type="number" min={0} value={r.seats} onChange={(e) => set("routes", f.routes.map((x, j) => j === i ? { ...x, seats: e.target.value } : x))} />
									<input value={r.provider} onChange={(e) => set("routes", f.routes.map((x, j) => j === i ? { ...x, provider: e.target.value } : x))} placeholder="GiftWako" />
									<select value={r.status} onChange={(e) => set("routes", f.routes.map((x, j) => j === i ? { ...x, status: e.target.value } : x))}>
										<option>Active</option><option>Inactive</option>
									</select>
									<button type="button" className="gw-btn gw-btn--outline gw-btn--outline-dark gw-btn--small" onClick={() => set("routes", f.routes.filter((_, j) => j !== i))}>✕</button>
								</div>
							))}
						</div>
						<button type="button" className="gw-btn gw-btn--outline gw-btn--outline-dark gw-btn--small" onClick={() => set("routes", [...f.routes, { ...EMPTY_ROUTE }])}>+ Add route</button>
					</>
				)}
			</>)}

			{/* 6 — gallery & promo */}
			{sec(6, "Event gallery & promotion", <>

				{fld("Additional images", <>
					<input type="file" accept="image/*" onChange={(e) => { const file = e.target.files?.[0]; if (file) void up(file, (u) => set("gallery", [...f.gallery, u])); }} />
					{f.gallery.length > 0 && (
						<div className="gw-evform-gallery">
							{f.gallery.map((g, i) => (
								<span className="gw-evform-thumb" key={g}>
									{/* eslint-disable-next-line @next/next/no-img-element */}
									<img src={g} alt="" />
									<button type="button" onClick={() => set("gallery", f.gallery.filter((_, j) => j !== i))}>✕</button>
								</span>
							))}
						</div>
					)}
				</>)}
				<div className="gw-form__grid">
					{fld("Promotional video URL", <input value={f.video_url} onChange={(e) => set("video_url", e.target.value)} placeholder="https://youtube.com/…" />)}
					{fld("Promotional badge", <select value={f.badge} onChange={(e) => set("badge", e.target.value)}><option value="">None</option><option>Popular</option><option>Upcoming</option><option>Selling fast</option></select>)}
				</div>
				{bool("Featured event", f.featured, "featured")}
			</>)}

			{/* 7 — booking settings */}
			{sec(7, "Booking settings", <>

				{bool("Enable bookings", f.bookings_enabled, "bookings_enabled")}
				{bool("Allow ticket-only bookings", f.allow_ticket_only, "allow_ticket_only")}
				{bool("Allow transport-only bookings", f.allow_transport_only, "allow_transport_only")}
				{bool("Allow ticket + transport bookings", f.allow_ticket_transport, "allow_ticket_transport")}
				<div className="gw-form__grid" style={{ marginTop: "0.8rem" }}>
					{fld("Max passengers per booking", <input type="number" min={1} value={f.max_pax} onChange={(e) => set("max_pax", e.target.value)} />)}
					{fld("Booking confirmation method", <select value={f.confirm_method} onChange={(e) => set("confirm_method", e.target.value)}>{CONFIRM.map((c) => <option key={c}>{c}</option>)}</select>)}
					{fld("WhatsApp booking number", <input type="tel" value={f.whatsapp_number} onChange={(e) => set("whatsapp_number", e.target.value)} placeholder="070 617 8269" />)}
				</div>
				{fld("Cancellation policy", <textarea rows={2} value={f.cancellation_policy} onChange={(e) => set("cancellation_policy", e.target.value)} />)}
				{fld("Terms & conditions", <textarea rows={2} value={f.terms} onChange={(e) => set("terms", e.target.value)} />)}
			</>)}

			{/* 8 — publish */}
			<div className="gw-evform-actions">
				<button type="button" className="gw-btn gw-btn--outline gw-btn--outline-dark" disabled={!!saving} onClick={() => void save("draft")}>
					{saving === "draft" ? "Saving…" : "Save as draft"}
				</button>
				{evId && (
					<a className="gw-btn gw-btn--outline gw-btn--outline-dark" href={`/events/${evId}`} target="_blank" rel="noreferrer">
						Preview event
					</a>
				)}
				<button type="button" className="gw-btn gw-btn--gold" disabled={!!saving || uploading} onClick={() => void save("published")}>
					{uploading ? "Uploading…" : saving === "published" ? "Publishing…" : "Publish event"}
				</button>
				<button type="button" className="gw-btn gw-btn--outline gw-btn--outline-dark" onClick={onDone}>Cancel</button>
			</div>
		</div>
	);
}
