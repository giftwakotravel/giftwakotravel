import type { Metadata } from "next";
import DriverPortal from "@/components/driver/DriverPortal";

export const metadata: Metadata = {
	title: "Driver Portal",
	robots: { index: false },
};

export default function DriverPortalPage() {
	return <DriverPortal />;
}
