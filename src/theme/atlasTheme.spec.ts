import { AtlasTokens } from "./atlasTokens";
import { buildAtlasPalette, buildAtlasTheme, mergeTheme } from "./atlasTheme";

/**
 * These cover the pure half of theming — tokens in, Nivo theme out — which is the half that can be
 * tested at all. Reading the tokens needs a real CSS engine: `getComputedStyle` in jsdom does not
 * evaluate `color-mix()`, and jsdom has no canvas, so a test there would pass against a resolver
 * that does nothing. That half is checked in a browser instead; see docs/known-unverified.md.
 */

const ATLAS: AtlasTokens = {
    "--font-color-default": "rgb(33, 37, 41)",
    "--gray-700": "rgb(108, 117, 125)",
    "--border-color-default": "rgb(206, 208, 211)",
    "--bg-color-secondary": "rgb(255, 255, 255)",
    "--font-family-base": '"Poppins", sans-serif',
    "--font-size-default": "14px",
    "--border-radius-default": "4px",
    "--brand-primary": "rgb(38, 74, 229)",
    "--brand-primary-300": "rgb(148, 165, 242)",
    "--brand-primary-600": "rgb(30, 59, 183)",
    "--brand-success": "rgb(22, 170, 22)",
    "--brand-success-300": "rgb(150, 218, 150)",
    "--brand-success-600": "rgb(18, 136, 18)",
    "--brand-warning": "rgb(205, 133, 1)",
    "--brand-warning-300": "rgb(240, 205, 154)",
    "--brand-warning-500": "rgb(205, 133, 1)",
    "--brand-danger": "rgb(234, 51, 55)",
    "--brand-danger-300": "rgb(246, 173, 175)",
    "--brand-danger-500": "rgb(234, 51, 55)"
};

describe("buildAtlasTheme", () => {
    it("maps the Atlas tokens onto the Nivo theme", () => {
        const theme = buildAtlasTheme(ATLAS);

        expect(theme?.text).toEqual({ fontFamily: '"Poppins", sans-serif', fontSize: 14, fill: "rgb(33, 37, 41)" });
        expect(theme?.axis?.ticks?.text?.fill).toBe("rgb(108, 117, 125)");
        expect(theme?.axis?.domain?.line?.stroke).toBe("rgb(206, 208, 211)");
        expect(theme?.grid?.line?.stroke).toBe("rgb(206, 208, 211)");
        expect(theme?.tooltip?.container).toMatchObject({
            background: "rgb(255, 255, 255)",
            color: "rgb(33, 37, 41)",
            border: "1px solid rgb(206, 208, 211)"
        });
    });

    /*
     * Nivo builds canvas fonts as `${fontSize}px ${fontFamily}`, so a fontSize carrying its own unit
     * produces `14pxpx sans-serif` — silently rejected, and the canvas falls back to a 10px default.
     * SVG would have rendered it correctly and hidden the bug.
     */
    it("gives fontSize as a number, not a CSS length", () => {
        expect(buildAtlasTheme(ATLAS)?.text?.fontSize).toBe(14);
    });

    it("omits a key whose token the host does not declare, rather than guessing one", () => {
        const theme = buildAtlasTheme({ "--font-color-default": "rgb(1, 2, 3)" });

        expect(theme?.text).toEqual({ fill: "rgb(1, 2, 3)" });
        expect(theme?.grid).toBeUndefined();
        expect(theme?.tooltip?.container?.border).toBeUndefined();
    });

    /*
     * `{ fill: undefined }` and `{}` are only equivalent while the consumer skips undefined sources.
     * Nivo's `extendDefaultTheme` does today; relying on that would make this widget correct by
     * someone else's implementation detail.
     */
    it("carries no undefined KEYS through, not merely no undefined values", () => {
        const theme = buildAtlasTheme({ "--font-size-default": "16px" });

        expect(Object.keys(theme?.text ?? {})).toEqual(["fontSize"]);
        expect("fill" in (theme?.text ?? {})).toBe(false);
    });

    it("is undefined when the host is not an Atlas app at all", () => {
        expect(buildAtlasTheme({})).toBeUndefined();
    });
});

describe("buildAtlasPalette", () => {
    it("orders the brand hues first, then the same hues lightened", () => {
        expect(buildAtlasPalette(ATLAS)).toEqual([
            "rgb(30, 59, 183)",
            "rgb(205, 133, 1)",
            "rgb(18, 136, 18)",
            "rgb(234, 51, 55)",
            "rgb(148, 165, 242)",
            "rgb(240, 205, 154)",
            "rgb(150, 218, 150)",
            "rgb(246, 173, 175)"
        ]);
    });

    it("falls back to the base brand colour when the generated shade is missing", () => {
        const palette = buildAtlasPalette({
            "--brand-primary": "#1",
            "--brand-warning": "#2",
            "--brand-success": "#3",
            "--brand-danger": "#4"
        });

        expect(palette).toEqual(["#1", "#2", "#3", "#4"]);
    });

    /*
     * A two-colour cycle across eight series is a chart that misreports its own categories, which is
     * worse than a chart that does not match the app.
     */
    it("produces nothing at all below four colours", () => {
        expect(buildAtlasPalette({ "--brand-primary": "#1", "--brand-warning": "#2" })).toBeUndefined();
        expect(buildAtlasPalette({})).toBeUndefined();
    });
});

describe("mergeTheme", () => {
    it("keeps the Atlas values the override does not mention", () => {
        const merged = mergeTheme(
            { text: { fontFamily: "Poppins", fill: "#111" }, grid: { line: { stroke: "#ccc" } } },
            { text: { fontSize: 16 } }
        );

        expect(merged).toEqual({
            text: { fontFamily: "Poppins", fill: "#111", fontSize: 16 },
            grid: { line: { stroke: "#ccc" } }
        });
    });

    it("lets the override win on a key both declare", () => {
        expect(mergeTheme({ text: { fill: "#111" } }, { text: { fill: "#eee" } })).toEqual({ text: { fill: "#eee" } });
    });

    it("replaces arrays rather than concatenating them", () => {
        expect(mergeTheme({ dash: [1, 2] }, { dash: [9] })).toEqual({ dash: [9] });
    });

    it("takes the override whole when either side is not an object", () => {
        expect(mergeTheme({ text: { fill: "#111" } }, "inherit")).toBe("inherit");
        expect(mergeTheme(undefined, { text: { fill: "#111" } })).toEqual({ text: { fill: "#111" } });
    });
});
