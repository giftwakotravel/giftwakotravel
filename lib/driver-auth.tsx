"use client";

import { createContext, useContext, useEffect, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

interface DriverAuth {
	user: User | null;
	session: Session | null;
	loading: boolean;
	signOut: () => Promise<void>;
}

const Ctx = createContext<DriverAuth>({ user: null, session: null, loading: true, signOut: async () => {} });

export function useDriverAuth() {
	return useContext(Ctx);
}

export function DriverAuthProvider({ children }: { children: React.ReactNode }) {
	const [session, setSession] = useState<Session | null>(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		const c = supabase();
		if (!c) { setLoading(false); return; }
		void c.auth.getSession().then(({ data }) => {
			setSession(data.session);
			setLoading(false);
		});
		const { data: { subscription } } = c.auth.onAuthStateChange((_e, s) => setSession(s));
		return () => subscription.unsubscribe();
	}, []);

	const signOut = async () => {
		const c = supabase();
		if (c) await c.auth.signOut();
		setSession(null);
	};

	return (
		<Ctx.Provider value={{ user: session?.user ?? null, session, loading, signOut }}>
			{children}
		</Ctx.Provider>
	);
}
