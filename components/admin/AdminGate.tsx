"use client";

import { useState } from "react";

const KEY = "gw-admin-authed";

export default function AdminGate({ children }: { children: React.ReactNode }) {
	const [authed, setAuthed] = useState(() => {
		try { return sessionStorage.getItem(KEY) === "1"; } catch { return false; }
	});
	const [username, setUsername] = useState("");
	const [password, setPassword] = useState("");
	const [err, setErr] = useState("");
	const [checking, setChecking] = useState(false);

	const login = async (e: React.FormEvent) => {
		e.preventDefault();
		setChecking(true);
		setErr("");
		try {
			const res = await fetch("/api/admin-auth", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ username, password }),
			});
			const json = await res.json();
			if (json.ok) {
				sessionStorage.setItem(KEY, "1");
				setAuthed(true);
			} else {
				setErr(res.status === 500 ? "Admin password not configured on the server." : "Wrong password.");
			}
		} catch {
			setErr("Could not check the password — try again.");
		}
		setChecking(false);
	};

	if (authed) return <>{children}</>;

	return (
		<div className="gw-admingate">
			<form className="gw-admingate__card" onSubmit={login}>
				{/* eslint-disable-next-line @next/next/no-img-element */}
				<img src="/images/giftwako-logo.png" alt="GiftWako Travel" width={52} height={52} />
				<h1>GiftWako Admin</h1>
				<p className="gw-small">Enter the admin password to continue.</p>
				{err && <p className="gw-admingate__err" role="alert">{err}</p>}
				<input
					type="text"
					value={username}
					onChange={(e) => setUsername(e.target.value)}
					placeholder="Username"
					autoComplete="username"
					autoFocus
					required
				/>
				<input
					type="password"
					value={password}
					onChange={(e) => setPassword(e.target.value)}
					placeholder="Admin password"
					autoFocus
					required
				/>
				<button type="submit" className="gw-btn gw-btn--gold" disabled={checking}>
					{checking ? "Checking…" : "Sign in"}
				</button>
			</form>
		</div>
	);
}
