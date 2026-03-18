"use client"

import { ProgressUpdate } from "@/types"

const STAGE_LABELS: Record<string, string> = {
  searching: "Searching databases",
  analyzing: "Analysing papers",
  clustering: "Clustering themes",
  writing: "Writing review",
  implications: "Generating implications",
  formatting: "Formatting output",
  complete: "Done",
}

const STAGE_ORDER = ["searching", "analyzing", "clustering", "writing", "implications", "formatting", "complete"]

interface Props {
  updates: ProgressUpdate[]
  current: ProgressUpdate | null
}

export default function ProgressTracker({ updates, current }: Props) {
  if (!current) return null

  const pct = current.progress

  return (
    <div className="w-full max-w-3xl mx-auto bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
      {/* Overall progress bar */}
      <div className="mb-5">
        <div className="flex justify-between text-sm text-gray-500 mb-2">
          <span className="font-medium text-gray-700">{STAGE_LABELS[current.stage] ?? current.stage}</span>
          <span>{pct}%</span>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-3">
          <div
            className="bg-blue-500 h-3 rounded-full transition-all duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      {/* Stage pipeline */}
      <div className="flex items-center gap-1 mb-5 overflow-x-auto pb-1">
        {STAGE_ORDER.filter(s => s !== "complete").map((stage, i) => {
          const stageIdx = STAGE_ORDER.indexOf(current.stage)
          const thisIdx = STAGE_ORDER.indexOf(stage)
          const done = thisIdx < stageIdx
          const active = stage === current.stage
          return (
            <div key={stage} className="flex items-center gap-1 shrink-0">
              <div className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                done
                  ? "bg-blue-100 text-blue-700"
                  : active
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-400"
              }`}>
                {done ? "✓ " : ""}{STAGE_LABELS[stage]}
              </div>
              {i < STAGE_ORDER.length - 2 && (
                <div className={`w-4 h-0.5 ${done ? "bg-blue-300" : "bg-gray-200"}`} />
              )}
            </div>
          )
        })}
      </div>

      {/* Recent messages */}
      <div className="space-y-1 max-h-40 overflow-y-auto">
        {[...updates].reverse().slice(0, 8).map((u, i) => (
          <div key={i} className={`text-sm px-3 py-1.5 rounded-lg ${
            i === 0 ? "bg-blue-50 text-blue-800 font-medium" : "text-gray-500"
          }`}>
            {u.message}
            {u.data?.count !== undefined && (
              <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                {u.data.count} papers
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
