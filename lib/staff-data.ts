/*
 * Demonstration data for the Staff & Operations dashboard section.
 * Nothing here is real — employees, drivers, vehicles and schedules are samples.
 */

export type EmployStatus = "Active" | "Probation" | "On leave" | "Suspended" | "Former";
export type AvailStatus = "Available" | "On trip" | "On tour" | "On leave" | "Unavailable" | "Suspended";
export type RegStatus = "New" | "Pending" | "Approved" | "Rejected" | "Incomplete" | "Suspended";
export type AssignStatus = "Pending" | "Upcoming" | "Active" | "Completed" | "Cancelled" | "Unassigned";
export type VehStatus = "Available" | "In use" | "Maintenance" | "Unavailable";
export type AttStatus = "Present" | "Absent" | "Late" | "Leave";
export type DocStatus = "Verified" | "Pending" | "Expiring" | "Expired";
export type LeaveStatus = "Pending" | "Approved" | "Rejected";

export interface StaffMember {
	id: number;
	code: string;
	name: string;
	title: string;
	dept: string;
	phone: string;
	email: string;
	location: string;
	startDate: string;
	employment: "Full-time" | "Part-time" | "Contract";
	status: EmployStatus;
	manager: string;
	experience: string;
	emergency: string;
	initials: string;
}

export interface Driver {
	id: number;
	code: string;
	name: string;
	phone: string;
	email: string;
	area: string;
	licenceCat: string;
	licenceExpiry: string;
	prdp: string | null;
	prdpExpiry: string | null;
	years: number;
	languages: string[];
	vehicle: string | null;
	status: AvailStatus;
	employStatus: EmployStatus;
	emergency: string;
	trips: number;
	incidents: number;
	docs: { label: string; status: DocStatus }[];
}

export interface Guide {
	id: number;
	code: string;
	name: string;
	phone: string;
	email: string;
	languages: string[];
	expertise: string;
	quals: string;
	years: number;
	destinations: string[];
	status: AvailStatus;
	employStatus: EmployStatus;
	tours: number;
	rating: number;
}

export interface Registration {
	id: number;
	ref: string;
	name: string;
	position: string;
	dept: string;
	submitted: string;
	email: string;
	phone: string;
	status: RegStatus;
}

export interface Department {
	name: string;
	desc: string;
	manager: string;
	staff: number;
}

export interface JobRole {
	title: string;
	dept: string;
	responsibilities: string;
}

export interface Vehicle {
	id: number;
	code: string;
	reg: string;
	make: string;
	model: string;
	cat: string;
	seats: number;
	year: number;
	driver: string | null;
	insurance: string;
	licenceDisc: string;
	service: string;
	status: VehStatus;
}

export interface Assignment {
	id: string;
	trip: string;
	bookingRef: string;
	pickup: string;
	dest: string;
	date: string;
	depart: string;
	eta: string;
	driver: string | null;
	vehicle: string | null;
	guide: string | null;
	pax: number;
	notes: string;
	status: AssignStatus;
}

export interface Attendance {
	staff: string;
	shift: string;
	in: string | null;
	out: string | null;
	status: AttStatus;
}

export interface StaffDoc {
	id: number;
	staff: string;
	type: string;
	issued: string;
	expires: string;
	status: DocStatus;
	notes: string;
}

export interface LeaveReq {
	id: number;
	staff: string;
	type: string;
	from: string;
	to: string;
	reason: string;
	status: LeaveStatus;
}

export interface Announcement {
	id: number;
	title: string;
	body: string;
	date: string;
	audience: string;
}

/* ---------------- datasets ---------------- */

export const S_EMPLOYEES: StaffMember[] = [];

export const S_DRIVERS: Driver[] = [];

export const S_GUIDES: Guide[] = [];

export const S_REGISTRATIONS: Registration[] = [];

export const S_DEPARTMENTS: Department[] = [];

export const S_ROLES: JobRole[] = [];

export const S_VEHICLES: Vehicle[] = [];

export const S_ASSIGNMENTS: Assignment[] = [];

export const S_ATTENDANCE: Attendance[] = [];

export const S_DOCS: StaffDoc[] = [];

export const S_LEAVE: LeaveReq[] = [];

export const S_ANNOUNCEMENTS: Announcement[] = [];

export const S_SCHEDULE: { staff: string; role: string; days: ("Avail" | "Assigned" | "Leave" | "Off")[] }[] = [];

export const DAYS = ["Mon 19", "Tue 20", "Wed 21", "Thu 22", "Fri 23", "Sat 24", "Sun 25"];
