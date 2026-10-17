"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

function todayISO() {
	const d = new Date();
	return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export default function StaySearch({ tripType = "Accommodation only" }: { tripType?: string }) {
	const router = useRouter();
	const [where, setWhere] = useState("");
	const [checkin, setCheckin] = useState("");
	const [checkout, setCheckout] = useState("");
	const [adults, setAdults] = useState(2);
	const [children, setChildren] = useState(0);
	const [rooms, setRooms] = useState(1);
	const [occOpen, setOccOpen] = useState(false);
	const occRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		const onDoc = (e: MouseEvent) => {
			if (occRef.current && !occRef.current.contains(e.target as Node)) setOccOpen(false);
		};
		document.addEventListener("mousedown", onDoc);
		return () => document.removeEventListener("mousedown", onDoc);
	}, []);

	const search = (e: React.FormEvent) => {
		e.preventDefault();
		const q = new URLSearchParams();
		q.set("trip_type", tripType);
		if (where) q.set("destination_area", where);
		if (checkin) q.set("departure_date", checkin);
		if (checkout) q.set("return_date", checkout);
		q.set("adults", String(adults));
		q.set("children", String(children));
		q.set("rooms", String(rooms));
		router.push(`/plan-a-trip/?${q.toString()}`);
	};

	const step = (set: (n: number) => void, val: number, delta: number, lo: number, hi: number) =>
		set(Math.min(hi, Math.max(lo, val + delta)));

	return (
		<form className="gw-stay-search" onSubmit={search}>
			<label className="gw-stay-search__field gw-stay-search__field--where">
				<span className="gw-stay-search__label">
					<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
						<path d="M12 21s-7-5.5-7-11a7 7 0 1 1 14 0c0 5.5-7 11-7 11z" />
						<circle cx="12" cy="10" r="2.5" />
					</svg>
					Enter destination
				</span>
				<input
					type="text"
					value={where}
					onChange={(e) => setWhere(e.target.value)}
					placeholder="Where are you going?"
					autoComplete="off"
				/>
			</label>

			<div className="gw-stay-search__field gw-stay-search__field--dates">
				<span className="gw-stay-search__label">
					<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
						<rect x="3" y="5" width="18" height="16" rx="2" />
						<path d="M8 3v4M16 3v4M3 10h18" />
					</svg>
					Select dates
				</span>
				<div className="gw-stay-search__dates">
					<input type="date" value={checkin} min={todayISO()} onChange={(e) => setCheckin(e.target.value)} aria-label="Check-in date" placeholder="Check-in date" />
					<span aria-hidden="true">—</span>
					<input type="date" value={checkout} min={checkin || todayISO()} onChange={(e) => setCheckout(e.target.value)} aria-label="Check-out date" placeholder="Check-out date" />
				</div>
			</div>

			<div className="gw-stay-search__field gw-stay-search__field--occ" ref={occRef}>
				<button
					type="button"
					className="gw-stay-search__occbtn"
					onClick={() => setOccOpen(!occOpen)}
					aria-expanded={occOpen}
					aria-haspopup="dialog"
				>
					<span className="gw-stay-search__label">
						<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
							<circle cx="12" cy="8" r="4" />
							<path d="M4 21c0-4 3.6-6.5 8-6.5s8 2.5 8 6.5" />
						</svg>
						Select occupancy
					</span>
					<span className="gw-stay-search__occsum">
						{adults} adults · {children} children · {rooms} room{rooms === 1 ? "" : "s"}
					</span>
					<span className="gw-stay-search__chev" aria-hidden="true">▾</span>
				</button>
				{occOpen && (
					<div className="gw-stay-search__pop" role="dialog" aria-label="Select occupancy">
						{(
							[
								{ label: "Adults", value: adults, set: setAdults, lo: 1, hi: 60 },
								{ label: "Children", value: children, set: setChildren, lo: 0, hi: 30 },
								{ label: "Rooms", value: rooms, set: setRooms, lo: 1, hi: 30 },
							] as const
						).map((r) => (
							<div className="gw-stay-search__row" key={r.label}>
								<span>{r.label}</span>
								<span className="gw-stay-search__stepper">
									<button type="button" aria-label={`Decrease ${r.label}`} disabled={r.value <= r.lo} onClick={() => step(r.set, r.value, -1, r.lo, r.hi)}>
										−
									</button>
									<strong>{r.value}</strong>
									<button type="button" aria-label={`Increase ${r.label}`} disabled={r.value >= r.hi} onClick={() => step(r.set, r.value, 1, r.lo, r.hi)}>
										+
									</button>
								</span>
							</div>
						))}
						<button type="button" className="gw-btn gw-btn--gold gw-btn--small" style={{ width: "100%" }} onClick={() => setOccOpen(false)}>
							Done
						</button>
					</div>
				)}
			</div>

			<button type="submit" className="gw-stay-search__go">
				Search
			</button>
		</form>
	);
}
