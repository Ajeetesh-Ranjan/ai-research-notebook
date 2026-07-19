# CiteMind API Server

AI-powered research notebook backend — Node.js, Express, TypeScript, Prisma, PostgreSQL + pgvector.

## Quick Start

```bash
# Install dependencies
npm install

# Set up environment
cp .env.example .env
# Edit .env with your values

# Start database (Docker)
docker-compose up -d db redis

# Run migrations
npx prisma migrate dev

# Generate Prisma client
npm run db:generate

# Start development server
npm run dev
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://postgres:postgres@localhost:5432/citemind` |
| `REDIS_URL` | Redis connection string | `redis://localhost:6379` |
| `JWT_SECRET` | JWT signing secret | *(required)* |
| `PORT` | API server port | `3000` |
| `UPLOAD_DIR` | Local file upload directory | `./uploads` |
| `AI_API_KEY` | OpenAI/Anthropic API key | *(optional)* |
| `AI_PROVIDER` | AI provider: `openai`, `anthropic`, `mock` | `mock` |
| `MAX_FILE_SIZE` | Max upload size in bytes | `104857600` (100MB) |
| `RATE_LIMIT_WINDOW_MS` | Rate limit window | `900000` (15 min) |
| `RATE_LIMIT_MAX_REQUESTS` | Max requests per window | `100` |
| `CORS_ORIGIN` | Allowed CORS origin | `http://localhost:5173` |

## API Endpoints

### Auth
- `POST /api/auth/register` — Register new user
- `POST /api/auth/login` — Login
- `POST /api/auth/refresh` — Refresh JWT
- `GET /api/auth/me` — Get current user

### Projects
- `GET /api/projects` — List projects
- `POST /api/projects` — Create project
- `GET /api/projects/:id` — Get project
- `PATCH /api/projects/:id` — Update project
- `DELETE /api/projects/:id` — Delete project

### Documents
- `POST /api/projects/:id/documents` — Upload document
- `GET /api/projects/:id/documents` — List documents
- `GET /api/documents/:id` — Get document
- `PATCH /api/documents/:id` — Update metadata
- `DELETE /api/documents/:id` — Delete document
- `GET /api/documents/:id/download` — Download original
- `GET /api/documents/:id/content` — Get extracted text

### Annotations
- `GET /api/documents/:id/annotations` — List annotations
- `POST /api/annotations` — Create annotation
- `PATCH /api/annotations/:id` — Update annotation
- `DELETE /api/annotations/:id` — Delete annotation

### AI Chat
- `POST /api/ai/chat` — Start conversation
- `POST /api/ai/chat/:id/messages` — Send message
- `GET /api/ai/chat/:id` — Get conversation
- `DELETE /api/ai/chat/:id` — Delete conversation
- `POST /api/ai/summary` — Generate summary
- `POST /api/ai/search` — Semantic search

### Search
- `GET /api/search` — Full-text + semantic search

### Export
- `POST /api/export` — Create export job
- `GET /api/export/:id` — Get export status
- `GET /api/export/:id/download` — Download export

### Board
- `GET /api/projects/:id/board` — Get board data
- `POST /api/projects/:id/board` — Save board state

### Graph
- `GET /api/projects/:id/graph` — Get knowledge graph
- `POST /api/projects/:id/graph/nodes` — Create node
- `POST /api/projects/:id/graph/edges` — Create edge

### Health
- `GET /health` — Liveness probe
- `GET /health/ready` — Readiness probe

## Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Development with hot reload |
| `npm run build` | Compile TypeScript |
| `npm start` | Start production server |
| `npm test` | Run test suite |
| `npm run db:migrate` | Run database migrations |
| `npm run db:seed` | Seed database |
| `npm run db:studio` | Open Prisma Studio |

## Architecture

```
src/
├── index.ts          # Entry point
├── app.ts            # Express app config
├── config/           # Environment & DB config
├── routes/           # API route definitions
├── controllers/      # Request handlers
├── services/         # Business logic
├── middleware/       # Auth, validation, error handling
├── utils/            # Helpers, validators
├── types/            # Shared TypeScript types
└── prisma/
    └── schema.prisma # Database schema
```

## License

MIT
