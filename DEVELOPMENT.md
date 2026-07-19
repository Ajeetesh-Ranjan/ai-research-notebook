# CiteMind Development Guide

## Development Workflow

### Branching Strategy

We use **GitHub Flow** with the following branch structure:

- `main` — Production-ready code, protected branch
- `develop` — Integration branch for features
- `feature/*` — Individual feature branches
- `hotfix/*` — Emergency production fixes
- `release/*` — Release preparation branches

### Pull Request Process

1. Create a feature branch from `develop`
2. Make changes with clear, atomic commits
3. Write or update tests for all new functionality
4. Ensure all tests pass (`npm test`)
5. Ensure TypeScript compiles cleanly (`npm run typecheck`)
6. Update relevant documentation
7. Open PR against `develop` with detailed description
8. Request review from at least 2 team members
9. Address feedback and merge

### Commit Conventions

We follow **Conventional Commits**:

```
type(scope): subject

body (optional)

footer (optional)
```

Types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`, `perf`, `ci`

Examples:
```
feat(ai): add multi-document synthesis chain
fix(pdf): resolve highlight offset on zoomed pages
docs(api): update authentication endpoint examples
test(board): add integration tests for canvas drag-and-drop
```

---

## Monorepo Structure

```
ai-research-notebook/
├── apps/
│   └── web/              # React frontend (Vite + Tailwind + shadcn/ui)
├── services/
│   └── api/              # Express backend (Node.js + Prisma + PostgreSQL)
├── packages/
│   ├── shared/           # Shared types and utilities (TODO)
│   └── ai/               # AI abstraction layer (OpenAI/Anthropic + LangChain)
├── docs/                 # Product and technical documentation
├── scripts/              # Build and deployment scripts
├── .github/
│   └── workflows/        # CI/CD pipelines (TODO)
├── docker-compose.yml    # Local development infrastructure
├── README.md
├── INSTALL.md
├── DEVELOPMENT.md
└── ARCHITECTURE.md
```

---

## Local Development Setup

### One-Command Start

```bash
# Start all infrastructure (PostgreSQL, Redis, MinIO)
docker-compose up -d

# Install dependencies across all packages
npm run install:all

# Run database migrations
cd services/api && npx prisma migrate dev

# Start all services in parallel (requires tmux or multiple terminals)
npm run dev
```

### Individual Service Development

```bash
# Frontend only
cd apps/web && npm run dev
# → http://localhost:5173

# Backend only
cd services/api && npm run dev
# → http://localhost:3000

# AI package (watch mode)
cd packages/ai && npm run build --watch
```

---

## Code Standards

### TypeScript

- **Strict mode enabled** — no `any` types without explicit justification
- **Explicit return types** on all public functions
- **Interface over type** for object shapes
- **Discriminated unions** for complex state machines
- **Branded types** for IDs (e.g., `type DocumentId = string & { __brand: 'DocumentId' }`)

### React

- **Functional components** with hooks only
- **Custom hooks** for reusable logic (see `apps/web/src/hooks/`)
- **Zustand** for global state, **React Query** for server state
- **Memoization** for expensive computations (`useMemo`, `useCallback`)
- **Lazy loading** for heavy components (`React.lazy` + `Suspense`)

### Styling

- **Tailwind CSS** for all styling
- **Design tokens** in `apps/web/src/styles/tokens.css`
- **Dark-mode-first** design with `data-theme` attribute
- **CSS variables** for dynamic theming
- **No inline styles** except for dynamic values

### Backend

- **Controller-Service pattern** — thin controllers, thick services
- **Dependency injection** via factory functions
- **Zod validation** for all request bodies and params
- **Structured logging** with Pino (request ID, user context, performance)
- **Error handling** — custom error classes with HTTP status codes

### AI Package

- **Provider abstraction** — all LLM calls go through `BaseProvider`
- **Prompt templates** — all prompts live in `packages/ai/src/prompts/`
- **Chunking strategy** — semantic chunking with configurable overlap
- **Token counting** — prevent context window overflow
- **Mock provider** — all AI features must work offline with mock data

---

## Testing Strategy

### Testing Pyramid

| Level | Tool | Coverage Target | Responsibility |
|-------|------|-----------------|----------------|
| **Unit** | Vitest | 80% | Individual functions, utilities, hooks |
| **Component** | Vitest + React Testing Library | 70% | React components in isolation |
| **Integration** | Vitest + Supertest | 60% | API endpoints, database queries |
| **E2E** | Playwright | Critical paths | Full user flows |

### Running Tests

```bash
# All tests
npm test

# Frontend tests only
cd apps/web && npm test

# Backend tests only
cd services/api && npm test

# AI package tests only
cd packages/ai && npm test

# E2E tests (requires running app)
npx playwright test

# With coverage
npm run test:coverage

# Watch mode
npm run test:watch
```

### Test File Naming

```
Component.test.tsx        # React component tests
function.test.ts          # Utility function tests
api.test.ts               # API integration tests
e2e/auth.spec.ts          # Playwright E2E tests
```

---

## Database

### Prisma Commands

```bash
cd services/api

# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate dev

# Create a new migration
npx prisma migrate dev --name add_user_preferences

# Reset database (caution: destroys data)
npx prisma migrate reset

# Seed database
npx prisma db seed

# Open Prisma Studio
npx prisma studio

# Validate schema
npx prisma validate
```

### Schema Changes

1. Edit `services/api/prisma/schema.prisma`
2. Run `npx prisma migrate dev --name descriptive_name`
3. Update generated types with `npx prisma generate`
4. Update any affected API routes and frontend types
5. Write tests for new schema fields

---

## AI Development

### Adding a New AI Provider

1. Create `packages/ai/src/providers/newprovider.ts`
2. Extend `BaseProvider` class
3. Implement `chat()`, `embed()`, `summarize()`, `extractEntities()`
4. Add to provider factory in `packages/ai/src/index.ts`
5. Add tests in `packages/ai/tests/unit/providers/`
6. Update environment variable documentation

### Adding a New Prompt Template

1. Create `packages/ai/src/prompts/newFeature.ts`
2. Export a function that returns a prompt string with variables
3. Include system instructions, user instructions, and output format
4. Add example usage in comments
5. Test with mock provider first

### Testing AI Features Offline

All AI features must work with the `MockProvider`:

```typescript
import { createAIProvider } from '@citemind/ai';

const ai = createAIProvider('mock');
const response = await ai.chat([{ role: 'user', content: 'Summarise this document' }]);
// → Returns realistic mock response without API call
```

---

## Performance Guidelines

### Frontend

- **Bundle size** — Keep initial bundle under 500KB
- **Code splitting** — Lazy load heavy features (PDF viewer, graph, board)
- **Image optimisation** — Use WebP, lazy loading, and proper sizing
- **Virtual scrolling** — For long lists (annotations, search results)
- **Debouncing** — For search inputs, resize handlers, and scroll events
- **Memoisation** — `React.memo`, `useMemo`, `useCallback` for expensive renders

### Backend

- **Database indexing** — All query filters must have indexes
- **Pagination** — Default 20 items per page, max 100
- **Caching** — Redis for session storage, API responses, and AI embeddings
- **Connection pooling** — Prisma connection pool tuned for workload
- **N+1 prevention** — Use `include` and `select` carefully in Prisma
- **Async processing** — Heavy operations (PDF parsing, AI summarisation) via queue

### AI

- **Chunking** — Parallel chunk processing for large documents
- **Embedding caching** — Store embeddings in PostgreSQL to avoid regeneration
- **Batching** — Batch embedding requests for multiple chunks
- **Streaming** — Stream AI responses to frontend for perceived speed
- **Fallback** — Graceful degradation when AI provider is unavailable

---

## Debugging

### Frontend

```bash
# React DevTools — Install browser extension
# Zustand DevTools — Enable in development
# Vite HMR — Automatic hot reload on file changes
```

### Backend

```bash
# Enable debug logging
DEBUG=citemind:* npm run dev

# Prisma query logging
DATABASE_URL="postgresql://...?schema=public&query_log=true"

# Node.js inspector
node --inspect src/index.ts
```

### AI Package

```bash
# Verbose logging
LOG_LEVEL=debug npm run test

# Mock provider mode (no API calls)
DEFAULT_PROVIDER=mock npm run test
```

---

## Documentation

- **Code comments** — JSDoc for all public functions
- **README updates** — When adding new features or changing setup
- **API documentation** — Auto-generated from OpenAPI spec (TODO: Swagger)
- **Changelog** — Update `CHANGELOG.md` with each release

---

## Release Process

1. Create `release/vX.Y.Z` branch from `develop`
2. Update version numbers in `package.json` files
3. Update `CHANGELOG.md`
4. Run full test suite
5. Create release candidate and test in staging
6. Merge to `main` and tag `vX.Y.Z`
7. Build and push Docker images
8. Create GitHub release with notes
9. Deploy to production

---

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

Please read our [Code of Conduct](./CODE_OF_CONDUCT.md) and [Contributing Guidelines](./CONTRIBUTING.md) before contributing.

---

## Resources

- [Technical Design](./docs/technical-design.md) — System architecture and API design
- [Functional Design](./docs/functional-design.md) — Feature specifications and workflows
- [UI/UX Design](./docs/ui-ux-design.md) — Design system and component guidelines
- [Security](./docs/security.md) — Security policies and compliance requirements
