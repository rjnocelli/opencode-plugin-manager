export type PluginEntry = string | [string, Record<string, unknown>];
export interface OpenCodeConfig {
    plugin?: PluginEntry[];
    disabledPlugins?: PluginEntry[];
    [key: string]: unknown;
}
export interface OpmState {
    disabledPlugins: Record<string, PluginEntry>;
}
export interface PluginInfo {
    name: string;
    source: string;
    options: Record<string, unknown>;
    disabled: boolean;
}
//# sourceMappingURL=types.d.ts.map