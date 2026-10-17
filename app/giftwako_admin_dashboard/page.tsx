import type { Metadata } from "next";
import AdminDash from "@/components/admin/AdminDash";
import AdminGate from "@/components/admin/AdminGate";

export const metadata: Metadata = {
	title: "GiftWako Admin Dashboard",
	description: "Platform administration.",
	robots: { index: false },
};

export default function GiftwakoAdminDashboard() {
	return (
		<AdminGate>
			<AdminDash />
		</AdminGate>
	);
}
