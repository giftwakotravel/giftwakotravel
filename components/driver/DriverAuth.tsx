"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "@/components/Toaster";

type Tab = "signin" | "signup" | "forgot";

export default function DriverAuth() {
	const [tab, setTab] = useState<Tab>("signin");
	const [f, setF] = useState<Record<string, string>>({});
	const [err, setErr] = useState("");
	const [busy, setBusy] = useState(false);

	const set = (k: string, v: string) => setF((p) => ({ ...p, [k]: v }));
	const inp = (k: string, ph: string, type = "text", ac = "on") => (
		<input type={type} value={f[k] ?? ""} onChange={(e) => set(k, e.target.value)} placeholder={ph} autoComplete={ac} required />
	);

	const submit = async (e: React.FormEvent) => {
		e.preventDefault();
		const c = supabase();
		if (!c) { setErr("Not connected right now — try again later."); return; }
		setErr("");
		setBusy(true);
		try {
			if (tab === "signin") {
				const { error } = await c.auth.signInWithPassword({ email: f.email ?? "", password: f.password ?? "" });
				if (error) setErr(error.message);
			} else if (tab === "signup") {
				if ((f.password ?? "") !== (f.password2 ?? "")) { setErr("Passwords do not match."); setBusy(false); return; }
				const { data, error } = await c.auth.signUp({
					email: f.email ?? "",
					password: f.password ?? "",
					options: { data: { role: "driver", full_name: f.full_name ?? "", surname: f.surname ?? "", phone: f.phone ?? "" } },
				});
				if (error) setErr(error.message);
				else if (!data.session) setErr("Check your email to confirm, then sign in.");
			} else {
				const { error } = await c.auth.resetPasswordForEmail(f.email ?? "", {
					redirectTo: `${window.location.origin}/driver-portal?reset=1`,
				});
				if (error) setErr(error.message);
				else setErr("Reset link sent — check your email.");
			}
		} catch (ex) {
			setErr(ex instanceof Error ? ex.message : "Something went wrong.");
		}
		setBusy(false);
	};

	return (
		<div className="gw-admingate">
			<div className="gw-admingate__card" style={{ maxWidth: "24rem" }}>
				{/* eslint-disable-next-line @next/next/no-img-element */}
				<img src="/images/giftwako-logo.png" alt="GiftWako Travel" width={52} height={52} />
				<h1>Driver Portal</h1>
				<div className="gw-subtabs" style={{ justifyContent: "center" }}>
					{(["signin", "signup", "forgot"] as Tab[]).map((t) => (
						<button key={t} type="button" className={tab === t ? "is-active" : ""} onClick={() => { setTab(t); setErr(""); }}>
							{t === "signin" ? "Sign in" : t === "signup" ? "Create account" : "Forgot password"}
						</button>
					))}
				</div>
				<form onSubmit={submit} style={{ display: "grid", gap: "0.7rem", width: "100%" }}>
					{tab === "signup" && (
						<>
							{inp("full_name", "Full name", "text", "given-name")}
							{inp("surname", "Surname", "text", "family-name")}
							{inp("phone", "Mobile number", "tel", "tel")}
						</>
					)}
					{inp("email", "Email address", "email", "email")}
					{tab !== "forgot" && inp("password", "Password", "password", tab === "signin" ? "current-password" : "new-password")}
					{tab === "signup" && inp("password2", "Confirm password", "password", "new-password")}
					{err && <p className="gw-admingate__err" role="alert">{err}</p>}
					<button type="submit" className="gw-btn gw-btn--gold" disabled={busy}>
						{busy ? "Please wait…" : tab === "signin" ? "Sign in" : tab === "signup" ? "Create account" : "Send reset link"}
					</button>
				</form>
			</div>
		</div>
	);
}

export function ResetPassword() {
	const [pw, setPw] = useState("");
	const [pw2, setPw2] = useState("");
	const [err, setErr] = useState("");
	const [busy, setBusy] = useState(false);

	const submit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (pw !== pw2) { setErr("Passwords do not match."); return; }
		const c = supabase();
		if (!c) { setErr("Not connected right now — try again later."); return; }
		setBusy(true);
		const { error } = await c.auth.updateUser({ password: pw });
		setBusy(false);
		if (error) setErr(error.message);
		else {
			toast("Password updated");
			window.location.href = "/driver-portal";
		}
	};

	return (
		<div className="gw-admingate">
			<form className="gw-admingate__card" onSubmit={submit}>
				{/* eslint-disable-next-line @next/next/no-img-element */}
				<img src="/images/giftwako-logo.png" alt="GiftWako Travel" width={52} height={52} />
				<h1>Set new password</h1>
				<input type="password" value={pw} onChange={(e) => setPw(e.target.value)} placeholder="New password" autoComplete="new-password" required />
				<input type="password" value={pw2} onChange={(e) => setPw2(e.target.value)} placeholder="Confirm password" autoComplete="new-password" required />
				{err && <p className="gw-admingate__err" role="alert">{err}</p>}
				<button type="submit" className="gw-btn gw-btn--gold" disabled={busy}>{busy ? "Saving…" : "Update password"}</button>
			</form>
		</div>
	);
}
