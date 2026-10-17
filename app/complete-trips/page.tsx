import type { Metadata } from "next";
import ServicePageView from "@/components/ServicePage";
import { SERVICE_PAGES } from "@/lib/data";

const page = SERVICE_PAGES.find((p) => p.slug === "complete-trips")!;

export const metadata: Metadata = { title: "Complete trips, planned for you", description: page.lead };

export default function Page() {
	return <ServicePageView page={page} />;
}
