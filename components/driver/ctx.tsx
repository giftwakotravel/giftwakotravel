"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import { toast } from "@/components/Toaster";
import { Confirm } from "@/components/admin/ui";
import type { Section } from "@/lib/driver-portal";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Row = Record<string, any>;

export interface ConfirmOpts {
	title: string;
	body: string;
	okLabel?: string;
	action: () => void;
}

export interface DriverCtx {
	user: User;
	profile: Row | null;
	vehicles: Row[];
	documents: Row[];
	contract: Row | null;
	trips: Row[];
	jobs: Row[];
	notifications: Row[];
	loaded: boolean;
	reload: () => Promise<void>;
	go: (s: Section) => void;
	confirm: (o: ConfirmOpts) => void;
}

const Ctx = createContext<DriverCtx | null>(null);
export function useDriver() {
	return useContext(Ctx)!;
}

export function DriverProvider({ user, go, children }: {
	user: User;
	go: (s: Section) => void;
	children: React.ReactNode;
}) {
	const [profile, setProfile] = useState<Row | null>(null);
	const [vehicles, setVehicles] = useState<Row[]>([]);
	const [documents, setDocuments] = useState<Row[]>([]);
	const [contracts, setContracts] = useState<Row[]>([]);
	const [trips, setTrips] = useState<Row[]>([]);
	const [jobs, setJobs] = useState<Row[]>([]);
	const [notifications, setNotifications] = useState<Row[]>([]);
	const [loaded, setLoaded] = useState(false);
	const [confirmOpts, setConfirmOpts] = useState<ConfirmOpts | null>(null);

	const reload = useCallback(async () => {
		const c = supabase();
		if (!c) { setLoaded(true); return; }
		const [p, v, d, ct, t, j, n] = await Promise.all([
			c.from("driver_profiles").select("*").eq("user_id", user.id).maybeSingle(),
			c.from("driver_vehicles").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
			c.from("driver_documents").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
			c.from("driver_contracts").select("*").eq("user_id", user.id).order("accepted_at", { ascending: false }),
			c.from("driver_trips").select("*").eq("user_id", user.id).order("trip_date", { ascending: true }),
			c.from("driver_jobs").select("*").order("created_at", { ascending: false }),
			c.from("driver_notifications").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
		]);
		for (const r of [p, v, d, ct, t, j, n]) {
			if (r.error) toast(`Could not load portal data (${r.error.message})`);
		}
		let prof = (p.data as Row | null) ?? null;
		if (!prof && !p.error) {
			const { error: insErr } = await c.from("driver_profiles").insert({
				user_id: user.id,
				email: user.email ?? null,
				full_name: (user.user_metadata?.full_name as string | undefined) ?? null,
				surname: (user.user_metadata?.surname as string | undefined) ?? null,
				phone: (user.user_metadata?.phone as string | undefined) ?? null,
			});
			if (insErr && insErr.code !== "23505") {
				toast(`Could not create profile (${insErr.message})`);
			} else {
				const again = await c.from("driver_profiles").select("*").eq("user_id", user.id).maybeSingle();
				prof = (again.data as Row | null) ?? null;
			}
		}
		setProfile(prof);
		setVehicles((v.data as Row[] | null) ?? []);
		setDocuments((d.data as Row[] | null) ?? []);
		setContracts((ct.data as Row[] | null) ?? []);
		setTrips((t.data as Row[] | null) ?? []);
		setJobs((j.data as Row[] | null) ?? []);
		setNotifications((n.data as Row[] | null) ?? []);
		setLoaded(true);
	}, [user.id]);

	useEffect(() => { void reload(); }, [reload]);

	const ctx: DriverCtx = {
		user, profile, vehicles, documents,
		contract: contracts[0] ?? null,
		trips, jobs, notifications, loaded,
		reload, go,
		confirm: (o) => setConfirmOpts(o),
	};

	return (
		<Ctx.Provider value={ctx}>
			{children}
			{confirmOpts && (
				<Confirm
					title={confirmOpts.title}
					body={confirmOpts.body}
					okLabel={confirmOpts.okLabel}
					onCancel={() => setConfirmOpts(null)}
					onOk={() => { confirmOpts.action(); setConfirmOpts(null); }}
				/>
			)}
		</Ctx.Provider>
	);
}
