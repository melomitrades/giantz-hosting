import { prisma } from "@/lib/db";
import { ok } from "../_helpers";
import { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  return ok(await prisma.user.findMany());
}
export async function POST(req: NextRequest) {
  const { fixedForGroups, ...body } = await req.json();
  return ok(await prisma.user.create({ data: body }));
}
