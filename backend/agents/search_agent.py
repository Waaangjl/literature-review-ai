import asyncio
import json
from typing import List

from clients.semantic_scholar import SemanticScholarClient
from clients.arxiv_client import ArxivClient
from clients.claude_client import ClaudeClient
from models.schemas import Paper, ResearchRequest
from config import settings


class SearchAgent:
    """
    Searches multiple academic sources in parallel.
    Uses Claude to:
      1. Expand the raw topic into 3 targeted search queries.
      2. Re-rank all retrieved papers by relevance.
    """

    def __init__(self):
        self.ss = SemanticScholarClient(api_key=settings.semantic_scholar_api_key)
        self.arxiv = ArxivClient()
        self.claude = ClaudeClient()

    async def search(self, request: ResearchRequest) -> List[Paper]:
        # Step 1 — expand query
        queries = await self._expand_query(request.topic)

        # Step 2 — search sources in parallel
        tasks = []
        for q in queries[:3]:
            tasks.append(
                self.ss.search(q, limit=10, year_from=request.year_from, year_to=request.year_to)
            )
            tasks.append(self.arxiv.search(q, limit=10))

        batches = await asyncio.gather(*tasks, return_exceptions=True)

        # Step 3 — deduplicate by normalised title prefix
        all_papers: List[Paper] = []
        seen: set = set()
        for batch in batches:
            if isinstance(batch, Exception):
                continue
            for paper in batch:
                key = paper.title.lower()[:60]
                if key not in seen:
                    seen.add(key)
                    all_papers.append(paper)

        # Step 4 — rank and truncate
        return await self._rank_papers(all_papers, request.topic, request.max_papers)

    # ------------------------------------------------------------------
    # Private helpers
    # ------------------------------------------------------------------

    async def _expand_query(self, topic: str) -> List[str]:
        prompt = (
            f'Given this research topic: "{topic}"\n'
            "Generate 3 distinct academic search queries to maximise coverage.\n"
            "Return ONLY a JSON array of strings, e.g. [\"query1\", \"query2\", \"query3\"]"
        )
        try:
            raw = await self.claude.complete(prompt, max_tokens=200)
            return json.loads(raw)
        except Exception:
            return [topic]

    async def _rank_papers(
        self, papers: List[Paper], topic: str, max_papers: int
    ) -> List[Paper]:
        if not papers:
            return []

        listing = "\n".join(
            f"{i}. {p.title} ({p.year}): {p.abstract[:200]}"
            for i, p in enumerate(papers)
        )
        prompt = (
            f'Topic: "{topic}"\n\nPapers:\n{listing}\n\n'
            f"Return a JSON array of 0-based indices sorted by relevance, top {max_papers} only.\n"
            "Return ONLY the JSON array."
        )
        try:
            raw = await self.claude.complete(prompt, max_tokens=500)
            indices: List[int] = json.loads(raw)
            return [papers[i] for i in indices if i < len(papers)][:max_papers]
        except Exception:
            return papers[:max_papers]
