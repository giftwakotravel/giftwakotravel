import type { Metadata } from "next";
import PageBand from "@/components/PageBand";

export const metadata: Metadata = {
	title: "Photo credits",
	description: "Credits and licences for the photographs used on the GiftWako Travel website.",
};

const CREDITS = [
	{
		href: "https://commons.wikimedia.org/w/index.php?curid=14645505",
		label: "Blyde-River-Canyon-Panorama-2009",
		by: "Bjørn Christian Tørrissen",
		lic: "CC BY-SA 3.0",
	},
	{
		href: "https://commons.wikimedia.org/w/index.php?curid=91009571",
		label: "Blyde River Canyon 20150104",
		by: "Daniel Kraft",
		lic: "CC BY-SA 3.0",
	},
	{
		href: "https://commons.wikimedia.org/w/index.php?curid=5796818",
		label: "South Africa - Gauteng - Hartbeespoort Dam",
		by: "Genet at German Wikipedia",
		lic: "CC BY-SA 3.0",
	},
	{
		href: "https://commons.wikimedia.org/w/index.php?curid=89163467",
		label: "End of day at the taxi station",
		by: "Suckrame",
		lic: "CC BY-SA 4.0",
	},
	{
		href: "https://commons.wikimedia.org/w/index.php?curid=58559870",
		label: "Stolová hora a 12 apoštolů, Kapské město - Table Mountains, Cape Town - panoramio",
		by: "Pavel Špindler",
		lic: "CC BY 3.0",
	},
	{
		href: "https://commons.wikimedia.org/w/index.php?curid=65603633",
		label: "Bourke's Luck Potholes 03",
		by: "ErwinMeier",
		lic: "CC BY-SA 4.0",
	},
	{
		href: "https://commons.wikimedia.org/w/index.php?curid=82979236",
		label: "Hartbeespoort Dam, North West (South Africa)",
		by: "Olga Ernst",
		lic: "CC BY-SA 4.0",
	},
	{
		href: "https://commons.wikimedia.org/w/index.php?curid=73382721",
		label: "Elefantes africanos de sabana (Loxodonta africana), parque nacional Kruger, Sudáfrica, 2018-07-25, DD 04",
		by: "Diego Delso",
		lic: "CC BY-SA 4.0",
	},
	{
		href: "https://commons.wikimedia.org/w/index.php?curid=120726109",
		label: "Durban Beachfront (475914663)",
		by: "Chris Bloom from Durban, South Africa",
		lic: "CC BY-SA 2.0",
	},
	{
		href: "https://commons.wikimedia.org/w/index.php?curid=15683843",
		label: "2011-06-26 10-02-10 Mauritius Rivière du Rempart Grand Gaube",
		by: "Panorama-stitched image",
		lic: "CC BY-SA 3.0",
	},
	{
		href: "https://www.rawpixel.com/image/430656/free-photo-image-mexico-beach-town",
		label: "Rocky beach Cape Town, South",
		by: "Scott Webb",
		lic: "CC0 1.0",
	},
];

export default function PhotoCredits() {
	return (
		<>
			<PageBand eyebrow="Legal" title="Photo credits" />
			<section className="gw-section has-global-padding">
				<div className="gw-wrap gw-legal">
					<p>
						The photographs used on this website are shared under Creative Commons licences by their
						photographers. Thank you.
					</p>
					<ul>
						{CREDITS.map((c, i) => (
							<li key={i}>
								<a href={c.href} target="_blank" rel="noopener noreferrer">
									{c.label}
								</a>{" "}
								by {c.by} — {c.lic}
							</li>
						))}
					</ul>
				</div>
			</section>
		</>
	);
}
