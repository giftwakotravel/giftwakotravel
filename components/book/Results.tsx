"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { waLink } from "@/lib/site";
import BookingForm from "@/components/book/BookingForm";
import {
	fmtR, loadAccommodation, loadEvents, loadPackages, loadTransport, SERVICE_OPTIONS,
	type BookQuery, type R, type ServiceKey,
} from "@/lib/booking";

const fmtDate = (s?: string | null) => (s ? new Date(s + "T00:00:00").toLocaleDateString("en-ZA", { day: "numeric", month: "long", year: "numeric" }) : "—");

export default function Results() {
	const params = useSearchParams();
	const q: BookQuery = {
		service: (params.get("service") ?? "all") as ServiceKey,
		from: params.get("from") ?? "",
		to: params.get("to") ?? "",
		pax: Math.max(1, Number(params.get("pax")) || 1),
		type: params.get("type") ?? undefined,
		pickup: params.get("pickup") ?? undefined,
		event_id: params.get("event_id") ?? undefined,
		dest: params.get("dest") ?? undefined,
	};
	const services: ServiceKey[] = q.service === "all"
		? ["tours", "getaways", "transport", "accommodation", "complete", "groups", "events", "airways"]
		: [q.service];

	const [data, setData] = useState<Record<string, { items: R[]; also?: R[]; reason?: string }>>({});
	const [event, setEvent] = useState<R | null>(null);
	const [booking, setBooking] = useState<{ service: string; item: R } | null>(null);
	const [tick, setTick] = useState(0);

	const load = useCallback(async () => {
		const out: Record<string, { items: R[]; also?: R[]; reason?: string }> = {};
		for (const s of services) {
			if (s === "transport") out.transport = await loadTransport(q);
			else if (s === "accommodation") out.accommodation = await loadAccommodation(q);
			else if (s === "events") out.events = await loadEvents(q);
			else if (s === "airways") { /* panel only */ }
			else out[s] = await loadPackages(q, s);
		}
		setData(out);
		if (q.event_id) {
			const c = supabase();
			if (c) {
				const { data: ev } = await c.from("events").select("id,title,event_date,location,venue").eq("id", q.event_id).maybeSingle();
				setEvent(ev);
			}
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [params.toString(), tick]);

	useEffect(() => { void load(); }, [load]);

	const back = `/book/?service=${q.service}${q.from ? `&from=${q.from}` : ""}${q.to ? `&to=${q.to}` : ""}&pax=${q.pax}`;

	const QUOTE_TYPE: Record<string, string> = {
		tours: "City tour", getaways: "Holiday package", transport: "Airport transfer",
		accommodation: "Accommodation only", complete: "Holiday package", airways: "Other",
		groups: "Other", events: "Other",
	};
	const quoteHref = (s: string) =>
		`/plan-a-trip/?trip_type=${encodeURIComponent(QUOTE_TYPE[s] ?? "Other")}${q.from ? `&departure_date=${q.from}` : ""}${q.to ? `&return_date=${q.to}` : ""}&adults=${q.pax}`;

	const CustomCTA = ({ s }: { s: string }) => (
		<div className="gw-book__card gw-book__card--cta" style={{ marginTop: "1rem" }}>
			<div className="gw-book__card-body">
				<h3>Need something different?</h3>
				<p className="gw-book__sub">Tell us what you need and we will put together a written quote.</p>
				<div className="gw-book__card-foot">
					<Link className="gw-btn gw-btn--outline gw-btn--outline-dark gw-btn--small" href={quoteHref(s)}>Request a custom quote</Link>
				</div>
			</div>
		</div>
	);
	const seeAll = (s: string) => {
		const p = new URLSearchParams(params.toString());
		p.set("service", s);
		return `/book/results?${p.toString()}`;
	};

	const Card = ({ service, item, img, alt, title, sub, chips, price, foot }: {
		service: string; item: R; img?: string | null; alt?: string;
		title: string; sub?: React.ReactNode; chips?: React.ReactNode[];
		price?: string; foot?: React.ReactNode;
	}) => (
		<article className="gw-book__card">
			{/* eslint-disable-next-line @next/next/no-img-element */}
			<img src={img || "/images/transfers.jpg"} alt={alt ?? title} />
			<div className="gw-book__card-body">
				<h3>{title}</h3>
				{sub && <p className="gw-book__sub">{sub}</p>}
				{chips && chips.length > 0 && <div className="gw-book__chips">{chips.map((c, i) => <span key={i}>{c}</span>)}</div>}
				{price && <p className="gw-book__price">{price}</p>}
				<div className="gw-book__card-foot">{foot}</div>
			</div>
		</article>
	);

	const Section = ({ id, label, children, items }: { id: string; label: string; children: React.ReactNode; items?: R[] }) => (
		<section className="gw-book__sec" id={id}>
			<div className="gw-section__head">
				<h2>{label}</h2>
				{q.service === "all" && <Link className="gw-btn gw-btn--outline gw-btn--outline-dark gw-btn--small" href={seeAll(id)}>See all →</Link>}
			</div>
			{children}
		</section>
	);

	const Empty = ({ text }: { text: string }) => <p className="gw-book__empty">{text}</p>;

	const VehicleCard = (v: R) => (
		<Card
			key={v.id} service="transport" item={v}
			img={v.photo_urls?.[0]} alt={`${v.make} ${v.model}`}
			title={`${v.make} ${v.model}${v.year ? ` (${v.year})` : ""}`}
			sub={`${v.vehicle_type ?? ""} · Seats ${v.capacity ?? "?"}`}
			chips={[v.aircon ? "Aircon" : null, v.luggage ? `${v.luggage} luggage` : null].filter(Boolean)}
			price={v.per_day != null || v.per_km != null
				? `From ${fmtR(v.per_day)}/day${v.per_km != null ? ` · ${fmtR(v.per_km)}/km` : ""}`
				: "Price on request"}
			foot={(
				<>
					<span className="gw-small">Available {q.from ? fmtDate(q.from) : "on request"}{q.to && q.to !== q.from ? ` → ${fmtDate(q.to)}` : ""}</span>
					<button className="gw-btn gw-btn--gold gw-btn--small" onClick={() => setBooking({ service: "transport", item: v })}>Book now</button>
				</>
			)}
		/>
	);

	return (
		<>
			<div className="gw-book__bar">
				<span><strong>{SERVICE_OPTIONS.find((s) => s.key === q.service)?.label}</strong> · {q.from ? fmtDate(q.from) : "Any dates"}{q.to && q.to !== q.from ? ` → ${fmtDate(q.to)}` : ""} · {q.pax} traveller{q.pax === 1 ? "" : "s"}{q.type ? ` · ${q.type}` : ""}{q.pickup ? ` · from ${q.pickup}` : ""}</span>
				<Link href={back} className="gw-btn gw-btn--outline gw-btn--outline-dark gw-btn--small">Change</Link>
			</div>

			{event && services.includes("transport") && (
				<p className="gw-denote" style={{ marginBottom: "1.2rem" }}>
					<strong>Transport to {event.title}</strong> on {fmtDate(event.event_date)} · {event.venue ?? event.location ?? ""}
				</p>
			)}

			{services.includes("transport") && (
				<Section id="transport" label="Transport" items={data.transport?.items}>
					{!data.transport ? <p className="gw-small">Checking availability…</p> : (
						<>
							<div className="gw-book__grid">{data.transport.items.map(VehicleCard)}</div>
							{(data.transport.also?.length ?? 0) > 0 && (
								<>
									<h3 style={{ margin: "1.4rem 0 0.8rem" }}>Also available</h3>
									<div className="gw-book__grid">{data.transport.also!.map(VehicleCard)}</div>
								</>
							)}
							{data.transport.items.length + (data.transport.also?.length ?? 0) === 0 && (
								<>
									<Empty text="No transport available at the moment. Please check again later." />
									{q.service !== "all" && <CustomCTA s="transport" />}
								</>
							)}
						</>
					)}
					{q.service !== "all" && (data.transport?.items.length ?? 0) + (data.transport?.also?.length ?? 0) > 0 && <CustomCTA s="transport" />}
				</Section>
			)}

			{services.includes("accommodation") && (
				<Section id="accommodation" label="Accommodation">
					{!data.accommodation ? <p className="gw-small">Checking availability…</p>
						: data.accommodation.items.length === 0 ? (
							<>
								<Empty text={`No ${q.type ?? "accommodation"} available for those dates. Try different dates or another accommodation type.`} />
								{q.service !== "all" && <CustomCTA s="accommodation" />}
							</>
						) : (
							<div className="gw-book__grid">
								{data.accommodation.items.map((p: R) => (
									<Card
										key={p.id} service="accommodation" item={p}
										img={p.image} alt={p.name}
										title={p.name}
										sub={`${p.city ?? ""}${p.province ? `, ${p.province}` : ""}${p.stars ? ` · ${"★".repeat(Number(p.stars))}` : ""}`}
										chips={(p.facilities ?? []).slice(0, 4)}
										price={p.price != null ? `From ${fmtR(p.price)}/night` : "Price on request"}
										foot={(
											<>
												<span className="gw-small">Available {q.from ? fmtDate(q.from) : "on request"}</span>
												<button className="gw-btn gw-btn--gold gw-btn--small" onClick={() => setBooking({ service: "accommodation", item: p })}>Book now</button>
											</>
										)}
									/>
								))}
							</div>
						)}
					{q.service !== "all" && (data.accommodation?.items.length ?? 0) > 0 && <CustomCTA s="accommodation" />}
				</Section>
			)}

			{services.includes("events") && (
				<Section id="events" label="Events">
					{!data.events ? <p className="gw-small">Checking availability…</p>
						: data.events.items.length === 0 ? (
							<>
								<Empty text="No upcoming events right now — check back soon." />
								{q.service !== "all" && <CustomCTA s="events" />}
							</>
						) : (
							<div className="gw-book__grid">
								{data.events.items.map((ev: R) => {
									const minTicket = (ev.tickets ?? []).map((t: R) => t.price).filter((n: number | null) => n != null);
									const price = minTicket.length ? Math.min(...minTicket) : ev.price;
									return (
										<Card
											key={ev.id} service="events" item={ev}
											img={ev.image} alt={ev.title}
											title={ev.title}
											sub={`${fmtDate(ev.event_date)}${ev.end_date ? ` → ${fmtDate(ev.end_date)}` : ""} · ${ev.venue ?? ev.location ?? ""}`}
											price={price != null ? `Tickets from ${fmtR(price)}` : "Tickets on request"}
											foot={(
												<span className="gw-buttons" style={{ gap: "0.4rem" }}>
													<Link className="gw-btn gw-btn--gold gw-btn--small" href={`/events/${ev.id}`}>Get Tickets</Link>
													{ev.transport_offered !== false && (
														<Link
															className="gw-btn gw-btn--outline gw-btn--outline-dark gw-btn--small"
															href={`/book/results?service=transport&from=${ev.event_date ?? q.from}&to=${ev.event_date ?? q.to}&pax=${q.pax}&event_id=${ev.id}&dest=${encodeURIComponent(ev.location ?? ev.venue ?? "")}`}
														>Book Transport</Link>
													)}
												</span>
											)}
										/>
									);
								})}
							</div>
						)}
					{q.service !== "all" && (data.events?.items.length ?? 0) > 0 && <CustomCTA s="events" />}
				</Section>
			)}

			{(["tours", "getaways", "complete", "groups"] as const).filter((s) => services.includes(s)).map((cat) => (
				<Section key={cat} id={cat} label={SERVICE_OPTIONS.find((s) => s.key === cat)!.label}>
					{!data[cat] ? <p className="gw-small">Checking availability…</p>
						: data[cat].items.length === 0 ? (
							<>
								<Empty text={`No ${SERVICE_OPTIONS.find((s) => s.key === cat)!.label.toLowerCase()} available for those dates.`} />
								{q.service !== "all" && <CustomCTA s={cat} />}
							</>
						) : (
							<div className="gw-book__grid">
								{data[cat].items.map((p: R) => {
									const matchDate = (p.dates ?? []).find((d: string) => !q.from || (d >= q.from && d <= (q.to || q.from)));
									return (
										<Card
											key={p.id} service={cat} item={p}
											img={p.image} alt={p.image_alt ?? p.title}
											title={p.title}
											sub={`${p.subtitle ?? ""}${p.destination ? ` · ${p.destination}` : ""}`}
											chips={[
												p.nights ? `${p.nights} night${p.nights === 1 ? "" : "s"}` : "Day trip",
												...(p.dates ?? []).slice(0, 3).map((d: string) => (
													<span key={d} className={d === matchDate ? "is-hot" : undefined}>{fmtDate(d)}</span>
												)),
											]}
											price={p.price_from != null ? `From ${fmtR(p.price_from)} pp` : "Price on request"}
											foot={(
												<>
													<span className="gw-small">{(p.includes ?? []).slice(0, 3).join(" · ") || (p.dates?.length ? "Scheduled" : "On request")}</span>
													<button className="gw-btn gw-btn--gold gw-btn--small" onClick={() => setBooking({ service: cat, item: p })}>Book now</button>
												</>
											)}
										/>
									);
								})}
							</div>
						)}
					{q.service !== "all" && (data[cat]?.items.length ?? 0) > 0 && <CustomCTA s={cat} />}
				</Section>
			))}

			{services.includes("airways") && (
				<Section id="airways" label="Airways">
					<div className="gw-panel">
						<h3>Flight bookings</h3>
						<p>GiftWako Travel arranges domestic and international flights — on their own or as part of a package. Tell us your dates and we will send you a written quote.</p>
						<div className="gw-buttons">
							<Link
								className="gw-btn gw-btn--gold"
								href={`/plan-a-trip/?trip_type=Flights${q.from ? `&departure_date=${q.from}` : ""}${q.to ? `&return_date=${q.to}` : ""}&adults=${q.pax}`}
							>Request flight quote</Link>
							<a className="gw-btn gw-btn--outline gw-btn--outline-dark" href={waLink("Hi GiftWako, I need a flight quote")} target="_blank" rel="noreferrer">WhatsApp us</a>
						</div>
					</div>
				</Section>
			)}

			{q.service === "all" && <CustomCTA s="all" />}

			{booking && (
				<BookingForm
					service={booking.service}
					item={booking.item}
					query={q}
					onClose={() => setBooking(null)}
					onBooked={() => setTick((t) => t + 1)}
				/>
			)}
		</>
	);
}
