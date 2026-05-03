import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";
import { ok } from "../_helpers";
import { NextRequest } from "next/server";

function serialize(row: Record<string, unknown>) {
  const r = { ...row };
  if (typeof r.versions === "string") r.versions = JSON.parse(r.versions as string);
  if (typeof r.memberSlots === "string") r.memberSlots = JSON.parse(r.memberSlots as string);
  if (typeof r.joiners === "string") r.joiners = JSON.parse(r.joiners as string);
  return r;
}

function deserialize(body: Record<string, unknown>) {
  const r = { ...body };
  if (r.versions !== undefined && typeof r.versions !== "string") r.versions = JSON.stringify(r.versions);
  if (r.memberSlots !== undefined && typeof r.memberSlots !== "string") r.memberSlots = JSON.stringify(r.memberSlots);
  if (r.joiners !== undefined && typeof r.joiners !== "string") r.joiners = JSON.stringify(r.joiners);
  return r;
}

export async function GET() {
  const rows = await prisma.sortingSession.findMany();
  return ok(rows.map(serialize));
}

export async function POST(req: NextRequest) {
  const body = deserialize(await req.json());
  const row = await prisma.sortingSession.create({ data: body as never });
  return ok(serialize(row as Record<string, unknown>));
}
