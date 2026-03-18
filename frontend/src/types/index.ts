export interface Author {
  name: string
  affiliation?: string
}

export interface Paper {
  id: string
  title: string
  authors: Author[]
  abstract: string
  year?: number
  venue?: string
  citation_count?: number
  url?: string
  doi?: string
  source: string
}

export interface PaperSummary {
  paper_id: string
  title: string
  authors: string[]
  year?: number
  venue?: string
  key_contributions: string[]
  methodology: string
  findings: string
  limitations: string
  relevance_score: number
  citation: string
}

export interface Theme {
  name: string
  description: string
  paper_ids: string[]
}

export interface LiteratureReview {
  introduction: string
  themes: Theme[]
  synthesis: string
  research_gaps: string[]
  future_directions: string[]
  conclusion: string
}

export interface Implications {
  theoretical: string[]
  practical: string[]
  policy: string[]
  future_research: string[]
}

export interface ResearchResult {
  topic: string
  papers: Paper[]
  summaries: PaperSummary[]
  review: LiteratureReview
  implications: Implications
  references: string[]
}

export interface ProgressUpdate {
  stage: string
  message: string
  progress: number
  data?: {
    count?: number
    themes?: string[]
    result?: ResearchResult
  }
}
