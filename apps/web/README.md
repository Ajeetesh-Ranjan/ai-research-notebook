# CiteMind Web Frontend

The React frontend for **CiteMind**, an AI-powered research notebook application.

## Tech Stack

- **React 18** + TypeScript
- **Vite** for build tooling and dev server
- **Tailwind CSS** for styling with custom design tokens
- **TanStack Query** for server state management
- **Zustand** for client state management
- **React Router v6** for SPA navigation
- **react-pdf** for PDF rendering
- **reactflow** for knowledge graph and research board
- **lucide-react** for icons
- **react-hot-toast** for notifications

## Project Structure

```
src/
  components/
    layout/          # Shell components (Layout, Sidebar, TopBar, CommandPalette, Workspace)
    navigation/      # Dashboard, Login, Register, ProjectCard, DocumentList
    pdf/             # PDF viewer, pages, annotation layer, thumbnails
    annotation/      # Toolbar, color picker, note editor, highlight button
    ai/              # Chat panel, messages, streaming text, suggested prompts
    board/           # Research board with reactflow nodes/edges
    graph/           # Knowledge graph with reactflow nodes/edges
    export/          # Export dialog, format selector, preview pane
    settings/        # Settings panel, theme toggle, keyboard shortcuts overlay
  hooks/             # Custom hooks (usePDF, useAnnotations, useAI, useBoard, useGraph, useKeyboardShortcuts)
  lib/               # API client, constants, utilities
  stores/            # Zustand stores (auth, UI, projects, documents, annotations, AI, board)
  styles/            # Design tokens (CSS variables)
  types/             # Shared TypeScript types
```

## Getting Started

### Prerequisites

- Node.js 18+
- npm or pnpm

### Installation

```bash
npm install
```

### Environment Variables

Copy `.env.example` to `.env` and configure:

```
VITE_API_URL=http://localhost:3000
VITE_MOCK_AI=true   # Enable mock AI responses for development
```

### Development

```bash
npm run dev
```

The dev server runs on `http://localhost:5173` by default.

### Build

```bash
npm run build
```

Output is generated in `dist/`.

### Type Checking

```bash
npm run typecheck
```

### Linting

```bash
npm run lint
```

### Testing

```bash
npm run test:run
```

Tests use **Vitest** + **React Testing Library** + **jsdom**.

## Key Features

- **Dark-mode-first** UI with CSS custom properties
- **PDF reader** with annotation overlays (highlight, underline, comment)
- **AI chat** with streaming responses and citation support
- **Research board** for visual note organization
- **Knowledge graph** for exploring document relationships
- **Command palette** (Ctrl+K) for quick navigation
- **Keyboard shortcuts** overlay (press `?` to view)
- **Export** to Markdown, PDF, HTML, and Word

## Design Decisions

- **Dark-mode-first** using `tokens.css` variables; light mode is derived by overriding variables.
- **Custom shadcn/ui patterns** simulated via Tailwind utilities (`btn-primary`, `input-field`, `card-surface`) rather than installing the full shadcn/ui library.
- **Mock AI** responses enabled via `VITE_MOCK_AI=true` for frontend development without a backend.
- **Centralized API** in `lib/apiClient.ts` with typed modules for each domain.

## License

MIT
