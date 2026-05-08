import { prisma } from "@/lib/db";
import { ok } from "../_helpers";
import { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

function serialize(row: Record<string, unknown> & { members?: unknown }) {
  return {
    ...row,
    fixedJoiners: typeof row.fixedJoiners === "string" ? JSON.parse(row.fixedJoiners as string) : (row.fixedJoiners ?? []),
  };
}

export async function GET() {
  const groups = await prisma.knownGroup.findMany({ include: { members: true } });
  return ok(groups.map(serialize));
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { members = [], fixedJoiners = [], ...rest } = body;
  const row = await prisma.knownGroup.create({
    data: { ...rest, fixedJoiners: JSON.stringify(fixedJoiners), members: { create: members } },
    include: { members: true },
  });
  return ok(serialize(row as Record<string, unknown>));
}
