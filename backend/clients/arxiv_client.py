import httpx
import xml.etree.ElementTree as ET
from typing import List
from models.schemas import Paper, Author

NS = {"atom": "http://www.w3.org/2005/Atom"}
ARXIV_NS = "http://arxiv.org/schemas/atom"


class ArxivClient:
    BASE_URL = "http://export.arxiv.org/api/query"

    async def search(self, query: str, limit: int = 10) -> List[Paper]:
        params = {
            "search_query": f"all:{query}",
            "max_results": limit,
            "sortBy": "relevance",
            "sortOrder": "descending",
        }
        async with httpx.AsyncClient(timeout=30) as client:
            try:
                resp = await client.get(self.BASE_URL, params=params)
                resp.raise_for_status()
            except Exception as e:
                print(f"[ArXiv] Error: {e}")
                return []

        root = ET.fromstring(resp.text)
        papers: List[Paper] = []

        for entry in root.findall("atom:entry", NS):
            id_el = entry.find("atom:id", NS)
            title_el = entry.find("atom:title", NS)
            abstract_el = entry.find("atom:summary", NS)
            published_el = entry.find("atom:published", NS)

            if None in (id_el, title_el, abstract_el):
                continue

            arxiv_id = id_el.text.split("/abs/")[-1]
            title = title_el.text.strip().replace("\n", " ")
            abstract = abstract_el.text.strip().replace("\n", " ")
            year = int(published_el.text[:4]) if published_el is not None else None

            authors = [
                Author(name=name_el.text)
                for a in entry.findall("atom:author", NS)
                if (name_el := a.find("atom:name", NS)) is not None
            ]

            journal_el = entry.find(f"{{{ARXIV_NS}}}journal_ref")
            venue = journal_el.text if journal_el is not None else "arXiv preprint"

            papers.append(
                Paper(
                    id=f"arxiv_{arxiv_id}",
                    title=title,
                    authors=authors,
                    abstract=abstract,
                    year=year,
                    venue=venue,
                    citation_count=None,
                    url=f"https://arxiv.org/abs/{arxiv_id}",
                    doi=None,
                    source="arxiv",
                )
            )
        return papers
