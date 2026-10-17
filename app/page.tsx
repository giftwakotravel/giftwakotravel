import Link from "next/link";
import CtaBand from "@/components/CtaBand";
import PropSearch from "@/components/PropSearch";
import EventsExplore from "@/components/EventsExplore";

export default function Home() {
	return (
		<>
			{/* ---------- hero ---------- */}
			<div className="gw-hero has-global-padding">
				<div className="gw-hero__bg">
					{/* eslint-disable-next-line @next/next/no-img-element */}
					<img src="/images/hero-van.jpg" alt="GiftWako Travel branded minibus" />
				</div>
				<div className="gw-wrap" style={{ width: "100%", position: "relative", zIndex: 1 }}>
					<div className="gw-hero__copy">
						<p className="gw-eyebrow">Tours · Transfers · Stays · Complete trips</p>
						<h1>
							Your next adventure starts <em className="gw-script">here</em>
						</h1>
						<p className="gw-hero__lead">
							Day trips, getaways, transfers and complete holidays from Limpopo and beyond. Tell us where
							you would like to go and we will put it together with a clear quote.
						</p>
						<div className="gw-buttons">
							<Link className="gw-btn gw-btn--gold" href="/tours-and-services/">
								Book Now
							</Link>
							<Link className="gw-btn gw-btn--outline" href="/plan-a-trip/">
								Plan your trip
							</Link>
						</div>
						<PropSearch />
					</div>
				</div>
			</div>

			<EventsExplore />

			<CtaBand
				heading="Ready for your next journey?"
				text="Tell us where you want to go, and let GiftWako Travel help you plan your adventure."
				button={{ label: "Plan your trip", href: "/plan-a-trip/" }}
			/>
		</>
	);
}
