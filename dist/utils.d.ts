import type { PluginEntry } from "./types.js";
export declare function getSourceFromEntry(entry: PluginEntry): string;
export declare function getOptionsFromEntry(entry: PluginEntry): Record<string, unknown>;
export declare function extractPluginName(source: string): string;
export declare function matchesPlugin(source: string, nameOrPattern: string): boolean;
export declare function findMatchingEntry(entries: PluginEntry[], nameOrPattern: string): PluginEntry | undefined;
export declare function findMatchingIndex(entries: PluginEntry[], nameOrPattern: string): number;
export declare function formatEntry(entry: PluginEntry): string;
export declare function normalizePath(p: string): string;
//# sourceMappingURL=utils.d.ts.map