import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";
import { ok } from "../_helpers";
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

export async function GET() {
  return ok((await prisma.user.findMany()).map(serialize));
}
export async function POST(req: NextRequest) {
  const body = deserialize(await req.json());
  return ok(serialize(await prisma.user.create({ data: body as never }) as Record<string, unknown>));
}
