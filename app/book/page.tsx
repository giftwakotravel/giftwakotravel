import type { Metadata } from "next";
import CtaBand from "@/components/CtaBand";
import PageBand, { BandButtons } from "@/components/PageBand";
import ServiceSelect from "@/components/book/ServiceSelect";

export const metadata: Metadata = {
	title: "Book a service",
	description: "Book transport, accommodation, trips, events and more with GiftWako Travel — check availability online.",
};

export default function BookPage() {
	return (
		<>
			<PageBand
				eyebrow="Book online"
				title="What are you looking for?"
				lead="Select the service you need."
			>
				<BandButtons back={{ label: "Back home", href: "/" }} />
			</PageBand>
			<section className="gw-section has-global-padding">
				<div className="gw-wrap">
					<ServiceSelect />
				</div>
			</section>
			<CtaBand
				heading="Not sure what you need?"
				text="Tell us about your trip and we will suggest the best option."
				button={{ label: "Plan a trip", href: "/plan-a-trip/" }}
			/>
		</>
	);
}
