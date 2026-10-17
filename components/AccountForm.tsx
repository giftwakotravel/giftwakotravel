"use client";

import Link from "next/link";
import { useState } from "react";

export default function AccountForm({ mode }: { mode: "login" | "register" }) {
	const [sent, setSent] = useState(false);

	if (sent) {
		return (
			<div className="gw-form__success">
				<h2>Online services are being set up</h2>
				<p>
					Account sign-in and online booking are being set up. In the meantime, send a trip request or
					contact us and we will help you.
				</p>
				<p>
					<Link href="/plan-a-trip/">Plan a trip →</Link>
				</p>
			</div>
		);
	}

	return (
		<form
			className="gw-form gw-form--card"
			onSubmit={(e) => {
				e.preventDefault();
				setSent(true);
			}}
		>
			{mode === "register" && (
				<div className="gw-form__field">
					<label className="gw-form__label" htmlFor="ac-name">Full name *</label>
					<input id="ac-name" type="text" autoComplete="name" required />
				</div>
			)}
			{mode === "register" && (
				<div className="gw-form__field">
					<label className="gw-form__label" htmlFor="ac-phone">Phone number</label>
					<input id="ac-phone" type="tel" autoComplete="tel" />
				</div>
			)}
			<div className="gw-form__field">
				<label className="gw-form__label" htmlFor="ac-email">Email address *</label>
				<input id="ac-email" type="email" autoComplete="email" required />
			</div>
			<div className="gw-form__field">
				<label className="gw-form__label" htmlFor="ac-pass">Password *</label>
				<input
					id="ac-pass"
					type="password"
					autoComplete={mode === "login" ? "current-password" : "new-password"}
					required
				/>
			</div>
			<div>
				<button type="submit" className="gw-form__submit">
					{mode === "login" ? "Sign in" : "Create my account"}
				</button>
			</div>
			<p className="gw-small" style={{ margin: 0 }}>
				{mode === "login" ? (
					<>New here? <Link href="/sign-up/">Create an account</Link></>
				) : (
					<>Already have an account? <Link href="/account/">Sign in</Link></>
				)}
			</p>
		</form>
	);
}
