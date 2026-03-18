from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse, Response
from agents.orchestrator import ResearchOrchestrator
from formatters.markdown_formatter import to_markdown
from formatters.word_exporter import to_docx
from models.schemas import ResearchRequest, ResearchResult
import json

app = FastAPI(
    title="Literature Review AI",
    description="One prompt → full academic literature review",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

orchestrator = ResearchOrchestrator()


@app.post("/api/research")
async def research(request: ResearchRequest):
    """
    Stream SSE progress updates.
    Final event has stage='complete' and data.result = full ResearchResult.
    """
    return StreamingResponse(
        orchestrator.run(request),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


@app.post("/api/export/markdown")
async def export_markdown(result: ResearchResult):
    """Return a Markdown file of the full review."""
    md = to_markdown(result)
    filename = result.topic.replace(" ", "_")[:50]
    return Response(
        content=md,
        media_type="text/markdown",
        headers={"Content-Disposition": f'attachment; filename="{filename}.md"'},
    )


@app.post("/api/export/docx")
async def export_docx(result: ResearchResult):
    """Return a Word (.docx) file of the full review."""
    docx_bytes = to_docx(result)
    filename = result.topic.replace(" ", "_")[:50]
    return Response(
        content=docx_bytes,
        media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        headers={"Content-Disposition": f'attachment; filename="{filename}.docx"'},
    )


@app.get("/health")
async def health():
    return {"status": "ok"}
