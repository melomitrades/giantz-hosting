import { prisma } from "@/lib/db";
import { ok } from "../../_helpers";
import { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const { id, fixedForGroups, ...body } = await req.json();
  return ok(await prisma.user.update({ where: { id: params.id }, data: body }));
}
export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  return ok(await prisma.user.delete({ where: { id: params.id } }));
}
