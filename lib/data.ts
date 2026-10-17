import { waLink } from "./site";

/* ---------- group trips (tours-and-services + events) ---------- */

export type PriceRow = [string, string, string];

export interface Trip {
	slug: string;
	image: string;
	alt: string;
	caption: string;
	title: string;
	meta: string;
	blurb: string;
	ticks?: (string | { strong: string; rest: string })[];
	priceHead?: [string, string, string];
	priceRows?: PriceRow[];
	note?: string;
	ctaLabel: string;
	ctaHref: string;
	waText: string;
	waHref?: string;
	waLabel?: string;
}

export const TRIPS: Trip[] = [
	{
		slug: "mpumalanga-day-trip",
		image: "/images/panorama.jpg",
		alt: "Three Rondavels above the Blyde River Canyon",
		caption: "Mpumalanga · 1 day",
		title: "Mpumalanga Panorama Route day trip",
		meta: "Date: 16 December 2026 · Departure: 07:30 sharp, all vehicles meet in Tzaneen · Return: late evening, same day",
		blurb: "A full day on the Panorama Route with transport and entrance fees included.",
		ticks: [
			{ strong: "Three Rondavels", rest: " – the iconic trio of peaks overlooking the Blyde River Canyon" },
			{ strong: "Bourke's Luck Potholes", rest: " – water-carved rock pools where the Blyde and Treur rivers meet" },
			{ strong: "Graskop Gorge Lift", rest: " – glass lift down into the forested gorge" },
			{ strong: "God's Window", rest: " – panoramic views over the Lowveld" },
		],
		priceHead: ["Departing from", "Price per person", "Deposit"],
		priceRows: [
			["Tzaneen", "R950", "R300"],
			["Bolobedu", "R1,000", "R400"],
			["Giyani", "R1,150", "R400"],
			["Polokwane", "R1,250", "R500"],
		],
		note: "Balance payable before departure. No seat is held without a deposit. Terms and conditions apply.",
		ctaLabel: "Reserve a seat",
		ctaHref: "/plan-a-trip/",
		waText: "Hi GiftWako, I would like to book the Mpumalanga day trip",
	},
	{
		slug: "harties-sun-city",
		image: "/images/suncity.jpg",
		alt: "Hartbeespoort Dam",
		caption: "North West · 2 days, 1 night",
		title: "Harties and Sun City getaway",
		meta: "2026 dates: 24–25 October · 28–29 November · 19–20 December",
		blurb: "One night away with Hartbeespoort sightseeing and a day at Sun City.",
		ticks: [
			"Return transport",
			"One night at StayEasy Rustenburg, with breakfast",
			"Little Paris and Harties sightseeing",
			"Entrance to Sun City and the Valley of Waves, plus an R80 meal voucher",
			"Photography, bottled water and a snack, cooler box with ice",
		],
		priceHead: ["Option", "Price", "Seat reservation"],
		priceRows: [
			["Single, not sharing", "P2,400", "P500"],
			["Couple, sharing", "P3,600", "P1,000"],
		],
		note: "Prices in Botswana Pula; ask us for the rand price. Seat reservations are non-refundable. Optional extras: Harties cableway R295, boat cruise R345, Upside Down House R120.",
		ctaLabel: "Reserve a seat",
		ctaHref: "/plan-a-trip/",
		waText: "Hi GiftWako, I would like to book the Harties and Sun City getaway",
	},
	{
		slug: "mpumalanga-3-day",
		image: "/images/dest_panorama.jpg",
		alt: "Gorge and bridge at Bourke's Luck Potholes, Mpumalanga",
		caption: "Mpumalanga · 3 days, 2 nights",
		title: "Mpumalanga 3-day tour",
		meta: "Date: 16–18 October 2026 · Deposit: R500 (non-refundable, secures your seat)",
		blurb:
			"Three days on the Panorama Route with return transport, two nights' accommodation with breakfast, and guided sightseeing.",
		ticks: [
			{ strong: "Lisbon Falls", rest: "" },
			{ strong: "God's Window", rest: "" },
			{ strong: "Berlin Falls", rest: "" },
			{ strong: "Accommodation", rest: " with breakfast (2 nights)" },
		],
		priceHead: ["Departing from", "Price per person", "Deposit"],
		priceRows: [
			["Limpopo (Bolobedu, Polokwane, Makhado)", "R2,800", "R500"],
			["Johannesburg", "R2,500", "R500"],
		],
		note: "Not included: Graskop Gorge Lift (R100–R200), Three Rondavels and Bourke's Luck Potholes entrances, quad bikes, lunch and dinner, personal expenses. Terms and conditions apply.",
		ctaLabel: "Reserve a seat",
		ctaHref: "/plan-a-trip/",
		waText: "Hi GiftWako, I would like to book the Mpumalanga 3-day tour",
	},
	{
		slug: "gwambeni-scholar",
		image: "/images/gwambeni-vehicle.jpg",
		alt: "Gwambeni Transport Toyota Rumion",
		caption: "Scholar transport · Matipane",
		title: "Scholar transport — Gwambeni Transport",
		meta: "Matric 2027: strictly matrics only · proudly serving Matipane and surroundings",
		blurb:
			"Daily scholar transport for matric learners in a Toyota 7-seater Rumion — safe, reliable, on time. Your matric journey, our priority.",
		ticks: ["Motloboni High", "Molai Jubilee High", "Morwatshehla High", "Masopha High"],
		note: "Spaces are limited — book your seat early.",
		ctaLabel: "Call 068 719 1889",
		ctaHref: "tel:0687191889",
		waText: "Hi, I would like to book matric scholar transport",
		waHref: "https://wa.me/27721507835?text=Hi%2C%20I%20would%20like%20to%20book%20matric%20scholar%20transport",
		waLabel: "WhatsApp 072 150 7835",
	},
];

export const EVENT_TRIPS: Trip[] = [
	{
		...TRIPS[2],
		meta: "Date: 16–18 October 2026 · From R2,500 per person · Deposit: R500",
		blurb: "Three days on the Panorama Route — return transport, two nights with breakfast and guided sightseeing.",
		ticks: undefined,
		priceHead: undefined,
		priceRows: undefined,
		note: undefined,
		ctaLabel: "Details & booking",
		ctaHref: "/plan-a-trip/",
	},
	{
		...TRIPS[1],
		blurb: "One night away with Hartbeespoort sightseeing and a day at Sun City and the Valley of Waves.",
		ticks: undefined,
		priceHead: undefined,
		priceRows: undefined,
		note: undefined,
		ctaLabel: "Details & booking",
		ctaHref: "/plan-a-trip/",
	},
	{
		...TRIPS[0],
		meta: "Date: 16 December 2026 · From R950 per person · Deposit from R300",
		blurb: "A full day on the Panorama Route — Three Rondavels, Bourke's Luck Potholes, Graskop Gorge Lift and God's Window.",
		ticks: undefined,
		priceHead: undefined,
		priceRows: undefined,
		note: undefined,
		ctaLabel: "Details & booking",
		ctaHref: "/plan-a-trip/",
	},
];

/* ---------- services ---------- */

export interface Service {
	href: string;
	image: string;
	alt: string;
	title: string;
	blurb: string;
	tags: ServiceTag[];
}

export type ServiceTag =
	| "tours"
	| "getaways"
	| "transport"
	| "accommodation"
	| "airways"
	| "complete"
	| "groups"
	| "events";

export const SERVICE_TAGS: { key: ServiceTag | "all"; label: string }[] = [
	{ key: "all", label: "All" },
	{ key: "tours", label: "Tours & day trips" },
	{ key: "getaways", label: "Getaways & holidays" },
	{ key: "transport", label: "Transport" },
	{ key: "accommodation", label: "Accommodation" },
	{ key: "airways", label: "Airways" },
	{ key: "complete", label: "Complete trips" },
	{ key: "groups", label: "Groups" },
	{ key: "events", label: "Events" },
];

export const SERVICES: Service[] = [
	{
		href: "/group-day-trips/",
		image: "/images/complete-trip.jpg",
		alt: "Group of hikers on a GiftWako Travel trip",
		title: "Group day trips and tours",
		blurb: "Scheduled trips with set dates and a price per person. Reserve your seat with a deposit and pay the balance before departure.",
		tags: ["tours"],
	},
	{
		href: "/holiday-packages/",
		image: "/images/getaways.jpg",
		alt: "Couple overlooking a coastal bay on a getaway",
		title: "Getaways and holiday packages",
		blurb: "Overnight and multi-day packages with transport, accommodation, meals and activities arranged together.",
		tags: ["getaways", "airways"],
	},
	{
		href: "/transfers/",
		image: "/images/grouptransport.jpg",
		alt: "White minibus taxis for group transport",
		title: "Transfers and group transport",
		blurb: "Airport runs, events, church and school outings, and long-distance transport with pickups across Limpopo.",
		tags: ["transport"],
	},
	{
		href: "/accommodation/",
		image: "/images/accomodation.jpg",
		alt: "Modern hotel room with a double bed",
		title: "Accommodation",
		blurb: "Guesthouses, lodges, self-catering and hotels booked for you, on their own or as part of a trip.",
		tags: ["accommodation"],
	},
	{
		href: "/plan-a-trip/",
		image: "/images/dest_mauritius.jpg",
		alt: "Calm beach bay in Mauritius",
		title: "Flights and air travel",
		blurb: "Domestic and international flights booked for you — on their own or as part of a package.",
		tags: ["airways", "getaways"],
	},
	{
		href: "/complete-trips/",
		image: "/images/complete-trip.jpg",
		alt: "Group of hikers on a GiftWako Travel trip",
		title: "Complete trips, planned for you",
		blurb: "Cape Town, Durban, Kruger or an international holiday: tell us where, when and who, and we plan the whole trip.",
		tags: ["complete", "airways", "accommodation"],
	},
	{
		href: "/groups-and-organisations/",
		image: "/images/organisation.jpg",
		alt: "School group boarding a minibus taxi",
		title: "Groups and organisations",
		blurb: "Churches, schools, stokvels and companies: one quote for the whole group, with a single point of contact.",
		tags: ["groups", "transport", "accommodation"],
	},
	{
		href: "/events/",
		image: "/images/gw-coach-a.jpg",
		alt: "GiftWako Travel branded coach",
		title: "Events",
		blurb: "Concerts, festivals, sport weekends and group dates — see what is coming up and travel packages for each event.",
		tags: ["events", "transport"],
	},
];

/* ---------- service detail pages ---------- */

export interface ServicePage {
	slug: string;
	title: string;
	lead: string;
	ctaLabel: string;
	ctaHref: string;
	waText: string;
	heroImage: string;
	heroAlt: string;
	head: string;
	headLead: string;
	ticks: string[];
	note: null;
}

export const SERVICE_PAGES: ServicePage[] = [
	{
		slug: "group-day-trips",
		title: "Group day trips and tours",
		lead: "Scheduled trips with set dates and a price per person. Reserve your seat with a deposit and pay the balance before departure.",
		ctaLabel: "See all tours & services",
		ctaHref: "/tours-and-services/",
		waText: "Hi GiftWako, I am interested in a group day trip",
		heroImage: "/images/complete-trip.jpg",
		heroAlt: "Group of hikers on a GiftWako Travel trip",
		head: "How our group trips work",
		headLead:
			"Each trip is announced with a set date, an itinerary and a price per person. Vehicles depart from the listed pickup towns in Limpopo and return the same day, or after the stated number of nights.",
		ticks: [
			"Set date and price per person",
			"Transport from the listed pickup towns",
			"Entrance fees included where stated",
			"Deposit secures your seat",
			"Balance payable before departure",
		],
		note: null,
	},
	{
		slug: "holiday-packages",
		title: "Getaways and holiday packages",
		lead: "Overnight and multi-day packages with transport, accommodation, meals and activities arranged together.",
		ctaLabel: "Request a quote",
		ctaHref: "/plan-a-trip/",
		waText: "Hi GiftWako, I am interested in a getaway package",
		heroImage: "/images/getaways.jpg",
		heroAlt: "Couple overlooking a coastal bay on a getaway",
		head: "What a package includes",
		headLead:
			"Each getaway is quoted as one package — transport, accommodation, meals and activities together — and you approve a written quote before anything is booked.",
		ticks: [
			"Return transport",
			"Accommodation with meals as listed",
			"Activities and entrance fees per itinerary",
			"Single and sharing prices",
			"Optional extras at extra cost",
		],
		note: null,
	},
	{
		slug: "transfers",
		title: "Transfers and group transport",
		lead: "Airport runs, events, church and school outings, and long-distance transport with pickups across Limpopo.",
		ctaLabel: "Request a quote",
		ctaHref: "/plan-a-trip/",
		waText: "Hi GiftWako, I need transport or a transfer",
		heroImage: "/images/grouptransport.jpg",
		heroAlt: "White minibus taxis for group transport",
		head: "Transport we arrange",
		headLead: "Based in Tzaneen, we move groups of any size — one quote covers the vehicle, the driver and the trip.",
		ticks: [
			"Airport transfers",
			"Weddings, funerals and events",
			"Church and school outings",
			"Scholar transport (daily school runs)",
			"Long-distance trips",
			"Pickups across Limpopo",
		],
		note: null,
	},
	{
		slug: "accommodation",
		title: "Accommodation",
		lead: "Guesthouses, lodges, self-catering and hotels booked for you, on their own or as part of a trip.",
		ctaLabel: "Request a quote",
		ctaHref: "/plan-a-trip/",
		waText: "Hi GiftWako, I need accommodation",
		heroImage: "/images/accomodation.jpg",
		heroAlt: "Modern hotel room with a double bed",
		head: "Stays we book",
		headLead:
			"Tell us the area, your dates, the number of guests and your budget — we send you options with prices and book once you approve.",
		ticks: [
			"Guesthouses and B&Bs",
			"Lodges",
			"Self-catering units",
			"Hotels",
			"Booked alone or inside a travel package",
		],
		note: null,
	},
	{
		slug: "complete-trips",
		title: "Complete trips, planned for you",
		lead: "Cape Town, Durban, Kruger or an international holiday: tell us where, when and who, and we plan the whole trip.",
		ctaLabel: "Plan a trip",
		ctaHref: "/plan-a-trip/",
		waText: "Hi GiftWako, I want a complete trip planned",
		heroImage: "/images/complete-trip.jpg",
		heroAlt: "Group of hikers on a GiftWako Travel trip",
		head: "How it works",
		headLead:
			"One request covers everything — we build the itinerary, price it as a written quote, and only book once you accept.",
		ticks: [
			"Destination, dates and travellers",
			"Transport, accommodation and activities together",
			"One written quote for the whole trip",
			"Nothing booked until you accept",
		],
		note: null,
	},
	{
		slug: "groups-and-organisations",
		title: "Groups and organisations",
		lead: "Churches, schools, stokvels and companies: one quote for the whole group, with a single point of contact.",
		ctaLabel: "Request a group quote",
		ctaHref: "/plan-a-trip/",
		waText: "Hi GiftWako, I am interested in a group or organisation trip",
		heroImage: "/images/organisation.jpg",
		heroAlt: "School group boarding a minibus taxi",
		head: "Who we work with",
		headLead:
			"Group travel runs smoother with one person in charge — we deal with your organiser and keep everyone on one itinerary.",
		ticks: [
			"Church outings and conferences",
			"School trips and sport",
			"Stokvel and family trips",
			"Company and team travel",
			"One quote, one contact, one invoice",
		],
		note: null,
	},
];

export const SERVICE_NOTES: Record<string, string> = {
	"group-day-trips": "Seats are first come, first served — a seat is only confirmed once the deposit is paid.",
	"holiday-packages": "Current packages, like Harties and Sun City, are listed under upcoming trips.",
	transfers: "For matric scholar transport in Matipane, see the Gwambeni Transport card under upcoming trips.",
	accommodation: "Accommodation inside a package is priced per person sharing unless stated otherwise.",
	"complete-trips": "Use the plan a trip form for the fastest quote.",
	"groups-and-organisations": "Deposits and payment terms are confirmed in the written quote; see our cancellations and refunds policy.",
};

export { waLink };
