/*
 * Demonstration data for the admin dashboard.
 * Nothing here is real — users, bookings, revenue and settings are samples
 * until a backend is connected.
 */

export type PropStatus = "Live" | "Pending" | "Rejected" | "Suspended";
export type BookingStatus = "Pending" | "Confirmed" | "Completed" | "Cancelled";
export type AcctStatus = "Active" | "Suspended" | "Pending";
export type TicketStatus = "Open" | "In progress" | "Resolved";

export interface AdminProperty {
	id: number;
	name: string;
	owner: string;
	city: string;
	province: string;
	type: string;
	stars?: number;
	rating: number;
	price: number;
	rooms: { name: string; sleeps: number; price: number; qty: number }[];
	facilities: string[];
	status: PropStatus;
	added: string;
	image: string;
	reviews: number;
}

export interface AdminOwner {
	id: number;
	name: string;
	company: string;
	email: string;
	phone: string;
	properties: number;
	bookings30d: number;
	revenue30d: number;
	commissionPct: number;
	status: AcctStatus;
	joined: string;
	docs: string;
}

export interface AdminCustomer {
	id: number;
	name: string;
	email: string;
	phone: string;
	bookings: number;
	spent: number;
	status: AcctStatus;
	joined: string;
	wishlist: number;
	support: number;
}

export interface AdminBooking {
	id: string;
	guest: string;
	email: string;
	property: string;
	room: string;
	checkin: string;
	checkout: string;
	nights: number;
	guests: number;
	total: number;
	status: BookingStatus;
	payment: "Paid" | "Pending" | "Refunded" | "Partial";
	created: string;
}

export interface AdminReview {
	id: number;
	property: string;
	customer: string;
	rating: number;
	text: string;
	date: string;
	status: "Published" | "Reported" | "Hidden";
}

export interface AdminDestination {
	id: number;
	name: string;
	province: string;
	properties: number;
	blurb: string;
	featured: boolean;
	visible: boolean;
	image: string;
}

export interface AdminPromo {
	id: number;
	title: string;
	description: string;
	discount: string;
	starts: string;
	ends: string;
	properties: string;
	status: "Active" | "Scheduled" | "Expired" | "Draft";
	featured: boolean;
	image: string;
}

export interface AdminTicket {
	id: string;
	subject: string;
	customer: string;
	category: string;
	priority: "Low" | "Normal" | "High";
	submitted: string;
	status: TicketStatus;
}

export interface AdminNotif {
	id: number;
	type: "Booking" | "Approval" | "Account" | "Owner" | "System";
	text: string;
	time: string;
	isNew: boolean;
}

export interface AdminActivity {
	icon: string;
	text: string;
	time: string;
}

/* ---------------- datasets ---------------- */

export const D_PROPERTIES: AdminProperty[] = [];

export const D_OWNERS: AdminOwner[] = [];

export const D_CUSTOMERS: AdminCustomer[] = [];

export const D_BOOKINGS: AdminBooking[] = [];

export const D_REVIEWS: AdminReview[] = [];

export const D_DESTINATIONS: AdminDestination[] = [];

export const D_PROMOS: AdminPromo[] = [];

export const D_TICKETS: AdminTicket[] = [];

export const D_NOTIFS: AdminNotif[] = [];

export const D_ACTIVITY: AdminActivity[] = [];

/* monthly demo series: bookings count + revenue (R thousands) */
export const D_MONTHLY: { m: string; bookings: number; revenue: number }[] = [];

export const D_DEST_REVENUE: { d: string; pct: number }[] = [];

export const D_CATEGORY_SHARE: { c: string; pct: number }[] = [];

export const FINANCE = {
	totalValue: 0,
	commission: 0,
	ownerEarnings: 0,
	refunds: 0,
	commissionRate: 14,
};
