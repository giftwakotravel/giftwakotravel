import type { Metadata } from "next";
import PageBand from "@/components/PageBand";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
	title: "Privacy policy",
	description:
		"How GiftWako Travel (Pty) Ltd collects, uses, shares and protects your personal information under POPIA.",
};

export default function Privacy() {
	return (
		<>
			<PageBand eyebrow="Legal" title="Privacy policy" />
			<section className="gw-section has-global-padding">
				<div className="gw-wrap gw-legal">
					<p>
						This policy explains what personal information GiftWako Travel (Pty) Ltd (&ldquo;GiftWako&rdquo;,
						&ldquo;we&rdquo;, &ldquo;us&rdquo;) collects, why, who we share it with and what your rights are under
						the Protection of Personal Information Act 4 of 2013 (POPIA).
					</p>

					<h2>1. Who is responsible for your information</h2>
					<p>
						GiftWako Travel (Pty) Ltd, registration number {SITE.registration}, is the responsible party for
						the personal information described here.
					</p>
					<p>
						Our Information Officer is Gift Sekhumise, who can be reached at{" "}
						<a href={`mailto:${SITE.email}`}>{SITE.email}</a>.
					</p>

					<h2>2. What we collect</h2>
					<ul>
						<li>
							<strong>Contact details:</strong> your name, email address and phone number.
						</li>
						<li>
							<strong>Trip details:</strong> where and when you want to travel, who is travelling and what
							you would like us to arrange.
						</li>
						<li>
							<strong>Traveller details, when a booking needs them:</strong> names as they appear in
							passports, dates of birth, nationality, and passport numbers and expiry dates.
						</li>
						<li>
							<strong>Special requirements:</strong> for example dietary, medical or accessibility needs.
							Some of this is special personal information under POPIA, and we ask for it only when a
							booking needs it, and only with your consent.
						</li>
						<li>
							<strong>Your account:</strong> if you create one, your email address and a password. The
							password is stored only in a scrambled (hashed) form that nobody can read back.
						</li>
						<li>
							<strong>Payments:</strong> what you were invoiced and what you paid. If you pay online, your
							card details go to the payment provider, not to us.
						</li>
						<li>
							<strong>Messages:</strong> what you write to us, and our replies.
						</li>
					</ul>

					<h2>3. Why we use it</h2>
					<ul>
						<li>
							To plan your trip, prepare quotes and invoices, and make and manage your bookings. This is
							necessary to perform our agreement with you.
						</li>
						<li>To keep you informed about your booking, and to help you while you travel.</li>
						<li>To meet our legal obligations, such as keeping financial records.</li>
						<li>
							To send you news and offers, <strong>only if you have asked us to</strong>. You can stop these
							at any time with the link in any marketing email, or by telling us.
						</li>
					</ul>

					<h2>4. Who we share it with</h2>
					<p>We share only what each needs:</p>
					<ul>
						<li>
							<strong>The suppliers of your trip</strong>, such as hotels, airlines, transport operators and
							guides, so that they can provide what you booked. Some may be outside South Africa.
							Information is sent to them because your booking needs it.
						</li>
						<li>
							<strong>SBOS, our business system</strong>, operated for us by SonicOpe (Pty) Ltd, which keeps
							our customer and booking records on our behalf and is bound to protect them.
						</li>
						<li>
							<strong>Payment providers</strong>, when you pay online.
						</li>
						<li>
							<strong>Our professional advisers</strong>, and <strong>authorities</strong> when the law
							requires us to.
						</li>
					</ul>
					<p>We do not sell your personal information.</p>

					<h2>5. How long we keep it</h2>
					<p>
						We keep your information for as long as we need it for your bookings and for as long as the law
						requires us to keep records (for example, financial records for at least five years). After that
						we delete it or remove what identifies you.
					</p>

					<h2>6. How we protect it</h2>
					<p>
						Access to your information is limited to the people who need it for your booking. Passport
						numbers are stored encrypted, and our systems use encrypted connections. If we learn that your
						information has been compromised, we will tell you and the Information Regulator as POPIA
						requires.
					</p>

					<h2>7. Your rights</h2>
					<p>You may ask us:</p>
					<ul>
						<li>whether we hold information about you, and for a copy of it;</li>
						<li>to correct or update it;</li>
						<li>to delete it, where we no longer need to keep it;</li>
						<li>to stop using it for direct marketing, or to withdraw a consent you gave.</li>
					</ul>
					<p>
						Contact our Information Officer at{" "}
						<a href={`mailto:${SITE.email}`}>{SITE.email}</a>. If you are not satisfied with our answer, you
						may complain to the Information Regulator at{" "}
						<a href="https://inforegulator.org.za" target="_blank" rel="noopener noreferrer">
							inforegulator.org.za
						</a>
						.
					</p>

					<h2>8. Cookies</h2>
					<p>
						When you sign in to your account, this website sets one essential cookie to keep you signed in,
						for up to 30 days or until you sign out. We do not use advertising or tracking cookies.
					</p>

					<h2>9. Children</h2>
					<p>
						Bookings are made by adults. Information about children who travel is given to us by their
						parent or guardian, for the purpose of the booking.
					</p>

					<h2>10. Changes to this policy</h2>
					<p>When this policy changes, we update the date at the top of this page.</p>
				</div>
			</section>
		</>
	);
}
