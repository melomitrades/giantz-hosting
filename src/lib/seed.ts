/**
 * Seeds the SQLite database from the mock data.
 * Run once: npm run db:seed
 */
import { PrismaClient } from "@prisma/client";
import {
  MOCK_USERS, MOCK_KNOWN_GROUPS, MOCK_WEIGHT_CATEGORIES, MOCK_SHOPS,
  MOCK_SHOP_ORDERS, MOCK_FANCALLS, MOCK_SHIPPING, MOCK_PAYMENTS,
  MOCK_ADDY, MOCK_ADDY_ADDRESSES, MOCK_BOXES, MOCK_SORTING_SESSIONS,
  MOCK_NOTIFICATIONS,
} from "./mockData";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  await prisma.user.deleteMany();
  await prisma.knownGroup.deleteMany();
  await prisma.weightCategory.deleteMany();
  await prisma.shop.deleteMany();
  await prisma.shopOrder.deleteMany();
  await prisma.fancall.deleteMany();
  await prisma.shippingPackage.deleteMany();
  await prisma.paymentRecord.deleteMany();
  await prisma.addyItem.deleteMany();
  await prisma.addyAddresses.deleteMany();
  await prisma.box.deleteMany();
  await prisma.sortingSession.deleteMany();
  await prisma.notification.deleteMany();

  for (const u of MOCK_USERS)
    await prisma.user.create({ data: u });

  for (const g of MOCK_KNOWN_GROUPS)
    await prisma.knownGroup.create({ data: { id: g.id, name: g.name, members: { create: g.members } } });

  for (const w of MOCK_WEIGHT_CATEGORIES)
    await prisma.weightCategory.create({ data: w });

  for (const s of MOCK_SHOPS)
    await prisma.shop.create({ data: s });

  for (const o of MOCK_SHOP_ORDERS)
    await prisma.shopOrder.create({ data: { ...o, pricingOptions: JSON.stringify(o.pricingOptions), joiners: JSON.stringify(o.joiners) } });

  for (const f of MOCK_FANCALLS)
    await prisma.fancall.create({ data: f });

  for (const s of MOCK_SHIPPING)
    await prisma.shippingPackage.create({ data: { ...s, shopOrderIds: JSON.stringify(s.shopOrderIds) } });

  for (const p of MOCK_PAYMENTS)
    await prisma.paymentRecord.create({ data: { ...p, coveringLog: p.coveringLog ? JSON.stringify(p.coveringLog) : null } });

  for (const a of MOCK_ADDY)
    await prisma.addyItem.create({ data: a });

  await prisma.addyAddresses.create({ data: { id: "singleton", ...MOCK_ADDY_ADDRESSES } });

  for (const b of MOCK_BOXES)
    await prisma.box.create({ data: { ...b, shopOrderIds: JSON.stringify(b.shopOrderIds), joinerFees: JSON.stringify(b.joinerFees) } });

  for (const s of MOCK_SORTING_SESSIONS)
    await prisma.sortingSession.create({ data: { ...s, versions: JSON.stringify(s.versions), memberSlots: JSON.stringify(s.memberSlots), joiners: JSON.stringify(s.joiners) } });

  for (const n of MOCK_NOTIFICATIONS)
    await prisma.notification.create({ data: n });

  console.log("✅ Done!");
}

main().catch(console.error).finally(() => prisma.$disconnect());
