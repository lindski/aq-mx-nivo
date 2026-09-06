import { RefObject, useEffect, useMemo, useState } from "react";

import { AtlasChartTheme, buildAtlasChartTheme } from "./atlasTheme";
import { AtlasTokens, readAtlasTokens, sameTokens } from "./atlasTokens";

/**
 * The app's theme, as a Nivo theme, kept current while the chart is on screen.
 *
 * An Atlas app switches theme by putting a class on the root element — this test app ships
 * `:root.theme-dark` and `:root.theme-neutral` — so the tokens are not read once and kept. They are
 * re-read whenever something happens that could have changed them, and the chart follows a theme
 * switch without a reload.
 *
 * ## Why the comparison matters more than the observer
 *
 * A `MutationObserver` on the root element fires for every class the app touches there, which in a
 * Mendix app is a great many things that have nothing to do with theming. Feeding each of those
 * straight into state would re-render the chart, and Nivo restarts its enter transitions when its
 * props change — so the chart would visibly flicker on unrelated DOM activity, intermittently, with
 * no error anywhere. That is C-02's failure mode reached by a different route, so the guard is the
 * same one: state changes only when a **token value** actually differs.
 */

/** Attributes that can carry a theme. `class` is Atlas's mechanism; the others are conventions. */
const THEME_ATTRIBUTES = ["class", "style", "data-theme"];

export function useAtlasTheme(ref: RefObject<HTMLElement | null>, enabled: boolean): AtlasChartTheme | undefined {
    const [tokens, setTokens] = useState<AtlasTokens | undefined>(undefined);

    useEffect(() => {
        if (!enabled) {
            // Nothing is cleared here on purpose. Turning theming off is expressed by the memo below
            // returning undefined, not by writing state from an effect — which would cost a second
            // render pass to say something the render already knows.
            return;
        }

        const element = ref.current;
        const doc = element?.ownerDocument;
        const view = doc?.defaultView;
        if (!element || !doc || !view) {
            return;
        }

        /*
         * The last read is held here rather than compared against the `tokens` state, so that this
         * effect does not have to depend on it. An effect that re-subscribes every time its own
         * setState lands would tear down and rebuild the observer on each theme change.
         */
        let current: AtlasTokens | undefined;

        const sample = (): void => {
            const next = readAtlasTokens(element);
            if (!sameTokens(current, next)) {
                current = next;
                setTokens(next);
            }
        };

        sample();

        const observer = new view.MutationObserver(sample);
        const observed: Element[] = [doc.documentElement, doc.body].filter(Boolean);
        for (const target of observed) {
            observer.observe(target, { attributes: true, attributeFilter: THEME_ATTRIBUTES });
        }

        /*
         * A theme driven by the OS setting rather than by a class changes no attribute at all, so the
         * observer above would never see it. Optional-chained because `matchMedia` is absent in some
         * embedded webviews, where the media listener is the only part that should be missing.
         */
        const media = view.matchMedia?.("(prefers-color-scheme: dark)");
        media?.addEventListener?.("change", sample);

        return () => {
            observer.disconnect();
            media?.removeEventListener?.("change", sample);
        };
    }, [enabled, ref]);

    return useMemo(() => (enabled && tokens ? buildAtlasChartTheme(tokens) : undefined), [enabled, tokens]);
}
