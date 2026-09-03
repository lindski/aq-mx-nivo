import { Component, ReactElement, ReactNode } from "react";

/**
 * The last line of defence between Nivo and the page.
 *
 * Everything this widget controls is guarded — JSON is parsed safely, shapes are checked, function
 * bodies are compiled defensively. What remains is Nivo itself throwing on a payload that is
 * structurally valid but wrong for the chart: a Sankey with a link naming a node that does not
 * exist, a Bar with a `keys` entry absent from the data. Those throw several frames inside Nivo.
 *
 * Without a boundary that throw escapes into the Mendix client's render pass and takes down the
 * whole page — every other widget on it included. A chart that cannot draw should cost the chart.
 *
 * A class component because React error boundaries have no hook equivalent; `componentDidCatch` and
 * `getDerivedStateFromError` are only available this way.
 */

interface Props {
    children: ReactNode;
    /** Rendered instead of the children once a render has thrown. */
    fallback: (message: string) => ReactElement;
    /**
     * Changing this resets the boundary. Pass something derived from the inputs — otherwise a chart
     * that threw once stays broken for the life of the page even after the data is corrected.
     */
    resetKey: string;
}

interface State {
    message?: string;
    resetKey: string;
}

export class ChartErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { resetKey: props.resetKey };
    }

    render(): ReactNode {
        return this.state.message === undefined ? this.props.children : this.props.fallback(this.state.message);
    }

    /*
     * There is deliberately no `componentDidCatch`. Its only use here would be to log, and logging
     * from shipped source is what check-layers rule 7 exists to stop — 1.x wrote whole datasets to
     * the console on every render. The message reaches the person who needs it through `fallback`,
     * rendered where the chart would have been.
     */
    static getDerivedStateFromError(error: unknown): Partial<State> {
        return { message: error instanceof Error ? error.message : String(error) };
    }

    /*
     * Resets the boundary when its inputs change. Without this a chart that threw once stays broken
     * for the life of the page, even after the data that broke it has been corrected.
     */
    static getDerivedStateFromProps(props: Props, state: State): Partial<State> | null {
        return props.resetKey !== state.resetKey ? { message: undefined, resetKey: props.resetKey } : null;
    }
}
