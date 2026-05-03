import { prisma } from "@/lib/db";
import { ok } from "../_helpers";
import { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const row = await prisma.addyAddresses.findUnique({ where: { id: "singleton" } });
  return ok(row ?? { id: "singleton", korea: "", china: "", japan: "", other: "" });
}

export async function PUT(req: NextRequest) {
  const body = await req.json();
  const row = await prisma.addyAddresses.upsert({
    where: { id: "singleton" },
    update: body,
    create: { id: "singleton", ...body },
  });
  return ok(row);
}
