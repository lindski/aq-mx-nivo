import { mergeCacheKey, mergeConfiguration } from "./merge";
import { compileFunctionProperty } from "./functionProps";

describe("mergeConfiguration", () => {
    it("applies static, then dynamic, then functions — later wins", () => {
        const result = mergeConfiguration({
            staticConfiguration: '{"a":1,"b":1,"c":1}',
            dynamicConfiguration: '{"b":2,"c":2}',
            functionProperties: [{ propertyName: "c", functionArguments: "", functionBody: "return 3;" }]
        });

        expect(result.configuration.a).toBe(1);
        expect(result.configuration.b).toBe(2);
        expect(typeof result.configuration.c).toBe("function");
    });

    it("merges shallowly, so a lower layer's nested object is replaced rather than blended", () => {
        const result = mergeConfiguration({
            staticConfiguration: '{"margin":{"top":20,"left":60}}',
            dynamicConfiguration: '{"margin":{"top":10}}'
        });

        // Deliberate: a deep merge would make it impossible to REMOVE a nested default, and
        // "my axis config is being half-overridden" is far worse to debug than a clean replacement.
        expect(result.configuration.margin).toEqual({ top: 10 });
    });

    it("reports malformed configuration as an error rather than throwing", () => {
        const result = mergeConfiguration({ staticConfiguration: "{oops" });
        expect(result.errors).toHaveLength(1);
        expect(result.errors[0]).toContain("Static configuration is not valid JSON");
    });

    /*
     * The distinction that matters: configuration that cannot be understood is fatal to the chart,
     * but a function body that will not compile costs only its own property. Losing a tooltip
     * formatter should not cost the visualisation.
     */
    it("treats a bad function body as a warning, not an error, and keeps the other properties", () => {
        const result = mergeConfiguration({
            staticConfiguration: '{"a":1}',
            functionProperties: [
                { propertyName: "tooltip", functionArguments: "d", functionBody: "return d.value +" },
                { propertyName: "valueFormat", functionArguments: "v", functionBody: "return String(v);" }
            ]
        });

        expect(result.errors).toHaveLength(0);
        expect(result.warnings).toHaveLength(1);
        expect(result.warnings[0]).toContain("tooltip");
        expect(result.configuration.a).toBe(1);
        expect(typeof result.configuration.valueFormat).toBe("function");
        expect(result.configuration.tooltip).toBeUndefined();
    });

    it("ignores rows with no property name or no body rather than compiling nonsense", () => {
        const result = mergeConfiguration({
            functionProperties: [
                { propertyName: "", functionArguments: "", functionBody: "return 1;" },
                { propertyName: "x", functionArguments: "", functionBody: "" }
            ]
        });
        expect(result.configuration).toEqual({});
        expect(result.warnings).toHaveLength(0);
    });
});

describe("mergeCacheKey", () => {
    /*
     * This is the whole of the C-02 fix. Mendix hands out new prop instances freely, so memoising on
     * object identity re-parses on every render even when the text is byte-identical — and Nivo,
     * seeing what it takes to be new props, re-runs its transitions continuously.
     */
    it("is stable across different objects carrying the same text", () => {
        const a = mergeCacheKey({
            staticConfiguration: '{"a":1}',
            functionProperties: [{ propertyName: "t", functionArguments: "d", functionBody: "return d;" }]
        });
        const b = mergeCacheKey({
            staticConfiguration: '{"a":1}',
            functionProperties: [{ propertyName: "t", functionArguments: "d", functionBody: "return d;" }]
        });
        expect(a).toBe(b);
    });

    it("changes when any part of the text changes", () => {
        const base = { staticConfiguration: '{"a":1}', dynamicConfiguration: '{"b":2}' };
        expect(mergeCacheKey(base)).not.toBe(mergeCacheKey({ ...base, staticConfiguration: '{"a":2}' }));
        expect(mergeCacheKey(base)).not.toBe(mergeCacheKey({ ...base, dynamicConfiguration: '{"b":3}' }));
    });

    it("does not confuse a value moving between fields", () => {
        // A naive concatenation would make these two identical.
        expect(mergeCacheKey({ staticConfiguration: "ab", dynamicConfiguration: "" })).not.toBe(
            mergeCacheKey({ staticConfiguration: "a", dynamicConfiguration: "b" })
        );
    });
});

describe("compileFunctionProperty", () => {
    it("returns the same function instance for identical source", () => {
        const definition = { propertyName: "t", functionArguments: "d", functionBody: "return d * 2;" };
        const first = compileFunctionProperty(definition);
        const second = compileFunctionProperty({ ...definition });

        expect(first.ok && second.ok).toBe(true);
        // Identity, not equality: a fresh function on every render is a changed prop to Nivo.
        expect(first.ok && second.ok && first.value === second.value).toBe(true);
    });

    it("compiles a working function", () => {
        const result = compileFunctionProperty({
            propertyName: "valueFormat",
            functionArguments: "v",
            functionBody: "return '£' + v;"
        });
        expect(result.ok).toBe(true);
        expect(result.ok && result.value(12)).toBe("£12");
    });

    it("reports a syntax error instead of throwing", () => {
        const result = compileFunctionProperty({
            propertyName: "t",
            functionArguments: "d",
            functionBody: "return d +"
        });
        expect(result.ok).toBe(false);
        expect(result.ok === false && result.error).toContain('Function property "t" did not compile');
    });
});
