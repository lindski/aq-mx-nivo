import { parseConfiguration } from "../data/parseJson";
import { compileFunctionProperties, FunctionPropertyDefinition } from "./functionProps";
import { resolveFunctionMarkers } from "./functionRegistry";

/**
 * The static -> dynamic -> function configuration merge.
 *
 * The precedence is 1.x's and it is a good design, kept deliberately: static configuration is what
 * you type into the widget, dynamic configuration is what the app computes at runtime, and function
 * properties are the things JSON cannot express. Later wins, so the runtime can override the design
 * time and a function can override both.
 *
 * What changes at 2.0 is that it cannot throw and it does not rebuild the world on every render. The
 * merge is shallow, and deliberately so: a deep merge would make it impossible to *remove* a nested
 * default from a lower layer, and "my axis config is being half-overridden" is a much worse failure
 * to debug than "my axis config replaced theirs".
 */

export interface MergeInput {
    staticConfiguration?: string;
    dynamicConfiguration?: string;
    functionProperties?: readonly FunctionPropertyDefinition[];
}

export interface MergedConfiguration {
    configuration: Record<string, unknown>;
    /** Non-fatal problems — a bad function body costs its own property, not the chart. */
    warnings: string[];
    /** Fatal problems — configuration that could not be understood at all. */
    errors: string[];
}

export function mergeConfiguration(input: MergeInput): MergedConfiguration {
    const warnings: string[] = [];
    const errors: string[] = [];

    const staticResult = parseConfiguration(input.staticConfiguration, "Static configuration");
    if (!staticResult.ok) {
        errors.push(staticResult.error);
    }

    const dynamicResult = parseConfiguration(input.dynamicConfiguration, "Dynamic configuration");
    if (!dynamicResult.ok) {
        errors.push(dynamicResult.error);
    }

    const functions = compileFunctionProperties(input.functionProperties);
    warnings.push(...functions.errors);

    /*
     * Named function markers are resolved AFTER the JSON layers are merged and BEFORE function
     * properties are applied.
     *
     * After the merge, because a marker set in the static configuration must be overridable by the
     * dynamic one — resolving each layer separately would turn a plain string into a function before
     * the layer above had a chance to replace it, and a function cannot be compared or overwritten
     * as cleanly as the string it came from.
     *
     * Before function properties, because those are the escape hatch and must keep winning: a
     * hand-written body should override a named function on the same key, not the other way round.
     */
    const merged = {
        ...(staticResult.ok ? staticResult.value : {}),
        ...(dynamicResult.ok ? dynamicResult.value : {})
    };

    const resolved = resolveFunctionMarkers(merged);
    errors.push(...resolved.errors);

    return {
        configuration: {
            ...resolved.configuration,
            ...functions.values
        },
        warnings,
        errors
    };
}

/**
 * A stable cache key for a merge input.
 *
 * This is what the adapter memoises on. Keying on the raw *strings* rather than on the parsed result
 * is the whole point: Mendix hands out new prop object instances freely, so an identity comparison
 * re-parses on every render even when nothing changed, and Nivo then re-runs its transitions against
 * what it sees as new props. An identical string must reconfigure nothing.
 */
export function mergeCacheKey(input: MergeInput): string {
    return JSON.stringify([
        input.staticConfiguration ?? null,
        input.dynamicConfiguration ?? null,
        (input.functionProperties ?? []).map(f => [f.propertyName, f.functionArguments, f.functionBody])
    ]);
}
