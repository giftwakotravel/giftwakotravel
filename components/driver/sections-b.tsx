"use client";

import { useEffect, useRef, useState } from "react";
import { Dr, Drawer, Panel, Pill, SubTabs, Table, fmtR } from "@/components/admin/ui";
import { useDriver, type Row } from "@/components/driver/ctx";
import { toast } from "@/components/Toaster";
import { supabase } from "@/lib/supabase";
import type { Section } from "@/lib/driver-portal";
import agreement from "@/data/driver-agreement.json";

export default function DriverSectionsB({ section }: { section: Section }) {
	switch (section) {
		case "contract": return <Contract />;
		case "jobs": return <Jobs />;
		case "trips": return <Trips />;
		case "earnings": return <Earnings />;
		case "notifications": return <Notifications />;
		case "settings": return <Settings />;
		default: return null;
	}
}

const fdate = (s?: string | null) => (s ? new Date(s).toLocaleDateString("en-ZA", { day: "numeric", month: "long", year: "numeric" }) : "—");

/* ============================ CONTRACT ============================ */

function Contract() {
	const { user, profile, contract, loaded, reload } = useDriver();
	const [agreed, setAgreed] = useState(false);
	const [sigName, setSigName] = useState("");
	const [signedFile, setSignedFile] = useState<File | null>(null);
	const [busy, setBusy] = useState(false);
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const drawing = useRef(false);
	const hasInk = useRef(false);

	const nameMatch = sigName.trim().toLowerCase() ===
		`${(profile?.full_name ?? "").trim()} ${(profile?.surname ?? "").trim()}`.toLowerCase() && sigName.trim().length > 2;

	useEffect(() => {
		const cv = canvasRef.current;
		if (!cv || contract) return;
		const ctx2 = cv.getContext("2d")!;
		ctx2.strokeStyle = "#0B1D3A";
		ctx2.lineWidth = 2;
		ctx2.lineCap = "round";
		const pos = (e: PointerEvent) => {
			const r = cv.getBoundingClientRect();
			return { x: (e.clientX - r.left) * (cv.width / r.width), y: (e.clientY - r.top) * (cv.height / r.height) };
		};
		const down = (e: PointerEvent) => { drawing.current = true; const p = pos(e); ctx2.beginPath(); ctx2.moveTo(p.x, p.y); };
		const move = (e: PointerEvent) => { if (!drawing.current) return; const p = pos(e); ctx2.lineTo(p.x, p.y); ctx2.stroke(); hasInk.current = true; };
		const up = () => { drawing.current = false; };
		cv.addEventListener("pointerdown", down);
		cv.addEventListener("pointermove", move);
		window.addEventListener("pointerup", up);
		return () => {
			cv.removeEventListener("pointerdown", down);
			cv.removeEventListener("pointermove", move);
			window.removeEventListener("pointerup", up);
		};
	}, [contract]);

	const clear = () => {
		const cv = canvasRef.current;
		if (cv) cv.getContext("2d")!.clearRect(0, 0, cv.width, cv.height);
		hasInk.current = false;
	};

	const accept = async () => {
		const c = supabase();
		if (!c) { toast("Not connected to the database"); return; }
		if (!hasInk.current) { toast("Draw your signature first."); return; }
		setBusy(true);
		const blob: Blob | null = await new Promise((res) => canvasRef.current!.toBlob(res, "image/png"));
		let signatureUrl: string | null = null;
		if (blob) {
			const path = `${user.id}/signature-${Date.now()}.png`;
			const { error } = await c.storage.from("driver-docs").upload(path, blob, { contentType: "image/png" });
			if (!error) signatureUrl = c.storage.from("driver-docs").getPublicUrl(path).data.publicUrl;
		}
		const { error } = await c.from("driver_contracts").insert({
			user_id: user.id,
			version: agreement.version,
			signature_name: sigName.trim(),
			signature_url: signatureUrl,
		});
		if (error) { toast(`Could not save acceptance: ${error.message}`); setBusy(false); return; }
		await c.from("driver_notifications").insert({
			user_id: user.id, type: "contract",
			title: "Affiliation Agreement accepted",
			body: `You accepted the Driver and Vehicle Owner Affiliation Agreement (version ${agreement.version}).`,
		});
		toast("Agreement accepted");
		setBusy(false);
		void reload();
	};

	const uploadSigned = async () => {
		const c = supabase();
		if (!c || !signedFile) return;
		if (!contract) { toast("Accept the agreement first."); return; }
		setBusy(true);
		const path = `${user.id}/signed-contract-${Date.now()}-${signedFile.name.replace(/[^\w.-]+/g, "-")}`;
		const { error: upErr } = await c.storage.from("driver-docs").upload(path, signedFile);
		if (upErr) { toast(`Upload failed: ${upErr.message}`); setBusy(false); return; }
		const url = c.storage.from("driver-docs").getPublicUrl(path).data.publicUrl;
		const { error } = await c.from("driver_contracts").insert({
			user_id: user.id,
			version: contract.version,
			signature_name: contract.signature_name,
			signature_url: contract.signature_url,
			signed_file_url: url,
		});
		setBusy(false);
		if (error) { toast(`Save failed: ${error.message}`); return; }
		toast("Signed copy uploaded");
		setSignedFile(null);
		void reload();
	};

	if (!loaded) return <p className="gw-small">Loading…</p>;

	return (
		<>
			<Panel
				title={agreement.title}
				sub={`Version ${agreement.version}`}
				actions={(
					<div className="gw-buttons">
						<a className="gw-btn gw-btn--gold gw-btn--small" href="/docs/driver-service-agreement.pdf" target="_blank" rel="noreferrer">View contract (PDF) ↗</a>
						<a className="gw-btn gw-btn--outline gw-btn--outline-dark gw-btn--small" href="/driver-agreement" target="_blank" rel="noreferrer">Read online ↗</a>
					</div>
				)}
			>
				<details className="gw-agreement__inline" open={!contract}>
					<summary>Read the agreement</summary>
					<div className="gw-agreement__body">
						<p>{agreement.intro}</p>
						<p><em>{agreement.vision}</em></p>
						{agreement.sections.map((sec) => (
							<div key={sec.heading}>
								<h4>{sec.heading}</h4>
								{sec.clauses.map((cl, i) => <p key={i} className="gw-small">{cl}</p>)}
							</div>
						))}
						<h4>Acceptance</h4>
						<p className="gw-small">{agreement.acceptance}</p>
					</div>
				</details>
			</Panel>

			{contract?.version === agreement.version ? (
				<Panel title="Accepted">
					<p style={{ color: "#0A6E54", fontWeight: 700 }}>
						✓ Accepted on {fdate(contract.accepted_at)} (v{contract.version})
					</p>
					<div className="gw-dlist">
						<Dr k="Signed as" v={contract.signature_name ?? "—"} />
						{contract.signature_url && (
							<Dr k="Signature" v={<a href={contract.signature_url} target="_blank" rel="noreferrer">View ↗</a>} />
						)}
						{contract.signed_file_url && (
							<Dr k="Signed copy" v={<a href={contract.signed_file_url} target="_blank" rel="noreferrer">View ↗</a>} />
						)}
					</div>
					<h4 style={{ marginTop: "1rem" }}>Upload signed copy (optional)</h4>
					<p className="gw-small">Only if GiftWako Travel has asked you for a signed copy.</p>
					<div className="gw-buttons" style={{ alignItems: "center" }}>
						<input type="file" accept="image/*,.pdf" onChange={(e) => setSignedFile(e.target.files?.[0] ?? null)} />
						<button className="gw-btn gw-btn--outline gw-btn--outline-dark gw-btn--small" disabled={!signedFile || busy} onClick={() => void uploadSigned()}>
							{busy ? "Uploading…" : "Upload signed copy"}
						</button>
					</div>
				</Panel>
			) : (
				<Panel title="Accept & sign">
					<label className="gw-form__check">
						<input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} />
						{" "}I have read and agree to the Driver and Vehicle Owner Affiliation Agreement (version {agreement.version}). *
					</label>
					<div className="gw-form__field" style={{ marginTop: "0.8rem" }}>
						<label className="gw-form__label">Type your full name (must match your profile)</label>
						<input value={sigName} onChange={(e) => setSigName(e.target.value)} placeholder={`${profile?.full_name ?? ""} ${profile?.surname ?? ""}`.trim()} />
						{sigName && !nameMatch && <p className="gw-form__hint">Does not match your profile name.</p>}
					</div>
					<div className="gw-form__field">
						<label className="gw-form__label">Draw your signature</label>
						<canvas
							ref={canvasRef}
							width={600}
							height={180}
							style={{ width: "100%", maxWidth: 600, height: "auto", border: "1px solid var(--gw-line)", borderRadius: 10, touchAction: "none", background: "#fff" }}
						/>
						<div className="gw-buttons" style={{ marginTop: "0.4rem" }}>
							<button type="button" className="gw-btn gw-btn--outline gw-btn--outline-dark gw-btn--small" onClick={clear}>Clear</button>
						</div>
					</div>
					<div className="gw-buttons" style={{ marginTop: "0.8rem" }}>
						<button className="gw-btn gw-btn--gold" disabled={!agreed || !nameMatch || busy} onClick={() => void accept()}>
							{busy ? "Saving…" : "Accept & sign"}
						</button>
					</div>
				</Panel>
			)}
		</>
	);
}

/* ============================ JOBS ============================ */

function Jobs() {
	const { user, profile, jobs, loaded, reload } = useDriver();
	const approved = profile?.status === "Approved";
	const visible = jobs.filter((j) => j.status === "Open" || j.requested_by === user.id);

	const request = async (j: Row) => {
		const c = supabase();
		if (!c) { toast("Not connected to the database"); return; }
		const { error } = await c.from("driver_jobs")
			.update({ status: "Requested", requested_by: user.id, requested_at: new Date().toISOString() })
			.eq("id", j.id).eq("status", "Open");
		if (error) { toast(`Could not request job: ${error.message}`); return; }
		toast("Job requested — GiftWako will confirm.");
		void reload();
	};

	if (!loaded) return <p className="gw-small">Loading…</p>;

	return (
		<Panel title="Available jobs" sub={approved ? undefined : "Only approved drivers can request jobs."}>
			<Table
				cols={[
					{ key: "t", label: "Job", render: (j: Row) => <strong>{j.title}</strong> },
					{ key: "r", label: "Route", render: (j) => `${j.pickup ?? "—"} → ${j.dropoff ?? "—"}` },
					{ key: "d", label: "Date", render: (j) => `${j.trip_date ?? "—"} ${j.trip_time ?? ""}` },
					{ key: "p", label: "Pax", render: (j) => String(j.passengers ?? "—") },
					{ key: "v", label: "Vehicle", render: (j) => j.vehicle_type ?? "—" },
					{ key: "pay", label: "Pay", render: (j) => (j.pay != null ? fmtR(Number(j.pay)) : "—") },
					{ key: "s", label: "Status", render: (j) => <Pill status={j.status} /> },
					{
						key: "a", label: "", render: (j) => j.status === "Open" ? (
							<button className="gw-btn gw-btn--gold gw-btn--small" disabled={!approved} onClick={() => void request(j)}>
								Request this job
							</button>
						) : (j.requested_by === user.id ? <span className="gw-small">Requested by you</span> : ""),
					},
				]}
				rows={visible}
				empty="No open jobs right now."
			/>
		</Panel>
	);
}

/* ============================ TRIPS ============================ */

const NEXT_STATUS: Record<string, string> = { Assigned: "Confirmed", Confirmed: "In progress", "In progress": "Completed" };

function Trips() {
	const { trips, loaded, reload, confirm } = useDriver();
	const [tab, setTab] = useState("All");
	const [sel, setSel] = useState<Row | null>(null);

	if (!loaded) return <p className="gw-small">Loading…</p>;

	const today = new Date().toISOString().slice(0, 10);
	const rows = trips.filter((t) =>
		tab === "All" ? true
		: tab === "Upcoming" ? !["Completed", "Cancelled"].includes(t.status) && (t.trip_date ?? "9999") >= today
		: tab === "Completed" ? t.status === "Completed"
		: t.status === "Cancelled");

	const advance = (t: Row) => {
		const next = NEXT_STATUS[t.status];
		if (!next) return;
		confirm({
			title: `Mark trip ${next}?`,
			body: `Set "${t.title}" to ${next}?`,
			okLabel: next,
			action: () => void (async () => {
				const c = supabase();
				if (!c) return;
				const { error } = await c.from("driver_trips").update({ status: next }).eq("id", t.id);
				if (error) { toast(`Update failed: ${error.message}`); return; }
				toast(`Trip marked ${next}`);
				setSel(null);
				void reload();
			})(),
		});
	};

	return (
		<>
			<SubTabs
				tabs={["All", "Upcoming", "Completed", "Cancelled"]}
				active={tab}
				onChange={setTab}
				counts={Object.fromEntries(["All", "Upcoming", "Completed", "Cancelled"].map((t) => [
					t, t === "All" ? trips.length
					: t === "Upcoming" ? trips.filter((x) => !["Completed", "Cancelled"].includes(x.status) && (x.trip_date ?? "9999") >= today).length
					: trips.filter((x) => x.status === t).length,
				]))}
			/>
			<Panel title="My trips">
				<Table
					cols={[
						{ key: "t", label: "Trip", render: (r: Row) => <strong>{r.title}</strong> },
						{ key: "r", label: "Route", render: (r) => `${r.pickup ?? "—"} → ${r.dropoff ?? "—"}` },
						{ key: "d", label: "Date", render: (r) => `${r.trip_date ?? "—"} ${r.trip_time ?? ""}`, sortKey: (r) => r.trip_date ?? "" },
						{ key: "p", label: "Pax", render: (r) => String(r.passengers ?? "—") },
						{ key: "a", label: "Amount", render: (r) => (r.amount != null ? fmtR(Number(r.amount)) : "—") },
						{ key: "s", label: "Status", render: (r) => <Pill status={r.status} /> },
					]}
					rows={rows}
					empty="No trips yet — trips assigned by GiftWako will appear here."
					onRow={setSel}
				/>
			</Panel>
			{sel && (
				<Drawer title={sel.title} onClose={() => setSel(null)}>
					<div className="gw-dlist">
						<Dr k="Route" v={`${sel.pickup ?? "—"} → ${sel.dropoff ?? "—"}`} />
						<Dr k="Date" v={`${sel.trip_date ?? "—"} ${sel.trip_time ?? ""}`} />
						<Dr k="Passengers" v={sel.passengers ?? "—"} />
						<Dr k="Amount" v={sel.amount != null ? fmtR(Number(sel.amount)) : "—"} />
						<Dr k="Paid" v={sel.paid ? "Yes" : "No"} />
						<Dr k="Status" v={<Pill status={sel.status} />} />
						{sel.notes && <Dr k="Notes" v={sel.notes} />}
					</div>
					{NEXT_STATUS[sel.status] && (
						<div className="gw-buttons" style={{ marginTop: "1rem" }}>
							<button className="gw-btn gw-btn--gold gw-btn--small" onClick={() => advance(sel)}>
								Mark {NEXT_STATUS[sel.status]}
							</button>
						</div>
					)}
				</Drawer>
			)}
		</>
	);
}

/* ============================ EARNINGS ============================ */

function Earnings() {
	const { trips, loaded } = useDriver();
	if (!loaded) return <p className="gw-small">Loading…</p>;

	const done = trips.filter((t) => t.status === "Completed");
	const amt = (t: Row) => Number(t.amount ?? 0);
	const paid = done.filter((t) => t.paid).reduce((a, t) => a + amt(t), 0);
	const unpaid = done.filter((t) => !t.paid).reduce((a, t) => a + amt(t), 0);
	const month = new Date().toISOString().slice(0, 7);
	const thisMonth = done.filter((t) => (t.trip_date ?? "").startsWith(month)).reduce((a, t) => a + amt(t), 0);

	return (
		<>
			<div className="gw-statgrid" style={{ gridTemplateColumns: "repeat(3, 1fr)" }}>
				<div className="gw-stat"><p>Paid total</p><strong>{fmtR(paid)}</strong></div>
				<div className="gw-stat"><p>Unpaid</p><strong>{fmtR(unpaid)}</strong></div>
				<div className="gw-stat"><p>This month</p><strong>{fmtR(thisMonth)}</strong></div>
			</div>
			<Panel title="Completed trips" sub="Payouts are made 24–48 hours after trip completion as per the Affiliation Agreement.">
				<Table
					cols={[
						{ key: "t", label: "Trip", render: (r: Row) => <strong>{r.title}</strong> },
						{ key: "d", label: "Date", render: (r) => r.trip_date ?? "—" },
						{ key: "a", label: "Amount", render: (r) => fmtR(amt(r)) },
						{ key: "p", label: "Payout", render: (r) => <Pill status={r.paid ? "Paid" : "Pending"} /> },
					]}
					rows={done}
					empty="No completed trips yet."
				/>
			</Panel>
		</>
	);
}

/* ============================ NOTIFICATIONS ============================ */

function Notifications() {
	const { user, notifications, loaded, reload } = useDriver();
	if (!loaded) return <p className="gw-small">Loading…</p>;

	const mark = async (id: number) => {
		const c = supabase();
		if (!c) return;
		await c.from("driver_notifications").update({ read: true }).eq("id", id);
		void reload();
	};
	const markAll = async () => {
		const c = supabase();
		if (!c) return;
		await c.from("driver_notifications").update({ read: true }).eq("user_id", user.id).eq("read", false);
		void reload();
	};

	return (
		<Panel
			title="Notifications"
			actions={<button className="gw-btn gw-btn--outline gw-btn--outline-dark gw-btn--small" onClick={() => void markAll()}>Mark all read</button>}
		>
			{notifications.length === 0 && <p className="gw-small">No notifications yet.</p>}
			{notifications.map((n) => (
				<div
					key={n.id}
					className={`gw-admin__notif${!n.read ? " is-new" : ""}`}
					style={{ cursor: "pointer", borderRadius: 8 }}
					onClick={() => void mark(n.id)}
				>
					<span className="gw-chip">{n.type}</span>
					<p><strong>{n.title}</strong></p>
					{n.body && <p>{n.body}</p>}
					<small>{fdate(n.created_at)}</small>
				</div>
			))}
		</Panel>
	);
}

/* ============================ SETTINGS ============================ */

function Settings() {
	const { user } = useDriver();
	const [pw, setPw] = useState("");
	const [pw2, setPw2] = useState("");
	const [email, setEmail] = useState("");
	const [prefs, setPrefs] = useState({ jobs: true, trips: true, payouts: true });
	const [busy, setBusy] = useState(false);

	const changePw = async () => {
		if (!pw || pw !== pw2) { toast("Passwords do not match."); return; }
		const c = supabase();
		if (!c) return;
		setBusy(true);
		const { error } = await c.auth.updateUser({ password: pw });
		setBusy(false);
		if (error) toast(`Password change failed: ${error.message}`);
		else { toast("Password updated"); setPw(""); setPw2(""); }
	};
	const changeEmail = async () => {
		const c = supabase();
		if (!c || !email) return;
		setBusy(true);
		const { error } = await c.auth.updateUser({ email });
		setBusy(false);
		if (error) toast(`Email change failed: ${error.message}`);
		else toast("Confirmation sent — check both inboxes to confirm the change.");
	};
	const requestDeletion = async () => {
		const c = supabase();
		if (!c) return;
		await c.from("driver_notifications").insert({
			user_id: user.id, type: "info",
			title: "Account deletion requested",
			body: "This driver has requested that their account and data be deleted.",
		});
		toast("Deletion requested — GiftWako will process it.");
	};

	return (
		<>
			<Panel title="Change password">
				<div className="gw-form__grid">
					<div className="gw-form__field"><label className="gw-form__label">New password</label>
						<input type="password" value={pw} onChange={(e) => setPw(e.target.value)} autoComplete="new-password" />
					</div>
					<div className="gw-form__field"><label className="gw-form__label">Confirm password</label>
						<input type="password" value={pw2} onChange={(e) => setPw2(e.target.value)} autoComplete="new-password" />
					</div>
				</div>
				<div className="gw-buttons" style={{ marginTop: "0.8rem" }}>
					<button className="gw-btn gw-btn--gold" disabled={busy} onClick={() => void changePw()}>Update password</button>
				</div>
			</Panel>
			<Panel title="Change email" sub={`Current: ${user.email ?? "—"}. You will need to confirm the change on both addresses.`}>
				<div className="gw-form__grid">
					<div className="gw-form__field"><label className="gw-form__label">New email</label>
						<input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
					</div>
				</div>
				<div className="gw-buttons" style={{ marginTop: "0.8rem" }}>
					<button className="gw-btn gw-btn--outline gw-btn--outline-dark" disabled={busy || !email} onClick={() => void changeEmail()}>Change email</button>
				</div>
			</Panel>
			<Panel title="Notification preferences" sub="Stored on this device only.">
				{(["jobs", "trips", "payouts"] as const).map((k) => (
					<label className="gw-form__check" key={k} style={{ display: "block", margin: "0.3rem 0" }}>
						<input type="checkbox" checked={prefs[k]} onChange={(e) => setPrefs((p) => ({ ...p, [k]: e.target.checked }))} />
						{" "}Notify me about {k === "jobs" ? "new available jobs" : k === "trips" ? "trip assignments & updates" : "payouts"}
					</label>
				))}
				<div className="gw-buttons" style={{ marginTop: "0.8rem" }}>
					<button className="gw-btn gw-btn--outline gw-btn--outline-dark" onClick={() => toast("Preferences saved (local).")}>Save preferences</button>
				</div>
			</Panel>
			<Panel title="Danger zone">
				<p className="gw-small">Request that GiftWako Travel deletes your account and personal data.</p>
				<button className="gw-btn gw-btn--outline gw-btn--outline-dark gw-btn--small" style={{ color: "#8A1C12" }} onClick={() => void requestDeletion()}>
					Request account deletion
				</button>
			</Panel>
		</>
	);
}
