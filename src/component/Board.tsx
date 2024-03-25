import Cell from "./Cell";
import { BoardShape } from "../types";


interface Props {
    currentBoard: BoardShape;
    extraClass?: string         // for the upcoming blocks UI on the right
}

function Board({currentBoard, extraClass}: Props) {

    return (
        <div className={`board ${extraClass}`}>
            {currentBoard.map((row, rowIndex) => (
                <div className="row" key={rowIndex}>
                    {row.map((cell, colIndex) => (
                        <Cell key={`${rowIndex}-${colIndex}`} type={cell} extraClass={extraClass} />
                    ))}
                </div>
            ))}

        </div>
    );

}

export default Board;