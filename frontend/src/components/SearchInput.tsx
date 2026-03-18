"use client"

import { useState } from "react"

interface SearchInputProps {
  onSearch: (topic: string, maxPapers: number, yearFrom?: number, yearTo?: number) => void
  loading: boolean
}

export default function SearchInput({ onSearch, loading }: SearchInputProps) {
  const [topic, setTopic] = useState("")
  const [maxPapers, setMaxPapers] = useState(20)
  const [yearFrom, setYearFrom] = useState("")
  const [yearTo, setYearTo] = useState("")
  const [showAdvanced, setShowAdvanced] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!topic.trim()) return
    onSearch(
      topic.trim(),
      maxPapers,
      yearFrom ? parseInt(yearFrom) : undefined,
      yearTo ? parseInt(yearTo) : undefined
    )
  }

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-3xl mx-auto">
      <div className="flex gap-3">
        <input
          type="text"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          placeholder="e.g. transformer models in natural language processing"
          className="flex-1 px-5 py-4 text-lg border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition-colors"
          disabled={loading}
        />
        <button
          type="submit"
          disabled={loading || !topic.trim()}
          className="px-8 py-4 bg-blue-600 text-white text-lg font-semibold rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors whitespace-nowrap"
        >
          {loading ? "Researching…" : "Generate Review"}
        </button>
      </div>

      {/* Advanced options toggle */}
      <button
        type="button"
        onClick={() => setShowAdvanced(!showAdvanced)}
        className="mt-3 text-sm text-gray-500 hover:text-gray-700 underline"
      >
        {showAdvanced ? "Hide" : "Show"} advanced options
      </button>

      {showAdvanced && (
        <div className="mt-4 flex gap-4 flex-wrap items-center p-4 bg-white rounded-xl border border-gray-200">
          <label className="flex flex-col gap-1 text-sm text-gray-600">
            Max papers
            <select
              value={maxPapers}
              onChange={(e) => setMaxPapers(parseInt(e.target.value))}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none"
              disabled={loading}
            >
              {[10, 15, 20, 30].map((n) => (
                <option key={n} value={n}>{n} papers</option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-sm text-gray-600">
            Year from
            <input
              type="number"
              value={yearFrom}
              onChange={(e) => setYearFrom(e.target.value)}
              placeholder="2010"
              min="1900"
              max={new Date().getFullYear()}
              className="w-24 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none"
              disabled={loading}
            />
          </label>
          <label className="flex flex-col gap-1 text-sm text-gray-600">
            Year to
            <input
              type="number"
              value={yearTo}
              onChange={(e) => setYearTo(e.target.value)}
              placeholder={String(new Date().getFullYear())}
              min="1900"
              max={new Date().getFullYear()}
              className="w-24 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none"
              disabled={loading}
            />
          </label>
        </div>
      )}
    </form>
  )
}
