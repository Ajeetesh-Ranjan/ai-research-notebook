# AI Research Notebook — Master Plan

## Objective
Build an enterprise-grade, LiquidText-style AI research notebook and document intelligence workspace.

## Phases

### Phase 1: Deep Market Research (Parallel)
- **Agent 1**: Market Research — Identify 50+ competitors (direct, indirect, AI-native). Compile name, company, website, target users, pricing, strengths, weaknesses, AI features, platforms, user complaints, market gaps.
- **Agent 2**: Competitor Intelligence — Deep-dive into top 10 competitors. Compare features, pricing, positioning, business models, user segments, collaboration, export capabilities.
- **Agent 3**: Revenue Research — Find public revenue, estimated revenue, funding rounds, user base, monetisation models for key players.
- **Agent 4**: User Pain Point Research — Scrape reviews, forums, Reddit, YouTube, app stores, Product Hunt, G2, Capterra, academic forums for complaints and unmet needs.

**Output**: `market-research.md`, `competitor-analysis.md`, `revenue-research.md`, `user-pain-points.md`

### Phase 2: Gap Analysis & Product Strategy (Sequential)
- **Agent 5**: Gap Analysis — Synthesize Phase 1 outputs. Identify must-have, useful, luxury, enterprise, and AI differentiation features. Build gap table.
- **Agent 6**: Product Strategy — Define product name, vision, target users, use cases, core workflow, differentiation, MVP scope, and prioritised backlog.

**Output**: `gap-analysis.md`, `product-strategy.md`

### Phase 3: Design & Architecture (Parallel)
- **Agent 7**: Functional Design — Create full FDD with user personas, journeys, core workflows, functional modules, acceptance criteria.
- **Agent 8**: Technical Design — Create TDD with system architecture, component diagrams, data models, API design, database schema, AI pipeline, offline mode, security flow.
- **Agent 9**: Enterprise Infrastructure — Design cloud architecture, scaling strategy, cost estimates, dev/staging/prod environments, backup, DR.
- **Agent 10**: Security & Compliance — Design threat model, auth, RBAC, tenant isolation, encryption, audit logs, compliance readiness.
- **Agent 11**: UI/UX Design — Design information architecture, screen list, wireframes, design system, colour palette, typography, onboarding, accessibility.

**Output**: `functional-design.md`, `technical-design.md`, `infrastructure.md`, `security.md`, `ui-ux-design.md`

### Phase 4: Application Development (Parallel)
- **Agent 12**: Frontend Engineering — Build React + TypeScript + Vite + Tailwind frontend. Implement core screens, PDF viewer, annotation UI, AI chat panel, research board, knowledge graph visualisation.
- **Agent 13**: Backend Engineering — Build Node.js/Express backend. Implement auth, document upload, annotation API, search, export, database layer.
- **Agent 14**: AI Engineering — Implement AI abstraction layer, document processing pipeline, semantic search, summarisation, citation engine, knowledge graph builder.

**Output**: Full working source code in `apps/web/`, `services/api/`, `packages/ai/`

### Phase 5: Testing & Iteration (Sequential)
- **Agent 15**: QA & Testing — Write and run unit tests, component tests, API tests, build tests, lint, type check, UI flow tests. Report failures. Iterate 3 UI refinement cycles.
- **Agent 16**: DevOps — Create Docker setup, docker-compose, CI/CD workflows, build scripts, install commands, deployment guide.

**Output**: `test-report.md`, `docker-compose.yml`, `.github/workflows/`, `INSTALL.md`, `DEVELOPMENT.md`

### Phase 6: GitHub Publishing & Release
- **Agent 17**: GitHub Release — Create/update GitHub repository, push code, create documentation, prepare release notes, attach build artefacts.
- **Agent 18**: Final Validation — Check all outputs for correctness, completeness, security, feasibility.

**Output**: Clean GitHub repository, release notes, final evaluation report.

## Technology Stack
- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, shadcn/ui, PDF.js, React Flow (knowledge graph)
- **Backend**: Node.js, Express, TypeScript, PostgreSQL (with pgvector), Prisma ORM
- **AI Layer**: OpenAI/Anthropic abstraction, LangChain, vector embeddings, semantic search
- **DevOps**: Docker, Docker Compose, GitHub Actions
- **Testing**: Vitest, Playwright, Supertest

## Repository Structure
```
ai-research-notebook/
├── apps/
│   └── web/                 # React frontend
├── services/
│   └── api/                 # Express backend
├── packages/
│   ├── shared/              # Shared types & utilities
│   └── ai/                  # AI processing layer
├── docs/
│   ├── market-research.md
│   ├── competitor-analysis.md
│   ├── revenue-research.md
│   ├── user-pain-points.md
│   ├── gap-analysis.md
│   ├── product-strategy.md
│   ├── functional-design.md
│   ├── technical-design.md
│   ├── infrastructure.md
│   ├── security.md
│   ├── ui-ux-design.md
│   ├── test-report.md
│   └── release-notes.md
├── scripts/
├── .github/
│   └── workflows/
├── README.md
├── INSTALL.md
├── DEVELOPMENT.md
├── ARCHITECTURE.md
├── docker-compose.yml
└── .env.example
```
