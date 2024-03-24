// Main game controller
// a wrapper around useTetrisBoard
// it also handles user inputs and the game logic like keeping score:
// - the tick-function: it runs periodically
// - commit function: make the falling Block as part of the Board

import { useCallback, useState } from "react";
import { getRandomBlock, hasCollisions, useTetrisBoard } from "./useTetrisBoard";
import { useInterval } from "./useInterval";
import { Block, BlockShape, BoardShape } from "../types";

enum TickSpeed {
    Normal = 800,
    Sliding = 100
}

export function useTetris() {

    const [isPlaying, setIsPlaying] = useState(false);
    const [tickSpeed, setTickSpeed] = useState<TickSpeed | null>(null);
    const [isCommitting, setIsCommitting] = useState<boolean>(false);
    const [upcomingBlocks, setUpcomingBlocks] = useState<Block[]>([]);

    // the main state manager from useTetrisBoard
    const [
        {board, droppingRow, droppingColumn, droppingBlock, droppingShape},
        dispatchBoardState
    ] = useTetrisBoard();

    
    // Starting the game...
    const startGame = useCallback(() => {
        const startingBlocks = [
            getRandomBlock(),
            getRandomBlock(),
            getRandomBlock(),
        ];
        setUpcomingBlocks(startingBlocks);
        setIsPlaying(true);
        setTickSpeed(TickSpeed.Normal);
        dispatchBoardState({type: 'start'});
    }, [dispatchBoardState]);
    
    // Committing a Block into the Board...
    const commitPosition = useCallback(() => {
        if ( !hasCollisions(board, droppingShape, droppingRow + 1, droppingColumn) ) {
            setIsCommitting(false);
            setTickSpeed(TickSpeed.Normal);
            return;
        }
        // if no collision:
        const newBoard = structuredClone(board) as BoardShape;      // clone Board
        addShapeToBoard(                                            // add falling Block to it
        newBoard,
        droppingRow,
        droppingColumn,
        droppingBlock,
        droppingShape
        );
        
        const newUpcomingBlocks = structuredClone(upcomingBlocks) as Block[];
        const newBlock = newUpcomingBlocks.pop() as Block;
        newUpcomingBlocks.unshift( getRandomBlock() );
        
        setTickSpeed(TickSpeed.Normal);                             // set normal tick speed back + end of commit phase
        setUpcomingBlocks(newUpcomingBlocks);
        dispatchBoardState({type: "commit", newBoard, newBlock});                       // call "commit" action of state manager
        setIsCommitting(false);
    }, [ board,
        droppingBlock,
        droppingShape,
        droppingRow,
        droppingColumn,
        dispatchBoardState,
        upcomingBlocks ]);
    
    // the function that runs at every tick...
    const gameTick = useCallback(() => {
        if (isCommitting) {
            commitPosition();                       // commit the falling block to the current position
        } else if (
            hasCollisions(board, droppingShape, droppingRow + 1, droppingColumn)    // check collision for the next row
        ) {
            setTickSpeed(TickSpeed.Sliding);        // collision: slowering + committing (still a chance for the user to slide the block)
            setIsCommitting(true);
        } else {
            dispatchBoardState({type: 'drop'});     // no collision: drop forward
        }
    }, [ board,
        commitPosition,
        dispatchBoardState,
        droppingColumn,
        droppingRow,
        droppingShape,
        isCommitting ]);

    // timing the tick-function to run at every tick
    useInterval(() => {
        if (!isPlaying) return;
        gameTick();
    }, tickSpeed);
    

    
    const renderedBoard = structuredClone(board) as BoardShape;

    if (isPlaying) {    // Commit: the Block will be a part of the Board
        addShapeToBoard(
            renderedBoard,
            droppingRow,
            droppingColumn,
            droppingBlock,
            droppingShape
        );
    };



    return {
        board: renderedBoard,
        startGame,
        isPlaying
    };
}

// Commit: the Block will be a part of the Board
function addShapeToBoard(
    board: BoardShape,
    droppingRow: number,
    droppingColumn: number,
    droppingBlock: Block,
    droppingShape: BlockShape
) { 
    droppingShape
        .filter((row) => row.some((isSet) => isSet))
        .forEach((row: boolean[], rowIndex: number) => {
            row.forEach((isSet: boolean, colIndex: number) => {
                if (isSet) {
                    board[droppingRow + rowIndex][droppingColumn + colIndex] = droppingBlock;
                }
            })

        });
}