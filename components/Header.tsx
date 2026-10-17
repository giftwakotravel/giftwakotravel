"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { NAV, SITE } from "@/lib/site";

export default function Header() {
	const [open, setOpen] = useState(false);
	const pathname = usePathname();

	const isActive = (href: string) =>
		href === "/" ? pathname === "/" : pathname.startsWith(href);

	return (
		<header className="gw-header has-global-padding">
			<div className="gw-wrap gw-header__inner">
				<Link className="gw-brand" href="/" aria-label={`${SITE.name} — home`}>
					{/* eslint-disable-next-line @next/next/no-img-element */}
					<img src="/images/giftwako-logo.png" alt="" width={72} height={72} />
					<span className="gw-brand__text">{SITE.shortName}</span>
				</Link>
				<button
					className="gw-nav-toggle"
					aria-expanded={open}
					aria-controls="gw-primary-nav"
					onClick={() => setOpen(!open)}
				>
					<span className="gw-nav-toggle__bars" aria-hidden="true" />
					<span className="screen-reader-text">Menu</span>
				</button>
				<nav id="gw-primary-nav" className={`gw-nav${open ? " is-open" : ""}`} aria-label="Main menu">
					<ul className="gw-menu">
						{NAV.map((item) => (
							<li key={item.href}>
								<Link
									href={item.href}
									aria-current={isActive(item.href) ? "page" : undefined}
									onClick={() => setOpen(false)}
								>
									{item.label}
								</Link>
							</li>
						))}
					</ul>
					<Link className="gw-header-cta" href="/plan-a-trip/" onClick={() => setOpen(false)}>
						<svg width="1em" height="1em" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
							<path d="M21.5 15.5v-2l-8.5-5V3.25a1.25 1.25 0 0 0-2.5 0V8.5l-8.5 5v2l8.5-2.5v5.2l-2.3 1.55v1.25l3.05-.85 3.05.85v-1.25L13 18.2V13l8.5 2.5z" />
						</svg>
						Plan a trip
					</Link>
				</nav>
			</div>
		</header>
	);
}
