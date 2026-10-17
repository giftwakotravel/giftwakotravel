import type { Metadata } from "next";
import PageBand from "@/components/PageBand";
import AccountForm from "@/components/AccountForm";

export const metadata: Metadata = {
	title: "Create your account",
	description:
		"Create a free GiftWako Travel account to manage bookings and keep track of your trips.",
};

export default function SignUp() {
	return (
		<>
			<PageBand
				eyebrow="Join us"
				title="Create your account"
				lead="Sign up to save your details and keep track of your trips."
			/>
			<section className="gw-section has-global-padding">
				<div className="gw-wrap">
					<AccountForm mode="register" />
				</div>
			</section>
		</>
	);
}
