import { describe, it, expect } from "vitest"
import { matchesPlugin, extractPluginName } from "../src/utils.js"

describe("matchesPlugin", () => {
  it("matches exact source", () => {
    expect(matchesPlugin("opencode-sound-plugin", "opencode-sound-plugin")).toBe(true)
  })

  it("matches basename", () => {
    expect(matchesPlugin("/path/to/telegram.js", "telegram")).toBe(true)
  })

  it("matches opencode- prefixed basename", () => {
    expect(matchesPlugin("opencode-telegram-plugin", "telegram")).toBe(true)
  })

  it("does not match unrelated name", () => {
    expect(matchesPlugin("opencode-sound-plugin", "telegram")).toBe(false)
  })

  it("matches with -plugin suffix", () => {
    expect(matchesPlugin("/path/to/my-plugin/dist/index.js", "my-plugin")).toBe(true)
  })
})

describe("extractPluginName", () => {
  it("extracts name from npm package", () => {
    expect(extractPluginName("opencode-sound-plugin")).toBe("sound")
  })

  it("extracts name from file path", () => {
    expect(extractPluginName("/home/user/telegram/dist/index.js")).toBe("telegram")
  })

  it("extracts name from URL", () => {
    expect(extractPluginName("https://example.com/plugin.mjs")).toBe("plugin")
  })
})
