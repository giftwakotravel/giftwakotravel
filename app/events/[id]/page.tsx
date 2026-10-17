import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import CtaBand from "@/components/CtaBand";
import PageBand, { BandButtons } from "@/components/PageBand";

export const dynamic = "force-dynamic";

const sb = createClient(
	process.env.NEXT_PUBLIC_SUPABASE_URL!,
	process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

export default async function EventPage({ params }: { params: Promise<{ id: string }> }) {
	const { id } = await params;
	if (!/^\d+$/.test(id)) notFound();

	const { data: ev } = await sb
		.from("events")
		.select("*")
		.eq("id", id)
		.single();

	if (!ev || ev.visible === false) notFound();

	const planHref = `/plan-a-trip/?${new URLSearchParams({
		trip_type: "Holiday package",
		destination_area: `${ev.title}${ev.location ? `, ${ev.location}` : ""}`,
		...(ev.event_date ? { departure_date: ev.event_date } : {}),
	}).toString()}`;

	return (
		<>
			<PageBand eyebrow="Events" title={ev.title} lead={[ev.location, ev.event_date].filter(Boolean).join(" · ") || "GiftWako event"}>
				<BandButtons
					primary={{ label: "I'm going — book my seat", href: planHref }}
					outline={{ label: "Ask on WhatsApp", href: `https://wa.me/27706178269?text=${encodeURIComponent(`Hi GiftWako, I'm interested in "${ev.title}"`)}` }}
					back={{ label: "Back to all events", href: "/#explore" }}
				/>
			</PageBand>

			<section className="gw-section has-global-padding">
				<div className="gw-wrap">
					<div className="gw-evdetail">
						<div className="gw-evdetail__img">
							{ev.image ? (
								/* eslint-disable-next-line @next/next/no-img-element */
								<img src={ev.image} alt={ev.title} />
							) : (
								<span className="gw-evcard__ph" aria-hidden="true">GiftWako event</span>
							)}
						</div>
						<div className="gw-evdetail__body">
							{ev.price != null && (
								<p className="gw-evdetail__price">R{ev.price.toLocaleString("en-ZA")} <small>per person</small></p>
							)}
							{ev.description && <p className="gw-evdetail__desc">{ev.description}</p>}
							<dl className="gw-evdetail__facts">
								{ev.location && <><dt>Location</dt><dd>{ev.location}</dd></>}
								{ev.event_date && <><dt>Date</dt><dd>{new Date(ev.event_date + "T00:00:00").toLocaleDateString("en-ZA", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</dd></>}
							</dl>
							<div className="gw-buttons" style={{ marginTop: "1.2rem" }}>
								<Link className="gw-btn gw-btn--gold" href={planHref}>Going — request a seat</Link>
							</div>
							<p className="gw-small" style={{ marginTop: "0.8rem" }}>Nothing is booked until you accept a written quote.</p>
						</div>
					</div>
				</div>
			</section>

			<CtaBand
				heading="Organising a group?"
				text="We can arrange private trips, school outings and church groups on dates that suit you."
				button={{ label: "Plan a trip", href: "/plan-a-trip/" }}
			/>
		</>
	);
}
