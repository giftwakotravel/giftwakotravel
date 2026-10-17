import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Toaster from "@/components/Toaster";
import Chrome from "@/components/Chrome";
import { SITE } from "@/lib/site";
import "./globals.css";

export const metadata: Metadata = {
	title: {
		default: `${SITE.name} — Tours, transfers and trips from Limpopo`,
		template: `%s — ${SITE.name}`,
	},
	description:
		"Day trips, getaways, transfers and complete holidays from Limpopo and beyond. Tell us where you would like to go and we will put it together with a clear quote.",
	icons: { icon: "/images/giftwako-logo-512.png" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
	return (
		<html lang="en-ZA">
			<body>
				<Chrome header={<Header />} footer={<Footer />}>
					{children}
				</Chrome>
				<Toaster />
			</body>
		</html>
	);
}
