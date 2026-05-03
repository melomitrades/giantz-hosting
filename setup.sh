#!/bin/bash
echo "📦 Installing dependencies..."
npm install

echo "⚙️  Generating Prisma client..."
npx prisma generate

echo "🗄️  Pushing schema to database..."
npx prisma db push

echo "🌱 Seeding with initial data..."
npm run db:seed

echo ""
echo "✅ Done! Run: npm run dev"
