# Ozone Keep-Alive Setup

Render free tier sleeps after **15 min** of inactivity.  
Supabase free tier pauses after **7 days** of no activity.  
This guide shows how to keep both alive at zero cost.

---

## How it works

`GET /api/ping` on the backend:
1. Wakes Render (the HTTP request itself wakes it up).
2. Runs `SELECT id FROM users LIMIT 1` — keeps Supabase from pausing.
3. Returns `{ "ok": true, "ts": "..." }`.

One external ping every 5 minutes is enough to keep both services permanently active.

---

## Option 1 — GitHub Actions (recommended, already configured)

The file `.github/workflows/keep-alive.yml` is included in this repo.  
It runs a cron job every 5 minutes and curls the endpoint.

**Requirements:**
- Repo must be **public** (free unlimited minutes) OR you have enough private-repo minutes.
- Push the code to GitHub — the workflow activates automatically.
- No secrets or configuration needed.

**Verify it works:**
1. Go to your repo on GitHub → **Actions** tab.
2. You should see "Keep Ozone Alive" workflow runs every ~5 min.
3. Each run should show `Ping OK`.

> **Note:** GitHub's scheduler is not exact — runs may be delayed up to ~2 min during high load. Still well within the 15-min Render sleep window.

---

## Option 2 — UptimeRobot (free, 5-min interval)

1. Go to [uptimerobot.com](https://uptimerobot.com) and create a free account.
2. Click **+ Add New Monitor**.
3. Settings:
   - **Monitor Type:** HTTP(s)
   - **Friendly Name:** Ozone Keep-Alive
   - **URL:** `https://ozone-0qpm.onrender.com/api/ping`
   - **Monitoring Interval:** 5 minutes
4. Click **Create Monitor**.

Free tier: up to 50 monitors, 5-min interval — no credit card required.

---

## Option 3 — cron-job.org (free)

1. Go to [cron-job.org](https://cron-job.org) and sign up.
2. Click **CREATE CRONJOB**.
3. Settings:
   - **Title:** Ozone Keep-Alive
   - **URL:** `https://ozone-0qpm.onrender.com/api/ping`
   - **Schedule:** Every 5 minutes
4. Save.

---

## Option 4 — Render Cron Job (if on paid tier)

If you upgrade to Render's Starter plan, you can add a Cron Job service in the Render dashboard that runs:

```
curl https://ozone-0qpm.onrender.com/api/ping
```

every 5 minutes. Not needed if using GitHub Actions.

---

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| `/api/ping` returns 502/503 | Render is starting up — wait 30s and retry |
| `/api/ping` returns `{ "ok": false }` | Supabase env vars missing or DB unreachable |
| GitHub Action shows "Ping FAILED" | Check Render deploy logs; env vars may be missing |
| Supabase still pauses | Ensure the ping is actually running (check Action logs) |
