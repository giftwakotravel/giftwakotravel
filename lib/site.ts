export const SITE = {
	name: "GiftWako Travel Agency",
	shortName: "GiftWako Travel",
	legalName: "GiftWako Travel (Pty) Ltd",
	registration: "2026/751328/07",
	email: "info@giftwakotravel.co.za",
	phone: "0648839323",
	phoneTel: "tel:+27648839323",
	whatsappDisplay: "+27706178269",
	whatsapp: "27706178269",
	address: "17 Gerrit Kruger Street, Aqua Park, Tzaneen 0850",
	directors: "Gift Sekhumise (CEO) · Kgaogelo Matshwi (COO)",
	url: "https://giftwakotravel.co.za",
	about:
		"Tours, transfers, stays and complete trips, planned around you. Tell us where you would like to go and we will put it together.",
	social: {
		facebook: "https://www.facebook.com/giftwakotravel",
		instagram: "https://www.instagram.com/giftwakotravel",
	},
};

export const NAV = [
	{ href: "/", label: "Home" },
	{ href: "/tours-and-services/", label: "Tours & services" },
	{ href: "/about/", label: "About" },
	{ href: "/contact/", label: "Contact" },
	{ href: "/account/", label: "My account" },
];

export const FOOTER_EXPLORE = [
	{ href: "/tours-and-services/", label: "Tours & services" },
	{ href: "/plan-a-trip/", label: "Plan a trip" },
	{ href: "/driver-portal/", label: "Drive with us" },
	{ href: "/about/", label: "About us" },
	{ href: "/contact/", label: "Contact" },
];

export const FOOTER_TRIPS = [
	{ href: "/account/", label: "Sign in" },
	{ href: "/sign-up/", label: "Create an account" },
	{ href: "/my-trips/", label: "My trips" },
];

export const FOOTER_LEGAL = [
	{ href: "/terms/", label: "Terms and conditions" },
	{ href: "/photo-credits/", label: "Photo credits" },
	{ href: "/privacy/", label: "Privacy policy" },
	{ href: "/refunds/", label: "Cancellations and refunds" },
];

export function waLink(text: string) {
	return `https://wa.me/${SITE.whatsapp}?text=${encodeURIComponent(text)}`;
}
