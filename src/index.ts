#!/usr/bin/env node

import { Command } from "commander"
import {
  findConfigPath,
  findGlobalConfigPath,
  readConfig,
  writeConfig,
} from "./config.js"
import {
  resolveSource,
  installPlugin,
  uninstallPlugin,
  getPluginInfo,
  disablePlugin,
  enablePlugin,
  isUrlOrGitSource,
} from "./plugin.js"
import { formatEntry } from "./utils.js"
import type { OpenCodeConfig } from "./types.js"

const program = new Command()

program
  .name("opm")
  .description("OpenCode Plugin Manager — install, uninstall, enable, disable, and list plugins")
  .version("0.1.0")

function getConfig(globalFlag: boolean): { configPath: string; config: OpenCodeConfig } {
  const configPath = globalFlag ? findGlobalConfigPath() : findConfigPath()
  const config = readConfig(configPath)
  return { configPath, config }
}

program
  .command("install")
  .description("Install a plugin")
  .argument("<source>", "npm package name, local path, git repo URL, or HTTP URL")
  .argument("[options...]", "key=value plugin options")
  .option("--global", "Install in global config", false)
  .action(async (source: string, rawOptions: string[], options: { global: boolean }) => {
    try {
      const { configPath, config } = getConfig(options.global)

      const parsedOptions: Record<string, unknown> = {}
      for (const opt of rawOptions || []) {
        const eqIdx = opt.indexOf("=")
        if (eqIdx === -1) {
          parsedOptions[opt] = true
        } else {
          parsedOptions[opt.slice(0, eqIdx)] = opt.slice(eqIdx + 1)
        }
      }

      const resolvedSource = await resolveSource(source)
      const newConfig = installPlugin(config, resolvedSource, parsedOptions)
      writeConfig(configPath, newConfig)
      console.error(`Installed plugin: ${formatEntry(
        Object.keys(parsedOptions).length > 0
          ? [resolvedSource, parsedOptions]
          : resolvedSource,
      )}`)

      if (isUrlOrGitSource(source)) {
        console.error("Note: Restart opencode to load the new plugin.")
      }
    } catch (err) {
      console.error((err as Error).message)
      process.exit(1)
    }
  })

program
  .command("uninstall")
  .description("Uninstall a plugin")
  .argument("<name>", "Plugin name, source path, or pattern")
  .option("--global", "Uninstall from global config", false)
  .action((name: string, options: { global: boolean }) => {
    try {
      const { configPath, config } = getConfig(options.global)
      const result = uninstallPlugin(config, name)
      writeConfig(configPath, result.config)
      if (result.removed) {
        console.error(`Uninstalled: ${formatEntry(result.removed)}`)
      }
    } catch (err) {
      console.error((err as Error).message)
      process.exit(1)
    }
  })

program
  .command("list")
  .description("List all installed plugins")
  .option("--global", "List plugins from global config", false)
  .action((options: { global: boolean }) => {
    try {
      const { config } = getConfig(options.global)
      const plugins = getPluginInfo(config)

      if (plugins.length === 0) {
        console.log("No plugins installed.")
        return
      }

      const namePad = Math.max(...plugins.map((p) => p.name.length), 4)
      console.log(
        `${"NAME".padEnd(namePad)}  SOURCE`,
      )
      console.log("-".repeat(60))
      for (const plugin of plugins) {
        const status = plugin.disabled ? " (disabled)" : ""
        console.log(
          `${plugin.name.padEnd(namePad)}  ${plugin.source}${status}`,
        )
        if (Object.keys(plugin.options).length > 0) {
          console.log(
            `${"".padEnd(namePad)}  options: ${JSON.stringify(plugin.options)}`,
          )
        }
      }
    } catch (err) {
      console.error((err as Error).message)
      process.exit(1)
    }
  })

program
  .command("info")
  .description("Show details about installed plugins")
  .argument("[name]", "Plugin name to show details for")
  .option("--global", "Show plugins from global config", false)
  .action((name: string | undefined, options: { global: boolean }) => {
    try {
      const { config } = getConfig(options.global)
      const plugins = getPluginInfo(config, name)

      if (plugins.length === 0) {
        console.log("No plugins found.")
        return
      }

      for (const plugin of plugins) {
        console.log(`Name:     ${plugin.name}`)
        console.log(`Source:   ${plugin.source}`)
        console.log(`Status:   ${plugin.disabled ? "disabled" : "enabled"}`)
        if (Object.keys(plugin.options).length > 0) {
          console.log(`Options:  ${JSON.stringify(plugin.options, null, 2)}`)
        }
        console.log("")
      }
    } catch (err) {
      console.error((err as Error).message)
      process.exit(1)
    }
  })

program
  .command("disable")
  .description("Disable a plugin (removes from active config, preserves entry)")
  .argument("<name>", "Plugin name, source path, or pattern")
  .option("--global", "Disable from global config", false)
  .action((name: string, options: { global: boolean }) => {
    try {
      const { configPath, config } = getConfig(options.global)
      const result = disablePlugin(config, name)
      writeConfig(configPath, result.config)
      console.error(`Disabled: ${name}`)
      console.error("Restart opencode to apply the change.")
    } catch (err) {
      console.error((err as Error).message)
      process.exit(1)
    }
  })

program
  .command("enable")
  .description("Enable a previously disabled plugin")
  .argument("<name>", "Plugin name, source path, or pattern")
  .option("--global", "Enable from global config", false)
  .action((name: string, options: { global: boolean }) => {
    try {
      const { configPath, config } = getConfig(options.global)
      const result = enablePlugin(config, name)
      writeConfig(configPath, result.config)
      console.error(`Enabled: ${name}`)
      console.error("Restart opencode to apply the change.")
    } catch (err) {
      console.error((err as Error).message)
      process.exit(1)
    }
  })

program.parse()
