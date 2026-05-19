# Team Daily Desk

A small internal PWA for Athithya and Sarvesh.

## Features

- Pending todo board for Athithya and Sarvesh
- Drag to reorder each person's pending todos
- Attendance for each day
- Morning plan and evening completion report
- PostgreSQL storage through Prisma
- Installable from mobile browsers as a PWA

## Local Setup

1. Start PostgreSQL with Docker:

```bash
docker compose up -d
```

If Docker is not running, Homebrew PostgreSQL also works:

```bash
brew services start postgresql@17
psql -h localhost -p 5432 -d postgres -c "DO \$\$ BEGIN IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'internal_app') THEN CREATE ROLE internal_app WITH LOGIN PASSWORD 'internal_app_password'; END IF; END \$\$;"
psql -h localhost -p 5432 -d postgres -c "ALTER ROLE internal_app CREATEDB;"
createdb -h localhost -p 5432 -O internal_app internal_app
```

2. Install dependencies:

```bash
npm install
```

3. Create the database tables:

```bash
npm run db:migrate
```

4. Start the app:

```bash
npm run dev
```

The app runs at `http://localhost:3000`. On a phone connected to the same Wi-Fi, open `http://YOUR_COMPUTER_IP:3000`.

## Mobile Install

Android: open the app in Chrome and use the install option from the browser menu.

iPhone: open the app in Safari, use Share, then Add to Home Screen.
