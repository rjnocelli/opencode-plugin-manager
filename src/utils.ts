import path from "node:path"
import os from "node:os"
import type { PluginEntry } from "./types.js"

export function getSourceFromEntry(entry: PluginEntry): string {
  return typeof entry === "string" ? entry : entry[0]
}

export function getOptionsFromEntry(entry: PluginEntry): Record<string, unknown> {
  return typeof entry === "string" ? {} : entry[1]
}

export function extractPluginName(source: string): string {
  const genericNames = new Set(["index", "dist", "main", "src", "lib", "build"])
  const parts = source.replace(/^file:\/\//, "").split("/").filter(Boolean)

  let base = ""
  for (let i = parts.length - 1; i >= 0; i--) {
    const candidate = parts[i].replace(/\.\w+$/, "")
    if (!genericNames.has(candidate)) {
      base = candidate
      break
    }
  }

  if (!base) base = parts[parts.length - 1]?.replace(/\.\w+$/, "") || "unknown"
  if (base.startsWith("opencode-")) base = base.slice("opencode-".length)
  if (base.endsWith("-plugin")) base = base.slice(0, -"-plugin".length)
  return base || "unknown"
}

export function matchesPlugin(source: string, nameOrPattern: string): boolean {
  const patternStem = nameOrPattern.replace(/\.\w+$/, "")
  const basename = path.basename(source).replace(/\.\w+$/, "")

  if (source === nameOrPattern) return true
  if (basename === nameOrPattern || basename === patternStem) return true

  const stem = basename
    .replace(/^opencode-/, "")
    .replace(/-plugin$/, "")
  if (stem === patternStem) return true

  const prefixed = `opencode-${patternStem}`
  const suffixed = `${patternStem}-plugin`
  if (basename === prefixed || basename === suffixed || basename === `opencode-${patternStem}-plugin`) return true

  const pathParts = source.replace(/^file:\/\//, "").split("/")
  for (const part of pathParts) {
    const partStem = part.replace(/\.\w+$/, "").replace(/^opencode-/, "").replace(/-plugin$/, "")
    if (part === nameOrPattern || part === patternStem || partStem === patternStem) return true
  }

  return false
}

export function findMatchingEntry(
  entries: PluginEntry[],
  nameOrPattern: string,
): PluginEntry | undefined {
  return entries.find((entry) => {
    const src = getSourceFromEntry(entry)
    return matchesPlugin(src, nameOrPattern)
  })
}

export function findMatchingIndex(
  entries: PluginEntry[],
  nameOrPattern: string,
): number {
  return entries.findIndex((entry) => {
    const src = getSourceFromEntry(entry)
    return matchesPlugin(src, nameOrPattern)
  })
}

export function formatEntry(entry: PluginEntry): string {
  const source = getSourceFromEntry(entry)
  const options = getOptionsFromEntry(entry)
  if (Object.keys(options).length === 0) return source
  return `${source}  ${JSON.stringify(options)}`
}

export function normalizePath(p: string): string {
  if (p.startsWith("~")) {
    return p.replace(/^~/, os.homedir())
  }
  return path.resolve(p)
}
