import type { Metadata } from "next";
import AdminDash from "@/components/admin/AdminDash";

export const metadata: Metadata = {
	title: "Gifwako Admin Dashboard",
	description: "Platform administration — demonstration interface.",
	robots: { index: false },
};

export default function GifwakoAdminDashboard() {
	return <AdminDash />;
}
