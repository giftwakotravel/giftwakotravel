"use client";

import { useCallback, useEffect, useState } from "react";
import { Dr, Drawer, fmtR, Pill, SearchInput, Table } from "@/components/admin/ui";
import { useAdmin, type Section } from "@/components/admin/AdminDash";
import { supabase } from "@/lib/supabase";
import { toast } from "@/components/Toaster";

export default function ContentSections({ section }: { section: Section }) {
	if (section !== "events") return null;
	return <Events />;
}

interface Ev {
	id: number;
	title: string;
	location: string | null;
	event_date: string | null;
	price: number | null;
	image: string | null;
	description: string | null;
	visible: boolean;
	created_at: string;
}

function Events() {
	const { confirm } = useAdmin();
	const [rows, setRows] = useState<Ev[]>([]);
	const [loading, setLoading] = useState(true);
	const [q, setQ] = useState("");
	const [edit, setEdit] = useState<Ev | "new" | null>(null);

	const load = useCallback(async () => {
		const { data, error } = await supabase.from("events").select("*").order("event_date", { ascending: true });
		if (error) toast(`Load failed: ${error.message}`);
		setRows((data ?? []) as Ev[]);
		setLoading(false);
	}, []);

	useEffect(() => { void load(); }, [load]);

	const toggle = async (e: Ev) => {
		const { error } = await supabase.from("events").update({ visible: !e.visible }).eq("id", e.id);
		if (error) { toast(`Update failed: ${error.message}`); return; }
		setRows((rs) => rs.map((x) => (x.id === e.id ? { ...x, visible: !e.visible } : x)));
		toast(`${e.title} ${e.visible ? "hidden" : "visible"}`);
	};

	const del = (e: Ev) =>
		confirm({
			title: `Delete "${e.title}"?`,
			body: "This removes the event from the website permanently.",
			okLabel: "Delete",
			action: () => {
				void supabase.from("events").delete().eq("id", e.id).then(({ error }) => {
					if (error) toast(`Delete failed: ${error.message}`);
					else { setRows((rs) => rs.filter((x) => x.id !== e.id)); toast(`${e.title} deleted`); }
				});
			},
		});

	const filtered = rows.filter((r) => !q || `${r.title} ${r.location}`.toLowerCase().includes(q.toLowerCase()));

	return (
		<>
			<div className="gw-toolbar">
				<SearchInput value={q} onChange={setQ} placeholder="Search events…" />
				<button className="gw-btn gw-btn--gold gw-btn--small" onClick={() => setEdit("new")}>+ New event</button>
			</div>
			{loading ? (
				<p className="gw-small" style={{ padding: "2rem", textAlign: "center" }}>Loading events…</p>
			) : (
				<Table
					cols={[
						{ key: "img", label: "", render: (e: Ev) => e.image
							/* eslint-disable-next-line @next/next/no-img-element */
							? <img src={e.image} alt="" style={{ width: 44, height: 32, objectFit: "cover", borderRadius: 6 }} />
							: <span className="gw-small">—</span> },
						{ key: "title", label: "Event", render: (e) => <strong>{e.title}</strong>, sortKey: (e) => e.title },
						{ key: "loc", label: "Location", render: (e) => e.location ?? "—" },
						{ key: "date", label: "Date", render: (e) => e.event_date ?? "TBC", sortKey: (e) => e.event_date ?? "" },
						{ key: "price", label: "Price", render: (e) => e.price != null ? fmtR(e.price) : "—", sortKey: (e) => e.price ?? 0 },
						{ key: "vis", label: "Visible", render: (e) => <Pill status={e.visible ? "Live" : "Hidden"} /> },
						{ key: "act", label: "", render: (e) => (
							<>
								<button className="gw-btn gw-btn--outline gw-btn--outline-dark gw-btn--small" onClick={() => setEdit(e)}>Edit</button>{" "}
								<button className="gw-btn gw-btn--outline gw-btn--outline-dark gw-btn--small" onClick={() => void toggle(e)}>{e.visible ? "Hide" : "Show"}</button>{" "}
								<button className="gw-btn gw-btn--outline gw-btn--outline-dark gw-btn--small" style={{ color: "#8A1C12" }} onClick={() => del(e)}>Delete</button>
							</>
						) },
					]}
					rows={filtered}
					empty="No events yet — add your first one."
				/>
			)}
			{edit && <EventForm ev={edit === "new" ? null : edit} onClose={() => setEdit(null)} onSaved={load} />}
		</>
	);
}

function EventForm({ ev, onClose, onSaved }: { ev: Ev | null; onClose: () => void; onSaved: () => void }) {
	const [f, setF] = useState({
		title: ev?.title ?? "",
		location: ev?.location ?? "",
		event_date: ev?.event_date ?? "",
		price: ev?.price?.toString() ?? "",
		image: ev?.image ?? "",
		description: ev?.description ?? "",
		visible: ev?.visible ?? true,
	});
	const [saving, setSaving] = useState(false);
	const [uploading, setUploading] = useState(false);
	const set = (k: keyof typeof f, v: string | boolean) => setF((p) => ({ ...p, [k]: v }));

	const save = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!f.title.trim()) { toast("Title is required"); return; }
		setSaving(true);
		const row = {
			title: f.title.trim(),
			location: f.location || null,
			event_date: f.event_date || null,
			price: f.price ? Number(f.price) : null,
			image: f.image || null,
			description: f.description || null,
			visible: f.visible as boolean,
		};
		const { error } = ev
			? await supabase.from("events").update(row).eq("id", ev.id)
			: await supabase.from("events").insert(row);
		setSaving(false);
		if (error) { toast(`Save failed: ${error.message}`); return; }
		toast(`${f.title} ${ev ? "updated" : "created"}`);
		onSaved();
		onClose();
	};

	return (
		<Drawer title={ev ? `Edit — ${ev.title}` : "New event"} onClose={onClose} wide>
			<form className="gw-form" onSubmit={save}>
				<div className="gw-form__field"><label className="gw-form__label">Title *</label><input value={f.title} onChange={(e) => set("title", e.target.value)} required /></div>
				<div className="gw-form__grid">
					<div className="gw-form__field"><label className="gw-form__label">Location</label><input value={f.location} onChange={(e) => set("location", e.target.value)} placeholder="e.g. Sun City" /></div>
					<div className="gw-form__field"><label className="gw-form__label">Date</label><input type="date" value={f.event_date} onChange={(e) => set("event_date", e.target.value)} /></div>
					<div className="gw-form__field"><label className="gw-form__label">Price per person (R)</label><input type="number" min={0} value={f.price} onChange={(e) => set("price", e.target.value)} placeholder="Optional" /></div>
					<div className="gw-form__field"><label className="gw-form__label">Visible on site</label>
						<select value={String(f.visible)} onChange={(e) => set("visible", e.target.value === "true")}>
							<option value="true">Visible</option>
							<option value="false">Hidden</option>
						</select>
					</div>
				</div>
				<div className="gw-form__field">
					<label className="gw-form__label">Image</label>
					<input
						type="file"
						accept="image/*"
						onChange={async (e) => {
							const file = e.currentTarget.files?.[0];
							if (!file) return;
							setUploading(true);
							const fname = `events/${Date.now()}-${file.name.replace(/[^\w.-]+/g, "-")}`;
							const { error } = await supabase.storage.from("media").upload(fname, file, { upsert: true });
							setUploading(false);
							if (error) { toast(`Upload failed: ${error.message}`); return; }
							const { data } = supabase.storage.from("media").getPublicUrl(fname);
							set("image", data.publicUrl);
							toast("Image uploaded");
						}}
					/>
					<p className="gw-form__hint">Pick a photo from your computer — it uploads to Supabase Storage.</p>
					<input value={f.image} onChange={(e) => set("image", e.target.value)} placeholder="…or paste a URL" />
					{/* eslint-disable-next-line @next/next/no-img-element */}
					{f.image && <img src={f.image} alt="Preview" style={{ marginTop: 6, height: 90, borderRadius: 8, objectFit: "cover" }} />}
				</div>
				<div className="gw-form__field"><label className="gw-form__label">Description</label><textarea rows={3} value={f.description} onChange={(e) => set("description", e.target.value)} /></div>
				<button className="gw-form__submit" type="submit" disabled={saving || uploading}>{uploading ? "Uploading image…" : saving ? "Saving…" : ev ? "Save changes" : "Create event"}</button>
				<p className="gw-form__hint">Saves straight to the database — visible on the homepage immediately if set visible.</p>
			</form>
		</Drawer>
	);
}
