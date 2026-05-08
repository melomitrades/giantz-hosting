import { prisma } from "@/lib/db";
import { ok } from "../../_helpers";
import { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

function serialize(row: Record<string, unknown>) {
  return {
    ...row,
    fixedJoiners: typeof row.fixedJoiners === "string" ? JSON.parse(row.fixedJoiners as string) : (row.fixedJoiners ?? []),
  };
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const { name, members = [], fixedJoiners = [] } = await req.json();
  await prisma.knownMember.deleteMany({ where: { groupId: params.id } });
  const group = await prisma.knownGroup.update({
    where: { id: params.id },
    data: { name, fixedJoiners: JSON.stringify(fixedJoiners), members: { create: members } },
    include: { members: true },
  });
  return ok(serialize(group as Record<string, unknown>));
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  return ok(await prisma.knownGroup.delete({ where: { id: params.id } }));
}
