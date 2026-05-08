# opencode Plugin Manager — Development Guide

A CLI tool to install, uninstall, and manage opencode plugins by editing `opencode.json`.

## How Plugins Work in opencode

Plugins are defined in `opencode.json` under the `"plugin"` array:

```json
{
  "plugin": [
    "opencode-sound-plugin",                              // bare string = npm package name
    ["~/dev/my-plugin/dist/index.js", { "key": "val" }],  // [path, options]
    ["https://example.com/plugin.mjs", {}]                 // URL also works
  ]
}
```

Each entry is one of:
- **`string`** — npm package name (opencode resolves it via `require()`)
- **`[string, object]`** — path/URL + plugin options object
- Path can be: local file, `file://` URL, npm package, or HTTP URL

The plugin's `dist/index.js` must `export default` a function matching `Plugin` type from `@opencode-ai/plugin`.

## CLI Design

### Name

`opm` (opencode plugin manager) or `oc-plugin`

### Commands

```
opm install <source> [options...]
opm uninstall <name>
opm list
opm info [name]
```

### `opm install <source> [key=val...]`

Installs a plugin by adding an entry to `opencode.json`.

**`<source>` can be:**
| Format | Example | Behavior |
|--------|---------|----------|
| npm package | `opencode-sound-plugin` | Store name as bare string (opencode resolves from node_modules) |
| local JS file | `./path/to/dist/index.js` | Resolve to absolute path, store as `file://` or absolute |
| git repo | `github:user/repo` or `https://github.com/user/repo` | Clone repo, run `bun install && bun run build`, store path |
| URL | `https://example.com/plugin.mjs` | Store URL directly |

**Options** (optional `key=value` pairs after source):
```
opm install ~/dev/my-plugin/dist/index.js botToken=abc chatId=123
```

Result in `opencode.json`:
```json
["/home/user/dev/my-plugin/dist/index.js", { "botToken": "abc", "chatId": "123" }]
```

**Flags:**
- `--save-dev` → store under a `pluginDev` field (future-proofing)
- `--global` → edit global `~/.config/opencode.json` instead of local

### `opm uninstall <name>`

Removes a plugin from `opencode.json`. Matches by:
1. The npm package name (e.g. `opencode-sound-plugin`)
2. The filename stem (e.g. `telegram` matches `opencode-telegram-plugin`)
3. Full path

```
opm uninstall opencode-sound-plugin
opm uninstall telegram
```

### `opm list`

Lists all installed plugins with their source and options:

```
$ opm list
telegram     /home/user/dev/opencode-telegram-plugin/dist/index.js  botToken=*** chatId=*** message="..."
sound        opencode-sound-plugin                                  (no options)
```

### `opm info [name]`

Shows details about installed plugins or available packages on npm.

## Implementation Plan

### Phase 1 — Core (MVP)

1. **Locate `opencode.json`**
   - Search: `./opencode.json` → `~/.config/opencode/opencode.json` → `~/.opencode.json`
   - Parse with comments support (JSON5 or strip comments first)

2. **Parse and modify the plugin array**
   - Read `opencode.json` preserving comments (use a library like `strip-json-comments` + manual reconstruction, or `json5`)
   - Add/remove entries from the `"plugin"` array
   - Write back

3. **Install command**
   - Normalize the source path
   - Parse `key=value` options into the options object
   - Append to `"plugin"` array

4. **Uninstall command**
   - Match by name/path
   - Remove from `"plugin"` array

### Phase 2 — Git/URL Support

5. **Clone from git repos**
   - Parse `github:user/repo`, `git@github.com:user/repo.git`, HTTP URLs
   - `git clone --depth 1` into `~/.config/opencode/plugins/<name>`
   - Run `bun install && bun run build` in the cloned directory
   - Reference the built `dist/index.js`

6. **Download from URLs**
   - Fetch `.mjs` files and store in plugins directory

### Phase 3 — NPM Support

7. **Resolve npm packages**
   - Use `npm pack --dry-run` or `require.resolve()` to find the package
   - If not installed, run `npm install` in the project

### Phase 4 — Polish

8. **List with metadata**
   - Show plugin name (from package.json or filename), source, and options

9. **Update command**
   - Re-pull git repos, reinstall npm packages

10. **Init command**
    - Scaffold a new plugin project (copy template files)

## Key Implementation Details

### Finding `opencode.json`

```typescript
function findConfig(): string {
  const local = path.join(process.cwd(), "opencode.json")
  if (fs.existsSync(local)) return local

  const xdg = path.join(os.homedir(), ".config", "opencode", "opencode.json")
  if (fs.existsSync(xdg)) return xdg

  const home = path.join(os.homedir(), ".opencode.json")
  if (fs.existsSync(home)) return home

  throw new Error("opencode.json not found")
}
```

### Parsing and Writing

opencode.json contains JavaScript-style comments. Use `json5` or strip them:

```typescript
import JSON5 from "json5"

function readConfig(path: string): Config {
  const raw = fs.readFileSync(path, "utf-8")
  return JSON5.parse(raw)
}

function writeConfig(path: string, config: Config): void {
  fs.writeFileSync(path, JSON.stringify(config, null, 2) + "\n")
}
```

> Note: `JSON.stringify` will strip comments. For a v1, this is acceptable — users rarely hand-edit the plugin section.

### Plugin array manipulation

```typescript
type PluginEntry = string | [string, Record<string, unknown>]

function installPlugin(config: Config, source: string, options: Record<string, unknown> = {}): Config {
  const entry: PluginEntry = Object.keys(options).length > 0 ? [source, options] : source
  return {
    ...config,
    plugin: [...(config.plugin || []), entry],
  }
}

function uninstallPlugin(config: Config, name: string): Config {
  return {
    ...config,
    plugin: (config.plugin || []).filter((entry) => {
      const src = typeof entry === "string" ? entry : entry[0]
      return !matchesPlugin(src, name)
    }),
  }
}

function matchesPlugin(source: string, name: string): boolean {
  const basename = path.basename(source).replace(/\.\w+$/, "")
  const pkgName = source.replace(/^opencode-/, "")
  return (
    source === name ||
    basename === name ||
    basename === `opencode-${name}-plugin` ||
    pkgName === name
  )
}
```

### Git clone flow

```typescript
async function installFromGit(url: string, options: Record<string, unknown>): Promise<[string, Record<string, unknown>]> {
  const name = extractPluginName(url)
  const targetDir = path.join(os.homedir(), ".config", "opencode", "plugins", name)

  if (fs.existsSync(targetDir)) {
    console.log(`Already installed at ${targetDir}, pulling latest...`)
    await $`git -C ${targetDir} pull`
  } else {
    await $`git clone --depth 1 ${url} ${targetDir}`
  }

  await $`cd ${targetDir} && bun install && bun run build`

  const entryPath = path.join(targetDir, "dist", "index.js")
  return [entryPath, options]
}
```

### NPM install flow

```typescript
async function installFromNpm(packageName: string, options: Record<string, unknown>): Promise<[string, Record<string, unknown>]> {
  // Try to resolve; if not found, install as dependency
  try {
    require.resolve(packageName)
  } catch {
    console.log(`Installing ${packageName}...`)
    await $`npm install ${packageName}`
  }
  return [packageName, options]
}
```

## Project Structure for the CLI Tool

```
opencode-plugin-manager/
├── package.json
├── tsconfig.json
├── README.md
├── src/
│   ├── index.ts          # CLI entry point (parse args, dispatch)
│   ├── config.ts         # find, read, write opencode.json
│   ├── plugin.ts         # install/uninstall/list logic
│   ├── installers/
│   │   ├── local.ts      # local path resolution
│   │   ├── git.ts        # git clone flow
│   │   ├── npm.ts        # npm package resolution
│   │   └── url.ts        # direct URL download
│   └── utils.ts          # path matching, name extraction
└── test/
    ├── config.test.ts
    ├── plugin.test.ts
    └── fixtures/
        └── opencode.json  # test config files
```

## Testing Strategy

- Unit tests for config parsing/manipulation (use fixture `opencode.json` files)
- Unit tests for plugin name matching
- Integration tests for local install (copy a test plugin, install it)
- Git install tests can use local bare repos for speed
- No real npm publish needed — test with `npm link` or local tarballs

## Future Ideas

- **`opm search <term>`** — search npm for `opencode-*-plugin` packages
- **`opm init <name>`** — scaffold a new plugin repo from a template
- **`opm update`** — update all installed plugins
- **`opm disable/enable <name>`** — comment out entries instead of removing
- **Plugin registry** — a curated list at `opencode.ai/plugins`

## Reference: opencode.json Plugin Schema

From `https://opencode.ai/config.json`:

```json
"plugin": {
  "type": "array",
  "items": {
    "anyOf": [
      { "type": "string" },
      {
        "type": "array",
        "prefixItems": [
          { "type": "string" },
          {
            "type": "object",
            "propertyNames": { "type": "string" },
            "additionalProperties": {}
          }
        ]
      }
    ]
  }
}
```

Plugin source formats opencode resolves:
- `~/path/to/plugin.js` — local file
- `file:///absolute/path/plugin.js` — file URL
- `opencode-sound-plugin` — npm package (resolved via `require()`)
- Any HTTP URL — fetched directly
