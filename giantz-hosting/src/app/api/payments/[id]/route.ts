import { prisma } from "@/lib/db";
import { ok } from "../../_helpers";
import { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

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

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const body = deserialize(await req.json());
  const { id, ...data } = body;
  const row = await prisma.paymentRecord.update({ where: { id: params.id }, data: data as never });
  return ok(serialize(row as Record<string, unknown>));
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  return ok(await prisma.paymentRecord.delete({ where: { id: params.id } }));
}
