import Link from "next/link";
import { notFound } from "next/navigation";
import CtaBand from "@/components/CtaBand";
import PageBand, { BandButtons } from "@/components/PageBand";
import EventBooking, { type EvDetail } from "@/components/EventBooking";
import { supabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export default async function EventPage({ params }: { params: Promise<{ id: string }> }) {
	const { id } = await params;
	const db = supabase();
	if (!/^\d+$/.test(id) || !db) notFound();

	const { data: ev } = await db
		.from("events")
		.select("*")
		.eq("id", id)
		.single();

	if (!ev || ev.visible === false) notFound();

	const dateLabel = ev.event_date
		? new Date(ev.event_date + "T00:00:00").toLocaleDateString("en-ZA", { weekday: "long", day: "numeric", month: "long", year: "numeric" })
		: null;

	return (
		<>
			<PageBand
				eyebrow="Event"
				title={ev.title}
				lead={[ev.featuring ? `Featuring ${ev.featuring}` : null, dateLabel, ev.venue ?? ev.location]
					.filter(Boolean)
					.join(" · ")}
			>
				<BandButtons back={{ label: "Back to all events", href: "/#explore" }} />
			</PageBand>

			<section className="gw-section has-global-padding">
				<div className="gw-wrap">
					{/* event information */}
					<div className="gw-evdetail">
						<div className="gw-evdetail__img">
							{ev.image ? (
								/* eslint-disable-next-line @next/next/no-img-element */
								<img src={ev.image} alt={ev.title} />
							) : (
								<span className="gw-evcard__ph" aria-hidden="true">Event poster</span>
							)}
						</div>
						<div className="gw-evdetail__body">
							{ev.price != null && (
								<p className="gw-evdetail__price">R{ev.price.toLocaleString("en-ZA")} <small>per person</small></p>
							)}
							{ev.description && <p className="gw-evdetail__desc">{ev.description}</p>}
							<dl className="gw-evdetail__facts">
								{ev.featuring && <><dt>Featuring</dt><dd>{ev.featuring}</dd></>}
								{dateLabel && <><dt>Date</dt><dd>{dateLabel}</dd></>}
								{ev.venue && <><dt>Venue</dt><dd>{ev.venue}</dd></>}
								{ev.location && <><dt>Town / area</dt><dd>{ev.location}</dd></>}
								<dt>Presented by</dt><dd>{ev.presented_by || "GiftWako Travel"}</dd>
							</dl>
						</div>
					</div>

					{/* booking flow */}
					<div className="gw-section__head" style={{ marginTop: "2.5rem" }}>
						<h2>Book your spot</h2>
						<p className="gw-section__lead">
							Choose how you want to attend — we confirm ticket prices and availability with the organiser
							before anything is booked.
						</p>
					</div>
					<EventBooking ev={ev as EvDetail} />
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
