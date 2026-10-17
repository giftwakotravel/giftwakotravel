"use client";

import { useCallback, useEffect, useState } from "react";
import { Dr, Drawer, Pill, SearchInput, SubTabs, Table } from "@/components/admin/ui";
import { useAdmin, type Section } from "@/components/admin/AdminDash";
import { supabase } from "@/lib/supabase";
import { toast } from "@/components/Toaster";

export default function RequestsSections({ section }: { section: Section }) {
	if (section !== "trip-requests") return null;
	return <TripRequests />;
}

type TripStatus = "New" | "Reviewing" | "Quoted" | "Confirmed" | "Closed";

interface TripRequest {
	id: number;
	ref: string;
	created_at: string;
	full_name: string;
	email: string;
	phone: string;
	whatsapp: string | null;
	contact_method: string;
	country_residence: string | null;
	departure_location: string;
	destination_country: string;
	destination_area: string | null;
	trip_type: string;
	departure_date: string;
	return_date: string | null;
	nights: number | null;
	date_flexibility: string;
	adults: number;
	children: number;
	children_ages: string[] | null;
	rooms: number | null;
	special_requirements: string | null;
	budget: string;
	budget_basis: string;
	accommodation: string | null;
	transport: string | null;
	notes: string | null;
	status: TripStatus;
	admin_notes: string | null;
}

const TABS = ["All", "New", "Reviewing", "Quoted", "Confirmed", "Closed"];

function TripRequests() {
	const { confirm } = useAdmin();
	const [rows, setRows] = useState<TripRequest[]>([]);
	const [loading, setLoading] = useState(true);
	const [loadErr, setLoadErr] = useState(false);
	const [sub, setSub] = useState("All");
	const [q, setQ] = useState("");
	const [sel, setSel] = useState<TripRequest | null>(null);

	const load = useCallback(async () => {
		setLoading(true);
		setLoadErr(false);
		const c = supabase();
		if (!c) { setLoadErr(true); setLoading(false); return; }
		const { data, error } = await c
			.from("trip_requests")
			.select("*")
			.order("created_at", { ascending: false });
		if (error) setLoadErr(true);
		else setRows((data ?? []) as TripRequest[]);
		setLoading(false);
	}, []);

	useEffect(() => { void load(); }, [load]);

	const updateStatus = async (r: TripRequest, status: TripStatus) => {
		confirm({
			title: `Mark ${r.ref} as ${status.toLowerCase()}?`,
			body: `This updates the request in the database.`,
			okLabel: "Update",
			action: async () => {
				const c = supabase();
				if (!c) { toast("Not connected to the database"); return; }
				const { error } = await c.from("trip_requests").update({ status }).eq("id", r.id);
				if (error) { toast(`Update failed: ${error.message}`); return; }
				setRows((rs) => rs.map((x) => (x.id === r.id ? { ...x, status } : x)));
				setSel((s) => (s?.id === r.id ? { ...s, status } : s));
				toast(`${r.ref} → ${status}`);
			},
		});
	};

	const counts = Object.fromEntries(TABS.map((t) => [t, t === "All" ? rows.length : rows.filter((r) => r.status === t).length]));
	const filtered = rows.filter((r) =>
		(sub === "All" || r.status === sub) &&
		(!q || `${r.ref} ${r.full_name} ${r.destination_country} ${r.destination_area ?? ""} ${r.trip_type}`.toLowerCase().includes(q.toLowerCase())),
	);

	return (
		<>
			<div className="gw-toolbar">
				<SubTabs tabs={TABS} active={sub} onChange={setSub} counts={counts} />
				<button className="gw-btn gw-btn--outline gw-btn--outline-dark gw-btn--small" onClick={() => void load()}>
					{loading ? "Refreshing…" : "↻ Refresh"}
				</button>
			</div>
			<div className="gw-toolbar">
				<SearchInput value={q} onChange={setQ} placeholder="Search ref, name, destination…" />
				<span className="gw-small">Live data from Supabase — new trip requests appear here automatically.</span>
			</div>

			{loading ? (
				<p className="gw-small" style={{ padding: "2rem", textAlign: "center" }}>Loading requests…</p>
			) : loadErr ? (
				<div className="gw-denote">Could not load requests from Supabase. Check the table exists and the anon key policy allows reads.</div>
			) : (
				<Table
					cols={[
						{ key: "ref", label: "Ref", render: (r: TripRequest) => <strong>{r.ref}</strong>, sortKey: (r) => r.ref },
						{ key: "name", label: "Traveller", render: (r) => r.full_name, sortKey: (r) => r.full_name },
						{ key: "dest", label: "Destination", render: (r) => `${r.destination_area ? `${r.destination_area}, ` : ""}${r.destination_country}` },
						{ key: "type", label: "Trip type", render: (r) => r.trip_type },
						{ key: "dates", label: "Departure", render: (r) => r.departure_date, sortKey: (r) => r.departure_date },
						{ key: "pax", label: "Pax", render: (r) => `${r.adults}+${r.children}c`, sortKey: (r) => r.adults },
						{ key: "budget", label: "Budget", render: (r) => r.budget },
						{ key: "at", label: "Received", render: (r) => new Date(r.created_at).toLocaleDateString("en-ZA"), sortKey: (r) => r.created_at },
						{ key: "status", label: "Status", render: (r) => <Pill status={r.status === "New" ? "Pending" : r.status} /> },
					]}
					rows={filtered}
					empty={rows.length === 0 ? "No trip requests yet — submissions appear here." : "No requests match."}
					onRow={setSel}
				/>
			)}

			{sel && (
				<Drawer title={`${sel.ref} — ${sel.full_name}`} onClose={() => setSel(null)} wide>
					<div className="gw-grid-2" style={{ gap: "1rem" }}>
						<Dr k="Status" v={<Pill status={sel.status} />} />
						<Dr k="Received" v={new Date(sel.created_at).toLocaleString("en-ZA")} />
						<Dr k="Contact" v={`${sel.contact_method} · ${sel.phone}`} />
						<Dr k="Email" v={sel.email} />
						<Dr k="WhatsApp" v={sel.whatsapp ?? sel.phone} />
						<Dr k="Residence" v={sel.country_residence ?? "—"} />
						<Dr k="From" v={sel.departure_location} />
						<Dr k="To" v={`${sel.destination_area ? `${sel.destination_area}, ` : ""}${sel.destination_country}`} />
						<Dr k="Trip type" v={sel.trip_type} />
						<Dr k="Depart" v={sel.departure_date} />
						<Dr k="Return" v={sel.return_date ?? "—"} />
						<Dr k="Nights" v={sel.nights ?? "—"} />
						<Dr k="Flexibility" v={sel.date_flexibility} />
						<Dr k="Travellers" v={`${sel.adults} adults · ${sel.children} children${sel.children_ages?.length ? ` (${sel.children_ages.join(", ")})` : ""} · ${sel.rooms ?? "—"} rooms`} />
						<Dr k="Budget" v={`${sel.budget} · ${sel.budget_basis}`} />
						<Dr k="Accommodation" v={sel.accommodation ?? "—"} />
						<Dr k="Transport" v={sel.transport ?? "—"} />
					</div>
					{sel.special_requirements && <><h4>Special requirements</h4><p>{sel.special_requirements}</p></>}
					{sel.notes && <><h4>Notes</h4><p>{sel.notes}</p></>}
					<h4>Update status</h4>
					<div className="gw-buttons">
						{(["New", "Reviewing", "Quoted", "Confirmed", "Closed"] as const).map((s) => (
							<button
								key={s}
								className={`gw-filter__btn${sel.status === s ? " is-active" : ""}`}
								onClick={() => updateStatus(sel, s)}
							>{s}</button>
						))}
					</div>
					<div className="gw-buttons" style={{ marginTop: "1rem" }}>
						<a className="gw-btn gw-btn--outline gw-btn--outline-dark" href={`https://wa.me/${(sel.whatsapp ?? sel.phone).replace(/\D/g, "").replace(/^0/, "27")}`} target="_blank" rel="noreferrer">
							WhatsApp traveller
						</a>
						<a className="gw-btn gw-btn--outline gw-btn--outline-dark" href={`mailto:${sel.email}`}>Email</a>
					</div>
				</Drawer>
			)}
		</>
	);
}
