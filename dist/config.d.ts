import type { OpenCodeConfig, OpmState } from "./types.js";
export declare function findConfigPath(): string;
export declare function findGlobalConfigPath(): string;
export declare function getStatePath(): string;
export declare function readConfig(configPath: string): OpenCodeConfig;
export declare function writeConfig(configPath: string, config: OpenCodeConfig): void;
export declare function readOpmState(): OpmState;
export declare function writeOpmState(state: OpmState): void;
//# sourceMappingURL=config.d.ts.map