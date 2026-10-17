/* Departments and job roles for GiftWako Travel staff assignments. */

export const ROLE_DEPARTMENTS: { dept: string; roles: string[] }[] = [
	{
		dept: "Management & Administration",
		roles: ["Super Admin", "Business Owner", "General Manager", "Branch Manager", "Operations Manager", "HR Manager"],
	},
	{
		dept: "Travel & Bookings",
		roles: ["Travel Agent", "Booking Manager", "Tour Coordinator", "Holiday Package Manager", "Flight Booking Agent", "Accommodation Agent", "Visa & Travel Documentation Officer"],
	},
	{
		dept: "Transport",
		roles: ["Transport Manager", "Fleet Manager", "Driver", "Driver Supervisor", "Route Coordinator", "Transport Booking Agent", "Vehicle Maintenance Officer"],
	},
	{
		dept: "Events",
		roles: ["Events Manager", "Event Coordinator", "Event Administrator", "Ticketing Officer", "Event Booking Agent", "Promotions Officer", "Tour Guide"],
	},
	{
		dept: "Accommodation & Tourism",
		roles: ["Accommodation Manager", "Hotel Liaison Officer", "Tour Guide Coordinator", "Activities Coordinator", "Customer Experience Officer"],
	},
	{
		dept: "Finance",
		roles: ["Finance Manager", "Accountant", "Cashier", "Payments Officer", "Payroll Officer", "Commission Manager"],
	},
	{
		dept: "Customer Service",
		roles: ["Customer Support Agent", "WhatsApp Support Agent", "Complaints Officer", "Booking Support Agent", "Customer Relations Manager"],
	},
	{
		dept: "Marketing & Sales",
		roles: ["Marketing Manager", "Social Media Manager", "Graphic Designer", "Sales Agent", "Digital Marketing Specialist", "Content Creator", "Affiliate Manager"],
	},
	{
		dept: "Website & Technology",
		roles: ["System Administrator", "Website Manager", "Event Publisher", "Content Editor", "IT Support Officer", "Data Analyst"],
	},
];

export const ALL_ROLES: string[] = ROLE_DEPARTMENTS.flatMap((d) => d.roles);

export const DEPT_NAMES: string[] = ROLE_DEPARTMENTS.map((d) => d.dept);

/** Renders grouped options for a <select>: dept optgroup → roles. */
export function RoleOptions() {
	return ROLE_DEPARTMENTS.map((d) => (
		<optgroup label={d.dept} key={d.dept}>
			{d.roles.map((r) => <option key={r}>{r}</option>)}
		</optgroup>
	));
}
