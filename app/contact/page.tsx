import type { Metadata } from "next";
import Link from "next/link";
import PageBand from "@/components/PageBand";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
	title: "Contact us",
	description: "Reach GiftWako Travel by email, phone, WhatsApp, or visit our office in Aqua Park, Tzaneen.",
};

export default function Contact() {
	return (
		<>
			<PageBand eyebrow="Contact us" title="Contact us" lead="">
				<p className="gw-lead">
					The quickest way to start planning is the{" "}
					<Link href="/plan-a-trip/">trip request form</Link>. For anything else, here is how to reach us.
				</p>
			</PageBand>

			<section className="gw-section gw-section--xl has-global-padding">
				<div className="gw-wrap">
					<div className="gw-contact-grid">
						<div className="gw-card">
							<figure className="gw-icon" style={{ margin: 0 }}>
								{/* eslint-disable-next-line @next/next/no-img-element */}
								<img src="/icons/chat.svg" alt="" width={44} height={44} />
							</figure>
							<h3>Email</h3>
							<p>
								<a href={`mailto:${SITE.email}`}>{SITE.email}</a>
							</p>
						</div>
						<div className="gw-card">
							<figure className="gw-icon" style={{ margin: 0 }}>
								{/* eslint-disable-next-line @next/next/no-img-element */}
								<img src="/icons/chat.svg" alt="" width={44} height={44} />
							</figure>
							<h3>Phone and WhatsApp</h3>
							<p>
								<a href={SITE.phoneTel}>{SITE.phone}</a>
							</p>
							<p>
								<a href={`https://wa.me/${SITE.whatsapp}`}>{SITE.whatsappDisplay}</a>
							</p>
						</div>
						<div className="gw-card">
							<figure className="gw-icon" style={{ margin: 0 }}>
								{/* eslint-disable-next-line @next/next/no-img-element */}
								<img src="/icons/map.svg" alt="" width={44} height={44} />
							</figure>
							<h3>Office</h3>
							<p>17 Gerrit Kruger Street</p>
							<p>Aqua Park, Tzaneen 0850</p>
						</div>
					</div>

					<h2 style={{ marginTop: "var(--gw-space-xl)", fontSize: "var(--gw-fs-xxlarge)" }}>
						Already booked?
					</h2>
					<p>Sign in to see your trips, or quote your booking reference when you contact us.</p>
					<div className="gw-buttons">
						<Link className="gw-btn" href="/my-trips/">
							My trips
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
