import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let _client: SupabaseClient | null = null;

/** Returns the shared client, or null when env vars are not configured. */
export function supabase(): SupabaseClient | null {
	const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
	const key =
		process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
		process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
	if (!url || !key) {
		console.error("Missing NEXT_PUBLIC_SUPABASE_URL or key — Supabase disabled");
		return null;
	}
	if (!_client) _client = createClient(url, key);
	return _client;
}
