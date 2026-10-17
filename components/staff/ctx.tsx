"use client";

import { createContext, useContext, useState } from "react";
import { useAdmin } from "@/components/admin/AdminDash";
import {
	S_ANNOUNCEMENTS, S_ASSIGNMENTS, S_DRIVERS, S_EMPLOYEES, S_GUIDES, S_LEAVE, S_REGISTRATIONS, S_VEHICLES,
	type AssignStatus, type Assignment, type AvailStatus, type Driver, type Guide,
	type LeaveReq, type LeaveStatus, type Registration, type RegStatus, type StaffMember, type Vehicle,
} from "@/lib/staff-data";

export type StaffSection =
	| "staff-overview" | "staff-registrations" | "staff-employees" | "staff-drivers" | "staff-guides"
	| "staff-departments" | "staff-vehicles" | "staff-scheduling" | "staff-assignments" | "staff-attendance"
	| "staff-performance" | "staff-documents" | "staff-communication" | "staff-reports" | "staff-settings";

export const STAFF_SECTIONS: { key: StaffSection; label: string; icon: string }[] = [
	{ key: "staff-overview", label: "Overview", icon: "▤" },
	{ key: "staff-registrations", label: "Staff Registrations", icon: "✚" },
	{ key: "staff-employees", label: "Employees", icon: "☺" },
	{ key: "staff-drivers", label: "Drivers", icon: "◉" },
	{ key: "staff-guides", label: "Tour Guides", icon: "➤" },
	{ key: "staff-departments", label: "Departments & Job Roles", icon: "⌗" },
	{ key: "staff-vehicles", label: "Vehicles & Fleet", icon: "▣" },
	{ key: "staff-scheduling", label: "Scheduling & Availability", icon: "◔" },
	{ key: "staff-assignments", label: "Trip Assignments", icon: "⇄" },
	{ key: "staff-attendance", label: "Attendance", icon: "☑" },
	{ key: "staff-performance", label: "Performance", icon: "▲" },
	{ key: "staff-documents", label: "Documents & Compliance", icon: "◫" },
	{ key: "staff-communication", label: "Staff Communication", icon: "✆" },
	{ key: "staff-reports", label: "Reports", icon: "▥" },
	{ key: "staff-settings", label: "Staff Settings", icon: "⚙" },
];

export interface StaffCtx {
	employees: StaffMember[];
	setEmployeeStatus: (id: number, s: StaffMember["status"]) => void;
	drivers: Driver[];
	setDriverStatus: (id: number, s: AvailStatus) => void;
	setDriverEmployStatus: (id: number, s: StaffMember["status"]) => void;
	assignVehicleToDriver: (driverId: number, vehicleReg: string | null) => void;
	guides: Guide[];
	setGuideStatus: (id: number, s: AvailStatus) => void;
	registrations: Registration[];
	setRegStatus: (id: number, s: RegStatus) => void;
	vehicles: Vehicle[];
	setVehicleStatus: (id: number, s: Vehicle["status"]) => void;
	assignDriverToVehicle: (vehId: number, driver: string | null) => void;
	assignments: Assignment[];
	setAssignStatus: (id: string, s: AssignStatus) => void;
	staffAssign: (id: string, field: "driver" | "vehicle" | "guide", value: string | null) => void;
	leave: LeaveReq[];
	setLeaveStatus: (id: number, s: LeaveStatus) => void;
	announcements: typeof S_ANNOUNCEMENTS;
	pushAnnouncement: (a: { title: string; body: string; audience: string }) => void;
	confirm: ReturnType<typeof useAdmin>["confirm"];
	globalQuery: string;
	go: ReturnType<typeof useAdmin>["go"];
}

const Ctx = createContext<StaffCtx | null>(null);
export function useStaff() { return useContext(Ctx)!; }

export function StaffProvider({ children }: { children: React.ReactNode }) {
	const admin = useAdmin();
	const [employees, setEmployees] = useState(S_EMPLOYEES);
	const [drivers, setDrivers] = useState(S_DRIVERS);
	const [guides, setGuides] = useState(S_GUIDES);
	const [registrations, setRegistrations] = useState(S_REGISTRATIONS);
	const [vehicles, setVehicles] = useState(S_VEHICLES);
	const [assignments, setAssignments] = useState(S_ASSIGNMENTS);
	const [leave, setLeave] = useState(S_LEAVE);
	const [announcements, setAnnouncements] = useState(S_ANNOUNCEMENTS);

	const ctx: StaffCtx = {
		employees,
		setEmployeeStatus: (id, s) => setEmployees((e) => e.map((x) => (x.id === id ? { ...x, status: s } : x))),
		drivers,
		setDriverStatus: (id, s) => setDrivers((d) => d.map((x) => (x.id === id ? { ...x, status: s } : x))),
		setDriverEmployStatus: (id, s) => setDrivers((d) => d.map((x) => (x.id === id ? { ...x, employStatus: s } : x))),
		assignVehicleToDriver: (driverId, reg) =>
			setDrivers((d) => d.map((x) => (x.id === driverId ? { ...x, vehicle: reg } : x))),
		guides,
		setGuideStatus: (id, s) => setGuides((g) => g.map((x) => (x.id === id ? { ...x, status: s } : x))),
		registrations,
		setRegStatus: (id, s) => setRegistrations((r) => r.map((x) => (x.id === id ? { ...x, status: s } : x))),
		vehicles,
		setVehicleStatus: (id, s) => setVehicles((v) => v.map((x) => (x.id === id ? { ...x, status: s } : x))),
		assignDriverToVehicle: (vehId, driver) =>
			setVehicles((v) => v.map((x) => (x.id === vehId ? { ...x, driver } : x))),
		assignments,
		setAssignStatus: (id, s) => setAssignments((a) => a.map((x) => (x.id === id ? { ...x, status: s } : x))),
		staffAssign: (id, field, value) =>
			setAssignments((a) => a.map((x) => {
				if (x.id !== id) return x;
				const next = { ...x, [field]: value };
				if (next.driver && next.vehicle && (next.guide || !next.trip.includes("safari"))) {
					if (next.status === "Unassigned" || next.status === "Pending") next.status = "Upcoming";
				}
				return next;
			})),
		leave,
		setLeaveStatus: (id, s) => setLeave((l) => l.map((x) => (x.id === id ? { ...x, status: s } : x))),
		announcements,
		pushAnnouncement: (a) =>
			setAnnouncements((l) => [{ id: Math.max(0, ...l.map((x) => x.id)) + 1, date: "Today", ...a }, ...l]),
		confirm: admin.confirm,
		globalQuery: admin.globalQuery,
		go: admin.go,
	};

	return <Ctx.Provider value={ctx}>{children}</Ctx.Provider>;
}

/** true if driver already assigned on the same date (demo conflict check) */
export function driverBusy(assignments: Assignment[], date: string, driver: string) {
	return assignments.some((a) => a.date === date && a.driver === driver && a.status !== "Cancelled");
}
export function vehicleBusy(assignments: Assignment[], date: string, reg: string) {
	return assignments.some((a) => a.date === date && a.vehicle === reg && a.status !== "Cancelled");
}
