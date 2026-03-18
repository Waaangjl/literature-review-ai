"use client"

import { useState } from "react"
import { PaperSummary } from "@/types"

interface Props {
  summary: PaperSummary
  rank: number
}

export default function PaperCard({ summary, rank }: Props) {
  const [expanded, setExpanded] = useState(false)
  const pct = Math.round(summary.relevance_score * 100)
  const authorStr =
    summary.authors.slice(0, 3).join(", ") +
    (summary.authors.length > 3 ? " et al." : "")

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
              #{rank}
            </span>
            <span className={`text-xs px-2 py-0.5 rounded-full ${
              pct >= 80 ? "bg-green-100 text-green-700" :
              pct >= 60 ? "bg-yellow-100 text-yellow-700" :
              "bg-gray-100 text-gray-600"
            }`}>
              {pct}% relevant
            </span>
            {summary.year && (
              <span className="text-xs text-gray-400">{summary.year}</span>
            )}
          </div>
          <h3 className="font-semibold text-gray-900 leading-snug">{summary.title}</h3>
          <p className="text-sm text-gray-500 mt-0.5">{authorStr}</p>
          {summary.venue && (
            <p className="text-xs text-gray-400 mt-0.5 italic">{summary.venue}</p>
          )}
        </div>
        <button
          onClick={() => setExpanded(!expanded)}
          className="shrink-0 text-sm text-blue-600 hover:text-blue-800 font-medium"
        >
          {expanded ? "Less" : "More"}
        </button>
      </div>

      {expanded && (
        <div className="mt-4 space-y-3 text-sm border-t border-gray-100 pt-4">
          <div>
            <p className="font-semibold text-gray-700 mb-1">Key Contributions</p>
            <ul className="list-disc list-inside space-y-0.5 text-gray-600">
              {summary.key_contributions.map((c, i) => <li key={i}>{c}</li>)}
            </ul>
          </div>
          <div>
            <p className="font-semibold text-gray-700">Methodology</p>
            <p className="text-gray-600">{summary.methodology}</p>
          </div>
          <div>
            <p className="font-semibold text-gray-700">Findings</p>
            <p className="text-gray-600">{summary.findings}</p>
          </div>
          <div>
            <p className="font-semibold text-gray-700">Limitations</p>
            <p className="text-gray-600">{summary.limitations}</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-xs font-semibold text-gray-500 mb-1">CITATION (APA)</p>
            <p className="text-xs text-gray-600 italic">{summary.citation}</p>
          </div>
        </div>
      )}
    </div>
  )
}
