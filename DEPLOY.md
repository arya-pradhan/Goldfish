# Deploying Goldfish (free tier, demo-ready)

Stack: **Vercel** (Next.js backend) + **MongoDB Atlas M0** (database). Both free, no sleep, fast cold start. Total cost: $0/month.

The repo has two workspaces:
- `backend/` — Next.js API → deploys to Vercel
- `mobile/` — Expo app → runs locally via `npx expo start` (not deployed)

---

## 1. MongoDB Atlas (database)

1. Sign up at [cloud.mongodb.com](https://cloud.mongodb.com).
2. Create a **free M0** cluster (any cloud/region).
3. **Database Access** → Add New Database User → username + password (save these).
4. **Network Access** → Add IP Address → **Allow access from anywhere (`0.0.0.0/0`)**.
   ⚠️ Required — Vercel's serverless IPs are not static. Without this, connections silently fail.
5. **Connect** → **Drivers** → copy the connection string. Replace `<password>` with your real password and add the db name, e.g.:
   ```
   mongodb+srv://USER:PASSWORD@cluster0.xxxxx.mongodb.net/goldfish?retryWrites=true&w=majority
   ```
   → this is your `MONGODB_URI`.

## 2. Plaid (bank linking, sandbox)

1. Sign up at [dashboard.plaid.com](https://dashboard.plaid.com).
2. **Team Settings → Keys**.
3. Copy `client_id` → `PLAID_CLIENT_ID`.
4. Copy the **Sandbox** secret → `PLAID_SECRET`.
5. `PLAID_ENV=sandbox`.

Sandbox test login when linking in the app: username `user_good`, password `pass_good`.

## 3. Mapbox (map + geocoding)

1. Sign up at [account.mapbox.com](https://account.mapbox.com).
2. **Tokens** → copy the **Default public token**.
3. Use it for both `MAPBOX_TOKEN` (backend) and `EXPO_PUBLIC_MAPBOX_TOKEN` (mobile). One token covers both.

## 4. JWT secret

Generate any long random string:
```powershell
# PowerShell
[guid]::NewGuid().ToString('N') + [guid]::NewGuid().ToString('N')
```
```bash
# or bash
openssl rand -hex 32
```
→ this is your `JWT_SECRET`.

---

## 5. Push to GitHub

```powershell
cd C:\Users\aryas\Vault\goldfish
git add -A
git commit -m "Prep for Vercel deploy"
git remote add origin https://github.com/<you>/goldfish.git   # if not already set
git push -u origin main
```

## 6. Deploy backend to Vercel

1. Sign up at [vercel.com](https://vercel.com) → **Continue with GitHub**.
2. **Add New… → Project** → import the `goldfish` repo.
3. **Root Directory → Edit → set to `backend`.**
   ⚠️ Required — the repo has both `mobile/` and `backend/`; Vercel must build only `backend`.
4. **Environment Variables** — add all six (values from steps 1–4):
   | Key | Value |
   |-----|-------|
   | `MONGODB_URI` | from step 1 |
   | `JWT_SECRET` | from step 4 |
   | `PLAID_CLIENT_ID` | from step 2 |
   | `PLAID_SECRET` | from step 2 (sandbox) |
   | `PLAID_ENV` | `sandbox` |
   | `MAPBOX_TOKEN` | from step 3 |
5. **Deploy.** Note the resulting URL, e.g. `https://goldfish-xxxx.vercel.app`.

Future pushes to `main` auto-deploy.

## 7. Point the mobile app at the deployed backend

In `mobile/.env` (copy from `mobile/.env.example`):
```
EXPO_PUBLIC_API_URL=https://goldfish-xxxx.vercel.app
EXPO_PUBLIC_MAPBOX_TOKEN=<your mapbox token>
EXPO_PUBLIC_SIMULATE_HOTZONE=true
```
Restart Expo (`npx expo start -c`) so the new env is picked up.

---

## Verify

```bash
# Replace with your Vercel URL. Should return a JWT.
curl -X POST https://goldfish-xxxx.vercel.app/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@demo.com","password":"pass1234"}'
```
A JWT back = Vercel → Atlas is working. Run it twice; the second call is faster (warm connection reused).

Then in the app: log in → link bank with `user_good`/`pass_good` → sync → see the heatmap.

---

## Local development

```powershell
# backend (copy backend/.env.example → backend/.env, fill values)
cd C:\Users\aryas\Vault\goldfish\backend
npm run dev      # http://localhost:3000

# mobile (set EXPO_PUBLIC_API_URL to your LAN IP for a physical device)
cd C:\Users\aryas\Vault\goldfish\mobile
npx expo start
```
