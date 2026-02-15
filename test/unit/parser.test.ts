import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

// Note: These tests require the ANTLR-generated parser to be present.
// Run `npm run generate` before running tests.

describe('Parser', () => {
    const fixturesDir = join(__dirname, '..', 'fixtures');

    it('should parse a valid vehicle model without errors', async () => {
        const { parseDocument } = await import('../../server/src/parser/parseDocument.js');
        const text = readFileSync(join(fixturesDir, 'valid', 'vehicle.sysml'), 'utf-8');
        const result = parseDocument(text);

        expect(result.tree).not.toBeNull();
        expect(result.errors.length).toBe(0);
    });

    it('should parse a valid camera model without errors', async () => {
        const { parseDocument } = await import('../../server/src/parser/parseDocument.js');
        const text = readFileSync(join(fixturesDir, 'valid', 'camera.sysml'), 'utf-8');
        const result = parseDocument(text);

        expect(result.tree).not.toBeNull();
        expect(result.errors.length).toBe(0);
    });

    it('should parse connection definitions with end keyword without errors', async () => {
        const { parseDocument } = await import('../../server/src/parser/parseDocument.js');
        const text = readFileSync(join(fixturesDir, 'valid', 'connection-end.sysml'), 'utf-8');
        const result = parseDocument(text);

        expect(result.tree).not.toBeNull();
        expect(result.errors.length).toBe(0);
    });

    it('should not flag end feature names as keyword typos', async () => {
        const { parseDocument } = await import('../../server/src/parser/parseDocument.js');
        const { validateKeywordsFromTokens } = await import('../../server/src/parser/parseWorker.js');

        const text = `
connection def PowerConnection {
    end source : PowerPort;
    end target : PowerPort;
}
`;
        const result = parseDocument(text);
        const keywordDiags = validateKeywordsFromTokens(result.tokenStream);

        // "source" and "target" should not be flagged as keyword typos
        expect(keywordDiags.length).toBe(0);
    });

    it('should not flag end feature names as unknown identifiers', async () => {
        const { parseDocument } = await import('../../server/src/parser/parseDocument.js');
        const { flagUnknownIdentifiers } = await import('../../server/src/parser/parseWorker.js');

        const text = `
connection def DataLink {
    end sender : SignalPort;
    end receiver : SignalPort;
}
`;
        const result = parseDocument(text);
        const unknownDiags = flagUnknownIdentifiers(result.tokenStream);

        // "sender" and "receiver" should not be flagged as unknown identifiers
        expect(unknownDiags.length).toBe(0);
    });

    it('should report errors for invalid syntax', async () => {
        const { parseDocument } = await import('../../server/src/parser/parseDocument.js');
        const text = readFileSync(join(fixturesDir, 'invalid', 'syntax-error.sysml'), 'utf-8');
        const result = parseDocument(text);

        expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should return a token stream', async () => {
        const { parseDocument } = await import('../../server/src/parser/parseDocument.js');
        const result = parseDocument('package Test { }');

        expect(result.tokenStream).toBeDefined();
        result.tokenStream.fill();
        expect(result.tokenStream.getTokens().length).toBeGreaterThan(0);
    });
});
