// Main game controller
// a wrapper around useTetrisBoard
// it also handles user inputs and the game logic like keeping score:
// - the tick-function: it runs periodically
// - commit function: make the falling Block as part of the Board
// - handle key events to control the game (using useEffect)
// - checking full rows and counting scores

import { useCallback, useEffect, useState } from "react";
import { getRandomBlock, hasCollisions, useTetrisBoard, BOARD_HEIGHT, BOARD_WIDTH } from "./useTetrisBoard";
import { useInterval } from "./useInterval";
import { Block, BlockShape, BoardShape, EmptyCell, SHAPES } from "../types";

// higher value >> slower dropping
enum TickSpeed {
    Normal = 600,
    Sliding = 100,
    Fast = 50
}

// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// The main game manager using useTetrisBoard
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~



export function useTetris() {

    const [score, setScore] = useState<number>(0);
    const [isPlaying, setIsPlaying] = useState<boolean>(false);
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
                                
        // checking full rows
        let numCleared = 0;
        for (let row = BOARD_HEIGHT - 1; row >=0; row--) {
            if (newBoard[row].every((entry) => entry !== EmptyCell.Empty)) {    // if no empty cell in a row...
                newBoard.splice(row, 1);                                        // clear it...
                numCleared++;                                                   // score
            }
        }

        // managing the array of upcoming Blocks
        const newUpcomingBlocks = structuredClone(upcomingBlocks) as Block[];   // clone the array of upcoming blocks
        const newBlock = newUpcomingBlocks.shift() as Block;                      // get next Block out of it
        newUpcomingBlocks.push( getRandomBlock() );                          // create a new one in the array

        if (hasCollisions(board, SHAPES[newBlock].shape, 0, 3)) {
            setIsPlaying(false);
            setTickSpeed(null);
        }

        setUpcomingBlocks(newUpcomingBlocks);
        
        // scoring, normal speed, "commit" action
        setScore((prevScore) => prevScore += getPoints(numCleared));
        setTickSpeed(TickSpeed.Normal);                             // set normal tick speed back + end of commit phase
        dispatchBoardState({type: "commit", newBoard, newBlock});                       // call "commit" action of state manager
        setIsCommitting(false);
    }, [ board,
        droppingBlock,
        droppingShape,
        droppingRow,
        droppingColumn,
        dispatchBoardState,
        upcomingBlocks ]
    );


    // Keyboard events for moving the actual Block
    useEffect(() => {
        if (!isPlaying) return;

        // ArrowDown >> make dropping fast
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.repeat) return;

            if (event.key === 'ArrowDown') {
                setTickSpeed(TickSpeed.Fast);
            }
            if (event.key === 'ArrowUp') {
                dispatchBoardState({
                    type: 'move',
                    isRotating: true
                });
            }
            if (event.key === 'ArrowLeft') {
                dispatchBoardState({
                    type: 'move',
                    isPressingLeft: true
                });
            }
            if (event.key === 'ArrowRight') {
                dispatchBoardState({
                    type: 'move',
                    isPressingRight: true
                });
            }
        }
        document.addEventListener('keydown', handleKeyDown);

        // ArrowUp >> make dropping normal
        const handleKeyUp = (event: KeyboardEvent) => {
            if (event.key === 'ArrowDown') {
                setTickSpeed(TickSpeed.Normal);
            }
        }
        document.addEventListener('keyup', handleKeyUp);
        
        return () => {
            document.removeEventListener('keydown', handleKeyDown);
            document.removeEventListener('keyup', handleKeyUp);
            setTickSpeed(TickSpeed.Normal);
        };

    }, [isPlaying])


    
    // the function that runs at every tick...
    const gameTick = useCallback(() => {
        if (isCommitting) {
            commitPosition();                       // commit the falling block to the current position
        } else if (
            hasCollisions(board, droppingShape, droppingRow + 1, droppingColumn)    // check collision for the next row
        ) {
            setTickSpeed(TickSpeed.Sliding);        // collision: make it faster + committing (still a chance for the user to slide the block)
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
    
    
    // ~~~~~~~~~~
    // Rendering

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
        isPlaying,
        score,
        upcomingBlocks
    };
}

// -- Outer helper functions --

// Commit: the Block will be a part of the Board
function addShapeToBoard(
    board: BoardShape,
    droppingRow: number,
    droppingColumn: number,
    droppingBlock: Block,
    droppingShape: BlockShape
) { 
    droppingShape
        .filter((row) => row.some((isSet) => isSet))    // sort out rows with only void cells ("false" in Shape)
        .forEach((row: boolean[], rowIndex: number) => {
            row.forEach((isSet: boolean, colIndex: number) => {
                if (isSet) {
                    board[droppingRow + rowIndex][droppingColumn + colIndex] = droppingBlock;
                }
            })

        });
}

// Scoring
function getPoints(numCleared: number): number {
    switch(numCleared) {
        case 0: return 0;
        case 1: return 100;
        case 2: return 300;
        case 3: return 500;
        case 4: return 800;
        default: throw new Error("Unexpected number of rows cleared");
    }
}