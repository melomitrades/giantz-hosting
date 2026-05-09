import { prisma } from "@/lib/db";
import { ok } from "../_helpers";
import { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

function serialize(row: Record<string, unknown>) {
  const r = { ...row };

  return r;
}

function deserialize(body: Record<string, unknown>) {
  const r = { ...body };

  return r;
}

export async function GET() {
  const rows = await prisma.weightCategory.findMany();
  return ok(rows.map(serialize));
}

export async function POST(req: NextRequest) {
  const body = deserialize(await req.json());
  const row = await prisma.weightCategory.create({ data: body as never });
  return ok(serialize(row as Record<string, unknown>));
}
