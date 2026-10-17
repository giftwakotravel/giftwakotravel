import Link from "next/link";
import PageBand from "@/components/PageBand";

export default function NotFound() {
	return (
		<>
			<PageBand eyebrow="404" title="This page took a different trip" />
			<section className="gw-section has-global-padding">
				<div className="gw-wrap">
					<p className="gw-lead">
						The page you are looking for does not exist — but your next adventure is one click away.
					</p>
					<div className="gw-buttons">
						<Link className="gw-btn gw-btn--gold" href="/">
							Back to home
						</Link>
						<Link className="gw-btn gw-btn--outline gw-btn--outline-dark" href="/plan-a-trip/">
							Plan a trip
						</Link>
					</div>
				</div>
			</section>
		</>
	);
}
