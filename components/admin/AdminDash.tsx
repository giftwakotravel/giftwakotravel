"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { toast } from "@/components/Toaster";
import { supabase } from "@/lib/supabase";
import { Confirm } from "@/components/admin/ui";
import CoreSections from "@/components/admin/sections-core";
import OpsSections from "@/components/admin/sections-ops";
import SysSections from "@/components/admin/sections-sys";
import { StaffProvider, STAFF_SECTIONS, type StaffSection } from "@/components/staff/ctx";
import RequestsSections from "@/components/admin/sections-requests";
import BookingSections, { usePendingBookingCount } from "@/components/admin/sections-booking";
import ContentSections from "@/components/admin/sections-content";
import StaffSectionsA from "@/components/staff/sections-staff-a";
import StaffSectionsB from "@/components/staff/sections-staff-b";
import StaffSectionsC from "@/components/staff/sections-staff-c";
import {
	D_BOOKINGS, D_CUSTOMERS, D_DESTINATIONS, D_NOTIFS, D_OWNERS, D_PROMOS, D_PROPERTIES, D_REVIEWS, D_TICKETS,
	type AdminBooking, type AdminCustomer, type AdminDestination, type AdminNotif, type AdminOwner,
	type AdminPromo, type AdminProperty, type AdminReview, type AdminTicket,
} from "@/lib/admin-data";

export type Section =
	| "overview" | "properties" | "approvals" | "owners" | "customers" | "bookings"
	| "finance" | "reviews" | "destinations" | "promos" | "support" | "notifications"
	| "reports" | "account" | "settings" | "trip-requests" | "events"
	| "service-bookings" | "packages" | "transport-rates"
	| StaffSection;

export const SECTIONS: { key: Section; label: string; icon: string }[] = [
	{ key: "overview", label: "Overview", icon: "▤" },
	{ key: "properties", label: "Properties", icon: "⌂" },
	{ key: "approvals", label: "Property Approvals", icon: "✓" },
	{ key: "owners", label: "Property Owners", icon: "♛" },
	{ key: "customers", label: "Customers", icon: "☺" },
	{ key: "bookings", label: "Bookings", icon: "◔" },
	{ key: "service-bookings", label: "Online Bookings", icon: "◔" },
	{ key: "packages", label: "Packages", icon: "▣" },
	{ key: "transport-rates", label: "Transport Rates", icon: "R" },
	{ key: "trip-requests", label: "Trip Requests", icon: "✈" },
	{ key: "finance", label: "Revenue & Finance", icon: "R" },
	{ key: "reviews", label: "Reviews & Ratings", icon: "★" },
	{ key: "destinations", label: "Destinations", icon: "➤" },
	{ key: "events", label: "Events", icon: "✦" },
	{ key: "promos", label: "Promotions & Deals", icon: "✦" },
	{ key: "support", label: "Customer Support", icon: "✆" },
	{ key: "notifications", label: "Notifications", icon: "🔔" },
	{ key: "reports", label: "Reports & Analytics", icon: "▲" },
	{ key: "account", label: "Administrator Account", icon: "☺" },
	{ key: "settings", label: "Platform Settings", icon: "⚙" },
];

interface ConfirmOpts {
	title: string;
	body: string;
	okLabel?: string;
	action: () => void;
}

export interface AdminCtx {
	properties: AdminProperty[];
	setPropStatus: (id: number, status: AdminProperty["status"]) => void;
	owners: AdminOwner[];
	setOwnerStatus: (id: number, status: AdminOwner["status"]) => void;
	customers: AdminCustomer[];
	setCustStatus: (id: number, status: AdminCustomer["status"]) => void;
	bookings: AdminBooking[];
	setBookingStatus: (id: string, status: AdminBooking["status"]) => void;
	reviews: AdminReview[];
	setReviewStatus: (id: number, status: AdminReview["status"]) => void;
	destinations: AdminDestination[];
	setDestinations: React.Dispatch<React.SetStateAction<AdminDestination[]>>;
	promos: AdminPromo[];
	setPromos: React.Dispatch<React.SetStateAction<AdminPromo[]>>;
	tickets: AdminTicket[];
	setTicketStatus: (id: string, status: AdminTicket["status"]) => void;
	notifs: AdminNotif[];
	markAllRead: () => void;
	globalQuery: string;
	go: (s: Section) => void;
	confirm: (o: ConfirmOpts) => void;
}

const Ctx = createContext<AdminCtx | null>(null);
export function useAdmin() {
	return useContext(Ctx)!;
}

export default function AdminDash() {
	const [section, setSection] = useState<Section>("overview");
	const [collapsed, setCollapsed] = useState(false);
	const [mobileNav, setMobileNav] = useState(false);
	const [bellOpen, setBellOpen] = useState(false);
	const [profileOpen, setProfileOpen] = useState(false);
	const [globalQuery, setGlobalQuery] = useState("");
	const [confirmOpts, setConfirmOpts] = useState<ConfirmOpts | null>(null);

	// properties are live from Supabase; everything else stays demo for now
	const [properties, setProperties] = useState<AdminProperty[]>([]);
	useEffect(() => {
		const c = supabase();
		if (!c) { setProperties(D_PROPERTIES); return; }
		void c
			.from("properties")
			.select("*")
			.order("id")
			.then(({ data, error }) => {
				if (error) { toast("Could not load properties from Supabase"); setProperties(D_PROPERTIES); }
				else setProperties((data ?? []) as AdminProperty[]);
			});
	}, []);
	const [owners, setOwners] = useState(D_OWNERS);
	const [customers, setCustomers] = useState(D_CUSTOMERS);
	const [bookings, setBookings] = useState(D_BOOKINGS);
	const [reviews, setReviews] = useState(D_REVIEWS);
	const [destinations, setDestinations] = useState(D_DESTINATIONS);
	const [promos, setPromos] = useState(D_PROMOS);
	const [tickets, setTickets] = useState(D_TICKETS);
	const [notifs, setNotifs] = useState(D_NOTIFS);

	const pendingOnline = usePendingBookingCount();

	const go = (s: Section) => {
		setSection(s);
		setMobileNav(false);
		setBellOpen(false);
	};

	const confirm = (o: ConfirmOpts) => setConfirmOpts(o);
	const newNotifs = notifs.filter((n) => n.isNew).length;

	const ctx: AdminCtx = {
		properties,
		setPropStatus: (id, status) => {
			setProperties((p) => p.map((x) => (x.id === id ? { ...x, status } : x)));
			const c = supabase();
			if (!c) { toast("Not connected to the database"); return; }
			void c.from("properties").update({ status }).eq("id", id)
				.then(({ error }) => { if (error) toast(`Status save failed: ${error.message}`); });
		},
		owners,
		setOwnerStatus: (id, status) => setOwners((o) => o.map((x) => (x.id === id ? { ...x, status } : x))),
		customers,
		setCustStatus: (id, status) => setCustomers((c) => c.map((x) => (x.id === id ? { ...x, status } : x))),
		bookings,
		setBookingStatus: (id, status) => setBookings((b) => b.map((x) => (x.id === id ? { ...x, status } : x))),
		reviews,
		setReviewStatus: (id, status) => setReviews((r) => r.map((x) => (x.id === id ? { ...x, status } : x))),
		destinations,
		setDestinations,
		promos,
		setPromos,
		tickets,
		setTicketStatus: (id, status) => setTickets((t) => t.map((x) => (x.id === id ? { ...x, status } : x))),
		notifs,
		markAllRead: () => setNotifs((n) => n.map((x) => ({ ...x, isNew: false }))),
		globalQuery,
		go,
		confirm,
	};

	const curLabel =
		SECTIONS.find((s) => s.key === section)?.label ??
		STAFF_SECTIONS.find((s) => s.key === section)?.label ??
		"";

	const isStaffSection = STAFF_SECTIONS.some((s) => s.key === section);

	return (
		<Ctx.Provider value={ctx}>
			<div className={`gw-admin${collapsed ? " is-collapsed" : ""}`}>
				{/* ---------- sidebar ---------- */}
				<aside className={`gw-admin__side${mobileNav ? " is-open" : ""}`}>
					<div className="gw-admin__brand">
						{/* eslint-disable-next-line @next/next/no-img-element */}
						<img src="/images/giftwako-logo.png" alt="" width={40} height={40} />
						{!collapsed && <span>GiftWako Admin</span>}
					</div>
					<nav aria-label="Dashboard sections">
						{SECTIONS.map((s) => (
							<button
								key={s.key}
								className={section === s.key ? "is-active" : ""}
								onClick={() => go(s.key)}
								title={s.label}
							>
								<span className="gw-admin__icn" aria-hidden="true">{s.icon}</span>
								{!collapsed && <span>{s.label}</span>}
								{s.key === "approvals" && !collapsed && (
									<span className="gw-admin__badge">{properties.filter((p) => p.status === "Pending").length}</span>
								)}
								{s.key === "service-bookings" && !collapsed && pendingOnline > 0 && (
									<span className="gw-admin__badge">{pendingOnline}</span>
								)}
							</button>
						))}
						<div className="gw-admin__group">
							{!collapsed && <span className="gw-admin__group-label">Staff & Operations</span>}
							{collapsed && <hr className="gw-admin__group-hr" />}
						</div>
						{STAFF_SECTIONS.map((s) => (
							<button
								key={s.key}
								className={section === s.key ? "is-active" : ""}
								onClick={() => go(s.key)}
								title={s.label}
							>
								<span className="gw-admin__icn" aria-hidden="true">{s.icon}</span>
								{!collapsed && <span>{s.label}</span>}
							</button>
						))}
					</nav>
				</aside>
				{mobileNav && <div className="gw-admin__scrim" onClick={() => setMobileNav(false)} />}

				{/* ---------- main ---------- */}
				<div className="gw-admin__main">
					<header className="gw-admin__top">
						<button className="gw-admin__iconbtn" onClick={() => setMobileNav(true)} aria-label="Open menu">☰</button>
						<h1>{curLabel}</h1>
						<div className="gw-admin__topright">
							<input
								type="search"
								className="gw-adminsearch gw-adminsearch--top"
								placeholder="Global search…"
								value={globalQuery}
								onChange={(e) => setGlobalQuery(e.target.value)}
								aria-label="Global search"
							/>
							<div className="gw-admin__menuwrap">
								<button
									className="gw-admin__iconbtn"
									aria-label={`Notifications${newNotifs ? ` — ${newNotifs} new` : ""}`}
									aria-expanded={bellOpen}
									onClick={() => { setBellOpen(!bellOpen); setProfileOpen(false); }}
								>
									🔔
									{newNotifs > 0 && <span className="gw-admin__dot">{newNotifs}</span>}
								</button>
								{bellOpen && (
									<div className="gw-admin__drop">
										<div className="gw-admin__drophead">
											<strong>Notifications</strong>
											<button onClick={() => ctx.markAllRead()}>Mark all read</button>
										</div>
										{notifs.slice(0, 5).map((n) => (
											<div className={`gw-admin__notif${n.isNew ? " is-new" : ""}`} key={n.id}>
												<span className="gw-chip">{n.type}</span>
												<p>{n.text}</p>
												<small>{n.time}</small>
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
									aria-label="Profile menu"
									aria-expanded={profileOpen}
									onClick={() => { setProfileOpen(!profileOpen); setBellOpen(false); }}
								>
									A
								</button>
								{profileOpen && (
									<div className="gw-admin__drop" style={{ right: 0 }}>
										<div className="gw-admin__notif">
											<strong>Demo Admin</strong>
											<small>admin@giftwakotravel.co.za</small>
										</div>
										<button className="gw-admin__dropfoot" onClick={() => go("account")}>My profile →</button>
										<button className="gw-admin__dropfoot" onClick={() => go("settings")}>Settings →</button>
										<button
											className="gw-admin__dropfoot"
											style={{ color: "#8A1C12" }}
											onClick={() => toast("Signed out (demo — no real session)")}
										>
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
						<p className="gw-denote" style={{ marginBottom: "1rem" }}>
							<strong>Mixed data</strong> — Properties, approvals and trip requests are live from Supabase.
							Other sections still show demonstration data.
						</p>
						{isStaffSection ? (
							<StaffProvider>
								<StaffSectionsA section={section as StaffSection} />
								<StaffSectionsB section={section as StaffSection} />
								<StaffSectionsC section={section as StaffSection} />
							</StaffProvider>
						) : (
							<>
								<CoreSections section={section} />
								<OpsSections section={section} />
								<SysSections section={section} />
								<RequestsSections section={section} />
								<BookingSections section={section} />
								<ContentSections section={section} />
							</>
						)}
					</main>
				</div>
			</div>

			{confirmOpts && (
				<Confirm
					title={confirmOpts.title}
					body={confirmOpts.body}
					okLabel={confirmOpts.okLabel}
					onCancel={() => setConfirmOpts(null)}
					onOk={() => {
						confirmOpts.action();
						setConfirmOpts(null);
					}}
				/>
			)}
		</Ctx.Provider>
	);
}
