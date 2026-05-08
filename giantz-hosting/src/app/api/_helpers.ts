import { NextResponse } from "next/server";
export function ok(data: unknown) { return NextResponse.json(data); }
export function err(msg: string, status = 400) { return NextResponse.json({ error: msg }, { status }); }
