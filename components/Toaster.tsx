"use client";

import { useEffect, useState } from "react";

export function toast(message: string) {
	if (typeof window !== "undefined") {
		window.dispatchEvent(new CustomEvent("gw-toast", { detail: message }));
	}
}

export default function Toaster() {
	const [msg, setMsg] = useState("");
	const [on, setOn] = useState(false);

	useEffect(() => {
		let t: ReturnType<typeof setTimeout>;
		const handler = (e: Event) => {
			setMsg((e as CustomEvent).detail);
			setOn(true);
			clearTimeout(t);
			t = setTimeout(() => setOn(false), 2600);
		};
		window.addEventListener("gw-toast", handler);
		return () => window.removeEventListener("gw-toast", handler);
	}, []);

	return (
		<div className={`gw-toast${on ? " is-on" : ""}`} role="status" aria-live="polite">
			{msg}
		</div>
	);
}
