"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { DriverAuthProvider, useDriverAuth } from "@/lib/driver-auth";
import { supabase } from "@/lib/supabase";
import DriverAuth, { ResetPassword } from "@/components/driver/DriverAuth";
import { DriverProvider, useDriver } from "@/components/driver/ctx";
import DriverSectionsA from "@/components/driver/sections-a";
import DriverSectionsB from "@/components/driver/sections-b";
import type { Section } from "@/lib/driver-portal";

const NAV: { key: Section; label: string; icon: string }[] = [
	{ key: "dashboard", label: "Dashboard", icon: "🏠" },
	{ key: "profile", label: "My Profile", icon: "👤" },
	{ key: "vehicles", label: "My Vehicles", icon: "🚗" },
	{ key: "documents", label: "My Documents", icon: "📄" },
	{ key: "contract", label: "My Contract", icon: "📝" },
	{ key: "jobs", label: "Available Jobs", icon: "💼" },
	{ key: "trips", label: "My Trips", icon: "📅" },
	{ key: "earnings", label: "Earnings", icon: "💰" },
	{ key: "notifications", label: "Notifications", icon: "🔔" },
	{ key: "settings", label: "Settings", icon: "⚙️" },
];

export default function DriverPortal() {
	return (
		<DriverAuthProvider>
			<Suspense fallback={<div className="gw-admingate"><p className="gw-small">Loading…</p></div>}>
				<Shell />
			</Suspense>
		</DriverAuthProvider>
	);
}

function Shell() {
	const { user, loading, signOut } = useDriverAuth();
	const params = useSearchParams();
	const reset = params.get("reset") === "1";
	const [section, setSection] = useState<Section>("dashboard");
	const [mounted, setMounted] = useState(false);
	useEffect(() => setMounted(true), []);

	if (!mounted || loading) {
		return <div className="gw-admingate"><p className="gw-small">Loading…</p></div>;
	}
	if (!user) return <DriverAuth />;
	if (reset) return <ResetPassword />;

	return (
		<DriverProvider user={user} go={setSection}>
			<PortalShell user={user} section={section} setSection={setSection} signOut={signOut} />
		</DriverProvider>
	);
}

function PortalShell({ user, section, setSection, signOut }: {
	user: { id: string; email?: string };
	section: Section;
	setSection: (s: Section) => void;
	signOut: () => Promise<void>;
}) {
	const [collapsed, setCollapsed] = useState(false);
	const [mobileNav, setMobileNav] = useState(false);
	const [bellOpen, setBellOpen] = useState(false);
	const [profileOpen, setProfileOpen] = useState(false);
	const { notifications, reload, profile } = useDriver();

	const unread = notifications.filter((n) => !n.read).length;
	const go = (s: Section) => { setSection(s); setMobileNav(false); setBellOpen(false); };
	const initials = `${(profile?.full_name as string | undefined)?.[0] ?? ""}${(profile?.surname as string | undefined)?.[0] ?? ""}`.toUpperCase() || (user.email?.[0] ?? "D").toUpperCase();

	const markRead = async (id: number) => {
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
		<div className={`gw-admin gw-driver${collapsed ? " is-collapsed" : ""}`}>
			<aside className={`gw-admin__side${mobileNav ? " is-open" : ""}`}>
				<div className="gw-admin__brand">
					{/* eslint-disable-next-line @next/next/no-img-element */}
					<img src="/images/giftwako-logo.png" alt="" width={40} height={40} />
					{!collapsed && <span>GiftWako Driver Portal</span>}
				</div>
				<nav aria-label="Portal sections">
					{NAV.map((s) => (
						<button key={s.key} className={section === s.key ? "is-active" : ""} onClick={() => go(s.key)} title={s.label}>
							<span className="gw-admin__icn" aria-hidden="true">{s.icon}</span>
							{!collapsed && <span>{s.label}</span>}
							{s.key === "notifications" && unread > 0 && !collapsed && (
								<span className="gw-admin__badge">{unread}</span>
							)}
						</button>
					))}
					<button onClick={() => void signOut()} title="Logout">
						<span className="gw-admin__icn" aria-hidden="true">🚪</span>
						{!collapsed && <span>Logout</span>}
					</button>
				</nav>
			</aside>
			{mobileNav && <div className="gw-admin__scrim" onClick={() => setMobileNav(false)} />}

			<div className="gw-admin__main">
				<header className="gw-admin__top">
					<button className="gw-admin__iconbtn" onClick={() => setMobileNav(true)} aria-label="Open menu">☰</button>
					<h1>{NAV.find((s) => s.key === section)?.label ?? ""}</h1>
					<div className="gw-admin__topright">
						<div className="gw-admin__menuwrap">
							<button
								className="gw-admin__iconbtn"
								aria-label={`Notifications${unread ? ` — ${unread} new` : ""}`}
								aria-expanded={bellOpen}
								onClick={() => { setBellOpen(!bellOpen); setProfileOpen(false); }}
							>
								🔔
								{unread > 0 && <span className="gw-admin__dot">{unread}</span>}
							</button>
							{bellOpen && (
								<div className="gw-admin__drop">
									<div className="gw-admin__drophead">
										<strong>Notifications</strong>
										<button onClick={() => void markAll()}>Mark all read</button>
									</div>
									{notifications.slice(0, 5).map((n) => (
										<div
											className={`gw-admin__notif${!n.read ? " is-new" : ""}`}
											key={n.id}
											onClick={() => void markRead(n.id)}
											style={{ cursor: "pointer" }}
										>
											<span className="gw-chip">{n.type}</span>
											<p>{n.title}</p>
											<small>{n.body}</small>
										</div>
									))}
									<button className="gw-admin__dropfoot" onClick={() => go("notifications")}>
										View all notifications →
									</button>
								</div>
							)}
						</div>
						<div className="gw-admin__menuwrap">
							<button
								className="gw-admin__avatar"
								aria-label="Account menu"
								aria-expanded={profileOpen}
								onClick={() => { setProfileOpen(!profileOpen); setBellOpen(false); }}
							>
								{initials}
							</button>
							{profileOpen && (
								<div className="gw-admin__drop" style={{ right: 0 }}>
									<div className="gw-admin__notif">
										<strong>{profile?.full_name ? `${profile.full_name} ${profile.surname ?? ""}` : "Driver"}</strong>
										<small>{user.email}</small>
									</div>
									<button className="gw-admin__dropfoot" onClick={() => go("profile")}>My profile →</button>
									<button className="gw-admin__dropfoot" onClick={() => go("settings")}>Settings →</button>
									<button className="gw-admin__dropfoot" style={{ color: "#8A1C12" }} onClick={() => void signOut()}>
										Sign out
									</button>
								</div>
							)}
						</div>
						<button
							className="gw-admin__iconbtn"
							onClick={() => setCollapsed(!collapsed)}
							aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
						>
							{collapsed ? "»" : "«"}
						</button>
					</div>
				</header>

				<main className="gw-admin__content">
					<DriverSectionsA section={section} />
					<DriverSectionsB section={section} />
				</main>
			</div>
		</div>
	);
}
