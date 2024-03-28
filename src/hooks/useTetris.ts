// Main game controller
// a wrapper around useTetrisBoard
// it also handles user inputs and the game logic like keeping score:
// - the tick-function: it runs periodically
// - commit function: make the falling Block be part of the Board
// - handle key events to control the game (using useEffect)
// - check full rows and count scores and pieces

import { useCallback, useEffect, useState } from "react";
import { getRandomBlock, hasCollisions, useTetrisBoard, BOARD_HEIGHT, BOARD_WIDTH } from "./useTetrisBoard";
import { useInterval } from "./useInterval";
import { Block, BlockShape, BoardShape, EmptyCell, SHAPES } from "../types";

// TickSpeed for the setInterval() - higher value >> slower dropping
export enum TickSpeed {
    Normal = 600,
    Sliding = 100,
    Fast = 50,
    Paused = 60000
}

// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// The main game manager using useTetrisBoard
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~


export function useTetris() {

    const [score, setScore] = useState<number>(0);
    const [pieces, setPieces] = useState<number>(1);
    const [isPlaying, setIsPlaying] = useState<boolean>(false);
    const [tickSpeed, setTickSpeed] = useState<TickSpeed | null>(null);
    const [isCommitting, setIsCommitting] = useState<boolean>(false);
    const [upcomingBlocks, setUpcomingBlocks] = useState<Block[]>([]);

    // the main state manager from useTetrisBoard:
    // - the actual state of board
    // - the actual position of the dropping Block (topleft corner)
    // - the actual Block (the identifier letter, as enum)
    // - the actual shape of the actual Block (the rotated position as a 2dim boolean array)
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

    // Toggle the Pause button >> pause the game = set tickSpeed to 1 hour
    const pauseGame = useCallback(() => {
        if (tickSpeed === TickSpeed.Paused )  setTickSpeed(TickSpeed.Normal);
        else setTickSpeed(TickSpeed.Paused);
    }, [tickSpeed])
    

    // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    // Committing = building the actual Block into the Board...

    const commitPosition = useCallback(() => {

        if ( !hasCollisions(board, droppingShape, droppingRow + 1, droppingColumn) ) {    // if no collision: user avoided collision by interacting
            setIsCommitting(false);
            setTickSpeed(TickSpeed.Normal);
            return;
        }

        // ** if there is a collision: do all the below changes...

        const newBoard = structuredClone(board) as BoardShape;      // deep copy Board

        addShapeToBoard(                                            // build the actual falling Block into it
            newBoard,
            droppingRow,
            droppingColumn,
            droppingBlock,
            droppingShape
        );
                                
        // checking full rows, from bottom to top
        let numCleared = 0;
        for (let row = BOARD_HEIGHT - 1; row >=0; row--) {
            if (newBoard[row].every((entry) => entry !== EmptyCell.Empty)) {    // if no empty cell in a row...
                newBoard.splice(row, 1);                                        // clear it...
                numCleared++;                                                   // score
            }
        }

        // managing the array of upcoming Blocks: get next Block, creating a new one at the end
        const newUpcomingBlocks = structuredClone(upcomingBlocks) as Block[];   // clone the array of upcoming blocks - FIFO
        const newBlock = newUpcomingBlocks.shift() as Block;                   // get next Block out of it (at the beginning)
        newUpcomingBlocks.push( getRandomBlock() );                           // add a new one (at the end)

        // check if the new Block has collisions right at the starting position
        if ( hasCollisions(
                board,
                SHAPES[newBlock].shape,
                0,
                Math.round((BOARD_WIDTH - SHAPES[newBlock].shape.length) / 2))
                ) {
            setIsPlaying(false);
            setTickSpeed(null);
        }

        setUpcomingBlocks(newUpcomingBlocks);
        
        // scoring, normal speed, "commit" action
        setScore((prevScore) => prevScore += getPoints(numCleared));
        setPieces((pieces) => pieces + 1);
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
        if (isCommitting) return commitPosition();                       // commit the falling block to the current position

        if ( hasCollisions(board, droppingShape, droppingRow + 1, droppingColumn)    // check collision for the next row
        ) {
            setTickSpeed(TickSpeed.Sliding);        // collision: make it faster + committing (1 tick more: still a chance for the user to slide the block)
            setIsCommitting(true);
        } else {
            dispatchBoardState({type: 'drop'});     // no collision: drop the actual Block 1 row down
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

    const renderedBoard = structuredClone(board) as BoardShape;     // deep copy

    if (isPlaying) {    // Commit: the Block will be part of the temporary board
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
        pauseGame,
        isPlaying,
        score,
        pieces,
        upcomingBlocks,
        tickSpeed
    };
}

// -- Outer helper functions --

// Commit: the Block will be part of the Board
function addShapeToBoard(
    board: BoardShape,
    droppingRow: number,
    droppingColumn: number,
    droppingBlock: Block,
    droppingShape: BlockShape
) { 
    droppingShape
        .filter((row) => row.some((isSet) => isSet))    // filter out rows with only void cells ("false" in Shape)
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