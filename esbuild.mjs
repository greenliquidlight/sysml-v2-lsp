import * as esbuild from 'esbuild';

const isProduction = process.argv.includes('--production');
const isWatch = process.argv.includes('--watch');

/** @type {esbuild.BuildOptions} */
const baseConfig = {
    bundle: true,
    minify: isProduction,
    sourcemap: !isProduction,
    platform: 'node',
    target: 'node20',
    // Suppress default output — the ANTLR4 generated parser is ~1.4 MB,
    // which triggers esbuild's ⚠️ size indicator.  We print our own summary.
    logLevel: 'warning',
};

// Bundle the server (ESM — server/package.json has "type": "module")
// Output to dist/ so dev builds (tsc → server/out/) are not overwritten.
const serverBuild = esbuild.build({
    ...baseConfig,
    format: 'esm',
    entryPoints: ['server/src/server.ts'],
    outfile: 'dist/server/server.mjs',
    external: ['vscode'],
    banner: {
        // Provide createRequire for CJS dependencies bundled into ESM
        js: `import { createRequire } from 'node:module'; const require = createRequire(import.meta.url);`,
    },
});

// Bundle the worker thread (ESM — runs inside a Worker in the server process)
// This bundles the 44k-line ANTLR parser into a single file, eliminating
// module resolution overhead on worker startup.
const workerBuild = esbuild.build({
    ...baseConfig,
    format: 'esm',
    entryPoints: ['server/src/parser/parseWorker.ts'],
    outfile: 'dist/server/parser/parseWorker.mjs',
    banner: {
        js: `import { createRequire } from 'node:module'; const require = createRequire(import.meta.url);`,
    },
});

// Bundle the MCP server (ESM — standalone stdio-based MCP server)
const mcpBuild = esbuild.build({
    ...baseConfig,
    format: 'esm',
    entryPoints: ['server/src/mcpServer.ts'],
    outfile: 'dist/server/mcpServer.mjs',
    banner: {
        js: [
            `#!/usr/bin/env node`,
            `import { createRequire } from 'node:module'; const require = createRequire(import.meta.url);`,
        ].join('\n'),
    },
});

// Bundle the client (CJS — VS Code extension host expects CommonJS)
const clientBuild = esbuild.build({
    ...baseConfig,
    format: 'cjs',
    entryPoints: ['clients/vscode/src/extension.ts'],
    outfile: 'dist/client/extension.js',
    external: ['vscode'],
});

const results = await Promise.all([serverBuild, workerBuild, mcpBuild, clientBuild]);

// Print a clean build summary with file sizes
import { statSync } from 'node:fs';
const outputs = [
    'dist/server/server.mjs',
    'dist/server/parser/parseWorker.mjs',
    'dist/server/mcpServer.mjs',
    'dist/client/extension.js',
];
const fmt = (bytes) => bytes < 1024 * 1024
    ? `${(bytes / 1024).toFixed(1)}kb`
    : `${(bytes / (1024 * 1024)).toFixed(1)}mb`;
const pad = (s, n) => s + ' '.repeat(Math.max(0, n - s.length));
for (const f of outputs) {
    try {
        const size = statSync(f).size;
        console.log(`  ${pad(f, 44)} ${fmt(size)}`);
    } catch { /* skip if not generated */ }
}

const warnings = results.flatMap(r => r.warnings ?? []);
if (warnings.length) {
    console.log(`\n⚠️  ${warnings.length} warning(s)`);
}
console.log(isProduction ? '\n✅ Production build complete' : '\n✅ Build complete');
