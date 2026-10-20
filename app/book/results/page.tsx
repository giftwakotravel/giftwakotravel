import type { Metadata } from "next";
import { Suspense } from "react";
import PageBand, { BandButtons } from "@/components/PageBand";
import Results from "@/components/book/Results";

export const metadata: Metadata = {
	title: "Available options",
	robots: { index: false },
};

export default function BookResultsPage() {
	return (
		<>
			<PageBand
				eyebrow="Book online"
				title="Available options"
				lead="Everything below is available for your dates — request a booking and we confirm by WhatsApp."
			>
				<BandButtons back={{ label: "Change search", href: "/book" }} />
			</PageBand>
			<section className="gw-section has-global-padding">
				<div className="gw-wrap">
					<Suspense fallback={<p className="gw-small">Loading…</p>}>
						<Results />
					</Suspense>
				</div>
			</section>
		</>
	);
}
