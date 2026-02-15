import {
    ReferenceParams,
    Location,
} from 'vscode-languageserver/node.js';
import { DocumentManager } from '../documentManager.js';
import { SymbolTable } from '../symbols/symbolTable.js';

/**
 * Provides find-all-references for SysML elements.
 *
 * Scans document text for all whole-word occurrences of the target
 * identifier, so both declarations and type/usage references are found
 * (e.g. `action adjustWheels : AdjustWheelAngle` surfaces as a
 * reference to `AdjustWheelAngle`).
 */
export class ReferencesProvider {
    private symbolTable = new SymbolTable();

    constructor(private documentManager: DocumentManager) { }

    provideReferences(params: ReferenceParams): Location[] {
        const result = this.documentManager.get(params.textDocument.uri);
        if (!result) {
            return [];
        }

        const text = this.documentManager.getText(params.textDocument.uri);
        if (!text) return [];

        // Build symbol table
        this.symbolTable.build(params.textDocument.uri, result);

        // Find symbol at position (declaration or reference)
        const symbol = this.symbolTable.resolveAt(
            params.textDocument.uri,
            params.position.line,
            params.position.character,
            text,
        );

        if (!symbol) {
            return [];
        }

        // Scan all open documents for text references to this name
        const locations: Location[] = [];
        const seen = new Set<string>();

        for (const uri of this.documentManager.getUris()) {
            const docText = this.documentManager.getText(uri);
            if (!docText) continue;

            // Build symbol table for cross-file documents so the
            // text-reference scanner is available for each URI
            const docResult = this.documentManager.get(uri);
            if (docResult) {
                this.symbolTable.build(uri, docResult);
            }

            const refs = this.symbolTable.findTextReferences(symbol.name, uri, docText);
            for (const ref of refs) {
                const key = `${ref.uri}:${ref.range.start.line}:${ref.range.start.character}`;
                if (seen.has(key)) continue;
                seen.add(key);

                // Optionally skip the declaration itself
                if (!params.context.includeDeclaration) {
                    if (
                        ref.uri === symbol.uri &&
                        ref.range.start.line === symbol.selectionRange.start.line &&
                        ref.range.start.character === symbol.selectionRange.start.character
                    ) {
                        continue;
                    }
                }

                locations.push({ uri: ref.uri, range: ref.range });
            }
        }

        return locations;
    }
}
