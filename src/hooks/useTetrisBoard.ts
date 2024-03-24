import { useReducer } from "react";
import { Block, BlockShape, BoardShape, EmptyCell, SHAPES } from "../types"

const BOARD_WIDTH = 12;
const BOARD_HEIGHT = 20;

export type BoardState = {
    board: BoardShape;      // actual entire board
    droppingRow: number;    // where is the actual shape: row and column
    droppingColumn: number;
    droppingBlock: Block;   // what is the actual shape (enum)
    droppingShape: BlockShape;  // cell by cell state of the actual shape (even holding rotated position)
}

// The main board manager using useReducer

export function useTetrisBoard(): [BoardState, React.Dispatch<Action>] {

    // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    // The MAIN STATE MANAGER: as useReducer

    const [boardState, dispatchBoardState] = useReducer(
        boardReducer,
        {
            board: [],
            droppingRow: 0,
            droppingColumn: 0,
            droppingBlock: Block.L,
            droppingShape: SHAPES.L.shape
        },
        (emptyState) => {
            const initBlock = getRandomBlock();
            const state = {
                ...emptyState,
                board: getEmptyBoard(),
                droppingBlock: initBlock,
                droppingShape: SHAPES[initBlock].shape
            };
            return state;
        }
    );

    return [boardState, dispatchBoardState];
}

// HELPER FUNCTIONS...

// get the next random Block
export function getRandomBlock(): Block {
    const blockValues = Object.values(Block);
    return blockValues[ Math.floor( Math.random() * blockValues.length ) ] as Block;
}

// Check collision with the board-bottom or -edges
export function hasCollisions(
    board: BoardShape,
    currentShape: BlockShape,
    row: number,
    column: number
    ): boolean {

    let hasCollision = false;
    currentShape
        .filter((shapeRow) => shapeRow.some((isSet) => isSet))
        .forEach((shapeRow: boolean[], rowIndex: number) => {
            shapeRow.forEach((isSet: boolean, colIndex: number) => {
                if (
                    isSet &&                                        // only for Block parts ('true' in Shape)
                    (
                        row + rowIndex >= board.length ||           // tresspassing edges...
                        column + colIndex >= board[0].length ||
                        column + colIndex < 0 ||
                        board[row + rowIndex][column + colIndex] !== EmptyCell.Empty    // overlapping other Blocks
                    )
                ) {
                    hasCollision = true;
                }
            })
        });

    return hasCollision;
}

export function getEmptyBoard(height = BOARD_HEIGHT): BoardShape {
    return Array(height)         // empty 2D array
    .fill(null)
    .map(() => Array(BOARD_WIDTH).fill(EmptyCell.Empty));
}

type Action = {
    type: "start" | "drop" | "commit" | "move",
    newBoard?: BoardShape,
    newBlock?: Block
}

// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// THE REDUCER FUNCTION in the state manager:

function boardReducer(state: BoardState, action: Action): BoardState {

    let newState = {...state};

    switch(action.type) {
        case "start":
            const firstBlock: Block = getRandomBlock();
            return {
                board: getEmptyBoard(),
                droppingRow: 0,
                droppingColumn: 3,
                droppingBlock: firstBlock,
                droppingShape: SHAPES[firstBlock].shape
            }
        case "drop":
            newState.droppingRow++;
            break;
        case "commit":
            return {
                board: action.newBoard as BoardShape,
                droppingRow: 0,
                droppingColumn: 3,
                droppingBlock: action.newBlock!,
                droppingShape: SHAPES[action.newBlock!].shape
            }
        case "move":
        default:
            const unhandledType: never | string = action.type;
            throw new Error(`Unhandled action type: ${unhandledType}`);
    }

    return newState;
}