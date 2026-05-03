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
  const rows = await prisma.shop.findMany();
  return ok(rows.map(serialize));
}

export async function POST(req: NextRequest) {
  const body = deserialize(await req.json());
  const row = await prisma.shop.create({ data: body as never });
  return ok(serialize(row as Record<string, unknown>));
}
