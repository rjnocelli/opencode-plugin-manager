import type { OpenCodeConfig, PluginEntry, PluginInfo, OpmState } from "./types.js"
import {
  getSourceFromEntry,
  getOptionsFromEntry,
  findMatchingIndex,
  findMatchingEntry,
  extractPluginName,
} from "./utils.js"
import { installFromLocal } from "./installers/local.js"
import { installFromGit } from "./installers/git.js"
import { installFromNpm } from "./installers/npm.js"
import { installFromUrl } from "./installers/url.js"
import { readOpmState, writeOpmState } from "./config.js"

function isGitSource(source: string): boolean {
  return (
    source.startsWith("git@") ||
    source.startsWith("github:") ||
    source.startsWith("gh:") ||
    (source.startsWith("https://") &&
      (source.includes("github.com") || source.endsWith(".git")))
  )
}

function isUrlSource(source: string): boolean {
  return source.startsWith("https://") || source.startsWith("http://")
}

function isNpmSource(source: string): boolean {
  return !source.startsWith("/") &&
    !source.startsWith(".") &&
    !source.startsWith("~") &&
    !source.startsWith("file://") &&
    !isGitSource(source) &&
    !isUrlSource(source)
}

function isLocalSource(source: string): boolean {
  return (
    source.startsWith("/") ||
    source.startsWith(".") ||
    source.startsWith("~") ||
    source.startsWith("file://")
  )
}

export async function resolveSource(source: string): Promise<string> {
  if (isLocalSource(source)) {
    return installFromLocal(source)
  }
  if (isGitSource(source)) {
    return installFromGit(source)
  }
  if (isUrlSource(source)) {
    return installFromUrl(source)
  }
  if (isNpmSource(source)) {
    return installFromNpm(source)
  }
  return source
}

export function isUrlOrGitSource(source: string): boolean {
  return isUrlSource(source) || isGitSource(source)
}

export function installPlugin(
  config: OpenCodeConfig,
  source: string,
  options: Record<string, unknown> = {},
): OpenCodeConfig {
  const entry: PluginEntry =
    Object.keys(options).length > 0 ? [source, options] : source
  return {
    ...config,
    plugin: [...(config.plugin || []), entry],
  }
}

export function uninstallPlugin(
  config: OpenCodeConfig,
  name: string,
): { config: OpenCodeConfig; removed?: PluginEntry } {
  const entries = config.plugin || []
  const idx = findMatchingIndex(entries, name)
  if (idx === -1) {
    throw new Error(`Plugin not found: ${name}`)
  }
  const removed = entries[idx]
  return {
    config: {
      ...config,
      plugin: entries.filter((_, i) => i !== idx),
    },
    removed,
  }
}

export function listPlugins(config: OpenCodeConfig): PluginInfo[] {
  const entries = config.plugin || []
  const state = readOpmState()
  const disabledNames = new Set(Object.keys(state.disabledPlugins))

  return entries.map((entry) => {
    const source = getSourceFromEntry(entry)
    const options = getOptionsFromEntry(entry)
    const name = extractPluginName(source)
    return {
      name,
      source,
      options,
      disabled: disabledNames.has(name),
    }
  })
}

export function disablePlugin(
  config: OpenCodeConfig,
  name: string,
): { config: OpenCodeConfig; state: OpmState } {
  const entries = config.plugin || []
  const idx = findMatchingIndex(entries, name)
  if (idx === -1) {
    throw new Error(`Plugin not found: ${name}`)
  }

  const removed = entries[idx]
  const newConfig: OpenCodeConfig = {
    ...config,
    plugin: entries.filter((_, i) => i !== idx),
  }

  const pluginName = extractPluginName(getSourceFromEntry(removed))
  const state = readOpmState()
  state.disabledPlugins[pluginName] = removed
  writeOpmState(state)

  return { config: newConfig, state }
}

export function enablePlugin(
  config: OpenCodeConfig,
  name: string,
): { config: OpenCodeConfig; state: OpmState } {
  const state = readOpmState()
  const disabledEntry = findMatchingEntry(
    Object.values(state.disabledPlugins),
    name,
  )

  if (!disabledEntry) {
    throw new Error(`No disabled plugin found matching: ${name}`)
  }

  const pluginName = extractPluginName(getSourceFromEntry(disabledEntry))
  const newConfig: OpenCodeConfig = {
    ...config,
    plugin: [...(config.plugin || []), disabledEntry],
  }

  delete state.disabledPlugins[pluginName]
  writeOpmState(state)

  return { config: newConfig, state }
}

export function getPluginInfo(
  config: OpenCodeConfig,
  name?: string,
): PluginInfo[] {
  const all = listPlugins(config)

  if (name) {
    const entry = findMatchingEntry(
      config.plugin || [],
      name,
    )
    if (!entry) {
      throw new Error(`Plugin not found: ${name}`)
    }
    const info = all.find((p) => p.name === extractPluginName(getSourceFromEntry(entry)))
    return info ? [info] : []
  }

  return all
}
