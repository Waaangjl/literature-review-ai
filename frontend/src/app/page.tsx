"use client"

import { useState, useCallback } from "react"
import SearchInput from "@/components/SearchInput"
import ProgressTracker from "@/components/ProgressTracker"
import ResultsDashboard from "@/components/ResultsDashboard"
import ApiKeyDrawer from "@/components/ApiKeyDrawer"
import { streamResearch } from "@/lib/api"
import { ProgressUpdate, ResearchResult } from "@/types"

type AppState = "idle" | "loading" | "done" | "error"

export default function HomePage() {
  const [state, setState] = useState<AppState>("idle")
  const [updates, setUpdates] = useState<ProgressUpdate[]>([])
  const [current, setCurrent] = useState<ProgressUpdate | null>(null)
  const [result, setResult] = useState<ResearchResult | null>(null)
  const [errorMsg, setErrorMsg] = useState("")
  const [drawerOpen, setDrawerOpen] = useState(false)

  const handleSearch = useCallback(
    async (topic: string, maxPapers: number, yearFrom?: number, yearTo?: number) => {
      setState("loading")
      setUpdates([])
      setCurrent(null)
      setResult(null)
      setErrorMsg("")

      await streamResearch(
        topic, maxPapers, yearFrom, yearTo,
        (update) => { setUpdates(prev => [...prev, update]); setCurrent(update) },
        (res) => { setResult(res); setState("done") },
        (msg) => { setErrorMsg(msg); setState("error") }
      )
    },
    []
  )

  return (
    <main className="min-h-screen">
      {/* Nav */}
      <div className="fixed top-4 right-4 z-30">
        <button
          onClick={() => setDrawerOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-full shadow-sm text-sm font-medium hover:bg-gray-50 transition-colors"
        >
          <span>⚙️</span> Model settings
        </button>
      </div>

      <ApiKeyDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />

      {/* Hero */}
      <div className="bg-gradient-to-br from-blue-600 to-indigo-700 text-white py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl font-bold mb-3">Literature Review AI</h1>
          <p className="text-blue-100 text-lg mb-10">
            Enter a research topic — get a full literature review in minutes.
          </p>
          <SearchInput onSearch={handleSearch} loading={state === "loading"} />
          {state === "idle" && (
            <div className="mt-6 flex flex-wrap justify-center gap-2">
              {["Large language models", "Climate change adaptation", "CRISPR gene editing", "Federated learning privacy"].map(s => (
                <button
                  key={s}
                  onClick={() => handleSearch(s, 20)}
                  className="text-sm bg-white/10 hover:bg-white/20 px-4 py-1.5 rounded-full transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="py-10 px-4">
        {state === "loading" && <ProgressTracker updates={updates} current={current} />}

        {state === "error" && (
          <div className="max-w-3xl mx-auto bg-red-50 border border-red-200 text-red-700 rounded-xl p-5 text-center">
            <p className="font-semibold text-lg mb-1">Something went wrong</p>
            <p className="text-sm">{errorMsg}</p>
            <button onClick={() => setState("idle")} className="mt-3 text-sm underline">
              Try again
            </button>
          </div>
        )}

        {state === "done" && result && <ResultsDashboard result={result} />}

        {state === "idle" && (
          <div className="max-w-4xl mx-auto mt-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
              {[
                { icon: "🔍", title: "Smart Search", desc: "Queries Semantic Scholar & arXiv in parallel" },
                { icon: "🤖", title: "AI Analysis", desc: "Analyses each paper's contributions & findings" },
                { icon: "📝", title: "Full Review", desc: "Themes, synthesis, gaps & implications" },
                { icon: "📄", title: "Export", desc: "Download as Markdown or Word document" },
              ].map(({ icon, title, desc }) => (
                <div key={title} className="bg-white rounded-xl border border-gray-200 p-5">
                  <div className="text-3xl mb-2">{icon}</div>
                  <h3 className="font-semibold text-gray-900">{title}</h3>
                  <p className="text-sm text-gray-500 mt-1">{desc}</p>
                </div>
              ))}
            </div>

            {/* Provider info */}
            <div className="mt-6 text-center text-sm text-gray-400">
              Runs on Ollama (local) by default · bring your own API key for cloud models ·{" "}
              <button onClick={() => setDrawerOpen(true)} className="underline hover:text-gray-600">
                configure
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
