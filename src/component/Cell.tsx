import { CellOptions } from "../types";

interface Props {
    type: CellOptions;
}

function Cell({type}: Props) {
    return (
        <div className={`cell ${type}`}></div>
    )
}

export default Cell;