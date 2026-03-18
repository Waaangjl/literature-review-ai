import json
from typing import List

from clients.claude_client import ClaudeClient
from models.schemas import Paper, PaperSummary, Theme, LiteratureReview, Implications


class SynthesisAgent:
    """
    Three responsibilities:
      1. cluster_themes  — group papers into coherent research directions
      2. write_review    — produce a full literature review essay
      3. generate_implications — derive theoretical / practical / policy implications
    """

    def __init__(self):
        self.claude = ClaudeClient()

    # ------------------------------------------------------------------
    # 1. Theme clustering
    # ------------------------------------------------------------------

    async def cluster_themes(
        self,
        papers: List[Paper],
        summaries: List[PaperSummary],
        topic: str,
    ) -> List[Theme]:
        listing = "\n".join(
            f"ID={s.paper_id} | {s.title}\n  Contributions: {'; '.join(s.key_contributions[:2])}"
            for s in summaries
        )
        prompt = f"""Research topic: "{topic}"

Papers:
{listing}

Identify 3–6 major research themes/sub-directions present in these papers.
Return a JSON array:
[
  {{
    "name": "<theme name>",
    "description": "<2-3 sentence description>",
    "paper_ids": ["<id>", ...]
  }}
]
Return ONLY the JSON array."""

        raw = await self.claude.complete(prompt, max_tokens=1500)
        try:
            themes_data = json.loads(raw)
            return [Theme(**t) for t in themes_data]
        except Exception:
            return [Theme(name="General", description="All papers", paper_ids=[s.paper_id for s in summaries])]

    # ------------------------------------------------------------------
    # 2. Literature review
    # ------------------------------------------------------------------

    async def write_review(
        self,
        papers: List[Paper],
        summaries: List[PaperSummary],
        themes: List[Theme],
        topic: str,
    ) -> LiteratureReview:
        themes_text = "\n".join(f"- {t.name}: {t.description}" for t in themes)
        top_papers = sorted(summaries, key=lambda s: s.relevance_score, reverse=True)[:12]
        papers_text = "\n".join(
            f"[{s.title} ({s.year})]: {s.findings}"
            for s in top_papers
        )

        prompt = f"""You are an expert academic writer producing a literature review on: "{topic}"

Research themes:
{themes_text}

Key papers and findings:
{papers_text}

Write a rigorous literature review. Return JSON with these exact keys:
{{
  "introduction": "<2-3 paragraphs: topic importance, scope, structure of this review>",
  "synthesis": "<3-4 paragraphs: synthesise findings across themes — agreements, contradictions, patterns. Cite papers by title.>",
  "research_gaps": ["<gap>", ...],          // 3-5 items
  "future_directions": ["<direction>", ...], // 3-5 items
  "conclusion": "<1-2 paragraphs: current state of the field, key takeaways>"
}}

Return ONLY the JSON, no markdown fences."""

        raw = await self.claude.complete(prompt, max_tokens=3500)
        try:
            data = json.loads(raw)
        except Exception:
            # Graceful fallback — wrap raw text
            data = {
                "introduction": raw[:600],
                "synthesis": "See individual paper summaries.",
                "research_gaps": ["Further investigation required"],
                "future_directions": ["Continued research needed"],
                "conclusion": "This field continues to evolve rapidly.",
            }

        return LiteratureReview(
            introduction=data.get("introduction", ""),
            themes=themes,  # preserve original with paper_ids
            synthesis=data.get("synthesis", ""),
            research_gaps=data.get("research_gaps", []),
            future_directions=data.get("future_directions", []),
            conclusion=data.get("conclusion", ""),
        )

    # ------------------------------------------------------------------
    # 3. Implications
    # ------------------------------------------------------------------

    async def generate_implications(
        self,
        review: LiteratureReview,
        summaries: List[PaperSummary],
        topic: str,
    ) -> Implications:
        prompt = f"""Based on this literature review on "{topic}":

Research gaps: {"; ".join(review.research_gaps)}
Future directions: {"; ".join(review.future_directions)}
Synthesis excerpt: {review.synthesis[:600]}

Generate implications in JSON:
{{
  "theoretical": ["<implication>", ...],   // 3-5 items
  "practical":   ["<implication>", ...],   // 3-5 items
  "policy":      ["<implication>", ...],   // 2-3 items (empty list if not applicable)
  "future_research": ["<specific research question>", ...]  // 4-6 items
}}

Be specific and actionable. Return ONLY JSON."""

        raw = await self.claude.complete(prompt, max_tokens=1200)
        try:
            data = json.loads(raw)
            return Implications(**data)
        except Exception:
            return Implications(
                theoretical=review.future_directions,
                practical=["See literature review"],
                policy=[],
                future_research=review.research_gaps,
            )
