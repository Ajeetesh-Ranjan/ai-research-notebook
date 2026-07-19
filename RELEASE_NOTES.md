# CiteMind Release Notes

## v0.1.0-MVP — Initial Release

**Release Date**: 2026-07-19
**Status**: MVP (Minimum Viable Product)
**Codename**: Genesis

---

## Overview

This is the first public release of CiteMind, an AI-powered research notebook and document intelligence workspace. The MVP focuses on the core research loop: Read → Extract → Connect → Synthesise → Export.

---

## What's Included

### Core Features

#### 📖 PDF Reading & Annotation
- PDF upload and viewer with page navigation, zoom, and fit-to-width
- Text highlighting with 6 colour options
- Sticky notes attached to highlights
- Annotation sidebar with search and filter
- Thumbnail strip for quick navigation

#### 🤖 AI Document Intelligence
- Document-grounded chat with source citations
- AI-generated summaries (executive and detailed)
- Semantic search across uploaded documents
- Multi-document synthesis with contradiction detection
- Mock AI provider for offline development

#### 🎨 Visual Knowledge Mapping
- Infinite research board with draggable cards
- Knowledge graph with force-directed layout
- Auto-extracted entities from documents
- Connections between annotations, notes, and documents
- Pan, zoom, and mini-map navigation

#### 🔍 Search & Discovery
- Full-text search across document content
- Semantic search using vector embeddings
- Hybrid search combining both approaches
- Filter by document, date, annotation type

#### 📤 Export
- Export annotations and notes to Markdown
- Export research board to PNG/SVG
- Export knowledge graph to JSON
- Citation support in APA, MLA, and Chicago formats

#### 🎛️ UI/UX
- Dark-mode-first premium design
- Three-panel workspace layout
- Collapsible sidebars
- Keyboard shortcuts for power users
- Responsive design (tablet and desktop)
- Empty states and loading animations

### Authentication
- JWT-based authentication
- User registration and login
- Guest mode (limited functionality)

### Project Management
- Create and manage research projects
- Document library per project
- Recent documents dashboard
- Project-level search and filtering

---

## Technical Implementation

### Frontend (React + TypeScript)
- **53 source files** across 10 component categories
- **8 component tests** passing (Vitest + React Testing Library)
- **TypeScript compilation**: Clean (0 errors)
- **Design system**: Complete CSS tokens with dark/light mode

### Backend (Node.js + Express)
- **33 source files** with controller-service pattern
- **Prisma schema**: 16 tables, 503 lines
- **35 API endpoints** implemented
- **Integration tests**: 24 tests ready (require PostgreSQL)
- **Docker Compose**: Local development stack

### AI Package (TypeScript)
- **29 source files** across 8 modules
- **67 unit tests** passing
- **Provider abstraction**: OpenAI, Anthropic, and Mock providers
- **Document pipeline**: Extract, chunk, embed, index
- **Knowledge graph**: Auto-extraction of entities and relations
- **Citation engine**: APA, MLA, Chicago formatting

---

## Known Limitations (MVP)

- ❌ Real-time collaboration is not yet implemented
- ❌ No native mobile apps (web-only)
- ❌ No advanced handwriting support
- ❌ Offline sync is limited (local storage only)
- ❌ Enterprise SSO not yet available
- ❌ No plugin/extension system
- ❌ AI responses use mock provider by default (requires API key for real AI)
- ❌ Export to Word/PowerPoint/LaTeX is planned for v0.2
- ❌ Reference manager sync (Zotero/Mendeley) is planned for v0.2

---

## Installation

### Docker (Recommended)
```bash
git clone https://github.com/ajeeteshr/ai-research-notebook.git
cd ai-research-notebook
docker-compose up -d
cd services/api && npx prisma migrate dev
```

Access at:
- Frontend: http://localhost:5173
- API: http://localhost:3000

### Manual Setup
See [INSTALL.md](./INSTALL.md) for detailed instructions.

---

## Documentation

Complete documentation is included in the `docs/` directory:
- Market research on 60+ competitors
- Technical architecture and design documents
- Functional specifications with 22 sections
- Security and compliance design
- Infrastructure and deployment guides
- UI/UX design system with 17 sections

---

## What's Next

### v0.2.0 — Collaboration & Export (Q3 2026)
- Real-time collaborative editing
- Export to Word, PowerPoint, and LaTeX
- Zotero and Mendeley integration
- Enhanced AI with streaming responses
- Mobile-responsive improvements

### v0.3.0 — Enterprise (Q4 2026)
- SSO/SAML authentication
- Enterprise admin dashboard
- Audit logging and compliance
- On-premise deployment option
- API access for integrations

### v1.0.0 — General Availability (Q1 2027)
- Desktop apps (Electron)
- Native mobile apps
- Plugin ecosystem
- Advanced analytics
- White-label option

---

## Contributors

Built by the CiteMind team using AI-assisted development.

---

## License

MIT License

---

## Support

For issues, questions, or enterprise inquiries:
- GitHub Issues: [github.com/ajeeteshr/ai-research-notebook/issues](https://github.com/ajeeteshr/ai-research-notebook/issues)
- Email: support@citemind.app

---

**Thank you for trying CiteMind! We welcome your feedback and contributions.**
