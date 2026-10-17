"use client";

import { useState } from "react";
import { Bars, Dr, fmtR, Panel, Pill, SearchInput, SubTabs, Table } from "@/components/admin/ui";
import { useStaff, type StaffSection } from "@/components/staff/ctx";
import { toast } from "@/components/Toaster";
import { S_ATTENDANCE, S_DOCS, S_SCHEDULE, type StaffDoc } from "@/lib/staff-data";

export default function StaffSectionsC({ section }: { section: StaffSection }) {
	switch (section) {
		case "staff-performance": return <Performance />;
		case "staff-documents": return <Documents />;
		case "staff-communication": return <Communication />;
		case "staff-reports": return <StaffReports />;
		case "staff-settings": return <StaffSettings />;
		default: return null;
	}
}

/* ============================ PERFORMANCE ============================ */

function Performance() {
	const { drivers, guides } = useStaff();
	return (
		<div className="gw-grid-2">
			<Panel title="Driver performance" sub="Completed trips and incidents (demo)">
				<Table
					cols={[
						{ key: "n", label: "Driver", render: (d: typeof drivers[0]) => <strong>{d.name}</strong> },
						{ key: "t", label: "Trips", render: (d) => d.trips, sortKey: (d) => d.trips },
						{ key: "i", label: "Incidents", render: (d) => (d.incidents === 0 ? "None" : `${d.incidents} reported`) },
					]}
					rows={drivers}
					pageSize={6}
				/>
				<p className="gw-small">Demo stats — do not use for employment decisions.</p>
			</Panel>
			<Panel title="Tour guide feedback" sub="Tours completed and ratings (demo)">
				<Table
					cols={[
						{ key: "n", label: "Guide", render: (g: typeof guides[0]) => <strong>{g.name}</strong> },
						{ key: "t", label: "Tours", render: (g) => g.tours, sortKey: (g) => g.tours },
						{ key: "r", label: "Rating", render: (g) => `${g.rating}/5`, sortKey: (g) => g.rating },
					]}
					rows={guides}
					pageSize={5}
				/>
			</Panel>
			<Panel title="Training records" sub="Sample">
				<ul className="gw-activity">
					<li><span className="gw-activity__icn">—</span><div>No training records yet<br /><small>Add employees to populate</small></div></li>
				</ul>
			</Panel>
			<Panel title="Review notes" sub="Sample">
				<p className="gw-small">Q3 review summaries are sample text. Avoid making employment decisions from demonstration statistics.</p>
			</Panel>
		</div>
	);
}

/* ============================ DOCUMENTS ============================ */

function Documents() {
	const [sub, setSub] = useState("All");
	const [q, setQ] = useState("");
	const tabs = ["All", "Verified", "Pending", "Expiring", "Expired"];
	const match = (s: string) => s.toLowerCase().includes(q.toLowerCase());
	const rows = S_DOCS.filter((d) => (sub === "All" || d.status === sub) && (match(d.staff) || match(d.type)));
	const alerts = S_DOCS.filter((d) => d.status === "Expiring" || d.status === "Expired");

	return (
		<>
			{alerts.length > 0 && (
				<div className="gw-denote">
					<strong>{alerts.length} document alert{alerts.length > 1 ? "s" : ""}:</strong>{" "}
					{alerts.map((d) => `${d.staff} — ${d.type} (${d.status.toLowerCase()})`).join(" · ")}
				</div>
			)}
			<SubTabs tabs={tabs} active={sub} onChange={setSub} counts={Object.fromEntries(tabs.map((t) => [t, t === "All" ? S_DOCS.length : S_DOCS.filter((d) => d.status === t).length]))} />
			<div className="gw-toolbar"><SearchInput value={q} onChange={setQ} placeholder="Search staff or document…" /></div>
			<Table
				cols={[
					{ key: "s", label: "Staff / asset", render: (d: StaffDoc) => <strong>{d.staff}</strong>, sortKey: (d) => d.staff },
					{ key: "t", label: "Document", render: (d) => d.type },
					{ key: "i", label: "Issued", render: (d) => d.issued },
					{ key: "e", label: "Expires", render: (d) => d.expires, sortKey: (d) => d.expires },
					{ key: "n", label: "Notes", render: (d) => d.notes || "—" },
					{ key: "st", label: "Status", render: (d) => <Pill status={d.status} /> },
					{ key: "a", label: "", render: (d) => d.status !== "Verified" ? (
						<button className="gw-btn gw-btn--outline gw-btn--outline-dark gw-btn--small" onClick={() => toast(`Renewal reminder sent to ${d.staff} (demo)`)}>Remind</button>
					) : null },
				]}
				rows={rows}
				empty="No documents in this group."
			/>
			<p className="gw-demo-note">Document handling is demonstrational — real storage would need secure file access and audit logging.</p>
		</>
	);
}

/* ============================ COMMUNICATION ============================ */

function Communication() {
	const { announcements, pushAnnouncement } = useStaff();
	const [title, setTitle] = useState("");
	const [body, setBody] = useState("");
	const [audience, setAudience] = useState("All staff");

	return (
		<div className="gw-grid-2">
			<Panel title="Announcements">
				<ul className="gw-activity">
					{announcements.map((a) => (
						<li key={a.id}><span className="gw-activity__icn">✆</span><div><strong>{a.title}</strong> — {a.body}<br /><small>{a.date} · {a.audience}</small></div></li>
					))}
				</ul>
			</Panel>
			<Panel title="Send announcement" sub="Demo — preview only">
				<div className="gw-form__field"><label className="gw-form__label">Title</label><input value={title} onChange={(e) => setTitle(e.target.value)} /></div>
				<div className="gw-form__field"><label className="gw-form__label">Message</label><textarea rows={3} value={body} onChange={(e) => setBody(e.target.value)} /></div>
				<div className="gw-form__field"><label className="gw-form__label">Audience</label>
					<select value={audience} onChange={(e) => setAudience(e.target.value)}>
						<option>All staff</option><option>Drivers</option><option>Tour guides</option><option>Office staff</option>
					</select>
				</div>
				<button
					className="gw-form__submit"
					onClick={() => {
						if (!title.trim() || !body.trim()) { toast("Add a title and message"); return; }
						pushAnnouncement({ title, body, audience });
						setTitle(""); setBody("");
						toast("Announcement posted (demo — nothing sent)");
					}}
				>
					Post announcement
				</button>
				<p className="gw-form__hint">Messaging stays local until a messaging service is connected.</p>
			</Panel>
		</div>
	);
}

/* ============================ REPORTS ============================ */

function StaffReports() {
	const { employees, drivers, guides, vehicles, assignments } = useStaff();
	const [range, setRange] = useState("oct-2026");

	const utilisation = [
		{ label: "In use", pct: 33 },
		{ label: "Available", pct: 50 },
		{ label: "Maintenance", pct: 8 },
		{ label: "Unavailable", pct: 9 },
	];
	const attendanceSummary = [
		{ label: "Present", value: S_ATTENDANCE.filter((a) => a.status === "Present").length },
		{ label: "Late", value: S_ATTENDANCE.filter((a) => a.status === "Late").length },
		{ label: "Absent", value: S_ATTENDANCE.filter((a) => a.status === "Absent").length },
		{ label: "Leave", value: S_ATTENDANCE.filter((a) => a.status === "Leave").length },
	];

	return (
		<>
			<div className="gw-toolbar">
				<select className="gw-select" value={range} onChange={(e) => setRange(e.target.value)} aria-label="Report range">
					<option value="oct-2026">October 2026</option>
					<option value="sep-2026">September 2026</option>
					<option value="q3-2026">Q3 2026</option>
				</select>
				<button className="gw-btn gw-btn--outline gw-btn--outline-dark gw-btn--small" onClick={() => toast("Staff report downloaded (demo)")}>Download report (demo)</button>
			</div>
			<div className="gw-statgrid">
				<div className="gw-stat"><p>Total staff</p><strong>{employees.length + drivers.length + guides.length}</strong></div>
				<div className="gw-stat"><p>Drivers</p><strong>{drivers.length}</strong></div>
				<div className="gw-stat"><p>Guides</p><strong>{guides.length}</strong></div>
				<div className="gw-stat"><p>Fleet</p><strong>{vehicles.length}</strong></div>
			</div>
			<div className="gw-grid-2">
				<Panel title="Assignments by status" sub={range}>
					<Bars data={[
						{ label: "Completed", value: assignments.filter((a) => a.status === "Completed").length },
						{ label: "Active", value: assignments.filter((a) => a.status === "Active").length },
						{ label: "Upcoming", value: assignments.filter((a) => a.status === "Upcoming").length },
						{ label: "Pending", value: assignments.filter((a) => a.status === "Pending").length },
						{ label: "Unassigned", value: assignments.filter((a) => a.status === "Unassigned").length },
					]} />
				</Panel>
				<Panel title="Today's attendance">
					<Bars data={attendanceSummary} />
				</Panel>
				<Panel title="Vehicle utilisation">
					<div className="gw-shares">
						{utilisation.map((u) => (
							<div className="gw-shares__row" key={u.label}>
								<span className="gw-shares__lbl">{u.label}</span>
								<span className="gw-shares__track"><span style={{ width: `${u.pct}%` }} /></span>
								<span className="gw-shares__pct">{u.pct}%</span>
							</div>
						))}
					</div>
				</Panel>
				<Panel title="Driver trip totals" sub="Demo">
					<Table
						cols={[
							{ key: "n", label: "Driver", render: (d: typeof drivers[0]) => d.name },
							{ key: "t", label: "Trips", render: (d) => d.trips, sortKey: (d) => d.trips },
							{ key: "i", label: "Incidents", render: (d) => d.incidents, sortKey: (d) => d.incidents },
						]}
						rows={drivers}
						pageSize={6}
					/>
				</Panel>
			</div>
		</>
	);
}

/* ============================ STAFF SETTINGS ============================ */

function StaffSettings() {
	return (
		<div className="gw-grid-2">
			<Panel title="Staff categories & employment types">
				{["Employee", "Driver", "Tour guide", "Contractor"].map((c) => (
					<div className="gw-form__field" key={c}>
						<label className="gw-form__check"><input type="checkbox" defaultChecked /> {c}</label>
					</div>
				))}
				<button className="gw-form__submit" onClick={() => toast("Categories saved (demo)")}>Save</button>
			</Panel>
			<Panel title="Registration requirements" sub="Demo toggles">
				{["Photo required", "ID document required", "CV required", "Emergency contact required"].map((r) => (
					<div className="gw-form__field" key={r}>
						<label className="gw-form__check"><input type="checkbox" defaultChecked={r !== "CV required"} /> {r}</label>
					</div>
				))}
				<button className="gw-form__submit" onClick={() => toast("Requirements saved (demo)")}>Save</button>
			</Panel>
			<Panel title="Document requirements" sub="Demo toggles — SA ops">
				{["Driver's licence (drivers)", "PrDP where applicable", "Guide credentials (guides)", "Contract (all staff)"].map((r) => (
					<div className="gw-form__field" key={r}>
						<label className="gw-form__check"><input type="checkbox" defaultChecked /> {r}</label>
					</div>
				))}
				<button className="gw-form__submit" onClick={() => toast("Requirements saved (demo)")}>Save</button>
			</Panel>
			<Panel title="Notification preferences">
				{["New registration alerts", "Document expiry reminders", "Schedule changes", "Leave requests"].map((n) => (
					<div className="gw-form__field" key={n}>
						<label className="gw-form__check"><input type="checkbox" defaultChecked /> {n}</label>
					</div>
				))}
				<button className="gw-form__submit" onClick={() => toast("Preferences saved (demo)")}>Save</button>
			</Panel>
		</div>
	);
}
