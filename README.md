# SysML v2 Language Server

[![npm version](https://img.shields.io/npm/v/sysml-v2-lsp)](https://www.npmjs.com/package/sysml-v2-lsp)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Socket Badge](https://socket.dev/api/badge/npm/package/sysml-v2-lsp)](https://socket.dev/npm/package/sysml-v2-lsp)

A [Language Server Protocol (LSP)](https://microsoft.github.io/language-server-protocol/) with [Model Context Protocol](https://modelcontextprotocol.io/) implementation for [SysML v2](https://www.omgsysml.org/SysML-2.htm), providing rich editing, navigation, and code intelligence for LSP-compatible editors.

Powered by the ANTLR4 grammar from [daltskin/sysml-v2-grammar](https://github.com/daltskin/sysml-v2-grammar).

> **Works with:** VS Code, Neovim, Emacs, Sublime Text, Helix, and any editor that supports the Language Server Protocol.

---

## Language Server Features

The language server runs as a separate process and communicates over LSP — these features are available in **any** compatible editor.

### Editing & Navigation

| Feature              | Description                                                            |
| -------------------- | ---------------------------------------------------------------------- |
| **Diagnostics**      | Syntax errors, unknown identifiers, keyword typos with severity levels |
| **Code Completion**  | Keywords, snippets, and symbol suggestions with documentation          |
| **Signature Help**   | Parameter tooltips when invoking `action def` / `calc def`             |
| **Hover**            | Element kind, type, qualified name, and documentation                  |
| **Go to Definition** | Jump to a symbol's declaration                                         |
| **Find References**  | Find all usages of a symbol across open files                          |
| **Rename Symbol**    | Rename a symbol and update all references                              |
| **Linked Editing**   | Edit a name and all same-scope occurrences update simultaneously       |
| **Document Links**   | Clickable `import` paths — jump to the imported namespace              |

### Code Intelligence

| Feature               | Description                                                              |
| --------------------- | ------------------------------------------------------------------------ |
| **CodeLens**          | Reference counts shown above each definition                             |
| **Inlay Hints**       | Ghost text showing inferred types (`: Type`) and supertypes (`:> Super`) |
| **Type Hierarchy**    | Navigate specialization chains — supertypes and subtypes                 |
| **Call Hierarchy**    | Navigate `perform`/`include` chains between actions                      |
| **Workspace Symbols** | Fuzzy search for any definition across all open files                    |

### Presentation & Formatting

| Feature              | Description                                                                    |
| -------------------- | ------------------------------------------------------------------------------ |
| **Semantic Tokens**  | Rich, context-aware syntax highlighting (definitions, usages, keywords, types) |
| **Document Symbols** | Outline / breadcrumbs showing SysML model structure                            |
| **Folding Ranges**   | Collapsible `{ }` blocks and comment regions                                   |
| **Selection Ranges** | Smart expand/shrink selection (word → line → block → enclosing block)          |
| **Quick Fix**        | Fix keyword typos (e.g., `paart` → `part`)                                     |
| **Formatting**       | Auto-indent, normalize braces, trim trailing whitespace                        |

### Parser

- ANTLR4-based parser via [antlr4ng](https://github.com/mike-lischke/antlr4ng)
- SLL/LL dual-mode strategy — fast path with automatic fallback
- DFA warm-up for near-instant first-parse performance
- Worker thread architecture for non-blocking document processing
- Symbol table with qualified name resolution and cross-file references

---

## MCP Server (AI Integration)

A standalone [Model Context Protocol](https://modelcontextprotocol.io/) server that lets AI assistants parse, validate, and query SysML v2 models. Runs independently of any editor.

### Tools

| Tool              | Description                                            |
| ----------------- | ------------------------------------------------------ |
| `parse`           | Parse SysML source, build symbol table, return summary |
| `validate`        | Check syntax and return errors                         |
| `getSymbols`      | List symbols (filter by kind, URI, definitions/usages) |
| `getDefinition`   | Look up a symbol by name or qualified name             |
| `getReferences`   | Find all references to a symbol                        |
| `getHierarchy`    | Get parent–child containment structure                 |
| `getModelSummary` | Counts, kinds, and loaded documents                    |

### Resources

| URI                        | Description                  |
| -------------------------- | ---------------------------- |
| `sysml://element-kinds`    | All recognised element kinds |
| `sysml://keywords`         | Complete keyword list        |
| `sysml://grammar-overview` | Language structure reference |

### Prompts

| Prompt            | Description                          |
| ----------------- | ------------------------------------ |
| `review-sysml`    | Review a SysML model for correctness |
| `explain-element` | Explain a SysML element kind         |
| `generate-sysml`  | Generate SysML from a description    |

### MCP Setup

**VS Code / GitHub Copilot** — The workspace includes `.vscode/mcp.json`, so the MCP server is automatically available after building.

**Claude Desktop** — Add to `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "sysml-v2": {
      "command": "node",
      "args": ["/path/to/sysml-v2-lsp/dist/server/mcpServer.mjs"]
    }
  }
}
```

**Any MCP client** — Run the server directly via stdio:

```bash
npx sysml-v2-lsp   # after npm install -g sysml-v2-lsp
# or
node dist/server/mcpServer.mjs
```

### Quick Test Examples

Once the MCP server is connected, try these prompts:

> Parse this: `package Demo { part def Vehicle { attribute speed : Real; } part car : Vehicle; }`

> Validate this: `part def Broken { attribute x :`

> What symbols are in the model?

> Find the definition of Vehicle

> Show the hierarchy of car

---

## VS Code Dev Extension

A lightweight VS Code extension is included for **development and debugging** of the language server. It registers the `sysml` language ID, starts the LSP client, and provides a restart command — nothing more.

For the full VS Code experience (TextMate grammar, snippets, language configuration, visualization), see [daltskin/VSCode_SysML_Extension](https://github.com/daltskin/VSCode_SysML_Extension).

| Feature                  | Description                                                                    |
| ------------------------ | ------------------------------------------------------------------------------ |
| **Language Registration**| Registers `.sysml` / `.kerml` file types                                       |
| **LSP Client**           | Starts and manages the language server process                                 |
| **Restart Command**      | `SysML: Restart Language Server` command                                       |
| **Dev Container**        | Open in GitHub Codespaces or VS Code Dev Containers — everything pre-installed |
| **Debug Configurations** | "Client + Server" compound launch for simultaneous debugging                   |
| **Example Files**        | `examples/` folder with camera, toaster, and vehicle models                    |

---

## Getting Started

### Using the VS Code Extension

Open in GitHub Codespaces or Dev Containers (recommended), or manually:

```bash
npm install
npm run build
# Press F5 to launch the Extension Development Host
```

### Using the LSP with Other Editors

Build the server, then point your editor's LSP client at it:

```bash
npm install && npm run build
# Server binary: dist/server/server.mjs
# Start with: node dist/server/server.mjs --stdio
```

**Neovim** (via [nvim-lspconfig](https://github.com/neovim/nvim-lspconfig)):

```lua
vim.lsp.start({
  name = 'sysml',
  cmd = { 'node', '/path/to/sysml-v2-lsp/dist/server/server.mjs', '--stdio' },
  filetypes = { 'sysml' },
})
```

**Emacs** (via [lsp-mode](https://github.com/emacs-lsp/lsp-mode)):

```elisp
(lsp-register-client
  (make-lsp-client
    :new-connection (lsp-stdio-connection
                     '("node" "/path/to/sysml-v2-lsp/dist/server/server.mjs" "--stdio"))
    :activation-fn (lsp-activate-on "sysml")
    :server-id 'sysml-lsp))
```

**Python** — A zero-dependency Python LSP client is included in [`clients/python/`](clients/python/):

```bash
cd clients/python
python3 sysml_lsp_client.py                       # analyse all example files
python3 sysml_lsp_client.py ../../examples/vehicle-model.sysml  # specific file
```

This demonstrates that the same LSP server used by VS Code can be driven from
any language — see the [Python client README](clients/python/README.md) for details.

### Using the MCP Server

```bash
npm install && npm run build
node dist/server/mcpServer.mjs   # stdio transport
```

---

## Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                     Language Server (Node.js)                    │
│                                                                  │
│  ┌──────────────┐  ┌──────────────────┐  ┌───────────────────┐   │
│  │ ANTLR4 Parser│  │   Symbol Table   │  │   21 Providers    │   │
│  │ (worker thr.)│──│ scopes, q-names  │──│ completion, hover │   │
│  │ SLL/LL dual  │  │ cross-file refs  │  │ def, refs, rename │   │
│  └──────────────┘  └──────────────────┘  │ hierarchy, format │   │
│                                          │ tokens, lens, ... │   │
│                                          └───────────────────┘   │
└──────────────────────┬───────────────────────────┬───────────────┘
                       │ LSP (stdio/IPC)           │
          ┌────────────┴────────────┐              │
          │      Any Editor         │              │
          │  VS Code, Neovim,       │              │
          │  Emacs, Sublime, ...    │              │
          └─────────────────────────┘              │
                                                   │
┌──────────────────────────────────────────────────┴──────────────┐
│                     MCP Server (standalone)                     │
│  7 tools · 3 resources · 3 prompts · stdio transport            │
│                                                                 │
│  ┌─────────────────┐  ┌──────────────────┐ ┌──────────────────┐ │
│  │  Claude, Copilot│  │  Cursor, Windsurf│ │  Any MCP Client  │ │
│  └─────────────────┘  └──────────────────┘ └──────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

### Project Structure

```
sysml-v2-lsp/
├── server/                 # Language Server + MCP Server
│   └── src/
│       ├── server.ts           # LSP connection, capability registration
│       ├── mcpServer.ts        # MCP server entry point (stdio)
│       ├── mcpCore.ts          # MCP handler logic (testable)
│       ├── documentManager.ts  # Parse cache, document lifecycle
│       ├── parser/             # ANTLR4 parse pipeline + worker thread
│       ├── symbols/            # Symbol table, scopes, element types
│       └── providers/          # 21 LSP feature implementations
├── clients/                # LSP client implementations
│   ├── vscode/                 # VS Code Language Client extension
│   │   └── src/extension.ts        # Starts LanguageClient, registers language
│   └── python/                 # Python LSP client demo (zero dependencies)
│       └── sysml_lsp_client.py
├── grammar/                # ANTLR4 grammar files (.g4)
├── examples/               # Sample SysML models
├── test/                   # Unit tests (vitest)
└── package.json            # Extension manifest + monorepo scripts
```

---

## Development

```bash
npm install                 # Install all dependencies
npm run generate            # Generate TypeScript parser from ANTLR4 grammar
npm run build               # Compile + bundle (esbuild)
npm run watch               # Watch mode — recompiles on changes
npm test                    # Run 88 unit tests (vitest)
npm run lint                # ESLint
```

Or use the Makefile:

```bash
make install          # Install all dependencies
make generate         # Generate TypeScript parser from grammar
make build            # Compile + bundle
make watch            # Watch mode
make test             # Run unit tests
make lint             # ESLint
make package          # Build .vsix
make package-server   # Build npm tarball
make update-grammar   # Pull latest grammar from upstream
make ci               # Full CI pipeline
```

### Grammar Updates

The grammar files in `grammar/` are sourced from [daltskin/sysml-v2-grammar](https://github.com/daltskin/sysml-v2-grammar). To pull the latest:

```bash
npm run update-grammar && npm run generate
```

---

## Technology Stack

| Component | Technology                                                                          |
| --------- | ----------------------------------------------------------------------------------- |
| Language  | TypeScript (strict mode)                                                            |
| Runtime   | Node.js ≥ 20                                                                        |
| Parser    | ANTLR4 via [antlr4ng](https://github.com/mike-lischke/antlr4ng)                     |
| Generator | [antlr-ng](https://github.com/nicklockwood/antlr-ng)                                |
| LSP       | [vscode-languageserver](https://github.com/microsoft/vscode-languageserver-node)    |
| MCP       | [@modelcontextprotocol/sdk](https://github.com/modelcontextprotocol/typescript-sdk) |
| Bundler   | esbuild                                                                             |
| Tests     | vitest                                                                              |

## Related Projects

- [daltskin/sysml-v2-grammar](https://github.com/daltskin/sysml-v2-grammar) — ANTLR4 grammar for SysML v2
- [daltskin/VSCode_SysML_Extension](https://github.com/daltskin/VSCode_SysML_Extension) — VS Code extension with visualization
- [OMG SysML v2 Specification](https://github.com/Systems-Modeling/SysML-v2-Release)

## License

MIT
