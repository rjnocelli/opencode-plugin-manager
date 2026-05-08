import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import JSON5 from "json5";
export function findConfigPath() {
    const local = path.join(process.cwd(), "opencode.json");
    if (fs.existsSync(local))
        return local;
    const xdg = path.join(os.homedir(), ".config", "opencode", "opencode.json");
    if (fs.existsSync(xdg))
        return xdg;
    const home = path.join(os.homedir(), ".opencode.json");
    if (fs.existsSync(home))
        return home;
    throw new Error("opencode.json not found. Run this command from an opencode project or set up a global config.");
}
export function findGlobalConfigPath() {
    const xdg = path.join(os.homedir(), ".config", "opencode", "opencode.json");
    if (fs.existsSync(xdg))
        return xdg;
    const home = path.join(os.homedir(), ".opencode.json");
    if (fs.existsSync(home))
        return home;
    throw new Error("Global opencode.json not found.");
}
export function getStatePath() {
    return path.join(os.homedir(), ".config", "opencode", "opm-state.json");
}
export function readConfig(configPath) {
    const raw = fs.readFileSync(configPath, "utf-8");
    return JSON5.parse(raw);
}
export function writeConfig(configPath, config) {
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2) + "\n");
}
export function readOpmState() {
    const statePath = getStatePath();
    if (!fs.existsSync(statePath))
        return { disabledPlugins: {} };
    try {
        return JSON5.parse(fs.readFileSync(statePath, "utf-8"));
    }
    catch {
        return { disabledPlugins: {} };
    }
}
export function writeOpmState(state) {
    const statePath = getStatePath();
    const dir = path.dirname(statePath);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(statePath, JSON.stringify(state, null, 2) + "\n");
}
//# sourceMappingURL=config.js.map