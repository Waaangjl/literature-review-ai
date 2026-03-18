"use client"

import { useState } from "react"
import { ResearchResult } from "@/types"
import PaperCard from "./PaperCard"
import { exportMarkdown, exportDocx } from "@/lib/api"

const TABS = ["Overview", "Themes", "Papers", "Implications", "References"] as const
type Tab = (typeof TABS)[number]

interface Props {
  result: ResearchResult
}

export default function ResultsDashboard({ result }: Props) {
  const [tab, setTab] = useState<Tab>("Overview")
  const [exporting, setExporting] = useState<"" | "md" | "docx">("")

  const sortedSummaries = [...result.summaries].sort(
    (a, b) => b.relevance_score - a.relevance_score
  )

  const handleExport = async (format: "md" | "docx") => {
    setExporting(format)
    try {
      if (format === "md") await exportMarkdown(result)
      else await exportDocx(result)
    } finally {
      setExporting("")
    }
  }

  return (
    <div className="w-full max-w-5xl mx-auto">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 mb-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{result.topic}</h2>
            <p className="text-gray-500 mt-1">
              {result.papers.length} papers · {result.review.themes.length} themes ·{" "}
              {result.references.length} references
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => handleExport("md")}
              disabled={exporting !== ""}
              className="px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
            >
              {exporting === "md" ? "Exporting…" : "Export Markdown"}
            </button>
            <button
              onClick={() => handleExport("docx")}
              disabled={exporting !== ""}
              className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {exporting === "docx" ? "Exporting…" : "Export Word"}
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-4">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${
              tab === t ? "bg-white shadow-sm text-blue-600" : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">

        {/* ── Overview ── */}
        {tab === "Overview" && (
          <div className="space-y-6">
            <Section title="Introduction">
              <Prose text={result.review.introduction} />
            </Section>
            <Section title="Synthesis">
              <Prose text={result.review.synthesis} />
            </Section>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Section title="Research Gaps">
                <BulletList items={result.review.research_gaps} color="red" />
              </Section>
              <Section title="Future Directions">
                <BulletList items={result.review.future_directions} color="green" />
              </Section>
            </div>
            <Section title="Conclusion">
              <Prose text={result.review.conclusion} />
            </Section>
          </div>
        )}

        {/* ── Themes ── */}
        {tab === "Themes" && (
          <div className="space-y-4">
            {result.review.themes.map((theme, i) => (
              <div key={i} className="border border-gray-100 rounded-xl p-5 bg-gray-50">
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-7 h-7 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center">
                    {i + 1}
                  </span>
                  <h3 className="font-semibold text-gray-900">{theme.name}</h3>
                  <span className="text-xs text-gray-400 ml-auto">{theme.paper_ids.length} papers</span>
                </div>
                <p className="text-gray-600 text-sm">{theme.description}</p>
              </div>
            ))}
          </div>
        )}

        {/* ── Papers ── */}
        {tab === "Papers" && (
          <div className="space-y-3">
            <p className="text-sm text-gray-500 mb-4">Sorted by relevance score</p>
            {sortedSummaries.map((summary, i) => (
              <PaperCard key={summary.paper_id} summary={summary} rank={i + 1} />
            ))}
          </div>
        )}

        {/* ── Implications ── */}
        {tab === "Implications" && (
          <div className="space-y-6">
            {[
              { title: "Theoretical Implications", items: result.implications.theoretical, color: "blue" as const },
              { title: "Practical Implications", items: result.implications.practical, color: "green" as const },
              { title: "Policy Implications", items: result.implications.policy, color: "orange" as const },
              { title: "Future Research Questions", items: result.implications.future_research, color: "purple" as const },
            ].map(({ title, items, color }) =>
              items.length > 0 ? (
                <Section key={title} title={title}>
                  <BulletList items={items} color={color} />
                </Section>
              ) : null
            )}
          </div>
        )}

        {/* ── References ── */}
        {tab === "References" && (
          <div className="space-y-2">
            <p className="text-sm text-gray-500 mb-4">{result.references.length} references · APA format</p>
            {result.references.map((ref, i) => (
              <div key={i} className="flex gap-3 text-sm text-gray-700 py-2 border-b border-gray-50">
                <span className="text-gray-400 shrink-0 w-6 text-right">{i + 1}.</span>
                <span>{ref}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ── Helpers ─────────────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-lg font-semibold text-gray-900 mb-3">{title}</h3>
      {children}
    </div>
  )
}

function Prose({ text }: { text: string }) {
  return (
    <div className="space-y-3">
      {text.split("\n\n").filter(Boolean).map((para, i) => (
        <p key={i} className="text-gray-700 leading-relaxed">{para}</p>
      ))}
    </div>
  )
}

type Color = "red" | "green" | "blue" | "orange" | "purple"

const COLOR_CLASSES: Record<Color, string> = {
  red: "bg-red-50 text-red-700",
  green: "bg-green-50 text-green-700",
  blue: "bg-blue-50 text-blue-700",
  orange: "bg-orange-50 text-orange-700",
  purple: "bg-purple-50 text-purple-700",
}

function BulletList({ items, color }: { items: string[]; color: Color }) {
  return (
    <ul className="space-y-2">
      {items.map((item, i) => (
        <li key={i} className={`flex gap-2 items-start text-sm rounded-lg px-3 py-2 ${COLOR_CLASSES[color]}`}>
          <span className="mt-0.5 shrink-0">•</span>
          <span>{item}</span>
        </li>
      ))}
    </ul>
  )
}
