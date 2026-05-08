import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";
import { ok } from "../../_helpers";
import { NextRequest } from "next/server";

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

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const body = deserialize(await req.json());
  const { id, ...data } = body;
  const row = await prisma.shopOrder.update({ where: { id: params.id }, data: data as never });
  return ok(serialize(row as Record<string, unknown>));
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  return ok(await prisma.shopOrder.delete({ where: { id: params.id } }));
}
