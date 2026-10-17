"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function PropSearch() {
	const router = useRouter();
	const [q, setQ] = useState("");
	const [type, setType] = useState("");

	const search = (e: React.FormEvent) => {
		e.preventDefault();
		const p = new URLSearchParams();
		if (q.trim()) p.set("q", q.trim());
		if (type) p.set("type", type);
		router.push(`/stays/${p.toString() ? `?${p.toString()}` : ""}`);
	};

	return (
		<form className="gw-propsearch" onSubmit={search} role="search">
			<div className="gw-propsearch__field">
				<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
					<circle cx="11" cy="11" r="7" />
					<path d="m20 20-3.5-3.5" />
				</svg>
				<input
					type="search"
					value={q}
					onChange={(e) => setQ(e.target.value)}
					placeholder="Search stays — name, town or area…"
					aria-label="Search properties"
				/>
			</div>
			<select value={type} onChange={(e) => setType(e.target.value)} aria-label="Property type">
				<option value="">All types</option>
				<option>Hotel</option>
				<option>Guesthouse</option>
				<option>Apartment</option>
				<option>Game lodge / chalet</option>
				<option>Hostel</option>
				<option>Resort</option>
				<option>Self-catering</option>
			</select>
			<button type="submit" className="gw-propsearch__go">Search</button>
		</form>
	);
}
