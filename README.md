# Finvia App
Cash-flow dashboard (mobile-first PWA) + Node API. Branding taken from the Finvia website (navy/ink `#2124a0`, blue `#2f7bff`, pink `#f0ccff`, panel `#a9cbf7`, bg `#dfeeff`; Bricolage Grotesque + Poppins).
Zero npm dependencies; data is stored in `/data/db.json` (Docker volume). Demo data is seeded on first run.

## Deploy on AWS EC2 (Ubuntu), once
1. Launch EC2, open inbound ports **22** and **80** in the Security Group.
2. `sudo apt update && sudo apt install -y docker.io docker-compose-v2 git && sudo usermod -aG docker $USER` (re-login)
3. `git clone https://github.com/<you>/finvia-app.git && cd finvia-app && docker compose up -d --build`
4. Open `http://<EC2-public-IP>/` — health check at `/health`.

Update later: `git pull && docker compose up -d --build`.
Run locally without Docker: `node server.js` → http://localhost:3000

## API
`GET /api/dashboard?range=month|week` · `GET /api/transactions` · `POST /api/transactions {type:"in"|"out",amount,note}`
