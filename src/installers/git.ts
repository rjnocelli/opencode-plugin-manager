import path from "node:path"
import fs from "node:fs"
import os from "node:os"
import { execa } from "execa"
import { extractPluginName } from "../utils.js"

function parseGitUrl(url: string): { url: string; name: string } {
  let parsedUrl = url
  if (url.startsWith("github:")) {
    parsedUrl = `https://github.com/${url.slice("github:".length)}.git`
  } else if (url.startsWith("gh:")) {
    parsedUrl = `https://github.com/${url.slice("gh:".length)}.git`
  }
  const name = extractPluginName(parsedUrl)
  return { url: parsedUrl, name }
}

export async function installFromGit(
  source: string,
): Promise<string> {
  const { url, name } = parseGitUrl(source)
  const targetDir = path.join(os.homedir(), ".config", "opencode", "plugins", name)

  if (fs.existsSync(targetDir)) {
    console.error(`Already installed at ${targetDir}, pulling latest...`)
    await execa("git", ["-C", targetDir, "pull"], { stdio: "inherit" })
  } else {
    await execa("git", ["clone", "--depth", "1", url, targetDir], {
      stdio: "inherit",
    })
  }

  const hasBun = await detectBun()
  if (hasBun) {
    try {
      await execa("bun", ["install"], { cwd: targetDir, stdio: "inherit" })
    } catch {
      // fall through
    }
    try {
      await execa("bun", ["run", "build"], { cwd: targetDir, stdio: "inherit" })
    } catch {
      // fall through
    }
  }

  const entryPath = path.join(targetDir, "dist", "index.js")
  if (fs.existsSync(entryPath)) return entryPath

  const mjsPath = path.join(targetDir, "dist", "index.mjs")
  if (fs.existsSync(mjsPath)) return mjsPath

  return targetDir
}

async function detectBun(): Promise<boolean> {
  try {
    await execa("bun", ["--version"], { stdio: "ignore" })
    return true
  } catch {
    return false
  }
}
