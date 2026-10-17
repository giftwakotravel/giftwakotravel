import type { Metadata } from "next";
import ServicePageView from "@/components/ServicePage";
import { SERVICE_PAGES } from "@/lib/data";

const page = SERVICE_PAGES.find((p) => p.slug === "group-day-trips")!;

export const metadata: Metadata = { title: "Group day trips and tours", description: page.lead };

export default function Page() {
	return <ServicePageView page={page} />;
}
