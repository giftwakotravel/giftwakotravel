"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Dr, Drawer, Pill, SearchInput, SubTabs, Table, fmtR } from "@/components/admin/ui";
import { useAdmin, type Section } from "@/components/admin/AdminDash";
import { supabase } from "@/lib/supabase";
import { toast } from "@/components/Toaster";
import { cleanRow } from "@/lib/driver-portal";
import { SERVICE_OPTIONS } from "@/lib/booking";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type R = Record<string, any>;

export default function BookingSections({ section }: { section: Section }) {
	if (section === "service-bookings") return <OnlineBookings />;
	if (section === "packages") return <PackagesAdmin />;
	if (section === "transport-rates") return <TransportRates />;
	return null;
}

const fmtDate = (s?: string | null) => (s ? new Date(s + "T00:00:00").toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" }) : "—");
const slugify = (s: string) => s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

/* ================================================================ online bookings */

const SB_TABS = ["All", "Pending", "Confirmed", "Completed", "Cancelled", "Declined"];

export function usePendingBookingCount() {
	const [n, setN] = useState(0);
	useEffect(() => {
		const c = supabase();
		if (!c) return;
		void c.from("service_bookings").select("id", { count: "exact", head: true }).eq("status", "Pending")
			.then(({ count }) => setN(count ?? 0));
	}, []);
	return n;
}

function OnlineBookings() {
	const { confirm } = useAdmin();
	const [rows, setRows] = useState<R[]>([]);
	const [drivers, setDrivers] = useState<R[]>([]);
	const [loading, setLoading] = useState(true);
	const [loadErr, setLoadErr] = useState(false);
	const [sub, setSub] = useState("All");
	const [svc, setSvc] = useState("all");
	const [q, setQ] = useState("");
	const [sel, setSel] = useState<R | null>(null);
	const [declineReason, setDeclineReason] = useState("");

	const load = useCallback(async () => {
		setLoading(true);
		const c = supabase();
		if (!c) { setLoadErr(true); setLoading(false); return; }
		const [{ data, error }, d] = await Promise.all([
			c.from("service_bookings").select("*").order("created_at", { ascending: false }),
			c.from("driver_profiles").select("user_id,full_name,surname,town").eq("status", "Approved"),
		]);
		if (error) setLoadErr(true);
		else { setRows(data ?? []); setDrivers(d.data ?? []); }
		setLoading(false);
	}, []);

	useEffect(() => { void load(); }, [load]);

	const update = async (r: R, patch: R, msg: string) => {
		const c = supabase();
		if (!c) { toast("Not connected to the database"); return; }
		const { error } = await c.from("service_bookings").update(patch).eq("id", r.id);
		if (error) { toast(`Update failed: ${error.message}`); return; }
		setRows((rs) => rs.map((x) => (x.id === r.id ? { ...x, ...patch } : x)));
		setSel((s) => (s?.id === r.id ? { ...s, ...patch } : s));
		toast(msg);
	};

	const setStatus = (r: R, status: string, extra?: R) =>
		confirm({
			title: `${status} booking ${r.ref}?`,
			body: status === "Declined" || status === "Cancelled" ? "The customer will be informed." : `Mark ${r.ref} as ${status.toLowerCase()}.`,
			okLabel: status,
			action: () => void update(r, { status, ...extra }, `${r.ref} → ${status}`),
		});

	const markPaid = (r: R, deposit: boolean) =>
		update(r, {
			payment_status: deposit ? "Deposit paid" : "Paid",
			amount_paid: deposit ? r.deposit_due ?? 0 : r.quoted_total ?? r.amount_paid,
			paid_at: new Date().toISOString(),
		}, `${r.ref} marked ${deposit ? "deposit " : ""}paid`);

	const assignDriver = async (r: R, uid: string) => {
		const c = supabase();
		if (!c) { toast("Not connected to the database"); return; }
		const { error } = await c.from("service_bookings").update({ assigned_driver: uid }).eq("id", r.id);
		if (error) { toast(`Assign failed: ${error.message}`); return; }
		const title = r.item_title || `Transport booking ${r.ref}`;
		await c.from("driver_trips").insert({
			user_id: uid,
			title,
			pickup: r.pickup, dropoff: r.dropoff,
			trip_date: r.date_from, passengers: r.pax,
			amount: r.quoted_total, notes: r.notes,
			status: "Assigned",
		});
		await c.from("driver_notifications").insert({
			user_id: uid, type: "trip",
			title: "New trip assigned",
			body: `New trip assigned: ${title} on ${fmtDate(r.date_from)}`,
		});
		setRows((rs) => rs.map((x) => (x.id === r.id ? { ...x, assigned_driver: uid } : x)));
		setSel((s) => (s?.id === r.id ? { ...s, assigned_driver: uid } : s));
		toast(`Assigned to driver — trip created`);
	};

	const counts = Object.fromEntries(SB_TABS.map((t) => [t, t === "All" ? rows.length : rows.filter((r) => r.status === t).length]));
	const svcOptions = SERVICE_OPTIONS.filter((s) => s.key !== "all");
	const filtered = rows.filter((r) =>
		(sub === "All" || r.status === sub) &&
		(svc === "all" || r.service === svc) &&
		(!q || `${r.ref} ${r.customer_name} ${r.customer_phone} ${r.item_title ?? ""}`.toLowerCase().includes(q.toLowerCase())),
	);

	return (
		<>
			<div className="gw-toolbar">
				<SubTabs tabs={SB_TABS} active={sub} onChange={setSub} counts={counts} />
				<button className="gw-btn gw-btn--outline gw-btn--outline-dark gw-btn--small" onClick={() => void load()}>
					{loading ? "Refreshing…" : "↻ Refresh"}
				</button>
			</div>
			<div className="gw-toolbar">
				<div className="gw-filter">
					<button className={`gw-filter__btn${svc === "all" ? " is-active" : ""}`} onClick={() => setSvc("all")}>All services</button>
					{svcOptions.map((s) => (
						<button key={s.key} className={`gw-filter__btn${svc === s.key ? " is-active" : ""}`} onClick={() => setSvc(s.key)}>{s.label}</button>
					))}
				</div>
			</div>
			<div className="gw-toolbar">
				<SearchInput value={q} onChange={setQ} placeholder="Search ref, name, phone, item…" />
				<span className="gw-small">Online bookings from /book — confirm, assign drivers, record payment.</span>
			</div>

			{loading ? (
				<p className="gw-small" style={{ padding: "2rem", textAlign: "center" }}>Loading bookings…</p>
			) : loadErr ? (
				<div className="gw-denote">Could not load service_bookings — check the table exists and anon policy allows reads.</div>
			) : (
				<Table
					cols={[
						{ key: "ref", label: "Ref", render: (r: R) => <strong>{r.ref}</strong>, sortKey: (r) => r.ref },
						{ key: "svc", label: "Service", render: (r) => SERVICE_OPTIONS.find((s) => s.key === r.service)?.label ?? r.service },
						{ key: "item", label: "Item", render: (r) => r.item_title ?? "—" },
						{ key: "dates", label: "Dates", render: (r) => `${fmtDate(r.date_from)}${r.date_to && r.date_to !== r.date_from ? ` → ${fmtDate(r.date_to)}` : ""}` },
						{ key: "pax", label: "Pax", render: (r) => r.pax, sortKey: (r) => r.pax },
						{ key: "cust", label: "Customer", render: (r) => `${r.customer_name}${r.customer_phone ? ` · ${r.customer_phone}` : ""}` },
						{ key: "quote", label: "Quote", render: (r) => (r.quoted_total != null ? fmtR(r.quoted_total) : "—"), sortKey: (r) => r.quoted_total ?? 0 },
						{ key: "pay", label: "Payment", render: (r) => <Pill status={r.payment_status} /> },
						{ key: "status", label: "Status", render: (r) => <Pill status={r.status} /> },
						{ key: "at", label: "Created", render: (r) => new Date(r.created_at).toLocaleDateString("en-ZA"), sortKey: (r) => r.created_at },
					]}
					rows={filtered}
					empty={rows.length === 0 ? "No online bookings yet — bookings from /book appear here." : "No bookings match."}
					onRow={setSel}
				/>
			)}

			{sel && (
				<Drawer title={`${sel.ref} — ${sel.customer_name}`} onClose={() => { setSel(null); setDeclineReason(""); }} wide>
					<div className="gw-grid-2" style={{ gap: "1rem" }}>
						<Dr k="Status" v={<Pill status={sel.status} />} />
						<Dr k="Payment" v={<Pill status={sel.payment_status} />} />
						<Dr k="Service" v={SERVICE_OPTIONS.find((s) => s.key === sel.service)?.label ?? sel.service} />
						<Dr k="Item" v={sel.item_title ?? "—"} />
						<Dr k="Dates" v={`${fmtDate(sel.date_from)}${sel.date_to && sel.date_to !== sel.date_from ? ` → ${fmtDate(sel.date_to)}` : ""}`} />
						<Dr k="Pax" v={sel.pax} />
						<Dr k="Quote" v={sel.quoted_total != null ? fmtR(sel.quoted_total) : "On request"} />
						<Dr k="Deposit due" v={sel.deposit_due != null ? fmtR(sel.deposit_due) : "—"} />
						<Dr k="Paid" v={fmtR(sel.amount_paid ?? 0)} />
						<Dr k="Customer" v={`${sel.customer_name} · ${sel.customer_phone}`} />
						<Dr k="Email" v={sel.customer_email ?? "—"} />
						<Dr k="Contact via" v={sel.contact_method ?? "—"} />
						{sel.pickup && <Dr k="Pickup" v={sel.pickup} />}
						{sel.dropoff && <Dr k="Drop-off" v={sel.dropoff} />}
						{sel.assigned_driver && <Dr k="Driver" v={drivers.find((d) => d.user_id === sel.assigned_driver) ? `${drivers.find((d) => d.user_id === sel.assigned_driver)!.full_name} ${drivers.find((d) => d.user_id === sel.assigned_driver)!.surname}` : sel.assigned_driver} />}
						<Dr k="Created" v={new Date(sel.created_at).toLocaleString("en-ZA")} />
					</div>
					{Object.keys(sel.selection ?? {}).length > 0 && (
						<><h4>Selection</h4>
							<div className="gw-grid-2" style={{ gap: "1rem" }}>
								{Object.entries(sel.selection).map(([k, val]) => <Dr key={k} k={k} v={String(val)} />)}
							</div>
						</>
					)}
					{sel.notes && <><h4>Notes</h4><p>{sel.notes}</p></>}
					{sel.admin_notes && <><h4>Admin notes</h4><p>{sel.admin_notes}</p></>}

					<h4>Actions</h4>
					<div className="gw-buttons">
						{sel.status === "Pending" && <button className="gw-btn gw-btn--gold" onClick={() => setStatus(sel, "Confirmed")}>Confirm booking</button>}
						{sel.status === "Confirmed" && <button className="gw-btn gw-btn--gold" onClick={() => setStatus(sel, "Completed")}>Mark completed</button>}
						{sel.status === "Confirmed" && <button className="gw-btn gw-btn--outline gw-btn--outline-dark" onClick={() => setStatus(sel, "Cancelled")}>Cancel booking</button>}
						{sel.status === "Pending" && sel.deposit_due != null && <button className="gw-btn gw-btn--outline gw-btn--outline-dark" onClick={() => markPaid(sel, true)}>Mark deposit paid</button>}
						{sel.payment_status !== "Paid" && sel.quoted_total != null && <button className="gw-btn gw-btn--outline gw-btn--outline-dark" onClick={() => markPaid(sel, false)}>Mark paid</button>}
					</div>
					{sel.status === "Pending" && (
						<div style={{ marginTop: "0.8rem" }}>
							{!declineReason ? (
								<button className="gw-btn gw-btn--outline gw-btn--outline-dark" onClick={() => setDeclineReason(" ")}>Decline…</button>
							) : (
								<div className="gw-toolbar">
									<input value={declineReason.trim()} onChange={(e) => setDeclineReason(e.target.value)} placeholder="Reason for declining (optional)" style={{ flex: 1 }} />
									<button className="gw-btn gw-btn--gold" onClick={() => setStatus(sel, "Declined", { admin_notes: declineReason.trim() || null })}>Decline booking</button>
								</div>
							)}
						</div>
					)}

					{sel.service === "transport" && sel.status !== "Cancelled" && sel.status !== "Declined" && (
						<>
							<h4>Assign driver</h4>
							{drivers.length === 0 ? (
								<p className="gw-small">No approved drivers yet.</p>
							) : (
								<select
									className="gw-form__select"
									value={sel.assigned_driver ?? ""}
									onChange={(e) => e.target.value && void assignDriver(sel, e.target.value)}
									style={{ maxWidth: 340, padding: "0.5rem", borderRadius: 8, border: "1px solid var(--gw-line)", font: "inherit" }}
								>
									<option value="">Choose a driver…</option>
									{drivers.map((d) => (
										<option key={d.user_id} value={d.user_id}>{d.full_name} {d.surname}{d.town ? ` · ${d.town}` : ""}</option>
									))}
								</select>
							)}
						</>
					)}
				</Drawer>
			)}
		</>
	);
}

/* ================================================================ packages CRUD */

const PKG_CATS = ["tours", "getaways", "complete", "groups"];

const emptyPkg = (): R => ({
	slug: "", category: "tours", title: "", subtitle: "", description: "",
	image: "", image_alt: "", destination: "", province: "", pickup_towns: "",
	duration_days: 1, nights: 0, price_from: "", price_rows: [], includes_text: "",
	dates: [], seats: "", deposit: "", note: "", featured: false, status: "Active", sort: 100,
});

const pkgToForm = (p: R): R => ({
	...emptyPkg(), ...p,
	pickup_towns: (p.pickup_towns ?? []).join(", "),
	includes_text: (p.includes ?? []).join("\n"),
	price_from: p.price_from ?? "", seats: p.seats ?? "", deposit: p.deposit ?? "",
	price_rows: p.price_rows ?? [],
});

function PackagesAdmin() {
	const { confirm } = useAdmin();
	const [rows, setRows] = useState<R[]>([]);
	const [loading, setLoading] = useState(true);
	const [sub, setSub] = useState("tours");
	const [edit, setEdit] = useState<R | null>(null);
	const [saving, setSaving] = useState(false);
	const [uploading, setUploading] = useState(false);
	const [newDate, setNewDate] = useState("");

	const load = useCallback(async () => {
		setLoading(true);
		const c = supabase();
		if (!c) { setLoading(false); return; }
		const { data } = await c.from("packages").select("*").order("sort").order("title");
		setRows(data ?? []);
		setLoading(false);
	}, []);
	useEffect(() => { void load(); }, [load]);

	const save = async () => {
		const c = supabase();
		if (!c || !edit) return;
		if (!edit.title.trim() || !edit.slug.trim()) { toast("Title and slug are required"); return; }
		setSaving(true);
		const row = cleanRow({
			slug: edit.slug, category: edit.category, title: edit.title, subtitle: edit.subtitle,
			description: edit.description, image: edit.image, image_alt: edit.image_alt,
			destination: edit.destination, province: edit.province,
			pickup_towns: String(edit.pickup_towns ?? "").split(",").map((s) => s.trim()).filter(Boolean),
			duration_days: edit.duration_days, nights: edit.nights, price_from: edit.price_from,
			price_rows: (edit.price_rows ?? []).map((r: R) => ({ label: r.label, price: r.price === "" ? null : Number(r.price), note: r.note || null })),
			includes: String(edit.includes_text ?? "").split("\n").map((s) => s.trim()).filter(Boolean),
			dates: [...(edit.dates ?? [])].sort(),
			seats: edit.seats, deposit: edit.deposit, note: edit.note,
			featured: !!edit.featured, status: edit.status, sort: edit.sort,
		}, ["duration_days", "nights", "price_from", "seats", "deposit", "sort"]);
		const { error } = edit.id
			? await c.from("packages").update(row).eq("id", edit.id)
			: await c.from("packages").insert(row);
		setSaving(false);
		if (error) { toast(`Save failed: ${error.message}`); return; }
		toast(`Package ${edit.id ? "updated" : "created"}`);
		setEdit(null);
		void load();
	};

	const del = (p: R) =>
		confirm({
			title: `Delete ${p.title}?`,
			body: "This cannot be undone. If bookings reference it, the package is archived instead.",
			okLabel: "Delete",
			action: async () => {
				const c = supabase();
				if (!c) return;
				const { count } = await c.from("service_bookings").select("id", { count: "exact", head: true }).eq("item_id", p.id);
				if ((count ?? 0) > 0) {
					await c.from("packages").update({ status: "Archived" }).eq("id", p.id);
					toast(`${p.title} has ${count} booking(s) — archived instead of deleted`);
				} else {
					const { error } = await c.from("packages").delete().eq("id", p.id);
					if (error) { toast(`Delete failed: ${error.message}`); return; }
					toast(`${p.title} deleted`);
				}
				void load();
			},
		});

	const upload = async (file: File) => {
		const c = supabase();
		if (!c) { toast("Not connected to the database"); return; }
		setUploading(true);
		const fname = `packages/${Date.now()}-${file.name.replace(/[^\w.-]+/g, "-")}`;
		const { error } = await c.storage.from("media").upload(fname, file, { upsert: true });
		setUploading(false);
		if (error) { toast(`Upload failed: ${error.message}`); return; }
		setEdit((e) => ({ ...e!, image: c.storage.from("media").getPublicUrl(fname).data.publicUrl }));
		toast("Image uploaded");
	};

	const filtered = rows.filter((r) => r.category === sub);
	const nextDate = (p: R) => [...(p.dates ?? [])].sort().find((d: string) => d >= new Date().toISOString().slice(0, 10)) ?? (p.dates ?? [])[0];
	const setE = (k: string, v: unknown) => setEdit((e) => ({ ...e!, [k]: v }));

	const fld = (k: string, label: string, type = "text") => (
		<div className="gw-form__field"><label className="gw-form__label">{label}</label>
			<input type={type} value={edit?.[k] ?? ""} onChange={(e) => setE(k, e.target.value)} />
		</div>
	);

	return (
		<>
			<div className="gw-toolbar">
				<SubTabs tabs={PKG_CATS} active={sub} onChange={setSub} counts={Object.fromEntries(PKG_CATS.map((c) => [c, rows.filter((r) => r.category === c).length]))} />
				<button className="gw-btn gw-btn--gold gw-btn--small" onClick={() => setEdit(emptyPkg())}>+ New package</button>
			</div>
			{loading ? <p className="gw-small" style={{ padding: "2rem", textAlign: "center" }}>Loading packages…</p> : (
				<Table
					cols={[
						{ key: "title", label: "Title", render: (p: R) => <strong>{p.title}</strong>, sortKey: (p) => p.title },
						{ key: "cat", label: "Category", render: (p) => p.category },
						{ key: "dest", label: "Destination", render: (p) => p.destination ?? "—" },
						{ key: "dur", label: "Duration", render: (p) => (p.nights ? `${p.duration_days}d / ${p.nights}n` : `${p.duration_days}d`) },
						{ key: "price", label: "From", render: (p) => (p.price_from != null ? fmtR(p.price_from) : "On request"), sortKey: (p) => p.price_from ?? 0 },
						{ key: "next", label: "Next date", render: (p) => (nextDate(p) ? fmtDate(nextDate(p)) : "On request"), sortKey: (p) => nextDate(p) ?? "" },
						{ key: "seats", label: "Seats", render: (p) => p.seats ?? "∞" },
						{ key: "status", label: "Status", render: (p) => <Pill status={p.status} /> },
					]}
					rows={filtered}
					empty="No packages in this category."
					onRow={(p) => setEdit(pkgToForm(p))}
				/>
			)}

			{edit && (
				<Drawer title={edit.id ? `Edit — ${edit.title}` : "New package"} onClose={() => setEdit(null)} wide>
					<div className="gw-form__grid">
						{fld("title", "Title *")}
						<div className="gw-form__field"><label className="gw-form__label">Slug *</label>
							<input value={edit.slug} onChange={(e) => setE("slug", e.target.value)} onBlur={() => { if (!edit.slug && edit.title) setE("slug", slugify(edit.title)); }} placeholder="auto from title" />
						</div>
						<div className="gw-form__field"><label className="gw-form__label">Category</label>
							<select value={edit.category} onChange={(e) => setE("category", e.target.value)}>
								{PKG_CATS.map((c) => <option key={c}>{c}</option>)}
							</select>
						</div>
						{fld("subtitle", "Subtitle")}
						{fld("destination", "Destination")}
						{fld("province", "Province")}
						{fld("pickup_towns", "Pickup towns (comma separated)")}
						{fld("duration_days", "Duration (days)", "number")}
						{fld("nights", "Nights", "number")}
						{fld("price_from", "From price pp (R)", "number")}
						{fld("seats", "Seats per departure", "number")}
						{fld("deposit", "Deposit pp (R)", "number")}
						{fld("sort", "Sort order", "number")}
						<div className="gw-form__field"><label className="gw-form__label">Status</label>
							<select value={edit.status} onChange={(e) => setE("status", e.target.value)}>
								<option>Active</option><option>Draft</option><option>Archived</option>
							</select>
						</div>
						<div className="gw-form__field"><label className="gw-form__label">Image URL</label>
							<input value={edit.image ?? ""} onChange={(e) => setE("image", e.target.value)} />
							<label className="gw-btn gw-btn--outline gw-btn--outline-dark gw-btn--small" style={{ marginTop: "0.4rem", display: "inline-block" }}>
								{uploading ? "Uploading…" : "Upload image"}
								<input type="file" accept="image/*" hidden onChange={(e) => e.target.files?.[0] && void upload(e.target.files[0])} />
							</label>
						</div>
						{fld("image_alt", "Image alt text")}
						<div className="gw-form__field"><label className="gw-form__label">Featured</label>
							<select value={edit.featured ? "yes" : "no"} onChange={(e) => setE("featured", e.target.value === "yes")}>
								<option value="no">No</option><option value="yes">Yes</option>
							</select>
						</div>
					</div>

					<div className="gw-form__field" style={{ marginTop: "0.8rem" }}>
						<label className="gw-form__label">Description</label>
						<textarea rows={3} value={edit.description ?? ""} onChange={(e) => setE("description", e.target.value)} style={{ width: "100%", font: "inherit", padding: "0.5rem", border: "1px solid var(--gw-line)", borderRadius: 8 }} />
					</div>
					<div className="gw-form__field">
						<label className="gw-form__label">Includes (one per line)</label>
						<textarea rows={3} value={edit.includes_text ?? ""} onChange={(e) => setE("includes_text", e.target.value)} style={{ width: "100%", font: "inherit", padding: "0.5rem", border: "1px solid var(--gw-line)", borderRadius: 8 }} />
					</div>
					<div className="gw-form__field">
						<label className="gw-form__label">Note</label>
						<textarea rows={2} value={edit.note ?? ""} onChange={(e) => setE("note", e.target.value)} style={{ width: "100%", font: "inherit", padding: "0.5rem", border: "1px solid var(--gw-line)", borderRadius: 8 }} />
					</div>

					<h4>Price rows</h4>
					{(edit.price_rows ?? []).map((r: R, i: number) => (
						<div className="gw-toolbar" key={i} style={{ gap: "0.4rem" }}>
							<input placeholder="Label" value={r.label} onChange={(e) => setE("price_rows", edit.price_rows.map((x: R, j: number) => (j === i ? { ...x, label: e.target.value } : x)))} style={{ flex: 2 }} />
							<input placeholder="Price" type="number" value={r.price ?? ""} onChange={(e) => setE("price_rows", edit.price_rows.map((x: R, j: number) => (j === i ? { ...x, price: e.target.value } : x)))} style={{ flex: 1 }} />
							<input placeholder="Note" value={r.note ?? ""} onChange={(e) => setE("price_rows", edit.price_rows.map((x: R, j: number) => (j === i ? { ...x, note: e.target.value } : x)))} style={{ flex: 2 }} />
							<button className="gw-btn gw-btn--outline gw-btn--outline-dark gw-btn--small" onClick={() => setE("price_rows", edit.price_rows.filter((_: R, j: number) => j !== i))}>✕</button>
						</div>
					))}
					<button className="gw-btn gw-btn--outline gw-btn--outline-dark gw-btn--small" onClick={() => setE("price_rows", [...(edit.price_rows ?? []), { label: "", price: "", note: "" }])}>+ Add price row</button>

					<h4>Departure dates</h4>
					<div className="gw-book__chips" style={{ marginBottom: "0.6rem" }}>
						{[...(edit.dates ?? [])].sort().map((d: string) => (
							<span key={d}>{fmtDate(d)} <button aria-label={`Remove ${d}`} onClick={() => setE("dates", edit.dates.filter((x: string) => x !== d))} style={{ border: 0, background: "none", cursor: "pointer", font: "inherit" }}>✕</button></span>
						))}
						{(edit.dates ?? []).length === 0 && <span className="gw-small">No scheduled dates — on request</span>}
					</div>
					<div className="gw-toolbar">
						<input type="date" value={newDate} onChange={(e) => setNewDate(e.target.value)} />
						<button className="gw-btn gw-btn--outline gw-btn--outline-dark gw-btn--small" onClick={() => { if (newDate && !edit.dates.includes(newDate)) { setE("dates", [...edit.dates, newDate]); setNewDate(""); } }}>+ Add date</button>
					</div>

					<div className="gw-buttons" style={{ marginTop: "1.2rem" }}>
						<button className="gw-btn gw-btn--gold" disabled={saving || uploading} onClick={() => void save()}>{saving ? "Saving…" : "Save package"}</button>
						{edit.id && <button className="gw-btn gw-btn--outline gw-btn--outline-dark" onClick={() => del(edit)}>Delete</button>}
						<button className="gw-btn gw-btn--outline gw-btn--outline-dark" onClick={() => setEdit(null)}>Cancel</button>
					</div>
				</Drawer>
			)}
		</>
	);
}

/* ================================================================ transport rates */

function TransportRates() {
	const [rows, setRows] = useState<R[]>([]);
	const [loading, setLoading] = useState(true);
	const [adding, setAdding] = useState(false);
	const [form, setForm] = useState<R>({ vehicle_type: "", per_km: "", per_day: "", min_charge: "", description: "", active: true });

	const load = useCallback(async () => {
		setLoading(true);
		const c = supabase();
		if (!c) { setLoading(false); return; }
		const { data } = await c.from("transport_rates").select("*").order("vehicle_type");
		setRows(data ?? []);
		setLoading(false);
	}, []);
	useEffect(() => { void load(); }, [load]);

	const saveRow = async (r: R) => {
		const c = supabase();
		if (!c) return;
		const { error } = await c.from("transport_rates").upsert(cleanRow(r, ["per_km", "per_day", "min_charge"]), { onConflict: "vehicle_type" });
		if (error) toast(`Save failed: ${error.message}`);
		else { toast(`${r.vehicle_type} saved`); void load(); }
	};

	const setCell = (vt: string, k: string, v: unknown) =>
		setRows((rs) => rs.map((x) => (x.vehicle_type === vt ? { ...x, [k]: v } : x)));

	return (
		<>
			<p className="gw-denote" style={{ marginBottom: "1rem" }}>
				These rates price every approved vehicle of that type on the public booking page (clause 5 of the Affiliation Agreement).
			</p>
			{loading ? <p className="gw-small" style={{ padding: "2rem", textAlign: "center" }}>Loading rates…</p> : (
				<div className="gw-table-wrap">
					<table className="gw-table">
						<thead><tr><th>Vehicle type</th><th>Per km (R)</th><th>Per day (R)</th><th>Min charge (R)</th><th>Description</th><th>Active</th><th></th></tr></thead>
						<tbody>
							{rows.map((r) => (
								<tr key={r.vehicle_type}>
									<td><strong>{r.vehicle_type}</strong></td>
									{["per_km", "per_day", "min_charge"].map((k) => (
										<td key={k}><input type="number" value={r[k] ?? ""} onChange={(e) => setCell(r.vehicle_type, k, e.target.value)} style={{ width: 90 }} /></td>
									))}
									<td><input value={r.description ?? ""} onChange={(e) => setCell(r.vehicle_type, "description", e.target.value)} /></td>
									<td><input type="checkbox" checked={!!r.active} onChange={(e) => setCell(r.vehicle_type, "active", e.target.checked)} /></td>
									<td><button className="gw-btn gw-btn--gold gw-btn--small" onClick={() => void saveRow(r)}>Save</button></td>
								</tr>
							))}
							{adding && (
								<tr>
									<td><input value={form.vehicle_type} onChange={(e) => setForm((f) => ({ ...f, vehicle_type: e.target.value }))} placeholder="e.g. Kombi" /></td>
									{["per_km", "per_day", "min_charge"].map((k) => (
										<td key={k}><input type="number" value={form[k]} onChange={(e) => setForm((f) => ({ ...f, [k]: e.target.value }))} style={{ width: 90 }} /></td>
									))}
									<td><input value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} /></td>
									<td><input type="checkbox" checked={form.active} onChange={(e) => setForm((f) => ({ ...f, active: e.target.checked }))} /></td>
									<td>
										<button className="gw-btn gw-btn--gold gw-btn--small" disabled={!form.vehicle_type.trim()} onClick={async () => { await saveRow(form); setAdding(false); setForm({ vehicle_type: "", per_km: "", per_day: "", min_charge: "", description: "", active: true }); }}>
											Add
										</button>
									</td>
								</tr>
							)}
						</tbody>
					</table>
				</div>
			)}
			{!adding && !loading && (
				<button className="gw-btn gw-btn--outline gw-btn--outline-dark gw-btn--small" style={{ marginTop: "0.8rem" }} onClick={() => setAdding(true)}>+ Add type</button>
			)}
		</>
	);
}
