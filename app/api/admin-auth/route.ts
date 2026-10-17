import { NextResponse } from "next/server";

export async function POST(req: Request) {
	const { username, password } = await req.json().catch(() => ({ username: "", password: "" }));
	const user = process.env.ADMIN_USERNAME ?? "Giftwak@";
	const pass = process.env.ADMIN_PASSWORD;
	if (!pass) {
		console.error("[admin-auth] ADMIN_PASSWORD is not set");
		return NextResponse.json({ ok: false }, { status: 500 });
	}
	return NextResponse.json({ ok: username === user && password === pass });
}
