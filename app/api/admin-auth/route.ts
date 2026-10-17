import { NextResponse } from "next/server";

export async function POST(req: Request) {
	const { password } = await req.json().catch(() => ({ password: "" }));
	const expected = process.env.ADMIN_PASSWORD;
	if (!expected) {
		// not configured — fail closed but make it obvious in the server log
		console.error("[admin-auth] ADMIN_PASSWORD is not set");
		return NextResponse.json({ ok: false }, { status: 500 });
	}
	return NextResponse.json({ ok: password === expected });
}
