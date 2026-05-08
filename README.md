# opencode-plugin-manager

A CLI tool to install, uninstall, enable, disable, and manage [opencode](https://opencode.ai) plugins by editing your `opencode.json` config.

```
opm install <source> [key=val...]
opm uninstall <name>
opm list
opm info [name]
opm disable <name>
opm enable <name>
```

---

## Prerequisites

- **Node.js 18+** — `opm` is a Node.js CLI tool
- **opencode** — you need an existing opencode installation with an `opencode.json` config file
- **git** (optional) — only needed for installing plugins from git repositories
- **bun** (optional) — only needed if a git-sourced plugin needs to be built

---

## Install

### From npm (recommended)

```bash
npm install -g opencode-plugin-manager
```

After global install, `opm` will be on your PATH.

### From source

```bash
git clone https://github.com/your-username/opencode-plugin-manager.git
cd opencode-plugin-manager
npm install
npm run build
node dist/index.js --help
```

You can alias it or link it:

```bash
npm link
opm --help
```

---

## Quick start

```bash
# List currently installed plugins
opm list

# Install an npm plugin
opm install opencode-sound-plugin

# Install a local plugin with options
opm install ./my-plugin/dist/index.js botToken=abc chatId=123

# Install from a git repository
opm install github:user/opencode-telegram-plugin

# Show plugin details
opm info sound

# Disable a plugin (without uninstalling)
opm disable sound

# Re-enable it later
opm enable sound

# Permanently remove a plugin
opm uninstall sound
```

---

## Commands

### `opm install <source> [key=val...]`

Adds a plugin to the `"plugin"` array in `opencode.json`.

**`<source>` can be:**

| Format | Example | Notes |
|--------|---------|-------|
| npm package name | `opencode-sound-plugin` | opencode resolves via `require()` |
| local JavaScript file | `./path/to/plugin.js` | Resolved to an absolute path |
| local directory | `~/dev/my-plugin` | Looks for `dist/index.js` inside |
| git repo (HTTPS) | `https://github.com/user/repo.git` | Cloned to `~/.config/opencode/plugins/<name>` |
| git repo (shorthand) | `github:user/repo` or `gh:user/repo` | Same as HTTPS clone |
| HTTP(S) URL | `https://example.com/plugin.mjs` | Downloaded to plugins directory |

**Options** are passed as `key=value` pairs after the source:

```bash
opm install ./telegram-plugin botToken=abc123 chatId=456
```

This stores the plugin as:

```json
["/absolute/path/to/telegram-plugin", { "botToken": "abc123", "chatId": "456" }]
```

### `opm uninstall <name>`

Removes a plugin from the `"plugin"` array. Matches by:

- Exact npm package name (e.g. `opencode-sound-plugin`)
- Short name (e.g. `sound` matches `opencode-sound-plugin`)
- File name or path segment (e.g. `telegram` matches `/path/to/telegram-plugin/dist/index.js`)
- The `-plugin` suffix form (e.g. `my-plugin` matches `opencode-my-plugin`)

```bash
opm uninstall opencode-sound-plugin
opm uninstall sound
opm uninstall telegram
```

### `opm list`

Lists all installed plugins with their source path and enabled/disabled status.

```
$ opm list
NAME       SOURCE
sound      opencode-sound-plugin
telegram   /home/user/dev/telegram-plugin/dist/index.js   (disabled)
```

### `opm info [name]`

Shows detailed information about a specific plugin or all plugins if no name is given.

```
$ opm info telegram
Name:     telegram
Source:   /home/user/dev/telegram-plugin/dist/index.js
Status:   enabled
Options:  {
  "botToken": "***",
  "chatId": "123"
}
```

### `opm disable <name>`

Disables a plugin by removing it from the `"plugin"` array and saving its entry to `~/.config/opencode/opm-state.json`. The plugin is preserved and can be re-enabled later.

```bash
opm disable sound
# Restart opencode to apply
```

### `opm enable <name>`

Restores a previously disabled plugin back into the `"plugin"` array.

```bash
opm enable sound
# Restart opencode to apply
```

### Global flag

All commands accept `--global` to operate on the global config instead of the project-local one:

```bash
opm list --global
opm install opencode-sound-plugin --global
opm disable sound --global
```

---

## Config file search order

`opm` finds your `opencode.json` by checking these locations in order:

1. `./opencode.json` — project-level config
2. `~/.config/opencode/opencode.json` — XDG global config
3. `~/.opencode.json` — legacy home config

The first one found is used. Use `--global` to force use of the global config.

---

## How disable/enable works

Since opencode does not natively support a `disabled_plugins` field in its config, `opm` uses a two-file approach:

- **`opencode.json`** — The `"plugin"` array only contains **active** plugins
- **`~/.config/opencode/opm-state.json`** — Stores disabled plugin entries keyed by name

On `disable`, the entry is moved from the config to the state file. On `enable`, it is restored. This keeps the config clean while preserving your disabled plugins.

---

## Project structure

```
src/
├── index.ts           # CLI entry point (commander)
├── types.ts           # Shared TypeScript types
├── config.ts          # Find, read, write opencode.json and opm state
├── plugin.ts          # Install, uninstall, list, enable, disable logic
├── utils.ts           # Path matching, name extraction helpers
└── installers/
    ├── local.ts       # Resolves local file/directory paths
    ├── git.ts         # Clones git repos and builds them
    ├── npm.ts         # Validates npm packages exist
    └── url.ts         # Downloads plugins from HTTP URLs
test/
├── config.test.ts     # Tests for config manipulation
├── plugin.test.ts     # Tests for plugin matching and extraction
└── fixtures/
    └── opencode.json  # Sample config with comments
```

---

## Development

```bash
# Install dependencies
npm install

# Build
npm run build

# Watch mode
npm run dev

# Run tests
npm test

# Run tests in watch mode
npm run test:watch
```

---

## Limitations

- **Comments are stripped** — `opm` uses `JSON5` for reading (supports comments) but writes with `JSON.stringify`, so any hand-written comments in `opencode.json` will be lost. This mainly affects the `"plugin"` section.
- **Restart required** — opencode loads plugins at startup. You need to restart it after `install`, `uninstall`, `disable`, or `enable`.
- **npm packages** — `opm` validates that the npm package exists but does not install it as a project dependency. opencode handles npm resolution on its own at startup.

---

## License

MIT
