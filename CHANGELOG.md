# Changelog

## [0.1.7]

### Added

- Comprehensive keyword validator tests — 14 new parser tests covering all expanded `NAME_PRECEDING_KEYWORDS` categories: KerML element keywords, visibility/prefix modifiers, action control nodes, reference-preceding keywords, relationship keywords, directionality, succession/flow, annotation/membership, `message`/`transition`, colon/specialization punctuation, and `:=` assignment skip logic
- `findTextReferences()` unit tests — 6 new tests covering whole-word matching, partial-word exclusion, line-comment skipping, block-comment skipping, empty results, and regex special character safety
- Cross-file references test — verifies text-based reference scanning finds usages across multiple documents
- `includeDeclaration` filtering test — verifies references provider correctly excludes the declaration when `includeDeclaration: false`
- Reference deduplication test — verifies no duplicate locations are returned
- Cross-file CodeLens test — verifies reference counts include usages from other documents

### Fixed

- Expand `NAME_PRECEDING_KEYWORDS` from ~25 to ~120 tokens — identifiers after KerML keywords (`type`, `classifier`, `datatype`, `class`, `struct`, `assoc`, `metaclass`, etc.), action control nodes (`fork`, `join`, `merge`, `decide`), relationship keywords (`redefines`, `subsets`, `specializes`, `conjugates`, `chains`, etc.), KerML relationship elements (`specialization`, `conjugation`, `disjoining`, `inverting`, etc.), requirement/state body keywords (`assume`, `require`, `frame`, `objective`, `entry`, `do`, `exit`), and punctuation tokens (`:`, `:>`, `:>>`, `::`, `::>`, `>`, `=>`, `~`, `,`, `#`) are no longer falsely flagged as keyword typos
- Fix skip-punctuation logic in keyword validator — replace `:`, `::`, `:>`, `:>>` (now in `NAME_PRECEDING_KEYWORDS`) with `DOT`, `=`, `:=` as the only "value/path" skip tokens
- Add `MESSAGE` and `TRANSITION` to SysML definition/usage element keywords in `NAME_PRECEDING_KEYWORDS`

## [0.1.6]

### Fixed

- Fix keyword validator silently ignoring extreme typos (e.g., `pasddsafart def Vehicle`) — identifiers in keyword positions are now flagged even when no close keyword match exists (Levenshtein distance > 2), with a generic "Unexpected identifier" message instead of requiring a "Did you mean?" suggestion
- Fix `flagUnknownIdentifiers` incorrectly skipping identifiers followed by `def` — valid keywords before `def` (`part`, `action`, etc.) have their own token types, so an IDENTIFIER before `def` is always invalid
- Fix Python LSP client missing diagnostics on first run — `drain_notifications` used a fixed 2-second timeout, but DFA warm-up on first server start takes ~15-20s. Added `drain_until_diagnostics()` which waits up to 30s and stops as soon as diagnostics arrive

## [0.1.5]

### Added

- Python LSP client example in `clients/python/` — zero-dependency script demonstrating how to drive the SysML v2 language server from Python over JSON-RPC/stdio, using the same server as VS Code
- `sysml.inlayHints.enabled` VS Code setting — allows users to toggle inlay hints on/off (default: true). Server-side gating returns empty results when disabled
- Extension Development Host settings (`examples/.vscode/settings.json`) — disables inlay hints during F5 testing
- Code completion provider tests — ensures keyword completions, snippet insert text, and resolve are covered
- Call hierarchy typed-usage detection — `action x : TypeDef`, `state x : TypeDef`, and `calc x : TypeDef` composition patterns are now recognised as outgoing/incoming calls, not just explicit `perform`/`include`/`accept` keywords

### Changed

- Reorganise folder structure: `client/` → `clients/vscode/`, Python client at `clients/python/`
- Call hierarchy provider no longer depends on `TextDocuments` — uses `DocumentManager` for all text access, simplifying the architecture
- `DocumentManager.getUris()` now returns all open documents (from `TextDocuments.all()`), not just cached ones — fixes providers that scan across documents (call hierarchy, references, code lens)
- Suppress esbuild size warnings — custom build summary replaces default output to avoid misleading ⚠️ indicators on the expected 1.4 MB ANTLR parser bundle

### Fixed

- Fix `end` keyword in connection/interface definitions causing false positive diagnostics — identifiers after `end` (e.g., `end source : PowerPort;`) were incorrectly flagged as keyword typos
- Fix `in`/`out`/`inout` direction keywords causing false positive diagnostics — identifiers after `in`, `out`, `inout` (e.g., `out arrived : Boolean`) were incorrectly flagged as keyword typos
- Fix Find References only returning declarations — added text-based reference scanning (`findTextReferences`) across all open documents to find usage-site references (e.g., `action adjustWheels : AdjustWheelAngle`)
- Fix CodeLens reference counts only counting declarations — now uses text-based scanning consistent with Find References
- Remove redundant `activationEvents` from `package.json` — VS Code auto-generates from `contributes.languages`
- Remove unnecessary `sysml.inlayHints.enabled` from dev workspace settings (only needed in Extension Development Host)

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
