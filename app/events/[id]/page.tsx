import Link from "next/link";
import { notFound } from "next/navigation";
import CtaBand from "@/components/CtaBand";
import PageBand, { BandButtons } from "@/components/PageBand";
import EventBooking, { type EvDetail } from "@/components/EventBooking";
import { supabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export default async function EventPage({
	params,
	searchParams,
}: {
	params: Promise<{ id: string }>;
	searchParams: Promise<{ preview?: string }>;
}) {
	const { id } = await params;
	const { preview } = await searchParams;
	const db = supabase();
	if (!/^\d+$/.test(id) || !db) notFound();

	const { data: ev } = await db
		.from("events")
		.select("*")
		.eq("id", id)
		.single();

	const published = ev && (ev.status === "published" || (ev.status == null && ev.visible !== false));
	if (!ev || (!published && preview !== "1")) notFound();

	const d = (s: string) => new Date(s + "T00:00:00").toLocaleDateString("en-ZA", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
	const dateLabel = ev.event_date
		? ev.end_date ? `${d(ev.event_date)} → ${d(ev.end_date)}` : d(ev.event_date)
		: null;
	const times = [
		ev.doors_time && `Doors ${ev.doors_time}`,
		ev.start_time && `Starts ${ev.start_time}`,
		ev.end_time && `Ends ${ev.end_time}`,
	].filter(Boolean).join(" · ");

	return (
		<>
			<PageBand
				eyebrow={[ev.category, !published ? "Draft preview" : null].filter(Boolean).join(" · ") || "Event"}
				title={ev.title}
				lead={[ev.featuring ? `Featuring ${ev.featuring}` : null, ev.short_desc]
					.filter(Boolean)[0] ?? ""}
			>
				<BandButtons back={{ label: "Back to all events", href: "/#explore" }} />
			</PageBand>

			<section className="gw-section has-global-padding">
				<div className="gw-wrap">
					{ev.badge && <span className="gw-badge">{ev.badge}</span>}
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
								<p className="gw-evdetail__price">From R{ev.price.toLocaleString("en-ZA")} <small>per person</small></p>
							)}
							{ev.description && <p className="gw-evdetail__desc">{ev.description}</p>}
							<dl className="gw-evdetail__facts">
								{ev.featuring && <><dt>Featuring</dt><dd>{ev.featuring}</dd></>}
								{dateLabel && <><dt>Date</dt><dd>{dateLabel}</dd></>}
								{times && <><dt>Times</dt><dd>{times}</dd></>}
								{ev.venue && <><dt>Venue</dt><dd>{ev.venue}</dd></>}
								{(ev.street || ev.location || ev.province) && (
									<><dt>Address</dt><dd>{[ev.street, ev.location, ev.province].filter(Boolean).join(", ")}</dd></>
								)}
								{ev.maps_url && <><dt>Map</dt><dd><a href={ev.maps_url} target="_blank" rel="noreferrer">Open in Google Maps ↗</a></dd></>}
								{ev.organiser && <><dt>Organiser</dt><dd>{ev.organiser}</dd></>}
								<dt>Presented by</dt><dd>{ev.presented_by || "GiftWako Travel"}</dd>
							</dl>
						</div>
					</div>

					{/* gallery */}
					{Array.isArray(ev.gallery) && ev.gallery.length > 0 && (
						<div className="gw-evgallery">
							{ev.gallery.map((g: string) => (
								/* eslint-disable-next-line @next/next/no-img-element */
								<img key={g} src={g} alt={`${ev.title} gallery`} />
							))}
						</div>
					)}

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
