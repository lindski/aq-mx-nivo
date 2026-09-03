/**
 * The widget's styles, as text, injected at runtime rather than shipped as a `.css` file.
 *
 * Two reasons. The house preference is JS-injected styles, because widgets that ship stylesheets hit
 * asset-path workarounds. And the page-editor preview needs the same CSS from `getPreviewCss()`,
 * which returns a *string* — so keeping it here gives one source of truth instead of a stylesheet and
 * a copy of it that drift apart.
 *
 * 1.x shipped `AqNivo.css` containing a comment and an empty `.widget-hello-world {}` rule — it
 * styled none of the three class names the code actually emitted, so the not-ready and
 * chart-not-found states were zero-height empty elements: invisible failures (R-09, C-05, C-12).
 *
 * Class names are BEM-ish under a single `aq-nivo` block. Sizing lives here; chart layout is Nivo's
 * job, and a CSS override of a library's internals fails silently and visually.
 */
export const AQ_NIVO_CSS = `
.aq-nivo {
    position: relative;
    width: 100%;
    min-width: 0;
}

.aq-nivo__chart {
    width: 100%;
    height: 100%;
}

.aq-nivo__state {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;
    min-height: 4rem;
    padding: 1rem;
    box-sizing: border-box;
    text-align: center;
}

.aq-nivo__state--empty {
    color: var(--gray-primary, #6c7180);
    font-style: italic;
}

.aq-nivo__state--error {
    flex-direction: column;
    gap: 0.5rem;
    color: var(--red, #e33f4e);
    border: 1px dashed currentColor;
    border-radius: 4px;
    background: var(--red-lighter, #fdf2f3);
    font-size: 0.875rem;
    overflow: auto;
}

.aq-nivo__state-detail {
    color: var(--gray-primary, #6c7180);
    font-size: 0.8125rem;
    max-width: 60ch;
    word-break: break-word;
}

/*
 * The loading skeleton. The value arrives AFTER first render, so without this the user sees an empty
 * frame that then silently fills in — which reads as data loss rather than as loading.
 */
.aq-nivo__skeleton {
    width: 100%;
    height: 100%;
    min-height: 4rem;
    border-radius: 4px;
    background: linear-gradient(
        90deg,
        var(--gray-lighter, #f7f8f9) 25%,
        var(--gray-light, #ced0d3) 37%,
        var(--gray-lighter, #f7f8f9) 63%
    );
    background-size: 400% 100%;
    animation: aq-nivo-shimmer 1.4s ease infinite;
}

@keyframes aq-nivo-shimmer {
    0% { background-position: 100% 50%; }
    100% { background-position: 0 50%; }
}

@media (prefers-reduced-motion: reduce) {
    .aq-nivo__skeleton { animation: none; }
}

/* Screen-reader-only text, for the accessible label. */
.aq-nivo__sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
}
`;

const STYLE_ELEMENT_ID = "aq-nivo-styles";

/**
 * Inject the stylesheet once per document.
 *
 * Guarded by id rather than by a module-level boolean: a module-level flag is per *bundle*, and the
 * same widget can legitimately be loaded into more than one document (a popup, a preview frame).
 */
export function ensureStyles(doc: Document | undefined): void {
    if (!doc || doc.getElementById(STYLE_ELEMENT_ID)) {
        return;
    }
    const style = doc.createElement("style");
    style.id = STYLE_ELEMENT_ID;
    style.textContent = AQ_NIVO_CSS;
    doc.head.appendChild(style);
}
