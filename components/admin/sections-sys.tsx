"use client";

import { useState } from "react";
import { useAdmin, type Section } from "@/components/admin/AdminDash";
import { Bars, Dr, fmtR, Panel, Shares, Table } from "@/components/admin/ui";
import { toast } from "@/components/Toaster";
import { D_CATEGORY_SHARE, D_DEST_REVENUE, D_MONTHLY } from "@/lib/admin-data";

export default function SysSections({ section }: { section: Section }) {
	switch (section) {
		case "reports": return <Reports />;
		case "account": return <Account />;
		case "settings": return <Settings />;
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

/* ============================ REPORTS ============================ */

function Reports() {
	const { bookings, properties, customers, owners } = useAdmin();
	const [range, setRange] = useState("last-6m");
	const [loading, setLoading] = useState(false);

	const runReport = () => {
		setLoading(true);
		setTimeout(() => {
			downloadCSV("platform-report.csv", [
				["Metric", "Value"],
				["Total bookings", bookings.length],
				["Confirmed", bookings.filter((b) => b.status === "Confirmed").length],
				["Cancelled", bookings.filter((b) => b.status === "Cancelled").length],
				["Customers", customers.length],
				["Owners", owners.length],
				["Properties", properties.length],
				["Booking value (R)", bookings.reduce((s, b) => s + b.total, 0)],
			]);
			setLoading(false);
		}, 600);
	};

	const cancelRate = Math.round((bookings.filter((b) => b.status === "Cancelled").length / bookings.length) * 100);

	return (
		<>
			<div className="gw-toolbar">
				<select className="gw-select" value={range} onChange={(e) => setRange(e.target.value)} aria-label="Date range">
					<option value="last-6m">Last 6 months</option>
					<option value="last-12m">Last 12 months</option>
					<option value="ytd">Year to date</option>
				</select>
				<button className="gw-btn gw-btn--gold gw-btn--small" onClick={runReport} disabled={loading}>
					{loading ? "Preparing…" : "Download report (CSV)"}
				</button>
			</div>
			<div className="gw-grid-2">
				<Panel title="Bookings per month" sub={range}>
					<Bars data={D_MONTHLY.map((m) => ({ label: m.m, value: m.bookings }))} />
				</Panel>
				<Panel title="Revenue per month (R thousands)">
					<Bars data={D_MONTHLY.map((m) => ({ label: m.m, value: m.revenue }))} />
				</Panel>
				<Panel title="Popular destinations" sub="Share of bookings (demo)">
					<Shares data={D_DEST_REVENUE.map((d) => ({ label: d.d, pct: d.pct }))} />
				</Panel>
				<Panel title="Accommodation category share">
					<Shares data={D_CATEGORY_SHARE.map((c) => ({ label: c.c, pct: c.pct }))} />
				</Panel>
				<Panel title="Cancellation statistics">
					<div className="gw-grid-2" style={{ gap: "1rem" }}>
						<Dr k="Cancellations" v={bookings.filter((b) => b.status === "Cancelled").length} />
						<Dr k="Cancellation rate" v={`${cancelRate}%`} />
						<Dr k="Refunds issued" v={bookings.filter((b) => b.payment === "Refunded").length} />
						<Dr k="Completion rate" v={`${Math.round((bookings.filter((b) => b.status === "Completed").length / bookings.length) * 100)}%`} />
					</div>
				</Panel>
				<Panel title="Owner performance" sub="Top owners by bookings (30d, demo)">
					<Table
						cols={[
							{ key: "n", label: "Owner", render: (o: typeof owners[0]) => o.company },
							{ key: "b", label: "Bookings", render: (o) => o.bookings30d, sortKey: (o) => o.bookings30d },
							{ key: "r", label: "Revenue", render: (o) => fmtR(o.revenue30d), sortKey: (o) => o.revenue30d },
						]}
						rows={owners}
						pageSize={6}
					/>
				</Panel>
			</div>
			<p className="gw-demo-note">Reports use demonstration data and generate a sample CSV locally — nothing is sent anywhere.</p>
		</>
	);
}

/* ============================ ACCOUNT ============================ */

function Account() {
	const [showCur, setShowCur] = useState(false);
	const [showNew, setShowNew] = useState(false);

	return (
		<div className="gw-grid-2">
			<Panel title="My profile" sub="Administrator account details">
				<div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1rem" }}>
					<span className="gw-admin__avatar" style={{ width: "3.4rem", height: "3.4rem", fontSize: "1.3rem" }}>A</span>
					<div>
						<strong>Demo Admin</strong>
						<p className="gw-small" style={{ margin: 0 }}>admin@giftwakotravel.co.za · Super admin</p>
					</div>
				</div>
				<div className="gw-form__field"><label className="gw-form__label">Display name</label><input defaultValue="Demo Admin" /></div>
				<div className="gw-form__field"><label className="gw-form__label">Email</label><input defaultValue="admin@giftwakotravel.co.za" /></div>
				<div className="gw-form__field"><label className="gw-form__label">Phone</label><input defaultValue="064 883 9323" /></div>
				<button className="gw-form__submit" onClick={() => toast("Profile saved (demo)")}>Save profile</button>
			</Panel>

			<Panel title="Preferences">
				<div className="gw-form__field"><label className="gw-form__check"><input type="checkbox" defaultChecked /> Email me new booking alerts</label></div>
				<div className="gw-form__field"><label className="gw-form__check"><input type="checkbox" defaultChecked /> Email me approval requests</label></div>
				<div className="gw-form__field"><label className="gw-form__check"><input type="checkbox" /> Weekly summary email</label></div>
				<div className="gw-form__field"><label className="gw-form__check"><input type="checkbox" defaultChecked /> Show demo-data banner</label></div>
				<button className="gw-form__submit" onClick={() => toast("Preferences saved (demo)")}>Save preferences</button>
			</Panel>

			<Panel title="Password">
				<div className="gw-form__field">
					<label className="gw-form__label">Current password</label>
					<div className="gw-pass-wrap">
						<input type={showCur ? "text" : "password"} />
						<button type="button" className="gw-pass-toggle" onClick={() => setShowCur(!showCur)}>{showCur ? "Hide" : "Show"}</button>
					</div>
				</div>
				<div className="gw-form__field">
					<label className="gw-form__label">New password</label>
					<div className="gw-pass-wrap">
						<input type={showNew ? "text" : "password"} />
						<button type="button" className="gw-pass-toggle" onClick={() => setShowNew(!showNew)}>{showNew ? "Hide" : "Show"}</button>
					</div>
				</div>
				<button className="gw-form__submit" onClick={() => toast("Password updated (demo — nothing changed)")}>Update password</button>
			</Panel>

			<Panel title="Session">
				<Dr k="Signed in as" v="Demo Admin" />
				<Dr k="Role" v="Super administrator" />
				<Dr k="Session started" v="Today, 09:12 (demo)" />
				<Dr k="IP" v="127.0.0.1 (local)" />
				<button
					className="gw-btn gw-btn--outline gw-btn--outline-dark"
					style={{ marginTop: "1rem" }}
					onClick={() => toast("Signed out (demo — no real session)")}
				>
					Sign out
				</button>
			</Panel>
		</div>
	);
}

/* ============================ SETTINGS ============================ */

function Settings() {
	const [maint, setMaint] = useState(false);

	return (
		<div className="gw-grid-2">
			<Panel title="Website information">
				<div className="gw-form__field"><label className="gw-form__label">Brand name</label><input defaultValue="GiftWako Travel" /></div>
				<div className="gw-form__field"><label className="gw-form__label">Support email</label><input defaultValue="info@giftwakotravel.co.za" /></div>
				<div className="gw-form__field"><label className="gw-form__label">Support phone</label><input defaultValue="064 883 9323" /></div>
				<div className="gw-form__field"><label className="gw-form__label">Logo</label><input type="file" accept="image/*" /></div>
				<button className="gw-form__submit" onClick={() => toast("Site info saved (demo)")}>Save</button>
			</Panel>

			<Panel title="Market & currency">
				<div className="gw-form__field"><label className="gw-form__label">Currency</label>
					<select defaultValue="ZAR"><option value="ZAR">South African rand (ZAR)</option><option value="USD">US dollar (USD)</option></select>
				</div>
				<div className="gw-form__field"><label className="gw-form__label">Default country</label>
					<select defaultValue="ZA"><option value="ZA">South Africa</option><option value="BW">Botswana</option></select>
				</div>
				<div className="gw-form__field"><label className="gw-form__label">Time zone</label>
					<select defaultValue="SAST"><option value="SAST">Africa/Johannesburg (SAST)</option></select>
				</div>
				<button className="gw-form__submit" onClick={() => toast("Market settings saved (demo)")}>Save</button>
			</Panel>

			<Panel title="Booking & policies">
				<div className="gw-form__field"><label className="gw-form__label">Default commission %</label><input type="number" defaultValue={14} min={0} max={30} /></div>
				<div className="gw-form__field"><label className="gw-form__label">Booking hold window</label>
					<select><option>24 hours</option><option>48 hours</option><option>72 hours</option></select>
				</div>
				<div className="gw-form__field"><label className="gw-form__label">Default cancellation policy</label>
					<textarea rows={2} defaultValue="Free cancellation until 72 hours before check-in; first night charged after that." />
				</div>
				<button className="gw-form__submit" onClick={() => toast("Policy settings saved (demo)")}>Save</button>
			</Panel>

			<Panel title="Email templates" sub="Preview only — not sent">
				{["Booking confirmation", "Cancellation notice", "Welcome to GiftWako"].map((t) => (
					<div className="gw-form__field" key={t}>
						<label className="gw-form__label">{t}</label>
						<div className="gw-map-ph" style={{ minHeight: 90 }}>
							{t} — template preview (demo)
						</div>
					</div>
				))}
			</Panel>

			<Panel title="Maintenance mode">
				<label className="gw-form__check">
					<input type="checkbox" checked={maint} onChange={(e) => { setMaint(e.target.checked); toast(e.target.checked ? "Maintenance mode ON (demo)" : "Maintenance mode OFF (demo)"); }} />
					{" "}Enable maintenance mode (demo)
				</label>
				<p className="gw-small">When enabled, visitors would see a maintenance notice instead of the site.</p>
			</Panel>
		</div>
	);
}
