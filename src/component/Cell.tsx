import { CellOptions } from "../types";

interface Props {
    type: CellOptions;
    extraClass?: string              // for the upcoming blocks UI on the right
}

function Cell({type, extraClass}: Props) {
    return (
        <div className={`cell ${type} ${extraClass}`}></div>
    )
}

export default Cell;