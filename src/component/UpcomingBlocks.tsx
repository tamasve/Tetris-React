import Board from "./Board";
import { Block, BoardShape, EmptyCell, SHAPES } from "../types";

interface Props {
    upcomingBlocks: Block[]
}

export default function UpcomingBlocks({upcomingBlocks}: Props) {

    return (
        <div className="upcoming">
            <span>{"<<"}</span>
            {upcomingBlocks.map((block: Block, blockIndex: number) => {
                const boardShape: BoardShape = SHAPES[block].shape
                    .filter((row) => row.some((isSet) => isSet))
                    .map((row: boolean[], rowIndex: number) => 
                        row.map((cell) => cell ? Block[block] : EmptyCell.Empty));
                return (
                    <Board currentBoard={boardShape} extraClass="hideEmpty" key={blockIndex}/>
                )
            })}

        </div>
    );
}