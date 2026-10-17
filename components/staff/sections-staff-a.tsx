"use client";

import { useState } from "react";
import { Dr, Drawer, Panel, Pill, SearchInput, SubTabs, Table } from "@/components/admin/ui";
import { useStaff, type StaffSection } from "@/components/staff/ctx";
import { toast } from "@/components/Toaster";
import { S_DEPARTMENTS, S_DOCS, S_LEAVE, type Driver, type Guide, type Registration, type StaffMember } from "@/lib/staff-data";
import { RoleOptions } from "@/lib/staff-roles";
import { supabase } from "@/lib/supabase";

export default function StaffSectionsA({ section }: { section: StaffSection }) {
	switch (section) {
		case "staff-overview": return <Overview />;
		case "staff-registrations": return <Registrations />;
		case "staff-employees": return <Employees />;
		case "staff-drivers": return <Drivers />;
		case "staff-guides": return <Guides />;
		default: return null;
	}
}

/* ============================ OVERVIEW ============================ */

function Overview() {
	const { employees, drivers, guides, registrations, go, assignments } = useStaff();
	const allStaff = [
		...employees.map((e) => ({ name: e.name, role: "Staff", status: e.status })),
		...drivers.map((d) => ({ name: d.name, role: "Driver", status: d.employStatus })),
		...guides.map((g) => ({ name: g.name, role: "Guide", status: g.employStatus })),
	];
	const stats = [
		{ label: "Total staff", value: allStaff.length },
		{ label: "Active", value: allStaff.filter((s) => s.status === "Active").length },
		{ label: "Pending registrations", value: registrations.filter((r) => r.status === "New" || r.status === "Pending").length },
		{ label: "Drivers", value: drivers.length },
		{ label: "Tour guides", value: guides.length },
		{ label: "Admin staff", value: employees.length },
		{ label: "On leave", value: allStaff.filter((s) => s.status === "On leave").length },
		{ label: "Suspended", value: allStaff.filter((s) => s.status === "Suspended").length },
	];
	const pendingRegs = registrations.filter((r) => r.status === "New" || r.status === "Pending");
	const expiring = S_DOCS
		.filter((d) => d.status === "Expiring" || d.status === "Expired")
		.map((d) => ({ who: d.staff, what: `${d.type}${d.expires ? ` — ${d.status.toLowerCase()} ${d.expires}` : ` — ${d.status.toLowerCase()}`}` }));
	const upcoming = assignments.filter((a) => a.status === "Upcoming" || a.status === "Active").slice(0, 4);

	return (
		<>
			<div className="gw-statgrid gw-statgrid--8">
				{stats.map((s) => <div className="gw-stat" key={s.label}><p>{s.label}</p><strong>{s.value}</strong></div>)}
			</div>
			<div className="gw-buttons" style={{ marginBottom: "1.5rem" }}>
				<button className="gw-btn gw-btn--gold gw-btn--small" onClick={() => go("staff-registrations")}>Review registrations</button>
				<button className="gw-btn gw-btn--outline gw-btn--outline-dark gw-btn--small" onClick={() => go("staff-assignments")}>Assign a trip</button>
				<button className="gw-btn gw-btn--outline gw-btn--outline-dark gw-btn--small" onClick={() => go("staff-scheduling")}>Open schedule</button>
				<button className="gw-btn gw-btn--outline gw-btn--outline-dark gw-btn--small" onClick={() => go("staff-documents")}>Document alerts</button>
			</div>
			<div className="gw-grid-2">
				<Panel title="Staff awaiting approval" actions={<button className="gw-btn gw-btn--outline gw-btn--outline-dark gw-btn--small" onClick={() => go("staff-registrations")}>Open</button>}>
					{pendingRegs.length === 0 ? <p className="gw-small">Nothing pending.</p> : (
						<ul className="gw-activity">
							{pendingRegs.map((r) => (
								<li key={r.id}><span className="gw-activity__icn">✚</span><div>{r.name} — {r.position}<br /><small>{r.ref} · {r.submitted}</small></div></li>
							))}
						</ul>
					)}
				</Panel>
				<Panel title="Upcoming assignments">
					<ul className="gw-activity">
						{upcoming.map((a) => (
							<li key={a.id}><span className="gw-activity__icn">⇄</span><div>{a.trip}<br /><small>{a.date} {a.depart} · {a.driver ?? "No driver yet"}</small></div></li>
						))}
					</ul>
				</Panel>
				<Panel title="Expiring documents">
					{expiring.length === 0 ? <p className="gw-small">No expiring documents.</p> : (
						<ul className="gw-activity">
							{expiring.map((e, i) => (
								<li key={i}><span className="gw-activity__icn">!</span><div>{e.who}<br /><small>{e.what}</small></div></li>
							))}
						</ul>
					)}
				</Panel>
				<Panel title="Recent registrations">
					<ul className="gw-activity">
						{registrations.slice(0, 4).map((r) => (
							<li key={r.id}><span className="gw-activity__icn">✦</span><div>{r.name} — {r.position}<br /><small>{r.submitted} · <Pill status={r.status} /></small></div></li>
						))}
					</ul>
				</Panel>
			</div>
		</>
	);
}

/* ============================ REGISTRATIONS ============================ */

function Registrations() {
	const { registrations, setRegStatus, confirm } = useStaff();
	const [sub, setSub] = useState("All");
	const [sel, setSel] = useState<Registration | null>(null);
	const [formOpen, setFormOpen] = useState(false);

	const tabs = ["All", "New", "Pending", "Approved", "Rejected", "Incomplete", "Suspended"];
	const counts = Object.fromEntries(tabs.map((t) => [t, t === "All" ? registrations.length : registrations.filter((r) => r.status === t).length]));
	const rows = registrations.filter((r) => sub === "All" || r.status === sub);

	const act = (r: Registration, s: Registration["status"], verb: string) =>
		confirm({
			title: `${verb} ${r.name}?`,
			body: `${r.ref} — ${r.position} application will be marked ${s.toLowerCase()}. (demo)`,
			okLabel: verb,
			action: () => { setRegStatus(r.id, s); toast(`${r.name} ${s.toLowerCase()} (demo)`); setSel(null); },
		});

	return (
		<>
			<div className="gw-toolbar">
				<SubTabs tabs={tabs} active={sub} onChange={setSub} counts={counts} />
				<button className="gw-btn gw-btn--gold gw-btn--small" onClick={() => setFormOpen(true)}>+ New registration</button>
			</div>
			<Table
				cols={[
					{ key: "ref", label: "Ref", render: (r: Registration) => <strong>{r.ref}</strong> },
					{ key: "name", label: "Applicant", render: (r) => r.name, sortKey: (r) => r.name },
					{ key: "pos", label: "Position", render: (r) => r.position },
					{ key: "dept", label: "Department", render: (r) => r.dept },
					{ key: "sub", label: "Submitted", render: (r) => r.submitted, sortKey: (r) => r.submitted },
					{ key: "status", label: "Status", render: (r) => <Pill status={r.status} /> },
					{ key: "act", label: "", render: (r) => <button className="gw-btn gw-btn--outline gw-btn--outline-dark gw-btn--small" onClick={(e) => { e.stopPropagation(); setSel(r); }}>Review</button> },
				]}
				rows={rows}
				empty="No registrations in this group."
				onRow={setSel}
			/>
			{sel && (
				<Drawer title={`${sel.ref} — ${sel.name}`} onClose={() => setSel(null)} wide>
					<div className="gw-grid-2" style={{ gap: "1rem" }}>
						<Dr k="Applicant" v={sel.name} />
						<Dr k="Position" v={sel.position} />
						<Dr k="Department" v={sel.dept} />
						<Dr k="Email" v={sel.email} />
						<Dr k="Phone" v={sel.phone} />
						<Dr k="Submitted" v={sel.submitted} />
						<Dr k="Status" v={<Pill status={sel.status} />} />
					</div>
					<h4>Documents (demo checklist)</h4>
					<p className="gw-small">ID document ✓ · CV ✓ · Certificates — 1 missing (demo)</p>
					<div className="gw-buttons" style={{ marginTop: "1rem" }}>
						<button className="gw-btn gw-btn--gold" onClick={() => act(sel, "Approved", "Approve")}>Approve</button>
						<button className="gw-btn gw-btn--outline gw-btn--outline-dark" onClick={() => act(sel, "Rejected", "Reject")}>Reject</button>
						<button className="gw-btn gw-btn--outline gw-btn--outline-dark" onClick={() => { toast("Info requested (demo)"); setSel(null); }}>Request info</button>
					</div>
				</Drawer>
			)}
			{formOpen && <RegForm onClose={() => setFormOpen(false)} />}
		</>
	);
}

function RegForm({ onClose }: { onClose: () => void }) {
	const [preview, setPreview] = useState<string | null>(null);
	const [sent, setSent] = useState(false);
	const [errors, setErrors] = useState<string[]>([]);

	const submit = (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		const fd = new FormData(e.currentTarget);
		const errs: string[] = [];
		if (!String(fd.get("name") ?? "").trim()) errs.push("Full name is required");
		if (!String(fd.get("phone") ?? "").trim()) errs.push("Phone number is required");
		if (!String(fd.get("email") ?? "").includes("@")) errs.push("Valid email is required");
		if (errs.length) { setErrors(errs); return; }
		setErrors([]);
		setSent(true);
	};

	return (
		<Drawer title="Staff registration" onClose={onClose} wide>
			{sent ? (
				<div className="gw-confirm" style={{ textAlign: "center" }}>
					<h3>Application submitted (demo)</h3>
					<p>Reference <strong>REG-2026-010</strong> — it now appears under New applications.</p>
					<button className="gw-btn gw-btn--gold" onClick={onClose}>Done</button>
				</div>
			) : (
				<form className="gw-form" onSubmit={submit} noValidate>
					{errors.length > 0 && (
						<div className="gw-form__errors" role="alert">
							<strong>Please fix:</strong><ul>{errors.map((e) => <li key={e}>{e}</li>)}</ul>
						</div>
					)}
					<h4>Personal information</h4>
					<div className="gw-form__grid">
						<div className="gw-form__field"><label className="gw-form__label">Full name *</label><input name="name" /></div>
						<div className="gw-form__field"><label className="gw-form__label">Date of birth</label><input name="dob" type="date" /></div>
						<div className="gw-form__field"><label className="gw-form__label">Gender (optional)</label><select name="gender"><option value="">—</option><option>Female</option><option>Male</option><option>Other</option></select></div>
						<div className="gw-form__field"><label className="gw-form__label">Nationality</label><input name="nat" defaultValue="South African" /></div>
						<div className="gw-form__field"><label className="gw-form__label">ID document type</label><select name="idtype"><option>SA ID</option><option>Passport</option></select></div>
						<div className="gw-form__field"><label className="gw-form__label">Profile photo</label>
							<input type="file" accept="image/*" onChange={(e) => {
								const f = e.currentTarget.files?.[0];
								setPreview(f ? URL.createObjectURL(f) : null);
							}} />
							{/* eslint-disable-next-line @next/next/no-img-element */}
							{preview && <img src={preview} alt="Preview" style={{ width: 64, height: 64, borderRadius: "50%", objectFit: "cover", marginTop: 6 }} />}
						</div>
					</div>
					<h4>Contact information</h4>
					<div className="gw-form__grid">
						<div className="gw-form__field"><label className="gw-form__label">Phone *</label><input name="phone" type="tel" /></div>
						<div className="gw-form__field"><label className="gw-form__label">Email *</label><input name="email" type="email" /></div>
						<div className="gw-form__field"><label className="gw-form__label">Residential address</label><input name="addr" /></div>
						<div className="gw-form__field"><label className="gw-form__label">Emergency contact name</label><input name="ec_name" /></div>
						<div className="gw-form__field"><label className="gw-form__label">Emergency contact number</label><input name="ec_phone" type="tel" /></div>
					</div>
					<h4>Employment information</h4>
					<div className="gw-form__grid">
						<div className="gw-form__field"><label className="gw-form__label">Position applied for</label>
							<select name="pos"><RoleOptions /><option>Other</option></select>
						</div>
						<div className="gw-form__field"><label className="gw-form__label">Department</label>
							<select name="dept">{S_DEPARTMENTS.map((d) => <option key={d.name}>{d.name}</option>)}</select>
						</div>
						<div className="gw-form__field"><label className="gw-form__label">Preferred location</label><input name="loc" placeholder="e.g. Tzaneen" /></div>
						<div className="gw-form__field"><label className="gw-form__label">Employment type</label>
							<select name="etype"><option>Full-time</option><option>Part-time</option><option>Contract</option></select>
						</div>
					</div>
					<div className="gw-form__field"><label className="gw-form__label">Relevant experience</label><textarea name="exp" rows={2} /></div>
					<h4>Documents</h4>
					<p className="gw-small" style={{ marginTop: 0 }}>Files stay on this device — demo only, nothing uploaded.</p>
					<div className="gw-form__grid">
						<div className="gw-form__field"><label className="gw-form__label">Identity document</label><input type="file" /></div>
						<div className="gw-form__field"><label className="gw-form__label">CV / résumé</label><input type="file" /></div>
						<div className="gw-form__field"><label className="gw-form__label">Certificates</label><input type="file" /></div>
					</div>
					<button className="gw-form__submit" type="submit">Submit application</button>
					<p className="gw-form__hint">Demo form — nothing is stored or sent.</p>
				</form>
			)}
		</Drawer>
	);
}

/* ============================ EMPLOYEES ============================ */

function Employees() {
	const { employees, setEmployeeStatus, confirm } = useStaff();
	const [sub, setSub] = useState("All");
	const [q, setQ] = useState("");
	const [sel, setSel] = useState<StaffMember | null>(null);

	const match = (s: string) => s.toLowerCase().includes(q.toLowerCase());
	const tabs = ["All", "Active", "New", "Full-time", "Part-time", "Contract", "Probation", "On leave", "Suspended", "Former"];
	const filterFn = (e: StaffMember) => {
		switch (sub) {
			case "All": return true;
			case "Active": return e.status === "Active";
			case "New": return e.startDate >= "2026-01-01";
			case "Full-time": case "Part-time": case "Contract": return e.employment === sub;
			case "Probation": return e.status === "Probation";
			case "On leave": return e.status === "On leave";
			case "Suspended": return e.status === "Suspended";
			case "Former": return e.status === "Former";
			default: return true;
		}
	};
	const rows = employees.filter((e) => filterFn(e) && (match(e.name) || match(e.title) || match(e.dept)));

	return (
		<>
			<SubTabs tabs={tabs} active={sub} onChange={setSub} />
			<div className="gw-toolbar"><SearchInput value={q} onChange={setQ} placeholder="Search employees…" /></div>
			<Table
				cols={[
					{ key: "code", label: "ID", render: (e: StaffMember) => <strong>{e.code}</strong> },
					{ key: "name", label: "Name", render: (e) => <span style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem" }}><span className="gw-admin__avatar" style={{ width: "1.7rem", height: "1.7rem", fontSize: "0.7rem" }}>{e.initials}</span>{e.name}</span>, sortKey: (e) => e.name },
					{ key: "title", label: "Job title", render: (e) => e.title, sortKey: (e) => e.title },
					{ key: "dept", label: "Dept", render: (e) => e.dept },
					{ key: "emp", label: "Type", render: (e) => e.employment },
					{ key: "loc", label: "Location", render: (e) => e.location },
					{ key: "status", label: "Status", render: (e) => <Pill status={e.status} /> },
				]}
				rows={rows}
				empty="No employees match."
				onRow={setSel}
			/>
			{sel && (
				<Drawer title={`${sel.code} — ${sel.name}`} onClose={() => setSel(null)} wide>
					<div className="gw-grid-2" style={{ gap: "1rem" }}>
						<Dr k="Job title" v={sel.title} />
						<Dr k="Department" v={sel.dept} />
						<Dr k="Manager" v={sel.manager} />
						<Dr k="Phone" v={sel.phone} />
						<Dr k="Email" v={sel.email} />
						<Dr k="Location" v={sel.location} />
						<Dr k="Started" v={sel.startDate} />
						<Dr k="Type" v={sel.employment} />
						<Dr k="Status" v={<Pill status={sel.status} />} />
						<Dr k="Emergency" v={sel.emergency} />
					</div>
					<h4>Qualifications & experience</h4>
					<p className="gw-small">{sel.experience}</p>
					<h4>Documents</h4>
					<p className="gw-small">ID ✓ · Contract ✓ · Certificates — 1 pending (demo checklist)</p>
					<h4>Update status</h4>
					<div className="gw-buttons">
						{(["Active", "Probation", "On leave", "Suspended", "Former"] as const).map((s) => (
							<button
								key={s}
								className={`gw-filter__btn${sel.status === s ? " is-active" : ""}`}
								onClick={() => confirm({
									title: "Update employment status?",
									body: `Set ${sel.name} to ${s}? (demo)`,
									okLabel: "Update",
									action: () => { setEmployeeStatus(sel.id, s); setSel({ ...sel, status: s }); toast("Status updated (demo)"); },
								})}
							>{s}</button>
						))}
					</div>
					<div className="gw-buttons" style={{ marginTop: "1rem" }}>
						<button className="gw-btn gw-btn--outline gw-btn--outline-dark gw-btn--small" onClick={() => toast("Assignments view — demo")}>View assignments</button>
						<button className="gw-btn gw-btn--outline gw-btn--outline-dark gw-btn--small" onClick={() => toast("Activity history — demo")}>Activity history</button>
					</div>
				</Drawer>
			)}
		</>
	);
}

/* ============================ DRIVERS ============================ */

interface DriverReg {
	id: number; status: string; full_name: string; surname: string; email: string; mobile: string;
	town: string; province: string; licence_number: string; vehicle_make: string; vehicle_model: string;
	vehicle_reg: string; vehicle_type: string; passenger_capacity: number | null; services: string[];
	created_at: string;
	[key: string]: unknown;
}

function DriverRegQueue() {
	const { confirm } = useStaff();
	const [rows, setRows] = useState<DriverReg[]>([]);
	const [sel, setSel] = useState<DriverReg | null>(null);
	const [loading, setLoading] = useState(true);

	const load = async () => {
		const c = supabase();
		if (!c) { setLoading(false); return; }
		const { data } = await c.from("driver_registrations").select("*").order("created_at", { ascending: false });
		setRows((data ?? []) as DriverReg[]);
		setLoading(false);
	};
	useState(() => { void load(); });

	const setStatus = async (r: DriverReg, st: string) => {
		const c = supabase();
		if (!c) { toast("Not connected to the database"); return; }
		const { error } = await c.from("driver_registrations").update({ status: st }).eq("id", r.id);
		if (error) { toast(`Update failed: ${error.message}`); return; }
		setRows((rs) => rs.map((x) => (x.id === r.id ? { ...x, status: st } : x)));
		setSel((s) => (s?.id === r.id ? { ...s, status: st } : s));
		toast(`${r.full_name} ${r.surname} → ${st}`);
	};

	const Doc = ({ label, url }: { label: string; url?: string | null }) =>
		url ? <Dr k={label} v={<a href={url} target="_blank" rel="noreferrer">View ↗</a>} /> : <Dr k={label} v="—" />;
	const Txt = ({ label, k }: { label: string; k: keyof DriverReg }) =>
		<Dr k={label} v={sel ? String(sel[k] ?? "—") : "—"} />;

	return (
		<>
			{loading ? <p className="gw-small">Loading registrations…</p> : (
				<Table
					cols={[
						{ key: "n", label: "Applicant", render: (r: DriverReg) => <strong>{r.full_name} {r.surname}</strong>, sortKey: (r) => r.surname },
						{ key: "v", label: "Vehicle", render: (r) => `${r.vehicle_make ?? ""} ${r.vehicle_model ?? ""} · ${r.vehicle_reg ?? ""}` },
						{ key: "t", label: "Town", render: (r) => r.town ?? "—" },
						{ key: "svc", label: "Services", render: (r) => (r.services ?? []).slice(0, 2).join(", ") + ((r.services ?? []).length > 2 ? "…" : "") },
						{ key: "st", label: "Status", render: (r) => <Pill status={r.status} /> },
						{ key: "a", label: "", render: (r) => <button className="gw-btn gw-btn--outline gw-btn--outline-dark gw-btn--small" onClick={() => setSel(r)}>Review</button> },
					]}
					rows={rows}
					empty="No driver registrations yet."
				/>
			)}
			{sel && (
			<Drawer title={`${sel.full_name} ${sel.surname} — driver registration`} onClose={() => setSel(null)} wide>
				{sel.status === "Pending" && (
					<div className="gw-buttons" style={{ marginBottom: "1rem" }}>
						<button className="gw-btn gw-btn--gold gw-btn--small" onClick={() => void setStatus(sel, "Approved")}>Approve</button>
						<button className="gw-btn gw-btn--outline gw-btn--outline-dark gw-btn--small" onClick={() => void setStatus(sel, "Rejected")}>Reject</button>
					</div>
				)}
				{(
					<>
						<h4>Personal</h4>
						<div className="gw-dlist">
							<Dr k="Contact" v={`${sel.mobile ?? ""} · ${sel.email ?? ""}`} />
							<Txt label="WhatsApp" k="whatsapp" />
							<Dr k="Address" v={`${sel.address ?? ""}, ${sel.town ?? ""}, ${sel.province ?? ""}`} />
							<Txt label="SA ID" k="sa_id" /><Txt label="DOB" k="dob" />
							<Doc label="ID document" url={sel.id_doc_url as string} />
							<Doc label="Selfie" url={sel.selfie_url as string} />
						</div>
						<h4>Licence</h4>
						<div className="gw-dlist">
							<Dr k="Licence" v={`${sel.licence_number ?? ""} · ${sel.licence_code ?? ""} · exp ${sel.licence_expiry ?? "—"}`} />
							<Dr k="PrDP" v={sel.prdp_number ? `${sel.prdp_number} · exp ${sel.prdp_expiry ?? "—"}` : "—"} />
							<Doc label="Licence doc" url={sel.licence_doc_url as string} />
							<Doc label="PrDP doc" url={sel.prdp_doc_url as string} />
						</div>
						<h4>Vehicle</h4>
						<div className="gw-dlist">
							<Dr k="Vehicle" v={`${sel.vehicle_year ?? ""} ${sel.vehicle_make ?? ""} ${sel.vehicle_model ?? ""} (${sel.vehicle_colour ?? ""})`} />
							<Dr k="Registration" v={String(sel.vehicle_reg ?? "—")} />
							<Dr k="Type" v={`${sel.vehicle_type ?? ""} · ${sel.passenger_capacity ?? "?"} pax`} />
							<Doc label="Reg certificate" url={sel.reg_cert_url as string} />
							<Doc label="Ownership" url={sel.ownership_url as string} />
							<Doc label="Roadworthy" url={sel.roadworthy_url as string} />
							<Doc label="Licence disc" url={sel.licence_disc_url as string} />
							<Doc label="Insurance" url={sel.insurance_url as string} />
							<Doc label="Operating licence" url={sel.operating_licence_url as string} />
						</div>
						<h4>Services & banking</h4>
						<div className="gw-dlist">
							<Dr k="Services" v={(sel.services ?? []).join(", ") || "—"} />
							<Dr k="Area" v={`${sel.operating_province ?? ""} — ${sel.towns_served ?? ""}`} />
							<Txt label="Pickups" k="pickup_locations" />
							<Dr k="Pricing" v={String(sel.pricing ?? "—")} />
							<Dr k="Days" v={((sel.available_days as string[] | undefined) ?? []).join(", ") || "—"} />
							<Txt label="Hours" k="working_hours" />
							<Dr k="Bank" v={sel.bank_name ? `${sel.bank_name} · ${sel.account_type ?? ""} · ${sel.account_holder ?? ""}` : "—"} />
							<Doc label="Bank proof" url={sel.bank_proof_url as string} />
						</div>
					</>
				)}
			</Drawer>
			)}
		</>
	);
}

function Drivers() {
	const { drivers, setDriverStatus, setDriverEmployStatus, confirm } = useStaff();
	const [sub, setSub] = useState("All");
	const [q, setQ] = useState("");
	const [sel, setSel] = useState<Driver | null>(null);
	const [view, setView] = useState<"drivers" | "queue">("drivers");

	const match = (s: string) => s.toLowerCase().includes(q.toLowerCase());
	const tabs = ["All", "Available", "On trip", "On leave", "Unavailable", "Suspended"];

	if (view === "queue") {
		return (
			<>
				<div className="gw-toolbar">
					<button className="gw-btn gw-btn--outline gw-btn--outline-dark gw-btn--small" onClick={() => setView("drivers")}>← Drivers</button>
					<a className="gw-btn gw-btn--outline gw-btn--outline-dark gw-btn--small" href="/driver-registration" target="_blank" rel="noreferrer">Open registration form ↗</a>
				</div>
				<DriverRegQueue />
			</>
		);
	}
	const rows = drivers.filter((d) =>
		(sub === "All" || d.status === sub) && (match(d.name) || match(d.area)),
	);

	return (
		<>
			<SubTabs tabs={tabs} active={sub} onChange={setSub} counts={Object.fromEntries(tabs.map((t) => [t, t === "All" ? drivers.length : drivers.filter((d) => d.status === t).length]))} />
			<div className="gw-toolbar"><SearchInput value={q} onChange={setQ} placeholder="Search drivers…" />
				<button className="gw-btn gw-btn--gold gw-btn--small" onClick={() => setView("queue")}>Registration queue</button>
				<a className="gw-btn gw-btn--outline gw-btn--outline-dark gw-btn--small" href="/driver-registration" target="_blank" rel="noreferrer">Share link ↗</a>
			</div>
			<Table
				cols={[
					{ key: "code", label: "ID", render: (d: Driver) => <strong>{d.code}</strong> },
					{ key: "name", label: "Driver", render: (d) => d.name, sortKey: (d) => d.name },
					{ key: "area", label: "Area", render: (d) => d.area },
					{ key: "lic", label: "Licence", render: (d) => d.licenceCat },
					{ key: "exp", label: "Experience", render: (d) => `${d.years} yrs`, sortKey: (d) => d.years },
					{ key: "veh", label: "Vehicle", render: (d) => d.vehicle ?? "—" },
					{ key: "avail", label: "Availability", render: (d) => <Pill status={d.status} /> },
					{ key: "emp", label: "Employment", render: (d) => <Pill status={d.employStatus} /> },
				]}
				rows={rows}
				empty="No drivers match."
				onRow={setSel}
			/>
			{sel && (
				<Drawer title={`${sel.code} — ${sel.name}`} onClose={() => setSel(null)} wide>
					<div className="gw-grid-2" style={{ gap: "1rem" }}>
						<Dr k="Phone" v={sel.phone} />
						<Dr k="Email" v={sel.email} />
						<Dr k="Area" v={sel.area} />
						<Dr k="Licence" v={`${sel.licenceCat} — exp ${sel.licenceExpiry}`} />
						<Dr k="PrDP" v={sel.prdp ? `${sel.prdp} — exp ${sel.prdpExpiry}` : "None on file"} />
						<Dr k="Experience" v={`${sel.years} years`} />
						<Dr k="Languages" v={sel.languages.join(", ")} />
						<Dr k="Vehicle" v={sel.vehicle ?? "Unassigned"} />
						<Dr k="Availability" v={<Pill status={sel.status} />} />
						<Dr k="Employment" v={<Pill status={sel.employStatus} />} />
						<Dr k="Trips" v={`${sel.trips} completed`} />
						<Dr k="Incidents" v={sel.incidents} />
					</div>
					<h4>Documents</h4>
					<ul className="gw-activity">
						{sel.docs.map((d) => (
							<li key={d.label}><span className="gw-activity__icn">◫</span><div>{d.label}<br /><small><Pill status={d.status} /></small></div></li>
						))}
					</ul>
					<h4>Manage availability</h4>
					<div className="gw-buttons">
						{(["Available", "On trip", "On leave", "Unavailable", "Suspended"] as const).map((s) => (
							<button
								key={s}
								className={`gw-filter__btn${sel.status === s ? " is-active" : ""}`}
								onClick={() => { setDriverStatus(sel.id, s); setSel({ ...sel, status: s }); toast("Availability updated (demo)"); }}
							>{s}</button>
						))}
					</div>
					<h4>Employment status</h4>
					<div className="gw-buttons">
						{(["Active", "Suspended"] as const).map((s) => (
							<button
								key={s}
								className={`gw-filter__btn${sel.employStatus === s ? " is-active" : ""}`}
								onClick={() => confirm({
									title: "Update employment status?", body: `Set ${sel.name} to ${s}? (demo)`, okLabel: "Update",
									action: () => { setDriverEmployStatus(sel.id, s); setSel({ ...sel, employStatus: s }); toast("Updated (demo)"); },
								})}
							>{s}</button>
						))}
					</div>
				</Drawer>
			)}
		</>
	);
}

/* ============================ GUIDES ============================ */

function Guides() {
	const { guides, setGuideStatus } = useStaff();
	const [sub, setSub] = useState("All");
	const [sel, setSel] = useState<Guide | null>(null);

	const tabs = ["All", "Available", "On tour", "On leave", "Suspended"];
	const rows = guides.filter((g) => sub === "All" || g.status === sub);

	return (
		<>
			<SubTabs tabs={tabs} active={sub} onChange={setSub} counts={Object.fromEntries(tabs.map((t) => [t, t === "All" ? guides.length : guides.filter((g) => g.status === t).length]))} />
			<Table
				cols={[
					{ key: "code", label: "ID", render: (g: Guide) => <strong>{g.code}</strong> },
					{ key: "name", label: "Guide", render: (g) => g.name, sortKey: (g) => g.name },
					{ key: "lang", label: "Languages", render: (g) => g.languages.join(", ") },
					{ key: "exp", label: "Expertise", render: (g) => g.expertise },
					{ key: "dest", label: "Destinations", render: (g) => g.destinations.join(", ") },
					{ key: "tours", label: "Tours", render: (g) => g.tours, sortKey: (g) => g.tours },
					{ key: "rate", label: "Rating", render: (g) => `${g.rating}/5`, sortKey: (g) => g.rating },
					{ key: "status", label: "Status", render: (g) => <Pill status={g.status} /> },
				]}
				rows={rows}
				empty="No guides match."
				onRow={setSel}
			/>
			{sel && (
				<Drawer title={`${sel.code} — ${sel.name}`} onClose={() => setSel(null)} wide>
					<div className="gw-grid-2" style={{ gap: "1rem" }}>
						<Dr k="Phone" v={sel.phone} />
						<Dr k="Email" v={sel.email} />
						<Dr k="Languages" v={sel.languages.join(", ")} />
						<Dr k="Expertise" v={sel.expertise} />
						<Dr k="Qualifications" v={sel.quals} />
						<Dr k="Experience" v={`${sel.years} years · ${sel.tours} tours`} />
						<Dr k="Rating" v={`${sel.rating}/5`} />
						<Dr k="Destinations" v={sel.destinations.join(", ")} />
						<Dr k="Status" v={<Pill status={sel.status} />} />
					</div>
					<h4>Manage availability</h4>
					<div className="gw-buttons">
						{(["Available", "On tour", "On leave", "Suspended"] as const).map((s) => (
							<button
								key={s}
								className={`gw-filter__btn${sel.status === s ? " is-active" : ""}`}
								onClick={() => { setGuideStatus(sel.id, s); setSel({ ...sel, status: s }); toast("Availability updated (demo)"); }}
							>{s}</button>
						))}
					</div>
				</Drawer>
			)}
		</>
	);
}
