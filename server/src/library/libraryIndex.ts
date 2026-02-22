import { closeSync, existsSync, openSync, readdirSync, readSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

/**
 * Index of SysML v2 standard library packages.
 *
 * Maps package names (e.g. "ISQ", "SI", "ScalarValues") to their
 * file URIs on disk.  Built by scanning the bundled `sysml.library`
 * directory (or a user-specified custom path) for `.sysml` / `.kerml`
 * files and extracting the package declaration from each file.
 */

/**
 * Regex to extract the package name from a library file's first
 * declaration line.  Handles:
 *   standard library package ISQ {
 *   standard library package <USCU> USCustomaryUnits {
 *   package Foo {
 */
const PACKAGE_DECL_RE = /^(?:standard\s+)?(?:library\s+)?package\s+(?:<\w+>\s+)?(\w+)/m;

/** package name → file URI (e.g. "file:///.../.sysml") */
let index: Map<string, string> | undefined;

/**
 * Build the library index by scanning a directory tree for
 * `.sysml` / `.kerml` files.
 */
function buildIndex(libRoot: string): Map<string, string> {
    const map = new Map<string, string>();

    const walk = (dir: string): void => {
        let entries: string[];
        try { entries = readdirSync(dir); }
        catch { return; }

        for (const name of entries) {
            const full = join(dir, name);
            try {
                const stat = statSync(full);
                if (stat.isDirectory()) {
                    walk(full);
                } else if (name.endsWith('.sysml') || name.endsWith('.kerml')) {
                    const fd = openSync(full, 'r');
                    const buf = Buffer.alloc(512);
                    readSync(fd, buf, 0, 512, 0);
                    closeSync(fd);

                    const head = buf.toString('utf8');
                    const m = PACKAGE_DECL_RE.exec(head);
                    if (m) {
                        map.set(m[1], pathToFileURL(full).href);
                    }
                }
            } catch { /* skip unreadable files */ }
        }
    };

    walk(libRoot);
    return map;
}

/**
 * Initialise the library index.
 *
 * @param serverDir  `__dirname` of the running server module
 *                   (typically `dist/server/` in the npm package).
 * @param customPath Optional user-configured library path override
 *                   (`sysml.library.path` setting).
 * @returns The number of packages indexed.
 */
export function initLibraryIndex(serverDir: string, customPath?: string): number {
    let libRoot: string | undefined;

    if (customPath && customPath.trim()) {
        const abs = resolve(customPath);
        if (existsSync(abs)) {
            libRoot = abs;
        }
    }

    if (!libRoot) {
        // Default: bundled library relative to the server module.
        // Server lives at <pkg>/dist/server/server.mjs →
        // library is at <pkg>/sysml.library/
        const bundled = resolve(serverDir, '..', '..', 'sysml.library');
        if (existsSync(bundled)) {
            libRoot = bundled;
        }
    }

    if (!libRoot) {
        index = new Map();
        return 0;
    }

    index = buildIndex(libRoot);
    return index.size;
}

/**
 * Look up a library package by name.
 * Handles qualified names like "ISQ::TorqueValue" — resolves just
 * the first segment (the package name).
 *
 * @returns The file URI of the library file, or `undefined`.
 */
export function resolveLibraryPackage(name: string): string | undefined {
    if (!index) return undefined;
    const pkg = name.split('::')[0];
    return index.get(pkg);
}

/**
 * Get all indexed package names (for diagnostics / completions).
 */
export function getLibraryPackageNames(): string[] {
    return index ? Array.from(index.keys()) : [];
}
