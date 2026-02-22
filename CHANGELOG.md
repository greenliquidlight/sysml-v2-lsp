# Changelog

## [0.2.0]

### Added

- Custom LSP request (`sysml/model`): full semantic model with scoped queries
- MCP server (`sysml-mcp` CLI): 7 tools, 3 resources, 3 prompts for AI-assisted modelling
- Standard library: 94 bundled SysML v2 / KerML files from OMG release repo
- Inlay hints: ghost text for inferred types and supertypes
- Call hierarchy: action call graph navigation
- Type hierarchy: specialization chain navigation
- Signature help: parameter tooltips for action/calc invocations
- Code lens: reference counts above definitions
- Document links: clickable `import` statements
- Workspace symbols: cross-document symbol search
- Linked editing ranges: simultaneous rename of all occurrences
- Selection ranges: smart expand/shrink selection
- Code actions: quick-fix actions for diagnostics
- Formatting: document and range formatting
- Keyword validation: typo detection with "did you mean?" suggestions
- npm package: `sysml-v2-lsp` distributable for third-party extensions
- Python LSP client: reference JSON-RPC/stdio client
- Parse worker: background ANTLR parsing with DFA warm-up
- `make update-library`: fetch latest standard library from upstream
- `make package-server` / `make test-package`: npm tarball build and validation

### Changed

- Go-to-definition falls back to standard library for unresolved symbols
- Recursive type name extraction in symbol table
- Synthetic `start`/`done` nodes in activity diagram flows
- Element kind enum expanded to 55 kinds
- esbuild bundles four targets: server, worker, MCP server, VS Code client

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
