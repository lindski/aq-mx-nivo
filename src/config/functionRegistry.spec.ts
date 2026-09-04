import {
    FUNCTION_MARKER,
    REGISTERED_FUNCTION_NAMES,
    collectFunctionMarkers,
    isFunctionMarker,
    resolveFunctionMarkers,
    resolveMarker
} from "./functionRegistry";

const asFn = (result: unknown): ((...args: never[]) => unknown) => {
    if (typeof result !== "function") {
        throw new Error(`Expected a function, got ${JSON.stringify(result)}`);
    }
    return result as (...args: never[]) => unknown;
};

describe("function markers", () => {
    it("recognises only strings carrying the marker prefix", () => {
        expect(isFunctionMarker(`${FUNCTION_MARKER}prop:size`)).toBe(true);
        expect(isFunctionMarker("size")).toBe(false);
        expect(isFunctionMarker(12)).toBe(false);
        expect(isFunctionMarker(null)).toBe(false);
    });

    it("registers exactly the documented names", () => {
        expect(REGISTERED_FUNCTION_NAMES).toEqual(["prop", "truncate"]);
    });
});

describe("prop", () => {
    /*
     * The case this whole registry exists for. Nivo 0.99 removed the string-accessor form, so
     * "nodeSize": "size" silently renders NaN. This is the runtime-capable replacement.
     */
    it("reads a field off the datum, which is what 0.99 removed", () => {
        const fn = asFn(resolveMarker(`${FUNCTION_MARKER}prop:size`));
        expect(fn({ id: "Acme Ltd", size: 24 } as never)).toBe(24);
    });

    it("walks a dotted path", () => {
        const fn = asFn(resolveMarker(`${FUNCTION_MARKER}prop:data.color`));
        expect(fn({ data: { color: "#ff0000" } } as never)).toBe("#ff0000");
    });

    it("returns undefined rather than throwing on a missing path", () => {
        const fn = asFn(resolveMarker(`${FUNCTION_MARKER}prop:a.b.c`));
        expect(fn({ a: null } as never)).toBeUndefined();
        expect(fn({} as never)).toBeUndefined();
    });

    it("rejects an empty field name", () => {
        expect(resolveMarker(`${FUNCTION_MARKER}prop:`)).toEqual({
            error: expect.stringContaining("needs a field name")
        });
    });
});

describe("truncate", () => {
    it("leaves short text alone and shortens long text with an ellipsis", () => {
        const fn = asFn(resolveMarker(`${FUNCTION_MARKER}truncate:5`));
        expect(fn("abc" as never)).toBe("abc");
        expect(fn("abcdefgh" as never)).toBe("abcd…");
    });

    it("coerces non-strings rather than throwing", () => {
        const fn = asFn(resolveMarker(`${FUNCTION_MARKER}truncate:5`));
        expect(fn(undefined as never)).toBe("");
        expect(fn(1234 as never)).toBe("1234");
    });

    it("rejects a limit that is not a positive whole number", () => {
        for (const bad of ["0", "-3", "2.5", "twenty", ""]) {
            expect(resolveMarker(`${FUNCTION_MARKER}truncate:${bad}`)).toEqual({
                error: expect.stringContaining("whole number greater than zero")
            });
        }
    });
});

describe("resolveFunctionMarkers", () => {
    it("replaces markers anywhere in the configuration, at any depth", () => {
        const { configuration, errors } = resolveFunctionMarkers({
            nodeSize: `${FUNCTION_MARKER}prop:size`,
            axisBottom: { format: `${FUNCTION_MARKER}truncate:8`, tickSize: 5 },
            layers: ["grid", `${FUNCTION_MARKER}prop:id`]
        });

        expect(errors).toEqual([]);
        expect(typeof configuration.nodeSize).toBe("function");
        expect(typeof (configuration.axisBottom as Record<string, unknown>).format).toBe("function");
        expect(typeof (configuration.layers as unknown[])[1]).toBe("function");
        // Untouched values survive unchanged.
        expect((configuration.axisBottom as Record<string, unknown>).tickSize).toBe(5);
        expect((configuration.layers as unknown[])[0]).toBe("grid");
    });

    it("reports an unregistered name and leaves the value alone", () => {
        const { configuration, errors } = resolveFunctionMarkers({ nodeSize: `${FUNCTION_MARKER}nope:size` });
        expect(errors).toHaveLength(1);
        expect(errors[0]).toContain("is not a registered function");
        expect(errors[0]).toContain(`${FUNCTION_MARKER}prop:`);
        expect(configuration.nodeSize).toBe(`${FUNCTION_MARKER}nope:size`);
    });

    /*
     * A world feature collection is ~250 KB of nested number arrays. Descending into it can never
     * find a marker and costs real time on every configuration change, so the walk skips numeric
     * arrays — this pins that it still returns them intact.
     */
    it("passes numeric arrays through untouched without descending", () => {
        const coordinates = [
            [
                [61.21, 35.65],
                [62.23, 35.27]
            ]
        ];
        const { configuration, errors } = resolveFunctionMarkers({
            features: [{ id: "AFG", geometry: { coordinates } }],
            nodeSize: `${FUNCTION_MARKER}prop:size`
        });

        expect(errors).toEqual([]);
        expect(typeof configuration.nodeSize).toBe("function");
        const features = configuration.features as Array<Record<string, unknown>>;
        expect((features[0].geometry as Record<string, unknown>).coordinates).toEqual(coordinates);
    });
});

describe("collectFunctionMarkers", () => {
    it("finds every marker so check() can report them before the chart runs", () => {
        expect(
            collectFunctionMarkers({
                nodeSize: `${FUNCTION_MARKER}prop:size`,
                nested: { linkDistance: `${FUNCTION_MARKER}prop:distance` },
                plain: "not a marker"
            })
        ).toEqual([`${FUNCTION_MARKER}prop:size`, `${FUNCTION_MARKER}prop:distance`]);
    });

    it("finds nothing in a configuration that uses none", () => {
        expect(collectFunctionMarkers({ colors: "blues", domain: [0, 100] })).toEqual([]);
    });
});
