import asyncio
from typing import AsyncGenerator, Optional

from agents.search_agent import SearchAgent
from agents.analysis_agent import AnalysisAgent
from agents.synthesis_agent import SynthesisAgent
from models.schemas import ResearchRequest, ResearchResult, ProgressUpdate


class ResearchOrchestrator:
    """
    Full pipeline:
      search → analyse (parallel) → cluster → review → implications → format
    Streams SSE so the frontend can show live progress.
    api_key is optional — if provided, overrides the server-level key/provider.
    """

    async def run(
        self, request: ResearchRequest, api_key: Optional[str] = None
    ) -> AsyncGenerator[str, None]:
        # Build agents with the per-request key (falls back to server config)
        search_agent = SearchAgent(api_key=api_key)
        analysis_agent = AnalysisAgent(api_key=api_key)
        synthesis_agent = SynthesisAgent(api_key=api_key)

        # ── Stage 1: Search ──────────────────────────────────────────
        yield self._sse("searching", "Searching academic databases…", 5)
        papers = await search_agent.search(request)
        if not papers:
            yield self._sse("error", "No papers found. Try a broader topic.", 0)
            return
        yield self._sse("searching", f"Found {len(papers)} relevant papers", 20, {"count": len(papers)})

        # ── Stage 2: Analyse papers (concurrent, max 5 at a time) ───
        yield self._sse("analyzing", "Analysing each paper…", 25)
        semaphore = asyncio.Semaphore(5)

        async def bounded_analyze(paper):
            async with semaphore:
                return await analysis_agent.analyze(paper, request.topic)

        summaries = []
        for coro in asyncio.as_completed([bounded_analyze(p) for p in papers]):
            summary = await coro
            summaries.append(summary)
            pct = 25 + int(len(summaries) / len(papers) * 35)
            yield self._sse(
                "analyzing",
                f"Analysed {len(summaries)}/{len(papers)}: {summary.title[:55]}…",
                pct,
            )

        # ── Stage 3: Theme clustering ────────────────────────────────
        yield self._sse("clustering", "Identifying research themes…", 62)
        themes = await synthesis_agent.cluster_themes(papers, summaries, request.topic)
        yield self._sse("clustering", f"Found {len(themes)} research themes", 68, {"themes": [t.name for t in themes]})

        # ── Stage 4: Literature review ───────────────────────────────
        yield self._sse("writing", "Writing literature review…", 70)
        review = await synthesis_agent.write_review(papers, summaries, themes, request.topic)
        yield self._sse("writing", "Literature review complete", 85)

        # ── Stage 5: Implications ────────────────────────────────────
        yield self._sse("implications", "Generating implications…", 87)
        implications = await synthesis_agent.generate_implications(review, summaries, request.topic)
        yield self._sse("implications", "Implications complete", 93)

        # ── Stage 6: Format references ───────────────────────────────
        yield self._sse("formatting", "Formatting references…", 95)
        references = sorted(
            [s.citation for s in summaries],
            key=lambda c: c.split(",")[0].lower(),
        )

        # ── Done ─────────────────────────────────────────────────────
        result = ResearchResult(
            topic=request.topic,
            papers=papers,
            summaries=summaries,
            review=review,
            implications=implications,
            references=references,
        )
        yield self._sse("complete", "Analysis complete!", 100, {"result": result.model_dump()})

    def _sse(self, stage: str, message: str, progress: int, data=None) -> str:
        update = ProgressUpdate(stage=stage, message=message, progress=progress, data=data)
        return f"data: {update.model_dump_json()}\n\n"
