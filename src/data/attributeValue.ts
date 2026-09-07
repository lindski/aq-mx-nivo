import { Big } from "big.js";

/**
 * The Mendix `AttributeType` values, restated.
 *
 * Restated rather than imported because this file sits in the Mendix-free layer that
 * `scripts/check-layers.mjs` enforces. The adapter passes the type across the boundary as a plain
 * string; only the two branches below actually depend on it.
 */
export type AttributeKind =
    | "AutoNumber"
    | "Binary"
    | "Boolean"
    | "DateTime"
    | "Decimal"
    | "Enum"
    | "EnumSet"
    | "HashString"
    | "Integer"
    | "Long"
    | "ObjectReference"
    | "ObjectReferenceSet"
    | "String";

/**
 * What the adapter reads off one Mendix attribute for one row, flattened to plain data.
 *
 * `displayValue` is Mendix's formatted-for-humans rendering of `value`.
 */
export interface AttributeSnapshot {
    type: AttributeKind | undefined;
    value: string | boolean | Date | Big | undefined;
    displayValue: string | undefined;
}

/**
 * Mendix attribute value -> plain JSON value.
 *
 * This exists for one reason, and it is not tidiness. **Decimal, Integer and Long all arrive as
 * big.js instances**, and big.js defines `toJSON` as `toString`, so a `Big` serialises to the JSON
 * *string* `"3.5"` rather than the number `3.5`. Nivo then builds an **ordinal** scale where a linear
 * one was meant: the axis ticks become evenly spaced labels in row order, the bars all come out the
 * same height, and nothing anywhere reports an error. Verified against big.js directly, not assumed.
 *
 * Precision: `Number()` cannot hold a Long beyond 2^53. That is accepted rather than worked around —
 * a chart pixel is worth far less than an integer ulp, and every downstream Nivo scale is float
 * arithmetic regardless.
 *
 * Dates are deliberately left alone: `Date` has its own `toJSON`, which yields ISO 8601, and that is
 * the form Nivo's time scales parse.
 */
export function toPlainValue(value: string | boolean | Date | Big | undefined): unknown {
    if (value === undefined || value === null) {
        return undefined;
    }
    if (typeof value === "object" && !(value instanceof Date) && "toNumber" in value) {
        return Number(value.toString());
    }
    return value;
}

/**
 * One row's value for one bound attribute, as the chart should see it.
 *
 * **Enumerations are the whole reason this is not just `toPlainValue`.** A Mendix enumeration's
 * `value` is its internal NAME — `InTriage`, `AwaitingApproval` — while the caption the modeller
 * wrote, and every other Mendix widget displays, lives on `displayValue`. Binding an enum column and
 * reading `value` therefore produces a chart whose slices, legend and axis are labelled in the
 * developer's identifiers rather than the user's language. Nothing errors, nothing measures wrong,
 * and it passes every automated gate — `get_dev_standards("pages")` lists it among the four
 * "rendering" traps precisely because only a human reading the screen catches it.
 *
 * A missing value stays missing: an enum with no value yields `undefined`, not the empty string that
 * `displayValue` would give, so the datum is dropped exactly as it is for every other type.
 *
 * **Only `Enum` is special-cased.** Numeric types must NOT take this branch — `displayValue` applies
 * locale formatting, so `1234.5` would arrive as the string `"1,234.5"` and land the chart straight
 * in the ordinal-scale trap `toPlainValue` exists to avoid. Booleans are left alone for a different
 * reason: `displayValue` gives "Yes"/"No", which is no closer to the labels a design actually
 * specifies ("Active"/"Inactive") than `true`/`false` is. That needs an expression, not a formatter.
 */
export function toChartValue(snapshot: AttributeSnapshot): unknown {
    if (snapshot.type === "Enum") {
        return snapshot.value === undefined || snapshot.value === null ? undefined : snapshot.displayValue;
    }
    return toPlainValue(snapshot.value);
}
