import { prisma } from "@/lib/db";
import { ok } from "../../_helpers";
import { NextRequest } from "next/server";

function serialize(row: Record<string, unknown>) {
  const r = { ...row };

  return r;
}

function deserialize(body: Record<string, unknown>) {
  const r = { ...body };

  return r;
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const body = deserialize(await req.json());
  const { id, ...data } = body;
  const row = await prisma.fancall.update({ where: { id: params.id }, data: data as never });
  return ok(serialize(row as Record<string, unknown>));
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  return ok(await prisma.fancall.delete({ where: { id: params.id } }));
}
