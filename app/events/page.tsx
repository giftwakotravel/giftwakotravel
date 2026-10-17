import type { Metadata } from "next";
import Link from "next/link";
import CtaBand from "@/components/CtaBand";
import PageBand, { BandButtons } from "@/components/PageBand";
import TripCard from "@/components/TripCard";
import { EVENT_TRIPS } from "@/lib/data";

export const metadata: Metadata = {
	title: "Upcoming events",
	description:
		"Group trips, getaways and event travel — every date GiftWako Travel currently has open for booking.",
};

export default function Events() {
	return (
		<>
			<PageBand
				eyebrow="Events"
				title="Upcoming events"
				lead="Group trips, getaways and event travel — every date we currently have open for booking. Seats are limited and a seat is only confirmed once your deposit is paid."
			>
				<BandButtons
					primary={{ label: "Request a quote", href: "/plan-a-trip/" }}
					outline={{
						label: "Ask on WhatsApp",
						href: "https://wa.me/27706178269?text=Hi%20GiftWako%2C%20I%20would%20like%20to%20ask%20about%20an%20event",
					}}
					back={{ label: "Back to all tours & services", href: "/tours-and-services/" }}
				/>
			</PageBand>

			<section className="gw-section gw-section--xl has-global-padding">
				<div className="gw-wrap">
					<div className="gw-section__head">
						<p className="gw-eyebrow">What's on</p>
						<h2>Dates open for booking</h2>
						<p className="gw-section__lead">
							Every event below runs on a set date. Open one for full details, prices and pickup towns.
						</p>
					</div>
					{EVENT_TRIPS.map((t) => (
						<TripCard key={t.slug} trip={t} />
					))}
					<div className="gw-referral">
						<h3>Planning around an event?</h3>
						<p>
							Going to a concert, festival, wedding or sport weekend? Tell us the event and we quote
							transport and accommodation for your group.{" "}
							<Link href="/plan-a-trip/">Request a quote</Link>.
						</p>
					</div>
				</div>
			</section>

			<CtaBand
				heading="Looking for something else?"
				text="Most of the trips we arrange start as a simple request. Tell us where, when and who is travelling, and we will quote for it."
				button={{ label: "Plan a trip", href: "/plan-a-trip/" }}
			/>
		</>
	);
}
