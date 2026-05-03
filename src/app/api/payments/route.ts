import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";
import { ok } from "../_helpers";
import { NextRequest } from "next/server";

function serialize(row: Record<string, unknown>) {
  const r = { ...row };
  if (typeof r.coveringLog === "string") r.coveringLog = JSON.parse(r.coveringLog as string);
  return r;
}

function deserialize(body: Record<string, unknown>) {
  const r = { ...body };
  if (r.coveringLog !== undefined && typeof r.coveringLog !== "string") r.coveringLog = JSON.stringify(r.coveringLog);
  return r;
}

export async function GET() {
  const rows = await prisma.paymentRecord.findMany();
  return ok(rows.map(serialize));
}

export async function POST(req: NextRequest) {
  const body = deserialize(await req.json());
  const row = await prisma.paymentRecord.create({ data: body as never });
  return ok(serialize(row as Record<string, unknown>));
}
