import { describe, it, expect } from "vitest"
import JSON5 from "json5"
import type { OpenCodeConfig } from "../src/types.js"
import { installPlugin, uninstallPlugin } from "../src/plugin.js"

const baseConfig: OpenCodeConfig = {
  plugin: [
    "opencode-sound-plugin",
    ["/home/user/dev/my-plugin/dist/index.js", { botToken: "abc", chatId: "123" }],
  ],
}

describe("plugin install", () => {
  it("adds a bare string entry", () => {
    const result = installPlugin(baseConfig, "opencode-telegram-plugin")
    expect(result.plugin).toHaveLength(3)
    expect(result.plugin![2]).toBe("opencode-telegram-plugin")
  })

  it("adds a tuple entry with options", () => {
    const result = installPlugin(baseConfig, "./local-plugin.js", { key: "val" })
    expect(result.plugin).toHaveLength(3)
    expect(result.plugin![2]).toEqual(["./local-plugin.js", { key: "val" }])
  })

  it("adds bare string when options are empty", () => {
    const result = installPlugin(baseConfig, "bare-package", {})
    expect(result.plugin![2]).toBe("bare-package")
  })
})

describe("plugin uninstall", () => {
  it("removes a plugin by exact name", () => {
    const result = uninstallPlugin(baseConfig, "opencode-sound-plugin")
    expect(result.config.plugin).toHaveLength(1)
    expect(result.removed).toBe("opencode-sound-plugin")
  })

  it("removes a plugin by short name", () => {
    const result = uninstallPlugin(baseConfig, "sound")
    expect(result.config.plugin).toHaveLength(1)
  })

  it("removes a plugin by path basename", () => {
    const result = uninstallPlugin(baseConfig, "index.js")
    expect(result.config.plugin).toHaveLength(1)
  })

  it("throws for unknown plugin", () => {
    expect(() => uninstallPlugin(baseConfig, "nonexistent")).toThrow(
      "Plugin not found: nonexistent",
    )
  })
})

describe("JSON5 parsing", () => {
  it("parses opencode.json with comments", () => {
    const raw = `{
      // comment
      "plugin": ["test"]
    }`
    const config = JSON5.parse(raw)
    expect(config.plugin).toEqual(["test"])
  })
})
