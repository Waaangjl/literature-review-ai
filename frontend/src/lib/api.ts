import { ProgressUpdate, ResearchResult } from "@/types"

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"

export async function streamResearch(
  topic: string,
  maxPapers: number,
  yearFrom: number | undefined,
  yearTo: number | undefined,
  onProgress: (update: ProgressUpdate) => void,
  onComplete: (result: ResearchResult) => void,
  onError: (msg: string) => void
) {
  const res = await fetch(`${API_BASE}/api/research`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
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

    // Parse SSE lines
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
  const blob = await res.blob()
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = `${result.topic.slice(0, 40)}.md`
  a.click()
  URL.revokeObjectURL(url)
}

export async function exportDocx(result: ResearchResult): Promise<void> {
  const res = await fetch(`${API_BASE}/api/export/docx`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(result),
  })
  const blob = await res.blob()
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = `${result.topic.slice(0, 40)}.docx`
  a.click()
  URL.revokeObjectURL(url)
}
