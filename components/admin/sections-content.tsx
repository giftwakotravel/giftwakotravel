"use client";

import { useCallback, useEffect, useState } from "react";
import { Dr, Drawer, fmtR, Pill, SearchInput, Table } from "@/components/admin/ui";
import { useAdmin, type Section } from "@/components/admin/AdminDash";
import EventForm from "@/components/admin/EventForm";
import { supabase } from "@/lib/supabase";
import { toast } from "@/components/Toaster";

export default function ContentSections({ section }: { section: Section }) {
	if (section !== "events") return null;
	return <Events />;
}

interface Route {
	name: string;
	price: string;
	note: string;
}

interface Ev {
	id: number;
	title: string;
	location: string | null;
	venue: string | null;
	featuring: string | null;
	presented_by: string | null;
	event_date: string | null;
	price: number | null;
	routes: { name: string; price: number | null; note: string | null }[] | null;
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
	const [edit, setEdit] = useState<number | "new" | null>(null);

	const load = useCallback(async () => {
		const c = supabase();
		if (!c) { toast("Not connected to the database"); setLoading(false); return; }
		const { data, error } = await c.from("events").select("*").order("event_date", { ascending: true });
		if (error) toast(`Load failed: ${error.message}`);
		setRows((data ?? []) as Ev[]);
		setLoading(false);
	}, []);

	useEffect(() => { void load(); }, [load]);

	const toggle = async (e: Ev) => {
		const c = supabase();
		if (!c) { toast("Not connected to the database"); return; }
		const { error } = await c.from("events").update({ visible: !e.visible }).eq("id", e.id);
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
				const c = supabase();
				if (!c) { toast("Not connected to the database"); return; }
				void c.from("events").delete().eq("id", e.id).then(({ error }) => {
					if (error) toast(`Delete failed: ${error.message}`);
					else { setRows((rs) => rs.filter((x) => x.id !== e.id)); toast(`${e.title} deleted`); }
				});
			},
		});

	const filtered = rows.filter((r) => !q || `${r.title} ${r.location}`.toLowerCase().includes(q.toLowerCase()));

	if (edit !== null) {
		return (
			<>
				<div className="gw-toolbar">
					<h3 style={{ margin: 0 }}>{edit === "new" ? "Create event" : "Edit event"}</h3>
					<button className="gw-btn gw-btn--outline gw-btn--outline-dark gw-btn--small" onClick={() => setEdit(null)}>← Back to events</button>
				</div>
				<EventForm id={edit} onDone={() => { setEdit(null); void load(); }} />
			</>
		);
	}

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
						{ key: "vis", label: "Status", render: (e) => <Pill status={e.visible ? "Live" : "Pending"} /> },
						{ key: "act", label: "", render: (e) => (
							<>
								<button className="gw-btn gw-btn--outline gw-btn--outline-dark gw-btn--small" onClick={() => setEdit(e.id)}>Edit</button>{" "}
								<button className="gw-btn gw-btn--outline gw-btn--outline-dark gw-btn--small" onClick={() => void toggle(e)}>{e.visible ? "Hide" : "Show"}</button>{" "}
								<button className="gw-btn gw-btn--outline gw-btn--outline-dark gw-btn--small" style={{ color: "#8A1C12" }} onClick={() => del(e)}>Delete</button>
							</>
						) },
					]}
					rows={filtered}
					empty="No events yet — add your first one."
				/>
			)}
		</>
	);
}
