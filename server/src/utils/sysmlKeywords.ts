/**
 * Canonical SysML v2 keyword list — single source of truth.
 *
 * Previously duplicated in symbolTable.ts, mcpCore.ts,
 * and semanticTokensProvider.ts.  Import from here instead.
 */

export const SYSML_KEYWORDS_ARRAY = [
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
    'via', 'view', 'viewpoint', 'when', 'while', 'xor',
] as const;

/** Fast O(1) keyword lookup. */
export const SYSML_KEYWORDS: ReadonlySet<string> = new Set(SYSML_KEYWORDS_ARRAY);
