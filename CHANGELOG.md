# Changelog

## [0.1.4]

### Added

- Extract MCP resource and prompt handler logic into testable `mcpCore.ts` module — 3 resource handlers (element kinds, keywords, grammar overview) and 3 prompt handlers (review SysML, explain element, generate SysML)
- `constraint` grammar rules: `ConstraintDefinition`, `ConstraintUsage`, `RequirementConstraintMember`, `assert constraint`
- 9 new unit tests for MCP resources and prompts (101 total tests, up from 92)
- Constraint-related unit tests

### Fixed

- Fix false positive diagnostics on qualified names with `::` (e.g., `toaster::maxTemp`) — add `COLON_COLON` to next-token skip list in `parseWorker.ts`
- Fix identifiers after `actor`, `stakeholder`, `subject`, `variant`, `ref`, `snapshot`, `timeslice` incorrectly flagged as keyword typos — add to `NAME_PRECEDING_KEYWORDS` in both validators
- Fix false positive keyword typo diagnostics on dot-chain and expression-position identifiers (e.g., `transportPassenger.driver`) — skip identifiers preceded by `.`, `=`, `:`, `::`, `:>`, `:>>`
- Remove unused `parseAndBuild` import in `mcpServer.ts` after refactoring

### Changed

- Slim VS Code dev extension to lightweight harness — move TextMate grammar and snippets to separate `VSCode_SysML_Extension` repo
- Simplify `language-configuration.json` to minimal comments and brackets for dev use

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
