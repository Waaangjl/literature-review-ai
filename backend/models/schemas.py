from pydantic import BaseModel
from typing import List, Optional, Any


class ResearchRequest(BaseModel):
    topic: str
    max_papers: int = 20
    year_from: Optional[int] = None
    year_to: Optional[int] = None


class Author(BaseModel):
    name: str
    affiliation: Optional[str] = None


class Paper(BaseModel):
    id: str
    title: str
    authors: List[Author]
    abstract: str
    year: Optional[int] = None
    venue: Optional[str] = None
    citation_count: Optional[int] = None
    url: Optional[str] = None
    doi: Optional[str] = None
    source: str  # "semantic_scholar" | "arxiv"


class PaperSummary(BaseModel):
    paper_id: str
    title: str
    authors: List[str]
    year: Optional[int] = None
    venue: Optional[str] = None
    key_contributions: List[str]
    methodology: str
    findings: str
    limitations: str
    relevance_score: float
    citation: str  # APA formatted


class Theme(BaseModel):
    name: str
    description: str
    paper_ids: List[str]


class LiteratureReview(BaseModel):
    introduction: str
    themes: List[Theme]
    synthesis: str
    research_gaps: List[str]
    future_directions: List[str]
    conclusion: str


class Implications(BaseModel):
    theoretical: List[str]
    practical: List[str]
    policy: List[str]
    future_research: List[str]


class ResearchResult(BaseModel):
    topic: str
    papers: List[Paper]
    summaries: List[PaperSummary]
    review: LiteratureReview
    implications: Implications
    references: List[str]


class ProgressUpdate(BaseModel):
    stage: str
    message: str
    progress: int  # 0–100
    data: Optional[Any] = None
