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

    // ------------------------------------------------------------------
    // Expanded NAME_PRECEDING_KEYWORDS coverage
    // ------------------------------------------------------------------

    it('should not flag names after KerML element keywords', async () => {
        const { parseDocument } = await import('../../server/src/parser/parseDocument.js');
        const { validateKeywordsFromTokens } = await import('../../server/src/parser/parseWorker.js');

        // type, classifier, datatype, class, struct, assoc, metaclass, feature, etc.
        const text = `
package KerMLElements {
    type Lenght { }
    classifier Vehicl { }
    datatype Spede { }
    class Motoor { }
    struct Fram { }
    feature Valv { }
    step Proces { }
}
`;
        const result = parseDocument(text);
        const diags = validateKeywordsFromTokens(result.tokenStream);
        // Names after KerML keywords should NOT be flagged as keyword typos
        const flagged = diags.map(d => d.message);
        expect(flagged.some(m => m.includes("'Lenght'"))).toBe(false);
        expect(flagged.some(m => m.includes("'Vehicl'"))).toBe(false);
        expect(flagged.some(m => m.includes("'Spede'"))).toBe(false);
        expect(flagged.some(m => m.includes("'Motoor'"))).toBe(false);
        expect(flagged.some(m => m.includes("'Fram'"))).toBe(false);
        expect(flagged.some(m => m.includes("'Valv'"))).toBe(false);
        expect(flagged.some(m => m.includes("'Proces'"))).toBe(false);
    });

    it('should not flag names after visibility/prefix modifiers', async () => {
        const { parseDocument } = await import('../../server/src/parser/parseDocument.js');
        const { validateKeywordsFromTokens } = await import('../../server/src/parser/parseWorker.js');

        const text = `
package Modifiers {
    abstract part def Vehicl { }
    private part myPart { }
    protected attribute protValu { }
    public part pubPart { }
    variation part varPart { }
    derived attribute derivAttr { }
}
`;
        const result = parseDocument(text);
        const diags = validateKeywordsFromTokens(result.tokenStream);
        expect(diags.length).toBe(0);
    });

    it('should not flag names after action control node keywords', async () => {
        const { parseDocument } = await import('../../server/src/parser/parseDocument.js');
        const { validateKeywordsFromTokens } = await import('../../server/src/parser/parseWorker.js');

        const text = `
package ControlNodes {
    action def MyAction {
        fork forkNode { }
        join joinNode { }
        merge mergeNode { }
        decide decideNode { }
    }
}
`;
        const result = parseDocument(text);
        const diags = validateKeywordsFromTokens(result.tokenStream);
        expect(diags.length).toBe(0);
    });

    it('should not flag names after reference-preceding keywords', async () => {
        const { parseDocument } = await import('../../server/src/parser/parseDocument.js');
        const { validateKeywordsFromTokens } = await import('../../server/src/parser/parseWorker.js');

        const text = `
package RefPreceding {
    action def DoStuff { }
    action def Main {
        perform DoStuff;
    }
    requirement def SafeReq { }
    satisfy SafeReq by Main;
}
`;
        const result = parseDocument(text);
        const diags = validateKeywordsFromTokens(result.tokenStream);
        expect(diags.length).toBe(0);
    });

    it('should not flag names after relationship keywords', async () => {
        const { parseDocument } = await import('../../server/src/parser/parseDocument.js');
        const { validateKeywordsFromTokens } = await import('../../server/src/parser/parseWorker.js');

        const text = `
package Relationships {
    part def Base { }
    part def Extended specializes Base { }
    part def Another {
        attribute x redefines Base { }
    }
}
`;
        const result = parseDocument(text);
        const diags = validateKeywordsFromTokens(result.tokenStream);
        expect(diags.length).toBe(0);
    });

    it('should not flag names after colon (type annotation)', async () => {
        const { parseDocument } = await import('../../server/src/parser/parseDocument.js');
        const { validateKeywordsFromTokens } = await import('../../server/src/parser/parseWorker.js');

        // Colon is now in NAME_PRECEDING_KEYWORDS instead of the skip set
        const text = `
package ColonTest {
    part def Engin { }
    part myPart : Engin;
}
`;
        const result = parseDocument(text);
        const diags = validateKeywordsFromTokens(result.tokenStream);
        // "Engin" after ":" should NOT be flagged (it's a type reference)
        const flagged = diags.map(d => d.message);
        expect(flagged.some(m => m.includes("'Engin'"))).toBe(false);
    });

    it('should not flag names after colon-gt (specialization)', async () => {
        const { parseDocument } = await import('../../server/src/parser/parseDocument.js');
        const { validateKeywordsFromTokens } = await import('../../server/src/parser/parseWorker.js');

        const text = `
package SpecTest {
    part def Base { }
    part def Derivd :> Base { }
}
`;
        const result = parseDocument(text);
        const diags = validateKeywordsFromTokens(result.tokenStream);
        expect(diags.length).toBe(0);
    });

    it('should not flag identifiers after := assignment', async () => {
        const { parseDocument } = await import('../../server/src/parser/parseDocument.js');
        const { validateKeywordsFromTokens } = await import('../../server/src/parser/parseWorker.js');

        const text = `
package AssignTest {
    attribute x := somethingg;
}
`;
        const result = parseDocument(text);
        const diags = validateKeywordsFromTokens(result.tokenStream);
        // "somethingg" after ":=" should NOT be flagged (it's a value)
        const flagged = diags.map(d => d.message);
        expect(flagged.some(m => m.includes("'somethingg'"))).toBe(false);
    });

    it('should not flag names after requirement/state body keywords', async () => {
        const { parseDocument } = await import('../../server/src/parser/parseDocument.js');
        const { validateKeywordsFromTokens } = await import('../../server/src/parser/parseWorker.js');

        const text = `
package StateBody {
    state def MyState {
        entry action startUp { }
        do action runLoop { }
        exit action shutDown { }
    }
    requirement def MyReq {
        assume constraint safetyAssumption { }
        require constraint safetyRequirement { }
        frame concern safetyFrame { }
        objective myObjective { }
    }
}
`;
        const result = parseDocument(text);
        const diags = validateKeywordsFromTokens(result.tokenStream);
        expect(diags.length).toBe(0);
    });

    it('should not flag names after directionality keywords', async () => {
        const { parseDocument } = await import('../../server/src/parser/parseDocument.js');
        const { validateKeywordsFromTokens } = await import('../../server/src/parser/parseWorker.js');

        const text = `
package Directionality {
    port def MyPort {
        in item fuelIn { }
        out item exhaust { }
        inout item coolant { }
    }
}
`;
        const result = parseDocument(text);
        const diags = validateKeywordsFromTokens(result.tokenStream);
        expect(diags.length).toBe(0);
    });

    it('should not flag names after succession/flow keywords', async () => {
        const { parseDocument } = await import('../../server/src/parser/parseDocument.js');
        const { validateKeywordsFromTokens } = await import('../../server/src/parser/parseWorker.js');

        const text = `
package Successions {
    action def Pipeline {
        first start;
        then action stepOne { }
        then done;
    }
}
`;
        const result = parseDocument(text);
        const diags = validateKeywordsFromTokens(result.tokenStream);
        expect(diags.length).toBe(0);
    });

    it('should not flag names after annotation/membership keywords', async () => {
        const { parseDocument } = await import('../../server/src/parser/parseDocument.js');
        const { validateKeywordsFromTokens } = await import('../../server/src/parser/parseWorker.js');

        const text = `
package Annotations {
    alias SensorAlias for Sensor;
    comment commentBlock about Vehicle /* my comment */
    doc docBlock /* documentation */
    dependency myDep from A to B;
}
`;
        const result = parseDocument(text);
        const diags = validateKeywordsFromTokens(result.tokenStream);
        expect(diags.length).toBe(0);
    });

    it('should not flag names after message and transition keywords', async () => {
        const { parseDocument } = await import('../../server/src/parser/parseDocument.js');
        const { validateKeywordsFromTokens } = await import('../../server/src/parser/parseWorker.js');

        const text = `
package MsgTransition {
    message def Notification { }
    transition def StateChange { }
}
`;
        const result = parseDocument(text);
        const diags = validateKeywordsFromTokens(result.tokenStream);
        expect(diags.length).toBe(0);
    });

    it('should still flag genuine keyword typos', async () => {
        const { parseDocument } = await import('../../server/src/parser/parseDocument.js');
        const { validateKeywordsFromTokens } = await import('../../server/src/parser/parseWorker.js');

        // "packaeg" at the start of file is a genuine keyword typo
        const text = `packaeg TestPkg { }`;
        const result = parseDocument(text);
        const diags = validateKeywordsFromTokens(result.tokenStream);
        expect(diags.length).toBeGreaterThan(0);
        expect(diags[0].message).toContain('package');
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
