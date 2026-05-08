import path from "node:path"
import fs from "node:fs"
import { normalizePath } from "../utils.js"

export async function installFromLocal(
  source: string,
): Promise<string> {
  const resolved = normalizePath(source)
  if (!fs.existsSync(resolved)) {
    throw new Error(`Local plugin not found: ${resolved}`)
  }
  const stat = fs.statSync(resolved)
  if (stat.isDirectory()) {
    const distDir = path.join(resolved, "dist")
    const indexJs = path.join(resolved, "dist", "index.js")
    const indexTs = path.join(resolved, "dist", "index.ts")
    if (fs.existsSync(indexJs)) return indexJs
    if (fs.existsSync(indexTs)) return indexTs
    if (fs.existsSync(distDir)) {
      const files = fs.readdirSync(distDir)
      const jsFile = files.find((f) => f.endsWith(".js") || f.endsWith(".mjs"))
      if (jsFile) return path.join(distDir, jsFile)
    }
    throw new Error(
      `No built plugin found in ${resolved}/dist/. Run 'bun run build' first.`
    )
  }
  return resolved
}
