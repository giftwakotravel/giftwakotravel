import type { Metadata } from "next";
import CtaBand from "@/components/CtaBand";
import PageBand, { BandButtons } from "@/components/PageBand";
import DriverRegForm from "@/components/DriverRegForm";

export const metadata: Metadata = {
	title: "Driver & vehicle registration",
	description: "Register as a GiftWako Travel driver — submit your credentials, vehicle details and documents in six steps.",
};

export default function DriverRegistrationPage() {
	return (
		<>
			<PageBand
				eyebrow="Drive with us"
				title="Driver & vehicle registration"
				lead="Register your vehicle and credentials with GiftWako Travel — our team verifies your documents and contacts you about trips and pricing."
			>
				<BandButtons back={{ label: "Back home", href: "/" }} />
			</PageBand>
			<section className="gw-section has-global-padding">
				<div className="gw-wrap">
					<DriverRegForm />
				</div>
			</section>
			<CtaBand
				heading="Questions about registering?"
				text="WhatsApp us and we will walk you through the process."
				button={{ label: "Ask on WhatsApp", href: "https://wa.me/27706178269" }}
			/>
		</>
	);
}
