import { TextDocument } from 'vscode-languageserver-textdocument';
import { TextDocuments } from 'vscode-languageserver/node.js';
import { parseDocument, ParseResult } from './parser/parseDocument.js';

/**
 * Manages parsed documents — caches parse results by URI and content hash.
 * Re-parses only when the document content has changed.
 *
 * The DocumentManager can be wired to the LSP `TextDocuments` collection so
 * that providers which call `get(uri)` or `getText(uri)` trigger a lazy
 * main-thread parse if no cached result is available yet.  This avoids
 * a second cold parse because the ANTLR DFA will already be warm from
 * the worker-thread parse that ran during validation.
 */
export class DocumentManager {
    private cache = new Map<string, CachedDocument>();
    private documents?: TextDocuments<TextDocument>;

    /**
     * Wire the manager to the LSP TextDocuments collection so it can
     * lazily parse open documents when providers request them.
     */
    setDocuments(documents: TextDocuments<TextDocument>): void {
        this.documents = documents;
    }

    /**
     * Parse a document and cache the result.
     * Returns the cached result if the content hasn't changed.
     */
    parse(document: TextDocument): ParseResult {
        const uri = document.uri;
        const version = document.version;
        const cached = this.cache.get(uri);

        if (cached && cached.version === version) {
            return cached.result;
        }

        const text = document.getText();
        const t0 = Date.now();
        const result = parseDocument(text);
        const parseTimeMs = Date.now() - t0;

        this.cache.set(uri, {
            version,
            text,
            result,
            parseTimeMs,
        });

        return result;
    }

    /**
     * Get the cached parse result for a URI.
     * If the cached version is stale (document has been edited) or no result
     * is cached, performs a lazy main-thread parse (fast when the DFA is
     * already warm from the worker).
     */
    get(uri: string): ParseResult | undefined {
        // Always prefer a fresh parse from the live document when available.
        // `parse()` short-circuits with a cache hit when the version matches,
        // so this is cheap when the content hasn't changed.
        if (this.documents) {
            const doc = this.documents.get(uri);
            if (doc) {
                return this.parse(doc);
            }
        }

        // Fall back to whatever is cached (e.g. document was closed but
        // we still have its last parse result).
        return this.cache.get(uri)?.result;
    }

    /**
     * Get the current text for a URI.
     * Prefers the live TextDocument content (which reflects unsaved edits)
     * and falls back to the cached text.
     */
    getText(uri: string): string | undefined {
        if (this.documents) {
            const doc = this.documents.get(uri);
            if (doc) return doc.getText();
        }

        return this.cache.get(uri)?.text;
    }

    /**
     * Store the parse time reported by the worker thread.
     * Called after a worker parse completes so that `getParseTimeMs()`
     * returns the real ANTLR parse cost rather than 0 (cache hit).
     */
    setParseTimeMs(uri: string, ms: number): void {
        const cached = this.cache.get(uri);
        if (cached) {
            cached.parseTimeMs = ms;
        }
    }

    /**
     * Return the actual ANTLR parse time for a URI (milliseconds).
     * This is either the worker-thread parse time (stored via
     * `setParseTimeMs`) or the lazy main-thread parse time measured
     * in `parse()`.
     */
    getParseTimeMs(uri: string): number {
        return this.cache.get(uri)?.parseTimeMs ?? 0;
    }

    /**
     * Remove a document from the cache (called on document close).
     */
    remove(uri: string): void {
        this.cache.delete(uri);
    }

    /**
     * Get all known URIs — both cached and currently open documents.
     */
    getUris(): string[] {
        const uris = new Set(this.cache.keys());

        // Include all open documents from the LSP TextDocuments collection,
        // even if they haven't been lazily parsed on the main thread yet.
        if (this.documents) {
            for (const doc of this.documents.all()) {
                uris.add(doc.uri);
            }
        }

        return Array.from(uris);
    }
}

interface CachedDocument {
    version: number;
    text: string;
    result: ParseResult;
    /** Actual ANTLR parse time in milliseconds (worker or lazy main-thread). */
    parseTimeMs: number;
}
