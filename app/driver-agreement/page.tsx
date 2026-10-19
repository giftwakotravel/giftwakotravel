import type { Metadata } from "next";
import PageBand, { BandButtons } from "@/components/PageBand";
import agreement from "@/data/driver-agreement.json";

export const metadata: Metadata = {
	title: agreement.title,
	description: "The GiftWako Travel affiliation agreement — read before accepting on the registration form.",
};

export default function DriverAgreementPage() {
	return (
		<>
			<PageBand
				eyebrow="Drive with us"
				title={agreement.title}
				lead={`Version ${agreement.version} — please read before accepting on the registration form`}
			>
				<BandButtons back={{ label: "Back to registration", href: "/driver-registration" }} />
			</PageBand>
			<section className="gw-section has-global-padding">
				<div className="gw-wrap">
					<div className="gw-agreement">
						<p>{agreement.intro}</p>
						<h3>{agreement.part_a.heading}</h3>
						<ul>
							{agreement.part_a.company_details.map((d, i) => <li key={i}>{d}</li>)}
						</ul>
						<p className="gw-small">{agreement.part_a.affiliate_note}</p>
						<h3>Our vision</h3>
						<p>{agreement.vision}</p>
						{agreement.sections.map((sec) => (
							<div key={sec.heading}>
								<h3>{sec.heading}</h3>
								{sec.clauses.map((c, i) => <p key={i}>{c}</p>)}
							</div>
						))}
						<h3>Acceptance</h3>
						<p>{agreement.acceptance}</p>
						<p className="gw-small">{agreement.contact}</p>
						<div className="gw-buttons" style={{ marginTop: "1.4rem" }}>
							<a className="gw-btn gw-btn--gold" href="/docs/driver-service-agreement.pdf" target="_blank" rel="noreferrer">Download PDF</a>
						</div>
					</div>
				</div>
			</section>
		</>
	);
}
