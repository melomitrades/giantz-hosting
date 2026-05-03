# ✦ Group Orders — K-pop GO Management System

A Next.js 14 app for managing K-pop group orders, built for two user roles: **Joiner** and **GOM** (Group Order Manager).

---

## Tech Stack

- **Next.js 14** (App Router)
- **TypeScript**
- **React Context** (global state — no external state lib needed)
- **CSS Variables** (design tokens, no Tailwind)
- Custom fonts: DM Serif Display, Gowun Dodum, DM Mono

---

## Features

### 🟢 Joiner Side
| Page | Path | Description |
|---|---|---|
| My Orders | `/joiner/orders` | View personal orders, filter by payment status, see item breakdowns |
| Deadlines | `/joiner/deadlines` | Calendar view of unpaid order deadlines with urgency indicators |
| Order Status | `/joiner/status` | Kanban-style fulfillment status tracker (ordered → at kaddy → otw → arrived) |

### 🩷 GOM Side
| Page | Path | Description |
|---|---|---|
| All Orders | `/gom/orders` | Full orders database, filterable by status/joiner/group, payment proof tracking |
| Fee Calculator | `/gom/fees` | Weight-point-based EMS cost splitter per joiner, configurable point weights |
| Sending Out | `/gom/sending` | Package list with courier, address, shipping status, photo upload |
| Payment Tracker | `/gom/payments` | Payments to kaddys/shops/proxies/sellers, covering log, currency conversion |
| Fancalls / Shops | `/gom/fancalls` | Fancall result tracking + shop database (EN website, ID/passport acceptance) |
| K/C/J-Addy | `/gom/addy` | Arrival tracker for Korea/China/Japan addresses, filterable by country |

---

## Getting Started

```bash
# Install dependencies
npm install

# Run dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

The app will redirect to `/gom/orders` (GOM view) by default.
Use the **role switcher** in the sidebar to toggle between Joiner and GOM views.

---

## Project Structure

```
src/
├── app/
│   ├── (app)/           # Authenticated layout (sidebar)
│   │   ├── joiner/      # Joiner pages
│   │   └── gom/         # GOM pages
│   ├── globals.css      # Design tokens & global styles
│   ├── layout.tsx       # Root layout with providers
│   └── page.tsx         # Redirect to role home
├── components/
│   └── shared/
│       └── Sidebar.tsx  # Navigation + notifications + role switcher
├── context/
│   └── AppContext.tsx   # Global state (React Context)
├── lib/
│   ├── mockData.ts      # Seed data (replace with API calls)
│   └── utils.ts         # Formatting helpers, fee calculator
└── types/
    └── index.ts         # All TypeScript interfaces
```

---

## Connecting to a Real Backend

All data currently lives in `src/lib/mockData.ts`. To connect to a real database:

1. Replace mock imports in `AppContext.tsx` with `fetch()` calls to your API
2. Add loading/error states using React's `useTransition` or SWR
3. Consider adding NextAuth for real authentication between Joiner/GOM accounts

---

## Notifications

The system models four notification types per role:
- `deadline_48h`, `deadline_24h`, `deadline_1h` — time-sensitive alerts
- `deadline_new` — new deadline appeared
- `order_status_update` — fulfillment status changed
- `payment_submitted` — a joiner submitted proof (GOM only)

Unread notifications appear in the sidebar for the active role.

---

## Design System

All colors and tokens are CSS variables in `globals.css`:

```css
--accent-blossom: #f4a7c0;  /* primary pink */
--accent-mint:    #7ed8c4;  /* success/paid */
--accent-lavender:#b5a8f5;  /* secondary */
--accent-gold:    #f5d87a;  /* amounts/currency */
```

---

## Deploying to the web (Vercel + Neon)

### 1. Create a free Neon database
- Go to [neon.tech](https://neon.tech) → sign up → create project
- Copy the **pooled** and **direct** connection strings from the dashboard

### 2. Add your connection strings to `.env`
```
DATABASE_URL="postgresql://..."   ← pooled connection string
DIRECT_URL="postgresql://..."     ← direct connection string
```

### 3. Push schema and seed
```bash
npx prisma db push
npm run db:seed
```

### 4. Push to GitHub
```bash
git init && git add . && git commit -m "initial"
# create repo on github.com, then:
git remote add origin https://github.com/YOU/group-orders.git
git push -u origin main
```

### 5. Deploy on Vercel
- Go to [vercel.com](https://vercel.com) → New Project → import your GitHub repo
- In **Environment Variables**, add:
  - `DATABASE_URL` = your pooled Neon connection string
  - `DIRECT_URL` = your direct Neon connection string
- Click Deploy

Your app will be live at `https://group-orders-xxx.vercel.app` in ~2 minutes.
