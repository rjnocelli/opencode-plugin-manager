import { execa } from "execa";
export async function installFromNpm(packageName) {
    try {
        await execa("npm", ["view", packageName, "version"], { stdio: "pipe" });
    }
    catch {
        throw new Error(`npm package not found: ${packageName}`);
    }
    try {
        await execa("npm", ["install", packageName], { stdio: "inherit" });
    }
    catch {
        // package might already be installed or user may have a different setup
    }
    return packageName;
}
//# sourceMappingURL=npm.js.map