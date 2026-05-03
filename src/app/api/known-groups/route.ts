import { prisma } from "@/lib/db";
import { ok } from "../_helpers";
import { NextRequest } from "next/server";

function serialize(row: Record<string, unknown>) {
  const r = { ...row };

  return r;
}

function deserialize(body: Record<string, unknown>) {
  const r = { ...body };

  return r;
}

export async function GET() {
  const rows = await prisma.knownGroup.findMany({ include: { members: true } });
  return ok(rows.map(serialize));
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { members = [], ...rest } = body;
  const row = await prisma.knownGroup.create({
    data: { ...rest, members: { create: members } },
    include: { members: true },
  });
  return ok(row);
}
