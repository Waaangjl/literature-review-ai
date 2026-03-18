# Literature Review AI

> **One prompt → full academic literature review.**
> Searches real papers, analyses each one with Claude, writes a structured review, and exports to Word or Markdown.

---

## What it produces

Given a topic (e.g. *"transformer models in NLP"*) the system outputs:

| Section | Description |
|---|---|
| **References** | APA-formatted citations for all papers found |
| **Paper Summaries** | Per-paper: key contributions, methodology, findings, limitations, relevance score |
| **Literature Review** | Introduction · Research themes · Synthesis · Research gaps · Future directions · Conclusion |
| **Implications** | Theoretical · Practical · Policy · Future research questions |
| **Export** | Download as `.md` or `.docx` |

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend (Next.js)                   │
│  SearchInput → ProgressTracker (SSE) → ResultsDashboard     │
│  Tabs: Overview | Themes | Papers | Implications | Refs     │
└──────────────────────────┬──────────────────────────────────┘
                           │ POST /api/research  (SSE stream)
┌──────────────────────────▼──────────────────────────────────┐
│                    Backend (FastAPI)                         │
│                                                             │
│  ResearchOrchestrator                                       │
│    │                                                        │
│    ├─ SearchAgent                                           │
│    │    ├─ ClaudeClient      ← query expansion + re-ranking │
│    │    ├─ SemanticScholarClient  (real papers + abstracts)  │
│    │    └─ ArxivClient            (real papers + abstracts)  │
│    │                                                        │
│    ├─ AnalysisAgent  (parallel, max 5 concurrent)           │
│    │    └─ ClaudeClient      ← per-paper structured analysis│
│    │                                                        │
│    └─ SynthesisAgent                                        │
│         ├─ cluster_themes    ← ClaudeClient                 │
│         ├─ write_review      ← ClaudeClient                 │
│         └─ generate_implications ← ClaudeClient             │
│                                                             │
│  Formatters                                                 │
│    ├─ markdown_formatter  → .md export                      │
│    └─ word_exporter       → .docx export (python-docx)     │
└─────────────────────────────────────────────────────────────┘
```

### SSE Progress Stages

```
searching → analyzing (per-paper) → clustering → writing → implications → formatting → complete
```

Each stage emits a `ProgressUpdate` event with `stage`, `message`, `progress` (0–100), and optional `data`.

---

## Quick Start

### 1. Clone & configure

```bash
git clone https://github.com/Waaangjl/literature-review-ai.git
cd literature-review-ai

cp .env.example .env
# Edit .env — add your ANTHROPIC_API_KEY
```

### 2. Run with Docker (recommended)

```bash
docker-compose up --build
```

- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API docs: http://localhost:8000/docs

### 3. Run locally (without Docker)

**Backend**

```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp ../.env.example .env   # add ANTHROPIC_API_KEY
uvicorn main:app --reload --port 8000
```

**Frontend**

```bash
cd frontend
cp .env.local.example .env.local
npm install
npm run dev
```

---

## API

### `POST /api/research`

**Request body**

```json
{
  "topic": "transformer models in NLP",
  "max_papers": 20,
  "year_from": 2018,
  "year_to": null
}
```

**Response** — Server-Sent Events stream

Each event:
```json
{
  "stage": "analyzing",
  "message": "Analysed 5/20: Attention Is All You Need…",
  "progress": 42,
  "data": null
}
```

Final event (`stage = "complete"`) includes `data.result` with the full `ResearchResult` object.

### `POST /api/export/markdown`

Accepts a `ResearchResult` JSON body, returns a `.md` file.

### `POST /api/export/docx`

Accepts a `ResearchResult` JSON body, returns a `.docx` file.

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `ANTHROPIC_API_KEY` | Yes | Your Anthropic API key |
| `SEMANTIC_SCHOLAR_API_KEY` | No | Raises rate limit (get free at semanticscholar.org) |
| `NEXT_PUBLIC_API_URL` | Frontend | Backend URL (default: `http://localhost:8000`) |

---

## File Structure

```
literature-review-ai/
├── backend/
│   ├── main.py                  # FastAPI app, 3 endpoints
│   ├── config.py                # Pydantic settings from .env
│   ├── requirements.txt
│   ├── agents/
│   │   ├── orchestrator.py      # Pipeline coordinator, SSE emitter
│   │   ├── search_agent.py      # Multi-source search + Claude re-ranking
│   │   ├── analysis_agent.py    # Per-paper Claude analysis + APA citation
│   │   └── synthesis_agent.py   # Theme clustering, review writing, implications
│   ├── clients/
│   │   ├── claude_client.py     # Thin async Anthropic wrapper
│   │   ├── semantic_scholar.py  # Semantic Scholar Graph API v1
│   │   └── arxiv_client.py      # arXiv Atom feed parser
│   ├── models/
│   │   └── schemas.py           # All Pydantic models
│   └── formatters/
│       ├── markdown_formatter.py
│       └── word_exporter.py     # python-docx export
└── frontend/
    └── src/
        ├── app/
        │   ├── page.tsx         # Main page, state machine
        │   └── layout.tsx
        ├── components/
        │   ├── SearchInput.tsx  # Topic input + advanced options
        │   ├── ProgressTracker.tsx  # SSE-driven live progress
        │   ├── ResultsDashboard.tsx # 5-tab results view
        │   └── PaperCard.tsx    # Expandable paper summary card
        ├── lib/
        │   └── api.ts           # streamResearch, exportMarkdown, exportDocx
        └── types/
            └── index.ts         # All TypeScript types
```

---

## Tech Stack

| Layer | Tech |
|---|---|
| LLM | Claude Sonnet (claude-sonnet-4-6) |
| Backend | FastAPI + Python 3.11 |
| Frontend | Next.js 14 + Tailwind CSS |
| Paper sources | Semantic Scholar API · arXiv API |
| Export | python-docx (Word) · plain Markdown |
| Streaming | Server-Sent Events (SSE) |
