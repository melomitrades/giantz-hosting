import { prisma } from "@/lib/db";
import { ok } from "../_helpers";
import { NextRequest } from "next/server";

function serialize(row: Record<string, unknown>) {
  const r = { ...row };
  if (typeof r.shopOrderIds === "string") r.shopOrderIds = JSON.parse(r.shopOrderIds as string);
  return r;
}

function deserialize(body: Record<string, unknown>) {
  const r = { ...body };
  if (r.shopOrderIds !== undefined && typeof r.shopOrderIds !== "string") r.shopOrderIds = JSON.stringify(r.shopOrderIds);
  return r;
}

export async function GET() {
  const rows = await prisma.shippingPackage.findMany();
  return ok(rows.map(serialize));
}

export async function POST(req: NextRequest) {
  const body = deserialize(await req.json());
  const row = await prisma.shippingPackage.create({ data: body as never });
  return ok(serialize(row as Record<string, unknown>));
}
