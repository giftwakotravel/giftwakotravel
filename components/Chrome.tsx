"use client";

import { usePathname } from "next/navigation";

const BARE = ["/gifwako_admin_dashboard"];

export default function Chrome({
	header,
	footer,
	children,
}: {
	header: React.ReactNode;
	footer: React.ReactNode;
	children: React.ReactNode;
}) {
	const pathname = usePathname();
	const bare = BARE.some((p) => pathname.startsWith(p));

	if (bare) {
		return <div className="site"><main id="content" className="site-main">{children}</main></div>;
	}

	return (
		<>
			<a className="skip-link screen-reader-text" href="#content">
				Skip to content
			</a>
			<div className="site">
				{header}
				<main id="content" className="site-main">
					{children}
				</main>
				{footer}
			</div>
		</>
	);
}
