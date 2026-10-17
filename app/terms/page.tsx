import type { Metadata } from "next";
import Link from "next/link";
import PageBand from "@/components/PageBand";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
	title: "Terms and conditions",
	description: "Booking terms and conditions for GiftWako Travel (Pty) Ltd.",
};

export default function Terms() {
	return (
		<>
			<PageBand eyebrow="Legal" title="Terms and conditions" />
			<section className="gw-section has-global-padding">
				<div className="gw-wrap gw-legal">
					<p>
						These terms apply to every trip you book with GiftWako Travel (Pty) Ltd (&ldquo;GiftWako&rdquo;,
						&ldquo;we&rdquo;, &ldquo;us&rdquo;), whether you ask through this website, by email, by phone or in
						person. Please read them together with your quote, your invoice and our{" "}
						<Link href="/refunds/">cancellation and refund policy</Link>.
					</p>

					<h2>1. Who we are</h2>
					<p>
						GiftWako Travel (Pty) Ltd is a private company registered in South Africa, registration number{" "}
						{SITE.registration}. Our contact details are at the end of these terms.
					</p>

					<h2>2. How a booking is made</h2>
					<ul>
						<li>
							<strong>A request is not a booking.</strong> Asking about a trip, on this website or anywhere
							else, commits neither of us to anything.
						</li>
						<li>
							<strong>We send you a written quote.</strong> It says what is included, what it costs and how
							long the price holds. Until your booking is confirmed, prices and availability can change,
							because the hotels, airlines and operators we book with change theirs.
						</li>
						<li>
							<strong>Your booking is confirmed when we confirm it in writing</strong>, after you have
							accepted the quote and paid as your invoice asks (or as we have agreed with you in writing).
						</li>
						<li>
							When you book for other people, you confirm that they have agreed to these terms and that the
							details you give us for them are correct.
						</li>
					</ul>

					<h2>3. Our role</h2>
					<p>
						We arrange travel services that other businesses provide: accommodation, transport, flights,
						tours, guides and activities (&ldquo;suppliers&rdquo;). Each supplier&rsquo;s own terms also apply to
						the part of the trip they provide, and we will tell you about any that matter, such as
						non-refundable rates.
					</p>
					<p>
						We take reasonable care and skill in choosing suppliers and making your arrangements. We are not
						responsible for what a supplier does or fails to do, except where the law makes us responsible.
					</p>

					<h2>4. Prices and payment</h2>
					<ul>
						<li>Prices are in South African rand unless your quote says otherwise, and include VAT where it applies.</li>
						<li>Your invoice says how much is due and when.</li>
						<li>
							Pay by bank transfer using the details on your invoice, with the invoice number as your
							reference, or online where your invoice offers it.
						</li>
						<li>
							<strong>We will never ask you by email or message to pay into a different bank account.</strong>{" "}
							If you receive a request like that, do not pay. Call us on a number you already know.
						</li>
					</ul>

					<h2>5. If you change or cancel your booking</h2>
					<p>
						Tell us in writing. Changes and cancellations are subject to our{" "}
						<Link href="/refunds/">cancellation and refund policy</Link>, to the cancellation terms shown on
						your quote, and to the charges suppliers make to us. We will tell you what a change will cost
						before we make it.
					</p>

					<h2>6. If we or a supplier must change or cancel</h2>
					<p>
						Occasionally a supplier changes or cancels a service. We will tell you as soon as we know, and
						offer you a comparable alternative or a refund of what you paid for the services you do not
						receive.
					</p>

					<h2>7. Travel documents, health and insurance</h2>
					<ul>
						<li>
							You are responsible for having valid passports, visas, permits and health certificates for
							every traveller. Check the requirements for every country you enter or pass through, including
							how long a passport must remain valid and how many blank pages it needs.
						</li>
						<li>
							Children travelling across South Africa&rsquo;s borders may need additional documents. Check the
							current requirements of the Department of Home Affairs before you travel.
						</li>
						<li>
							We strongly recommend travel insurance that covers cancellation, medical costs and lost
							luggage, taken out when you book.
						</li>
						<li>
							Give us every traveller&rsquo;s name exactly as it appears in their passport. A wrong name can
							mean a fee, or a refused flight.
						</li>
					</ul>

					<h2>8. While you travel</h2>
					<p>
						If something is wrong, tell the supplier straight away and contact us, so that we can try to put
						it right while you are still there.
					</p>

					<h2>9. Complaints</h2>
					<p>
						Tell us about any complaint as soon as you can, in writing. We will acknowledge it within 2
						working days and try to resolve it fairly and quickly.
					</p>

					<h2>10. Our liability</h2>
					<p>
						Nothing in these terms limits your rights under the Consumer Protection Act 68 of 2008 or any
						other law that protects you. Subject to that, we are not liable for indirect or consequential
						loss, or for events beyond our reasonable control, such as severe weather, natural disasters,
						strikes, civil unrest or the actions of governments.
					</p>

					<h2>11. Your account on this website</h2>
					<p>If you create an account, keep your password to yourself. We may suspend an account that is misused.</p>

					<h2>12. Your personal information</h2>
					<p>
						How we use and protect your information is explained in our{" "}
						<Link href="/privacy/">privacy policy</Link>.
					</p>

					<h2>13. The law that applies</h2>
					<p>These terms are governed by the law of the Republic of South Africa.</p>

					<h2>14. Company information</h2>
					<p>The Electronic Communications and Transactions Act 25 of 2002 asks us to publish the following:</p>
					<ul>
						<li>Full name and legal status: {SITE.legalName}, a private company</li>
						<li>Registration number: {SITE.registration}</li>
						<li>Directors: {SITE.directors}</li>
						<li>Physical address: {SITE.address}</li>
						<li>Address for service of legal documents: {SITE.address}</li>
						<li>
							Telephone: <a href={SITE.phoneTel}>{SITE.phone}</a>
						</li>
						<li>
							Email: <a href={`mailto:${SITE.email}`}>{SITE.email}</a>
						</li>
						<li>Website: www.giftwakotravel.co.za</li>
					</ul>
				</div>
			</section>
		</>
	);
}
