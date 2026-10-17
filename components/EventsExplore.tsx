"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

interface Ev {
	id: number;
	title: string;
	location: string | null;
	event_date: string | null;
	price: number | null;
	image: string | null;
	description: string | null;
}

export default function EventsExplore() {
	const [events, setEvents] = useState<Ev[] | null>(null);

	useEffect(() => {
		void supabase
			.from("events")
			.select("id,title,location,event_date,price,image,description,visible")
			.order("event_date", { ascending: true })
			.limit(12)
			.then(({ data }) => setEvents(((data ?? []) as (Ev & { visible: boolean | null })[]).filter((e) => e.visible !== false)));
	}, []);

	if (events === null) return null; // quiet loading — hero is the focus
	if (events.length === 0) return null; // nothing uploaded yet — hide the section

	return (
		<section className="gw-section has-global-padding">
			<div className="gw-wrap">
				<div className="gw-section__head">
					<h2 className="gw-explore-h">Explore</h2>
					<p className="gw-section__lead">Trips and events coming up — tap Going and we will book your seat.</p>
				</div>
				<div className="gw-evgrid">
					{events.map((e) => (
						<article className="gw-evcard" key={e.id}>
							<div className="gw-evcard__img">
								{e.image ? (
									/* eslint-disable-next-line @next/next/no-img-element */
									<img src={e.image} alt={e.title} />
								) : (
									<span className="gw-evcard__ph" aria-hidden="true">GiftWako event</span>
								)}
							</div>
							<div className="gw-evcard__body">
								<h3>{e.title}</h3>
								<p className="gw-evcard__meta">
									{[e.location, e.event_date].filter(Boolean).join(" · ")}
								</p>
								{e.description && <p className="gw-evcard__desc">{e.description}</p>}
								<div className="gw-evcard__foot">
									{e.price != null && (
										<span className="gw-evcard__price">R{e.price.toLocaleString("en-ZA")} <small>pp</small></span>
									)}
									<Link
										className="gw-btn gw-btn--gold gw-btn--small gw-evcard__going"
										href={`/events/${e.id}`}
									>
										Going
									</Link>
								</div>
							</div>
						</article>
					))}
				</div>
			</div>
		</section>
	);
}
