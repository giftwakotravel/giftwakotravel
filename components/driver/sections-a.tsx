"use client";

import { useRef, useState } from "react";
import { Dr, Panel, Pill, Table } from "@/components/admin/ui";
import { useDriver, type Row } from "@/components/driver/ctx";
import { toast } from "@/components/Toaster";
import { supabase } from "@/lib/supabase";
import {
	cleanRow, completion, DAYS, DOC_TYPES, PRICING, SERVICES, VEHICLE_TYPES, type Section,
} from "@/lib/driver-portal";
import { AlertTriangle, Ban, Car, Check, CircleCheck, Clock, ExternalLink, X } from "@/components/driver/icons";

export default function DriverSectionsA({ section }: { section: Section }) {
	switch (section) {
		case "dashboard": return <Dashboard />;
		case "profile": return <Profile />;
		case "vehicles": return <Vehicles />;
		case "documents": return <Documents />;
		default: return null;
	}
}

const fdate = (s?: string | null) => (s ? new Date(s).toLocaleDateString("en-ZA", { day: "numeric", month: "long", year: "numeric" }) : "—");

/* ============================ DASHBOARD ============================ */

function Dashboard() {
	const { user, profile, vehicles, documents, contract, trips, notifications, loaded, reload, go } = useDriver();
	const { pct, items } = completion(profile, vehicles, documents, contract);
	const status = (profile?.status as string | undefined) ?? "Incomplete";
	const active = trips.filter((t) => ["Assigned", "Confirmed", "In progress"].includes(t.status));
	const upcoming = trips
		.filter((t) => t.trip_date && !["Completed", "Cancelled"].includes(t.status))
		.slice(0, 5);

	const submit = async () => {
		const c = supabase();
		if (!c || !profile) return;
		const { error } = await c.from("driver_profiles")
			.upsert({ user_id: user.id, status: "Pending", submitted_at: new Date().toISOString() }, { onConflict: "user_id" });
		if (error) { toast(`Submit failed: ${error.message}`); return; }
		await c.from("driver_notifications").insert({
			user_id: user.id, type: "info",
			title: "Profile submitted for approval",
			body: "GiftWako Travel will review your profile, documents and agreement acceptance.",
		});
		toast("Submitted for approval");
		void reload();
	};

	if (!loaded) return <p className="gw-small">Loading your dashboard…</p>;

	return (
		<>
			<div className="gw-statgrid">
				<div className="gw-stat"><p>Profile completion</p><strong>{pct}%</strong></div>
				<div className="gw-stat"><p>Verification status</p><strong style={{ fontSize: "1.2rem" }}><Pill status={status} /></strong></div>
				<div className="gw-stat"><p>Assigned trips</p><strong>{active.length}</strong></div>
				<div className="gw-stat"><p>Contract status</p><strong style={{ fontSize: "1.2rem" }}>{contract ? "Accepted" : "Not accepted"}</strong></div>
			</div>

			{status === "Incomplete" && (
				<Panel title="Incomplete profile" sub={`Your profile is ${pct}% complete. Finish the checklist below to submit for approval.`}>
					<p className="gw-driver__status is-incomplete"><Clock size={18} /> Your profile is not yet submitted.</p>
					<div className="gw-buttons">
						{items.map((i) => (
							<button key={i.label} className={`gw-filter__btn${i.done ? " is-active" : ""}`} onClick={() => go(i.section)}>
								{i.done && <Check size={14} />} {i.label}
							</button>
						))}
					</div>
					<div className="gw-buttons" style={{ marginTop: "1rem" }}>
						<button className="gw-btn gw-btn--gold" disabled={pct !== 100} onClick={() => void submit()}>
							Submit for approval
						</button>
						{pct !== 100 && <span className="gw-small" style={{ alignSelf: "center" }}>Complete all items to submit.</span>}
					</div>
				</Panel>
			)}
			{status === "Pending" && (
				<Panel title="Pending approval">
					<p className="gw-driver__status is-pending"><AlertTriangle size={18} /> Under review</p>
					<p>Submitted {fdate(profile?.submitted_at)} — GiftWako Travel is reviewing your profile, documents and agreement acceptance.</p>
				</Panel>
			)}
			{status === "Rejected" && (
				<Panel title="Rejected — action required" sub={profile?.rejection_reason ? `Reason: ${profile.rejection_reason}` : undefined}>
					<p className="gw-driver__status is-rejected"><X size={18} /> Action required</p>
					<p>Review the reason above, update your details and resubmit.</p>
					<div className="gw-buttons">
						<button className="gw-btn gw-btn--gold" disabled={pct !== 100} onClick={() => void submit()}>Resubmit for approval</button>
					</div>
				</Panel>
			)}
			{status === "Approved" && (
				<Panel title="Approved">
					<p className="gw-driver__status is-approved"><CircleCheck size={18} /> Approved driver</p>
					<p>You are an approved GiftWako driver. Watch Available Jobs and My Trips for bookings.</p>
				</Panel>
			)}
			{status === "Suspended" && (
				<Panel title="Suspended">
					<p className="gw-driver__status is-suspended"><Ban size={18} /> Suspended</p>
					<p>Your driver account is suspended. Contact GiftWako Travel on WhatsApp 070 617 8269.</p>
				</Panel>
			)}

			<div style={{ display: "grid", gap: "1.2rem", gridTemplateColumns: "1fr 1fr", marginTop: "1.2rem" }}>
				<Panel title="Upcoming trips">
					{upcoming.length === 0 && <p className="gw-small">No upcoming trips.</p>}
					{upcoming.map((t) => (
						<Dr key={t.id} k={`${t.trip_date ?? ""} ${t.trip_time ?? ""}`} v={`${t.title} · ${t.status}`} />
					))}
				</Panel>
				<Panel title="Latest notifications">
					{notifications.slice(0, 5).map((n) => (
						<Dr key={n.id} k={n.title} v={fdate(n.created_at)} />
					))}
					{notifications.length === 0 && <p className="gw-small">No notifications yet.</p>}
				</Panel>
			</div>
		</>
	);
}

/* ============================ PROFILE ============================ */

function Profile() {
	const { user, profile, loaded, reload } = useDriver();
	const [f, setF] = useState<Row | null>(null);
	const [saving, setSaving] = useState(false);
	const cur = f ?? profile ?? {};
	const locked = profile?.status === "Pending";

	const set = (k: string, v: unknown) => setF({ ...(f ?? profile ?? {}), [k]: v });
	const s = (k: string) => (cur[k] as string | undefined) ?? "";
	const arr = (k: string) => (cur[k] as string[] | undefined) ?? [];
	const tog = (k: string, v: string) => {
		const a = new Set(arr(k));
		if (a.has(v)) { a.delete(v); } else { a.add(v); }
		set(k, [...a]);
	};

	const fld = (k: string, label: string, type = "text", ph?: string, ro?: boolean) => (
		<div className="gw-form__field"><label className="gw-form__label">{label}</label>
			<input type={type} value={s(k)} onChange={(e) => set(k, e.target.value)} placeholder={ph} disabled={locked || ro} />
		</div>
	);
	const sel = (k: string, label: string, opts: string[]) => (
		<div className="gw-form__field"><label className="gw-form__label">{label}</label>
			<select value={s(k)} onChange={(e) => set(k, e.target.value)} disabled={locked}>
				<option value="">Select…</option>{opts.map((o) => <option key={o}>{o}</option>)}
			</select>
		</div>
	);

	const save = async () => {
		const c = supabase();
		if (!c) { toast("Not connected to the database"); return; }
		setSaving(true);
		const row = { ...cur };
		for (const k of ["status", "rejection_reason", "submitted_at", "reviewed_at", "created_at", "updated_at", "email"]) delete row[k];
		row.services = (row.services as string[] | undefined) ?? [];
		row.available_days = (row.available_days as string[] | undefined) ?? [];
		row.user_id = user.id;
		const { error } = await c.from("driver_profiles").upsert(cleanRow(row), { onConflict: "user_id" });
		setSaving(false);
		if (error) { toast(`Save failed: ${error.message}`); return; }
		toast("Profile saved");
		void reload();
	};

	if (!loaded) return <p className="gw-small">Loading…</p>;

	return (
		<Panel
			title="My profile"
			sub={locked ? "Your profile is under review and cannot be edited until a decision is made." : "Keep your details up to date — they feed your approval and payouts."}
		>
			<h4>Personal</h4>
			<div className="gw-form__grid">
				{fld("full_name", "Full name")}
				{fld("surname", "Surname")}
				{fld("dob", "Date of birth", "date")}
				{fld("sa_id", "SA ID number")}
				{sel("gender", "Gender", ["Male", "Female", "Other"])}
				{fld("nationality", "Nationality")}
				{fld("phone", "Mobile number", "tel")}
				{fld("whatsapp", "WhatsApp number", "tel")}
				{fld("email", "Email address", "email", undefined, true)}
			</div>
			<h4>Address</h4>
			<div className="gw-form__grid">
				{fld("address", "Residential address")}
				{fld("town", "City / town", "text", "Tzaneen")}
				{fld("province", "Province", "text", "Limpopo")}
			</div>
			<h4>Emergency contact</h4>
			<div className="gw-form__grid">
				{fld("emergency_name", "Contact name")}
				{fld("emergency_phone", "Contact phone", "tel")}
				{fld("emergency_relation", "Relationship")}
			</div>
			<h4>Licence & PrDP</h4>
			<div className="gw-form__grid">
				{fld("licence_number", "Driver's licence number")}
				{sel("licence_code", "Licence code", ["A", "A1", "B", "EB", "C1", "EC1", "C", "EC"])}
				{fld("licence_expiry", "Licence expiry", "date")}
				{fld("prdp_number", "PrDP number (if applicable)")}
				{fld("prdp_expiry", "PrDP expiry", "date")}
			</div>
			<h4>Services</h4>
			<div className="gw-form__checklist">
				{SERVICES.map((sv) => (
					<label className="gw-form__check" key={sv}>
						<input type="checkbox" checked={arr("services").includes(sv)} onChange={() => tog("services", sv)} disabled={locked} /> {sv}
					</label>
				))}
			</div>
			<div className="gw-form__grid" style={{ marginTop: "0.8rem" }}>
				{fld("operating_province", "Operating province", "text", "Limpopo")}
				{fld("towns_served", "Towns or cities served")}
				{fld("working_hours", "Preferred working hours", "text", "e.g. 06:00–18:00")}
				{sel("pricing", "How do you price?", PRICING)}
			</div>
			<div className="gw-form__field" style={{ marginTop: "0.8rem" }}>
				<label className="gw-form__label">Available days</label>
				<div className="gw-form__checklist">
					{DAYS.map((d) => (
						<label className="gw-form__check" key={d}>
							<input type="checkbox" checked={arr("available_days").includes(d)} onChange={() => tog("available_days", d)} disabled={locked} /> {d}
						</label>
					))}
				</div>
			</div>
			<h4>Banking</h4>
			<div className="gw-form__grid">
				{fld("account_holder", "Account holder name")}
				{fld("bank_name", "Bank name")}
				{sel("account_type", "Account type", ["Cheque", "Savings", "Transmission"])}
				{fld("account_number", "Account number")}
				{fld("branch_code", "Branch code")}
			</div>
			{!locked && (
				<div className="gw-buttons" style={{ marginTop: "1rem" }}>
					<button className="gw-btn gw-btn--gold" disabled={saving} onClick={() => void save()}>
						{saving ? "Saving…" : "Save profile"}
					</button>
				</div>
			)}
		</Panel>
	);
}

/* ============================ VEHICLES ============================ */

function Vehicles() {
	const { user, vehicles, loaded, reload, confirm } = useDriver();
	const [editing, setEditing] = useState<Row | null>(null); // null = list, {} = new
	const [photos, setPhotos] = useState<File[]>([]);
	const [saving, setSaving] = useState(false);
	const fileRef = useRef<HTMLInputElement>(null);

	const s = (k: string) => (editing?.[k] as string | undefined) ?? "";
	const set = (k: string, v: unknown) => setEditing((e) => ({ ...(e ?? {}), [k]: v }));

	const uploadPhotos = async (uid: string): Promise<string[]> => {
		const c = supabase()!;
		const urls: string[] = [];
		for (const fl of photos) {
			const path = `${uid}/vehicles/${Date.now()}-${fl.name.replace(/[^\w.-]+/g, "-")}`;
			const { error } = await c.storage.from("driver-docs").upload(path, fl);
			if (error) { toast(`Photo upload failed: ${error.message}`); continue; }
			urls.push(c.storage.from("driver-docs").getPublicUrl(path).data.publicUrl);
		}
		return urls;
	};

	const save = async () => {
		const c = supabase();
		if (!c) { toast("Not connected to the database"); return; }
		setSaving(true);
		const urls = await uploadPhotos(user.id);
		const row = cleanRow<Row>({
			user_id: user.id,
			make: s("make"), model: s("model"), year: s("year"),
			colour: s("colour"), reg: s("reg"), vehicle_type: s("vehicle_type"),
			capacity: s("capacity"),
			doors: s("doors"),
			aircon: editing?.aircon !== false, luggage: s("luggage"), fuel_type: s("fuel_type"),
		}, ["capacity", "doors"]);
		let error;
		if (editing?.id) {
			if (urls.length) row.photo_urls = [...(editing.photo_urls ?? []), ...urls];
			({ error } = await c.from("driver_vehicles").update(row).eq("id", editing.id));
		} else {
			row.photo_urls = urls;
			({ error } = await c.from("driver_vehicles").insert(row));
		}
		setSaving(false);
		if (error) { toast(`Save failed: ${error.message}`); return; }
		toast(editing?.id ? "Vehicle updated" : "Vehicle added");
		setEditing(null);
		setPhotos([]);
		void reload();
	};

	const remove = (v: Row) => confirm({
		title: "Remove vehicle?",
		body: `Remove ${v.make ?? ""} ${v.model ?? ""} (${v.reg ?? ""})? Vehicle documents linked to it will also be deleted.`,
		okLabel: "Remove",
		action: () => void (async () => {
			const c = supabase();
			if (!c) return;
			const { error } = await c.from("driver_vehicles").delete().eq("id", v.id);
			if (error) { toast(`Delete failed: ${error.message}`); return; }
			toast("Vehicle removed");
			void reload();
		})(),
	});

	if (!loaded) return <p className="gw-small">Loading…</p>;

	if (editing !== null) {
		const fld = (k: string, label: string, type = "text", ph?: string) => (
			<div className="gw-form__field"><label className="gw-form__label">{label}</label>
				<input type={type} value={s(k)} onChange={(e) => set(k, e.target.value)} placeholder={ph} />
			</div>
		);
		const sel = (k: string, label: string, opts: string[]) => (
			<div className="gw-form__field"><label className="gw-form__label">{label}</label>
				<select value={s(k)} onChange={(e) => set(k, e.target.value)}>
					<option value="">Select…</option>{opts.map((o) => <option key={o}>{o}</option>)}
				</select>
			</div>
		);
		return (
			<Panel title={editing.id ? "Edit vehicle" : "Add vehicle"}>
				<div className="gw-form__grid">
					{fld("make", "Vehicle make", "text", "Toyota")}
					{fld("model", "Model", "text", "Quantum")}
					{fld("year", "Year", "text", "2023")}
					{fld("colour", "Colour", "text", "White")}
					{fld("reg", "Registration number", "text", "ABC 123 L")}
					{sel("vehicle_type", "Vehicle type", VEHICLE_TYPES)}
					{fld("capacity", "Passenger capacity (excl. driver)", "number")}
					{fld("doors", "Number of doors", "number")}
					{sel("luggage", "Luggage capacity", ["Small", "Medium", "Large"])}
					{sel("fuel_type", "Fuel type", ["Petrol", "Diesel", "Hybrid", "Electric"])}
				</div>
				<label className="gw-form__check" style={{ marginTop: "0.6rem" }}>
					<input type="checkbox" checked={editing.aircon !== false} onChange={(e) => set("aircon", e.target.checked)} /> Air conditioning
				</label>
				<div className="gw-form__field" style={{ marginTop: "0.8rem" }}>
					<label className="gw-form__label">Vehicle photos</label>
					<input ref={fileRef} type="file" accept="image/*" multiple onChange={(e) => setPhotos([...(e.target.files ?? [])])} />
					{photos.length > 0 && <p className="gw-form__hint">{photos.length} new photo(s) selected</p>}
				</div>
				{(editing.photo_urls ?? []).length > 0 && (
					<div style={{ display: "flex", gap: "0.6rem", flexWrap: "wrap", margin: "0.6rem 0" }}>
						{(editing.photo_urls as string[]).map((u) => (
							<a key={u} href={u} target="_blank" rel="noreferrer">
								{/* eslint-disable-next-line @next/next/no-img-element */}
								<img src={u} alt="Vehicle" style={{ width: 96, height: 72, objectFit: "cover", borderRadius: 8 }} />
							</a>
						))}
					</div>
				)}
				<div className="gw-buttons" style={{ marginTop: "1rem" }}>
					<button className="gw-btn gw-btn--gold" disabled={saving} onClick={() => void save()}>{saving ? "Saving…" : "Save vehicle"}</button>
					<button className="gw-btn gw-btn--outline gw-btn--outline-dark" onClick={() => { setEditing(null); setPhotos([]); }}>Cancel</button>
				</div>
			</Panel>
		);
	}

	return (
		<Panel
			title="My vehicles"
			actions={<button className="gw-btn gw-btn--gold gw-btn--small" onClick={() => setEditing({})}>+ Add vehicle</button>}
		>
			<Table
				cols={[
					{ key: "v", label: "Vehicle", render: (r: Row) => <strong>{r.make ?? ""} {r.model ?? ""} · {r.reg ?? ""}</strong> },
					{ key: "t", label: "Type", render: (r) => `${r.vehicle_type ?? "—"} · ${r.capacity ?? "?"} pax` },
					{ key: "ph", label: "Photos", render: (r) => String((r.photo_urls ?? []).length) },
					{ key: "s", label: "Status", render: (r) => <Pill status={r.status} /> },
					{
						key: "a", label: "", render: (r) => (
							<span className="gw-buttons" style={{ gap: "0.4rem" }}>
								<button className="gw-btn gw-btn--outline gw-btn--outline-dark gw-btn--small" onClick={(e) => { e.stopPropagation(); setEditing(r); }}>Edit</button>
								<button className="gw-btn gw-btn--outline gw-btn--outline-dark gw-btn--small" onClick={(e) => { e.stopPropagation(); remove(r); }}>Remove</button>
							</span>
						),
					},
				]}
				rows={vehicles}
				empty="No vehicles yet — add your first vehicle."
			/>
		</Panel>
	);
}

/* ============================ DOCUMENTS ============================ */

function Documents() {
	const { user, vehicles, documents, loaded, reload } = useDriver();
	const [vehSel, setVehSel] = useState<Record<string, number | "">>({});
	const [expiry, setExpiry] = useState<Record<string, string>>({});
	const [busy, setBusy] = useState<string | null>(null);
	const refs = useRef<Record<string, HTMLInputElement | null>>({});

	if (!loaded) return <p className="gw-small">Loading…</p>;

	const docFor = (type: string, vehicleId?: number) =>
		documents.filter((d) => d.doc_type === type && (vehicleId === undefined ? d.vehicle_id == null : d.vehicle_id === vehicleId))[0];

	const expSoon = (d?: string | null) => d && (new Date(d).getTime() - Date.now()) < 30 * 86400000;

	const upload = async (type: string, fl: File) => {
		const c = supabase();
		if (!c) { toast("Not connected to the database"); return; }
		const vehId = vehSel[type] === "" ? undefined : vehSel[type];
		const needsVeh = DOC_TYPES.find((t) => t.key === type)?.vehicle;
		if (needsVeh && vehId === undefined && vehicles.length > 1) { toast("Choose which vehicle this document belongs to."); return; }
		const finalVehId = needsVeh ? (vehId ?? vehicles[0]?.id) : undefined;
		if (needsVeh && !finalVehId) { toast("Add a vehicle first."); return; }
		setBusy(type);
		const path = `${user.id}/docs/${Date.now()}-${type}-${fl.name.replace(/[^\w.-]+/g, "-")}`;
		const { error: upErr } = await c.storage.from("driver-docs").upload(path, fl);
		if (upErr) { toast(`Upload failed: ${upErr.message}`); setBusy(null); return; }
		const url = c.storage.from("driver-docs").getPublicUrl(path).data.publicUrl;
		let q = c.from("driver_documents").delete().eq("user_id", user.id).eq("doc_type", type);
		q = finalVehId ? q.eq("vehicle_id", finalVehId) : q.is("vehicle_id", null);
		await q;
		const { error } = await c.from("driver_documents").insert(cleanRow<Row>({
			user_id: user.id,
			vehicle_id: finalVehId ?? null,
			doc_type: type,
			file_url: url,
			file_name: fl.name,
			expiry: expiry[type],
			status: "Pending",
		}));
		setBusy(null);
		if (error) { toast(`Save failed: ${error.message}`); return; }
		toast("Document uploaded");
		void reload();
	};

	return (
		<Panel title="My documents" sub="Upload each document. Vehicle documents must be linked to a vehicle.">
			<Table
				pageSize={15}
				cols={[
					{
						key: "d", label: "Document", render: (t: (typeof DOC_TYPES)[number]) => (
							<span>{t.label}{t.required ? " *" : ""}{t.vehicle && <> <Car size={14} style={{ verticalAlign: "-2px", display: "inline" }} /></>}</span>
						),
					},
					{
						key: "veh", label: "Vehicle", render: (t) => {
							if (!t.vehicle) return "—";
							if (vehicles.length === 0) return <span className="gw-small">Add a vehicle first</span>;
							if (vehicles.length === 1) return vehicles[0].reg ?? "Vehicle 1";
							return (
								<select
									value={vehSel[t.key] ?? ""}
									onChange={(e) => setVehSel((p) => ({ ...p, [t.key]: e.target.value ? Number(e.target.value) : "" }))}
								>
									<option value="">Choose vehicle…</option>
									{vehicles.map((v) => <option key={v.id} value={v.id}>{v.reg ?? `${v.make} ${v.model}`}</option>)}
								</select>
							);
						},
					},
					{
						key: "cur", label: "Current file", render: (t) => {
							const vehId = t.vehicle ? (vehSel[t.key] === "" ? undefined : Number(vehSel[t.key])) ?? (vehicles.length === 1 ? vehicles[0]?.id : undefined) : undefined;
							const d = t.vehicle ? documents.filter((x) => x.doc_type === t.key && (vehId === undefined || x.vehicle_id === vehId))[0] : docFor(t.key);
							if (!d) return "—";
							return (
								<span>
									<a href={d.file_url} target="_blank" rel="noreferrer">{d.file_name ?? "View"} <ExternalLink size={13} style={{ verticalAlign: "-2px", display: "inline" }} /></a>
									{d.expiry && <span className="gw-small"> · exp {d.expiry}{expSoon(d.expiry) && <> <AlertTriangle size={13} style={{ verticalAlign: "-2px", display: "inline", color: "#B7791F" }} /></>}</span>}
									{" "}<Pill status={d.status} />
									{d.note && <span className="gw-small"> · {d.note}</span>}
								</span>
							);
						},
					},
					{
						key: "exp", label: "Expiry", render: (t) => (
							<input type="date" value={expiry[t.key] ?? ""} onChange={(e) => setExpiry((p) => ({ ...p, [t.key]: e.target.value }))} style={{ font: "inherit", fontSize: "0.85rem", padding: "0.25rem 0.4rem" }} />
						),
					},
					{
						key: "a", label: "", render: (t) => (
							<>
								<input
									ref={(el) => { refs.current[t.key] = el; }}
									type="file" accept="image/*,.pdf" style={{ display: "none" }}
									onChange={(e) => { const fl = e.target.files?.[0]; if (fl) void upload(t.key, fl); e.target.value = ""; }}
								/>
								<button
									className="gw-btn gw-btn--outline gw-btn--outline-dark gw-btn--small"
									disabled={busy === t.key}
									onClick={() => refs.current[t.key]?.click()}
								>
									{busy === t.key ? "Uploading…" : "Upload / replace"}
								</button>
							</>
						),
					},
				]}
				rows={DOC_TYPES}
				empty=""
			/>
		</Panel>
	);
}
