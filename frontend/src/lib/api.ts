import { ProgressUpdate, ResearchResult } from "@/types"

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"

function getStoredKey(): string {
  if (typeof window === "undefined") return ""
  return localStorage.getItem("llm_api_key") ?? ""
}

export function saveApiKey(key: string) {
  localStorage.setItem("llm_api_key", key)
}

export function loadApiKey(): string {
  return getStoredKey()
}

export async function streamResearch(
  topic: string,
  maxPapers: number,
  yearFrom: number | undefined,
  yearTo: number | undefined,
  onProgress: (update: ProgressUpdate) => void,
  onComplete: (result: ResearchResult) => void,
  onError: (msg: string) => void
) {
  const apiKey = getStoredKey()
  const headers: Record<string, string> = { "Content-Type": "application/json" }
  if (apiKey) headers["X-API-Key"] = apiKey

  const res = await fetch(`${API_BASE}/api/research`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      topic,
      max_papers: maxPapers,
      year_from: yearFrom ?? null,
      year_to: yearTo ?? null,
    }),
  })

  if (!res.ok || !res.body) {
    onError("Failed to connect to backend.")
    return
  }

  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ""

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })

    const lines = buffer.split("\n")
    buffer = lines.pop() ?? ""

    for (const line of lines) {
      if (!line.startsWith("data: ")) continue
      try {
        const update: ProgressUpdate = JSON.parse(line.slice(6))
        onProgress(update)
        if (update.stage === "complete" && update.data?.result) {
          onComplete(update.data.result)
        } else if (update.stage === "error") {
          onError(update.message)
        }
      } catch {
        // skip malformed lines
      }
    }
  }
}

export async function exportMarkdown(result: ResearchResult): Promise<void> {
  const res = await fetch(`${API_BASE}/api/export/markdown`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(result),
  })
  download(await res.blob(), `${result.topic.slice(0, 40)}.md`)
}

export async function exportDocx(result: ResearchResult): Promise<void> {
  const res = await fetch(`${API_BASE}/api/export/docx`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(result),
  })
  download(await res.blob(), `${result.topic.slice(0, 40)}.docx`)
}

function download(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
