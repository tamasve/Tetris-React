import { useReducer } from "react";
import { Block, BlockShape, BoardShape, EmptyCell, SHAPES } from "../types"

export const BOARD_WIDTH = 12;
export const BOARD_HEIGHT = 20;

export type BoardState = {
    board: BoardShape;      // actual entire board
    droppingRow: number;    // where is the actual shape: row and column
    droppingColumn: number;
    droppingBlock: Block;   // what is the actual shape (enum)
    droppingShape: BlockShape;  // cell by cell state of the actual shape (even holding rotated position)
}

// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// The core state manager using useReducer
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

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

// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

// HELPER FUNCTIONS...

// get the next random Block
export function getRandomBlock(): Block {
    const blockValues = Object.values(Block);
    return blockValues[ Math.floor( Math.random() * blockValues.length ) ] as Block;
}

// create an empty 2D array
export function getEmptyBoard(height = BOARD_HEIGHT): BoardShape {
    return Array(height)
    .fill(null)
    .map(() => Array(BOARD_WIDTH).fill(EmptyCell.Empty));
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


// Rotate Shape right
function rotateBlock(shape: BlockShape): BlockShape {
    const rows = shape.length;
    const columns = shape[0].length;

    const rotated = Array(rows)         // a new void array of the same dimensions as 'shape'
        .fill(null)
        .map(() => Array(columns).fill(false));

    for (let row = 0; row < rows; row++) {
        for (let column = 0; column < columns; column++) {
            rotated[column][rows - 1 - row] = shape[row][column];   // rotate right
        }
    }
    
    return rotated;
}


// Action: the actions of the Reducer, and the optional parameters (only used by some actions but not all)

type Action = {
    type: "start" | "drop" | "commit" | "move",
    newBoard?: BoardShape,
    newBlock?: Block,
    isPressingLeft?: boolean,
    isPressingRight?: boolean,
    isRotating?: boolean
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
                droppingColumn: Math.round((BOARD_WIDTH - SHAPES[firstBlock].shape.length) / 2),    // start dropping in the middle
                droppingBlock: firstBlock,
                droppingShape: SHAPES[firstBlock].shape
            }
        case "drop":
            newState.droppingRow++;
            break;
        case "commit":
            return {
                board: [   // insert a new empty row on the top for every cleared one
                    ...getEmptyBoard(BOARD_HEIGHT - action.newBoard!.length),
                    ...action.newBoard!
                ],
                droppingRow: 0,
                droppingColumn: Math.round((BOARD_WIDTH - SHAPES[action.newBlock!].shape.length) / 2),    // start drop in the middle
                droppingBlock: action.newBlock!,
                droppingShape: SHAPES[action.newBlock!].shape
            }
        case "move":
            const rotatedShape = action.isRotating      // rotate if necessary
                ? rotateBlock(newState.droppingShape)
                : newState.droppingShape;

            let columnOffset = action.isPressingLeft ? -1 : 0;  // column offset if necessary
            columnOffset = action.isPressingRight ? 1 : columnOffset;

            if (!hasCollisions(                         // check collision in the new position / of the new rotation
                newState.board,
                rotatedShape,
                newState.droppingRow,
                newState.droppingColumn + columnOffset
            )) {
                newState.droppingColumn += columnOffset;    // rotation and move only take effect if they does not cause collision
                newState.droppingShape = rotatedShape;
            }
            break;
        default:
            const unhandledType: never | string = action.type;
            throw new Error(`Unhandled action type: ${unhandledType}`);
    }

    return newState;
}