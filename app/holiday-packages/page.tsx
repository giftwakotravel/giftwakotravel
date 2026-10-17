import type { Metadata } from "next";
import ServicePageView from "@/components/ServicePage";
import { SERVICE_PAGES } from "@/lib/data";

const page = SERVICE_PAGES.find((p) => p.slug === "holiday-packages")!;

export const metadata: Metadata = { title: "Getaways and holiday packages", description: page.lead };

export default function Page() {
	return <ServicePageView page={page} />;
}
