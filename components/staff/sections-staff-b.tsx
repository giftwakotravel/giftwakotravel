"use client";

import { useState } from "react";
import { Dr, Drawer, Panel, Pill, SearchInput, SubTabs, Table } from "@/components/admin/ui";
import { driverBusy, useStaff, vehicleBusy, type StaffSection } from "@/components/staff/ctx";
import { toast } from "@/components/Toaster";
import { DAYS, S_ATTENDANCE, S_DEPARTMENTS, S_LEAVE, S_ROLES, S_SCHEDULE, type Assignment, type Vehicle } from "@/lib/staff-data";

export default function StaffSectionsB({ section }: { section: StaffSection }) {
	switch (section) {
		case "staff-departments": return <Departments />;
		case "staff-vehicles": return <Vehicles />;
		case "staff-scheduling": return <Scheduling />;
		case "staff-assignments": return <Assignments />;
		case "staff-attendance": return <Attendance />;
		default: return null;
	}
}

/* ============================ DEPARTMENTS ============================ */

function Departments() {
	const [sel, setSel] = useState<string | null>(null);
	const dept = S_DEPARTMENTS.find((d) => d.name === sel);

	return (
		<>
			<div className="gw-destgrid">
				{S_DEPARTMENTS.map((d) => (
					<div className="gw-card" key={d.name}>
						<div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
							<strong>{d.name}</strong>
							<span className="gw-status gw-status--pending">{d.staff} staff</span>
						</div>
						<p className="gw-small" style={{ margin: "0.4rem 0" }}>{d.desc}</p>
						<p className="gw-small" style={{ margin: 0 }}>Manager: <strong>{d.manager}</strong></p>
						<div className="gw-buttons" style={{ marginTop: "0.7rem" }}>
							<button className="gw-btn gw-btn--outline gw-btn--outline-dark gw-btn--small" onClick={() => setSel(d.name)}>View</button>
						</div>
					</div>
				))}
			</div>
			<Panel title="Job roles" sub="Sample roles — configurable later">
				<Table
					cols={[
						{ key: "t", label: "Job title", render: (r: typeof S_ROLES[0]) => <strong>{r.title}</strong> },
						{ key: "d", label: "Department", render: (r) => r.dept },
						{ key: "r", label: "Responsibilities", render: (r) => r.responsibilities },
					]}
					rows={S_ROLES}
				/>
			</Panel>
			{dept && (
				<Drawer title={dept.name} onClose={() => setSel(null)}>
					<Dr k="Manager" v={dept.manager} />
					<Dr k="Staff count" v={dept.staff} />
					<Dr k="Description" v={dept.desc} />
					<h4>Demo role permissions</h4>
					{["View bookings", "Edit trips", "Approve refunds", "Access staff data"].map((p, i) => (
						<label className="gw-form__check" key={p}><input type="checkbox" defaultChecked={i < 2} /> {p}</label>
					))}
					<button className="gw-form__submit" style={{ marginTop: "1rem" }} onClick={() => toast("Permissions saved (demo)")}>Save permissions</button>
				</Drawer>
			)}
		</>
	);
}

/* ============================ VEHICLES ============================ */

function Vehicles() {
	const { vehicles, setVehicleStatus, assignDriverToVehicle, drivers, confirm } = useStaff();
	const [sub, setSub] = useState("All");
	const [sel, setSel] = useState<Vehicle | null>(null);

	const tabs = ["All", "Available", "In use", "Maintenance", "Unavailable"];
	const rows = vehicles.filter((v) => sub === "All" || v.status === sub);
	const expiring = (d: string) => d <= "2026-12-31";

	return (
		<>
			<SubTabs tabs={tabs} active={sub} onChange={setSub} counts={Object.fromEntries(tabs.map((t) => [t, t === "All" ? vehicles.length : vehicles.filter((v) => v.status === t).length]))} />
			<Table
				cols={[
					{ key: "code", label: "ID", render: (v: Vehicle) => <strong>{v.code}</strong> },
					{ key: "reg", label: "Reg", render: (v) => v.reg },
					{ key: "veh", label: "Vehicle", render: (v) => `${v.make} ${v.model} (${v.year})`, sortKey: (v) => v.make },
					{ key: "cat", label: "Category", render: (v) => `${v.cat} · ${v.seats} seats` },
					{ key: "driver", label: "Driver", render: (v) => v.driver ?? "—" },
					{ key: "docs", label: "Expiring", render: (v) => (
						<>
							{expiring(v.licenceDisc) && <span className="gw-status gw-status--expiring">Disc {v.licenceDisc.slice(5)}</span>}{" "}
							{expiring(v.insurance) && <span className="gw-status gw-status--expiring">Ins {v.insurance.slice(5)}</span>}{" "}
							{expiring(v.service) && <span className="gw-status gw-status--expiring">Svc {v.service.slice(5)}</span>}
						</>
					)},
					{ key: "status", label: "Status", render: (v) => <Pill status={v.status} /> },
				]}
				rows={rows}
				empty="No vehicles match."
				onRow={setSel}
			/>
			{sel && (
				<Drawer title={`${sel.code} — ${sel.make} ${sel.model}`} onClose={() => setSel(null)} wide>
					<div className="gw-grid-2" style={{ gap: "1rem" }}>
						<Dr k="Registration" v={sel.reg} />
						<Dr k="Category" v={`${sel.cat} · ${sel.seats} seats`} />
						<Dr k="Year" v={sel.year} />
						<Dr k="Driver" v={sel.driver ?? "Unassigned"} />
						<Dr k="Insurance exp" v={sel.insurance} />
						<Dr k="Licence disc exp" v={sel.licenceDisc} />
						<Dr k="Service due" v={sel.service} />
						<Dr k="Status" v={<Pill status={sel.status} />} />
					</div>
					<h4>Assign driver</h4>
					<select
						className="gw-select"
						value={sel.driver ?? ""}
						onChange={(e) => {
							assignDriverToVehicle(sel.id, e.target.value || null);
							setSel({ ...sel, driver: e.target.value || null });
							toast("Driver assigned (demo)");
						}}
					>
						<option value="">— Unassigned —</option>
						{drivers.map((d) => <option key={d.id} value={d.name}>{d.name}</option>)}
					</select>
					<h4>Status</h4>
					<div className="gw-buttons">
						{(["Available", "In use", "Maintenance", "Unavailable"] as const).map((s) => (
							<button
								key={s}
								className={`gw-filter__btn${sel.status === s ? " is-active" : ""}`}
								onClick={() => confirm({
									title: "Update vehicle status?", body: `Mark ${sel.reg} as ${s.toLowerCase()}? (demo)`, okLabel: "Update",
									action: () => { setVehicleStatus(sel.id, s); setSel({ ...sel, status: s }); toast("Vehicle updated (demo)"); },
								})}
							>{s}</button>
						))}
					</div>
				</Drawer>
			)}
		</>
	);
}

/* ============================ SCHEDULING ============================ */

function Scheduling() {
	const { leave, setLeaveStatus } = useStaff();
	const [dept, setDept] = useState("All");
	const rows = S_SCHEDULE.filter((s) => dept === "All" || s.role === dept);

	const color = (d: string) =>
		d === "Assigned" ? "gw-status--live" : d === "Avail" ? "gw-status--pending" : d === "Leave" ? "gw-status--expiring" : "gw-status--hidden";

	return (
		<>
			<div className="gw-toolbar">
				<SubTabs tabs={["All", "Driver", "Guide", "Staff"]} active={dept} onChange={setDept} />
				<span className="gw-small">Week of 19–25 Oct · <span className="gw-status gw-status--live">Assigned</span> <span className="gw-status gw-status--pending">Available</span> <span className="gw-status gw-status--expiring">Leave</span> <span className="gw-status gw-status--hidden">Off</span></span>
			</div>
			<div className="gw-table-wrap">
				<table className="gw-table gw-sched">
					<thead>
						<tr><th>Staff</th>{DAYS.map((d) => <th key={d}>{d}</th>)}</tr>
					</thead>
					<tbody>
						{rows.map((s) => (
							<tr key={s.staff}>
								<td><strong>{s.staff}</strong><br /><small className="gw-small">{s.role}</small></td>
								{s.days.map((d, i) => (
									<td key={i}><span className={`gw-status ${color(d)}`}>{d === "Avail" ? "Avail" : d}</span></td>
								))}
							</tr>
						))}
					</tbody>
				</table>
			</div>
			<Panel title="Leave requests" sub="Approve or reject (demo)">
				<Table
					cols={[
						{ key: "s", label: "Staff", render: (l: typeof S_LEAVE[0]) => <strong>{l.staff}</strong> },
						{ key: "t", label: "Type", render: (l) => l.type },
						{ key: "d", label: "Dates", render: (l) => `${l.from} → ${l.to}` },
						{ key: "r", label: "Reason", render: (l) => l.reason },
						{ key: "st", label: "Status", render: (l) => <Pill status={l.status === "Approved" ? "Live" : l.status === "Rejected" ? "Rejected" : "Pending"} /> },
						{ key: "a", label: "", render: (l) => l.status === "Pending" ? (
							<>
								<button className="gw-btn gw-btn--gold gw-btn--small" onClick={() => { setLeaveStatus(l.id, "Approved"); toast("Leave approved (demo)"); }}>Approve</button>{" "}
								<button className="gw-btn gw-btn--outline gw-btn--outline-dark gw-btn--small" onClick={() => { setLeaveStatus(l.id, "Rejected"); toast("Leave rejected (demo)"); }}>Reject</button>
							</>
						) : null },
					]}
					rows={leave}
				/>
			</Panel>
		</>
	);
}

/* ============================ ASSIGNMENTS ============================ */

function Assignments() {
	const { assignments, setAssignStatus, staffAssign, drivers, vehicles, guides, confirm } = useStaff();
	const [sub, setSub] = useState("All");
	const [sel, setSel] = useState<Assignment | null>(null);
	const [creating, setCreating] = useState(false);

	const tabs = ["All", "Pending", "Unassigned", "Upcoming", "Active", "Completed", "Cancelled"];
	const rows = assignments.filter((a) => sub === "All" || a.status === sub);

	const tryAssign = (field: "driver" | "vehicle" | "guide", value: string) => {
		if (!sel) return;
		if (field === "driver" && driverBusy(assignments, sel.date, value)) {
			toast(`${value} already has a trip on ${sel.date} — conflict (demo)`);
			return;
		}
		if (field === "vehicle" && vehicleBusy(assignments, sel.date, value)) {
			toast(`Vehicle ${value} already booked on ${sel.date} — conflict (demo)`);
			return;
		}
		staffAssign(sel.id, field, value || null);
		setSel({ ...sel, [field]: value || null, status: sel.status === "Unassigned" ? "Pending" : sel.status });
		toast("Assignment updated (demo)");
	};

	const availDrivers = drivers.filter((d) => d.status === "Available" || d.status === "On trip");

	return (
		<>
			<div className="gw-toolbar">
				<SubTabs tabs={tabs} active={sub} onChange={setSub} counts={Object.fromEntries(tabs.map((t) => [t, t === "All" ? assignments.length : assignments.filter((a) => a.status === t).length]))} />
				<button className="gw-btn gw-btn--gold gw-btn--small" onClick={() => setCreating(true)}>+ Create assignment</button>
			</div>
			<Table
				cols={[
					{ key: "id", label: "Ref", render: (a: Assignment) => <strong>{a.id}</strong> },
					{ key: "trip", label: "Trip", render: (a) => a.trip, sortKey: (a) => a.trip },
					{ key: "date", label: "Date", render: (a) => `${a.date} ${a.depart}`, sortKey: (a) => a.date },
					{ key: "route", label: "Route", render: (a) => `${a.pickup} → ${a.dest}` },
					{ key: "pax", label: "Pax", render: (a) => a.pax, sortKey: (a) => a.pax },
					{ key: "staff", label: "Crew", render: (a) => `${a.driver ?? "—"}${a.guide ? ` · ${a.guide}` : ""}` },
					{ key: "status", label: "Status", render: (a) => <Pill status={a.status} /> },
				]}
				rows={rows}
				empty="No assignments in this group."
				onRow={setSel}
			/>

			{sel && (
				<Drawer title={`${sel.id} — ${sel.trip}`} onClose={() => setSel(null)} wide>
					<div className="gw-grid-2" style={{ gap: "1rem" }}>
						<Dr k="Booking ref" v={sel.bookingRef} />
						<Dr k="Status" v={<Pill status={sel.status} />} />
						<Dr k="Pickup" v={sel.pickup} />
						<Dr k="Destination" v={sel.dest} />
						<Dr k="Travel date" v={sel.date} />
						<Dr k="Depart" v={sel.depart} />
						<Dr k="Expected finish" v={sel.eta} />
						<Dr k="Passengers" v={sel.pax} />
					</div>
					{sel.notes && <p className="gw-small" style={{ marginTop: "0.8rem" }}>Notes: {sel.notes}</p>}
					<h4>Assign crew & vehicle</h4>
					<div style={{ display: "grid", gap: "0.6rem" }}>
						<label className="gw-form__label">Driver</label>
						<select className="gw-select" value={sel.driver ?? ""} onChange={(e) => tryAssign("driver", e.target.value)}>
							<option value="">— Unassigned —</option>
							{availDrivers.map((d) => <option key={d.id} value={d.name}>{d.name} ({d.status})</option>)}
						</select>
						<label className="gw-form__label">Vehicle</label>
						<select className="gw-select" value={sel.vehicle ?? ""} onChange={(e) => tryAssign("vehicle", e.target.value)}>
							<option value="">— Unassigned —</option>
							{vehicles.filter((v) => v.status !== "Maintenance" && v.status !== "Unavailable").map((v) => <option key={v.id} value={v.reg}>{v.make} {v.model} — {v.reg} ({v.seats} seats)</option>)}
						</select>
						<label className="gw-form__label">Tour guide (optional)</label>
						<select className="gw-select" value={sel.guide ?? ""} onChange={(e) => tryAssign("guide", e.target.value)}>
							<option value="">— None —</option>
							{guides.map((g) => <option key={g.id} value={g.name}>{g.name}</option>)}
						</select>
					</div>
					<h4>Status</h4>
					<div className="gw-buttons">
						{(["Pending", "Upcoming", "Active", "Completed", "Cancelled"] as const).map((s) => (
							<button
								key={s}
								className={`gw-filter__btn${sel.status === s ? " is-active" : ""}`}
								onClick={() => confirm({
									title: "Update assignment?", body: `Mark ${sel.id} as ${s.toLowerCase()}? (demo)`, okLabel: "Update",
									action: () => { setAssignStatus(sel.id, s); setSel({ ...sel, status: s }); toast("Status updated (demo)"); },
								})}
							>{s}</button>
						))}
					</div>
				</Drawer>
			)}

			{creating && (
				<Drawer title="Create assignment" onClose={() => setCreating(false)}>
					<form className="gw-form" onSubmit={(e) => { e.preventDefault(); toast("Assignment created — see Unassigned (demo)"); setCreating(false); }}>
						<div className="gw-form__field"><label className="gw-form__label">Trip / tour name</label><input required placeholder="e.g. Panorama Route day trip" /></div>
						<div className="gw-form__field"><label className="gw-form__label">Booking ref</label><input placeholder="GW-XXXXXX or —" /></div>
						<div className="gw-form__grid">
							<div className="gw-form__field"><label className="gw-form__label">Pickup</label><input required /></div>
							<div className="gw-form__field"><label className="gw-form__label">Destination</label><input required /></div>
							<div className="gw-form__field"><label className="gw-form__label">Date</label><input type="date" required /></div>
							<div className="gw-form__field"><label className="gw-form__label">Depart</label><input type="time" required /></div>
							<div className="gw-form__field"><label className="gw-form__label">Passengers</label><input type="number" min={1} required /></div>
						</div>
						<div className="gw-form__field"><label className="gw-form__label">Special instructions</label><textarea rows={2} /></div>
						<button className="gw-form__submit" type="submit">Create assignment</button>
						<p className="gw-form__hint">Demo — new assignments land in the Unassigned queue.</p>
					</form>
				</Drawer>
			)}
		</>
	);
}

/* ============================ ATTENDANCE ============================ */

function Attendance() {
	const { employees, drivers } = useStaff();
	const [sub, setSub] = useState("All");
	const all = [
		...S_SCHEDULE.map(() => null),
	];
	void all;
	const rows = [
		...S_ATTENDANCE,
	].filter((a) => sub === "All" || a.status === sub);
	void employees; void drivers;

	const counts = {
		All: S_ATTENDANCE.length,
		Present: S_ATTENDANCE.filter((a) => a.status === "Present").length,
		Late: S_ATTENDANCE.filter((a) => a.status === "Late").length,
		Absent: S_ATTENDANCE.filter((a) => a.status === "Absent").length,
		Leave: S_ATTENDANCE.filter((a) => a.status === "Leave").length,
	};

	return (
		<>
			<p className="gw-denote">Today's attendance — demonstration records.</p>
			<SubTabs tabs={["All", "Present", "Late", "Absent", "Leave"]} active={sub} onChange={setSub} counts={counts} />
			<Table
				cols={[
					{ key: "s", label: "Staff member", render: (a: typeof S_ATTENDANCE[0]) => <strong>{a.staff}</strong>, sortKey: (a) => a.staff },
					{ key: "sh", label: "Scheduled shift", render: (a) => a.shift },
					{ key: "in", label: "Check-in", render: (a) => a.in ?? "—" },
					{ key: "out", label: "Check-out", render: (a) => a.out ?? "—" },
					{ key: "st", label: "Status", render: (a) => <Pill status={a.status === "Present" ? "Live" : a.status === "Late" ? "Pending" : a.status === "Leave" ? "On leave" : "Rejected"} /> },
				]}
				rows={rows}
				empty="No records in this group."
			/>
		</>
	);
}
