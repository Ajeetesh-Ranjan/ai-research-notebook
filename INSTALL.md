# CiteMind Installation Guide

## Prerequisites

- **Docker & Docker Compose** (recommended) or:
- **Node.js** 18+ and **npm** 9+
- **PostgreSQL** 15+ with `pgvector` extension
- **Redis** 7+
- **Git**

---

## Option 1: Docker (Recommended)

### Step 1: Clone the Repository

```bash
git clone https://github.com/ajeeteshr/ai-research-notebook.git
cd ai-research-notebook
```

### Step 2: Configure Environment

```bash
cp .env.example .env
# Edit .env with your preferred settings
```

### Step 3: Start the Infrastructure

```bash
docker-compose up -d db redis minio
```

### Step 4: Run Database Migrations

```bash
cd services/api
npx prisma migrate dev
npx prisma db seed
```

### Step 5: Start the Services

```bash
# Terminal 1 — Backend
cd services/api && npm run dev

# Terminal 2 — Frontend
cd apps/web && npm run dev

# Terminal 3 — AI Package (if using local AI)
cd packages/ai && npm run build --watch
```

### Step 6: Access the Application

- **Frontend**: http://localhost:5173
- **API**: http://localhost:3000
- **API Docs**: http://localhost:3000/api/docs

---

## Option 2: Manual Installation

### Step 1: Install Dependencies

```bash
# Root dependencies
npm install

# Backend
cd services/api && npm install

# Frontend
cd apps/web && npm install

# AI Package
cd packages/ai && npm install
```

### Step 2: Set Up PostgreSQL

```bash
# Create database
createdb citemind

# Enable pgvector extension
psql -d citemind -c "CREATE EXTENSION IF NOT EXISTS vector;"
```

### Step 3: Configure Environment Variables

```bash
cp services/api/.env.example services/api/.env
cp apps/web/.env.example apps/web/.env
cp packages/ai/.env.example packages/ai/.env
```

Edit each `.env` file with your configuration.

### Step 4: Run Migrations

```bash
cd services/api
npx prisma migrate dev
```

### Step 5: Start Services

```bash
# Backend (Terminal 1)
cd services/api && npm run dev

# Frontend (Terminal 2)
cd apps/web && npm run dev
```

---

## Environment Variables

### Backend (`services/api/.env`)

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@localhost:5432/citemind` |
| `REDIS_URL` | Redis connection string | `redis://localhost:6379` |
| `JWT_SECRET` | Secret for JWT signing | `your-super-secret-key` |
| `JWT_EXPIRES_IN` | JWT expiry | `7d` |
| `OPENAI_API_KEY` | OpenAI API key | `sk-...` |
| `ANTHROPIC_API_KEY` | Anthropic API key | `sk-ant-...` |
| `PORT` | API server port | `3000` |
| `NODE_ENV` | Environment | `development` |
| `CORS_ORIGIN` | Allowed frontend origin | `http://localhost:5173` |
| `UPLOAD_DIR` | Local file upload directory | `./uploads` |
| `MAX_FILE_SIZE` | Max upload size in MB | `100` |
| `RATE_LIMIT_WINDOW_MS` | Rate limit window | `60000` |
| `RATE_LIMIT_MAX_REQUESTS` | Max requests per window | `100` |

### Frontend (`apps/web/.env`)

| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_API_URL` | Backend API URL | `http://localhost:3000` |
| `VITE_APP_NAME` | App name | `CiteMind` |

### AI Package (`packages/ai/.env`)

| Variable | Description | Example |
|----------|-------------|---------|
| `OPENAI_API_KEY` | OpenAI API key | `sk-...` |
| `ANTHROPIC_API_KEY` | Anthropic API key | `sk-ant-...` |
| `DEFAULT_PROVIDER` | Default AI provider | `openai` |
| `EMBEDDING_MODEL` | Embedding model | `text-embedding-3-small` |
| `CHUNK_SIZE` | Text chunk size | `1000` |
| `CHUNK_OVERLAP` | Chunk overlap | `200` |

---

## Production Deployment

See [docs/infrastructure.md](./docs/infrastructure.md) for production architecture, cloud provider options, and cost estimates.

### Quick Production Checklist

- [ ] Use strong JWT secrets (256-bit random)
- [ ] Enable HTTPS with TLS 1.3
- [ ] Configure CORS to specific origins only
- [ ] Set up PostgreSQL with pgvector on managed service (RDS, Cloud SQL, etc.)
- [ ] Configure S3-compatible storage with lifecycle policies
- [ ] Set up Redis with persistence
- [ ] Enable audit logging
- [ ] Configure backups (RPO < 1 hour, RTO < 4 hours)
- [ ] Set up monitoring (Prometheus, Grafana, Sentry)
- [ ] Configure WAF and rate limiting
- [ ] Enable SSO/SAML for enterprise users
- [ ] Set up CI/CD pipeline (GitHub Actions)

---

## Troubleshooting

### PostgreSQL pgvector Not Found

```bash
# Install pgvector extension
# macOS with Homebrew
brew install pgvector

# Ubuntu/Debian
sudo apt install postgresql-15-pgvector

# Or use Docker
docker run -d --name pgvector -p 5432:5432 -e POSTGRES_PASSWORD=postgres ankane/pgvector
```

### Port Conflicts

If ports 3000, 5173, 5432, or 6379 are already in use:

```bash
# Edit .env files to change ports
# Or find and kill processes:
lsof -ti:3000 | xargs kill -9
```

### Node Modules Issues

```bash
# Clean and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Database Connection Errors

Ensure PostgreSQL is running and accessible:
```bash
# Check PostgreSQL status
pg_isready -h localhost -p 5432

# Verify database exists
psql -h localhost -U postgres -d citemind -c "SELECT 1;"
```

---

## Support

For issues, questions, or enterprise deployment support, please:
- Open an issue on GitHub
- Contact enterprise support at support@citemind.app

---

## Next Steps

After installation, see [DEVELOPMENT.md](./DEVELOPMENT.md) for development workflow and coding guidelines.
