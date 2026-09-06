/**
 * Reading the app's own theme out of the DOM.
 *
 * Atlas 3 is a CSS custom property theme: `--brand-primary`, `--gray-900`, `--font-color-default`,
 * `--font-family-base` and several hundred more are declared on `:root`, and an app switches theme
 * by putting a class on the root element (`:root.theme-dark`) which redeclares them. That is the
 * whole reason P-11 derives a Nivo theme at runtime rather than taking one as configuration: a
 * configuration block is a copy of the app's design decisions that goes stale, and it cannot follow
 * a theme the user switches while the chart is on screen.
 *
 * ## The trap: a custom property's computed value is not a colour
 *
 * Atlas builds its shades with `color-mix()`:
 *
 *     --brand-primary-600: color-mix(in srgb, var(--brand-primary), var(--color-contrast) 20%);
 *
 * A custom property is *unregistered*, so its computed value is the token stream with `var()`
 * substituted and **nothing else evaluated**. `getComputedStyle(el).getPropertyValue()` therefore
 * hands back the literal string `color-mix(in srgb, #264ae5, rgb(0, 0, 0) 20%)`.
 *
 * That string is not usable as a Nivo colour. Nivo derives label, border and hover colours from the
 * ones it is given using d3-color (`inheritedColor`'s `darker` / `brighter` modifiers), and
 * d3-color's parser understands `rgb()`, `hsl()` and hex — it returns `null` for `color-mix()`, and
 * for the `color(srgb ...)` form the browser produces when it *does* evaluate one. A null there does
 * not throw where you would see it; it produces an invisible label or an uncoloured border.
 *
 * So every colour token is resolved to a plain `rgb()` / `rgba()` in two steps:
 *
 *   1. **Let the CSS engine evaluate it** — assign the raw value to a probe element's `color` and
 *      read the computed `color` back. This handles `color-mix()`, `oklch()`, named colours and
 *      anything else the browser supports, and rejects what it does not: the assignment is a no-op,
 *      so the property stays empty.
 *   2. **Normalise to channels** — paint one pixel of a 1x1 canvas with the result and read it back.
 *      The browser's own serialisation of step 1 is not guaranteed to be `rgb()`: Chrome returns
 *      `color(srgb 0.15 0.29 0.9)` for an evaluated `color-mix(in srgb, ...)`, which is exactly the
 *      form d3-color cannot parse. A pixel is a pixel.
 *
 * Step 2 is skipped where there is no canvas (a test environment), and the computed string is used
 * as-is — correct for the common `rgb()` case and no worse than not theming at all.
 *
 * Nothing here imports Mendix, and nothing here is Nivo-specific: this file turns a DOM into a bag
 * of resolved strings. `atlasTheme.ts` decides what they mean.
 */

/**
 * The colour tokens read from the host.
 *
 * Deliberately a short list. Every token here has a job in `atlasTheme.ts`; a token read "because it
 * might be useful" is a computed style read on every theme change for nothing.
 */
export const ATLAS_COLOR_TOKENS = [
    "--font-color-default",
    "--gray-700",
    "--border-color-default",
    "--bg-color-secondary",
    "--brand-primary",
    "--brand-primary-300",
    "--brand-primary-600",
    "--brand-success",
    "--brand-success-300",
    "--brand-success-600",
    "--brand-warning",
    "--brand-warning-300",
    "--brand-warning-500",
    "--brand-danger",
    "--brand-danger-300",
    "--brand-danger-500"
] as const;

/** Tokens taken verbatim. A font stack is a font stack; there is nothing to resolve. */
export const ATLAS_VALUE_TOKENS = ["--font-family-base"] as const;

/**
 * Tokens resolved to **pixels**, for the same reason the colours are resolved to channels.
 *
 * `--font-size-default` is `14px` in stock Atlas but nothing obliges it to be: an app may set it in
 * `rem`, `pt` or a `clamp()`. Nivo's Canvas renderers build a font string as
 * `` `${fontSize}px ${fontFamily}` ``, so anything carrying its own unit produces `14pxpx sans-serif`
 * — which the canvas silently rejects and replaces with its default 10px font. SVG is more forgiving
 * and would have hidden it. Running the value through the browser's own length resolution gives a
 * number that is right in both renderers.
 */
export const ATLAS_LENGTH_TOKENS = ["--font-size-default", "--border-radius-default"] as const;

export type AtlasTokenName =
    | (typeof ATLAS_COLOR_TOKENS)[number]
    | (typeof ATLAS_VALUE_TOKENS)[number]
    | (typeof ATLAS_LENGTH_TOKENS)[number];

/** Resolved token values. A token the host does not declare is simply absent. */
export type AtlasTokens = Partial<Record<AtlasTokenName, string>>;

/**
 * Read and resolve the Atlas tokens as they apply to `element`.
 *
 * Read from the widget's own element rather than from `:root`, so a theme scoped to part of the page
 * — a dark panel on a light page — themes the charts inside it and nothing else. Custom properties
 * inherit, so reading from here gets the root's values when nothing overrides them.
 */
export function readAtlasTokens(element: Element): AtlasTokens {
    const view = element.ownerDocument?.defaultView;
    if (!view) {
        return {};
    }

    const declaration = view.getComputedStyle(element);
    const raw = (name: string): string => declaration.getPropertyValue(name).trim();

    const tokens: AtlasTokens = {};

    for (const name of ATLAS_VALUE_TOKENS) {
        const value = raw(name);
        if (value) {
            tokens[name] = value;
        }
    }

    const probe = createProbe(element);
    try {
        for (const name of ATLAS_COLOR_TOKENS) {
            const value = probe.color(raw(name));
            if (value) {
                tokens[name] = value;
            }
        }
        for (const name of ATLAS_LENGTH_TOKENS) {
            const value = probe.length(raw(name));
            if (value) {
                tokens[name] = value;
            }
        }
    } finally {
        probe.dispose();
    }

    return tokens;
}

/** Whether two token reads are the same, so an unrelated DOM mutation cannot re-render the chart. */
export function sameTokens(a: AtlasTokens | undefined, b: AtlasTokens | undefined): boolean {
    if (a === b) {
        return true;
    }
    if (!a || !b) {
        return false;
    }
    const names: readonly AtlasTokenName[] = [...ATLAS_COLOR_TOKENS, ...ATLAS_VALUE_TOKENS, ...ATLAS_LENGTH_TOKENS];
    return names.every(name => a[name] === b[name]);
}

interface Probe {
    /** A CSS colour of any syntax the browser accepts, as `rgb()` / `rgba()`. */
    color(raw: string): string | undefined;
    /** A CSS length of any unit, in pixels — `"14px"`. */
    length(raw: string): string | undefined;
    dispose(): void;
}

/**
 * A reusable probe for one batch of tokens.
 *
 * One element and one canvas for the whole read rather than one per token: this runs on every theme
 * change, and creating sixteen elements to ask sixteen questions is the kind of cost that never
 * shows up in a profile because it is spread across a class of widget rather than concentrated in
 * one place.
 *
 * The probe is appended next to `element` — inside the same document, and under the same theme scope
 * — because a detached element has no guaranteed computed style. `display: none` is enough to keep
 * it out of layout; `color` is an inherited property and is computed regardless.
 */
function createProbe(element: Element): Probe {
    const doc = element.ownerDocument;
    const span = doc.createElement("span");
    span.setAttribute("aria-hidden", "true");
    span.style.display = "none";
    (element.parentNode ?? doc.body ?? doc.documentElement).appendChild(span);

    const context = createPixelContext(doc);
    const computed = (): CSSStyleDeclaration | undefined => doc.defaultView?.getComputedStyle(span);

    return {
        color(raw: string): string | undefined {
            if (!raw) {
                return undefined;
            }

            // An unsupported value leaves the property untouched, which is how an unparseable token
            // is told apart from one the browser understood.
            span.style.color = "";
            span.style.color = raw;
            if (!span.style.color) {
                return undefined;
            }

            const value = computed()?.color;
            return value ? toRgbString(value, context) ?? value : undefined;
        },

        length(raw: string): string | undefined {
            if (!raw) {
                return undefined;
            }

            // `fontSize` is the vehicle because it is the one length the CSS engine always resolves
            // to an absolute px value on the computed style, whatever unit it was written in.
            span.style.fontSize = "";
            span.style.fontSize = raw;
            if (!span.style.fontSize) {
                return undefined;
            }

            const value = computed()?.fontSize;
            return value && value.endsWith("px") ? value : undefined;
        },

        dispose(): void {
            span.remove();
        }
    };
}

function createPixelContext(doc: Document): CanvasRenderingContext2D | undefined {
    try {
        const canvas = doc.createElement("canvas");
        canvas.width = 1;
        canvas.height = 1;
        return canvas.getContext("2d", { willReadFrequently: true }) ?? undefined;
    } catch {
        // No canvas — a test environment, or a browser refusing one. The computed string is used
        // instead, which is already correct for every value the browser serialises as `rgb()`.
        return undefined;
    }
}

/**
 * One pixel of the colour, read back as `rgb()` / `rgba()`.
 *
 * `ctx.fillStyle` is not enough on its own: its getter round-trips modern colour syntaxes unchanged,
 * so `color(srgb ...)` in gives `color(srgb ...)` out and d3-color is no better off. Painting and
 * sampling is what turns any accepted syntax into channels.
 */
function toRgbString(color: string, context: CanvasRenderingContext2D | undefined): string | undefined {
    if (!context) {
        return undefined;
    }

    try {
        context.clearRect(0, 0, 1, 1);
        context.fillStyle = "#000";
        context.fillStyle = color;
        context.fillRect(0, 0, 1, 1);

        const [r, g, b, a] = context.getImageData(0, 0, 1, 1).data;
        return a === 255 ? `rgb(${r}, ${g}, ${b})` : `rgba(${r}, ${g}, ${b}, ${round(a / 255)})`;
    } catch {
        return undefined;
    }
}

function round(value: number): number {
    return Math.round(value * 1000) / 1000;
}
