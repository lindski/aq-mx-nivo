/**
 * Named functions, referenced from JSON configuration by marker.
 *
 * ## Why this exists
 *
 * Some Nivo properties genuinely require a function. Until 0.99 several of them also accepted a
 * **string naming a field** — `"nodeSize": "size"` meant "read `size` off each node". 0.99 removed
 * that, and the removal is silent: the string is passed through as a value, used as a number, and
 * the chart renders NaN coordinates while reporting nothing. That cost this project a broken Network
 * chart and 138 console errors.
 *
 * The obvious replacement is a JavaScript body, which the widget already supports through the
 * `functionProperties` object list. But that is **design-time only**, and deliberately so: the same
 * JavaScript arriving through the dynamic configuration would be code from a database column,
 * executing in every viewer's browser. So a runtime chart — the playground, or any chart whose
 * configuration is user-authored — cannot use it.
 *
 * This registry is the middle ground. Configuration references a function **by name**:
 *
 * ```json
 * { "nodeSize": "@fn:prop:size", "linkDistance": "@fn:prop:distance" }
 * ```
 *
 * It is runtime-capable, needs no `new Function`, and therefore no `unsafe-eval` in the page's
 * Content-Security-Policy. A name that is not registered cannot become arbitrary code; the worst a
 * malicious configuration can do is name something that does not exist, which is reported.
 *
 * ## What is NOT here, on purpose
 *
 * Formatting. At 0.99 `valueFormat` and axis `format` take a **d3-format string** directly, and
 * colour takes `{"scheme":"…"}`, an explicit palette, or `{"datum":"…"}`. Those need no function at
 * all, and duplicating them here would give two ways to do one thing. See the `Configuration
 * (dynamic)` property description.
 *
 * So the registry covers the gap Layer 0 cannot: reading a value off the datum, which is precisely
 * what 0.99 took away.
 */

/** The prefix that marks a configuration string as a function reference. */
export const FUNCTION_MARKER = "@fn:";

export type RegisteredFunction = (...args: never[]) => unknown;

type Factory = (argument: string) => RegisteredFunction | { error: string };

/**
 * Read a value off the datum, by dotted path.
 *
 * This is the direct replacement for the string-accessor form 0.99 removed, and the reason the
 * registry earns its place: `"@fn:prop:size"` is what `"size"` used to mean.
 */
const propFactory: Factory = path => {
    const segments = path.split(".").filter(segment => segment.length > 0);

    if (segments.length === 0) {
        return { error: `"${FUNCTION_MARKER}prop:" needs a field name, e.g. "${FUNCTION_MARKER}prop:size".` };
    }

    return ((datum: unknown) =>
        segments.reduce<unknown>(
            (value, segment) =>
                value === null || value === undefined ? undefined : (value as Record<string, unknown>)[segment],
            datum
        )) as RegisteredFunction;
};

/**
 * Shorten a label, so a long category name does not overrun its slice.
 *
 * Included because it is the one formatting need d3-format genuinely cannot express — d3 formats
 * numbers, and this is about the width of a string.
 */
const truncateFactory: Factory = argument => {
    const limit = Number(argument);

    if (!Number.isInteger(limit) || limit < 1) {
        return {
            error: `"${FUNCTION_MARKER}truncate:" needs a whole number greater than zero, e.g. "${FUNCTION_MARKER}truncate:20". Received "${argument}".`
        };
    }

    return ((value: unknown) => {
        const text = String(value ?? "");
        return text.length <= limit ? text : `${text.slice(0, limit - 1)}…`;
    }) as RegisteredFunction;
};

const REGISTRY: Record<string, Factory> = {
    prop: propFactory,
    truncate: truncateFactory
};

/** The registered names, for error messages and for the design-time check. */
export const REGISTERED_FUNCTION_NAMES = Object.keys(REGISTRY).sort();

export interface MarkerResolution {
    configuration: Record<string, unknown>;
    errors: string[];
}

/**
 * Whether to descend into an array.
 *
 * GeoJSON coordinates are arrays of numbers nested several levels deep, and a world feature
 * collection is around 250 KB. Walking it element by element costs real time on every configuration
 * change and can never find a marker, because a marker is a string.
 */
function worthWalking(value: unknown[]): boolean {
    return value.length === 0 || typeof value[0] !== "number";
}

/** Every function marker in a configuration object, in document order. Used by `check()`. */
export function collectFunctionMarkers(configuration: Record<string, unknown>): string[] {
    const found: string[] = [];

    const walk = (value: unknown): void => {
        if (isFunctionMarker(value)) {
            found.push(value);
        } else if (Array.isArray(value)) {
            if (worthWalking(value)) {
                value.forEach(walk);
            }
        } else if (value !== null && typeof value === "object") {
            Object.values(value as Record<string, unknown>).forEach(walk);
        }
    };

    walk(configuration);
    return found;
}

/** Whether a value is a function marker. Exported so `check()` can find them without resolving. */
export function isFunctionMarker(value: unknown): value is string {
    return typeof value === "string" && value.startsWith(FUNCTION_MARKER);
}

/**
 * Resolve one marker, or explain why it cannot be.
 *
 * Exported for the design-time check, which reports the same message before the chart ever runs.
 */
export function resolveMarker(marker: string): RegisteredFunction | { error: string } {
    const body = marker.slice(FUNCTION_MARKER.length);
    const separator = body.indexOf(":");
    const name = separator === -1 ? body : body.slice(0, separator);
    const argument = separator === -1 ? "" : body.slice(separator + 1);

    const factory = REGISTRY[name];

    if (!factory) {
        return {
            error: `"${marker}" is not a registered function. Available: ${REGISTERED_FUNCTION_NAMES.map(
                n => `${FUNCTION_MARKER}${n}:…`
            ).join(", ")}.`
        };
    }

    return factory(argument);
}

/**
 * Replace every function marker in a configuration object with the function it names.
 *
 * An unresolvable marker is an **error**, not a warning, and the chart does not draw. That is
 * deliberately stricter than a failed `functionProperties` body, which costs only its own property:
 * a body is code that can fail for data reasons at runtime, whereas a marker is a declarative
 * reference that is either spelled correctly or is not. Leaving an unresolved marker in place would
 * hand Nivo the literal string `"@fn:prop:size"` as a size — reproducing exactly the silent failure
 * this registry exists to prevent.
 */
export function resolveFunctionMarkers(configuration: Record<string, unknown>): MarkerResolution {
    const errors: string[] = [];

    const walk = (value: unknown): unknown => {
        if (isFunctionMarker(value)) {
            const resolved = resolveMarker(value);
            if (typeof resolved === "function") {
                return resolved;
            }
            errors.push(resolved.error);
            return value;
        }

        if (Array.isArray(value)) {
            return worthWalking(value) ? value.map(walk) : value;
        }

        if (value !== null && typeof value === "object") {
            const result: Record<string, unknown> = {};
            for (const [key, nested] of Object.entries(value as Record<string, unknown>)) {
                result[key] = walk(nested);
            }
            return result;
        }

        return value;
    };

    return { configuration: walk(configuration) as Record<string, unknown>, errors };
}
