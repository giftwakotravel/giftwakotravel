"use client";

import { useMemo, useState } from "react";
import { useAdmin, type Section } from "@/components/admin/AdminDash";
import { Bars, Dr, Drawer, fmtR, Panel, Pill, SearchInput, SubTabs, Table } from "@/components/admin/ui";
import {
	D_ACTIVITY, D_BOOKINGS, D_CUSTOMERS, D_MONTHLY, type AdminBooking, type AdminCustomer,
	type AdminOwner, type AdminProperty,
} from "@/lib/admin-data";
import { toast } from "@/components/Toaster";
import { usePendingBookingCount } from "@/components/admin/sections-booking";

export default function CoreSections({ section }: { section: Section }) {
	const ctx = useAdmin();
	switch (section) {
		case "overview": return <Overview />;
		case "properties": return <Properties />;
		case "approvals": return <Approvals />;
		case "owners": return <Owners />;
		case "customers": return <Customers />;
		case "bookings": return <Bookings />;
		default: return null;
	}
}

/* ============================ OVERVIEW ============================ */

function Overview() {
	const { properties, owners, customers, bookings, go, globalQuery } = useAdmin();
	const pendingProps = properties.filter((p) => p.status === "Pending");
	const newCustomers = customers.slice().sort((a, b) => b.joined.localeCompare(a.joined)).slice(0, 4);
	const recent = bookings.slice(0, 5).filter((b) => !globalQuery || (b.guest + b.property + b.id).toLowerCase().includes(globalQuery.toLowerCase()));

	const stats = [
		{ label: "Customers", value: customers.length },
		{ label: "Owners", value: owners.length },
		{ label: "Properties", value: properties.length },
		{ label: "Pending approvals", value: pendingProps.length },
		{ label: "Total bookings", value: bookings.length },
		{ label: "Confirmed", value: bookings.filter((b) => b.status === "Confirmed").length },
		{ label: "Cancelled", value: bookings.filter((b) => b.status === "Cancelled").length },
		{ label: "Demo revenue", value: fmtR(bookings.reduce((s, b) => s + b.total, 0)) },
	];
	const pendingOnline = usePendingBookingCount();
	stats.splice(7, 0, { label: "Online bookings pending", value: pendingOnline });

	return (
		<>
			<div className="gw-statgrid gw-statgrid--8">
				{stats.map((s) => (
					<div className="gw-stat" key={s.label}><p>{s.label}</p><strong>{s.value}</strong></div>
				))}
			</div>
			<div className="gw-buttons" style={{ marginBottom: "1.5rem" }}>
				<button className="gw-btn gw-btn--gold gw-btn--small" onClick={() => go("approvals")}>Review approvals</button>
				<button className="gw-btn gw-btn--outline gw-btn--outline-dark gw-btn--small" onClick={() => go("properties")}>Add property</button>
				<button className="gw-btn gw-btn--outline gw-btn--outline-dark gw-btn--small" onClick={() => go("promos")}>New promotion</button>
				<button className="gw-btn gw-btn--outline gw-btn--outline-dark gw-btn--small" onClick={() => go("support")}>Open support queue</button>
			</div>
			<div className="gw-grid-2">
				<Panel title="Recent activity">
					<ul className="gw-activity">
						{D_ACTIVITY.map((a, i) => (
							<li key={i}><span className="gw-activity__icn">{a.icon}</span><div>{a.text}<br /><small>{a.time}</small></div></li>
						))}
					</ul>
				</Panel>
				<Panel title="Booking statistics">
					<Bars data={D_MONTHLY.map((m) => ({ label: m.m, value: m.bookings }))} />
					<p className="gw-small">Bookings per month — demonstration series.</p>
				</Panel>
				<Panel title="Recent bookings" actions={<button className="gw-btn gw-btn--outline gw-btn--outline-dark gw-btn--small" onClick={() => go("bookings")}>View all</button>}>
					<Table
						cols={[
							{ key: "id", label: "Ref", render: (b: AdminBooking) => <strong>{b.id}</strong> },
							{ key: "guest", label: "Guest", render: (b) => b.guest },
							{ key: "total", label: "Total", render: (b) => fmtR(b.total), sortKey: (b) => b.total },
							{ key: "status", label: "Status", render: (b) => <Pill status={b.status} /> },
						]}
						rows={recent}
						pageSize={5}
						empty="No recent bookings."
					/>
				</Panel>
				<Panel title="Pending approvals" actions={<button className="gw-btn gw-btn--outline gw-btn--outline-dark gw-btn--small" onClick={() => go("approvals")}>Open</button>}>
					{pendingProps.length === 0 ? <p className="gw-small">Nothing awaiting approval.</p> : (
						<ul className="gw-activity">
							{pendingProps.map((p) => (
								<li key={p.id}>
									<span className="gw-activity__icn">★</span>
									<div>{p.name} — {p.city} <br /><small>Submitted {p.added} by {p.owner}</small></div>
								</li>
							))}
						</ul>
					)}
				</Panel>
			</div>
		</>
	);
}

/* ============================ PROPERTIES ============================ */

function Properties() {
	const { properties, setPropStatus, confirm, globalQuery } = useAdmin();
	const [sub, setSub] = useState("All");
	const [q, setQ] = useState("");
	const [sel, setSel] = useState<AdminProperty | null>(null);
	const [editing, setEditing] = useState<AdminProperty | null>(null);
	const [adding, setAdding] = useState(false);

	const filter = (q: string) => (q + globalQuery).toLowerCase();
	const match = (s: string) => s.toLowerCase().includes(filter(q));

	const counts = {
		All: properties.length,
		Approved: properties.filter((p) => p.status === "Live").length,
		Pending: properties.filter((p) => p.status === "Pending").length,
		Rejected: properties.filter((p) => p.status === "Rejected").length,
		Suspended: properties.filter((p) => p.status === "Suspended").length,
	};

	const rows = properties.filter(
		(p) =>
			(sub === "All" ||
				(sub === "Approved" && p.status === "Live") ||
				(sub === "Pending" && p.status === "Pending") ||
				(sub === "Rejected" && p.status === "Rejected") ||
				(sub === "Suspended" && p.status === "Suspended")) &&
			(match(p.name) || match(p.city) || match(p.owner)),
	);

	return (
		<>
			<SubTabs tabs={["All", "Approved", "Pending", "Rejected", "Suspended"]} active={sub} onChange={setSub} counts={counts} />
			<div className="gw-toolbar">
				<SearchInput value={q} onChange={setQ} placeholder="Search properties…" />
				<button className="gw-btn gw-btn--gold gw-btn--small" onClick={() => setAdding(true)}>+ Add property</button>
			</div>
			<Table
				cols={[
					{ key: "name", label: "Property", render: (p: AdminProperty) => <strong>{p.name}</strong>, sortKey: (p) => p.name },
					{ key: "owner", label: "Owner", render: (p) => p.owner, sortKey: (p) => p.owner },
					{ key: "loc", label: "Location", render: (p) => `${p.city}, ${p.province}` },
					{ key: "type", label: "Type", render: (p) => p.type, sortKey: (p) => p.type },
					{ key: "price", label: "From / night", render: (p) => p.price ? fmtR(p.price) : "—", sortKey: (p) => p.price ?? 0 },
					{ key: "status", label: "Status", render: (p) => <Pill status={p.status} />, sortKey: (p) => p.status },
					{ key: "added", label: "Added", render: (p) => p.added, sortKey: (p) => p.added },
					{ key: "act", label: "", render: (p) => (
						<button className="gw-btn gw-btn--outline gw-btn--outline-dark gw-btn--small" onClick={(e) => { e.stopPropagation(); setSel(p); }}>
							Details
						</button>
					)},
				]}
				rows={rows}
				empty="No properties match."
				onRow={setSel}
			/>

			{sel && (
				<Drawer title={sel.name} onClose={() => setSel(null)} wide>
					{/* eslint-disable-next-line @next/next/no-img-element */}
					<img src={sel.image} alt={sel.name} style={{ width: "100%", borderRadius: 12, marginBottom: "1rem" }} />
					<div className="gw-grid-2" style={{ gap: "1rem" }}>
						<Dr k="Owner" v={sel.owner} />
						<Dr k="Location" v={`${sel.city}, ${sel.province}`} />
						<Dr k="Type" v={`${sel.type}${sel.stars ? ` · ${sel.stars}★` : ""}`} />
						<Dr k="Rating" v={sel.rating ? `${sel.rating}/5 · ${sel.reviews} reviews` : "No reviews yet"} />
						<Dr k="Status" v={<Pill status={sel.status} />} />
						<Dr k="Added" v={sel.added} />
					</div>
					<h4>Rooms</h4>
					<table className="gw-table">
						<thead><tr><th>Room</th><th>Sleeps</th><th>Price</th><th>Qty</th></tr></thead>
						<tbody>
							{sel.rooms.map((r) => (
								<tr key={r.name}><td>{r.name}</td><td>{r.sleeps}</td><td>{fmtR(r.price)}</td><td>{r.qty}</td></tr>
							))}
						</tbody>
					</table>
					<h4>Facilities</h4>
					<p>{sel.facilities.join(" · ")}</p>
					<div className="gw-buttons">
						<button className="gw-btn gw-btn--outline gw-btn--outline-dark gw-btn--small" onClick={() => setEditing(sel)}>Edit property</button>
						{sel.status !== "Live" && (
							<button className="gw-btn gw-btn--gold gw-btn--small" onClick={() => confirm({
								title: "Approve property?", body: `Set ${sel.name} live on the site? (demo)`, okLabel: "Approve",
								action: () => { setPropStatus(sel.id, "Live"); toast("Property approved (demo)"); },
							})}>Approve</button>
						)}
						{sel.status === "Live" && (
							<button className="gw-btn gw-btn--outline gw-btn--outline-dark gw-btn--small" onClick={() => confirm({
								title: "Suspend property?", body: `Hide ${sel.name} from search results? (demo)`, okLabel: "Suspend",
								action: () => { setPropStatus(sel.id, "Suspended"); toast("Property suspended (demo)"); },
							})}>Suspend</button>
						)}
					</div>
				</Drawer>
			)}

			{(editing || adding) && (
				<PropForm
					prop={editing}
					onClose={() => { setEditing(null); setAdding(false); }}
				/>
			)}
		</>
	);
}

function PropForm({ prop, onClose }: { prop: AdminProperty | null; onClose: () => void }) {
	return (
		<Drawer title={prop ? `Edit ${prop.name}` : "Add property"} onClose={onClose}>
			<form
				className="gw-form"
				onSubmit={(e) => {
					e.preventDefault();
					toast(prop ? "Property updated (demo)" : "Property submitted for review (demo)");
					onClose();
				}}
			>
				<div className="gw-form__field"><label className="gw-form__label">Property name</label><input defaultValue={prop?.name} required /></div>
				<div className="gw-form__field"><label className="gw-form__label">Type</label>
					<select defaultValue={prop?.type ?? "Guesthouse"}>{["Guesthouse", "Hotel", "Lodge", "Resort", "Self-catering", "B&B"].map((t) => <option key={t}>{t}</option>)}</select>
				</div>
				<div className="gw-form__field"><label className="gw-form__label">Location</label><input defaultValue={prop ? `${prop.city}, ${prop.province}` : ""} required /></div>
				<div className="gw-form__field"><label className="gw-form__label">Starting price / night (R)</label><input type="number" defaultValue={prop?.price} required /></div>
				<div className="gw-form__field"><label className="gw-form__label">Description</label><textarea rows={3} defaultValue="Demo listing description" /></div>
				<button className="gw-form__submit" type="submit">{prop ? "Save changes" : "Submit for review"}</button>
				<p className="gw-form__hint">Demo form — changes are not saved to a server.</p>
			</form>
		</Drawer>
	);
}

/* ============================ APPROVALS ============================ */

function Approvals() {
	const { properties, setPropStatus, confirm } = useAdmin();
	const [sub, setSub] = useState("Pending");
	const [sel, setSel] = useState<AdminProperty | null>(null);
	const [reason, setReason] = useState("");

	const queue = properties.filter((p) => p.status !== "Live");
	const rows = queue.filter((p) =>
		sub === "All" ? true : p.status.toLowerCase() === sub.toLowerCase(),
	);

	const counts = {
		Pending: queue.filter((p) => p.status === "Pending").length,
		Rejected: queue.filter((p) => p.status === "Rejected").length,
		All: queue.length,
	};

	const act = (p: AdminProperty, status: AdminProperty["status"], verb: string) =>
		confirm({
			title: `${verb} ${p.name}?`,
			body: `${p.name} by ${p.owner} will be marked ${status.toLowerCase()}. (demo — updates local state only)`,
			okLabel: verb,
			action: () => {
				setPropStatus(p.id, status);
				toast(`${p.name} ${status.toLowerCase()} (demo)`);
				setSel(null);
			},
		});

	return (
		<>
			<SubTabs tabs={["Pending", "Rejected", "All"]} active={sub} onChange={setSub} counts={counts} />
			<Table
				cols={[
					{ key: "name", label: "Property", render: (p: AdminProperty) => <strong>{p.name}</strong>, sortKey: (p) => p.name },
					{ key: "owner", label: "Owner", render: (p) => p.owner },
					{ key: "loc", label: "Location", render: (p) => `${p.city}, ${p.province}` },
					{ key: "price", label: "From", render: (p) => p.price ? fmtR(p.price) : "—", sortKey: (p) => p.price ?? 0 },
					{ key: "added", label: "Submitted", render: (p) => p.added, sortKey: (p) => p.added },
					{ key: "status", label: "Status", render: (p) => <Pill status={p.status} /> },
					{ key: "act", label: "", render: (p) => <button className="gw-btn gw-btn--gold gw-btn--small" onClick={(e) => { e.stopPropagation(); setSel(p); }}>Review</button> },
				]}
				rows={rows}
				empty="Nothing in this queue."
				onRow={setSel}
			/>

			{sel && (
				<Drawer title={`Review — ${sel.name}`} onClose={() => setSel(null)} wide>
					{/* eslint-disable-next-line @next/next/no-img-element */}
					<img src={sel.image} alt={sel.name} style={{ width: "100%", borderRadius: 12, marginBottom: "1rem" }} />
					<div className="gw-grid-2" style={{ gap: "1rem" }}>
						<Dr k="Owner" v={sel.owner} />
						<Dr k="Address" v={`${sel.city}, ${sel.province}, South Africa`} />
						<Dr k="Type" v={sel.type} />
						<Dr k="Starting price" v={sel.price ? fmtR(sel.price) : "—"} />
						<Dr k="Rooms listed" v={sel.rooms.length} />
						<Dr k="Submitted" v={sel.added} />
					</div>
					<h4>Facilities & amenities</h4>
					<p>{sel.facilities.join(" · ")}</p>
					<h4>Supporting documents</h4>
					<p className="gw-small">ID copy ✓ · Photos ✓ · Bank details — pending upload (demo checklist)</p>
					<h4>Rejection reason / notes</h4>
					<textarea
						rows={2}
						value={reason}
						onChange={(e) => setReason(e.target.value)}
						placeholder="Optional note to the owner…"
						style={{ width: "100%", border: "1px solid var(--gw-line)", borderRadius: 8, padding: "0.5rem", font: "inherit" }}
					/>
					<div className="gw-buttons" style={{ marginTop: "1rem" }}>
						<button className="gw-btn gw-btn--gold" onClick={() => act(sel, "Live", "Approve")}>Approve</button>
						<button className="gw-btn gw-btn--outline gw-btn--outline-dark" onClick={() => act(sel, "Rejected", "Reject")}>Reject</button>
						<button className="gw-btn gw-btn--outline gw-btn--outline-dark" onClick={() => { toast("Info request sent to owner (demo)"); setSel(null); }}>Request info</button>
						<button className="gw-btn gw-btn--outline gw-btn--outline-dark" onClick={() => act(sel, "Pending", "Return to pending")}>Return to pending</button>
					</div>
				</Drawer>
			)}
		</>
	);
}

/* ============================ OWNERS ============================ */

function Owners() {
	const { owners, setOwnerStatus, confirm, globalQuery } = useAdmin();
	const [sub, setSub] = useState("All");
	const [q, setQ] = useState("");
	const [sel, setSel] = useState<AdminOwner | null>(null);

	const match = (s: string) => s.toLowerCase().includes((q + globalQuery).toLowerCase());
	const counts = {
		All: owners.length,
		Pending: owners.filter((o) => o.status === "Pending").length,
		Approved: owners.filter((o) => o.status === "Active").length,
		Suspended: owners.filter((o) => o.status === "Suspended").length,
	};
	const rows = owners.filter(
		(o) => (sub === "All" || (sub === "Approved" ? o.status === "Active" : o.status === sub)) && (match(o.name) || match(o.company) || match(o.email)),
	);

	return (
		<>
			<SubTabs tabs={["All", "Pending", "Approved", "Suspended"]} active={sub} onChange={setSub} counts={counts} />
			<div className="gw-toolbar"><SearchInput value={q} onChange={setQ} placeholder="Search owners…" /></div>
			<Table
				cols={[
					{ key: "name", label: "Owner", render: (o: AdminOwner) => <strong>{o.name}</strong>, sortKey: (o) => o.name },
					{ key: "company", label: "Company", render: (o) => o.company },
					{ key: "props", label: "Properties", render: (o) => o.properties, sortKey: (o) => o.properties },
					{ key: "bk30", label: "Bookings (30d)", render: (o) => o.bookings30d, sortKey: (o) => o.bookings30d },
					{ key: "rev30", label: "Revenue (30d)", render: (o) => fmtR(o.revenue30d), sortKey: (o) => o.revenue30d },
					{ key: "comm", label: "Commission", render: (o) => `${o.commissionPct}%` },
					{ key: "status", label: "Status", render: (o) => <Pill status={o.status} /> },
				]}
				rows={rows}
				empty="No owners match."
				onRow={setSel}
			/>

			{sel && (
				<Drawer title={sel.company} onClose={() => setSel(null)} wide>
					<div className="gw-grid-2" style={{ gap: "1rem" }}>
						<Dr k="Contact" v={sel.name} />
						<Dr k="Email" v={sel.email} />
						<Dr k="Phone" v={sel.phone} />
						<Dr k="Joined" v={sel.joined} />
						<Dr k="Status" v={<Pill status={sel.status} />} />
						<Dr k="Commission" v={`${sel.commissionPct}%`} />
						<Dr k="Verification" v={sel.docs} />
						<Dr k="Revenue (30d)" v={fmtR(sel.revenue30d)} />
					</div>
					<h4>Property portfolio</h4>
					<p className="gw-small">{sel.properties} listed propert{sel.properties === 1 ? "y" : "ies"} — portfolio view connects here once live.</p>
					<h4>Booking performance (demo)</h4>
					<p className="gw-small">{sel.bookings30d} bookings in the last 30 days.</p>
					<h4>Commission settings</h4>
					<label className="gw-form__label">Commission %</label>
					<input type="number" defaultValue={sel.commissionPct} min={0} max={30} style={{ maxWidth: 120, padding: "0.4rem", border: "1px solid var(--gw-line)", borderRadius: 8 }} />
					<div className="gw-buttons" style={{ marginTop: "1rem" }}>
						{sel.status === "Pending" && (
							<button className="gw-btn gw-btn--gold" onClick={() => confirm({
								title: "Approve owner?", body: `Approve ${sel.company} as a property partner? (demo)`, okLabel: "Approve",
								action: () => { setOwnerStatus(sel.id, "Active"); toast("Owner approved (demo)"); setSel(null); },
							})}>Approve</button>
						)}
						{sel.status === "Active" && (
							<button className="gw-btn gw-btn--outline gw-btn--outline-dark" onClick={() => confirm({
								title: "Suspend owner?", body: `Suspend ${sel.company} and hide their listings? (demo)`, okLabel: "Suspend",
								action: () => { setOwnerStatus(sel.id, "Suspended"); toast("Owner suspended (demo)"); setSel(null); },
							})}>Suspend</button>
						)}
						{sel.status === "Suspended" && (
							<button className="gw-btn gw-btn--gold" onClick={() => confirm({
								title: "Reinstate owner?", body: `Reinstate ${sel.company}? (demo)`, okLabel: "Reinstate",
								action: () => { setOwnerStatus(sel.id, "Active"); toast("Owner reinstated (demo)"); setSel(null); },
							})}>Reinstate</button>
						)}
					</div>
				</Drawer>
			)}
		</>
	);
}

/* ============================ CUSTOMERS ============================ */

function Customers() {
	const { customers, setCustStatus, confirm, globalQuery } = useAdmin();
	const [sub, setSub] = useState("All");
	const [q, setQ] = useState("");
	const [sel, setSel] = useState<AdminCustomer | null>(null);

	const match = (s: string) => s.toLowerCase().includes((q + globalQuery).toLowerCase());
	const counts = {
		All: customers.length,
		Active: customers.filter((c) => c.status === "Active").length,
		Suspended: customers.filter((c) => c.status === "Suspended").length,
	};
	const rows = customers.filter(
		(c) => (sub === "All" || c.status === sub) && (match(c.name) || match(c.email)),
	);

	const custBookings = sel ? D_BOOKINGS.filter((b) => b.guest === sel.name) : [];

	return (
		<>
			<SubTabs tabs={["All", "Active", "Suspended"]} active={sub} onChange={setSub} counts={counts} />
			<div className="gw-toolbar"><SearchInput value={q} onChange={setQ} placeholder="Search customers…" /></div>
			<Table
				cols={[
					{ key: "name", label: "Name", render: (c: AdminCustomer) => <strong>{c.name}</strong>, sortKey: (c) => c.name },
					{ key: "email", label: "Email", render: (c) => c.email },
					{ key: "bk", label: "Bookings", render: (c) => c.bookings, sortKey: (c) => c.bookings },
					{ key: "spent", label: "Total spent", render: (c) => fmtR(c.spent), sortKey: (c) => c.spent },
					{ key: "joined", label: "Joined", render: (c) => c.joined, sortKey: (c) => c.joined },
					{ key: "status", label: "Status", render: (c) => <Pill status={c.status} /> },
				]}
				rows={rows}
				empty="No customers match."
				onRow={setSel}
			/>

			{sel && (
				<Drawer title={sel.name} onClose={() => setSel(null)} wide>
					<div className="gw-grid-2" style={{ gap: "1rem" }}>
						<Dr k="Email" v={sel.email} />
						<Dr k="Phone" v={sel.phone} />
						<Dr k="Joined" v={sel.joined} />
						<Dr k="Status" v={<Pill status={sel.status} />} />
						<Dr k="Wishlist items" v={sel.wishlist} />
						<Dr k="Support requests" v={sel.support} />
						<Dr k="Total spent" v={fmtR(sel.spent)} />
					</div>
					<h4>Booking history</h4>
					{custBookings.length === 0 ? <p className="gw-small">No bookings yet.</p> : (
						<table className="gw-table">
							<thead><tr><th>Ref</th><th>Property</th><th>Dates</th><th>Status</th></tr></thead>
							<tbody>
								{custBookings.map((b) => (
									<tr key={b.id}><td><strong>{b.id}</strong></td><td>{b.property}</td><td>{b.checkin}</td><td><Pill status={b.status} /></td></tr>
								))}
							</tbody>
						</table>
					)}
					<div className="gw-buttons" style={{ marginTop: "1rem" }}>
						{sel.status === "Active" ? (
							<button className="gw-btn gw-btn--outline gw-btn--outline-dark" onClick={() => confirm({
								title: "Suspend customer?", body: `Suspend ${sel.name}'s account? (demo)`, okLabel: "Suspend",
								action: () => { setCustStatus(sel.id, "Suspended"); toast("Customer suspended (demo)"); setSel(null); },
							})}>Suspend account</button>
						) : (
							<button className="gw-btn gw-btn--gold" onClick={() => confirm({
								title: "Reactivate customer?", body: `Reactivate ${sel.name}'s account? (demo)`, okLabel: "Reactivate",
								action: () => { setCustStatus(sel.id, "Active"); toast("Customer reactivated (demo)"); setSel(null); },
							})}>Reactivate</button>
						)}
					</div>
				</Drawer>
			)}
		</>
	);
}

/* ============================ BOOKINGS ============================ */

function Bookings() {
	const { bookings, setBookingStatus, confirm, globalQuery } = useAdmin();
	const [sub, setSub] = useState("All");
	const [q, setQ] = useState("");
	const [prop, setProp] = useState("all");
	const [sel, setSel] = useState<AdminBooking | null>(null);

	const match = (s: string) => s.toLowerCase().includes((q + globalQuery).toLowerCase());
	const counts = {
		All: bookings.length,
		Pending: bookings.filter((b) => b.status === "Pending").length,
		Confirmed: bookings.filter((b) => b.status === "Confirmed").length,
		Completed: bookings.filter((b) => b.status === "Completed").length,
		Cancelled: bookings.filter((b) => b.status === "Cancelled").length,
	};

	const propNames = useMemo(() => [...new Set(bookings.map((b) => b.property))], [bookings]);

	const rows = bookings.filter(
		(b) =>
			(sub === "All" || b.status === sub) &&
			(prop === "all" || b.property === prop) &&
			(match(b.guest) || match(b.id) || match(b.property)),
	);

	return (
		<>
			<SubTabs tabs={["All", "Pending", "Confirmed", "Completed", "Cancelled"]} active={sub} onChange={setSub} counts={counts} />
			<div className="gw-toolbar">
				<SearchInput value={q} onChange={setQ} placeholder="Search ref, guest, property…" />
				<select className="gw-select" value={prop} onChange={(e) => setProp(e.target.value)} aria-label="Filter by property">
					<option value="all">All properties</option>
					{propNames.map((p) => <option key={p}>{p}</option>)}
				</select>
			</div>
			<Table
				cols={[
					{ key: "id", label: "Ref", render: (b: AdminBooking) => <strong>{b.id}</strong>, sortKey: (b) => b.id },
					{ key: "guest", label: "Guest", render: (b) => b.guest, sortKey: (b) => b.guest },
					{ key: "prop", label: "Property", render: (b) => b.property },
					{ key: "dates", label: "Check-in", render: (b) => b.checkin, sortKey: (b) => b.checkin },
					{ key: "n", label: "Nights", render: (b) => b.nights, sortKey: (b) => b.nights },
					{ key: "total", label: "Total", render: (b) => fmtR(b.total), sortKey: (b) => b.total },
					{ key: "pay", label: "Payment", render: (b) => b.payment },
					{ key: "status", label: "Status", render: (b) => <Pill status={b.status} />, sortKey: (b) => b.status },
				]}
				rows={rows}
				empty="No bookings match."
				onRow={setSel}
			/>

			{sel && (
				<Drawer title={`Booking ${sel.id}`} onClose={() => setSel(null)} wide>
					<div className="gw-grid-2" style={{ gap: "1rem" }}>
						<Dr k="Status" v={<Pill status={sel.status} />} />
						<Dr k="Payment" v={sel.payment} />
						<Dr k="Guest" v={sel.guest} />
						<Dr k="Email" v={sel.email} />
						<Dr k="Property" v={sel.property} />
						<Dr k="Room" v={sel.room} />
						<Dr k="Check-in" v={sel.checkin} />
						<Dr k="Check-out" v={sel.checkout} />
						<Dr k="Nights" v={sel.nights} />
						<Dr k="Guests" v={sel.guests} />
						<Dr k="Booked on" v={sel.created} />
						<Dr k="Total" v={<strong>{fmtR(sel.total)}</strong>} />
					</div>
					<div className="gw-buttons" style={{ marginTop: "1.2rem" }}>
						{sel.status === "Pending" && (
							<button className="gw-btn gw-btn--gold" onClick={() => confirm({
								title: "Confirm booking?", body: `Confirm ${sel.id} for ${sel.guest}? (demo)`, okLabel: "Confirm booking",
								action: () => { setBookingStatus(sel.id, "Confirmed"); toast("Booking confirmed (demo)"); setSel(null); },
							})}>Confirm booking</button>
						)}
						{(sel.status === "Pending" || sel.status === "Confirmed") && (
							<>
								<button className="gw-btn gw-btn--outline gw-btn--outline-dark" onClick={() => confirm({
									title: "Mark completed?", body: `Mark ${sel.id} as completed? (demo)`, okLabel: "Complete",
									action: () => { setBookingStatus(sel.id, "Completed"); toast("Booking completed (demo)"); setSel(null); },
								})}>Mark completed</button>
								<button className="gw-btn gw-btn--outline gw-btn--outline-dark" onClick={() => confirm({
									title: "Cancel booking?", body: `Cancel ${sel.id} and issue a demo refund? (demo)`, okLabel: "Cancel booking",
									action: () => { setBookingStatus(sel.id, "Cancelled"); toast("Booking cancelled — demo refund issued"); setSel(null); },
								})}>Cancel & refund</button>
							</>
						)}
						{sel.status === "Cancelled" && <p className="gw-small">Refund status: {sel.payment} (demo).</p>}
					</div>
				</Drawer>
			)}
		</>
	);
}
