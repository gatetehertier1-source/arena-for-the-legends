# 🏆 League for Legends Arena

Rwanda's premier competitive gaming platform — eFootball & CODM tournaments.

**Stack:** React · Node/Express · Supabase (PostgreSQL)

---

## 📁 Project Structure

```
arena/
├── client/                  ← React frontend (port 3000)
│   └── src/
│       ├── components/      Navbar, BracketViewer, Countdown
│       ├── context/         AuthContext (JWT)
│       ├── pages/           Home, Auth, Tournaments, Leaderboard, Profile, Admin
│       └── styles/          global.css (dark esports theme)
└── server/                  ← Express backend (port 5000)
    ├── db.js                Supabase client singleton
    ├── schema.sql           ★ Run this once in Supabase SQL Editor
    ├── middleware/auth.js   JWT guard + admin-only guard
    ├── routes/              auth, tournaments, matches, users
    └── utils/bracketGenerator.js   Auto bracket seeding
```

---

## ⚡ Quick Start

### 1 — Create a Supabase project

1. Go to https://supabase.com → New Project
2. Copy your **Project URL** and **Service Role Key** from:
   `Project Settings → API`
3. Go to **SQL Editor** → paste and run `server/schema.sql`
4. Go to **Storage** → create a public bucket called `avatars`

### 2 — Install & configure

```bash
# Backend
cd server
npm install
cp .env.example .env
# Fill in SUPABASE_URL, SUPABASE_SERVICE_KEY, JWT_SECRET

# Frontend
cd ../client
npm install
```

### 3 — Run both servers

```bash
# Terminal 1 — backend
cd server && npm run dev

# Terminal 2 — frontend
cd client && npm start
```

Frontend → http://localhost:3000
API → http://localhost:5000

---

## 👤 Make yourself Admin

After registering, go to Supabase Dashboard → Table Editor → `users`
Find your row and change `role` from `player` to `admin`.

Or run in SQL Editor:
```sql
UPDATE users SET role = 'admin' WHERE email = 'your@email.com';
```

---

## 🔑 API Reference

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/auth/register | Register (username, email, password) |
| POST | /api/auth/login | Login → returns JWT token |
| GET | /api/auth/me | Get logged-in user |

### Tournaments
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | /api/tournaments | — | List all |
| GET | /api/tournaments/:id | — | Detail + players |
| POST | /api/tournaments | Admin | Create |
| PUT | /api/tournaments/:id | Admin | Update status/fields |
| POST | /api/tournaments/:id/join | Player | Register |
| POST | /api/tournaments/:id/generate-bracket | Admin | Auto-seed bracket |

### Matches
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | /api/matches?tournament=id | — | List matches |
| GET | /api/matches?status=pending | — | Pending approvals |
| POST | /api/matches/:id/submit | Player | Submit score |
| PUT | /api/matches/:id/result | Admin | Approve + advance bracket |

### Users
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | /api/leaderboard | — | Top 50 by points |
| GET | /api/stats | — | Platform stats |
| PUT | /api/users/me | Player | Update bio/game |
| POST | /api/users/me/avatar | Player | Upload avatar (base64) |
| GET | /api/users/me/tournaments | Player | My tournaments |

---

## 🏗️ Tournament Flow

```
Admin creates tournament  →  status: "upcoming"
Admin opens registration  →  status: "open"
Players join
Admin clicks Generate Bracket  →  auto random seeding  →  status: "live"
Players submit scores  →  Admin approves  →  bracket advances automatically
Admin marks complete  →  status: "completed"
```

---

## 🗄️ Supabase Tables

| Table | Description |
|-------|-------------|
| `users` | Players + admins with stats |
| `tournaments` | Tournament records |
| `tournament_registrations` | Join table (player ↔ tournament) |
| `matches` | All bracket matches with scores/winner |

---

## 🚀 Deploy for Free

| Part | Service | Cost |
|------|---------|------|
| Database | Supabase free tier | Free (500MB) |
| Backend | Railway or Render | Free tier |
| Frontend | Vercel | Free |
| Avatars | Supabase Storage | Free (1GB) |

---

## 💡 Next Features

- [ ] Socket.io — live bracket updates
- [ ] Stripe/PayPal entry fee payments
- [ ] Match dispute system
- [ ] Tournament invite links
- [ ] Mobile app (React Native, same API)
