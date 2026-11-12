# Deploy USIMS as a complete application

GitHub Pages is static hosting. It cannot run this project's Express API or MariaDB database. The production deployment therefore runs the frontend, API, and database together with Docker Compose. The browser receives the frontend and API from the same Express origin; the database stays on a private Docker network.

## Requirements

- A Linux VPS or server with Docker Engine and the Docker Compose plugin
- A domain name (recommended) and HTTPS reverse proxy such as Caddy or Nginx
- At least 1 GB RAM for a small demonstration deployment; 2 GB or more is recommended

Do not expose MariaDB port 3306 publicly. Only expose the application port to your reverse proxy.

## 1. Prepare secrets

On the server, clone the repository and enter its directory:

```bash
git clone https://github.com/otienofrank27/University-Student-Information-Management-System.git
cd University-Student-Information-Management-System
cp .env.example .env
```

Generate unique secrets. Use hex output so the values can safely be used by the database initialization script:

```bash
openssl rand -hex 32
```

Set the output separately for `DB_ROOT_PASSWORD`, `DB_PASSWORD`, `DB_ADMIN_PASSWORD`, `DB_LECTURER_PASSWORD`, and `SESSION_SECRET` in `.env`. Do not reuse the same value. Keep `.env` on the server only; never commit it or paste its contents into an issue or chat.

Set `DB_HOST=database` and `DB_ADMIN_HOST=database`. Keep `DB_NAME=usims`, `DB_USER=sims_app`, and `DB_ADMIN_USER=sims_admin`.

## 2. Create the application login

Generate a scrypt hash on the server. The utility asks for the password without echoing it:

```bash
node scripts/hash-password.js
```

Put the generated `AUTH_PASSWORD_HASH=scrypt$...` value in `.env`. Set `AUTH_USERNAME` to the administrator username you want. The plaintext password is not stored in the repository.

## 3. Start the full stack

```bash
docker compose up -d --build
docker compose ps
docker compose logs -f app database
```

On the first start, MariaDB creates the three database accounts, installs the schema, views, stored procedures, triggers, and synthetic demonstration data. The database volume persists between container restarts. The initialization scripts run only when the database volume is first created.

Open `http://SERVER_IP:3001` to test the app. The health endpoint is `http://SERVER_IP:3001/api/health`; it should return JSON with `ok: true` and `database: usims`.

## 4. Put HTTPS in front

For a public deployment, point your domain to the server and configure Caddy or Nginx to proxy HTTPS traffic to `127.0.0.1:3001`. Do not publish port 3306. Set the application port binding to `127.0.0.1:3001:3001` in `docker-compose.yml` when a reverse proxy runs on the host. The app uses secure session cookies in production, so sign-in must be accessed over HTTPS.

## 5. Updates and backups

Pull changes and rebuild the app:

```bash
git pull
docker compose up -d --build
```

Backups created through the DBA vault are stored in the persistent `usims_backups` volume. Also schedule off-server backups; a Docker volume is not a substitute for an independent backup.

## Important data warning

The first database initialization loads synthetic sample records for coursework demonstration. Do not use those records as actual university records. The initial schema script recreates the `usims` database, so never run the initialization script against an existing production database. Back up any existing database before migrations or restores.

## What is and is not automated

The repository now contains a reproducible full-stack Docker deployment. A GitHub push alone cannot provision a VPS, domain, TLS certificate, or production secrets. Those require access to your hosting provider and server. Once deployed, the site has a single origin and its login, registry, academics, examination, fees, and DBA API calls use the same running backend and database.
