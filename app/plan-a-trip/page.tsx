import type { Metadata } from "next";
import PageBand from "@/components/PageBand";
import TripRequestForm from "@/components/TripRequestForm";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
	title: "Plan a trip",
	description:
		"Tell us where you want to go, when you want to travel, and what kind of experience you're looking for. We'll help you plan your journey and provide a personalised quotation.",
};

export default function PlanATrip() {
	return (
		<>
			<PageBand
				eyebrow="Plan a trip"
				title="Plan your trip"
				lead="Tell us where you want to go, when you want to travel, and what kind of experience you're looking for. We'll help you plan your journey and provide a personalised quotation."
			/>
			<section className="gw-section has-global-padding" id="trip-request">
				<div className="gw-wrap">
					<TripRequestForm />
					<p>
						Prefer to talk? WhatsApp us on{" "}
						<a href={`https://wa.me/${SITE.whatsapp}`}>070 617 8269</a> or email{" "}
						<a href={`mailto:${SITE.email}`}>{SITE.email}</a>.
					</p>
				</div>
			</section>
		</>
	);
}
