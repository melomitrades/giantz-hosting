import { prisma } from "@/lib/db";
import { ok } from "../_helpers";
import { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

function serialize(row: Record<string, unknown>) {
  const r = { ...row };
  if (typeof r.pricingOptions === "string") r.pricingOptions = JSON.parse(r.pricingOptions as string);
  if (typeof r.joiners === "string") r.joiners = JSON.parse(r.joiners as string);
  return r;
}

function deserialize(body: Record<string, unknown>) {
  const r = { ...body };
  if (r.pricingOptions !== undefined && typeof r.pricingOptions !== "string") r.pricingOptions = JSON.stringify(r.pricingOptions);
  if (r.joiners !== undefined && typeof r.joiners !== "string") r.joiners = JSON.stringify(r.joiners);
  return r;
}

export async function GET() {
  const rows = await prisma.shopOrder.findMany();
  return ok(rows.map(serialize));
}

export async function POST(req: NextRequest) {
  const body = deserialize(await req.json());
  const row = await prisma.shopOrder.create({ data: body as never });
  return ok(serialize(row as Record<string, unknown>));
}
