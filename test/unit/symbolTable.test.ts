import { describe, it, expect } from 'vitest';

describe('Symbol Table', () => {
    it('should build a symbol table from a parsed document', async () => {
        const { parseDocument } = await import('../../server/src/parser/parseDocument.js');
        const { SymbolTable } = await import('../../server/src/symbols/symbolTable.js');

        const text = `
package VehicleModel {
    part def Vehicle {
        attribute mass : Real;
    }
}
`;
        const result = parseDocument(text);
        const symbolTable = new SymbolTable();
        symbolTable.build('test://vehicle.sysml', result);

        const symbols = symbolTable.getAllSymbols();
        expect(symbols.length).toBeGreaterThan(0);

        // Should find the package
        const packageSymbol = symbols.find(s => s.name === 'VehicleModel');
        expect(packageSymbol).toBeDefined();
    });

    it('should resolve symbols by name', async () => {
        const { parseDocument } = await import('../../server/src/parser/parseDocument.js');
        const { SymbolTable } = await import('../../server/src/symbols/symbolTable.js');

        const text = `
package Test {
    part def MyPart {
        attribute x : Real;
    }
    part myInstance : MyPart;
}
`;
        const result = parseDocument(text);
        const symbolTable = new SymbolTable();
        symbolTable.build('test://test.sysml', result);

        const matches = symbolTable.findByName('MyPart');
        expect(matches.length).toBeGreaterThanOrEqual(1);
    });

    // ------------------------------------------------------------------
    // findTextReferences
    // ------------------------------------------------------------------

    it('should find text references by whole-word match', async () => {
        const { parseDocument } = await import('../../server/src/parser/parseDocument.js');
        const { SymbolTable } = await import('../../server/src/symbols/symbolTable.js');

        const text = `
package Test {
    part def Vehicle { }
    part myVehicle : Vehicle;
}
`;
        const result = parseDocument(text);
        const symbolTable = new SymbolTable();
        symbolTable.build('test://test.sysml', result);

        const refs = symbolTable.findTextReferences('Vehicle', 'test://test.sysml', text);
        // "Vehicle" appears as the definition name and as the type reference
        expect(refs.length).toBe(2);
        expect(refs.every(r => r.uri === 'test://test.sysml')).toBe(true);
    });

    it('should not match partial words in findTextReferences', async () => {
        const { SymbolTable } = await import('../../server/src/symbols/symbolTable.js');

        const symbolTable = new SymbolTable();
        const text = 'part def VehicleModel { }\npart myVehicle : VehicleModel;';

        const refs = symbolTable.findTextReferences('Vehicle', 'test://test.sysml', text);
        // "Vehicle" alone should NOT match "VehicleModel" or "myVehicle"
        expect(refs.length).toBe(0);
    });

    it('should skip matches inside line comments', async () => {
        const { SymbolTable } = await import('../../server/src/symbols/symbolTable.js');

        const symbolTable = new SymbolTable();
        const text = 'part def Sensor { }\n// Sensor is a base type\npart mySensor : Sensor;';

        const refs = symbolTable.findTextReferences('Sensor', 'test://test.sysml', text);
        // Should find "Sensor" in def and usage, but NOT in the comment
        expect(refs.length).toBe(2);
    });

    it('should skip matches inside block comments', async () => {
        const { SymbolTable } = await import('../../server/src/symbols/symbolTable.js');

        const symbolTable = new SymbolTable();
        const text = 'part def Motor { }\n/* Motor drives the wheel */\npart myMotor : Motor;';

        const refs = symbolTable.findTextReferences('Motor', 'test://test.sysml', text);
        // Should find "Motor" in def and usage, but NOT in the block comment
        expect(refs.length).toBe(2);
    });

    it('should return empty for no matches', async () => {
        const { SymbolTable } = await import('../../server/src/symbols/symbolTable.js');

        const symbolTable = new SymbolTable();
        const text = 'package Test { part def Wheel { } }';

        const refs = symbolTable.findTextReferences('Nonexistent', 'test://test.sysml', text);
        expect(refs.length).toBe(0);
    });

    it('should handle names with regex special characters', async () => {
        const { SymbolTable } = await import('../../server/src/symbols/symbolTable.js');

        const symbolTable = new SymbolTable();
        // Name with regex-special chars shouldn't cause regex errors
        const text = "part def Normal { }";
        expect(() => symbolTable.findTextReferences('Foo+Bar', 'test://x.sysml', text)).not.toThrow();
    });
});
