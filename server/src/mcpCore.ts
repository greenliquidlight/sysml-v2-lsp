/**
 * SysML v2 MCP Server — Core Logic
 *
 * Pure functions and stateful helpers used by the MCP tool/resource/prompt
 * handlers.  Extracted from mcpServer.ts so they can be unit-tested without
 * spinning up a transport.
 */

import { parseDocument } from './parser/parseDocument.js';
import { SymbolTable } from './symbols/symbolTable.js';
import { SysMLElementKind, isDefinition, isUsage } from './symbols/sysmlElements.js';
import type { SysMLSymbol } from './symbols/sysmlElements.js';
import type { SyntaxError } from './parser/errorListener.js';

// ---------------------------------------------------------------------------
// State container — one per MCP session
// ---------------------------------------------------------------------------

export class McpContext {
    readonly symbolTable = new SymbolTable();
    readonly loadedDocuments = new Map<string, string>();
}

// ---------------------------------------------------------------------------
// Formatting helpers
// ---------------------------------------------------------------------------

export function formatSymbol(sym: SysMLSymbol): Record<string, unknown> {
    return {
        name: sym.name,
        kind: sym.kind,
        qualifiedName: sym.qualifiedName,
        ...(sym.typeName ? { type: sym.typeName } : {}),
        ...(sym.documentation ? { documentation: sym.documentation } : {}),
        ...(sym.parentQualifiedName ? { parent: sym.parentQualifiedName } : {}),
        ...(sym.children.length > 0 ? { children: sym.children } : {}),
        location: {
            uri: sym.uri,
            range: sym.range,
        },
    };
}

export function formatError(err: SyntaxError): Record<string, unknown> {
    return {
        line: err.line + 1,
        column: err.column + 1,
        message: err.message,
        length: err.length,
    };
}

// ---------------------------------------------------------------------------
// Core operations — each returns the JSON-serialisable result object
// ---------------------------------------------------------------------------

export function parseAndBuild(
    ctx: McpContext,
    text: string,
    uri: string,
): { errors: SyntaxError[]; symbolCount: number; timingMs: { lex: number; parse: number } } {
    const result = parseDocument(text);
    ctx.symbolTable.build(uri, result);
    ctx.loadedDocuments.set(uri, text);
    return {
        errors: result.errors,
        symbolCount: ctx.symbolTable.getSymbolsForUri(uri).length,
        timingMs: { lex: result.timing.lexMs, parse: result.timing.parseMs },
    };
}

export function handleParse(
    ctx: McpContext,
    code: string,
    uri?: string,
): Record<string, unknown> {
    const docUri = uri ?? 'untitled.sysml';
    const { errors, symbolCount, timingMs } = parseAndBuild(ctx, code, docUri);

    const summary: Record<string, unknown> = {
        uri: docUri,
        symbolCount,
        errorCount: errors.length,
        timing: timingMs,
    };

    if (errors.length > 0) {
        summary.errors = errors.map(formatError);
    }

    const allSymbols = ctx.symbolTable.getSymbolsForUri(docUri);
    const topLevel = allSymbols
        .filter((s) => !s.parentQualifiedName)
        .map((s) => `${s.kind} ${s.qualifiedName}`);
    if (topLevel.length > 0) {
        summary.topLevelElements = topLevel;
    }

    return summary;
}

export function handleValidate(
    ctx: McpContext,
    code: string,
    uri?: string,
): { valid: boolean; errorCount: number; errors: Record<string, unknown>[] } {
    const docUri = uri ?? 'untitled.sysml';
    const { errors } = parseAndBuild(ctx, code, docUri);
    return {
        valid: errors.length === 0,
        errorCount: errors.length,
        errors: errors.map(formatError),
    };
}

export function handleGetSymbols(
    ctx: McpContext,
    opts: { kind?: string; uri?: string; definitionsOnly?: boolean; usagesOnly?: boolean },
): { count: number; symbols: Record<string, unknown>[] } {
    let symbols = opts.uri
        ? ctx.symbolTable.getSymbolsForUri(opts.uri)
        : ctx.symbolTable.getAllSymbols();

    if (opts.kind) {
        symbols = symbols.filter((s) => s.kind.toLowerCase() === opts.kind!.toLowerCase());
    }
    if (opts.definitionsOnly) {
        symbols = symbols.filter((s) => isDefinition(s.kind));
    }
    if (opts.usagesOnly) {
        symbols = symbols.filter((s) => isUsage(s.kind));
    }

    return { count: symbols.length, symbols: symbols.map(formatSymbol) };
}

export function handleGetDefinition(
    ctx: McpContext,
    name: string,
): Record<string, unknown> {
    const exact = ctx.symbolTable.getSymbol(name);
    if (exact) {
        return formatSymbol(exact);
    }

    const matches = ctx.symbolTable.findByName(name);
    if (matches.length === 0) {
        return { found: false, message: `No symbol found with name "${name}"` };
    }
    return { found: true, count: matches.length, symbols: matches.map(formatSymbol) };
}

export function handleGetReferences(
    ctx: McpContext,
    name: string,
): { name: string; referenceCount: number; references: Record<string, unknown>[] } {
    const refs = ctx.symbolTable.findReferences(name);
    return { name, referenceCount: refs.length, references: refs.map(formatSymbol) };
}

export function handleGetHierarchy(
    ctx: McpContext,
    name: string,
): Record<string, unknown> {
    const exact = ctx.symbolTable.getSymbol(name);
    const target = exact ?? ctx.symbolTable.findByName(name)[0];

    if (!target) {
        return { found: false, message: `No symbol "${name}" found` };
    }

    const ancestors: Array<{ name: string; kind: string; qualifiedName: string }> = [];
    let current = target.parentQualifiedName;
    while (current) {
        const parent = ctx.symbolTable.getSymbol(current);
        if (!parent) break;
        ancestors.unshift({ name: parent.name, kind: parent.kind, qualifiedName: parent.qualifiedName });
        current = parent.parentQualifiedName;
    }

    const children = target.children
        .map((qn) => ctx.symbolTable.getSymbol(qn))
        .filter((s): s is SysMLSymbol => s !== undefined)
        .map((s) => ({
            name: s.name,
            kind: s.kind,
            qualifiedName: s.qualifiedName,
            ...(s.typeName ? { type: s.typeName } : {}),
        }));

    return {
        element: {
            name: target.name,
            kind: target.kind,
            qualifiedName: target.qualifiedName,
            ...(target.typeName ? { type: target.typeName } : {}),
        },
        ancestors,
        children,
    };
}

export function handleGetModelSummary(
    ctx: McpContext,
): Record<string, unknown> {
    const allSymbols = ctx.symbolTable.getAllSymbols();
    const kindCounts: Record<string, number> = {};
    for (const sym of allSymbols) {
        kindCounts[sym.kind] = (kindCounts[sym.kind] ?? 0) + 1;
    }
    const sorted = Object.entries(kindCounts).sort(([, a], [, b]) => b - a);
    return {
        totalSymbols: allSymbols.length,
        loadedDocuments: Array.from(ctx.loadedDocuments.keys()),
        elementsByKind: Object.fromEntries(sorted),
        definitions: allSymbols.filter((s) => isDefinition(s.kind)).length,
        usages: allSymbols.filter((s) => isUsage(s.kind)).length,
    };
}

// ---------------------------------------------------------------------------
// Resource data helpers
// ---------------------------------------------------------------------------

export function getElementKinds(): { definitions: string[]; usages: string[]; other: string[]; total: number } {
    const kinds = Object.values(SysMLElementKind);
    return {
        definitions: kinds.filter((k) => isDefinition(k)),
        usages: kinds.filter((k) => isUsage(k)),
        other: kinds.filter((k) => !isDefinition(k) && !isUsage(k)),
        total: kinds.length,
    };
}

export const SYSML_KEYWORDS = [
    'about', 'abstract', 'accept', 'action', 'actor', 'after', 'alias',
    'all', 'allocate', 'allocation', 'analysis', 'and', 'as', 'assert',
    'assign', 'assume', 'attribute', 'bind', 'binding', 'bool', 'by',
    'calc', 'case', 'comment', 'concern', 'connect', 'connection',
    'constraint', 'decide', 'def', 'default', 'defined', 'dependency',
    'derived', 'do', 'doc', 'else', 'end', 'entry', 'enum', 'event',
    'exhibit', 'exit', 'expose', 'false', 'feature', 'filter', 'first',
    'flow', 'for', 'fork', 'frame', 'from', 'hastype', 'if', 'implies',
    'import', 'in', 'include', 'individual', 'inout', 'interface',
    'istype', 'item', 'join', 'language', 'library', 'locale', 'merge',
    'message', 'meta', 'metadata', 'multiplicity', 'namespace', 'nonunique',
    'not', 'null', 'objective', 'occurrence', 'of', 'or', 'ordered', 'out',
    'package', 'parallel', 'part', 'perform', 'port', 'private',
    'protected', 'public', 'readonly', 'redefines', 'ref', 'references',
    'render', 'rendering', 'rep', 'require', 'requirement', 'return',
    'satisfy', 'send', 'snapshot', 'specializes', 'stakeholder', 'state',
    'subject', 'subsets', 'succession', 'then', 'timeslice', 'to', 'transition',
    'true', 'type', 'use', 'variant', 'variation', 'verification', 'verify',
    'view', 'viewpoint', 'when', 'while', 'xor',
] as const;

// ---------------------------------------------------------------------------
// Resource handlers
// ---------------------------------------------------------------------------

export function handleResourceElementKinds(): Record<string, unknown> {
    return getElementKinds();
}

export function handleResourceKeywords(): { keywords: readonly string[]; count: number } {
    return { keywords: SYSML_KEYWORDS, count: SYSML_KEYWORDS.length };
}

export function handleResourceGrammarOverview(): string {
    return `# SysML v2 Grammar Overview

## Element Categories

### Definitions (Types)
Definitions declare reusable types:
- \`part def\` — structural element type
- \`attribute def\` — value type
- \`port def\` — interface point type
- \`connection def\` — connection type
- \`interface def\` — interface type
- \`action def\` — behavior type
- \`state def\` — state machine type
- \`requirement def\` — requirement type
- \`constraint def\` — constraint type
- \`item def\` — general item type
- \`enum def\` — enumeration type
- \`calc def\` — calculation type
- \`use case def\` — use case type
- \`allocation def\` — allocation type
- \`view def\` / \`viewpoint def\` — viewpoint types

### Usages (Instances)
Usages create instances of definitions:
- \`part\` — structural instance
- \`attribute\` — value instance
- \`port\` — port instance
- \`action\` — action step
- \`state\` — state instance
- \`requirement\` — requirement instance
- \`item\` — item instance

## Specialisation Syntax
- \`part car : Vehicle\` — \`car\` specialises \`Vehicle\`
- \`part car :> baseVehicle\` — \`car\` subsets \`baseVehicle\`
- \`part car :>> specificVehicle\` — \`car\` redefines \`specificVehicle\`

## Packages & Namespaces
\`\`\`sysml
package VehicleModel {
    part def Vehicle { ... }
    part car : Vehicle;
}
\`\`\`

## Documentation
\`\`\`sysml
part def Vehicle {
    doc /* A general vehicle definition */
    attribute mass : Real;
}
\`\`\`

## Unrestricted Names
Names with spaces use single quotes: \`part 'Main Assembly' : Assembly;\`
`;
}

// ---------------------------------------------------------------------------
// Prompt handlers
// ---------------------------------------------------------------------------

export function handlePromptReviewSysml(
    ctx: McpContext,
    code: string,
): { role: 'user'; content: { type: 'text'; text: string } }[] {
    const { errors, symbolCount } = parseAndBuild(ctx, code, 'review.sysml');
    const allSymbols = ctx.symbolTable.getSymbolsForUri('review.sysml');
    const defs = allSymbols.filter((s) => isDefinition(s.kind));
    const usages = allSymbols.filter((s) => isUsage(s.kind));

    const context = [
        `Parsed: ${symbolCount} symbols, ${errors.length} syntax errors`,
        `Definitions: ${defs.map((d) => `${d.kind} ${d.name}`).join(', ') || 'none'}`,
        `Usages: ${usages.map((u) => `${u.kind} ${u.name}`).join(', ') || 'none'}`,
    ];
    if (errors.length > 0) {
        context.push(`Errors: ${errors.map((e) => `line ${e.line + 1}: ${e.message}`).join('; ')}`);
    }

    return [{
        role: 'user' as const,
        content: {
            type: 'text' as const,
            text: `Please review the following SysML v2 model for correctness, completeness, and best practices.

## Parse Results
${context.join('\n')}

## Source Code
\`\`\`sysml
${code}
\`\`\`

Please check for:
1. Syntax errors and how to fix them
2. Missing type specialisations
3. Naming conventions (PascalCase for definitions, camelCase for usages)
4. Missing documentation (doc comments)
5. Structural completeness (are there orphaned usages without definitions?)
6. Suggestions for additional ports, attributes, or constraints`,
        },
    }];
}

export function handlePromptExplainElement(
    element: string,
): { role: 'user'; content: { type: 'text'; text: string } }[] {
    return [{
        role: 'user' as const,
        content: {
            type: 'text' as const,
            text: `Explain the SysML v2 element kind "${element}" in detail. Include:

1. What it represents in systems engineering
2. The difference between its definition form and usage form (if applicable)
3. Common attributes and relationships
4. A simple SysML v2 code example
5. When to use it vs similar elements

Use the SysML v2 syntax (not SysML v1 block diagrams).`,
        },
    }];
}

export function handlePromptGenerateSysml(
    description: string,
    scope?: string,
): { role: 'user'; content: { type: 'text'; text: string } }[] {
    const scopeHint = scope
        ? `Focus on: ${scope}`
        : 'Include structural definitions, key attributes, ports, and connections.';

    return [{
        role: 'user' as const,
        content: {
            type: 'text' as const,
            text: `Generate a SysML v2 model for the following system description.

## System Description
${description}

## Scope
${scopeHint}

## Requirements
- Use valid SysML v2 syntax
- Organise elements in packages
- Use PascalCase for definitions, camelCase for usages
- Add doc comments for key elements
- Include type specialisations where appropriate
- Use ports and connections for interfaces between parts

Return the complete SysML v2 source code in a single code block.`,
        },
    }];
}
