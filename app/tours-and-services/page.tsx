import type { Metadata } from "next";
import ServiceSurvey from "@/components/ServiceSurvey";

export const metadata: Metadata = {
	title: "Tours & services",
	description:
		"Tell us what you need — tours, getaways, transport, accommodation, flights, complete trips, groups or events — and we will quote for it.",
};

export default function ToursAndServices() {
	return (
		<section className="gw-section gw-section--xl has-global-padding">
			<div className="gw-wrap" style={{ maxWidth: "56rem" }}>
				<ServiceSurvey />
			</div>
		</section>
	);
}
