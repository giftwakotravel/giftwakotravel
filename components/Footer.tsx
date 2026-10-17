import Link from "next/link";
import { FOOTER_EXPLORE, FOOTER_LEGAL, FOOTER_TRIPS, SITE } from "@/lib/site";

export default function Footer() {
	return (
		<footer className="gw-footer has-global-padding">
			<div className="gw-wrap gw-footer__grid">
				<div className="gw-footer__about">
					<Link className="gw-footer__brand" href="/">
						{/* eslint-disable-next-line @next/next/no-img-element */}
						<img src="/images/giftwako-logo.png" alt="" width={48} height={48} />
						<span className="gw-brand__text">{SITE.name}</span>
					</Link>
					<p>{SITE.about}</p>
					<div className="gw-social">
						<a href={SITE.social.facebook} target="_blank" rel="noopener noreferrer">Facebook</a>
						<a href={SITE.social.instagram} target="_blank" rel="noopener noreferrer">Instagram</a>
					</div>
				</div>
				<nav aria-label="Explore">
					<h2 className="gw-footer__heading">Explore</h2>
					<ul>
						{FOOTER_EXPLORE.map((l) => (
							<li key={l.href}><Link href={l.href}>{l.label}</Link></li>
						))}
					</ul>
				</nav>
				<nav aria-label="Your trips">
					<h2 className="gw-footer__heading">Your trips</h2>
					<ul>
						{FOOTER_TRIPS.map((l) => (
							<li key={l.href}><Link href={l.href}>{l.label}</Link></li>
						))}
					</ul>
				</nav>
				<nav aria-label="Legal">
					<h2 className="gw-footer__heading">Legal</h2>
					<ul>
						{FOOTER_LEGAL.map((l) => (
							<li key={l.href}><Link href={l.href}>{l.label}</Link></li>
						))}
					</ul>
				</nav>
				<ul className="gw-footer__contact">
					<li><a href={SITE.phoneTel}>{SITE.phone}</a></li>
					<li><a href={`https://wa.me/${SITE.whatsapp}`}>{SITE.whatsappDisplay}</a></li>
					<li><a href={`mailto:${SITE.email}`}>{SITE.email}</a></li>
				</ul>
			</div>
			<div className="gw-wrap gw-footer__bottom">
				<p>© 2026 {SITE.legalName} · Registration number {SITE.registration} · South Africa</p>
			</div>
		</footer>
	);
}
