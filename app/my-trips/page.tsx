import type { Metadata } from "next";
import PageBand from "@/components/PageBand";
import AccountForm from "@/components/AccountForm";

export const metadata: Metadata = {
	title: "My trips",
	description: "Sign in to see your booked and upcoming trips with GiftWako Travel.",
};

export default function MyTrips() {
	return (
		<>
			<PageBand
				eyebrow="Your account"
				title="My trips"
				lead="Sign in to see your booked and upcoming trips."
			/>
			<section className="gw-section has-global-padding">
				<div className="gw-wrap">
					<AccountForm mode="login" />
				</div>
			</section>
		</>
	);
}
