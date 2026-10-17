"use client";

import Link from "next/link";
import { useState } from "react";
import { SERVICE_TAGS, SERVICES, type ServiceTag } from "@/lib/data";
import StaySearch from "@/components/StaySearch";

const TRIP_TYPE_BY_TAG: Record<ServiceTag | "all", string> = {
	all: "Holiday package",
	tours: "City tour",
	getaways: "Holiday package",
	transport: "Airport transfer",
	accommodation: "Accommodation only",
	airways: "International travel",
	complete: "Holiday package",
	groups: "Holiday package",
	events: "Other",
};

export default function ServicesGrid() {
	const [filter, setFilter] = useState<ServiceTag | "all">("all");

	const visible = filter === "all" ? SERVICES : SERVICES.filter((s) => s.tags.includes(filter));

	return (
		<>
			<div className="gw-filter" aria-label="Filter services">
				{SERVICE_TAGS.map((t) => (
					<button
						key={t.key}
						aria-pressed={filter === t.key}
						className={`gw-filter__btn${filter === t.key ? " is-active" : ""}`}
						onClick={() => setFilter(t.key)}
					>
						{t.label}
					</button>
				))}
			</div>
			<div style={{ marginTop: "1rem" }}>
				<StaySearch tripType={TRIP_TYPE_BY_TAG[filter]} />
			</div>
			<div className="gw-services">
				{visible.map((s) => (
					<div className="gw-service" key={s.title}>
						<figure className="gw-service__media">
							<Link href={s.href}>
								{/* eslint-disable-next-line @next/next/no-img-element */}
								<img src={s.image} alt={s.alt} />
							</Link>
						</figure>
						<h3>
							<Link href={s.href}>{s.title}</Link>
						</h3>
						<p>{s.blurb}</p>
						<p className="gw-service__more">
							<Link href={s.href}>Learn more</Link>
						</p>
					</div>
				))}
			</div>
		</>
	);
}
