"use client";

import { useMemo, useState } from "react";
import { useAdmin, type Section } from "@/components/admin/AdminDash";
import { Bars, Dr, Drawer, fmtR, Panel, Pill, SearchInput, Shares, SubTabs, Table } from "@/components/admin/ui";
import { toast } from "@/components/Toaster";
import {
	D_CATEGORY_SHARE, D_DEST_REVENUE, D_MONTHLY, FINANCE, type AdminDestination, type AdminNotif,
	type AdminPromo, type AdminReview, type AdminTicket,
} from "@/lib/admin-data";

export default function OpsSections({ section }: { section: Section }) {
	switch (section) {
		case "finance": return <Finance />;
		case "reviews": return <Reviews />;
		case "destinations": return <Destinations />;
		case "promos": return <Promos />;
		case "support": return <Support />;
		case "notifications": return <Notifications />;
		default: return null;
	}
}

function downloadCSV(name: string, rows: (string | number)[][]) {
	const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
	const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
	const a = document.createElement("a");
	a.href = url;
	a.download = name;
	a.click();
	URL.revokeObjectURL(url);
	toast("Demo report downloaded");
}

/* ============================ FINANCE ============================ */

function Finance() {
	const { bookings } = useAdmin();
	const [range, setRange] = useState("last-6m");

	const paid = bookings.filter((b) => b.payment === "Paid").length;

	return (
		<>
			<div className="gw-toolbar">
				<select className="gw-select" value={range} onChange={(e) => setRange(e.target.value)} aria-label="Date range">
					<option value="last-6m">Last 6 months</option>
					<option value="last-12m">Last 12 months</option>
					<option value="ytd">Year to date</option>
				</select>
				<button className="gw-btn gw-btn--outline gw-btn--outline-dark gw-btn--small" onClick={() =>
					downloadCSV("revenue-report.csv", [
						["Month", "Bookings", "Revenue (R)"],
						...D_MONTHLY.map((m) => [m.m, m.bookings, m.revenue * 1000]),
					])
				}>Export report (demo)</button>
			</div>
			<div className="gw-statgrid">
				<div className="gw-stat"><p>Total booking value</p><strong>{fmtR(FINANCE.totalValue)}</strong></div>
				<div className="gw-stat"><p>Platform commission</p><strong>{fmtR(FINANCE.commission)}</strong></div>
				<div className="gw-stat"><p>Owner earnings</p><strong>{fmtR(FINANCE.ownerEarnings)}</strong></div>
				<div className="gw-stat"><p>Refunds issued</p><strong>{fmtR(FINANCE.refunds)}</strong></div>
			</div>
			<div className="gw-grid-2">
				<Panel title="Revenue by month" sub={`${range} — R thousands (demo)`}>
					<Bars data={D_MONTHLY.map((m) => ({ label: m.m, value: m.revenue }))} />
				</Panel>
				<Panel title="Revenue by destination">
					<Shares data={D_DEST_REVENUE.map((d) => ({ label: d.d, pct: d.pct }))} />
				</Panel>
				<Panel title="Revenue by property" sub="Top earners (demo)">
					<Table
						cols={[
							{ key: "n", label: "Property", render: (r: { n: string; v: number }) => r.n },
							{ key: "v", label: "Revenue", render: (r) => fmtR(r.v), sortKey: (r) => r.v },
						]}
						rows={[]}
						pageSize={5}
					/>
				</Panel>
				<Panel title="Payment status" sub="Across all bookings (demo)">
					<div className="gw-grid-2" style={{ gap: "1rem" }}>
						<Dr k="Paid bookings" v={`${paid} of ${bookings.length}`} />
						<Dr k="Commission rate" v={`${FINANCE.commissionRate}%`} />
						<Dr k="Pending payments" v={bookings.filter((b) => b.payment === "Pending").length} />
						<Dr k="Refunded" v={bookings.filter((b) => b.payment === "Refunded").length} />
					</div>
				</Panel>
			</div>
			<p className="gw-demo-note">All figures on this page are demonstration data — not real financials.</p>
		</>
	);
}

/* ============================ REVIEWS ============================ */

function Reviews() {
	const { reviews, setReviewStatus, confirm } = useAdmin();
	const [sub, setSub] = useState("All");
	const [sel, setSel] = useState<AdminReview | null>(null);

	const counts = {
		All: reviews.length,
		Published: reviews.filter((r) => r.status === "Published").length,
		Reported: reviews.filter((r) => r.status === "Reported").length,
		Hidden: reviews.filter((r) => r.status === "Hidden").length,
	};
	const rows = reviews.filter((r) => sub === "All" || r.status === sub);

	const act = (r: AdminReview, status: AdminReview["status"], verb: string) =>
		confirm({
			title: `${verb} review?`,
			body: `Review by ${r.customer} on ${r.property} will be marked ${status.toLowerCase()}. (demo)`,
			okLabel: verb,
			action: () => { setReviewStatus(r.id, status); toast(`Review ${status.toLowerCase()} (demo)`); setSel(null); },
		});

	return (
		<>
			<SubTabs tabs={["All", "Published", "Reported", "Hidden"]} active={sub} onChange={setSub} counts={counts} />
			<Table
				cols={[
					{ key: "prop", label: "Property", render: (r: AdminReview) => <strong>{r.property}</strong>, sortKey: (r) => r.property },
					{ key: "cust", label: "Customer", render: (r) => r.customer },
					{ key: "rating", label: "Rating", render: (r) => "★".repeat(r.rating), sortKey: (r) => r.rating },
					{ key: "text", label: "Review", render: (r) => <span style={{ maxWidth: "24rem", display: "inline-block" }}>{r.text}</span> },
					{ key: "date", label: "Date", render: (r) => r.date, sortKey: (r) => r.date },
					{ key: "status", label: "Status", render: (r) => <Pill status={r.status} /> },
				]}
				rows={rows}
				empty="No reviews in this group."
				onRow={setSel}
			/>
			{sel && (
				<Drawer title={`Review #${sel.id} — ${sel.property}`} onClose={() => setSel(null)}>
					<Dr k="Customer" v={sel.customer} />
					<Dr k="Rating" v={`${"★".repeat(sel.rating)} (${sel.rating}/5)`} />
					<Dr k="Date" v={sel.date} />
					<Dr k="Status" v={<Pill status={sel.status} />} />
					<h4>Review</h4>
					<p>“{sel.text}”</p>
					<h4>Moderation history</h4>
					<p className="gw-small">{sel.status === "Published" ? "No moderation actions." : `Marked ${sel.status.toLowerCase()} (demo).`}</p>
					<div className="gw-buttons" style={{ marginTop: "1rem" }}>
						{sel.status !== "Reported" && <button className="gw-btn gw-btn--outline gw-btn--outline-dark" onClick={() => act(sel, "Reported", "Flag for review")}>Flag</button>}
						{sel.status !== "Hidden" && <button className="gw-btn gw-btn--outline gw-btn--outline-dark" onClick={() => act(sel, "Hidden", "Hide")}>Hide</button>}
						{sel.status !== "Published" && <button className="gw-btn gw-btn--gold" onClick={() => act(sel, "Published", "Restore")}>Restore</button>}
					</div>
				</Drawer>
			)}
		</>
	);
}

/* ============================ DESTINATIONS ============================ */

function Destinations() {
	const { destinations, setDestinations } = useAdmin();
	const [sel, setSel] = useState<AdminDestination | null>(null);
	const [adding, setAdding] = useState(false);

	const toggle = (id: number, field: "featured" | "visible") => {
		setDestinations((ds) => ds.map((d) => (d.id === id ? { ...d, [field]: !d[field] } : d)));
		toast("Destination updated (demo)");
	};

	return (
		<>
			<div className="gw-toolbar">
				<span className="gw-small">{destinations.filter((d) => d.visible).length} visible · {destinations.filter((d) => d.featured).length} featured</span>
				<button className="gw-btn gw-btn--gold gw-btn--small" onClick={() => setAdding(true)}>+ Add destination</button>
			</div>
			<div className="gw-destgrid">
				{destinations.map((d) => (
					<div className="gw-card" key={d.id} style={{ padding: 0, overflow: "hidden" }}>
						{/* eslint-disable-next-line @next/next/no-img-element */}
						<img src={d.image} alt={d.name} style={{ width: "100%", aspectRatio: "16/9", objectFit: "cover" }} />
						<div style={{ padding: "0.9rem 1rem" }}>
							<div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
								<strong>{d.name}</strong>
								<span className="gw-small">{d.properties} properties</span>
							</div>
							<p className="gw-small" style={{ margin: "0.3rem 0" }}>{d.blurb} · {d.province}</p>
							<div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
								<button className={`gw-filter__btn${d.featured ? " is-active" : ""}`} onClick={() => toggle(d.id, "featured")}>Featured</button>
								<button className={`gw-filter__btn${d.visible ? " is-active" : ""}`} onClick={() => toggle(d.id, "visible")}>Visible</button>
								<button className="gw-btn gw-btn--outline gw-btn--outline-dark gw-btn--small" onClick={() => setSel(d)}>Edit</button>
							</div>
						</div>
					</div>
				))}
			</div>
			{(sel || adding) && (
				<Drawer title={sel ? `Edit ${sel.name}` : "Add destination"} onClose={() => { setSel(null); setAdding(false); }}>
					<form className="gw-form" onSubmit={(e) => { e.preventDefault(); toast("Destination saved (demo)"); setSel(null); setAdding(false); }}>
						<div className="gw-form__field"><label className="gw-form__label">Name</label><input defaultValue={sel?.name} required /></div>
						<div className="gw-form__field"><label className="gw-form__label">Province / region</label><input defaultValue={sel?.province} required /></div>
						<div className="gw-form__field"><label className="gw-form__label">Description</label><textarea rows={2} defaultValue={sel?.blurb} /></div>
						<div className="gw-form__field"><label className="gw-form__label">Photo</label><input type="file" accept="image/*" /></div>
						<div className="gw-form__field"><label className="gw-form__check"><input type="checkbox" defaultChecked={sel?.featured} /> Featured destination</label></div>
						<div className="gw-form__field"><label className="gw-form__check"><input type="checkbox" defaultChecked={sel?.visible ?? true} /> Visible on site</label></div>
						<button className="gw-form__submit" type="submit">{sel ? "Save changes" : "Add destination"}</button>
						<p className="gw-form__hint">Demo form — nothing is saved to a server.</p>
					</form>
				</Drawer>
			)}
		</>
	);
}

/* ============================ PROMOTIONS ============================ */

function Promos() {
	const { promos, setPromos } = useAdmin();
	const [sub, setSub] = useState("All");
	const [sel, setSel] = useState<AdminPromo | null>(null);
	const [adding, setAdding] = useState(false);
	const [preview, setPreview] = useState<AdminPromo | null>(null);

	const counts = {
		All: promos.length,
		Active: promos.filter((p) => p.status === "Active").length,
		Scheduled: promos.filter((p) => p.status === "Scheduled").length,
		Draft: promos.filter((p) => p.status === "Draft").length,
	};
	const rows = promos.filter((p) => sub === "All" || p.status === sub);

	const setStatus = (id: number, status: AdminPromo["status"]) => {
		setPromos((ps) => ps.map((p) => (p.id === id ? { ...p, status } : p)));
		toast(`Promotion ${status.toLowerCase()} (demo)`);
	};

	return (
		<>
			<SubTabs tabs={["All", "Active", "Scheduled", "Draft"]} active={sub} onChange={setSub} counts={counts} />
			<div className="gw-toolbar">
				<span className="gw-small">{promos.filter((p) => p.featured).length} featured on homepage</span>
				<button className="gw-btn gw-btn--gold gw-btn--small" onClick={() => setAdding(true)}>+ Create promotion</button>
			</div>
			<Table
				cols={[
					{ key: "t", label: "Promotion", render: (p: AdminPromo) => <strong>{p.title}</strong>, sortKey: (p) => p.title },
					{ key: "disc", label: "Discount", render: (p) => p.discount },
					{ key: "dates", label: "Runs", render: (p) => `${p.starts} → ${p.ends}` },
					{ key: "props", label: "Applies to", render: (p) => p.properties },
					{ key: "feat", label: "Featured", render: (p) => (p.featured ? "Yes" : "—") },
					{ key: "status", label: "Status", render: (p) => <Pill status={p.status} /> },
					{ key: "act", label: "", render: (p) => <button className="gw-btn gw-btn--outline gw-btn--outline-dark gw-btn--small" onClick={(e) => { e.stopPropagation(); setSel(p); }}>Edit</button> },
				]}
				rows={rows}
				empty="No promotions."
				onRow={setPreview}
			/>

			{preview && (
				<Drawer title={`Preview — ${preview.title}`} onClose={() => setPreview(null)}>
					<p className="gw-small">How this promo appears on the homepage:</p>
					<div className="gw-offer" style={{ minHeight: 200 }}>
						{/* eslint-disable-next-line @next/next/no-img-element */}
						<img src={preview.image} alt="" />
						<h3>{preview.title}</h3>
						<p>{preview.description}</p>
						<span className="gw-btn gw-btn--gold gw-btn--small">{preview.discount}</span>
					</div>
					<div className="gw-buttons" style={{ marginTop: "1rem" }}>
						<button className="gw-btn gw-btn--outline gw-btn--outline-dark" onClick={() => { setSel(preview); setPreview(null); }}>Edit</button>
					</div>
				</Drawer>
			)}

			{(sel || adding) && (
				<Drawer title={sel ? `Edit — ${sel.title}` : "Create promotion"} onClose={() => { setSel(null); setAdding(false); }}>
					<form className="gw-form" onSubmit={(e) => { e.preventDefault(); toast("Promotion saved (demo)"); setSel(null); setAdding(false); }}>
						<div className="gw-form__field"><label className="gw-form__label">Title</label><input defaultValue={sel?.title} required /></div>
						<div className="gw-form__field"><label className="gw-form__label">Description</label><textarea rows={2} defaultValue={sel?.description} /></div>
						<div className="gw-form__grid">
							<div className="gw-form__field"><label className="gw-form__label">Discount</label><input defaultValue={sel?.discount} placeholder="e.g. 15% off" /></div>
							<div className="gw-form__field"><label className="gw-form__label">Applies to</label><input defaultValue={sel?.properties} placeholder="e.g. 3 stays" /></div>
						</div>
						<div className="gw-form__grid">
							<div className="gw-form__field"><label className="gw-form__label">Starts</label><input type="date" defaultValue={sel?.starts} /></div>
							<div className="gw-form__field"><label className="gw-form__label">Ends</label><input type="date" defaultValue={sel?.ends} /></div>
						</div>
						{sel && (
							<div className="gw-form__field">
								<label className="gw-form__label">Status</label>
								<select value={sel.status} onChange={(e) => setStatus(sel.id, e.target.value as AdminPromo["status"])}>
									{["Active", "Scheduled", "Draft", "Expired"].map((s) => <option key={s}>{s}</option>)}
								</select>
							</div>
						)}
						<div className="gw-form__field"><label className="gw-form__check"><input type="checkbox" defaultChecked={sel?.featured} /> Feature on homepage</label></div>
						<button className="gw-form__submit" type="submit">{sel ? "Save changes" : "Create promotion"}</button>
						<p className="gw-form__hint">Demo form.</p>
					</form>
				</Drawer>
			)}
		</>
	);
}

/* ============================ SUPPORT ============================ */

function Support() {
	const { tickets, setTicketStatus } = useAdmin();
	const [sub, setSub] = useState("All");
	const [q, setQ] = useState("");
	const [sel, setSel] = useState<AdminTicket | null>(null);

	const match = (s: string) => s.toLowerCase().includes(q.toLowerCase());
	const counts = {
		All: tickets.length,
		Open: tickets.filter((t) => t.status === "Open").length,
		"In progress": tickets.filter((t) => t.status === "In progress").length,
		Resolved: tickets.filter((t) => t.status === "Resolved").length,
	};
	const rows = tickets.filter(
		(t) => (sub === "All" || t.status === sub) && (match(t.subject) || match(t.customer) || match(t.id)),
	);

	return (
		<>
			<SubTabs tabs={["All", "Open", "In progress", "Resolved"]} active={sub} onChange={setSub} counts={counts} />
			<div className="gw-toolbar"><SearchInput value={q} onChange={setQ} placeholder="Search tickets…" /></div>
			<Table
				cols={[
					{ key: "id", label: "Ref", render: (t: AdminTicket) => <strong>{t.id}</strong> },
					{ key: "subj", label: "Subject", render: (t) => t.subject, sortKey: (t) => t.subject },
					{ key: "cust", label: "Customer", render: (t) => t.customer },
					{ key: "cat", label: "Category", render: (t) => t.category },
					{ key: "pri", label: "Priority", render: (t) => <span className={`gw-status ${t.priority === "High" ? "gw-status--cancelled" : "gw-status--pending"}`}>{t.priority}</span> },
					{ key: "date", label: "Submitted", render: (t) => t.submitted, sortKey: (t) => t.submitted },
					{ key: "status", label: "Status", render: (t) => <Pill status={t.status === "In progress" ? "Pending" : t.status === "Resolved" ? "Live" : "Open"} /> },
				]}
				rows={rows}
				empty="No requests in this queue."
				onRow={setSel}
			/>
			{sel && (
				<Drawer title={`${sel.id} — ${sel.subject}`} onClose={() => setSel(null)}>
					<Dr k="Customer" v={sel.customer} />
					<Dr k="Category" v={sel.category} />
					<Dr k="Priority" v={sel.priority} />
					<Dr k="Submitted" v={sel.submitted} />
					<Dr k="Status" v={sel.status} />
					<h4>Update status</h4>
					<div className="gw-buttons">
						{["Open", "In progress", "Resolved"].map((s) => (
							<button
								key={s}
								className={`gw-filter__btn${sel.status === s ? " is-active" : ""}`}
								onClick={() => {
									setTicketStatus(sel.id, s as AdminTicket["status"]);
									setSel({ ...sel, status: s as AdminTicket["status"] });
									toast(`${sel.id} → ${s} (demo)`);
								}}
							>
								{s}
							</button>
						))}
					</div>
				</Drawer>
			)}
		</>
	);
}

/* ============================ NOTIFICATIONS ============================ */

function Notifications() {
	const { notifs, markAllRead } = useAdmin();
	const [sub, setSub] = useState("All");
	const [sel, setSel] = useState<AdminNotif | null>(null);

	const counts = {
		All: notifs.length,
		New: notifs.filter((n) => n.isNew).length,
		Booking: notifs.filter((n) => n.type === "Booking").length,
		Approvals: notifs.filter((n) => n.type === "Approval").length,
		Account: notifs.filter((n) => n.type === "Account").length,
		Owner: notifs.filter((n) => n.type === "Owner").length,
		System: notifs.filter((n) => n.type === "System").length,
	};
	const rows = notifs.filter((n) => {
		if (sub === "All") return true;
		if (sub === "New") return n.isNew;
		if (sub === "Approvals") return n.type === "Approval";
		return n.type === sub;
	});

	return (
		<>
			<div className="gw-toolbar">
				<SubTabs tabs={["All", "New", "Booking", "Approvals", "Account", "Owner", "System"]} active={sub} onChange={setSub} counts={counts} />
				<button className="gw-btn gw-btn--outline gw-btn--outline-dark gw-btn--small" onClick={markAllRead}>Mark all read</button>
			</div>
			<Table
				cols={[
					{ key: "type", label: "Type", render: (n: AdminNotif) => <span className="gw-chip">{n.type}</span> },
					{ key: "text", label: "Notification", render: (n) => n.text },
					{ key: "time", label: "When", render: (n) => n.time, sortKey: (n) => n.id },
					{ key: "status", label: "", render: (n) => (n.isNew ? <span className="gw-status gw-status--pending">New</span> : <span className="gw-small">Read</span>) },
				]}
				rows={rows}
				empty="No notifications."
				onRow={setSel}
			/>
			{sel && (
				<Drawer title="Notification" onClose={() => setSel(null)}>
					<Dr k="Type" v={sel.type} />
					<Dr k="Message" v={sel.text} />
					<Dr k="Received" v={sel.time} />
					<Dr k="Status" v={sel.isNew ? "Unread" : "Read"} />
				</Drawer>
			)}
		</>
	);
}
