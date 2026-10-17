import type { Metadata } from "next";
import PageBand from "@/components/PageBand";

export const metadata: Metadata = {
	title: "Cancellations and refunds",
	description:
		"How cancellations, booking changes and refunds are handled by GiftWako Travel (Pty) Ltd.",
};

export default function Refunds() {
	return (
		<>
			<PageBand eyebrow="Legal" title="Cancellations and refunds" />
			<section className="gw-section has-global-padding">
				<div className="gw-wrap gw-legal">
					<h1>Refunds, Cancellations and Changes Policy</h1>
					<p>
						This policy explains how cancellations, booking changes and refunds are handled by GiftWako
						Travel (Pty) Ltd (&ldquo;GiftWako&rdquo;). It forms part of our booking terms and conditions and must
						be read together with the terms applicable to your confirmed booking.
					</p>

					<h2>1. Cancellation terms applicable to your booking</h2>
					<p>
						The cancellation conditions applicable to your booking will be communicated in your quotation,
						booking confirmation or other applicable booking documentation before you confirm your booking.
					</p>
					<p>
						These conditions may vary depending on the service booked, the supplier&rsquo;s terms, the time
						remaining before departure and any non-refundable costs. Any agreed booking-specific conditions
						remain subject to applicable law.
					</p>

					<h2>2. Cancelling a booking</h2>
					<p>
						To cancel a booking, contact GiftWako in writing using the contact details published on our
						website. Please include your booking reference, full name and the details of the services you
						wish to cancel.
					</p>
					<p>
						We will acknowledge your cancellation request in writing and confirm the applicable cancellation
						conditions, any charges and the estimated refund, if applicable.
					</p>
					<p>
						Cancellation charges will be determined in accordance with the agreed booking conditions,
						applicable supplier terms and applicable law. Any charge must be reasonable where required by
						law.
					</p>
					<p>
						If you do not arrive for a booked service or fail to use a service without cancelling, the
						applicable no-show conditions will apply, subject to applicable law.
					</p>

					<h2>3. Non-refundable services and supplier charges</h2>
					<p>
						Certain services, including some flights, accommodation rates, event tickets and special travel
						arrangements, may be subject to non-refundable conditions imposed by suppliers.
					</p>
					<p>
						Where applicable, these conditions will be communicated before booking confirmation. Any amount
						retained or deducted must be consistent with the agreed terms and applicable law.
					</p>

					<h2>4. Changes to a booking</h2>
					<p>
						Requests to change travel dates, passenger details, accommodation, transport or other booking
						arrangements are subject to availability and the relevant supplier&rsquo;s conditions.
					</p>
					<p>
						Additional charges may apply. We will communicate any applicable costs and obtain your agreement
						before proceeding with a chargeable change.
					</p>
					<p>
						If a requested change cannot be accommodated, we will explain the available options under the
						applicable booking conditions.
					</p>

					<h2>5. Cancellations by GiftWako or a supplier</h2>
					<p>
						If GiftWako or a supplier cancels a service, we will inform you as soon as reasonably
						practicable and explain the available options.
					</p>
					<p>
						Depending on the circumstances and applicable law, these options may include an alternative
						service, rescheduling or a refund for services not provided.
					</p>
					<p>
						Any refund or alternative arrangement will be handled in accordance with the applicable booking
						terms and your statutory rights.
					</p>

					<h2>6. How refunds are processed</h2>
					<p>
						Approved refunds will ordinarily be returned to the original payment method or account, subject
						to payment-provider requirements and applicable law.
					</p>
					<p>
						Where GiftWako controls the refund process and has received the funds required to make the
						payment, we will aim to process an approved refund within five working days.
					</p>
					<p>
						Where a refund depends on a supplier or payment provider, we will communicate any material delay
						and provide updates where reasonably possible.
					</p>
					<p>
						For security purposes, requests to pay a refund into a different account may require additional
						identity and payment verification.
					</p>

					<h2>7. Your statutory rights</h2>
					<p>
						Nothing in this policy excludes, restricts or limits any consumer right that cannot lawfully be
						excluded, restricted or limited.
					</p>
					<p>
						Section 17 of the Consumer Protection Act 68 of 2008 addresses the cancellation of advance
						bookings, reservations and orders, including the circumstances in which reasonable cancellation
						charges may apply.
					</p>
					<p>
						Section 42 of the Electronic Communications and Transactions Act 25 of 2002 sets out exceptions
						to the electronic-transaction cooling-off provisions, including certain accommodation,
						transport, catering and leisure services booked for a specific date or period.
					</p>
					<p>
						The application of these provisions depends on the circumstances of the transaction. This policy
						must be interpreted consistently with applicable South African law.
					</p>
				</div>
			</section>
		</>
	);
}
