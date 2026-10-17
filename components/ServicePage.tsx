import Link from "next/link";
import CtaBand from "@/components/CtaBand";
import PageBand, { BandButtons } from "@/components/PageBand";
import StaySearch from "@/components/StaySearch";
import type { ServicePage } from "@/lib/data";
import { waLink } from "@/lib/site";

function Note({ slug }: { slug: string }) {
	switch (slug) {
		case "group-day-trips":
			return (
				<p className="gw-small">
					Seats are first come, first served — a seat is only confirmed once the deposit is paid. See{" "}
					<Link href="/events/">upcoming events</Link> for the current dates.
				</p>
			);
		case "holiday-packages":
			return (
				<p className="gw-small">
					Current getaways, like Harties and Sun City, are listed under{" "}
					<Link href="/events/">upcoming events</Link>.
				</p>
			);
		case "transfers":
			return (
				<p className="gw-small">
					Tell us your route, dates and group size and we will quote for the vehicle, driver and trip.
				</p>
			);
		case "accommodation":
			return (
				<p className="gw-small">
					Accommodation inside a package is priced per person sharing unless stated otherwise.
				</p>
			);
		case "complete-trips":
			return (
				<p className="gw-small">
					Use the <Link href="/plan-a-trip/">plan a trip</Link> form for the fastest quote.
				</p>
			);
		case "groups-and-organisations":
			return (
				<p className="gw-small">
					Deposits and payment terms are confirmed in the written quote; see our{" "}
					<Link href="/refunds/">cancellations and refunds</Link> policy.
				</p>
			);
		default:
			return null;
	}
}

export default function ServicePageView({ page }: { page: ServicePage }) {
	return (
		<>
			<PageBand eyebrow="Our services" title={page.title} lead={page.lead}>
				<BandButtons
					primary={{ label: page.ctaLabel, href: page.ctaHref }}
					outline={{ label: "Ask on WhatsApp", href: waLink(page.waText) }}
					back={{ label: "Back to all tours & services", href: "/tours-and-services/" }}
				/>
			</PageBand>

			<section className="gw-section gw-section--xl has-global-padding">
				<div className="gw-wrap">
					{page.slug === "accommodation" && (
						<div style={{ marginBottom: "1.8rem" }}>
							<StaySearch />
						</div>
					)}
					<figure className="gw-svc-hero">
						{/* eslint-disable-next-line @next/next/no-img-element */}
						<img src={page.heroImage} alt={page.heroAlt} />
					</figure>
					<div className="gw-section__head">
						<p className="gw-eyebrow">What we arrange</p>
						<h2>{page.head}</h2>
						<p className="gw-section__lead">{page.headLead}</p>
					</div>
					<ul className="gw-ticks">
						{page.ticks.map((t) => (
							<li key={t}>{t}</li>
						))}
					</ul>
					<Note slug={page.slug} />
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
