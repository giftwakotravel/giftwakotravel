import agreement from "@/data/driver-agreement.json";

export type Section =
	| "dashboard" | "profile" | "vehicles" | "documents" | "contract"
	| "jobs" | "trips" | "earnings" | "notifications" | "settings";

export const REQUIRED_DOCS = ["id_doc", "licence", "reg_cert", "licence_disc", "insurance"] as const;

export const DOC_TYPES: { key: string; label: string; vehicle?: boolean; required?: boolean }[] = [
	{ key: "id_doc", label: "SA ID document or passport", required: true },
	{ key: "selfie", label: "Selfie for identity verification" },
	{ key: "licence", label: "Driver's licence", required: true },
	{ key: "prdp", label: "Professional Driving Permit (PrDP)" },
	{ key: "reg_cert", label: "Vehicle registration certificate", vehicle: true, required: true },
	{ key: "ownership", label: "Proof of ownership / authorisation", vehicle: true },
	{ key: "roadworthy", label: "Roadworthiness certificate", vehicle: true },
	{ key: "licence_disc", label: "Vehicle licence disc", vehicle: true, required: true },
	{ key: "insurance", label: "Passenger liability insurance", vehicle: true, required: true },
	{ key: "op_licence", label: "Operating licence / permit", vehicle: true },
	{ key: "bank_proof", label: "Proof of bank account" },
];

export const VEHICLE_TYPES = ["Sedan", "Hatchback", "SUV", "Bakkie", "Minibus", "Minibus Taxi", "Coaster", "Bus", "Luxury Vehicle", "Other"];
export const SERVICES = ["Airport Transfers", "Local Transport", "Long-Distance Transport", "Event Transport", "Tours & Sightseeing", "Holiday Packages", "Group Transport", "Corporate Transport", "School Transport"];
export const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
export const PRICING = ["Per kilometre", "Per trip", "Per hour", "Per passenger", "Custom quotation"];

export function cleanRow<T extends Record<string, unknown>>(r: T, ints: string[] = []): T {
	const out: Record<string, unknown> = {};
	for (const [k, v] of Object.entries(r)) {
		if (v === "" || v === undefined) out[k] = null;
		else if (ints.includes(k)) out[k] = Number(v);
		else out[k] = v;
	}
	return out as T;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type R = Record<string, any>;

export function completion(p: R | null, vehicles: R[], docs: R[], contract: R | null): {
	pct: number;
	items: { label: string; done: boolean; section: Section }[];
} {
	const has = (k: string) => !!p?.[k];
	const docOk = (k: string, veh: boolean) =>
		docs.some((d) => d.doc_type === k && (!veh || d.vehicle_id != null));
	const items: { label: string; done: boolean; section: Section }[] = [
		{ label: "Personal details", done: has("full_name") && has("surname") && has("phone") && has("dob") && has("sa_id"), section: "profile" },
		{ label: "Address", done: has("address") && has("town") && has("province"), section: "profile" },
		{ label: "Emergency contact", done: has("emergency_name") && has("emergency_phone"), section: "profile" },
		{ label: "Licence", done: has("licence_number") && has("licence_code") && has("licence_expiry"), section: "profile" },
		{ label: "Services", done: (p?.services ?? []).length > 0, section: "profile" },
		{ label: "Banking", done: has("account_holder") && has("bank_name") && has("account_number"), section: "profile" },
		{ label: "Vehicle added", done: vehicles.length > 0, section: "vehicles" },
		{
			label: "Required documents",
			done: REQUIRED_DOCS.every((k) => docOk(k, !!DOC_TYPES.find((t) => t.key === k)?.vehicle)),
			section: "documents",
		},
		{ label: "Contract accepted", done: contract?.version === agreement.version, section: "contract" },
	];
	const done = items.filter((i) => i.done).length;
	return { pct: Math.round((done / items.length) * 100), items };
}
