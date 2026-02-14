/**
 * SysML v2 MCP Server
 *
 * A Model Context Protocol server that exposes SysML v2 parsing and analysis
 * capabilities as tools, resources, and prompts for AI assistants.
 *
 * Run via stdio transport:
 *   node dist/server/mcpServer.mjs
 *
 * Or use in an MCP configuration (Claude Desktop, VS Code, etc.):
 *   { "command": "node", "args": ["path/to/dist/server/mcpServer.mjs"] }
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import {
    McpContext,
    handleParse,
    handleValidate,
    handleGetSymbols,
    handleGetDefinition,
    handleGetReferences,
    handleGetHierarchy,
    handleGetModelSummary,
    handleResourceElementKinds,
    handleResourceKeywords,
    handleResourceGrammarOverview,
    handlePromptReviewSysml,
    handlePromptExplainElement,
    handlePromptGenerateSysml,
} from './mcpCore.js';

// ---------------------------------------------------------------------------
// Server setup
// ---------------------------------------------------------------------------

const server = new McpServer(
    { name: 'sysml-v2', version: '0.1.4' },
    { capabilities: { logging: {} } },
);

const ctx = new McpContext();

// ---------------------------------------------------------------------------
// Tools
// ---------------------------------------------------------------------------

server.registerTool(
    'parse',
    {
        title: 'Parse SysML Document',
        description:
            'Parse a SysML v2 document and build a symbol table. ' +
            'Returns syntax errors (if any) and a summary of discovered symbols. ' +
            'The parsed model is retained for subsequent queries (getSymbols, getDefinition, etc.).',
        inputSchema: {
            code: z.string().describe('The SysML v2 source code to parse'),
            uri: z.string().optional().describe('A URI/name to identify this document (defaults to "untitled.sysml")'),
        },
    },
    async ({ code, uri }) => ({
        content: [{ type: 'text' as const, text: JSON.stringify(handleParse(ctx, code, uri), null, 2) }],
    }),
);

server.registerTool(
    'validate',
    {
        title: 'Validate SysML Document',
        description:
            'Validate a SysML v2 document and return all syntax errors. ' +
            'Returns an empty errors array if the document is syntactically valid.',
        inputSchema: {
            code: z.string().describe('The SysML v2 source code to validate'),
            uri: z.string().optional().describe('A URI/name to identify this document'),
        },
    },
    async ({ code, uri }) => ({
        content: [{ type: 'text' as const, text: JSON.stringify(handleValidate(ctx, code, uri), null, 2) }],
    }),
);

server.registerTool(
    'getSymbols',
    {
        title: 'Get SysML Symbols',
        description:
            'List all symbols from the most recently parsed document(s). ' +
            'Optionally filter by element kind (e.g., "part def", "action") or document URI.',
        inputSchema: {
            kind: z.string().optional().describe('Filter by SysML element kind (e.g., "part def", "port", "action def")'),
            uri: z.string().optional().describe('Filter by document URI. If omitted, returns symbols from all loaded documents.'),
            definitionsOnly: z.boolean().optional().describe('If true, return only definition elements (types)'),
            usagesOnly: z.boolean().optional().describe('If true, return only usage elements (instances)'),
        },
    },
    async (args) => ({
        content: [{ type: 'text' as const, text: JSON.stringify(handleGetSymbols(ctx, args), null, 2) }],
    }),
);

server.registerTool(
    'getDefinition',
    {
        title: 'Get Symbol Definition',
        description:
            'Find the definition of a SysML element by name or qualified name. ' +
            'Returns matching symbols with their location and type information.',
        inputSchema: {
            name: z.string().describe('The symbol name to look up (simple name or qualified name like "Package::Element")'),
        },
    },
    async ({ name }) => ({
        content: [{ type: 'text' as const, text: JSON.stringify(handleGetDefinition(ctx, name), null, 2) }],
    }),
);

server.registerTool(
    'getReferences',
    {
        title: 'Find References',
        description: 'Find all references to a symbol by name across all loaded documents.',
        inputSchema: {
            name: z.string().describe('The symbol name to find references for'),
        },
    },
    async ({ name }) => ({
        content: [{ type: 'text' as const, text: JSON.stringify(handleGetReferences(ctx, name), null, 2) }],
    }),
);

server.registerTool(
    'getHierarchy',
    {
        title: 'Get Element Hierarchy',
        description:
            'Get the parent–child hierarchy of a SysML element, showing its ' +
            'containment structure (package → definition → usage).',
        inputSchema: {
            name: z.string().describe('The qualified name or simple name of the element to inspect'),
        },
    },
    async ({ name }) => ({
        content: [{ type: 'text' as const, text: JSON.stringify(handleGetHierarchy(ctx, name), null, 2) }],
    }),
);

server.registerTool(
    'getModelSummary',
    {
        title: 'Get Model Summary',
        description:
            'Return a high-level summary of the currently loaded SysML model(s), ' +
            'including element counts by kind and a list of loaded documents.',
        inputSchema: {},
    },
    async () => ({
        content: [{ type: 'text' as const, text: JSON.stringify(handleGetModelSummary(ctx), null, 2) }],
    }),
);

// ---------------------------------------------------------------------------
// Resources
// ---------------------------------------------------------------------------

server.registerResource(
    'sysml-element-kinds',
    'sysml://element-kinds',
    {
        title: 'SysML v2 Element Kinds',
        description: 'Reference of all SysML v2 element kinds recognised by the parser, grouped into definitions and usages.',
        mimeType: 'application/json',
    },
    async (uri) => ({
        contents: [{ uri: uri.href, text: JSON.stringify(handleResourceElementKinds(), null, 2) }],
    }),
);

server.registerResource(
    'sysml-keywords',
    'sysml://keywords',
    {
        title: 'SysML v2 Keywords',
        description: 'Complete list of SysML v2 language keywords, useful for syntax reference.',
        mimeType: 'application/json',
    },
    async (uri) => ({
        contents: [{ uri: uri.href, text: JSON.stringify(handleResourceKeywords(), null, 2) }],
    }),
);

server.registerResource(
    'sysml-grammar-overview',
    'sysml://grammar-overview',
    {
        title: 'SysML v2 Grammar Overview',
        description: 'A concise overview of the SysML v2 language structure: element categories, specialisation syntax, and common patterns.',
        mimeType: 'text/markdown',
    },
    async (uri) => ({
        contents: [{ uri: uri.href, text: handleResourceGrammarOverview() }],
    }),
);

// ---------------------------------------------------------------------------
// Prompts
// ---------------------------------------------------------------------------

server.registerPrompt(
    'review-sysml',
    {
        title: 'Review SysML Model',
        description: 'Analyse a SysML v2 model for correctness, best practices, and potential improvements.',
        argsSchema: { code: z.string().describe('The SysML v2 source code to review') },
    },
    async ({ code }) => ({
        messages: handlePromptReviewSysml(ctx, code),
    }),
);

server.registerPrompt(
    'explain-element',
    {
        title: 'Explain SysML Element',
        description: 'Explain what a specific SysML v2 element kind is and how it is used.',
        argsSchema: {
            element: z.string().describe('The SysML element kind to explain (e.g., "part def", "action", "port def", "requirement")'),
        },
    },
    async ({ element }) => ({
        messages: handlePromptExplainElement(element),
    }),
);

server.registerPrompt(
    'generate-sysml',
    {
        title: 'Generate SysML Model',
        description: 'Generate a SysML v2 model from a natural language description of a system.',
        argsSchema: {
            description: z.string().describe('A natural language description of the system to model'),
            scope: z.string().optional().describe('Desired scope/focus (e.g., "structural only", "with requirements", "full behavioral")'),
        },
    },
    async ({ description, scope }) => ({
        messages: handlePromptGenerateSysml(description, scope),
    }),
);

// ---------------------------------------------------------------------------
// Start
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
    const transport = new StdioServerTransport();
    await server.connect(transport);
}

main().catch((err) => {
    console.error('MCP server failed to start:', err);
    process.exit(1);
});
