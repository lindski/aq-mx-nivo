import { ReactElement, createElement } from "react";
import { AqNivoPreviewProps } from "../typings/AqNivoProps";

export function preview({ chartType }: AqNivoPreviewProps): ReactElement {
    return <div>{chartType}</div>;
}

export function getPreviewCss(): string {
    return require("./ui/AqNivo.css");
}
