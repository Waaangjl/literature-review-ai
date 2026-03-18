from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse, Response
from agents.orchestrator import ResearchOrchestrator
from formatters.markdown_formatter import to_markdown
from formatters.word_exporter import to_docx
from models.schemas import ResearchRequest, ResearchResult

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
    allow_headers=["*", "X-API-Key"],
)

orchestrator = ResearchOrchestrator()


@app.post("/api/research")
async def research(request: Request, body: ResearchRequest):
    """
    Stream SSE progress updates.
    Optional header: X-API-Key — if provided, uses this key instead of server config.
    Final event has stage='complete' and data.result = full ResearchResult.
    """
    api_key = request.headers.get("X-API-Key") or None
    return StreamingResponse(
        orchestrator.run(body, api_key=api_key),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


@app.post("/api/export/markdown")
async def export_markdown(result: ResearchResult):
    md = to_markdown(result)
    filename = result.topic.replace(" ", "_")[:50]
    return Response(
        content=md,
        media_type="text/markdown",
        headers={"Content-Disposition": f'attachment; filename="{filename}.md"'},
    )


@app.post("/api/export/docx")
async def export_docx(result: ResearchResult):
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
