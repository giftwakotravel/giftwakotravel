import type { Metadata } from "next";
import CtaBand from "@/components/CtaBand";
import PageBand from "@/components/PageBand";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
	title: "About us",
	description:
		"GiftWako Travel (Pty) Ltd is a registered, black-owned tour operator and travel agency based in Tzaneen, Limpopo, South Africa.",
};

const PILLARS = [
	{
		icon: "/icons/map.svg",
		title: "Tour operating",
		text: "Tailor-made tour packages, cultural village tours in Bolobedu, safari experiences, educational school tours and leisure group tours.",
	},
	{
		icon: "/icons/suitcase.svg",
		title: "Travel agency services",
		text: "Professional booking of flights, accommodation, car hire, shuttle and transfer services, holiday packages and corporate travel management.",
	},
	{
		icon: "/icons/chat.svg",
		title: "Community tourism development",
		text: "Empowering local communities, creating youth employment and promoting sustainable tourism that benefits villages and small businesses across Bolobedu and greater Limpopo.",
	},
];

export default function About() {
	return (
		<>
			<PageBand
				eyebrow="About us"
				title="Travel that starts at home"
				lead="GiftWako Travel (Pty) Ltd is a registered, black-owned tour operator and travel agency based at Gerrit Kruger Street, Aqua Park, Tzaneen, in the heart of Limpopo Province, South Africa."
				center
			/>

			{/* ---------- who we are ---------- */}
			<section className="gw-section gw-section--xl has-global-padding">
				<div className="gw-wrap gw-about-split">
					<div>
						<p className="gw-eyebrow">Who we are</p>
						<h2 style={{ fontSize: "clamp(1.6rem, 2.6vw, 2.1rem)", margin: "0 0 1rem" }}>
							Founded in Bolobedu, based in Tzaneen
						</h2>
						<p>
							The company was founded by <strong>Gift Sekhumise</strong> and{" "}
							<strong>Kgaogelo Matshwi</strong>, two young entrepreneurs rooted in Bolobedu, hailing from
							Polaseng Village and Ramodumo Village respectively. Gift Sekhumise serves as Chief Executive
							Officer (CEO) and Kgaogelo Matshwi as Chief Operating Officer (COO).
						</p>
						<p>
							GiftWako Travel was established with a vision to professionalise rural tourism and bring
							world-class travel services closer to local communities. Operating from Tzaneen, the gateway
							to the Kruger National Park, Modjadjiskloof, Haenertsburg and the Blyde River Canyon, we
							connect travellers to the rich cultural heritage, natural beauty and adventure experiences of
							Limpopo and South Africa at large.
						</p>
						<p>
							With a strong focus on{" "}
							<strong>safety, reliability, affordability and authentic customer experience</strong>, we serve
							individuals, families, schools, churches, government departments and corporate clients. Every
							journey is interactive, well-coordinated, and delivered with professional intelligence, local
							knowledge and personal care.
						</p>
					</div>
					<div>
						<figure className="gw-rounded-img" style={{ margin: 0 }}>
							{/* eslint-disable-next-line @next/next/no-img-element */}
							<img src="/images/about_image.png" alt="GiftWako Travel leadership" />
							<figcaption>GiftWako Travel leadership</figcaption>
						</figure>
						<div className="gw-facts">
							<p>
								<strong>Registered:</strong> {SITE.legalName} · Reg {SITE.registration}
							</p>
							<p>
								<strong>Based:</strong> Gerrit Kruger Street No 17, Aqua Park, Tzaneen 0850
							</p>
							<p>
								<strong>Directors:</strong> {SITE.directors}
							</p>
						</div>
					</div>
				</div>
			</section>

			{/* ---------- pillars ---------- */}
			<section className="gw-section gw-section--xl gw-section--sand has-global-padding">
				<div className="gw-wrap">
					<div className="gw-section__head">
						<p className="gw-eyebrow">What we do</p>
						<h2>Three pillars</h2>
					</div>
					<div className="gw-services">
						{PILLARS.map((p) => (
							<div className="gw-service gw-service--icon" key={p.title}>
								<figure className="gw-why__icon" style={{ margin: 0 }}>
									{/* eslint-disable-next-line @next/next/no-img-element */}
									<img src={p.icon} alt="" width={44} height={44} />
								</figure>
								<h3>{p.title}</h3>
								<p>{p.text}</p>
							</div>
						))}
					</div>
				</div>
			</section>

			{/* ---------- vision & mission ---------- */}
			<section className="gw-section gw-section--xl has-global-padding">
				<div className="gw-wrap gw-vm">
					<div className="gw-vm__panel gw-vm__panel--ocean">
						<p className="gw-eyebrow">Our vision</p>
						<p className="gw-vm__text">
							To become a leading and trusted tour operator in Limpopo and South Africa, creating a
							generation of travellers and tourism entrepreneurs who value their heritage, protect the
							environment, and break the cycle of poverty through opportunities in the tourism and travel
							industry.
						</p>
					</div>
					<div className="gw-vm__panel gw-vm__panel--navy">
						<p className="gw-eyebrow">Our mission</p>
						<p className="gw-vm__text">
							To provide professional, safe and memorable travel experiences, to inspire people to explore
							their natural heritage, and to stimulate community development through sustainable tourism.
						</p>
					</div>
				</div>
			</section>

			<CtaBand
				heading="Ready to travel with us?"
				text="Join a group trip or tell us about a journey of your own — we will send you a personalised, written quote."
				button={{ label: "Plan a trip", href: "/plan-a-trip/" }}
			/>
		</>
	);
}
