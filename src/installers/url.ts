import path from "node:path"
import fs from "node:fs"
import os from "node:os"

export async function installFromUrl(
  source: string,
): Promise<string> {
  const response = await fetch(source)
  if (!response.ok) {
    throw new Error(`Failed to download plugin from ${source}: ${response.statusText}`)
  }
  const content = await response.text()

  const pluginsDir = path.join(os.homedir(), ".config", "opencode", "plugins")
  if (!fs.existsSync(pluginsDir)) {
    fs.mkdirSync(pluginsDir, { recursive: true })
  }

  const urlPath = new URL(source).pathname
  const filename = path.basename(urlPath) || "plugin.mjs"
  const dest = path.join(pluginsDir, filename)
  fs.writeFileSync(dest, content, "utf-8")
  return dest
}
