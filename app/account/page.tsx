import type { Metadata } from "next";
import PageBand from "@/components/PageBand";
import AccountForm from "@/components/AccountForm";

export const metadata: Metadata = {
	title: "Sign in to your account",
	description:
		"Sign in to view your bookings, manage your details and keep track of your trips with GiftWako Travel.",
};

export default function Account() {
	return (
		<>
			<PageBand
				eyebrow="Your trips"
				title="Sign in to your account"
				lead="View your bookings, manage your details and keep track of your trips."
			/>
			<section className="gw-section has-global-padding">
				<div className="gw-wrap">
					<AccountForm mode="login" />
				</div>
			</section>
		</>
	);
}
