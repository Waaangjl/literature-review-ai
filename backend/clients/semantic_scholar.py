import httpx
from typing import List, Optional
from models.schemas import Paper, Author


class SemanticScholarClient:
    BASE_URL = "https://api.semanticscholar.org/graph/v1"
    FIELDS = "paperId,title,authors,abstract,year,venue,citationCount,externalIds,openAccessPdf"

    def __init__(self, api_key: Optional[str] = None):
        self.headers = {"x-api-key": api_key} if api_key else {}

    async def search(
        self,
        query: str,
        limit: int = 10,
        year_from: Optional[int] = None,
        year_to: Optional[int] = None,
    ) -> List[Paper]:
        params: dict = {"query": query, "limit": limit, "fields": self.FIELDS}
        if year_from or year_to:
            params["year"] = f"{year_from or ''}-{year_to or ''}"

        async with httpx.AsyncClient(timeout=30) as client:
            try:
                resp = await client.get(
                    f"{self.BASE_URL}/paper/search",
                    params=params,
                    headers=self.headers,
                )
                resp.raise_for_status()
                data = resp.json()
            except Exception as e:
                print(f"[SemanticScholar] Error: {e}")
                return []

        papers: List[Paper] = []
        for item in data.get("data", []):
            if not item.get("abstract"):
                continue
            authors = [Author(name=a.get("name", "")) for a in item.get("authors", [])]
            ext_ids = item.get("externalIds", {})
            doi = ext_ids.get("DOI")
            arxiv_id = ext_ids.get("ArXiv")
            url = (
                f"https://arxiv.org/abs/{arxiv_id}"
                if arxiv_id
                else f"https://www.semanticscholar.org/paper/{item['paperId']}"
            )
            papers.append(
                Paper(
                    id=f"ss_{item['paperId']}",
                    title=item.get("title", ""),
                    authors=authors,
                    abstract=item.get("abstract", ""),
                    year=item.get("year"),
                    venue=item.get("venue"),
                    citation_count=item.get("citationCount"),
                    url=url,
                    doi=doi,
                    source="semantic_scholar",
                )
            )
        return papers
