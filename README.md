# Lockbox

**Lock in. Hold the line. Get paid.**

Lockbox is a reactive commitment protocol built on Rialo. Groups lock funds together as a public commitment — quit early and you lose a penalty percentage to everyone who stayed. Survive until the deadline and you get paid in full.

Live at → **[lockbox-vault.vercel.app](https://lockbox-vault.vercel.app)**

---

## What It Does

| Action | Result |
|---|---|
| Create a vault | Lock funds with a group around a shared commitment |
| Rage quit early | Lose your penalty % — redistributed instantly to survivors |
| Survive to deadline | Receive your full payout automatically |
| Everyone quits | Vault dies, refunds issued minus penalties |

No custodian. No manual payouts. The protocol enforces everything.

---

## Vault Types

- **Savings** — Group saving toward a shared goal (trips, funds)
- **Accountability** — Habit or commitment pacts (gym, shipping, streaks)
- **DAO / Team** — Treasury locks and contributor commitments
- **Vesting** — Founder or investor lock-ups

---

## How It Works

1. A creator opens a vault with a buy-in amount, penalty %, and deadline
2. Members join (or request to join — creator accepts)
3. Once full, the vault locks and the countdown starts
4. Any member can rage quit — their penalty is slashed and split among survivors instantly
5. At deadline, the reactive rule fires automatically — survivors are paid out, vault closes

Reactive rules are the core engine. Every event (member joined, rage quit, deadline reached) triggers a rule that executes on-chain with no intermediary.

---

## Tech Stack

| Layer | Stack |
|---|---|
| Frontend | Next.js 16, TypeScript, Framer Motion |
| Auth | Privy (wallet, email, Google) |
| Backend | FastAPI, Python 3.12 |
| Database | PostgreSQL (Railway) |
| Chain | Rialo (reactive protocol layer) |
| Deployment | Vercel (frontend) · Railway (backend) |

---

## Running Locally

**Backend**
```bash
cd backend
pip install -r requirements.txt
cp .env.example .env   # add DATABASE_URL
uvicorn main:app --reload --port 8001
```

**Frontend**
```bash
cd frontend
npm install
cp .env.local.example .env.local   # add API URL + Privy app ID
npm run dev
```

---

## API Endpoints

```
GET    /vaults                          List all vaults
POST   /vaults                          Create a vault
GET    /vaults/:id                      Get vault + members
POST   /vaults/:id/join                 Join a vault (creator)
POST   /vaults/:id/quit                 Rage quit
POST   /vaults/:id/requests             Request to join (non-creator)
GET    /vaults/:id/requests             List pending join requests
POST   /vaults/:id/requests/:id/accept  Accept a join request
POST   /vaults/:id/requests/:id/reject  Reject a join request
POST   /vaults/:id/trigger              Fast-forward deadline (demo)
GET    /feed                            Reactive event feed
GET    /leaderboard                     Survivor rankings
GET    /stats                           Platform stats
```

---

## Future Goals

- **Smart contract integration** — Move vault logic fully on-chain on Rialo mainnet; current implementation is protocol-layer simulation
- **Token-gated vaults** — Require holding a specific token or NFT to join a vault
- **Reputation system** — On-chain survival score that follows your wallet across vaults and chains
- **Cross-chain vaults** — Members from different chains locking into the same commitment
- **Vault templates** — One-click vault creation for common use cases (30-day challenges, DAO budgets, founder lockups)
- **Mobile app** — Native iOS/Android with push notifications for deadline warnings and rage quit alerts
- **DAO governance** — Let vault members vote on extending deadlines or adjusting rules before they execute
- **Analytics dashboard** — Public stats on commitment rates, survival percentages, and penalty flows by vault type

---

## Team

| Name | Role | GitHub |
|---|---|---|
| Jennivarl | Full-stack developer | [@Jennivarl](https://github.com/Jennivarl) |
| Mustapha Abdulaziz Dambatta | Smart contract auditor | [@musty_code.py](https://github.com/musty_code.py) |

---

## License

MIT
