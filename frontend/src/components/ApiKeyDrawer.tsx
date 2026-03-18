"use client"

import { useState, useEffect } from "react"
import { saveApiKey, loadApiKey } from "@/lib/api"

const PROVIDERS = [
  { value: "ollama", label: "Ollama (local, free)", needsKey: false },
  { value: "anthropic", label: "Anthropic (Claude)", needsKey: true, placeholder: "sk-ant-..." },
  { value: "openai", label: "OpenAI (GPT-4o)", needsKey: true, placeholder: "sk-..." },
  { value: "groq", label: "Groq (fast + free tier)", needsKey: true, placeholder: "gsk_..." },
]

interface Props {
  open: boolean
  onClose: () => void
}

export default function ApiKeyDrawer({ open, onClose }: Props) {
  const [key, setKey] = useState("")
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (open) setKey(loadApiKey())
  }, [open])

  const handleSave = () => {
    saveApiKey(key.trim())
    setSaved(true)
    setTimeout(() => { setSaved(false); onClose() }, 800)
  }

  if (!open) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 z-40"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="fixed right-0 top-0 h-full w-full max-w-sm bg-white shadow-2xl z-50 flex flex-col">
        <div className="flex items-center justify-between p-5 border-b">
          <h2 className="font-semibold text-gray-900">Model Settings</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {/* How it works */}
          <div className="bg-blue-50 rounded-xl p-4 text-sm text-blue-800">
            <p className="font-semibold mb-1">How model selection works</p>
            <p>The server uses its configured provider by default (see <code>.env</code>). If you enter a key here, it overrides the server and uses your key — you pay, not the server owner.</p>
          </div>

          {/* Providers table */}
          <div>
            <p className="text-sm font-semibold text-gray-700 mb-3">Providers (configured server-side)</p>
            <div className="space-y-2">
              {PROVIDERS.map(p => (
                <div key={p.value} className="flex items-center justify-between bg-gray-50 rounded-lg px-4 py-3 text-sm">
                  <span className="text-gray-700">{p.label}</span>
                  {p.needsKey
                    ? <span className="text-xs text-gray-400">needs key</span>
                    : <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">free</span>
                  }
                </div>
              ))}
            </div>
          </div>

          {/* Your own key */}
          <div>
            <label className="text-sm font-semibold text-gray-700 block mb-2">
              Your API key <span className="font-normal text-gray-400">(optional — stored in your browser only)</span>
            </label>
            <input
              type="password"
              value={key}
              onChange={e => setKey(e.target.value)}
              placeholder="sk-ant-... or sk-... or gsk_..."
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-blue-400"
            />
            <p className="text-xs text-gray-400 mt-1.5">
              Never sent to our servers — only passed directly in your requests.
            </p>
            {key && (
              <button
                onClick={() => { setKey(""); saveApiKey("") }}
                className="text-xs text-red-500 hover:text-red-700 mt-1 underline"
              >
                Clear key
              </button>
            )}
          </div>
        </div>

        <div className="p-5 border-t">
          <button
            onClick={handleSave}
            className="w-full py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors"
          >
            {saved ? "Saved!" : "Save"}
          </button>
        </div>
      </div>
    </>
  )
}
