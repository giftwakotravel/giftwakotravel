import Link from "next/link";

interface Props {
	heading: string;
	text: string;
	button: { label: string; href: string };
}

export default function CtaBand({ heading, text, button }: Props) {
	return (
		<div className="gw-cta-band has-global-padding">
			<div className="gw-cta-band__bg">
				{/* eslint-disable-next-line @next/next/no-img-element */}
				<img src="/images/cta.jpg" alt="" />
			</div>
			<div className="gw-wrap gw-cta-band__inner">
				<div>
					<h2>{heading}</h2>
					<p>{text}</p>
				</div>
				<Link className="gw-btn gw-btn--gold" href={button.href}>
					{button.label}
				</Link>
			</div>
		</div>
	);
}
