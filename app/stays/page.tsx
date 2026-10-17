import Link from "next/link";
import { createClient } from "@supabase/supabase-js";
import PageBand, { BandButtons } from "@/components/PageBand";
import PropSearch from "@/components/PropSearch";

export const dynamic = "force-dynamic";

export const metadata = { title: "Stays", description: "Search accommodation we can arrange across Limpopo and South Africa." };

const sb = createClient(
	process.env.NEXT_PUBLIC_SUPABASE_URL!,
	process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

interface Stay {
	id: number;
	name: string;
	city: string;
	province: string;
	type: string;
	stars: number | null;
	price: number | null;
	status: string;
	owner: string;
}

export default async function StaysPage({
	searchParams,
}: {
	searchParams: Promise<{ q?: string; type?: string }>;
}) {
	const { q = "", type = "" } = await searchParams;
	const needle = q.replace(/[%,()]/g, "").trim();

	let query = sb.from("properties").select("id,name,city,province,type,stars,price,status,owner").order("name").limit(200);
	if (needle) query = query.or(`name.ilike.%${needle}%,city.ilike.%${needle}%`);
	if (type) query = query.eq("type", type);

	const { data, error } = await query;
	const stays = (data ?? []) as Stay[];

	return (
		<>
			<PageBand eyebrow="Stays" title={needle ? `Results for “${needle}”` : "Find a stay"} lead="Hotels, guesthouses, apartments and lodges — tell us which one you like and we will book it for you.">
				<BandButtons back={{ label: "Back home", href: "/" }} />
			</PageBand>

			<section className="gw-section has-global-padding">
				<div className="gw-wrap">
					<div style={{ marginBottom: "1.5rem" }}>
						<PropSearch />
					</div>

					{error ? (
						<p className="gw-note">Could not load stays right now — try again shortly or WhatsApp us instead.</p>
					) : stays.length === 0 ? (
						<div className="gw-empty">
							<h3>No stays match “{needle}”</h3>
							<p>Try a town name like <Link href="/stays/?q=Polokwane">Polokwane</Link>, <Link href="/stays/?q=Tzaneen">Tzaneen</Link> or <Link href="/stays/?q=Bela-Bela">Bela-Bela</Link> — or tell us what you need and we will find options.</p>
							<Link className="gw-btn gw-btn--gold" href="/plan-a-trip/">Plan a trip</Link>
						</div>
					) : (
						<>
							<p className="gw-small" style={{ margin: "0 0 1rem" }}>{stays.length} {stays.length === 1 ? "stay" : "stays"} found</p>
							<div className="gw-staygrid">
								{stays.map((s) => (
									<article className="gw-staycard" key={s.id}>
										<div className="gw-staycard__body">
											<div className="gw-staycard__top">
												<h3>{s.name}</h3>
												{s.stars ? <span className="gw-staycard__stars">{"★".repeat(s.stars)}</span> : null}
											</div>
											<p className="gw-staycard__meta">
												{s.type} · {s.city}{s.province && s.province !== s.city ? `, ${s.province}` : ""}
											</p>
											{s.status === "Live" && s.price ? (
												<p className="gw-staycard__price">From R{s.price.toLocaleString("en-ZA")} <small>/ night</small></p>
											) : (
												<p className="gw-staycard__price gw-staycard__price--tba">Price on request</p>
											)}
											{s.owner === "OSM prospect — unverified" && (
												<p className="gw-staycard__flag">Listing being verified</p>
											)}
											<Link
												className="gw-btn gw-btn--outline gw-btn--outline-dark gw-btn--small"
												href={`/plan-a-trip/?${new URLSearchParams({
													trip_type: "Accommodation only",
													destination_area: `${s.name}${s.city ? `, ${s.city}` : ""}`,
													destination_country: "South Africa",
												}).toString()}`}
											>
												Ask about this stay
											</Link>
										</div>
									</article>
								))}
							</div>
						</>
					)}
				</div>
			</section>
		</>
	);
}
