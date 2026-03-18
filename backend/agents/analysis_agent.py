import json
from typing import List

from clients.llm_client import LLMClient
from models.schemas import Paper, PaperSummary, Author


class AnalysisAgent:
    """
    Analyses a single paper in the context of the research topic.
    Produces a structured PaperSummary with APA-style citation.
    """

    def __init__(self, api_key: str | None = None):
        self.llm = LLMClient(api_key=api_key)

    async def analyze(self, paper: Paper, topic: str) -> PaperSummary:
        author_names = ", ".join(a.name for a in paper.authors[:5])
        prompt = f"""You are an expert academic researcher. Analyse this paper in the context of: "{topic}"

Title: {paper.title}
Authors: {author_names}
Year: {paper.year}
Venue: {paper.venue or "Unknown"}
Abstract:
{paper.abstract}

Return a JSON object with these exact keys:
{{
  "key_contributions": ["<string>", ...],   // 2-4 bullet points
  "methodology": "<string>",               // 1-2 sentences
  "findings": "<string>",                  // 2-3 sentences
  "limitations": "<string>",               // 1-2 sentences
  "relevance_score": <float 0.0-1.0>
}}

Return ONLY the JSON, no markdown fences."""

        raw = await self.llm.complete(prompt, max_tokens=800)
        try:
            data = json.loads(raw)
        except Exception:
            data = {
                "key_contributions": ["See abstract"],
                "methodology": "Not specified",
                "findings": paper.abstract[:300],
                "limitations": "Not specified",
                "relevance_score": 0.5,
            }

        citation = self._apa_citation(paper)

        return PaperSummary(
            paper_id=paper.id,
            title=paper.title,
            authors=[a.name for a in paper.authors],
            year=paper.year,
            venue=paper.venue,
            key_contributions=data.get("key_contributions", []),
            methodology=data.get("methodology", ""),
            findings=data.get("findings", ""),
            limitations=data.get("limitations", ""),
            relevance_score=float(data.get("relevance_score", 0.5)),
            citation=citation,
        )

    # ------------------------------------------------------------------
    # APA citation builder
    # ------------------------------------------------------------------

    def _apa_citation(self, paper: Paper) -> str:
        authors = self._format_authors_apa(paper.authors)
        year = paper.year or "n.d."
        venue = f"*{paper.venue}*" if paper.venue else ""
        if paper.doi:
            loc = f"https://doi.org/{paper.doi}"
        elif paper.url:
            loc = paper.url
        else:
            loc = ""
        parts = filter(None, [venue, loc])
        return f"{authors} ({year}). {paper.title}. {'. '.join(parts)}."

    def _format_authors_apa(self, authors: List[Author]) -> str:
        if not authors:
            return "Unknown"

        def fmt(a: Author) -> str:
            parts = a.name.strip().split()
            if len(parts) >= 2:
                last = parts[-1]
                initials = ". ".join(p[0] for p in parts[:-1]) + "."
                return f"{last}, {initials}"
            return a.name

        formatted = [fmt(a) for a in authors[:6]]
        et_al = len(authors) > 6
        if et_al:
            return ", ".join(formatted) + ", et al."
        if len(formatted) == 1:
            return formatted[0]
        return ", ".join(formatted[:-1]) + ", & " + formatted[-1]
