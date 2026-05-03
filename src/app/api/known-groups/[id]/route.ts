import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";
import { ok } from "../../_helpers";
import { NextRequest } from "next/server";

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const { name, members = [] } = await req.json();
  await prisma.knownMember.deleteMany({ where: { groupId: params.id } });
  const group = await prisma.knownGroup.update({
    where: { id: params.id },
    data: { name, members: { create: members } },
    include: { members: true },
  });
  return ok(group);
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  return ok(await prisma.knownGroup.delete({ where: { id: params.id } }));
}
