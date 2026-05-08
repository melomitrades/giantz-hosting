import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";
import { ok } from "../../_helpers";
import { NextRequest } from "next/server";

function serialize(row: Record<string, unknown>) {
  const r = { ...row };
  if (typeof r.fixedForGroups === "string") r.fixedForGroups = JSON.parse(r.fixedForGroups as string);
  return r;
}
function deserialize(body: Record<string, unknown>) {
  const r = { ...body };
  if (r.fixedForGroups !== undefined && typeof r.fixedForGroups !== "string") r.fixedForGroups = JSON.stringify(r.fixedForGroups);
  return r;
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const body = deserialize(await req.json());
  const { id, ...data } = body;
  return ok(serialize(await prisma.user.update({ where: { id: params.id }, data: data as never }) as Record<string, unknown>));
}
export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  return ok(await prisma.user.delete({ where: { id: params.id } }));
}
