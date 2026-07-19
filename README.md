# CiteMind — AI Research Notebook

**CiteMind** is an enterprise-grade, LiquidText-style AI research notebook and document intelligence workspace. It combines deep PDF reading, visual annotation, AI-powered document understanding, multi-document reasoning, knowledge graph mapping, and professional citation management into a single unified research cockpit.

> 🎯 **First research workspace where every AI insight, every visual connection, and every written note is automatically traced back to its source document.**

---

## 🚀 Features

### Core Research Loop
- **Read** — Deep PDF viewer with annotation layer, highlights, and notes
- **Extract** — AI-powered text extraction, summarisation, and entity recognition
- **Connect** — Visual research board and knowledge graph for connecting ideas
- **Synthesise** — Multi-document AI reasoning with grounded, cited answers
- **Export** — Professional deliverables in Markdown, PDF, Word, and LaTeX

### AI Document Intelligence
- 💬 **Document-Grounded Chat** — Ask questions about your PDFs and get answers with source citations
- 📝 **Smart Summarisation** — Executive, detailed, and bullet-point summaries
- 🔍 **Semantic Search** — Hybrid vector + full-text search across your entire research library
- 🧠 **Knowledge Graph** — Auto-extracted entities and relationships visualised as an interactive graph
- ⚡ **Multi-Document Synthesis** — Compare, contrast, and synthesise across multiple sources

### Visual Knowledge Mapping
- 🎨 **Research Board** — Infinite canvas for organising ideas, annotations, and connections
- 🕸️ **Knowledge Graph** — Force-directed visualisation of concepts, documents, and relationships
- 🖍️ **Rich Annotations** — Highlight, annotate, colour-code, and tag PDF content
- 🔗 **Linked References** — Every annotation links back to its exact source location

### Collaboration & Export
- 👥 **Team Workspaces** — Real-time collaborative research projects
- 📤 **Professional Export** — Markdown, PDF, Word, PowerPoint, LaTeX with formatted citations
- 📚 **Reference Manager Sync** — Two-way sync with Zotero, Mendeley, and EndNote
- 🔐 **Enterprise Security** — SSO, audit logs, tenant isolation, GDPR/SOC 2 ready

---

## 🏗️ Architecture

CiteMind is built as a modern, scalable full-stack application:

| Layer | Technology |
|-------|------------|
| **Frontend** | React 18, TypeScript, Vite, Tailwind CSS, shadcn/ui, PDF.js, React Flow |
| **Backend** | Node.js, Express, TypeScript, Prisma ORM |
| **Database** | PostgreSQL 15 with pgvector extension |
| **AI** | OpenAI / Anthropic abstraction, LangChain, semantic embeddings |
| **Storage** | S3-compatible object storage (MinIO for local dev) |
| **Cache** | Redis |

See [ARCHITECTURE.md](./ARCHITECTURE.md) for detailed system architecture.

---

## 📦 Installation

### Quick Start (Docker)

```bash
# Clone the repository
git clone https://github.com/ajeeteshr/ai-research-notebook.git
cd ai-research-notebook

# Start the full stack
docker-compose up -d

# Run database migrations
cd services/api && npx prisma migrate dev

# Access the app
# Frontend: http://localhost:5173
# API:      http://localhost:3000
```

### Manual Setup

See [INSTALL.md](./INSTALL.md) for detailed installation instructions.

---

## 🛠️ Development

See [DEVELOPMENT.md](./DEVELOPMENT.md) for development setup, coding guidelines, and contribution workflow.

---

## 📚 Documentation

| Document | Description |
|----------|-------------|
| [Market Research](./docs/market-research.md) | 60+ competitor analysis across 9 market segments |
| [Competitor Analysis](./docs/competitor-analysis.md) | Deep-dive into top 10 competitors |
| [Revenue Research](./docs/revenue-research.md) | Funding, pricing, and monetisation models |
| [User Pain Points](./docs/user-pain-points.md) | User complaints and unmet needs |
| [Gap Analysis](./docs/gap-analysis.md) | 44 market gaps identified |
| [Product Strategy](./docs/product-strategy.md) | Product vision, positioning, and MVP scope |
| [Functional Design](./docs/functional-design.md) | Complete FDD with 22 sections |
| [Technical Design](./docs/technical-design.md) | Architecture, APIs, database schema, security flow |
| [Infrastructure](./docs/infrastructure.md) | Cloud architecture, cost estimates, scaling strategy |
| [Security](./docs/security.md) | Threat model, compliance, RBAC, encryption |
| [UI/UX Design](./docs/ui-ux-design.md) | Design system, wireframes, accessibility guidelines |

---

## 🧪 Testing

```bash
# Frontend tests
cd apps/web && npm test

# Backend tests
cd services/api && npm test

# AI package tests
cd packages/ai && npm test

# Full stack (requires Docker)
docker-compose -f docker-compose.test.yml up --abort-on-container-exit
```

---

## 🏢 Enterprise

CiteMind is designed for enterprise deployment:

- **Single Sign-On** (SAML 2.0, OAuth2, OIDC)
- **Multi-Tenant Isolation** with row-level security
- **Audit Logging** with 7-year retention
- **Data Residency** (EU, US, UK, AU, CA)
- **Compliance Ready** — SOC 2, GDPR, HIPAA, ISO 27001 roadmap
- **Self-Hosting** — Deploy on-premise or in your VPC

Contact us for enterprise pricing and deployment support.

---

## 📄 License

MIT License — see [LICENSE](./LICENSE) for details.

---

## 🙏 Acknowledgements

Built with love by the CiteMind team. Inspired by the best research tools in the world: LiquidText, Obsidian, Heptabase, Zotero, and NotebookLM.
