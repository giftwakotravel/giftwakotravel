import Link from "next/link";
import type { Trip } from "@/lib/data";
import { waLink } from "@/lib/site";

export default function TripCard({ trip }: { trip: Trip }) {
	return (
		<div className="gw-trip">
			<div className="gw-trip__inner">
				<figure className="gw-trip__media">
					{/* eslint-disable-next-line @next/next/no-img-element */}
					<img src={trip.image} alt={trip.alt} />
					<figcaption>{trip.caption}</figcaption>
				</figure>
				<div className="gw-trip__body">
					<h3>{trip.title}</h3>
					<p className="gw-trip__meta" dangerouslySetInnerHTML={{ __html: metaHtml(trip.meta) }} />
					<p>{trip.blurb}</p>
					{trip.ticks && (
						<ul className="gw-ticks">
							{trip.ticks.map((t, i) =>
								typeof t === "string" ? (
									<li key={i}>{t}</li>
								) : (
									<li key={i}>
										<strong>{t.strong}</strong>
										{t.rest}
									</li>
								),
							)}
						</ul>
					)}
					{trip.priceHead && trip.priceRows && (
						<figure className="gw-price-table">
							<table>
								<thead>
									<tr>
										{trip.priceHead.map((h) => (
											<th key={h}>{h}</th>
										))}
									</tr>
								</thead>
								<tbody>
									{trip.priceRows.map((row, i) => (
										<tr key={i}>
											{row.map((cell, j) => (
												<td key={j}>{cell}</td>
											))}
										</tr>
									))}
								</tbody>
							</table>
						</figure>
					)}
					{trip.note && <p className="gw-small">{trip.note}</p>}
					<div className="gw-buttons">
						{trip.ctaHref.startsWith("http") || trip.ctaHref.startsWith("tel:") ? (
							<a className="gw-btn gw-btn--gold" href={trip.ctaHref}>
								{trip.ctaLabel}
							</a>
						) : (
							<Link className="gw-btn gw-btn--gold" href={trip.ctaHref}>
								{trip.ctaLabel}
							</Link>
						)}
						<a
							className="gw-btn gw-btn--outline gw-btn--outline-dark"
							href={trip.waHref ?? waLink(trip.waText)}
						>
							{trip.waLabel ?? "Ask on WhatsApp"}
						</a>
					</div>
				</div>
			</div>
		</div>
	);
}

function metaHtml(meta: string) {
	// "Label: value · Label2: value2" — bold the labels like the WP markup did.
	return meta
		.split(" · ")
		.map((part) => {
			const idx = part.indexOf(":");
			if (idx === -1) return part;
			return `<strong>${part.slice(0, idx + 1)}</strong>${part.slice(idx + 1)}`;
		})
		.join(" · ");
}
