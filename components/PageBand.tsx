import Link from "next/link";

interface Props {
	eyebrow: string;
	title: string;
	lead?: string;
	children?: React.ReactNode;
	center?: boolean;
}

export default function PageBand({ eyebrow, title, lead, children, center }: Props) {
	return (
		<div className="gw-page-band has-global-padding">
			<div className="gw-page-band__inner" style={center ? { textAlign: "center" } : undefined}>
				<p className="gw-eyebrow">{eyebrow}</p>
				<h1 style={center ? { marginInline: "auto" } : undefined}>{title}</h1>
				{lead ? <p className="gw-lead" style={center ? { marginInline: "auto" } : undefined}>{lead}</p> : null}
				{children}
			</div>
		</div>
	);
}

export function BandButtons({
	primary,
	outline,
	back,
}: {
	primary?: { label: string; href: string };
	outline?: { label: string; href: string };
	back?: { label: string; href: string };
}) {
	return (
		<>
			{(primary || outline) && (
				<div className="gw-buttons">
					{primary && (
						<Link className="gw-btn gw-btn--gold" href={primary.href}>
							{primary.label}
						</Link>
					)}
					{outline && (
						<a className="gw-btn gw-btn--outline gw-btn--outline-dark" href={outline.href}>
							{outline.label}
						</a>
					)}
				</div>
			)}
			{back && (
				<p className="gw-small">
					<Link href={back.href}>← {back.label}</Link>
				</p>
			)}
		</>
	);
}
