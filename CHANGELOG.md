# Changelog

## [0.1.3]

### Added

- `make test-package` target to test npm package in a simulated consumer project
- README badges: npm version, license, Socket.dev supply chain security

### Fixed

- Fix `constructor.name` minification breaking code lens and symbol resolution — `getRuleName()` now uses ANTLR4 `ruleIndex` + `ruleNames[]` instead of `constructor.name` which is mangled by esbuild
- Rename ESM bundles from `.js` to `.mjs` for Node 20 compatibility — `child_process.fork()` now correctly treats server and worker as ESM
- Move `@modelcontextprotocol/sdk` and `zod` from `dependencies` to `devDependencies` — they are fully bundled by esbuild and not needed at runtime
- Guard `postinstall` script with `[ -f tsconfig.json ]` so it only runs in dev checkout, not in consumer installs

## [0.1.2]

### Added

- Release checklist (`.github/RELEASE_CHECKLIST.md`)

### Fixed

- Remove unused `antlr4-c3` dependency from server package
- Fix client extension server path to use bundled `dist/` output (VSIX was broken)
- Fix `postinstall` script silently swallowing server install failures
- Sync versions across `server/package.json`, `client/package.json`, and MCP server to `0.1.1`
- Align Node engine requirement to `>=20` in `server/package.json` (was `>=18`)
- Update esbuild target from `node18` to `node20`
- Add `*.tgz` to `.gitignore` to prevent accidental commits
- Add explicit `require`/`default` conditions to `exports` field
- Remove redundant `activationEvents` (auto-generated from `contributes.languages`)

## [0.1.1]

### Fixed

- Update postinstall script to handle missing `client` directory gracefully
- Add npm trusted publishing (OIDC) support and normalize repository URL
- Remove accidentally committed `.tgz` archive
- Skip `npm version` in release workflow when git tag already matches `package.json`
- Drop Node 18 from CI matrix (Vite 7 requires Node 20+)

## [0.1.0]

### Added

- Initial LSP server with ANTLR4-based SysML v2 parser
- Diagnostics: syntax error reporting
- Document symbols: outline panel integration
- Hover: element kind, type, and documentation
- Go to definition: navigate to declarations
- Find references: locate all usages
- Code completion: keywords, snippets, symbol suggestions
- Semantic tokens: rich syntax highlighting
- Folding ranges: collapsible blocks and comments
- Rename: symbol rename with reference updates
- VS Code Language Client extension
- vitest unit tests
- GitHub Actions CI/CD
- Dev Container support
