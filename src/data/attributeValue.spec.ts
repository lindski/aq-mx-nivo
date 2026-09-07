import { Big } from "big.js";

import { AttributeSnapshot, toChartValue, toPlainValue } from "./attributeValue";

const snapshot = (partial: Partial<AttributeSnapshot>): AttributeSnapshot => ({
    type: "String",
    value: undefined,
    displayValue: undefined,
    ...partial
});

describe("toChartValue — enumerations", () => {
    /*
     * The defect this module was extracted for. A Mendix enumeration's `value` is the internal name;
     * the caption the modeller wrote is on `displayValue`. Reading `value` labels a chart in the
     * developer's identifiers, passes every automated gate, and is caught only by reading the screen.
     */
    it("uses the caption, not the internal name", () => {
        expect(toChartValue(snapshot({ type: "Enum", value: "InTriage", displayValue: "In triage" }))).toBe(
            "In triage"
        );
    });

    it("does not fall back to the internal name when a caption is absent", () => {
        // Mendix always supplies a displayValue; an empty one means the caption is genuinely blank,
        // and echoing the identifier instead would reintroduce exactly what this fixes.
        expect(toChartValue(snapshot({ type: "Enum", value: "InTriage", displayValue: "" }))).toBe("");
    });

    it("treats a missing enum value as a missing datum, not an empty label", () => {
        expect(toChartValue(snapshot({ type: "Enum", value: undefined, displayValue: "" }))).toBeUndefined();
    });
});

describe("toChartValue — the types that must NOT take the caption branch", () => {
    /*
     * displayValue applies locale formatting, so a Decimal would arrive as the string "1,234.5" and
     * put the chart straight into the ordinal-scale trap toPlainValue exists to avoid.
     */
    it.each(["Decimal", "Integer", "Long"] as const)("%s stays a number", type => {
        const result = toChartValue(snapshot({ type, value: new Big("1234.5"), displayValue: "1,234.5" }));
        expect(result).toBe(1234.5);
        expect(typeof result).toBe("number");
    });

    it("Boolean stays a boolean rather than becoming Yes/No", () => {
        expect(toChartValue(snapshot({ type: "Boolean", value: false, displayValue: "No" }))).toBe(false);
    });

    it("String passes through untouched", () => {
        expect(toChartValue(snapshot({ type: "String", value: "Motor", displayValue: "Motor" }))).toBe("Motor");
    });

    it("DateTime keeps the Date, whose own toJSON yields the ISO form Nivo parses", () => {
        const date = new Date("2026-09-07T00:00:00.000Z");
        expect(toChartValue(snapshot({ type: "DateTime", value: date, displayValue: "9/7/2026" }))).toBe(date);
    });

    it("a missing value is undefined whatever the type", () => {
        expect(toChartValue(snapshot({ type: "String", value: undefined }))).toBeUndefined();
    });

    it("an unknown attribute type falls back to the plain value", () => {
        expect(toChartValue(snapshot({ type: undefined, value: "raw" }))).toBe("raw");
    });
});

describe("toPlainValue", () => {
    it("converts big.js values to numbers, because Big.toJSON is toString", () => {
        expect(toPlainValue(new Big("3.5"))).toBe(3.5);
        expect(JSON.stringify({ v: toPlainValue(new Big("3.5")) })).toBe('{"v":3.5}');
    });

    it("leaves a Date alone", () => {
        const date = new Date("2026-09-07T00:00:00.000Z");
        expect(toPlainValue(date)).toBe(date);
    });

    it("returns undefined for undefined", () => {
        expect(toPlainValue(undefined)).toBeUndefined();
    });
});
