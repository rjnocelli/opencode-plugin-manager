import type { OpenCodeConfig, PluginEntry, PluginInfo, OpmState } from "./types.js";
export declare function resolveSource(source: string): Promise<string>;
export declare function isUrlOrGitSource(source: string): boolean;
export declare function installPlugin(config: OpenCodeConfig, source: string, options?: Record<string, unknown>): OpenCodeConfig;
export declare function uninstallPlugin(config: OpenCodeConfig, name: string): {
    config: OpenCodeConfig;
    removed?: PluginEntry;
};
export declare function listPlugins(config: OpenCodeConfig): PluginInfo[];
export declare function disablePlugin(config: OpenCodeConfig, name: string): {
    config: OpenCodeConfig;
    state: OpmState;
};
export declare function enablePlugin(config: OpenCodeConfig, name: string): {
    config: OpenCodeConfig;
    state: OpmState;
};
export declare function getPluginInfo(config: OpenCodeConfig, name?: string): PluginInfo[];
//# sourceMappingURL=plugin.d.ts.map